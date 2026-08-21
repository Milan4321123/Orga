#!/usr/bin/env node
/* ==========================================================================
   NPJOE — go-live check

       node server/preflight.js

   Looks for the placeholders and defaults that are dangerous once the site is
   public. Two of them are silent failures: a default admin password exposes
   every member's address, and a placeholder IBAN sends donations nowhere.
   ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const read = (rel) => {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch (e) { return ""; }
};

/* severity: "blocker" stops a launch, "warning" should be settled first,
   "note" is worth knowing but not dangerous. */
function checks(env) {
  env = env || process.env;
  const site = read("assets/js/site.js");
  const found = [];

  const add = (severity, id, title, detail, fix) =>
    found.push({ severity, id, title, detail, fix });

  /* ---- the two silent disasters ---- */
  if (!env.NPJOE_ADMIN_PASSWORD || env.NPJOE_ADMIN_PASSWORD === "npjoe-admin") {
    add("blocker", "admin-password",
      "Das Vorstandspasswort ist noch das voreingestellte",
      "Mit „npjoe-admin“ kann jede Person die Beitrittserklärungen samt Anschriften, " +
      "Geburtsdaten und Unterschriften lesen und Inhalte der Website ändern.",
      "Server mit NPJOE_ADMIN_PASSWORD='ein langes eigenes Passwort' starten.");
  }

  const ibanMatch = /iban:\s*"([^"]*)"/.exec(site);
  const iban = ibanMatch ? ibanMatch[1].replace(/\s+/g, "") : "";
  if (!iban || /^DE0{2}0+$/.test(iban) || /^DE000000/.test(iban)) {
    add("blocker", "iban",
      "Die IBAN ist noch ein Platzhalter",
      "Auf der Spendenseite steht " + (ibanMatch ? '"' + ibanMatch[1] + '"' : "keine IBAN") +
      ". Überweisungen von Spender:innen kommen damit nirgends an, und niemand merkt es.",
      "IBAN und BIC in assets/js/site.js eintragen — oder im Vorstandsbereich unter „Inhalte pflegen“.");
  }
  const stillInPage = /DE00 0000 0000 0000 0000 00/.test(read("spenden.html"));
  if (stillInPage) {
    add("blocker", "iban-page",
      "Die Platzhalter-IBAN steht auch fest in spenden.html",
      "Selbst wenn site.js gepflegt ist, zeigt die Spendenseite noch die Platzhalternummer.",
      "In spenden.html die beiden Stellen mit DE00 … ersetzen.");
  }

  /* ---- legally required, publicly visible ---- */
  const impressum = read("impressum.html");
  if (/— Straße und Hausnummer —|— street and number —/.test(impressum)) {
    add("blocker", "impressum-address",
      "Im Impressum fehlt die Anschrift",
      "§ 5 DDG verlangt eine ladungsfähige Anschrift. Ein unvollständiges Impressum ist abmahnfähig.",
      "Straße, Hausnummer und Telefonnummer in impressum.html eintragen.");
  }
  if (/Telefon: — bitte ergänzen —/.test(impressum)) {
    add("warning", "impressum-phone", "Im Impressum fehlt die Telefonnummer",
      "§ 5 DDG verlangt eine schnelle elektronische Kontaktaufnahme; eine Telefonnummer wird üblicherweise erwartet.",
      "Telefonnummer in impressum.html eintragen.");
  }
  if (/Steuernummer und Freistellungsbescheid[^<]*bitte ergänzen/.test(impressum)) {
    add("warning", "tax-number", "Steuernummer und Freistellungsbescheid fehlen",
      "Ohne diese Angaben lässt sich keine gültige Zuwendungsbestätigung ausstellen.",
      "Angaben in impressum.html ergänzen und im Dokumentengenerator eintragen.");
  }
  if (/— Anschrift —/.test(read("datenschutz.html"))) {
    add("blocker", "privacy-address",
      "In der Datenschutzerklärung fehlt die Anschrift des Verantwortlichen",
      "Art. 13 DSGVO verlangt Name und Kontaktdaten des Verantwortlichen.",
      "Anschrift in datenschutz.html, Abschnitt 1, eintragen.");
  }

  /* ---- hosting ---- */
  const onPlatform = !!(env.RENDER || env.RENDER_SERVICE_NAME);
  const dataDir = env.NPJOE_DATA_DIR || "";
  const insideApp = !dataDir || dataDir.startsWith("./") || dataDir.startsWith("server");
  if (onPlatform && insideApp) {
    add("blocker", "ephemeral-data",
      "Die Daten liegen im flüchtigen Dateisystem",
      "Auf Render wird das Dateisystem bei jedem Deploy zurückgesetzt. Beitrittserklärungen, " +
      "Spendenzusagen und gepflegte Inhalte wären nach dem nächsten Deploy spurlos verschwunden — " +
      "ohne Fehlermeldung.",
      "In Render einen Disk anlegen (Mount-Pfad /var/data) und NPJOE_DATA_DIR=/var/data setzen. " +
      "Die mitgelieferte render.yaml tut beides bereits.");
  }
  if (onPlatform && env.NODE_ENV !== "production") {
    add("note", "node-env",
      "NODE_ENV steht nicht auf production",
      "Ohne diese Angabe wird der HSTS-Header nicht gesetzt, der Browser zwingt, künftig nur noch " +
      "über HTTPS zuzugreifen.",
      "In Render NODE_ENV=production setzen.");
  }

  /* ---- operational ---- */
  if (!env.NPJOE_WEBHOOK_URL) {
    add("warning", "no-alerts",
      "Es gibt keine Benachrichtigung bei neuen Eingängen",
      "Beitrittserklärungen und Anfragen bleiben liegen, bis sich jemand anmeldet. " +
      "Die Website sagt eine Antwort in ein bis drei Werktagen zu.",
      "Server mit NPJOE_WEBHOOK_URL=… starten (Slack, Discord, Telegram-Relay).");
  }

  const figures = /impact:\s*\{([^}]*)\}/.exec(site);
  if (figures && /schoolsReached:\s*12\b/.test(figures[1]) && /volunteers:\s*214\b/.test(figures[1])) {
    add("warning", "placeholder-figures",
      "Die Wirkungszahlen sind noch die Planungswerte",
      "12 Schulen, 214 Volunteers, 1.450 Schüler:innen stehen als Tatsachen auf der Startseite, " +
      "im Transparenzbericht und in der Erste-Hilfe-Kampagne.",
      "Im Vorstandsbereich unter „Inhalte pflegen“ auf belegbare Zahlen setzen — oder die Abschnitte entfernen, solange keine vorliegen.");
  }

  if (/Platzhaltergrafiken|placeholder graphics/.test(read("galerie.html"))) {
    add("note", "gallery-placeholders",
      "Die Galerie zeigt erzeugte Platzhalter",
      "Das ist ehrlich gekennzeichnet, wirkt aber leer.",
      "Fotos einsetzen, sobald Einwilligungen der abgebildeten Personen vorliegen.");
  }

  const org = /email:\s*"([^"]*)"/.exec(site);
  if (org && /@progressive-youth\.de$/.test(org[1])) {
    add("note", "mailboxes",
      "Vier Postfächer müssen beim Hoster existieren",
      "info@, mitglied@, volunteer@ und spenden@progressive-youth.de werden auf der Website genannt. " +
      "Formulare im Offline-Modus schreiben dorthin.",
      "Postfächer einrichten oder die Adressen in assets/js/site.js ändern.");
  }

  return found;
}

