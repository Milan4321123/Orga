/* ==========================================================================
   NPJOE — automatic acknowledgements
   Every form on the site promises an answer in one to three working days.
   Until now nothing confirmed that the form had arrived at all, so a person
   who filled in a membership application saw a success banner and then heard
   nothing — and had no reference number to ask about.

   These letters close that gap. They are deliberately modest: they confirm
   receipt, state the reference, say what happens next, and say nothing the
   board has not yet decided. An application is not an admission (§ 5 of the
   statutes), and an acknowledgement must never read like one.

   Text is plain, in the language the visitor was reading the site in.
   ========================================================================== */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

/* ------------------------------------------------------- association data
   site.js is the single place where the association's details live. Reading
   it here — rather than copying the address, the fee and the IBAN into a
   second file — means a change in one place still reaches the letters. */

const FALLBACK_ORG = {
  nameDe: "Nepalesische Progressive Jugendorganisation e.V.",
  nameEn: "Nepalese Progressive Youth Organisation (Germany)",
  website: "www.progressive-youth.de",
  email: "info@progressive-youth.de",
  emailMembership: "info@progressive-youth.de",
  emailVolunteer: "info@progressive-youth.de",
  emailDonation: "info@progressive-youth.de",
  register: "VR 84826 – Amtsgericht Darmstadt",
  fee: { monthly: 5, currency: "EUR" },
  bank: {}
};

let cached = null;

function readSiteOrg() {
  if (cached) return cached;
  try {
    const source = fs.readFileSync(path.join(ROOT, "assets/js/site.js"), "utf8");
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { timeout: 1000 });
    cached = (sandbox.window.NPJOE && sandbox.window.NPJOE.org) || FALLBACK_ORG;
  } catch (e) {
    /* A syntax error in site.js must not stop the server from sending mail. */
    cached = FALLBACK_ORG;
  }
  return cached;
}

/* The board may have corrected the bank details or the address in the admin
   area; those overrides live in content.json and win over the file. */
function org(overrides) {
  const base = readSiteOrg();
  const merged = Object.assign({}, FALLBACK_ORG, base, overrides || {});
  merged.bank = Object.assign({}, base.bank, (overrides || {}).bank);
  merged.fee = Object.assign({}, FALLBACK_ORG.fee, base.fee, (overrides || {}).fee);
  return merged;
}

/* --------------------------------------------------------------- helpers */

function nameOf(row) {
  return [row.vorname, row.nachname].filter(Boolean).join(" ").trim() || String(row.name || "").trim();
}

/* The person's explicit wish wins over the language they were browsing in.
   All three languages of the site have their own letters. */
function langOf(row) {
  if (row.antwortsprache === "englisch") return "en";
  if (row.antwortsprache === "nepali") return "ne";
  if (row.antwortsprache === "deutsch") return "de";
  if (row._lang === "en") return "en";
  if (row._lang === "ne") return "ne";
  return "de";
}

function greeting(row, lang) {
  const n = nameOf(row);
  if (lang === "ne") return n ? "आदरणीय " + n + "," : "नमस्ते,";
  if (lang === "en") return n ? "Dear " + n + "," : "Hello,";
  return n ? "Liebe:r " + n + "," : "Hallo,";
}

function bankBlock(o, reference, lang) {
  if (!o.bank || !o.bank.iban) return "";
  const label = lang === "ne"
    ? ["खातावाला", "IBAN", "BIC", "भुक्तानी सन्दर्भ"]
    : lang === "en"
      ? ["Account holder", "IBAN", "BIC", "Reference"]
      : ["Kontoinhaber", "IBAN", "BIC", "Verwendungszweck"];
  return label[0] + ": " + (o.bank.holder || o.nameDe) + "\n" +
    label[1] + ": " + o.bank.iban + "\n" +
    (o.bank.bic ? label[2] + ": " + o.bank.bic + "\n" : "") +
    label[3] + ": " + reference + "\n";
}

