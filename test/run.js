#!/usr/bin/env node
/* ==========================================================================
   NPJOE — test suite

       node test/run.js

   Starts the server on a spare port with a throwaway data directory, runs
   the checks, then cleans up. Nothing in server/data is touched.
   ========================================================================== */
"use strict";
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const net = require("net");
const ROOT = path.resolve(__dirname, "..");

/* Ask the operating system for free ports rather than hard-coding them.
   A fixed port made the suite fail whenever another run — or a forgotten
   dev server — already held it, and a flaky suite is worse than none. */
function freePorts(count) {
  return Promise.all(Array.from({ length: count }, () => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
  })));
}
const PASSWORD = "test-password-" + Math.random().toString(36).slice(2, 8);
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-test-"));

const lib = require("./lib");

function waitForServer(PORT, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function attempt() {
      const req = http.get({ host: "127.0.0.1", port: PORT, path: "/api/content" }, res => {
        res.resume(); resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("server did not start"));
        setTimeout(attempt, 120);
      });
    })();
  });
}

(async function main() {
  const [PORT, RL_PORT, HOOK_SITE_PORT, HOOK_PORT, DEPLOY_PORT, MAIL_SITE_PORT, MAIL_PORT,
         ADMIN_PATH_PORT] = process.env.TEST_PORT
    ? [0, 1, 2, 3, 4, 5, 6, 7].map(n => Number(process.env.TEST_PORT) + n)
    : await freePorts(8);

  console.log("\n\x1b[1mNPJOE test suite\x1b[0m");
  console.log("port " + PORT + " · data " + DATA_DIR + "\n");

  /* Checks that need no server run first, so a broken server still reports. */
  require("./static")();
  require("./unit")();
  require("./documents")();
  require("./documents").desk();
  require("./preflight")();
  require("./a11y")();
  require("./letters")();

  const server = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
    cwd: ROOT,
    env: Object.assign({}, process.env, {
      PORT: String(PORT), NPJOE_ADMIN_PASSWORD: PASSWORD, NPJOE_DATA_DIR: DATA_DIR,
      NPJOE_RATE_LIMIT: "500"
    }),
    stdio: ["ignore", "pipe", "pipe"]
  });
  let serverErr = "";
  server.stderr.on("data", d => (serverErr += d));
  server.on("exit", (code, signal) => {
    if (code !== null && code !== 0) serverErr += "\n[server exited with code " + code + "]";
  });

  let failedToStart = false;
  try {
    await waitForServer(PORT, 6000);
  } catch (e) {
    failedToStart = true;
    lib.group("Server");
    lib.ok("the server starts", false, e.message + (serverErr ? " — " + serverErr.trim() : ""));
  }

  if (!failedToStart) {
    try {
      await require("./api")(PORT, PASSWORD);
      await require("./dsgvo")(PORT, PASSWORD);
      await require("./ratelimit")(RL_PORT);
      await require("./notify")(HOOK_SITE_PORT, HOOK_PORT);
      await require("./mail")(MAIL_SITE_PORT, MAIL_PORT);
      await require("./admin-path")(ADMIN_PATH_PORT);
      await require("./deploy")(DEPLOY_PORT);
    } catch (e) {
      lib.group("Server");
      /* Surface what the server itself said — an ECONNRESET on the client
         side usually means the server died, and its stderr says why. */
      lib.ok("API checks ran to completion", false,
        (e.message || String(e)) + (serverErr ? "\n      server stderr: " + serverErr.trim().split("\n").slice(-6).join("\n      ") : " (server printed nothing)"));
    }
  }

  server.kill();
  try { fs.rmSync(DATA_DIR, { recursive: true, force: true }); } catch (e) {}

  process.exit(lib.summary() ? 0 : 1);
})();
