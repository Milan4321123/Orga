/* ==========================================================================
   NPJOE — minimal SMTP client
   The rest of the project carries no dependencies, and a mail library is the
   kind of thing that pulls in thirty transitive packages for what is, over
   the wire, a short conversation. So this speaks SMTP directly: greeting,
   EHLO, STARTTLS where offered, AUTH, envelope, DATA.

   Nothing here throws at the caller. A submission must never fail because a
   mailbox is unreachable — the record is already stored, and an undelivered
   letter is a nuisance, not a lost membership.
   ========================================================================== */
"use strict";

const net = require("net");
const tls = require("tls");
const os = require("os");
const crypto = require("crypto");

/* ------------------------------------------------------------- settings */

function truthy(v, fallback) {
  if (v === undefined || v === "") return fallback;
  return /^(1|true|yes|on)$/i.test(String(v));
}

function isLoopback(host) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function config(env) {
  env = env || process.env;
  const host = String(env.NPJOE_SMTP_HOST || "").trim();
  const port = parseInt(env.NPJOE_SMTP_PORT || "587", 10);
  const user = String(env.NPJOE_SMTP_USER || "").trim();
  const from = String(env.NPJOE_MAIL_FROM || user || "").trim();
  return {
    host: host,
    port: port,
    user: user,
    pass: String(env.NPJOE_SMTP_PASS || ""),
    /* 465 is TLS from the first byte; 587 and 25 start plain and upgrade. */
    secure: truthy(env.NPJOE_SMTP_SECURE, port === 465),
    /* Only for a mail server with a self-signed certificate on the same host. */
    rejectUnauthorized: !truthy(env.NPJOE_SMTP_ALLOW_SELF_SIGNED, false),
    /* Credentials over an unencrypted link would be readable in transit. We
       refuse unless the server is on this machine (the test suite) or the
       operator has said the network is trusted. */
    allowPlaintextAuth: truthy(env.NPJOE_SMTP_ALLOW_PLAINTEXT, isLoopback(host)),
    from: from,
    fromName: String(env.NPJOE_MAIL_FROM_NAME || "Nepalesische Progressive Jugendorganisation e.V."),
    replyTo: String(env.NPJOE_MAIL_REPLY_TO || from).trim(),
    timeout: parseInt(env.NPJOE_SMTP_TIMEOUT || "15000", 10),
    configured: !!(host && from)
  };
}

/* ------------------------------------------------------ message assembly */

/* A header value outside ASCII travels as encoded words (RFC 2047). Each word
   must stay under 76 characters, and a multi-byte character must never be cut
   in half — hence chunking by code point rather than by byte. */
function encodeHeader(value) {
  const s = String(value == null ? "" : value).replace(/[\r\n]+/g, " ");
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  const words = [];
  let chunk = "";
  for (const ch of s) {
    if (Buffer.byteLength(chunk + ch, "utf8") > 42) { words.push(chunk); chunk = ""; }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => "=?UTF-8?B?" + Buffer.from(w, "utf8").toString("base64") + "?=").join("\r\n ");
}

function address(addr, name) {
  const clean = String(addr || "").replace(/[\r\n<>]/g, "").trim();
  if (!name) return clean;
  return '"' + encodeHeader(name).replace(/"/g, "") + '" <' + clean + ">";
}

function rfcDate(d) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n) => String(n).padStart(2, "0");
  return days[d.getUTCDay()] + ", " + p(d.getUTCDate()) + " " + months[d.getUTCMonth()] + " " +
    d.getUTCFullYear() + " " + p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + ":" +
    p(d.getUTCSeconds()) + " +0000";
}

function base64Body(text) {
  const b64 = Buffer.from(String(text).replace(/\r?\n/g, "\r\n"), "utf8").toString("base64");
  return (b64.match(/.{1,76}/g) || [""]).join("\r\n");
}

/* mail = { to, subject, text, replyTo, autoReply, headers } */
function buildMessage(cfg, mail) {
  const domain = (String(cfg.from).split("@")[1] || "localhost").replace(/[^\w.-]/g, "");
  const headers = [
    ["From", address(cfg.from, cfg.fromName)],
    ["To", address(mail.to)],
    ["Subject", encodeHeader(mail.subject)],
    ["Date", rfcDate(new Date())],
    ["Message-ID", "<" + Date.now().toString(36) + "." +
      crypto.randomBytes(8).toString("hex") + "@" + domain + ">"],
    ["MIME-Version", "1.0"],
    ["Content-Type", 'text/plain; charset="utf-8"'],
    ["Content-Transfer-Encoding", "base64"]
  ];
  const replyTo = mail.replyTo || cfg.replyTo;
  if (replyTo) headers.push(["Reply-To", address(replyTo)]);
  /* An automatic acknowledgement must announce itself, or two auto-responders
     can answer each other until someone notices the mailbox is full. */
  if (mail.autoReply) {
    headers.push(["Auto-Submitted", "auto-replied"]);
    headers.push(["X-Auto-Response-Suppress", "All"]);
    headers.push(["Precedence", "auto_reply"]);
  }
  Object.keys(mail.headers || {}).forEach((k) => headers.push([k, encodeHeader(mail.headers[k])]));

  return headers.map((h) => h[0] + ": " + h[1]).join("\r\n") + "\r\n\r\n" + base64Body(mail.text);
}

/* ------------------------------------------------------------- the wire */

