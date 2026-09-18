#!/usr/bin/env node
/* ==========================================================================
   NPJOE — Website & submission server
   Zero dependencies: Node's built-in modules only. Start with:

       node server/server.js

   Environment variables (all optional):
       PORT                  default 4173
       NPJOE_ADMIN_PASSWORD  default "npjoe-admin"  (change before deploying)
       NPJOE_DATA_DIR        default server/data
       NPJOE_SMTP_HOST       mailbox of info@progressive-youth.de — see below
       NPJOE_SMTP_PORT       default 587 (465 = TLS from the first byte)
       NPJOE_SMTP_USER       usually the full address
       NPJOE_SMTP_PASS       mailbox password
       NPJOE_MAIL_FROM       default: the SMTP user
       NPJOE_MAIL_BOARD      where the board copy goes, default: the from address
       NPJOE_MAIL_ACK        "0" switches the acknowledgements off
       NPJOE_MAIL_BOARD_COPY "0" switches the board copy off
       NPJOE_ADMIN_PATH      secret word the board area answers on, default "admin"
   ========================================================================== */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const smtp = require("./smtp");
const letters = require("./mail-templates");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.NPJOE_DATA_DIR || path.join(__dirname, "data");
const PORT = parseInt(process.env.PORT || "4173", 10);
const ADMIN_PASSWORD = process.env.NPJOE_ADMIN_PASSWORD || "npjoe-admin";
/* Submissions allowed per IP per 10 minutes. Raise it for a large association
   or an office behind one shared address; lower it if spam becomes a problem. */
const RATE_LIMIT = parseInt(process.env.NPJOE_RATE_LIMIT || "12", 10);
/* Optional outbound alert so a submission does not sit unnoticed. Works with
   any endpoint that accepts a JSON POST — Slack, Discord, a Telegram bot
   relay, n8n, Zapier. Deliberately carries no personal data. */
const WEBHOOK_URL = process.env.NPJOE_WEBHOOK_URL || "";
/* Render (and most platform hosts) set PORT and expect the process to bind
   every interface, terminate TLS for us and send SIGTERM before a restart. */
const HOST = process.env.HOST || "0.0.0.0";
const ON_RENDER = !!(process.env.RENDER || process.env.RENDER_SERVICE_NAME);
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || process.env.NPJOE_PUBLIC_URL || "";
const IS_PRODUCTION = process.env.NODE_ENV === "production" || ON_RENDER;
/* Outgoing mail. Without NPJOE_SMTP_HOST nothing is sent and every form keeps
   working exactly as before — the feature is additive, never load-bearing. */
const MAIL = smtp.config(process.env);
const MAIL_BOARD = (process.env.NPJOE_MAIL_BOARD || MAIL.from || "").trim();
const MAIL_ACK = !/^(0|false|no|off)$/i.test(process.env.NPJOE_MAIL_ACK || "1");
const MAIL_BOARD_COPY = !/^(0|false|no|off)$/i.test(process.env.NPJOE_MAIL_BOARD_COPY || "1");
/* Where the board area answers. "admin" is the documented default and is the
   first thing any scanner tries, so a live site should set its own secret
   word here. This is not a lock — the password is the lock — but it keeps the
   page out of crawlers, out of link previews and away from anyone who simply
   guesses. Note the page's own source is public on GitHub; the secret is this
   path, which lives only in the environment. */
const ADMIN_PATH = String(process.env.NPJOE_ADMIN_PATH || "admin")
  .trim().replace(/^\/+|\/+$/g, "").replace(/\.html$/i, "");

const FORM_TYPES = ["membership", "volunteer", "contact", "newsletter", "donation", "partner"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".ics": "text/calendar; charset=utf-8"
};

/* --------------------------------------------------------------- storage */
fs.mkdirSync(DATA_DIR, { recursive: true });

function storeFile(type) {
  return path.join(DATA_DIR, type + ".jsonl");
}

function append(type, record) {
  fs.appendFileSync(storeFile(type), JSON.stringify(record) + "\n", "utf8");
}

function readAll(type) {
  const file = storeFile(type);
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line); } catch (e) { return null; } })
    .filter(Boolean);
}

function rewrite(type, records) {
  fs.writeFileSync(storeFile(type), records.map((r) => JSON.stringify(r)).join("\n") + (records.length ? "\n" : ""), "utf8");
}

/* ------------------------------------------------------- editable content */
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const BACKUP_DIR = path.join(DATA_DIR, "content-backups");

/* Only these collections may be edited from the board area. Everything else
   — the statutes, the imprint, the privacy policy, page layout — stays in
   code, because it changes rarely and getting it wrong has legal weight. */
const CONTENT_KEYS = ["events", "news", "faq", "figures", "org"];

function readContent() {
  if (!fs.existsSync(CONTENT_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CONTENT_FILE, "utf8"));
  } catch (e) {
    console.error("content.json is not valid JSON — serving built-in defaults");
    return {};
  }
}

function backupContent() {
  if (!fs.existsSync(CONTENT_FILE)) return;
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(CONTENT_FILE, path.join(BACKUP_DIR, "content-" + stamp + ".json"));
  /* Keep the twenty most recent versions so a bad edit can always be undone. */
  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json")).sort();
  files.slice(0, Math.max(0, files.length - 20)).forEach((f) => {
    try { fs.unlinkSync(path.join(BACKUP_DIR, f)); } catch (e) {}
  });
}