function signature(o, lang, mailbox) {
  const site = "https://" + String(o.website || "").replace(/^https?:\/\//, "");
  return (lang === "ne" ? "हार्दिक शुभकामना\nकार्यसमिति\n"
    : lang === "en" ? "Kind regards\nThe board\n" : "Herzliche Grüße\nDer Vorstand\n") +
    o.nameDe + "\n" + (mailbox || o.email) + "\n" + site +
    (o.register ? "\n" + o.register : "");
}

/* Every acknowledgement carries the Art. 13/15 pointers, because this letter
   is often the only piece of the privacy policy a person actually reads. */
function footer(o, lang) {
  const site = "https://" + String(o.website || "").replace(/^https?:\/\//, "");
  if (lang === "ne") {
    return "\n\n—\n" + o.website + " मा एउटा फारम पठाइएकाले तपाईंले यो सन्देश पाउनुभएको हो।\n" +
      "तपाईं यसै इमेलमा सिधै जवाफ दिन सक्नुहुन्छ।\n" +
      "तपाईंको कुन विवरण हामीसँग छ भनी जुनसुकै बेला सोध्न र त्यो मेटाउन अनुरोध गर्न सक्नुहुन्छ: " + o.email + "\n" +
      "गोपनीयता नीति: " + site + "/datenschutz.html\n";
  }
  if (lang === "en") {
    return "\n\n—\nYou are receiving this message because a form was submitted on " + o.website + ".\n" +
      "You may reply to this e-mail directly.\n" +
      "You can ask at any time what we hold about you and request its deletion: " + o.email + "\n" +
      "Privacy policy: " + site + "/datenschutz.html\n";
  }
  return "\n\n—\nSie erhalten diese Nachricht, weil auf " + o.website + " ein Formular abgeschickt wurde.\n" +
    "Sie können auf diese E-Mail direkt antworten.\n" +
    "Sie können jederzeit Auskunft über Ihre gespeicherten Daten verlangen und deren Löschung beantragen: " + o.email + "\n" +
    "Datenschutzerklärung: " + site + "/datenschutz.html\n";
}

/* ------------------------------------------------------------- the letters
   ctx = { org: <content overrides>, confirmUrl: <newsletter opt-in link> } */

const LETTERS = {
  membership: function (row, lang, o, ctx) {
    const fee = (o.fee && o.fee.monthly) || 5;
    if (lang === "ne") {
      return {
        subject: "तपाईंको सदस्यता आवेदन प्राप्त भयो — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          o.nameDe + " मा सदस्यताका लागि आवेदन दिनुभएकामा धन्यवाद — यो हामीकहाँ आइपुगेको र दर्ता भएको छ।\n\n" +
          "सन्दर्भ: " + row._ref + "\n" +
          (row.membershipNo ? "अस्थायी सदस्यता नम्बर: " + row.membershipNo + "\n" : "") +
          "\nअब के हुन्छ: सदस्यता स्वीकृतिको निर्णय हाम्रो विधानको § ५ अनुसार कार्यसमितिले गर्छ। " +
          "हामी एकदेखि तीन कार्यदिनभित्र तपाईंलाई जानकारी गराउनेछौँ — र जुनसुकै अवस्थामा कुनै भुक्तानी तिर्नुअघि नै।\n\n" +
          "कृपया अहिले नै स्थायी भुक्तानी आदेश नराख्नुहोस्। मासिक " + fee + ".00 " +
          ((o.fee && o.fee.currency) || "EUR") + " शुल्क कार्यसमितिले सदस्यता स्वीकृत गरेपछि मात्र सुरु हुन्छ; " +
          "स्वीकृति पत्रमै खाता विवरण र भुक्तानी सन्दर्भ हुनेछ।\n\n" +
          "तपाईंको आवेदनमा केही गलत भएको भए सन्दर्भ नम्बर उल्लेख गरी यसै सन्देशमा जवाफ दिनुहोस्।\n\n" +
          signature(o, lang, o.emailMembership) + footer(o, lang)
      };
    }
    if (lang === "en") {
      return {
        subject: "Your membership application has arrived — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "thank you for your application to join the " + o.nameEn + " — it has arrived and is recorded.\n\n" +
          "Reference: " + row._ref + "\n" +
          (row.membershipNo ? "Provisional membership number: " + row.membershipNo + "\n" : "") +
          "\nWhat happens next: the board decides on admission under § 5 of our statutes. " +
          "We will write to you within one to three working days — and in any case before your first payment is due.\n\n" +
          "Please do not set up a standing order yet. The monthly fee of " + fee + ".00 " +
          ((o.fee && o.fee.currency) || "EUR") + " begins only once the board has admitted you; " +
          "the letter of admission will carry the account details and the payment reference.\n\n" +
          "If anything in your application was wrong, simply reply to this message quoting the reference.\n\n" +
          signature(o, lang, o.emailMembership) + footer(o, lang)
      };
    }
    return {
      subject: "Ihre Beitrittserklärung ist eingegangen — " + row._ref,
      text: greeting(row, lang) + "\n\n" +
        "vielen Dank für Ihre Beitrittserklärung an die " + o.nameDe + " — sie ist bei uns eingegangen und erfasst.\n\n" +
        "Referenz: " + row._ref + "\n" +
        (row.membershipNo ? "Vorläufige Mitgliedsnummer: " + row.membershipNo + "\n" : "") +
        "\nWie es weitergeht: Über die Aufnahme entscheidet der Vorstand nach § 5 unserer Satzung. " +
        "Wir melden uns innerhalb von ein bis drei Werktagen bei Ihnen — in jedem Fall, bevor eine Zahlung fällig wird.\n\n" +
        "Bitte richten Sie noch keinen Dauerauftrag ein. Der Monatsbeitrag von " + fee + ",00 " +
        ((o.fee && o.fee.currency) || "EUR") + " beginnt erst mit der Aufnahme durch den Vorstand; " +
        "das Aufnahmeschreiben enthält die Kontoverbindung und den Verwendungszweck.\n\n" +
        "Sollte in Ihrer Erklärung etwas nicht stimmen, antworten Sie einfach auf diese Nachricht und nennen Sie die Referenz.\n\n" +
        signature(o, lang, o.emailMembership) + footer(o, lang)
    };
  },

  volunteer: function (row, lang, o) {
    if (lang === "ne") {
      return {
        subject: "तपाईंको स्वयंसेवक दर्ता प्राप्त भयो — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "One Day for Nation मा दर्ता गर्नुभएकामा धन्यवाद। तपाईंको दर्ता हामीकहाँ आइपुगेको छ।\n\n" +
          "सन्दर्भ: " + row._ref + "\n" +
          "\nदर्ता निःशुल्क र बाध्यकारी हुँदैन। नेपालमा रहेको हाम्रो साझेदार संस्था NPYS-N ले कहाँ सहयोग चाहिएको छ भन्ने जानकारी दिन्छ; " +
          "तपाईंको क्षेत्रसँग मिल्ने केही आएमा हामी ठोस परिचालनसहित तपाईंलाई लेख्नेछौँ। " +
          "सहभागी हुने कि नहुने भन्ने निर्णय त्यसपछि मात्र तपाईंले गर्नुहुन्छ।\n\n" +
          "हामी एकदेखि तीन कार्यदिनभित्र सम्पर्क गर्नेछौँ।\n\n" +
          signature(o, lang, o.emailVolunteer) + footer(o, lang)
      };
    }
    if (lang === "en") {
      return {
        subject: "Your volunteer registration has arrived — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "thank you for registering for One Day for Nation. Your registration has arrived.\n\n" +
          "Reference: " + row._ref + "\n" +
          "\nRegistration is free and non-binding. Our partner organisation NPYS-N in Nepal reports " +
          "where help is needed; when something matches your field we will write to you with the " +
          "concrete assignment. Only then do you decide whether to take part.\n\n" +
          "We will come back to you within one to three working days.\n\n" +
          signature(o, lang, o.emailVolunteer) + footer(o, lang)
      };
    }
    return {
      subject: "Ihre Volunteer-Registrierung ist eingegangen — " + row._ref,
      text: greeting(row, lang) + "\n\n" +
        "vielen Dank für Ihre Registrierung bei One Day for Nation. Ihre Anmeldung ist bei uns eingegangen.\n\n" +
        "Referenz: " + row._ref + "\n" +
        "\nDie Registrierung ist kostenlos und unverbindlich. Unsere Partnerorganisation NPYS-N in Nepal " +
        "meldet, wo Unterstützung gebraucht wird; sobald etwas zu Ihrem Bereich passt, schreiben wir Ihnen " +
        "mit dem konkreten Einsatz. Erst dann entscheiden Sie, ob Sie mitmachen.\n\n" +
        "Wir melden uns innerhalb von ein bis drei Werktagen.\n\n" +
        signature(o, lang, o.emailVolunteer) + footer(o, lang)
    };
  },

  contact: function (row, lang, o) {
    if (lang === "ne") {
      return {
        subject: "हामीले तपाईंको सन्देश पायौँ — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "हामीलाई लेख्नुभएकामा धन्यवाद। तपाईंको सन्देश आइपुगेको छ र कार्यसमितिका कसैले यो पढ्नेछन्।\n\n" +
          "सन्दर्भ: " + row._ref + "\n" +
          "\nहामी एकदेखि तीन कार्यदिनभित्र जवाफ दिन्छौँ। तपाईंको विषय जरुरी छ भने यसै इमेलमा जवाफ दिएर त्यो उल्लेख गर्नुहोस् — " +
          "त्यो उही मेलबक्समै पुग्छ।\n\n" +
          signature(o, lang) + footer(o, lang)
      };
    }
    if (lang === "en") {
      return {
        subject: "We have received your message — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "thank you for writing to us. Your message has arrived and someone from the board will read it.\n\n" +
          "Reference: " + row._ref + "\n" +
          "\nWe answer within one to three working days. If your question is urgent, reply to this " +
          "e-mail and say so — it reaches the same mailbox.\n\n" +
          signature(o, lang) + footer(o, lang)
      };
    }
    return {
      subject: "Wir haben Ihre Nachricht erhalten — " + row._ref,
      text: greeting(row, lang) + "\n\n" +
        "vielen Dank für Ihre Nachricht. Sie ist bei uns eingegangen und wird vom Vorstand gelesen.\n\n" +
        "Referenz: " + row._ref + "\n" +
        "\nWir antworten innerhalb von ein bis drei Werktagen. Ist Ihr Anliegen dringend, antworten Sie " +
        "einfach auf diese E-Mail und schreiben Sie es dazu — sie landet im selben Postfach.\n\n" +
        signature(o, lang) + footer(o, lang)
    };
  },

  partner: function (row, lang, o) {
    if (lang === "ne") {
      return {
        subject: "तपाईंको सहकार्य जिज्ञासा प्राप्त भयो — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "हामीसँग सहकार्य गर्न चासो देखाउनुभएकामा धन्यवाद। तपाईंको जिज्ञासा आइपुगेको छ।\n\n" +
          "सन्दर्भ: " + row._ref + "\n" +
          "\nसहकार्यसम्बन्धी निर्णय कार्यसमितिले गर्ने भएकाले हाम्रो जवाफ सामान्य जिज्ञासाभन्दा केही दिन ढिलो हुन सक्छ। " +
          "निर्णय आफैँलाई बढी समय लागे पनि हामी एकदेखि तीन कार्यदिनभित्र अर्को चरणबारे जानकारी गराउनेछौँ।\n\n" +
          signature(o, lang) + footer(o, lang)
      };
    }
    if (lang === "en") {
      return {
        subject: "Your cooperation enquiry has arrived — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "thank you for your interest in working with us. Your enquiry has arrived.\n\n" +
          "Reference: " + row._ref + "\n" +
          "\nCooperations are decided by the board, so our answer may take a few days longer than " +
          "an ordinary enquiry. We will come back to you within one to three working days with the " +
          "next step, even if the decision itself takes longer.\n\n" +
          signature(o, lang) + footer(o, lang)
      };
    }
    return {
      subject: "Ihre Kooperationsanfrage ist eingegangen — " + row._ref,
      text: greeting(row, lang) + "\n\n" +
        "vielen Dank für Ihr Interesse an einer Zusammenarbeit. Ihre Anfrage ist bei uns eingegangen.\n\n" +
        "Referenz: " + row._ref + "\n" +
        "\nÜber Kooperationen entscheidet der Vorstand; unsere Antwort kann daher etwas länger dauern " +
        "als bei einer gewöhnlichen Anfrage. Wir melden uns innerhalb von ein bis drei Werktagen mit dem " +
        "nächsten Schritt, auch wenn die Entscheidung selbst mehr Zeit braucht.\n\n" +
        signature(o, lang) + footer(o, lang)
    };
  },

  donation: function (row, lang, o) {
    const amount = row.betrag === "custom" ? row.betragCustom : row.betrag;
    const receipt = row.zuwendungsbestaetigung === true || row.zuwendungsbestaetigung === "on";
    if (lang === "ne") {
      return {
        subject: "तपाईंको दान प्रतिबद्धताका लागि धन्यवाद — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "One Euro for Nation का लागि" + (amount ? " " + amount + " EUR को" : "") +
          " दान प्रतिबद्धता जनाउनुभएकामा धन्यवाद। यो हामीकहाँ आइपुगेको छ।\n\n" +
          "सन्दर्भ: " + row._ref + "\n\n" +
          (bankBlock(o, row._ref, lang)
            ? bankBlock(o, row._ref, lang) + "\nरकम पठाउँदा कृपया यही सन्दर्भ उल्लेख गर्नुहोस्, ताकि हामीले तपाईंको दान छुट्याउन सकौँ।\n\n"
            : "खाता विवरण हामी छुट्टै पठाउनेछौँ।\n\n") +
          (receipt
            ? "तपाईंले दान रसिद माग्नुभएको छ। रकम प्राप्त भएपछि हामी त्यो जारी गर्नेछौँ — " +
              "त्यसका लागि तपाईंको हुलाक ठेगाना चाहिन्छ, त्यसैले अझै दिनुभएको छैन भने जवाफमा पठाइदिनुहोस्।\n\n"
            : "") +
          "तपाईंको योगदानले प्रमाणित प्राथमिक उपचार किट, नेपाली भाषाका तालिम सामग्री, " +
          "शैक्षिक सामग्री र सरसफाइ किटमा खर्च जुटाउँछ।\n\n" +
          signature(o, lang, o.emailDonation) + footer(o, lang)
      };
    }
    if (lang === "en") {
      return {
        subject: "Thank you for your donation pledge — " + row._ref,
        text: greeting(row, lang) + "\n\n" +
          "thank you for your pledge" + (amount ? " of " + amount + " EUR" : "") +
          " to One Euro for Nation. It has arrived.\n\n" +
          "Reference: " + row._ref + "\n\n" +
          (bankBlock(o, row._ref, lang)
            ? bankBlock(o, row._ref, lang) + "\nPlease quote that reference with your transfer so we can allocate it.\n\n"
            : "We will send you the account details separately.\n\n") +
          (receipt
            ? "You asked for a donation receipt. We will issue it once the payment has arrived — " +
              "for that we need your postal address, so please reply with it if you have not given it yet.\n\n"
            : "") +
          "Your contribution finances certified First Aid kits, training material in Nepali, " +
          "school supplies and hygiene kits.\n\n" +
          signature(o, lang, o.emailDonation) + footer(o, lang)
      };
    }
    return {
      subject: "Vielen Dank für Ihre Spendenzusage — " + row._ref,
      text: greeting(row, lang) + "\n\n" +
        "vielen Dank für Ihre Spendenzusage" + (amount ? " über " + amount + " EUR" : "") +
        " für One Euro for Nation. Sie ist bei uns eingegangen.\n\n" +
        "Referenz: " + row._ref + "\n\n" +
        (bankBlock(o, row._ref, lang)
          ? bankBlock(o, row._ref, lang) + "\nBitte geben Sie diesen Verwendungszweck bei der Überweisung an, damit wir Ihre Spende zuordnen können.\n\n"
          : "Die Kontoverbindung senden wir Ihnen gesondert zu.\n\n") +
        (receipt
          ? "Sie haben eine Zuwendungsbestätigung gewünscht. Wir stellen sie aus, sobald die Zahlung " +
            "eingegangen ist — dafür brauchen wir Ihre Postanschrift; bitte antworten Sie mit dieser Angabe, " +
            "falls Sie sie noch nicht genannt haben.\n\n"
          : "") +
        "Ihr Beitrag finanziert zertifizierte Erste-Hilfe-Kits, Trainingsmaterial auf Nepali, " +
        "Schulmaterialien und Hygienekits.\n\n" +
        signature(o, lang, o.emailDonation) + footer(o, lang)
    };
  },

  /* A newsletter is the one form where the acknowledgement is not a courtesy
     but the legal basis itself: without a confirmed opt-in (§ 7 UWG, Art. 7
     DSGVO) we may not send anything, and an address typed in by someone else
     would otherwise be subscribed without their knowledge. Nothing goes out
     to this address until the link below is clicked. */
  newsletter: function (row, lang, o, ctx) {
    const link = (ctx && ctx.confirmUrl) || "";
    if (lang === "ne") {
      return {
        subject: "कृपया आफ्नो न्यूजलेटर सदस्यता पुष्टि गर्नुहोस्",
        text: greeting(row, lang) + "\n\n" +
          "यो ठेगाना NPJOE न्यूजलेटरका लागि दर्ता गरिएको छ। यो तपाईं नै हो भनी कृपया पुष्टि गर्नुहोस्:\n\n" +
          (link ? link + "\n\n" : "— पुष्टि लिङ्क छैन, कृपया यसै इमेलमा जवाफ दिनुहोस् —\n\n") +
          "त्यससम्म हामी तपाईंलाई केही पनि पठाउँदैनौँ। तपाईं नभएको भए यो सन्देश बेवास्ता गरे पुग्छ — " +
          "पुष्टि नभएको प्रविष्टि मेटाइन्छ।\n\n" +
          "न्यूजलेटर वर्षमा केही पटक निस्कन्छ र हरेक अङ्कबाटै सदस्यता हटाउन सकिन्छ।\n\n" +
          signature(o, lang) + footer(o, lang)
      };
    }
    if (lang === "en") {
      return {
        subject: "Please confirm your newsletter subscription",
        text: greeting(row, lang) + "\n\n" +
          "this address was entered for the NPJOE newsletter. Please confirm that it was you:\n\n" +
          (link ? link + "\n\n" : "— confirmation link missing, please reply to this e-mail —\n\n") +
          "Until you do, we will not send you anything. If it was not you, simply ignore this " +
          "message — the entry is deleted without a confirmation.\n\n" +
          "The newsletter appears a few times a year and can be cancelled in every issue.\n\n" +
          signature(o, lang) + footer(o, lang)
      };
    }
    return {
      subject: "Bitte bestätigen Sie Ihre Newsletter-Anmeldung",
      text: greeting(row, lang) + "\n\n" +
        "diese Adresse wurde für den NPJOE-Newsletter eingetragen. Bitte bestätigen Sie, dass Sie das waren:\n\n" +
        (link ? link + "\n\n" : "— Bestätigungslink fehlt, bitte antworten Sie auf diese E-Mail —\n\n") +
        "Bis dahin senden wir Ihnen nichts zu. Waren Sie es nicht, ignorieren Sie diese Nachricht " +
        "einfach — ohne Bestätigung wird der Eintrag gelöscht.\n\n" +
        "Der Newsletter erscheint einige Male im Jahr und lässt sich in jeder Ausgabe abbestellen.\n\n" +
        signature(o, lang) + footer(o, lang)
    };
  }
};

/* Returns { to, subject, text, lang } or null when the type has no letter. */
function acknowledgement(type, row, ctx) {
  const make = LETTERS[type];
  if (!make) return null;
  const lang = langOf(row);
  const o = org((ctx || {}).org);
  const letter = make(row, lang, o, ctx || {});
  return { to: String(row.email || "").trim(), subject: letter.subject, text: letter.text, lang: lang };
}

/* --------------------------------------------------------- the board copy
   This one goes to the association's own mailbox, so it may name the person:
   the board is the controller, and it already holds the record. It stays
   short on purpose — the details belong in the protected area, not in a
   mailbox that is read on phones and forwarded without thinking. */

const BOARD_LABELS = {
  membership: "Neue Beitrittserklärung",
  volunteer: "Neue Volunteer-Registrierung",
  donation: "Neue Spendenzusage",
  contact: "Neue Kontaktanfrage",
  partner: "Neue Kooperationsanfrage",
  newsletter: "Neue Newsletter-Anmeldung"
};

function boardNotice(type, row, ctx) {
  const o = org((ctx || {}).org);
  const headline = BOARD_LABELS[type] || "Neuer Eingang";
  const base = (ctx && ctx.baseUrl) || "";
  const person = nameOf(row);
  return {
    subject: headline + " — " + row._ref,
    replyTo: String(row.email || "").trim() || o.email,
    text: headline + "\n\n" +
      "Referenz: " + row._ref + "\n" +
      (row.membershipNo ? "Mitgliedsnummer: " + row.membershipNo + "\n" : "") +
      (person ? "Name: " + person + "\n" : "") +
      (row.email ? "E-Mail: " + row.email + "\n" : "") +
      "Eingegangen: " + new Date(row._receivedAt || Date.now()).toLocaleString("de-DE", { timeZone: "Europe/Berlin" }) + "\n\n" +
      "Die vollständigen Angaben stehen im Vorstandsbereich" +
      (base && ctx && ctx.adminPath ? ":\n" + base.replace(/\/$/, "") + "/" + ctx.adminPath : "") + "\n\n" +
      "Die Website sagt eine Antwort in ein bis drei Werktagen zu.\n" +
      (type === "membership"
        ? "\nÜber die Aufnahme entscheidet der Vorstand nach § 5 der Satzung. " +
          "Die eingegangene Bestätigung an die Person sagt ausdrücklich noch keine Aufnahme zu.\n"
        : "") +
      "\nAuf diese Nachricht zu antworten schreibt direkt an die Person.\n"
  };
}

module.exports = { acknowledgement, boardNotice, langOf, org, LETTERS, BOARD_LABELS };
