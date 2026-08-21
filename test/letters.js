/* Reply templates: the letter must carry the facts the board would otherwise
   forget, and must be written in the language the person asked for. */
"use strict";
const fs = require("fs");
const path = require("path");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

module.exports = function run() {
  global.window = global.window || {};
  /* site.js first, so the templates can read the association's details */
  eval(fs.readFileSync(path.join(ROOT, "assets/js/site.js"), "utf8"));
  eval(fs.readFileSync(path.join(ROOT, "assets/js/correspondence.js"), "utf8"));
  const L = global.window.NPJOELetters;

  const member = {
    _ref: "MIT-2026-AB12", _lang: "de", vorname: "Anisha", nachname: "Gurung",
    email: "anisha@example.com", membershipNo: "NPJOE-2026-0007"
  };

  group("A letter exists for every decision the board makes");
  eq("membership offers accept, query and decline",
     L.forType("membership").sort(),
     ["general-reply", "membership-accepted", "membership-declined", "membership-more-info"]);
  ok("volunteers get a confirmation and a matching offer",
     L.forType("volunteer").includes("volunteer-received") && L.forType("volunteer").includes("volunteer-matched"));
  ok("donors get an acknowledgement", L.forType("donation").includes("donation-thanks"));
  ok("every form type has at least one template",
     ["membership", "volunteer", "donation", "contact", "partner", "newsletter"]
       .every(t => L.forType(t).length >= 1));

  group("The acceptance letter carries what the member needs");
  const accept = L.build("membership-accepted", member);
  ok("it is addressed to the person", /Liebe:r Anisha Gurung/.test(accept.body));
  ok("it states the membership number", accept.body.includes("NPJOE-2026-0007"));
  ok("it states the monthly fee", /5,00 EUR/.test(accept.body));
  ok("it gives the payment reference", /Verwendungszweck: NPJOE-2026-0007/.test(accept.body));
  ok("it cites the statute the decision rests on", /§ 5/.test(accept.body));
  ok("it mentions the voting right", /§ 9/.test(accept.body));
  ok("it goes to the person's address", accept.to === "anisha@example.com");
  ok("the subject is filled in", accept.subject.length > 10);
  ok("it is signed by the board", /Der Vorstand/.test(accept.body));

  group("The letter follows the language the person asked for");
  const en = L.build("membership-accepted", Object.assign({}, member, { antwortsprache: "englisch" }));
  ok("an English request produces an English letter",
     /Dear Anisha Gurung/.test(en.body) && /Membership number/.test(en.body), en.body.slice(0, 60));
  ok("and an English subject", /Welcome to NPJOE/.test(en.subject));
  const nep = L.build("membership-accepted", Object.assign({}, member, { antwortsprache: "nepali" }));
  eq("Nepali speakers get the German letter, since no Nepali version exists yet", nep.lang, "de");
  const byBrowser = L.build("general-reply", { _ref: "X", _lang: "en", email: "a@b.de" });
  eq("otherwise the language they browsed in is used", byBrowser.lang, "en");

  group("The donation letter carries the payment details");
  const don = L.build("donation-thanks", {
    _ref: "SPE-2026-99", _lang: "de", name: "Ram Thapa", email: "ram@example.com",
    betrag: "250", zuwendungsbestaetigung: true
  });
  ok("it names the amount", don.body.includes("250"));
  ok("it gives the reference for the transfer", /Verwendungszweck: SPE-2026-99/.test(don.body));
  ok("it promises the receipt that was requested", /Zuwendungsbestätigung/.test(don.body));
  const donNoReceipt = L.build("donation-thanks", { _ref: "X", name: "A", email: "a@b.de", betrag: "10" });
  ok("and stays silent about it when none was requested",
     !/Zuwendungsbestätigung/.test(donNoReceipt.body));
  ok("a custom amount is used when chosen",
     L.build("donation-thanks", { _ref: "Y", email: "a@b.de", betrag: "custom", betragCustom: "137" })
      .body.includes("137"));

  group("The volunteer letter explains what happens next");
  const vol = L.build("volunteer-received", {
    _ref: "VOL-2026-5", vorname: "Bikash", nachname: "Shrestha",
    email: "b@example.com", bereiche: ["health", "education"], land: "Australien"
  });
  ok("it lists the chosen fields", /health, education/.test(vol.body));
  ok("it names the partner who does the matching", /NPYO Nepal/.test(vol.body));
  ok("it promises the certificate", /Zertifikat/.test(vol.body));
  ok("it says the registration is non-binding", /unverbindlich/.test(vol.body));

  group("Letters are usable in a mail client");
  Object.keys(L.TEMPLATES).forEach(key => {
    const row = { _ref: "REF-1", email: "a@b.de", vorname: "Test", nachname: "Person",
                  membershipNo: "NPJOE-2026-0001", betrag: "50", bereiche: ["health"] };
    const letter = L.build(key, row);
    ok(key + ": has subject and body", !!letter.subject && letter.body.length > 80);
    ok(key + ": leaves no unresolved placeholder",
       !/undefined|\[object/.test(letter.subject + letter.body));
  });
  const long = L.build("membership-accepted", member);
  const link = L.mailtoLink(long);
  ok("a short letter becomes a mailto link", link === null || link.indexOf("mailto:") === 0);
  const huge = { to: "a@b.de", subject: "x", body: "y".repeat(3000) };
  eq("an over-long letter is not forced into a mailto link", L.mailtoLink(huge), null);

  group("Bracketed spots mark what the board must still write");
  ["membership-more-info", "membership-declined", "volunteer-matched", "general-reply"].forEach(k => {
    const letter = L.build(k, member);
    ok(k + ": marks the passage to complete", /\[[^\]]+\]/.test(letter.body));
  });
  ok("the acceptance letter needs no editing at all",
     !/\[[^\]]+\]/.test(L.build("membership-accepted", member).body));
};