function writeContent(next, editor) {
  backupContent();
  const payload = {};
  CONTENT_KEYS.forEach((k) => { if (next[k] !== undefined) payload[k] = next[k]; });
  payload.updatedAt = new Date().toISOString();
  payload.updatedBy = String(editor || "Vorstand").slice(0, 80);
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function validateContent(data) {
  const errors = [];
  if (typeof data !== "object" || data === null) return ["payload"];

  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  (data.events || []).forEach((e, i) => {
    if (!isoDate.test(String(e.date || ""))) errors.push("events[" + i + "].date");
    if (!String(e.de || "").trim()) errors.push("events[" + i + "].de");
  });
  (data.news || []).forEach((n, i) => {
    if (!isoDate.test(String(n.date || ""))) errors.push("news[" + i + "].date");
    if (!String(n.de || "").trim()) errors.push("news[" + i + "].de");
  });
  (data.faq || []).forEach((f, i) => {
    if (!String(f.qDe || "").trim()) errors.push("faq[" + i + "].qDe");
    if (!String(f.aDe || "").trim()) errors.push("faq[" + i + "].aDe");
  });
  if (data.figures) {
    Object.keys(data.figures).forEach((k) => {
      const v = data.figures[k];
      if (v !== "" && v !== null && isNaN(Number(v))) errors.push("figures." + k);
    });
  }
  return errors;
}

/* --------------------------------------------------------- notifications
   A volunteer board does not sit in the admin panel all day, so an arriving
   application needs to reach someone. The alert names only the form type and
   the reference — never a name, address or message. Anything else would be a
   fresh transfer of personal data to a third party, usually outside the EU,
   which the privacy policy does not cover. The board follows the link and
   reads the details inside the protected area. */

const notifyLog = [];

function recordNotify(entry) {
  notifyLog.unshift(entry);
  if (notifyLog.length > 50) notifyLog.length = 50;
}

function notify(type, ref, membershipNo) {
  if (!WEBHOOK_URL) return Promise.resolve({ skipped: "no_webhook_configured" });

  const labels = {
    membership: "Neue Beitrittserklärung",
    volunteer: "Neue Volunteer-Registrierung",
    donation: "Neue Spendenzusage",
    contact: "Neue Kontaktanfrage",
    partner: "Neue Kooperationsanfrage",
    newsletter: "Neue Newsletter-Anmeldung"
  };
  const headline = labels[type] || "Neuer Eingang";
  const text = headline + " · " + ref +
    (membershipNo ? " · " + membershipNo : "") +
    "\nDetails im Vorstandsbereich (bewusst nicht in dieser Nachricht).";

  const payload = JSON.stringify({
    /* Slack and Discord both read "text"/"content"; the rest is for anything else. */
    text: text, content: text,
    event: "submission", formType: type, reference: ref,
    receivedAt: new Date().toISOString(),
    note: "Contains no personal data by design."
  });

  return new Promise((resolve) => {
    let target;
    try { target = new URL(WEBHOOK_URL); } catch (e) {
      const r = { at: new Date().toISOString(), type, ref, ok: false, error: "invalid_url" };
      recordNotify(r); return resolve(r);
    }
    const lib = target.protocol === "http:" ? require("http") : require("https");
    const req = lib.request({
      hostname: target.hostname, port: target.port || (target.protocol === "http:" ? 80 : 443),
      path: target.pathname + target.search, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
      timeout: 5000
    }, (res) => {
      res.resume();
      const r = { at: new Date().toISOString(), type, ref, ok: res.statusCode < 400, status: res.statusCode };
      recordNotify(r); resolve(r);
    });
    /* A failing webhook must never affect the person submitting the form. */
    req.on("error", (err) => {
      const r = { at: new Date().toISOString(), type, ref, ok: false, error: err.code || err.message };
      recordNotify(r); resolve(r);
    });
    req.on("timeout", () => { req.destroy(); });
    req.write(payload);
    req.end();
  });
}

/* ------------------------------------------------------------------ mail
   The website promises an answer in one to three working days. Until the
   board gets there, the person who filled in the form should at least know
   that it arrived and under which reference — otherwise a membership
   application feels like it fell into a hole.

   Two letters go out per submission: an acknowledgement to the visitor and a
   short copy to the association's own mailbox. Neither may ever affect the
   submission itself; the record is already on disk before the first byte of
   SMTP is written. */

const mailLog = [];

function recordMail(entry) {
  mailLog.unshift(entry);
  if (mailLog.length > 50) mailLog.length = 50;
}

/* The address the confirmation link must point at. Behind Render's proxy the
   request still knows the public host, so a missing NPJOE_PUBLIC_URL is not
   fatal. */
function publicBase(req) {
  if (PUBLIC_URL) return PUBLIC_URL.replace(/\/$/, "");
  const host = (req && (req.headers["x-forwarded-host"] || req.headers.host)) || "";
  if (!host) return "";
  const proto = (req && req.headers["x-forwarded-proto"]) || (IS_PRODUCTION ? "https" : "http");
  return proto + "://" + host;
}

function newsletterConfirmUrl(base, record) {
  if (!base || !record._optInToken) return "";
  return base + "/newsletter-bestaetigen?ref=" + encodeURIComponent(record._ref) +
    "&token=" + record._optInToken;
}

function contentOrg() {
  try { return readContent().org || null; } catch (e) { return null; }
}

/* Sends and logs; resolves to a result, never rejects. */
function deliver(kind, type, ref, mail) {
  return smtp.sendMail(MAIL, mail).then((result) => {
    recordMail({
      at: new Date().toISOString(), kind: kind, type: type, ref: ref,
      /* The log is read in the board area, so it keeps only the domain of the
         recipient — enough to debug a bounce, not a second address book. */
      to: String(mail.to || "").replace(/^[^@]*/, "…"),
      ok: !!result.ok, error: result.error || null, skipped: result.skipped || null
    });
    return result;
  });
}

function sendAcknowledgement(type, record, base) {
  if (!MAIL_ACK || !MAIL.configured) return Promise.resolve({ skipped: "disabled" });
  const to = String(record.email || "").trim();
  /* Writing to our own mailbox would start a conversation with ourselves. */
  if (!to || to.toLowerCase() === String(MAIL.from).toLowerCase() ||
      to.toLowerCase() === String(MAIL_BOARD).toLowerCase()) {
    return Promise.resolve({ skipped: "own_address" });
  }
  const letter = letters.acknowledgement(type, record, {
    org: contentOrg(),
    baseUrl: base,
    confirmUrl: type === "newsletter" ? newsletterConfirmUrl(base, record) : ""
  });
  if (!letter) return Promise.resolve({ skipped: "no_template" });
  return deliver("ack", type, record._ref, {
    to: letter.to, subject: letter.subject, text: letter.text, autoReply: true
  });
}

function sendBoardCopy(type, record, base) {
  if (!MAIL_BOARD_COPY || !MAIL.configured || !MAIL_BOARD) return Promise.resolve({ skipped: "disabled" });
  const notice = letters.boardNotice(type, record, {
    org: contentOrg(), baseUrl: base, adminPath: ADMIN_PATH
  });
  return deliver("board", type, record._ref, {
    to: MAIL_BOARD, subject: notice.subject, text: notice.text, replyTo: notice.replyTo
  });
}

/* ------------------------------------------------ newsletter double opt-in
   For every other form the person described themselves; a newsletter address
   can be typed in by anyone. German law (§ 7 UWG) and Art. 7 DSGVO both want
   proof that the owner of the address agreed, so the entry stays "pending"
   and receives nothing until the link in the first mail is followed. */

function confirmNewsletter(ref, token) {
  const rows = readAll("newsletter");
  const row = rows.find((r) => r._ref === ref);
  if (!row || !row._optInToken) {
    /* Already confirmed counts as success — people click the link twice. */
    if (row && row.status === "confirmed") return { ok: true, already: true };
    return { ok: false, error: "not_found" };
  }
  if (!safeEqual(token, row._optInToken)) return { ok: false, error: "invalid_token" };
  if (Date.now() - new Date(row._receivedAt || 0).getTime() > 30 * 864e5) {
    return { ok: false, error: "expired" };
  }
  row.status = "confirmed";
  row._optInConfirmedAt = new Date().toISOString();
  delete row._optInToken;
  rewrite("newsletter", rows);
  console.log("[" + row._optInConfirmedAt + "] newsletter opt-in confirmed · " + ref);
  return { ok: true, lang: row._lang === "en" ? "en" : "de" };
}

/* An address that was never confirmed is an address nobody agreed to give
   us, so keeping it has no purpose (Art. 5(1)(e)). The privacy policy names
   thirty days; this is what makes that sentence true. */
function pruneUnconfirmedNewsletter() {
  const rows = readAll("newsletter");
  const cutoff = Date.now() - 30 * 864e5;
  const keep = rows.filter((r) =>
    !(r.status === "pending" && new Date(r._receivedAt || 0).getTime() < cutoff));
  if (keep.length === rows.length) return 0;
  rewrite("newsletter", keep);
  console.log("[" + new Date().toISOString() + "] " + (rows.length - keep.length) +
              " unbestätigte Newsletter-Anmeldung(en) nach 30 Tagen gelöscht");
  return rows.length - keep.length;
}

/* ------------------------------------------- data-subject requests (DSGVO)
   Art. 15 asks us to disclose everything held about a person, Art. 17 to
   erase it. But tax law keeps a competing claim: donation receipts and
   membership accounting must be retained (§ 147 AO, § 50 EStDV). The correct
   answer is not to refuse erasure but to *restrict* those records — strip
   them to the fields the retention duty actually needs and take them out of
   ordinary use — while deleting everything else outright (Art. 18). */

const RETAINED_TYPES = ["membership", "donation"];

/* The only fields a retained record keeps. Everything else is removed. */
const RETENTION_FIELDS = {
  membership: ["_ref", "_receivedAt", "membershipNo", "vorname", "nachname",
               "zahlungsintervall", "zahlungsweise", "status"],
  donation: ["_ref", "_receivedAt", "name", "betrag", "betragCustom", "intervall",
             "zweck", "zuwendungsbestaetigung", "status"]
};

function personKey(value) {
  return String(value || "").trim().toLowerCase();
}

/* A one-way pseudonym for a person. Restricted records carry it so the board
   can still answer "what do you hold about me?" after the e-mail address
   itself has been erased. */
function subjectHash(value) {
  return crypto.createHash("sha256").update(personKey(value) + "npjoe").digest("hex").slice(0, 16);
}

/* Finds every record about one person across all form types. */
function findPerson(query) {
  const q = personKey(query);
  if (!q) return [];
  const hits = [];
  FORM_TYPES.forEach((type) => {
    readAll(type).forEach((row) => {
      const email = personKey(row.email);
      const name = personKey([row.vorname, row.nachname].filter(Boolean).join(" ") || row.name);
      const bySubject = row._subject && row._subject === subjectHash(query);
      if (bySubject || email === q || (name && name === q) || (q.length > 3 && email && email.includes(q))) {
        hits.push({ type, record: row });
      }
    });
  });
  return hits;
}

function logErasure(entry) {
  const file = path.join(DATA_DIR, "erasures.jsonl");
  fs.appendFileSync(file, JSON.stringify(entry) + "\n", "utf8");
}

/* Carries out an erasure request and reports exactly what happened to each
   record, so the board can answer the person truthfully. */
function erasePerson(query, actor) {
  const q = personKey(query);
  const report = { deleted: [], restricted: [], at: new Date().toISOString(), actor: String(actor || "Vorstand").slice(0, 80) };

  FORM_TYPES.forEach((type) => {
    const rows = readAll(type);
    let touched = false;
    const kept = [];

    rows.forEach((row) => {
      const email = personKey(row.email);
      const name = personKey([row.vorname, row.nachname].filter(Boolean).join(" ") || row.name);
      const isMatch = email === q || (name && name === q);
      if (!isMatch) { kept.push(row); return; }

      touched = true;
      if (RETAINED_TYPES.indexOf(type) === -1) {
        report.deleted.push({ type, ref: row._ref });
        return; /* dropped entirely */
      }
      /* Retained: keep only what the tax duty needs. */
      const minimal = {};
      (RETENTION_FIELDS[type] || []).forEach((k) => {
        if (row[k] !== undefined) minimal[k] = row[k];
      });
      minimal._restricted = true;
      minimal._subject = subjectHash(q);
      minimal._restrictedAt = report.at;
      minimal._restrictedReason = type === "donation"
        ? "Aufbewahrung nach § 50 EStDV (Zuwendungsbestätigung)"
        : "Aufbewahrung nach § 147 AO (Beitragsbuchhaltung)";
      minimal._retainUntil = String(new Date().getFullYear() + 10);
      report.restricted.push({ type, ref: row._ref, keeps: Object.keys(minimal).filter((k) => k[0] !== "_") });
      kept.push(minimal);
    });

    if (touched) rewrite(type, kept);
  });

  /* Accountability under Art. 5(2): record that it happened, without keeping
     the person's address itself — only a one-way hash of it. */
  logErasure({
    subject: subjectHash(q),
    at: report.at, actor: report.actor,
    deleted: report.deleted.length, restricted: report.restricted.length
  });
  return report;
}

/* Sequential membership numbers: NPJOE-2026-0001 */
function nextMembershipNo() {
  const year = new Date().getFullYear();
  const existing = readAll("membership").filter((r) => (r.membershipNo || "").indexOf("NPJOE-" + year) === 0);
  const seq = String(existing.length + 1).padStart(4, "0");
  return "NPJOE-" + year + "-" + seq;
}

/* ------------------------------------------------------------ rate limit */
const hits = new Map();
function rateLimited(ip, max, windowMs) {
  const now = Date.now();
  const entry = hits.get(ip) || { count: 0, start: now };
  if (now - entry.start > windowMs) { entry.count = 0; entry.start = now; }
  entry.count += 1;
  hits.set(ip, entry);
  if (hits.size > 5000) hits.clear();
  return entry.count > max;
}

/* --------------------------------------------------------------- sessions */
const sessions = new Map(); /* token -> expiry */

function newSession() {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, Date.now() + 1000 * 60 * 60 * 8);
  return token;
}