function conversation(cfg, envelope, data) {
  return new Promise((resolve) => {
    let settled = false;
    let socket = null;
    let buffer = "";
    let lines = [];
    const waiting = [];
    const ready = [];
    let failure = null;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { if (socket) socket.destroy(); } catch (e) {}
      resolve(result);
    };
    const fail = (error, code) => finish({ ok: false, error: error, code: code || null });
    /* Which step we are on, so a timeout can say something useful. A hosting
       platform that blocks outbound SMTP — Render does this on free instances
       — drops the packets silently rather than refusing the connection, so the
       symptom is a hang before the greeting and nothing else. Reported as a
       bare "timeout" it looks like a wrong password, and the search starts in
       the wrong place. */
    let phase = "connect";
    const timer = setTimeout(() => fail(
      phase === "connect" ? "no_reply_from_server_port_blocked_or_unreachable" : "timeout_during_" + phase
    ), cfg.timeout);

    function deliver(reply) {
      const w = waiting.shift();
      if (w) w(reply); else if (reply) ready.push(reply);
    }
    function onData(chunk) {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, i).replace(/\r$/, "");
        buffer = buffer.slice(i + 1);
        lines.push(line);
        /* "250-CAP" continues the reply, "250 CAP" ends it. */
        if (/^\d{3}( |$)/.test(line)) {
          const reply = { code: parseInt(line.slice(0, 3), 10), text: lines.join("\n") };
          lines = [];
          deliver(reply);
        }
      }
    }
    function attach(s) {
      socket = s;
      s.setEncoding("utf8");
      s.on("data", onData);
      s.on("error", (err) => { failure = err.code || err.message; deliver(null); fail(failure); });
      s.on("close", () => { if (!settled) { deliver(null); fail(failure || "connection_closed"); } });
    }
    function read() {
      if (ready.length) return Promise.resolve(ready.shift());
      return new Promise((r) => waiting.push(r));
    }
    function write(line) { socket.write(line + "\r\n"); }
    async function expect(codes, command) {
      if (command !== undefined) write(command);
      const reply = await read();
      if (!reply) throw new Error(failure || "connection_closed");
      if (codes.indexOf(reply.code) === -1) {
        const err = new Error("smtp_" + reply.code);
        err.reply = reply;
        throw err;
      }
      return reply;
    }

    (async function run() {
      try {
        const opts = { host: cfg.host, port: cfg.port };
        attach(cfg.secure
          ? tls.connect(Object.assign({ servername: cfg.host, rejectUnauthorized: cfg.rejectUnauthorized }, opts))
          : net.connect(opts));

        await expect([220]);
        phase = "greeting";
        const me = (os.hostname() || "localhost").replace(/[^\w.-]/g, "") || "localhost";
        let hello = await expect([250], "EHLO " + me);
        let encrypted = cfg.secure;

        if (!encrypted && /STARTTLS/i.test(hello.text)) {
          phase = "starttls";
          await expect([220], "STARTTLS");
          socket.removeListener("data", onData);
          const plain = socket;
          plain.removeAllListeners("error");
          plain.removeAllListeners("close");
          const upgraded = tls.connect({
            socket: plain, servername: cfg.host, rejectUnauthorized: cfg.rejectUnauthorized
          });
          await new Promise((good, bad) => {
            upgraded.once("secureConnect", good);
            upgraded.once("error", bad);
          });
          attach(upgraded);
          encrypted = true;
          hello = await expect([250], "EHLO " + me);
        }

        if (cfg.user) {
          phase = "auth";
          if (!encrypted && !cfg.allowPlaintextAuth) return fail("refused_plaintext_auth");
          if (/AUTH[^\n]*PLAIN/i.test(hello.text)) {
            const token = Buffer.from(["", cfg.user, cfg.pass].join("\0"), "utf8").toString("base64");
            await expect([235], "AUTH PLAIN " + token);
          } else {
            await expect([334], "AUTH LOGIN");
            await expect([334], Buffer.from(cfg.user, "utf8").toString("base64"));
            await expect([235], Buffer.from(cfg.pass, "utf8").toString("base64"));
          }
        }

        phase = "envelope";
        await expect([250], "MAIL FROM:<" + envelope.from + ">");
        for (const rcpt of envelope.to) await expect([250, 251], "RCPT TO:<" + rcpt + ">");
        phase = "data";
        await expect([354], "DATA");
        /* A line consisting of a single dot would end the message early. */
        socket.write(data.replace(/\r\n\./g, "\r\n..") + "\r\n.\r\n");
        const accepted = await expect([250]);
        try { write("QUIT"); } catch (e) {}
        finish({ ok: true, code: accepted.code, response: accepted.text.slice(0, 200) });
      } catch (err) {
        if (settled) return;
        const reply = err.reply;
        fail(reply ? "rejected" : (err.code || err.message || "failed"), reply ? reply.code : null);
      }
    })();
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

/* Resolves to { ok: true, ... } or { ok: false, error }. Never rejects. */
function sendMail(cfg, mail) {
  if (!cfg.configured) return Promise.resolve({ ok: false, skipped: "smtp_not_configured" });
  const to = String(mail.to || "").trim();
  if (!EMAIL_RE.test(to)) return Promise.resolve({ ok: false, error: "invalid_recipient" });
  const message = buildMessage(cfg, Object.assign({}, mail, { to: to }));
  return conversation(cfg, { from: cfg.from, to: [to] }, message)
    .catch((err) => ({ ok: false, error: (err && err.message) || "failed" }));
}

module.exports = { config, sendMail, buildMessage, encodeHeader, address, rfcDate, EMAIL_RE };
