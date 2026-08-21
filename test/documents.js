/* The donation receipt must state the sum in words, so the speller is tested
   hard — a wrong figure on a tax document is a real problem. */
"use strict";
const fs = require("fs");
const path = require("path");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

module.exports = function run() {
  global.window = global.window || {};
  eval(fs.readFileSync(path.join(ROOT, "assets/js/documents.js"), "utf8"));
  const D = global.window.NPJOEDocs;

  group("Amounts in words (German)");
  const cases = [
    [1, "eins Euro"], [2, "zwei Euro"], [7, "sieben Euro"],
    [10, "zehn Euro"], [11, "elf Euro"], [12, "zwölf Euro"], [16, "sechzehn Euro"],
    [20, "zwanzig Euro"], [21, "einundzwanzig Euro"], [30, "dreißig Euro"],
    [42, "zweiundvierzig Euro"], [50, "fünfzig Euro"], [99, "neunundneunzig Euro"],
    [100, "einhundert Euro"], [101, "einhunderteins Euro"], [111, "einhundertelf Euro"],
    [200, "zweihundert Euro"], [345, "dreihundertfünfundvierzig Euro"],
    [1000, "eintausend Euro"], [1001, "eintausendeins Euro"],
    [201, "zweihunderteins Euro"], [301, "dreihunderteins Euro"],
    [1101, "eintausendeinhunderteins Euro"], [2001, "zweitausendeins Euro"],
    [1000000, "eine Million"], [1000001, "eine Million eins"],
    [21, "einundzwanzig Euro"], [31, "einunddreißig Euro"], [91, "einundneunzig Euro"],
    [1234, "eintausendzweihundertvierunddreißig Euro"],
    [25000, "fünfundzwanzigtausend Euro"],
    [8420, "achttausendvierhundertzwanzig Euro"]
  ];
  cases.forEach(([n, expected]) => {
    /* the two million cases check the integer speller, not the euro wrapper */
    const actual = expected.indexOf("Euro") === -1 ? D.integerInWords(n) : D.amountInWords(n);
    eq(n + " €", actual, expected);
  });

  /* Nothing may ever end in a bare "ein" — that was a real bug. */
  let bareEin = [];
  for (let n = 1; n <= 3000; n++) if (/ein$/.test(D.integerInWords(n))) bareEin.push(n);
  eq("no number from 1 to 3000 ends in a bare \"ein\"", bareEin, []);

  group("Amounts with cents");
  eq("0,50 €", D.amountInWords(0.5), "null Euro und fünfzig Cent");
  eq("1,01 €", D.amountInWords(1.01), "eins Euro und eins Cent");
  eq("50,25 €", D.amountInWords(50.25), "fünfzig Euro und fünfundzwanzig Cent");
  eq("1234,56 €", D.amountInWords(1234.56),
     "eintausendzweihundertvierunddreißig Euro und sechsundfünfzig Cent");
  eq("rounding: 19,999 €", D.amountInWords(19.999), "zwanzig Euro");

  group("Amounts are formatted the German way");
  eq("thousands separator and two decimals", D.formatAmount(8420), "8.420,00");
  eq("cents kept", D.formatAmount(1234.5), "1.234,50");
  eq("one euro", D.formatAmount(1), "1,00");

  group("Dates are formatted the German way");
  eq("ISO date", D.formatDate("2026-08-16"), "16.08.2026");
  eq("empty stays empty", D.formatDate(""), "");

  group("Every document template is complete");
  const keys = Object.keys(D.TEMPLATES);
  eq("four documents are offered", keys.sort(), ["donation", "membership", "school", "volunteer"]);
  keys.forEach(k => {
    const t = D.TEMPLATES[k];
    ok(k + ": has a label and fields", !!t.label && Array.isArray(t.fields) && t.fields.length > 0);
    const sample = {};
    t.fields.forEach(f => {
      sample[f.key] = f.type === "number" ? 50 : f.type === "date" ? "2026-08-16" : "Beispielwert";
    });
    let html = "";
    let threw = "";
    try { html = t.render(sample); } catch (e) { threw = e.message; }
    ok(k + ": renders without error", !threw, threw);
    ok(k + ": carries the association letterhead", /Nepalesische Progressive/.test(html));
    ok(k + ": carries signature lines", /doc-sign/.test(html));
    ok(k + ": contains no unresolved placeholder", !/undefined|\[object/.test(html),
       (html.match(/undefined|\[object[^\]]*\]/) || [""])[0]);
  });

  group("The donation receipt carries the legally required wording");
  const receipt = D.TEMPLATES.donation.render({
    donor: "Anisha Gurung", donorAddress: "Beispielweg 12, 64285 Darmstadt",
    amount: 250, donationDate: "2026-07-01", taxOffice: "Finanzamt Darmstadt",
    taxNumber: "007/123/45678", noticeDate: "2026-02-10", purposeYear: "2025"
  });
  ok("names § 10b EStG", /§ 10b des Einkommensteuergesetzes/.test(receipt));
  ok("names § 5 Abs. 1 Nr. 9 KStG", /§ 5 Abs\. 1 Nr\. 9 des Körperschaftsteuergesetzes/.test(receipt));
  ok("states the sum in figures", /250,00 €/.test(receipt));
  ok("states the sum in words", /zweihundertfünfzig Euro/.test(receipt));
  ok("confirms funds are used only for statutory purposes",
     /nur zur Förderung der satzungsmäßigen Zwecke verwendet/.test(receipt));
  ok("states it is not a waiver of expenses",
     /nicht um den Verzicht auf die Erstattung von Aufwendungen/.test(receipt));
  ok("carries the liability notice", /haftet für die entgangene Steuer/.test(receipt));
  ok("carries the five-year validity notice", /länger als 5 Jahre/.test(receipt));
  ok("the template warns the board to have it checked",
     /steuerlich prüfen/.test(D.TEMPLATES.donation.warning || ""));

  group("Certificates state what was actually done");
  const cert = D.TEMPLATES.volunteer.render({
    name: "Bikash Shrestha", field: "Gesundheit & Medizin",
    school: "Shree Secondary School, Gorkha", from: "2026-10-05", to: "2026-10-09", days: 5
  });
  ok("names the volunteer", /Bikash Shrestha/.test(cert));
  ok("names the school", /Shree Secondary School/.test(cert));
  ok("states the period", /vom 05\.10\.2026 bis 09\.10\.2026/.test(cert));
  ok("pluralises the days correctly", /5 Einsatztage/.test(cert));
  const oneDay = D.TEMPLATES.volunteer.render({ name: "A", field: "B", school: "C", from: "2026-10-05", days: 1 });
  ok("a single day reads 'Einsatztag'", /1 Einsatztag(?!e)/.test(oneDay));
  ok("a single day says 'am' not 'vom'", /am 05\.10\.2026/.test(oneDay));
  ok("credits NPYO Nepal", /Nepalese Progressive Youth Organisation/.test(cert));
  ok("cites the resolution", /NPJOE-2026-001/.test(cert));
};

/* ---- the desk that fills documents from stored submissions ---- */
module.exports.desk = function () {
  const fs = require("fs");
  const path = require("path");
  const { group, ok } = require("./lib");
  const src = fs.readFileSync(path.join(path.resolve(__dirname, ".."), "assets/js/admin-docs.js"), "utf8");

  group("Document desk");
  ok("membership documents prefill from stored applications", /state\.type === "membership"/.test(src));
  ok("donation receipts prefill from stored pledges", /state\.type === "donation"/.test(src));
  ok("volunteer field keys are resolved to their proper names",
     /NPJOEContent && window\.NPJOEContent\.FIELDS/.test(src));
  ok("printing is blocked while required fields are empty",
     /btn\.disabled = missing\.length > 0/.test(src));
  ok("a template warning is surfaced to the board", /tpl\.warning/.test(src));
  ok("the school certificate has no stored source to prefill from", /school: null/.test(src));
};