function validSession(req) {
  const cookie = req.headers.cookie || "";
  const match = /npjoe_admin=([a-f0-9]+)/.exec(cookie);
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const token = (match && match[1]) || bearer;
  if (!token) return false;
  const exp = sessions.get(token);
  if (!exp) return false;
  if (Date.now() > exp) { sessions.delete(token); return false; }
  return true;
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/* -------------------------------------------------------------- helpers */
/* Every response gets these, pages included. An earlier version only applied
   them in send(), so the HTML itself — the part a browser actually renders —
   went out bare. */
function securityHeaders() {
  const h = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    /* The site loads nothing from anywhere else: no CDN, no fonts, no
       analytics. Saying so blocks an injected <script src> outright.
       'unsafe-inline' is still needed for the small inline language script
       in every page head and for inline style attributes. */
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join("; ")
  };
  if (IS_PRODUCTION) {
    /* The host terminates TLS, so tell browsers to insist on it from now on.
       Personal data must never travel over plain HTTP. */
    h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  }
  return h;
}

function send(res, status, body, headers) {
  const h = Object.assign(securityHeaders(), headers || {});
  res.writeHead(status, h);
  res.end(body);
}

function json(res, status, obj, headers) {
  send(res, status, JSON.stringify(obj), Object.assign({ "Content-Type": "application/json; charset=utf-8" }, headers || {}));
}

