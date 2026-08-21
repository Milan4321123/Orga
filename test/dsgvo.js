/* Data-subject requests: disclosure, erasure, and the competing tax-retention
   duty that means some records must be restricted rather than deleted. */
"use strict";
const http = require("http");
const { group, ok, eq } = require("./lib");

let PORT, cookie = "";
function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body);
    const r = http.request({ host: "127.0.0.1", port: PORT, path, method,
      headers: Object.assign({ "Content-Type": "application/json",
        "Content-Length": data ? Buffer.byteLength(data) : 0 }, cookie ? { Cookie: cookie } : {}) },
      res => { let raw = ""; res.on("data", c => (raw += c)); res.on("end", () => {
        if (res.headers["set-cookie"]) cookie = res.headers["set-cookie"][0].split(";")[0];
        let json = null; try { json = JSON.parse(raw); } catch (e) {}
        resolve({ status: res.statusCode, body: json, raw, headers: res.headers }); }); });
    r.on("error", reject); if (data) r.write(data); r.end();
  });
}

module.exports = async function run(port, password) {
  PORT = port; cookie = "";
  const EMAIL = "loeschung@example.com";

  /* One person who appears in every form type. */
  await req("POST", "/api/membership", { vorname: "Test", nachname: "Löschung",
    geburtsdatum: "1990-01-01", adresse: "Geheimstr. 9", plz: "64283", ort: "Darmstadt",
    email: EMAIL, satzung: true, dsgvo: true, beitrag: true,
    interessen: ["kultur"], beruf: "Sensibler Beruf", zahlungsintervall: "monatlich" });
  await req("POST", "/api/donation", { name: "Test Löschung", email: EMAIL,
    adresse: "Geheimstr. 9", betrag: "250", zweck: "erste-hilfe", dsgvo: true,
    nachricht: "Eine persönliche Nachricht", zuwendungsbestaetigung: true });
  await req("POST", "/api/volunteer", { vorname: "Test", nachname: "Löschung", email: EMAIL,
    land: "Deutschland", bereiche: ["health"], dsgvo: true, motivation: "Sehr persönliche Motivation" });
  await req("POST", "/api/contact", { name: "Test Löschung", email: EMAIL,
    nachricht: "Eine vertrauliche Anfrage an den Vorstand." });
  await req("POST", "/api/newsletter", { email: EMAIL });

  await req("POST", "/api/admin/login", { password });

  group("Disclosure under Art. 15");
  const tooShort = await req("GET", "/api/admin/person?q=ab");
  eq("a too-short query is refused", tooShort.status, 400);

  const found = await req("GET", "/api/admin/person?q=" + encodeURIComponent(EMAIL));
  eq("the person is found", found.status, 200);
  ok("records from every form type are gathered", found.body.count >= 5, "count " + found.body.count);
  const types = [...new Set(found.body.items.map(i => i.type))].sort();
  eq("all five types appear", types, ["contact", "donation", "membership", "newsletter", "volunteer"]);

  const exp = await req("GET", "/api/admin/person-export?q=" + encodeURIComponent(EMAIL));
  eq("an export can be produced for the person", exp.status, 200);
  ok("it downloads as a file", /attachment/.test(exp.headers["content-disposition"] || ""));
  ok("it names the legal basis", /Art\. 15 DSGVO/.test(exp.raw));
  ok("it names the controller", /VR 84826/.test(exp.raw));
  ok("it contains the actual records", /Geheimstr/.test(exp.raw));

  group("Erasure under Art. 17 — with the tax duty respected");
  const noConfirm = await req("POST", "/api/admin/erase", { q: EMAIL });
  eq("erasure without explicit confirmation is refused", noConfirm.status, 400);

  const report = await req("POST", "/api/admin/erase",
    { q: EMAIL, confirm: true, actor: "Schriftführung" });
  eq("erasure runs", report.status, 200);

  const deletedTypes = report.body.deleted.map(d => d.type).sort();
  const restrictedTypes = report.body.restricted.map(d => d.type).sort();
  eq("contact, volunteer and newsletter are deleted outright",
     [...new Set(deletedTypes)], ["volunteer", "contact", "newsletter"].sort());
  eq("membership and donation are restricted, not deleted",
     [...new Set(restrictedTypes)].sort(), ["donation", "membership"]);

  group("What survives a restriction is only what the law requires");
  const after = await req("GET", "/api/admin/person?q=" + encodeURIComponent(EMAIL));
  const surviving = after.body.items;
  eq("only the two retained records remain", surviving.length, 2);

  const mem = surviving.filter(i => i.type === "membership")[0];
  const don = surviving.filter(i => i.type === "donation")[0];
  ok("the membership record is marked as restricted", mem && mem.record._restricted === true);
  ok("it states why it is kept", /§ 147 AO/.test((mem && mem.record._restrictedReason) || ""));
  ok("it states how long", /^\d{4}$/.test((mem && mem.record._retainUntil) || ""));
  ok("the membership number is kept for the accounts", !!(mem && mem.record.membershipNo));

  /* The point of the exercise: the sensitive fields are gone. */
  ok("the home address is gone", !(mem && mem.record.adresse), JSON.stringify(mem && mem.record.adresse));
  ok("the date of birth is gone", !(mem && mem.record.geburtsdatum));
  ok("the e-mail address is gone", !(mem && mem.record.email));
  ok("stated interests are gone", !(mem && mem.record.interessen));
  ok("the profession is gone", !(mem && mem.record.beruf));
  ok("the donation record keeps the amount", !!(don && don.record.betrag));
  ok("the donor's personal message is gone", !(don && don.record.nachricht));
  ok("the donor's address is gone", !(don && don.record.adresse));

  group("The erasure itself is provable, without keeping the person's address");
  const log = await req("GET", "/api/admin/erasures");
  eq("the log is readable", log.status, 200);
  ok("the erasure was recorded", log.body.items.length >= 1);
  const entry = log.body.items[0];
  ok("it records who acted", entry.actor === "Schriftführung", String(entry.actor));
  ok("it records the counts", entry.deleted === 3 && entry.restricted === 2,
     JSON.stringify({ d: entry.deleted, r: entry.restricted }));
  ok("the person is identified only by a one-way hash",
     /^[a-f0-9]{16}$/.test(entry.subject) && !/@/.test(JSON.stringify(entry)), JSON.stringify(entry));

  group("Erasure is idempotent and scoped");
  const again = await req("POST", "/api/admin/erase", { q: EMAIL, confirm: true, actor: "X" });
  ok("a second erasure finds only the restricted records", again.status === 200 || again.status === 404);
  const other = await req("GET", "/api/admin/person?q=" + encodeURIComponent("niemand@example.com"));
  eq("an unknown person yields nothing", other.body.count, 0);
  const unrelated = await req("POST", "/api/admin/erase", { q: "niemand@example.com", confirm: true });
  eq("erasing an unknown person is a 404, not a silent success", unrelated.status, 404);

  group("Data-subject routes require a session");
  cookie = "";
  const noAuth = await req("GET", "/api/admin/person?q=" + encodeURIComponent(EMAIL));
  eq("disclosure needs a session", noAuth.status, 401);
  const noAuthErase = await req("POST", "/api/admin/erase", { q: EMAIL, confirm: true });
  eq("erasure needs a session", noAuthErase.status, 401);
};