function report(found) {
  const order = { blocker: 0, warning: 1, note: 2 };
  const label = { blocker: "\x1b[31mBLOCKER\x1b[0m", warning: "\x1b[33mWARNUNG\x1b[0m", note: "\x1b[36mHINWEIS\x1b[0m" };
  found.sort((a, b) => order[a.severity] - order[b.severity]);

  console.log("\n\x1b[1mNPJOE — Prüfung vor dem Livegang\x1b[0m\n");
  if (!found.length) {
    console.log("  \x1b[32mAlles erledigt. Nichts steht der Veröffentlichung im Weg.\x1b[0m\n");
    return 0;
  }
  found.forEach((f) => {
    console.log("  " + label[f.severity] + "  " + f.title);
    console.log("            " + f.detail);
    console.log("            \x1b[2m→ " + f.fix + "\x1b[0m\n");
  });
  const blockers = found.filter((f) => f.severity === "blocker").length;
  const warnings = found.filter((f) => f.severity === "warning").length;
  console.log("  " + blockers + " Blocker · " + warnings + " Warnungen · " +
              (found.length - blockers - warnings) + " Hinweise\n");
  if (blockers) console.log("  \x1b[31mNicht veröffentlichen, solange Blocker offen sind.\x1b[0m\n");
  return blockers ? 1 : 0;
}

module.exports = { checks, report };

if (require.main === module) process.exit(report(checks(process.env)));