function readBody(req, limit = 512 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("payload too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function clean(value, maxLen = 4000) {
  if (typeof value === "string") return value.slice(0, maxLen);
  if (Array.isArray(value)) return value.slice(0, 60).map((v) => clean(v, 400));
  if (value && typeof value === "object") {
    const out = {};
    Object.keys(value).slice(0, 80).forEach((k) => { out[k] = clean(value[k], maxLen); });
    return out;
  }
  return value;
}

function validate(type, data) {
  const errors = [];
  const email = (data.email || "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);

  if (type === "newsletter") {
    if (!emailOk) errors.push("email");
    return errors;
  }
  if (!emailOk) errors.push("email");

  if (type === "membership") {
    ["vorname", "nachname", "geburtsdatum", "adresse", "plz", "ort"].forEach((f) => {
      if (!String(data[f] || "").trim()) errors.push(f);
    });
    if (data.satzung !== true && data.satzung !== "on") errors.push("satzung");
    if (data.dsgvo !== true && data.dsgvo !== "on") errors.push("dsgvo");
    if (data.beitrag !== true && data.beitrag !== "on") errors.push("beitrag");
  }
  if (type === "volunteer") {
    ["vorname", "nachname", "land"].forEach((f) => {
      if (!String(data[f] || "").trim()) errors.push(f);
    });
    const fields = [].concat(data.bereiche || []);
    if (!fields.length) errors.push("bereiche");
  }
  if (type === "contact") {
    if (!String(data.name || "").trim()) errors.push("name");
    if (String(data.nachricht || "").trim().length < 10) errors.push("nachricht");
  }
  return errors;
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) v = v.join("; ");
  if (typeof v === "object") v = JSON.stringify(v);
  const s = String(v).replace(/"/g, '""');
  /* Guard against spreadsheet formula injection */
  const guarded = /^[=+\-@]/.test(s) ? "'" + s : s;
  return '"' + guarded + '"';
}

function toCSV(records) {
  if (!records.length) return "";
  const keys = [];
  records.forEach((r) => Object.keys(r).forEach((k) => { if (keys.indexOf(k) === -1 && k !== "signature") keys.push(k); }));
  const head = keys.join(",");
  const rows = records.map((r) => keys.map((k) => csvEscape(r[k])).join(","));
  return "﻿" + [head].concat(rows).join("\r\n");
}

/* ------------------------------------------------------------ API routes */
async function handleApi(req, res, pathname, query) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const parts = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);

  /* ---- public: the content the board maintains ---- */
  if (parts[0] === "content" && req.method === "GET") {
    return json(res, 200, readContent(), { "Cache-Control": "no-cache" });
  }

  /* ---- admin ---- */
  if (parts[0] === "admin") {
    if (parts[1] === "login" && req.method === "POST") {
      if (rateLimited("login:" + ip, 8, 5 * 60 * 1000)) return json(res, 429, { error: "too_many_attempts" });
      /* "npjoe-admin" is printed in the README, which is public on GitHub. On
         a live site it is not a password, it is an open door, so we refuse it
         rather than let one forgotten environment variable expose every
         member's address, date of birth and signature. */
      if (IS_PRODUCTION && ADMIN_PASSWORD === "npjoe-admin") {
        console.error("[" + new Date().toISOString() + "] login refused — NPJOE_ADMIN_PASSWORD is still the default");
        return json(res, 503, { error: "default_password_refused" });
      }
      const body = JSON.parse((await readBody(req)) || "{}");
      if (!safeEqual(body.password || "", ADMIN_PASSWORD)) return json(res, 401, { error: "invalid_password" });
      const token = newSession();
      return json(res, 200, { ok: true, token }, {
        "Set-Cookie": "npjoe_admin=" + token + "; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800"
      });
    }
    if (parts[1] === "logout" && req.method === "POST") {
      const m = /npjoe_admin=([a-f0-9]+)/.exec(req.headers.cookie || "");
      if (m) sessions.delete(m[1]);
      return json(res, 200, { ok: true }, { "Set-Cookie": "npjoe_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
    }
    if (!validSession(req)) return json(res, 401, { error: "unauthorised" });

    if (parts[1] === "summary" && req.method === "GET") {
      const summary = {};
      FORM_TYPES.forEach((t) => {
        const rows = readAll(t);
        summary[t] = {
          total: rows.length,
          new: rows.filter((r) => (r.status || "new") === "new").length,
          last7: rows.filter((r) => Date.now() - new Date(r._receivedAt || r._submittedAt || 0).getTime() < 7 * 864e5).length
        };
      });
      return json(res, 200, summary);
    }
    if (parts[1] === "submissions" && req.method === "GET") {
      const type = query.type;
      if (!FORM_TYPES.includes(type)) return json(res, 400, { error: "unknown_type" });
      return json(res, 200, { items: readAll(type).reverse() });
    }
    if (parts[1] === "status" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      if (!FORM_TYPES.includes(body.type)) return json(res, 400, { error: "unknown_type" });
      const rows = readAll(body.type);
      let found = false;
      rows.forEach((r) => {
        if (r._ref === body.ref) {
          r.status = String(body.status || "new").slice(0, 20);
          r.statusChangedAt = new Date().toISOString();
          if (body.note !== undefined) r.note = String(body.note).slice(0, 2000);
          found = true;
        }
      });
      if (!found) return json(res, 404, { error: "not_found" });
      rewrite(body.type, rows);
      return json(res, 200, { ok: true });
    }
    /* ---- content editor ---- */
    if (parts[1] === "content" && req.method === "GET") {
      return json(res, 200, readContent());
    }
    if (parts[1] === "content" && req.method === "POST") {
      let body;
      try {
        body = JSON.parse((await readBody(req, 2 * 1024 * 1024)) || "{}");
      } catch (e) {
        return json(res, 400, { error: "invalid_json" });
      }
      const errors = validateContent(body);
      if (errors.length) return json(res, 422, { error: "validation_failed", fields: errors });
      const saved = writeContent(clean(body, 12000), body._editor);
      console.log("[" + saved.updatedAt + "] content updated by " + saved.updatedBy);
      return json(res, 200, { ok: true, updatedAt: saved.updatedAt });
    }
    if (parts[1] === "content-backups" && req.method === "GET") {
      if (!fs.existsSync(BACKUP_DIR)) return json(res, 200, { items: [] });
      const items = fs.readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".json"))
        .sort().reverse()
        .map((f) => ({ file: f, savedAt: f.replace(/^content-|\.json$/g, "") }));
      return json(res, 200, { items: items });
    }
    if (parts[1] === "content-restore" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const name = path.basename(String(body.file || ""));
      const src = path.join(BACKUP_DIR, name);
      if (!name.endsWith(".json") || !fs.existsSync(src)) return json(res, 404, { error: "not_found" });
      backupContent();
      fs.copyFileSync(src, CONTENT_FILE);
      return json(res, 200, { ok: true });
    }

    /* ---- data-subject requests ---- */
    if (parts[1] === "preflight" && req.method === "GET") {
      let findings = [];
      try { findings = require("./preflight").checks(process.env); } catch (e) {}
      return json(res, 200, {
        findings,
        blockers: findings.filter((f) => f.severity === "blocker").length,
        warnings: findings.filter((f) => f.severity === "warning").length
      });
    }
    if (parts[1] === "notifications" && req.method === "GET") {
      return json(res, 200, {
        configured: !!WEBHOOK_URL,
        host: WEBHOOK_URL ? (function () { try { return new URL(WEBHOOK_URL).host; } catch (e) { return "invalid"; } })() : null,
        recent: notifyLog.slice(0, 20)
      });
    }
    if (parts[1] === "notify-test" && req.method === "POST") {
      const result = await notify("contact", "TEST-" + Date.now().toString(36).toUpperCase());
      return json(res, 200, result);
    }
    if (parts[1] === "mail" && req.method === "GET") {
      return json(res, 200, {
        configured: MAIL.configured,
        host: MAIL.host || null,
        port: MAIL.port,
        secure: MAIL.secure,
        from: MAIL.from || null,
        board: MAIL_BOARD || null,
        acknowledgements: MAIL_ACK,
        boardCopy: MAIL_BOARD_COPY,
        recent: mailLog.slice(0, 20)
      });
    }
    /* Sends one real letter, so a wrong password or a blocked port is found
       here rather than by a member who never got an answer. */
    if (parts[1] === "mail-test" && req.method === "POST") {
      if (!MAIL.configured) return json(res, 400, { error: "smtp_not_configured" });
      const body = JSON.parse((await readBody(req)) || "{}");
      const to = String(body.to || MAIL_BOARD || MAIL.from).trim();
      if (!smtp.EMAIL_RE.test(to)) return json(res, 400, { error: "invalid_recipient" });
      const ref = "TEST-" + Date.now().toString(36).toUpperCase();
      const result = await deliver("test", "contact", ref, {
        to: to,
        subject: "NPJOE — Testnachricht aus dem Vorstandsbereich (" + ref + ")",
        text: "Diese Nachricht bestätigt, dass der Versand über " + MAIL.host + " funktioniert.\n\n" +
              "Absender: " + MAIL.from + "\n" +
              "Referenz: " + ref + "\n" +
              "Gesendet: " + new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }) + "\n\n" +
              "Kommt diese E-Mail an, erhalten auch Antragstellende ihre Eingangsbestätigung.\n"
      });
      return json(res, result.ok ? 200 : 502, result);
    }
    if (parts[1] === "person" && req.method === "GET") {
      const q = String(query.q || "").trim();
      if (q.length < 3) return json(res, 400, { error: "query_too_short" });
      const hits = findPerson(q);
      return json(res, 200, {
        query: q,
        count: hits.length,
        items: hits,
        retainedTypes: RETAINED_TYPES
      });
    }
    if (parts[1] === "person-export" && req.method === "GET") {
      const q = String(query.q || "").trim();
      if (q.length < 3) return json(res, 400, { error: "query_too_short" });
      const hits = findPerson(q);
      const doc = {
        auskunftNach: "Art. 15 DSGVO",
        verantwortlicher: "Nepalesische Progressive Jugendorganisation e.V., VR 84826",
        erstelltAm: new Date().toISOString(),
        betroffenePerson: q,
        hinweis: "Diese Datei enthält alle zu dieser Person gespeicherten Angaben. " +
                 "Technische Felder beginnen mit einem Unterstrich. Die IP-Adresse wird " +
                 "nur pseudonymisiert (Hash) gespeichert.",
        datensaetze: hits
      };
      return send(res, 200, JSON.stringify(doc, null, 2), {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="auskunft-' +
          q.replace(/[^a-z0-9]/gi, "-").slice(0, 40) + "-" + new Date().toISOString().slice(0, 10) + '.json"'
      });
    }
    if (parts[1] === "erase" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)) || "{}");
      const q = String(body.q || "").trim();
      if (q.length < 3) return json(res, 400, { error: "query_too_short" });
      if (body.confirm !== true) return json(res, 400, { error: "confirmation_required" });
      const found = findPerson(q);
      if (!found.length) return json(res, 404, { error: "not_found" });
      const report = erasePerson(q, body.actor);
      console.log("[" + report.at + "] erasure by " + report.actor +
                  " — deleted " + report.deleted.length + ", restricted " + report.restricted.length);
      return json(res, 200, report);
    }
    if (parts[1] === "erasures" && req.method === "GET") {
      const file = path.join(DATA_DIR, "erasures.jsonl");
      if (!fs.existsSync(file)) return json(res, 200, { items: [] });
      const items = fs.readFileSync(file, "utf8").split("\n").filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch (e) { return null; } })
        .filter(Boolean).reverse();
      return json(res, 200, { items });
    }

    if (parts[1] === "export" && req.method === "GET") {
      const type = query.type;
      if (!FORM_TYPES.includes(type)) return json(res, 400, { error: "unknown_type" });
      return send(res, 200, toCSV(readAll(type)), {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="npjoe-' + type + "-" + new Date().toISOString().slice(0, 10) + '.csv"'
      });
    }
    return json(res, 404, { error: "unknown_admin_route" });
  }

  /* ---- public submissions ---- */
  const type = parts[0];
  if (!FORM_TYPES.includes(type)) return json(res, 404, { error: "unknown_form" });
  if (req.method !== "POST") return json(res, 405, { error: "method_not_allowed" });
  if (rateLimited("form:" + ip, RATE_LIMIT, 10 * 60 * 1000)) return json(res, 429, { error: "rate_limited" });

  let data;
  try {
    data = JSON.parse((await readBody(req)) || "{}");
  } catch (e) {
    return json(res, 400, { error: "invalid_json" });
  }
  if (data._hp) return json(res, 200, { ok: true, ref: "IGNORED" }); /* silent honeypot */

  const errors = validate(type, data);
  if (errors.length) return json(res, 422, { error: "validation_failed", fields: errors });

  const record = clean(data);
  record._ref = record._ref || (type.slice(0, 3).toUpperCase() + "-" + new Date().getFullYear() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase());
  record._receivedAt = new Date().toISOString();
  record._ip = crypto.createHash("sha256").update(ip + "npjoe").digest("hex").slice(0, 12); /* pseudonymised */
  record.status = "new";
  if (type === "membership") record.membershipNo = nextMembershipNo();
  if (type === "newsletter") {
    /* Nothing is sent to this address until the owner follows the link. */
    record.status = "pending";
    record._optInToken = crypto.randomBytes(24).toString("hex");
  }

  append(type, record);
  console.log("[" + new Date().toISOString() + "] " + type + " · " + record._ref + (record.membershipNo ? " · " + record.membershipNo : ""));

  /* Fire and forget: the visitor gets their confirmation either way. A mail
     server that is slow, full or simply down must not hold up the response. */
  const base = publicBase(req);
  notify(type, record._ref, record.membershipNo).catch(() => {});
  sendAcknowledgement(type, record, base).catch(() => {});
  sendBoardCopy(type, record, base).catch(() => {});

  return json(res, 200, {
    ok: true, ref: record._ref, membershipNo: record.membershipNo,
    /* The success banner can say "check your inbox" only if we really wrote. */
    acknowledged: MAIL.configured && MAIL_ACK,
    confirmationRequired: type === "newsletter"
  });
}

