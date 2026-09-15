/* A real SMTP server on a spare port, the site pointed at it, and then a look
   at what actually left the building. The interesting questions are not "was
   something sent" but: does the applicant get their reference, does the letter
   avoid promising an admission the board has not granted, does a newsletter
   address stay unconfirmed until its owner clicks — and does a dead mail
   server still leave the form working. */
"use strict";
const http = require("http");
const net = require("net");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

const USER = "info@progressive-youth.de";
const PASS = "mailbox-secret";
const BOARD = "vorstand@progressive-youth.de";
const ADMIN_PATH = "vorstand-3e91c7";

/* ------------------------------------------------------------ fake mailbox */
function smtpServer(port) {
  const received = [];
  const server = net.createServer((socket) => {
    let buffer = "";
    let inData = false;
    let message = null;
    const say = (line) => socket.write(line + "\r\n");

    say("220 npjoe-test ESMTP ready");
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf("\r\n")) !== -1) {
        const line = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        if (inData) {
          if (line === ".") {
            inData = false;
            received.push(message);
            say("250 2.0.0 Ok: queued");
          } else {
            message.raw += (line.startsWith("..") ? line.slice(1) : line) + "\n";
          }
          continue;
        }
        const upper = line.toUpperCase();
        if (upper.startsWith("EHLO") || upper.startsWith("HELO")) {
          say("250-npjoe-test");
          say("250-AUTH PLAIN LOGIN");
          say("250 SIZE 10240000");
        } else if (upper.startsWith("AUTH PLAIN")) {
          const token = Buffer.from(line.slice(11).trim(), "base64").toString("utf8").split("\0");
          say(token[1] === USER && token[2] === PASS ? "235 2.7.0 Authenticated" : "535 5.7.8 Bad credentials");
        } else if (upper.startsWith("MAIL FROM")) {
          message = { from: /<([^>]*)>/.exec(line)[1], to: [], raw: "" };
          say("250 2.1.0 Ok");
        } else if (upper.startsWith("RCPT TO")) {
          message.to.push(/<([^>]*)>/.exec(line)[1]);
          say("250 2.1.5 Ok");
        } else if (upper === "DATA") {
          inData = true;
          say("354 End data with <CR><LF>.<CR><LF>");
        } else if (upper === "QUIT") {
          say("221 2.0.0 Bye");
          socket.end();
        } else {
          say("250 2.0.0 Ok");
        }
      }
    });
    socket.on("error", () => {});
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve({ server, received }));
  });
}

/* A letter as the recipient would read it: headers parsed, body decoded. */
function parse(message) {
  const split = message.raw.indexOf("\n\n");
  const headerBlock = message.raw.slice(0, split).replace(/\n[ \t]+/g, " ");
  const headers = {};
  headerBlock.split("\n").forEach((line) => {
    const at = line.indexOf(":");
    if (at > 0) headers[line.slice(0, at).toLowerCase()] = line.slice(at + 1).trim();
  });
  const decodeWords = (v) => String(v || "").replace(/=\?UTF-8\?B\?([^?]*)\?=/gi,
    (m, b64) => Buffer.from(b64, "base64").toString("utf8")).replace(/\?=\s+=\?/g, "");
  return {
    to: message.to[0],
    envelopeFrom: message.from,
    headers: headers,
    subject: decodeWords(headers.subject),
    from: decodeWords(headers.from),
    body: Buffer.from(message.raw.slice(split + 2).replace(/\n/g, ""), "base64").toString("utf8")
  };
}

/* ------------------------------------------------------------- site helpers */
function post(port, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const r = http.request({ host: "127.0.0.1", port, path: urlPath, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } },
      (res) => { let raw = ""; res.on("data", (c) => (raw += c)); res.on("end", () => resolve({ status: res.statusCode, raw })); });
    r.on("error", reject); r.write(data); r.end();
  });
}
function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    const r = http.get({ host: "127.0.0.1", port, path: urlPath }, (res) => {
      let raw = ""; res.on("data", (c) => (raw += c)); res.on("end", () => resolve({ status: res.statusCode, raw }));
    });
    r.on("error", reject);
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
/* Mail is fire-and-forget, so the response beats the letter. */
function settle(received, count, ms) {
  const deadline = Date.now() + (ms || 4000);
  return new Promise((resolve) => {
    (function look() {
      if (received.length >= count || Date.now() > deadline) return resolve(received);
      setTimeout(look, 50);
    })();
  });
}

