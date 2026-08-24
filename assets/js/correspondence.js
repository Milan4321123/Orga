/* ==========================================================================
   NPJOE — Reply templates
   The letter that follows a decision is the board's most repeated task, and
   the easiest place to forget the membership number, the fee or the account
   details. These templates fill themselves in from the stored record and use
   the language the person asked for.
   ========================================================================== */
(function () {
  "use strict";

  function org() {
    var o = (window.NPJOE && window.NPJOE.org) || {};
    return {
      name: o.nameDe || "Nepalesische Progressive Jugendorganisation e.V.",
      register: o.register || "",
      email: o.email || "",
      emailMembership: o.emailMembership || o.email || "",
      emailDonation: o.emailDonation || o.email || "",
      emailVolunteer: o.emailVolunteer || o.email || "",
      fee: ((o.fee && o.fee.monthly) || 5),
      iban: (o.bank && o.bank.iban) || "",
      bic: (o.bank && o.bank.bic) || "",
      holder: (o.bank && o.bank.holder) || o.nameDe || ""
    };
  }

  function nameOf(row) {
    return [row.vorname, row.nachname].filter(Boolean).join(" ") || row.name || "";
  }

  /* The person's own language choice wins; otherwise the language they used. */
  function langOf(row) {
    if (row.antwortsprache === "englisch") return "en";
    if (row.antwortsprache === "deutsch" || row.antwortsprache === "nepali") return "de";
    return row._lang === "en" ? "en" : "de";
  }

  function greeting(row, lang) {
    var n = nameOf(row);
    if (lang === "en") return n ? "Dear " + n + "," : "Hello,";
    return n ? "Liebe:r " + n + "," : "Hallo,";
  }

  function signoff(lang, mailbox) {
    var o = org();
    return (lang === "en"
      ? "Kind regards\nThe board\n"
      : "Herzliche Grüße\nDer Vorstand\n") +
      o.name + "\n" + (mailbox || o.email) + (o.register ? "\n" + o.register : "");
  }

  var TEMPLATES = {
    "membership-accepted": {
      types: ["membership"],
      label: { de: "Aufnahme bestätigen", en: "Confirm admission" },
      subject: { de: "Willkommen bei der NPJOE — Ihre Mitgliedschaft", en: "Welcome to NPJOE — your membership" },
      body: function (row, lang) {
        var o = org();
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "the board has approved your application under § 5 of our statutes. Your membership begins with that resolution — welcome.\n\n" +
            "Membership number: " + (row.membershipNo || "—") + "\n" +
            "Monthly fee: " + o.fee + ".00 EUR\n" +
            (o.iban ? "Account holder: " + o.holder + "\nIBAN: " + o.iban + (o.bic ? "\nBIC: " + o.bic : "") + "\n" : "") +
            "Reference: " + (row.membershipNo || row._ref || "") + "\n\n" +
            "Please set up a standing order with that reference so we can allocate your payments.\n\n" +
            "You will receive invitations to our events and to the general meeting, where you have a vote (§ 9).\n\n" +
            signoff(lang, o.emailMembership);
        }
        return greeting(row, lang) + "\n\n" +
          "der Vorstand hat Ihren Aufnahmeantrag nach § 5 unserer Satzung angenommen. Ihre Mitgliedschaft beginnt mit diesem Beschluss — herzlich willkommen.\n\n" +
          "Mitgliedsnummer: " + (row.membershipNo || "—") + "\n" +
          "Monatsbeitrag: " + o.fee + ",00 EUR\n" +
          (o.iban ? "Kontoinhaber: " + o.holder + "\nIBAN: " + o.iban + (o.bic ? "\nBIC: " + o.bic : "") + "\n" : "") +
          "Verwendungszweck: " + (row.membershipNo || row._ref || "") + "\n\n" +
          "Bitte richten Sie einen Dauerauftrag mit diesem Verwendungszweck ein, damit wir Ihre Zahlungen zuordnen können.\n\n" +
          "Sie erhalten künftig Einladungen zu unseren Veranstaltungen und zur Mitgliederversammlung, in der Sie stimmberechtigt sind (§ 9).\n\n" +
          signoff(lang, o.emailMembership);
      }
    },

    "membership-more-info": {
      types: ["membership"],
      label: { de: "Rückfrage stellen", en: "Ask for more detail" },
      subject: { de: "Ihre Beitrittserklärung — eine Rückfrage", en: "Your membership application — one question" },
      body: function (row, lang) {
        var o = org();
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "thank you for your application (reference " + (row._ref || "") + "). Before the board decides, we need one more detail:\n\n" +
            "— [please describe what is missing]\n\n" +
            "Once we have it, the board will decide at its next meeting.\n\n" + signoff(lang, o.emailMembership);
        }
        return greeting(row, lang) + "\n\n" +
          "vielen Dank für Ihre Beitrittserklärung (Referenz " + (row._ref || "") + "). Bevor der Vorstand entscheidet, fehlt uns noch eine Angabe:\n\n" +
          "— [hier eintragen, was fehlt]\n\n" +
          "Sobald uns das vorliegt, entscheidet der Vorstand in seiner nächsten Sitzung.\n\n" + signoff(lang, o.emailMembership);
      }
    },

    "membership-declined": {
      types: ["membership"],
      label: { de: "Ablehnung mitteilen", en: "Communicate a rejection" },
      subject: { de: "Ihre Beitrittserklärung", en: "Your membership application" },
      body: function (row, lang) {
        var o = org();
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "thank you for your interest in our work. After careful consideration the board has decided not to approve your application at this time.\n\n" +
            "[optional: one sentence of reasoning]\n\n" +
            "You remain very welcome at our public events, and donations and volunteering stay open to you.\n\n" + signoff(lang, o.emailMembership);
        }
        return greeting(row, lang) + "\n\n" +
          "vielen Dank für Ihr Interesse an unserer Arbeit. Nach sorgfältiger Beratung hat der Vorstand entschieden, Ihrem Aufnahmeantrag derzeit nicht zu entsprechen.\n\n" +
          "[optional: ein Satz zur Begründung]\n\n" +
          "Zu unseren öffentlichen Veranstaltungen sind Sie weiterhin herzlich eingeladen; Spenden und Freiwilligenarbeit stehen Ihnen ebenso offen.\n\n" +
          signoff(lang, o.emailMembership);
      }
    },

    "volunteer-received": {
      types: ["volunteer"],
      label: { de: "Registrierung bestätigen", en: "Confirm the registration" },
      subject: { de: "Ihre Registrierung bei One Day for Nation", en: "Your One Day for Nation registration" },
      body: function (row, lang) {
        var o = org();
        var fields = [].concat(row.bereiche || []).join(", ");
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "thank you for registering for One Day for Nation (reference " + (row._ref || "") + ").\n\n" +
            (fields ? "Your fields: " + fields + "\n" : "") +
            (row.land ? "Country: " + row.land + "\n" : "") + "\n" +
            "What happens next:\n" +
            "1. NPYS-N matches you with a school or project that fits your profile.\n" +
            "2. You receive a briefing about two weeks before the assignment.\n" +
            "3. After your final report we issue your NPJOE certificate.\n\n" +
            "Registration is free and non-binding — the assignment only goes ahead once you agree to it.\n\n" +
            signoff(lang, o.emailVolunteer);
        }
        return greeting(row, lang) + "\n\n" +
          "vielen Dank für Ihre Registrierung bei One Day for Nation (Referenz " + (row._ref || "") + ").\n\n" +
          (fields ? "Ihre Bereiche: " + fields + "\n" : "") +
          (row.land ? "Wohnland: " + row.land + "\n" : "") + "\n" +
          "Wie es weitergeht:\n" +
          "1. NPYS-N ordnet Sie einer Schule oder einem Projekt zu, das zu Ihrem Profil passt.\n" +
          "2. Rund zwei Wochen vor dem Einsatz erhalten Sie ein Briefing.\n" +
          "3. Nach Ihrem Abschlussbericht stellen wir Ihr NPJOE-Zertifikat aus.\n\n" +
          "Die Registrierung ist kostenlos und unverbindlich — ein Einsatz kommt erst zustande, wenn Sie zustimmen.\n\n" +
          signoff(lang, o.emailVolunteer);
      }
    },

    "volunteer-matched": {
      types: ["volunteer"],
      label: { de: "Einsatz anbieten", en: "Offer an assignment" },
      subject: { de: "Ein Einsatz für Sie — One Day for Nation", en: "An assignment for you — One Day for Nation" },
      body: function (row, lang) {
        var o = org();
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "NPYS-N has found an assignment that fits your profile:\n\n" +
            "School / project: [name]\nRegion: [region]\nPeriod: [from] to [to]\nWhat is needed: [description]\n\n" +
            "Please tell us by [date] whether this suits you. Travel, accommodation and insurance remain your own responsibility; NPYS-N helps with local planning.\n\n" +
            signoff(lang, o.emailVolunteer);
        }
        return greeting(row, lang) + "\n\n" +
          "NPYS-N hat einen Einsatz gefunden, der zu Ihrem Profil passt:\n\n" +
          "Schule / Projekt: [Name]\nRegion: [Region]\nZeitraum: [von] bis [bis]\nWas gebraucht wird: [Beschreibung]\n\n" +
          "Bitte sagen Sie uns bis [Datum], ob Ihnen das passt. Reise, Unterkunft und Versicherung liegen in Ihrer Verantwortung; NPYS-N hilft bei der Planung vor Ort.\n\n" +
          signoff(lang, o.emailVolunteer);
      }
    },

    "donation-thanks": {
      types: ["donation"],
      label: { de: "Spende bestätigen", en: "Acknowledge the donation" },
      subject: { de: "Vielen Dank für Ihre Spende", en: "Thank you for your donation" },
      body: function (row, lang) {
        var o = org();
        var amount = row.betrag === "custom" ? row.betragCustom : row.betrag;
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "thank you for your pledge of " + (amount || "—") + " EUR to One Euro for Nation.\n\n" +
            (o.iban ? "Account holder: " + o.holder + "\nIBAN: " + o.iban + (o.bic ? "\nBIC: " + o.bic : "") + "\n" : "") +
            "Reference: " + (row._ref || "") + "\n\n" +
            "Please quote that reference so we can allocate your donation.\n\n" +
            (row.zuwendungsbestaetigung ? "You asked for a donation receipt — we will send it once the payment has arrived.\n\n" : "") +
            "Your contribution finances certified First Aid kits, Nepali training material, school supplies and hygiene kits.\n\n" +
            signoff(lang, o.emailDonation);
        }
        return greeting(row, lang) + "\n\n" +
          "vielen Dank für Ihre Spendenzusage über " + (amount || "—") + " EUR für One Euro for Nation.\n\n" +
          (o.iban ? "Kontoinhaber: " + o.holder + "\nIBAN: " + o.iban + (o.bic ? "\nBIC: " + o.bic : "") + "\n" : "") +
          "Verwendungszweck: " + (row._ref || "") + "\n\n" +
          "Bitte geben Sie diesen Verwendungszweck bei der Überweisung an, damit wir Ihre Spende zuordnen können.\n\n" +
          (row.zuwendungsbestaetigung ? "Sie haben eine Zuwendungsbestätigung gewünscht — wir stellen sie aus, sobald die Zahlung eingegangen ist.\n\n" : "") +
          "Ihr Beitrag finanziert zertifizierte Erste-Hilfe-Kits, Trainingsmaterial auf Nepali, Schulmaterialien und Hygienekits.\n\n" +
          signoff(lang, o.emailDonation);
      }
    },

    "general-reply": {
      types: ["contact", "partner", "newsletter", "membership", "volunteer", "donation"],
      label: { de: "Allgemeine Antwort", en: "General reply" },
      subject: { de: "Ihre Nachricht an die NPJOE", en: "Your message to NPJOE" },
      body: function (row, lang) {
        var o = org();
        if (lang === "en") {
          return greeting(row, lang) + "\n\n" +
            "thank you for your message (reference " + (row._ref || "") + ").\n\n" +
            "[your answer]\n\n" + signoff(lang, o.email);
        }
        return greeting(row, lang) + "\n\n" +
          "vielen Dank für Ihre Nachricht (Referenz " + (row._ref || "") + ").\n\n" +
          "[Ihre Antwort]\n\n" + signoff(lang, o.email);
      }
    }
  };

  function forType(type) {
    return Object.keys(TEMPLATES).filter(function (k) { return TEMPLATES[k].types.indexOf(type) !== -1; });
  }

  function build(key, row) {
    var t = TEMPLATES[key];
    if (!t) return null;
    var lang = langOf(row);
    return { key: key, lang: lang, to: row.email || "", subject: t.subject[lang], body: t.body(row, lang) };
  }

  /* mailto: has practical length limits, so long letters get copied instead. */
  function mailtoLink(letter) {
    var link = "mailto:" + encodeURIComponent(letter.to) +
      "?subject=" + encodeURIComponent(letter.subject) +
      "&body=" + encodeURIComponent(letter.body);
    return link.length > 1900 ? null : link;
  }

  window.NPJOELetters = {
    TEMPLATES: TEMPLATES,
    forType: forType,
    build: build,
    mailtoLink: mailtoLink,
    langOf: langOf
  };
})();
