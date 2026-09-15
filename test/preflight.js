/* The go-live check is only useful if it both fires on real placeholders and
   goes quiet once they are filled. Both directions are tested here against a
   throwaway copy of the site, so the real files are never touched. */
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

module.exports = function run() {
  const pre = require(path.join(ROOT, "server", "preflight.js"));

  group("Go-live check catches the dangerous defaults");
  const asShipped = pre.checks({});
  const ids = asShipped.map(f => f.id);
  const blockers = asShipped.filter(f => f.severity === "blocker").map(f => f.id);

  ok("the default admin password is a blocker", blockers.includes("admin-password"));
  ok("the placeholder IBAN is a blocker", blockers.includes("iban"));
  ok("the IBAN hard-coded in the donation page is a blocker", blockers.includes("iban-page"));
  ok("the missing imprint address is a blocker", blockers.includes("impressum-address"));
  ok("the missing privacy address is a blocker", blockers.includes("privacy-address"));
  ok("missing alerts are a warning, not a blocker",
     ids.includes("no-alerts") && !blockers.includes("no-alerts"));
  ok("placeholder impact figures are flagged", ids.includes("placeholder-figures"));
  ok("every finding says how to fix it", asShipped.every(f => f.fix && f.fix.length > 20));
  ok("every finding says why it matters", asShipped.every(f => f.detail && f.detail.length > 30));

  group("A strong password and a real webhook clear their findings");
  const withEnv = pre.checks({
    NPJOE_ADMIN_PASSWORD: "ein-langes-eigenes-passwort-2026",
    NPJOE_WEBHOOK_URL: "https://hooks.example.com/npjoe"
  }).map(f => f.id);
  ok("the password finding disappears", !withEnv.includes("admin-password"));
  ok("the alert finding disappears", !withEnv.includes("no-alerts"));
  ok("but the IBAN finding remains", withEnv.includes("iban"));

  group("With every placeholder filled, the check goes quiet");
  /* Copy the site, fill in the placeholders, and run the check against it. */
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "npjoe-live-"));
  const copy = (rel) => {
    const dest = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), dest);
    return dest;
  };
  ["assets/js/site.js", "impressum.html", "datenschutz.html", "spenden.html",
   "galerie.html", "server/preflight.js"].forEach(copy);

  const patch = (rel, pairs) => {
    const f = path.join(tmp, rel);
    let t = fs.readFileSync(f, "utf8");
    pairs.forEach(([from, to]) => { t = t.split(from).join(to); });
    fs.writeFileSync(f, t, "utf8");
  };
  patch("assets/js/site.js", [
    ['iban: "DE00 0000 0000 0000 0000 00"', 'iban: "DE89 3704 0044 0532 0130 00"'],
    ["schoolsReached: 12", "schoolsReached: 3"],
    ["volunteers: 214", "volunteers: 41"],
    ['email: "info@progressive-youth.de"', 'email: "vorstand@npjoe-verein.de"']
  ]);
  patch("impressum.html", [
    ["— Straße und Hausnummer —", "Musterstraße 14"],
    ["— street and number —", "Musterstraße 14"],
    ["Telefon: — bitte ergänzen —", "Telefon: +49 6151 123456"],
    ["Steuernummer und Freistellungsbescheid des zuständigen Finanzamts: — bitte ergänzen —",
     "Steuernummer 007/123/45678, Freistellungsbescheid vom 10.02.2026"]
  ]);
  patch("datenschutz.html", [["— Anschrift —", "Musterstraße 14"]]);
  patch("spenden.html", [["DE00 0000 0000 0000 0000 00", "DE89 3704 0044 0532 0130 00"]]);
  patch("galerie.html", [["Platzhaltergrafiken", "Fotos"], ["placeholder graphics", "photos"]]);

  const cleanCheck = require(path.join(tmp, "server", "preflight.js"));
  const clean = cleanCheck.checks({
    NPJOE_ADMIN_PASSWORD: "ein-langes-eigenes-passwort-2026",
    NPJOE_ADMIN_PATH: "vorstand-9f2c71a4b8",
    NPJOE_WEBHOOK_URL: "https://hooks.example.com/npjoe",
    NPJOE_SMTP_HOST: "smtp.example.com",
    NPJOE_SMTP_USER: "vorstand@npjoe-verein.de",
    NPJOE_SMTP_PASS: "postfach-passwort",
    NPJOE_MAIL_FROM: "vorstand@npjoe-verein.de",
    NPJOE_PUBLIC_URL: "https://www.npjoe-verein.de"
  });
  eq("no findings remain on a fully prepared site", clean.map(f => f.id + " (" + f.severity + ")"), []);

  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}

  group("Findings are reported in a usable shape");
  ok("each has a severity we understand",
     asShipped.every(f => ["blocker", "warning", "note"].includes(f.severity)));
  ok("each has a stable id for the admin panel", asShipped.every(f => /^[a-z-]+$/.test(f.id)));
  ok("ids are unique", new Set(ids).size === ids.length);
};