module.exports = async function run(sitePort, mailPort) {
  const mailbox = await smtpServer(mailPort);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-mail-"));
  const server = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
    cwd: ROOT, stdio: "ignore",
    env: Object.assign({}, process.env, {
      PORT: String(sitePort), NPJOE_DATA_DIR: dir, NPJOE_ADMIN_PASSWORD: "mail-test",
      NPJOE_RATE_LIMIT: "500", NPJOE_WEBHOOK_URL: "",
      NPJOE_SMTP_HOST: "127.0.0.1", NPJOE_SMTP_PORT: String(mailPort),
      NPJOE_SMTP_USER: USER, NPJOE_SMTP_PASS: PASS,
      NPJOE_MAIL_FROM: USER, NPJOE_MAIL_BOARD: BOARD,
      NPJOE_PUBLIC_URL: "http://127.0.0.1:" + sitePort,
      NPJOE_ADMIN_PATH: ADMIN_PATH
    })
  });

  const extra = [];
  try {
    await waitFor(sitePort, 6000);

    group("A membership application is answered by return of post");
    const applied = await post(sitePort, "/api/membership", {
      vorname: "Anisha", nachname: "Gurung", geburtsdatum: "1998-04-02",
      adresse: "Beispielweg 3", plz: "64283", ort: "Darmstadt",
      email: "anisha.gurung@example.com", satzung: true, dsgvo: true, beitrag: true,
      _lang: "de"
    });
    const body = JSON.parse(applied.raw);
    ok("the form still answers with a reference", !!body.ref, applied.raw.slice(0, 120));
    ok("and says a confirmation was sent, so the page may promise one", body.acknowledged === true);

    await settle(mailbox.received, 2);
    const letters = mailbox.received.map(parse);
    const ack = letters.find((l) => l.to === "anisha.gurung@example.com");
    const copy = letters.find((l) => l.to === BOARD);

    ok("the applicant receives an acknowledgement", !!ack, "got " + letters.map((l) => l.to).join(", "));
    ok("the board receives a copy", !!copy);
    if (ack) {
      ok("it comes from the association's own address", ack.envelopeFrom === USER && ack.from.indexOf(USER) !== -1, ack.from);
      ok("the subject survives German umlauts", /Beitrittserklärung/.test(ack.subject), ack.subject);
      ok("it carries the reference the person can quote", ack.body.indexOf(body.ref) !== -1);
      ok("it addresses the person by name", /Liebe:r Anisha Gurung/.test(ack.body));
      ok("the body survives German umlauts too", /Werktagen/.test(ack.body) && /Vorstand/.test(ack.body));
      /* The dangerous mistake: an automatic letter that reads like a decision. */
      ok("it does not pretend the board has admitted them",
         /entscheidet der Vorstand/.test(ack.body) && !/willkommen/i.test(ack.body), ack.body.slice(0, 200));
      ok("it tells them not to pay yet", /noch keinen Dauerauftrag/.test(ack.body));
      ok("it names the privacy policy and the erasure right",
         /datenschutz\.html/.test(ack.body) && /Löschung/.test(ack.body));
      /* Without this header two auto-responders can talk to each other. */
      eq("it announces itself as an automatic reply", ack.headers["auto-submitted"], "auto-replied");
      ok("a reply reaches the association", (ack.headers["reply-to"] || "").indexOf(USER) !== -1);
    }
    if (copy) {
      ok("the board copy names the form type", /Beitrittserklärung/.test(copy.subject), copy.subject);
      ok("it points at the protected area, not at the data",
         /Vorstandsbereich/.test(copy.body) && copy.body.indexOf("/" + ADMIN_PATH) !== -1,
         copy.body.slice(0, 200));
      ok("replying to it writes to the applicant",
         (copy.headers["reply-to"] || "").indexOf("anisha.gurung@example.com") !== -1);
    }

    group("The letter follows the language the person was reading");
    mailbox.received.length = 0;
    await post(sitePort, "/api/contact", {
      name: "Ram Thapa", email: "ram@example.com",
      nachricht: "A question about volunteering with your organisation.", _lang: "en"
    });
    await settle(mailbox.received, 2);
    const english = mailbox.received.map(parse).find((l) => l.to === "ram@example.com");
    ok("an English enquiry is answered in English", !!english && /We have received your message/.test(english.subject),
       english ? english.subject : "no letter");
    ok("and greets in English", !!english && /Dear Ram Thapa,/.test(english.body));

    group("A newsletter address is not subscribed until its owner says so");
    mailbox.received.length = 0;
    const signup = await post(sitePort, "/api/newsletter", { email: "reader@example.com", _lang: "de" });
    const signupBody = JSON.parse(signup.raw);
    eq("the sign-up is accepted", signup.status, 200);
    ok("the page is told a confirmation is still needed", signupBody.confirmationRequired === true);

    await settle(mailbox.received, 2);
    const optIn = mailbox.received.map(parse).find((l) => l.to === "reader@example.com");
    ok("the address receives a confirmation request", !!optIn);
    ok("which asks rather than thanks", !!optIn && /Bitte bestätigen/.test(optIn.subject), optIn ? optIn.subject : "");
    const link = optIn && /(http:\/\/\S+)/.exec(optIn.body);
    ok("it contains a confirmation link", !!link, optIn ? optIn.body.slice(0, 200) : "");

    const stored = () => fs.readFileSync(path.join(dir, "newsletter.jsonl"), "utf8")
      .split("\n").filter(Boolean).map(JSON.parse);
    eq("until it is followed the entry stays pending", stored()[0].status, "pending");

    if (link) {
      const url = link[1].replace(/^http:\/\/127\.0\.0\.1:\d+/, "");
      /* Change one character to something it certainly is not — overwriting it
         with a fixed digit silently does nothing when it already is that digit,
         which made this check pass by luck one run in sixteen. */
      const token = /token=([a-f0-9]+)/.exec(url)[1];
      const tampered = (token[0] === "a" ? "b" : "a") + token.slice(1);
      const wrong = await get(sitePort, url.replace(token, tampered));
      eq("a tampered link is refused", wrong.status, 400);
      eq("and the entry is still pending", stored()[0].status, "pending");

      const confirmed = await get(sitePort, url);
      eq("the real link confirms", confirmed.status, 200);
      ok("and says so on the page", /Anmeldung bestätigt/.test(confirmed.raw));
      eq("the entry is now confirmed", stored()[0].status, "confirmed");
      ok("the token is not kept once it has been used", stored()[0]._optInToken === undefined);

      const again = await get(sitePort, url);
      eq("clicking the link twice is not an error", again.status, 200);
    }

    group("An address nobody confirmed does not stay forever");
    /* Age an unconfirmed entry past the thirty days the privacy policy names,
       then restart: the sweep runs at boot. */
    const file = path.join(dir, "newsletter.jsonl");
    const rows = fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map(JSON.parse);
    rows.push({
      _ref: "NEW-2026-OLD1", email: "vergessen@example.com", status: "pending",
      _receivedAt: new Date(Date.now() - 40 * 864e5).toISOString(), _optInToken: "abc"
    });
    rows.push({
      _ref: "NEW-2026-NEW1", email: "frisch@example.com", status: "pending",
      _receivedAt: new Date(Date.now() - 3 * 864e5).toISOString(), _optInToken: "def"
    });
    fs.writeFileSync(file, rows.map(r => JSON.stringify(r)).join("\n") + "\n", "utf8");

    server.kill();
    await new Promise(r => setTimeout(r, 400));
    const restarted = spawn(process.execPath, [path.join(ROOT, "server", "server.js")], {
      cwd: ROOT, stdio: "ignore",
      env: Object.assign({}, process.env, {
        PORT: String(sitePort), NPJOE_DATA_DIR: dir, NPJOE_ADMIN_PASSWORD: "mail-test",
        NPJOE_RATE_LIMIT: "500", NPJOE_WEBHOOK_URL: "",
        NPJOE_SMTP_HOST: "127.0.0.1", NPJOE_SMTP_PORT: String(mailPort),
        NPJOE_SMTP_USER: USER, NPJOE_SMTP_PASS: PASS,
        NPJOE_MAIL_FROM: USER, NPJOE_MAIL_BOARD: BOARD,
        NPJOE_PUBLIC_URL: "http://127.0.0.1:" + sitePort,
        NPJOE_ADMIN_PATH: ADMIN_PATH
      })
    });
    extra.push(restarted);
    await waitFor(sitePort, 6000);
    const left = fs.readFileSync(file, "utf8");
    ok("an unconfirmed address older than 30 days is deleted", left.indexOf("vergessen@example.com") === -1);
    ok("a recent one is kept — it may still be confirmed", left.indexOf("frisch@example.com") !== -1);
    ok("and a confirmed subscriber is never touched", left.indexOf("reader@example.com") !== -1);

    group("A silent spam bot gets nothing at all");
    mailbox.received.length = 0;
    await post(sitePort, "/api/contact", {
      name: "Bot", email: "bot@example.com", nachricht: "Buy cheap watches online now!", _hp: "trapped"
    });
    await settle(mailbox.received, 1, 800);
    eq("the honeypot sends no mail", mailbox.received.length, 0);

    group("A dead mail server never costs a membership");
    mailbox.received.length = 0;
    await new Promise((r) => mailbox.server.close(r));
    const afterOutage = await post(sitePort, "/api/membership", {
      vorname: "Nach", nachname: "Ausfall", geburtsdatum: "1990-01-01",
      adresse: "Weg 1", plz: "64283", ort: "Darmstadt",
      email: "ausfall@example.com", satzung: true, dsgvo: true, beitrag: true
    });
    eq("the application is still accepted", afterOutage.status, 200);
    const outageBody = JSON.parse(afterOutage.raw);
    ok("and still returns a reference", !!outageBody.ref);
    ok("the record reached the disk", fs.readFileSync(path.join(dir, "membership.jsonl"), "utf8")
       .indexOf(outageBody.ref) !== -1);
  } catch (e) {
    ok("mail test ran", false, e.message);
  } finally {
    try { mailbox.server.close(); } catch (e) {}
    server.kill();
    extra.forEach(p => { try { p.kill(); } catch (e) {} });
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  }
};
