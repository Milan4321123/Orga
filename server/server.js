#!/usr/bin/env node
/* ==========================================================================
   NPJOE — Website & submission server
   Zero dependencies: Node's built-in modules only. Start with:

       node server/server.js

   Environment variables (all optional):
       PORT                  default 4173
       NPJOE_ADMIN_PASSWORD  default "npjoe-admin"  (change before deploying)
       NPJOE_DATA_DIR        default server/data
   ========================================================================== */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
       'unsafe-inline' is still needed for the small inline theme/language
       script in every page head and for inline style attributes. */
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

  append(type, record);
  console.log("[" + new Date().toISOString() + "] " + type + " · " + record._ref + (record.membershipNo ? " · " + record.membershipNo : ""));

  /* Fire and forget: the visitor gets their confirmation either way. */
  notify(type, record._ref, record.membershipNo).catch(() => {});

  return json(res, 200, { ok: true, ref: record._ref, membershipNo: record.membershipNo });
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

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      /* try .html extension, then 404 page */
      const withHtml = filePath + ".html";
      if (fs.existsSync(withHtml)) return stream(withHtml);
      const notFound = path.join(ROOT, "404.html");
      if (fs.existsSync(notFound)) {
        return send(res, 404, fs.readFileSync(notFound), { "Content-Type": MIME[".html"] });
      }
      return send(res, 404, "Not found", { "Content-Type": "text/plain" });
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
    const headers = Object.assign(securityHeaders(), {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
      ETag: etag,
      "Last-Modified": info.mtime.toUTCString(),
      "Content-Length": info.size
    });
    res.writeHead(200, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  }
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
  console.log("  Admin     " + base + "/admin.html");
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
  console.log("  Password  " + (process.env.NPJOE_ADMIN_PASSWORD ? "(from NPJOE_ADMIN_PASSWORD)" : '"npjoe-admin" — change before deploying!'));
  console.log("  Limit     " + RATE_LIMIT + " submissions per IP per 10 minutes");
  console.log("  Alerts    " + (WEBHOOK_URL ? "on → " + (function () { try { return new URL(WEBHOOK_URL).host; } catch (e) { return "invalid URL"; } })() : "off (set NPJOE_WEBHOOK_URL)"));
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

/* Platform hosts send SIGTERM before replacing an instance. Finish what is in
   flight rather than dropping a half-written submission. */
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => {
    console.log("\n  " + signal + " — Server wird beendet …");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 8000).unref();
  });
});
