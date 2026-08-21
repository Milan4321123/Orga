/* Checks the things a platform host relies on: a health endpoint, binding all
   interfaces, honouring PORT, security headers behind TLS, data living outside
   the app folder, and a clean shutdown on SIGTERM. */
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

function get(port, urlPath, host) {
  return new Promise((resolve, reject) => {
    const r = http.get({ host: host || "127.0.0.1", port, path: urlPath }, res => {
      let raw = ""; res.on("data", c => (raw += c));
      res.on("end", () => { let j = null; try { j = JSON.parse(raw); } catch (e) {}
        resolve({ status: res.statusCode, raw, json: j, headers: res.headers }); });
    });
    r.on("error", reject);
  });
}
function post(port, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const r = http.request({ host: "127.0.0.1", port, path: urlPath, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      res => { let raw = ""; res.on("data", c => (raw += c)); res.on("end", () => resolve({ status: res.statusCode, raw })); });
    r.on("error", reject); r.write(data); r.end();
  });
}
function waitFor(port, ms) {
  const deadline = Date.now() + ms;
  return new Promise((resolve, reject) => {
    (function attempt() {
      const r = http.get({ host: "127.0.0.1", port, path: "/healthz" }, res => { res.resume(); resolve(); });
      r.on("error", () => (Date.now() > deadline ? reject(new Error("no start")) : setTimeout(attempt, 100)));
    })();
  });
}

module.exports = async function run(port) {
  group("The repository is shaped for a platform host");
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  eq("npm start runs the server", pkg.scripts.start, "node server/server.js");
  eq("npm test runs the suite", pkg.scripts.test, "node test/run.js");
  ok("a Node version is declared", !!(pkg.engines && pkg.engines.node));
  eq("there are still no dependencies to install", Object.keys(pkg.dependencies || {}), []);

  const blueprint = fs.readFileSync(path.join(ROOT, "render.yaml"), "utf8");
  ok("the blueprint declares a web service", /type:\s*web/.test(blueprint));
  ok("it points the health check at /healthz", /healthCheckPath:\s*\/healthz/.test(blueprint));
  ok("it mounts a persistent disk", /mountPath:\s*\/var\/data/.test(blueprint));
  ok("it points the data directory at that disk", /NPJOE_DATA_DIR[\s\S]{0,40}\/var\/data/.test(blueprint));
  ok("it has Render generate the admin password rather than shipping one",
     /NPJOE_ADMIN_PASSWORD[\s\S]{0,60}generateValue:\s*true/.test(blueprint));
  ok("it keeps the webhook URL out of the repository", /NPJOE_WEBHOOK_URL[\s\S]{0,40}sync:\s*false/.test(blueprint));
  ok("it runs in an EU region, matching the privacy policy", /region:\s*frankfurt/.test(blueprint));

  /* Start the server the way Render would: assigned port, external data dir. */
  const disk = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-disk-"));
  const server = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
    cwd: ROOT, stdio: ["ignore", "pipe", "pipe"],
    env: Object.assign({}, process.env, {
      PORT: String(port), NPJOE_DATA_DIR: disk, NPJOE_ADMIN_PASSWORD: "deploy-test",
      NODE_ENV: "production", RENDER: "true",
      RENDER_EXTERNAL_URL: "https://npjoe-website.onrender.com"
    })
  });
  let out = "";
  server.stdout.on("data", d => (out += d));

  try {
    await waitFor(port, 6000);

    group("Health check");
    const health = await get(port, "/healthz");
    eq("it answers 200", health.status, 200);
    ok("it reports the service as up", health.json && health.json.ok === true);
    ok("it is never cached", /no-store/.test(health.headers["cache-control"] || ""));
    ok("it confirms storage is outside the app folder", health.json.persistentStorage === true,
       String(health.json && health.json.dataDir));

    group("Behaviour behind the platform's TLS proxy");
    const home = await get(port, "/");
    ok("HSTS is sent in production", /max-age=31536000/.test(home.headers["strict-transport-security"] || ""),
       home.headers["strict-transport-security"]);
    ok("the usual protective headers remain",
       home.headers["x-content-type-options"] === "nosniff" && !!home.headers["x-frame-options"]);

    /* The HTML pages are what a browser executes, so the policy has to reach
       them — not only the JSON endpoints. */
    const csp = home.headers["content-security-policy"] || "";
    ok("a content security policy is sent with the pages", csp.length > 40, csp.slice(0, 60));
    ok("it forbids loading anything from another origin", /default-src 'self'/.test(csp));
    ok("it blocks framing the site", /frame-ancestors 'none'/.test(csp));
    ok("it keeps form posts on this origin", /form-action 'self'/.test(csp));
    ok("it allows no plugins", /object-src 'none'/.test(csp));

    const asset = await get(port, "/assets/css/main.css");
    ok("stylesheets carry the headers too", asset.headers["x-content-type-options"] === "nosniff");
    const apiRes = await get(port, "/api/content");
    ok("API responses carry them as well", !!apiRes.headers["content-security-policy"]);
    ok("the startup banner shows the public URL, not localhost",
       /npjoe-website\.onrender\.com/.test(out), out.slice(0, 200));
    ok("no data-loss warning when a real disk is mounted", !/DATENVERLUST/.test(out));

    group("Data really lands on the mounted disk");
    const sub = await post(port, "/api/membership", {
      vorname: "Deploy", nachname: "Test", geburtsdatum: "1990-01-01",
      adresse: "Weg 1", plz: "64283", ort: "Darmstadt", email: "deploy@example.com",
      satzung: true, dsgvo: true, beitrag: true, interessen: ["sport"]
    });
    eq("a submission is accepted", sub.status, 200);
    ok("it is written to the disk, not into the app folder",
       fs.existsSync(path.join(disk, "membership.jsonl")), disk);
    ok("nothing was written inside server/data",
       !fs.existsSync(path.join(ROOT, "server", "data", "membership.jsonl")));

    group("A restart does not drop work in flight");
    const exited = new Promise(resolve => server.on("exit", (code, signal) => resolve({ code, signal })));
    server.kill("SIGTERM");
    const result = await Promise.race([
      exited,
      new Promise(r => setTimeout(() => r({ code: null, signal: "timeout" }), 9000))
    ]);
    ok("SIGTERM shuts the server down promptly", result.signal !== "timeout", JSON.stringify(result));
    ok("the shutdown is announced", /SIGTERM/.test(out), out.slice(-160));
    ok("the stored submission survives the shutdown",
       fs.readFileSync(path.join(disk, "membership.jsonl"), "utf8").includes("deploy@example.com"));
  } catch (e) {
    ok("deployment checks ran", false, e.message);
  } finally {
    try { server.kill("SIGKILL"); } catch (e) {}
    try { fs.rmSync(disk, { recursive: true, force: true }); } catch (e) {}
  }
};