/* ---------------------------------------------------------- static files */
function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  if (rel.endsWith("/")) rel += "index.html";

  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });

  /* Never expose the server directory (it holds submitted personal data),
     hidden files, or anything outside the published website. */
  const relFromRoot = path.relative(ROOT, filePath).split(path.sep);
  const blocked =
    relFromRoot[0] === "server" ||
    relFromRoot[0] === "node_modules" ||
    relFromRoot.some((seg) => seg.startsWith("."));
  if (blocked) return send(res, 403, "Forbidden", { "Content-Type": "text/plain" });

  /* The board area is handed out by the route below, and only there. Serving
     it from here too would put it back at /admin.html whatever the secret
     path is set to — and answering 403 would confirm it exists, so this looks
     exactly like any other page that is not there. */
  if (relFromRoot.length === 1 && relFromRoot[0].toLowerCase() === "admin.html") {
    return notFound(req, res);
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      /* try .html extension, then 404 page */
      const withHtml = filePath + ".html";
      if (fs.existsSync(withHtml)) return stream(withHtml);
      return notFound(req, res);
    }
    stream(filePath, stat);
  });

  function stream(file, stat) {
    const ext = path.extname(file).toLowerCase();
    const info = stat || fs.statSync(file);
    /* Revalidate on every request so edited CSS/JS reaches visitors immediately,
       while unchanged files still answer with a cheap 304. */
    const etag = '"' + info.size.toString(16) + "-" + info.mtimeMs.toString(16) + '"';
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, Object.assign(securityHeaders(), { ETag: etag, "Cache-Control": "no-cache" }));
      return res.end();
    }
    /* Byte ranges. Safari refuses to play a video at all unless the server
       answers its Range request with a 206, and without ranges every seek in
       any browser re-fetches the clip from the beginning — which matters when
       the gallery carries eleven of them. */
    let start = 0, end = info.size - 1, status = 200;
    const range = req.method === "GET" ? req.headers.range : undefined;
    const m = range ? /^bytes=(\d*)-(\d*)$/.exec(String(range).trim()) : null;
    if (m && (m[1] !== "" || m[2] !== "")) {
      if (m[1] === "") {
        /* suffix form — "the last N bytes" */
        const n = parseInt(m[2], 10);
        start = n >= info.size ? 0 : info.size - n;
      } else {
        start = parseInt(m[1], 10);
        if (m[2] !== "") end = Math.min(parseInt(m[2], 10), info.size - 1);
      }
      if (!(start >= 0) || start > end) {
        res.writeHead(416, Object.assign(securityHeaders(), {
          "Content-Range": "bytes */" + info.size, "Accept-Ranges": "bytes"
        }));
        return res.end();
      }
      status = 206;
    }

    const headers = Object.assign(securityHeaders(), {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
      ETag: etag,
      "Last-Modified": info.mtime.toUTCString(),
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1
    });
    if (status === 206) headers["Content-Range"] = "bytes " + start + "-" + end + "/" + info.size;
    res.writeHead(status, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file, { start, end }).pipe(res);
  }
}

