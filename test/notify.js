/* Runs a real receiver, points the server's webhook at it, and inspects what
   actually goes over the wire. The point is not just that an alert fires —
   it is that the alert leaks nothing. */
"use strict";
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

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
      const r = http.get({ host: "127.0.0.1", port, path: "/api/content" }, res => { res.resume(); resolve(); });
      r.on("error", () => (Date.now() > deadline ? reject(new Error("no start")) : setTimeout(attempt, 100)));
    })();
  });
}

module.exports = async function run(sitePort, hookPort) {
  const received = [];
  const receiver = http.createServer((req, res) => {
    let raw = "";
    req.on("data", c => (raw += c));
    req.on("end", () => {
      received.push({ path: req.url, contentType: req.headers["content-type"], raw });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end('{"ok":true}');
    });
  });
  await new Promise(r => receiver.listen(hookPort, "127.0.0.1", r));

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-hook-"));
  const server = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
    cwd: ROOT, stdio: "ignore",
    env: Object.assign({}, process.env, {
      PORT: String(sitePort), NPJOE_DATA_DIR: dir, NPJOE_ADMIN_PASSWORD: "hook-test",
      NPJOE_RATE_LIMIT: "100",
      NPJOE_WEBHOOK_URL: "http://127.0.0.1:" + hookPort + "/incoming"
    })
  });

  group("An arriving submission reaches a human");
  try {
    await waitFor(sitePort, 6000);

    /* A membership application full of personal detail. */
    const submitted = await post(sitePort, "/api/membership", {
      vorname: "Sensibel", nachname: "Geheimname", geburtsdatum: "1988-03-09",
      adresse: "Verräterweg 7", plz: "64283", ort: "Darmstadt",
      email: "geheim@example.com", telefon: "+49 170 9999999",
      satzung: true, dsgvo: true, beitrag: true,
      interessen: ["gesundheit"], beruf: "Sehr privater Beruf",
      sonstiges: "Eine private Bemerkung"
    });
    const ref = JSON.parse(submitted.raw).ref;

    await new Promise(r => setTimeout(r, 600));
    ok("an alert was sent", received.length >= 1, "received " + received.length);

    const body = received[0] ? received[0].raw : "";
    ok("it is posted as JSON", (received[0] || {}).contentType === "application/json");
    ok("it names the form type", /Beitrittserkl/.test(body), body.slice(0, 120));
    ok("it carries the reference so the board can find the record", body.indexOf(ref) !== -1);
    ok("it works with Slack-style receivers (text)", /"text":/.test(body));
    ok("it works with Discord-style receivers (content)", /"content":/.test(body));
    ok("it points the board at the protected area", /Vorstandsbereich/.test(body));

    /* The part that matters. */
    const leaks = [
      ["first name", "Sensibel"], ["surname", "Geheimname"], ["e-mail", "geheim@example.com"],
      ["address", "Verräterweg"], ["date of birth", "1988-03-09"], ["phone", "9999999"],
      ["profession", "Sehr privater Beruf"], ["free-text note", "Eine private Bemerkung"],
      ["postcode", "64283"]
    ];
    const leaked = leaks.filter(([, needle]) => body.indexOf(needle) !== -1).map(([label]) => label);
    eq("no personal data leaves the server in the alert", leaked, []);

    group("A broken webhook never harms the visitor");
    receiver.close();
    await new Promise(r => setTimeout(r, 200));
    const stillWorks = await post(sitePort, "/api/contact", {
      name: "Nach Ausfall", email: "danach@example.com",
      nachricht: "Der Webhook ist tot, das Formular muss trotzdem funktionieren."
    });
    eq("the form still accepts submissions with the webhook down", stillWorks.status, 200);
    ok("and still returns a reference", !!JSON.parse(stillWorks.raw).ref);
  } catch (e) {
    ok("notification test ran", false, e.message);
  } finally {
    try { receiver.close(); } catch (e) {}
    server.kill();
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
};
