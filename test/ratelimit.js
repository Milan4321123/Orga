/* Verifies the abuse protections on a server deliberately configured with a
   tiny limit, so the behaviour is proven rather than assumed. */
"use strict";
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

function post(port, urlPath, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({ host: "127.0.0.1", port, path: urlPath, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      res => { let raw = ""; res.on("data", c => (raw += c)); res.on("end", () => resolve({ status: res.statusCode, raw })); });

    /* Refusing an oversized body means destroying the connection, so the
       client sees EPIPE or ECONNRESET. That is a valid refusal, not a test
       failure — and the socket needs its own listener, otherwise a late
       error arrives after the request object is done and crashes the run. */
    let settled = false;
    const done = (status) => { if (!settled) { settled = true; resolve({ status, raw: "" }); } };
    req.on("error", (e) => done(e.code === "EPIPE" || e.code === "ECONNRESET" ? 0 : -1));
    req.on("socket", (socket) => socket.on("error", () => done(0)));
    req.write(data);
    req.end();
  });
}
function wait(port, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    (function attempt() {
      const r = http.get({ host: "127.0.0.1", port, path: "/api/content" }, res => { res.resume(); resolve(); });
      r.on("error", () => (Date.now() > deadline ? reject(new Error("no start")) : setTimeout(attempt, 100)));
    })();
  });
}

module.exports = async function run(port) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-rl-"));
  const server = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
    cwd: ROOT, stdio: "ignore",
    env: Object.assign({}, process.env, {
      PORT: String(port), NPJOE_DATA_DIR: dir,
      NPJOE_ADMIN_PASSWORD: "rl-test", NPJOE_RATE_LIMIT: "3"
    })
  });

  group("Abuse protection actually blocks");
  try {
    await wait(port, 6000);
    const msg = { name: "Flood", email: "f@example.com", nachricht: "Immer wieder dieselbe Nachricht." };
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await post(port, "/api/contact", msg)).status);
    eq("the first three submissions pass, the rest are throttled", codes, [200, 200, 200, 429, 429, 429]);

    const login = [];
    for (let i = 0; i < 10; i++) login.push((await post(port, "/api/admin/login", { password: "wrong" })).status);
    ok("repeated wrong passwords are throttled, not endlessly retried",
       login.filter(c => c === 429).length >= 1 && login.slice(0, 8).every(c => c === 401 || c === 429),
       JSON.stringify(login));

    const huge = await post(port, "/api/contact", { name: "X", email: "x@y.de", nachricht: "z".repeat(600 * 1024) });
    ok("an oversized payload is refused rather than stored",
       huge.status >= 400 || huge.status === 0, "status " + huge.status);
    /* and the server survives it */
    const afterHuge = await post(port, "/api/newsletter", { email: "nach-gross@example.com" });
    ok("the server still answers after rejecting an oversized payload",
       afterHuge.status === 200 || afterHuge.status === 429, "status " + afterHuge.status);
  } catch (e) {
    ok("rate-limit server ran", false, e.message);
  } finally {
    server.kill();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
};