/* The one 404 the whole server uses. A page that is deliberately hidden must
   answer exactly like a page that was never there — a different status, or a
   different body, would confirm the guess. */
function notFound(req, res) {
  const page = path.join(ROOT, "404.html");
  if (fs.existsSync(page)) {
    return send(res, 404, req.method === "HEAD" ? "" : fs.readFileSync(page), {
      "Content-Type": MIME[".html"]
    });
  }
  return send(res, 404, "Not found", { "Content-Type": "text/plain" });
}

/* ---------------------------------------------- newsletter opt-in landing
   The confirmation link lands here. It is generated rather than kept as a
   static file so the result — confirmed, expired, unknown — can be shown on
   the page itself instead of as a query parameter the person has to read. */
function newsletterPage(result) {
  const messages = {
    ok: {
      de: ["Anmeldung bestätigt", "Vielen Dank — Ihre E-Mail-Adresse ist jetzt für den Newsletter bestätigt. Sie können ihn in jeder Ausgabe wieder abbestellen."],
      en: ["Subscription confirmed", "Thank you — your e-mail address is now confirmed for the newsletter. You can cancel it in every issue."]
    },
    already: {
      de: ["Bereits bestätigt", "Diese Anmeldung war schon bestätigt. Sie müssen nichts weiter tun."],
      en: ["Already confirmed", "This subscription was already confirmed. There is nothing else to do."]
    },
    expired: {
      de: ["Der Link ist abgelaufen", "Bestätigungslinks gelten 30 Tage. Bitte melden Sie sich erneut an — Sie erhalten dann einen neuen Link."],
      en: ["This link has expired", "Confirmation links are valid for 30 days. Please sign up again to receive a new one."]
    },
    error: {
      de: ["Der Link ist ungültig", "Vielleicht wurde er beim Kopieren abgeschnitten. Bitte melden Sie sich erneut an oder schreiben Sie uns."],
      en: ["This link is not valid", "It may have been cut short when copying. Please sign up again or write to us."]
    }
  };
  const key = result.ok ? (result.already ? "already" : "ok") : (result.error === "expired" ? "expired" : "error");
  const m = messages[key];
  const good = result.ok;
  return '<!DOCTYPE html>\n<html lang="de" data-lang="de" data-theme="dark">\n<head>\n' +
    '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>" + m.de[0] + " | NPJOE</title>\n" +
    '<meta name="robots" content="noindex">\n' +
    '<link rel="icon" href="assets/img/logo.svg" type="image/svg+xml">\n' +
    '<link rel="stylesheet" href="assets/css/main.css">\n' +
    '<script>(function(){try{var l=localStorage.getItem("npjoe.lang")||((navigator.language||"de").toLowerCase().indexOf("de")===0?"de":"en");' +
    'document.documentElement.setAttribute("data-lang",l);document.documentElement.setAttribute("lang",l);}catch(e){}})();</script>\n' +
    '<script src="assets/js/site.js" defer></script>\n<script src="assets/js/layout.js" defer></script>\n' +
    '<script src="assets/js/main.js" defer></script>\n</head>\n<body data-page="">\n' +
    '<div id="siteHeaderMount"></div>\n<main id="main">\n<section class="section">\n' +
    '<div class="container container-narrow center" style="padding-block:3rem">\n' +
    '<div style="font-size:3rem">' + (good ? "✓" : "!") + "</div>\n" +
    '<h1 class="mt-2"><span data-lang="de">' + m.de[0] + '</span><span data-lang="en">' + m.en[0] + "</span></h1>\n" +
    '<p class="lead mt-3"><span data-lang="de">' + m.de[1] + '</span><span data-lang="en">' + m.en[1] + "</span></p>\n" +
    '<p class="mt-4"><a class="btn btn-lg" href="index.html"><span data-lang="de">Zur Startseite</span>' +
    '<span data-lang="en">Back to the home page</span></a></p>\n' +
    "</div>\n</section>\n</main>\n<div id=\"siteFooterMount\"></div>\n</body>\n</html>\n";
}

