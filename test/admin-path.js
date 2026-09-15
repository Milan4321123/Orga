/* The board area holds every member's address, date of birth and signature.
   Two things guard it: a password, and — since the default password is printed
   in a public README — the refusal to accept that default on a live site. The
   secret path is the third layer, worth having against scanners but worth
   nothing on its own, so it is tested for what it actually promises: that the
   old address gives nothing away, and that a wrong guess is indistinguishable
   from a page that was never there. */
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

const SECRET = "vorstand-9f2c71a4b8";

function request(port, method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const req = http.request({
      host: "127.0.0.1", port, path: urlPath, method,
      headers: data ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } : {}
    }, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, raw }));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}
function waitFor(port, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    (function attempt() {
      const r = http.get({ host: "127.0.0.1", port, path: "/api/content" }, (res) => { res.resume(); resolve(); });
      r.on("error", () => (Date.now() > deadline ? reject(new Error("no start")) : setTimeout(attempt, 100)));
    })();
  });
}
function start(port, dir, env) {
  return spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
    cwd: ROOT, stdio: "ignore",
    env: Object.assign({}, process.env, {
      PORT: String(port), NPJOE_DATA_DIR: dir, NPJOE_RATE_LIMIT: "500",
      NPJOE_WEBHOOK_URL: "", NPJOE_SMTP_HOST: ""
    }, env)
  });
}

module.exports = async function run(port) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-path-"));
  let server = start(port, dir, {
    NPJOE_ADMIN_PASSWORD: "ein-langes-eigenes-passwort", NPJOE_ADMIN_PATH: SECRET
  });

  try {
    await waitFor(port, 6000);

    group("The board area answers only on its secret path");
    const secret = await request(port, "GET", "/" + SECRET);
    eq("the secret path serves the page", secret.status, 200);
    ok("and it really is the board area", /Vorstandsbereich/.test(secret.raw));
    eq("the same path with .html works too, for bookmarks",
       (await request(port, "GET", "/" + SECRET + ".html")).status, 200);

    const old = await request(port, "GET", "/admin.html");
    eq("the old address no longer serves it", old.status, 404);
    ok("and gives nothing away — it is the ordinary 404 page",
       !/Vorstandsbereich/.test(old.raw) && /404/.test(old.raw), old.raw.slice(0, 120));

    const guess = await request(port, "GET", "/vorstand");
    eq("a wrong guess answers exactly like any missing page", guess.status, old.status);
    eq("byte for byte", guess.raw.length, old.raw.length);

    group("The secret path is not allowed to leak");
    ok("search engines are told to stay away", /noindex/.test(secret.headers["x-robots-tag"] || ""));
    ok("no proxy or browser may cache the page", /no-store/.test(secret.headers["cache-control"] || ""));
    ok("the path does not travel to other sites as a referrer",
       (secret.headers["referrer-policy"] || "") === "no-referrer");
    ok("robots.txt does not publish the secret",
       fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8").indexOf(SECRET) === -1);

    group("A hidden door is still only a door — the password is the lock");
    const wrong = await request(port, "POST", "/api/admin/login", { password: "npjoe-admin" });
    eq("the old default password does not open it", wrong.status, 401);
    const right = await request(port, "POST", "/api/admin/login", { password: "ein-langes-eigenes-passwort" });
    eq("the real password does", right.status, 200);
    const unauthorised = await request(port, "GET", "/api/admin/summary");
    eq("and the data stays behind the session, whatever the page path is", unauthorised.status, 401);

    group("On a live site the published default password is refused outright");
    server.kill();
    await new Promise((r) => setTimeout(r, 400));
    /* No NPJOE_ADMIN_PASSWORD at all, as on a host where it was forgotten. */
    server = start(port, dir, { NODE_ENV: "production" });
    await waitFor(port, 6000);

    const refused = await request(port, "POST", "/api/admin/login", { password: "npjoe-admin" });
    eq("the documented default is refused, not accepted", refused.status, 503);
    ok("and the reason is named so it can be fixed",
       /default_password_refused/.test(refused.raw), refused.raw.slice(0, 120));
    eq("no session is handed out", (await request(port, "GET", "/api/admin/summary")).status, 401);

    /* Locking the door must not lock the visitors out of the website. */
    const home = await request(port, "GET", "/");
    eq("the public website is unaffected", home.status, 200);
    eq("and forms still work", (await request(port, "POST", "/api/contact", {
      name: "Immer noch da", email: "da@example.com",
      nachricht: "Das Formular muss auch dann funktionieren."
    })).status, 200);
  } catch (e) {
    ok("admin path test ran", false, e.message);
  } finally {
    server.kill();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
};