/* ------------------------------------------------------------------ boot */
const server = http.createServer((req, res) => {
  /* WHATWG URL rather than the deprecated url.parse(). The base is only
     needed because req.url is a path, not an absolute address. */
  const parsed = new URL(req.url, "http://localhost");
  const pathname = parsed.pathname || "/";
  const query = Object.fromEntries(parsed.searchParams);

  /* Render pings this to decide whether the instance is healthy. It must stay
     cheap and must not touch the data directory. */
  if (pathname === "/healthz") {
    return json(res, 200, {
      ok: true,
      uptimeSeconds: Math.round(process.uptime()),
      dataDir: DATA_DIR,
      persistentStorage: !path.resolve(DATA_DIR).startsWith(path.resolve(__dirname))
    }, { "Cache-Control": "no-store" });
  }

  /* The board area, at whatever secret word NPJOE_ADMIN_PATH names. Both the
     bare path and the .html form answer, because a browser's address bar and
     a bookmark disagree about which one they keep. */
  const asked = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, "").replace(/\.html$/i, "");
  if (asked && asked === ADMIN_PATH) {
    if (req.method !== "GET" && req.method !== "HEAD") return notFound(req, res);
    const page = path.join(ROOT, "admin.html");
    if (!fs.existsSync(page)) return notFound(req, res);
    return send(res, 200, req.method === "HEAD" ? "" : fs.readFileSync(page), {
      "Content-Type": MIME[".html"],
      /* Never cached anywhere, never indexed, and never leaked as a referrer
         to another site — the path is the secret, so it must not travel. */
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Referrer-Policy": "no-referrer"
    });
  }

  /* The link in the first newsletter mail. A plain URL without .html, because
     it is typed into mail clients and read aloud over the phone. */
  if (pathname === "/newsletter-bestaetigen" || pathname === "/newsletter-confirm") {
    const result = confirmNewsletter(String(query.ref || ""), String(query.token || ""));
    return send(res, result.ok ? 200 : 400, newsletterPage(result), {
      "Content-Type": MIME[".html"], "Cache-Control": "no-store"
    });
  }

  if (pathname.startsWith("/api")) {
    handleApi(req, res, pathname, query).catch((err) => {
      console.error("API error:", err.message);
      json(res, 500, { error: "server_error" });
    });
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "Method not allowed", { "Content-Type": "text/plain" });
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, HOST, () => {
  const base = PUBLIC_URL || "http://localhost:" + PORT;
  console.log("\n  NPJOE website running");
  console.log("  ──────────────────────────────────────────");
  console.log("  Site      " + base);
  console.log("  Admin     " + base + "/" + ADMIN_PATH +
              (ADMIN_PATH === "admin" ? "  \x1b[33m(Standardpfad — NPJOE_ADMIN_PATH setzen)\x1b[0m" : ""));
  console.log("  Data      " + DATA_DIR);

  /* On a platform host the working directory is wiped on every deploy. If the
     data still lives inside the app folder, every membership application will
     vanish at the next restart — without any error to notice. */
  const persistent = !path.resolve(DATA_DIR).startsWith(path.resolve(__dirname));
  if (ON_RENDER && !persistent) {
    console.log("\n  \x1b[41m\x1b[97m DATENVERLUST DROHT \x1b[0m");
    console.log("  \x1b[31mDie Daten liegen im flüchtigen Dateisystem und sind nach dem");
    console.log("  nächsten Deploy verloren — samt aller Beitrittserklärungen.");
    console.log("  Abhilfe: In Render einen Disk anlegen (Mount-Pfad /var/data)");
    console.log("  und NPJOE_DATA_DIR=/var/data setzen.\x1b[0m\n");
  }
  console.log("  Password  " + (process.env.NPJOE_ADMIN_PASSWORD
    ? "(from NPJOE_ADMIN_PASSWORD)"
    : IS_PRODUCTION
      ? '\x1b[31mnot set — the board area is LOCKED until NPJOE_ADMIN_PASSWORD is set\x1b[0m'
      : '"npjoe-admin" — change before deploying!'));
  console.log("  Limit     " + RATE_LIMIT + " submissions per IP per 10 minutes");
  console.log("  Alerts    " + (WEBHOOK_URL ? "on → " + (function () { try { return new URL(WEBHOOK_URL).host; } catch (e) { return "invalid URL"; } })() : "off (set NPJOE_WEBHOOK_URL)"));
  console.log("  E-Mail    " + (MAIL.configured
    ? MAIL.from + " via " + MAIL.host + ":" + MAIL.port +
      (MAIL_ACK ? "" : " (Eingangsbestätigungen aus)") +
      (MAIL_BOARD_COPY ? " · Kopie an " + MAIL_BOARD : " (Vorstandskopie aus)")
    : "off (set NPJOE_SMTP_HOST) — niemand erhält eine Eingangsbestätigung"));
  /* Say plainly, at every start, if the site is not fit to be public. */
  try {
    const findings = require("./preflight").checks(process.env);
    const blockers = findings.filter((f) => f.severity === "blocker");
    if (blockers.length) {
      console.log("  \x1b[31m⚠ " + blockers.length + " Blocker vor dem Livegang:\x1b[0m");
      blockers.forEach((b) => console.log("      · " + b.title));
      console.log("    Vollständige Prüfung:  node server/preflight.js");
    } else {
      console.log("  \x1b[32m✓ Prüfung vor dem Livegang bestanden\x1b[0m");
    }
  } catch (e) {}
  console.log("");
});

/* Once at start and once a day afterwards — an association server is often
   restarted more often than it runs for a full day. */
try { pruneUnconfirmedNewsletter(); } catch (e) {}
setInterval(() => { try { pruneUnconfirmedNewsletter(); } catch (e) {} }, 24 * 3600 * 1000).unref();

/* Platform hosts send SIGTERM before replacing an instance. Finish what is in
   flight rather than dropping a half-written submission. */
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => {
    console.log("\n  " + signal + " — Server wird beendet …");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 8000).unref();
  });
});
