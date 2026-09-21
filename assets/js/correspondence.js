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

  /* The person's own language choice wins; otherwise the language they used.
     All three languages of the site have their own templates. */
  function langOf(row) {
    if (row.antwortsprache === "englisch") return "en";
    if (row.antwortsprache === "nepali") return "ne";
    if (row.antwortsprache === "deutsch") return "de";
    if (row._lang === "en") return "en";
    if (row._lang === "ne") return "ne";
    return "de";
  }

  function greeting(row, lang) {
    var n = nameOf(row);
    if (lang === "ne") return n ? "आदरणीय " + n + "," : "नमस्ते,";
    if (lang === "en") return n ? "Dear " + n + "," : "Hello,";
    return n ? "Liebe:r " + n + "," : "Hallo,";
  }

  function signoff(lang, mailbox) {
    var o = org();
    return (lang === "ne"
      ? "हार्दिक शुभकामना\nकार्यसमिति\n"
      : lang === "en"
        ? "Kind regards\nThe board\n"
        : "Herzliche Grüße\nDer Vorstand\n") +
      o.name + "\n" + (mailbox || o.email) + (o.register ? "\n" + o.register : "");
  }

  var TEMPLATES = {
    "membership-accepted": {
      types: ["membership"],
      label: { de: "Aufnahme bestätigen", en: "Confirm admission", ne: "सदस्यता स्वीकृति पठाउनुहोस्" },
      subject: { de: "Willkommen bei der NPJOE — Ihre Mitgliedschaft", en: "Welcome to NPJOE — your membership", ne: "NPJOE मा स्वागत छ — तपाईंको सदस्यता" },
      body: function (row, lang) {
        var o = org();
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "कार्यसमितिले हाम्रो विधानको § ५ अनुसार तपाईंको आवेदन स्वीकृत गरेको छ। सोही निर्णयसँगै तपाईंको सदस्यता सुरु हुन्छ — स्वागत छ।\n\n" +
            "सदस्यता नम्बर: " + (row.membershipNo || "—") + "\n" +
            "मासिक शुल्क: " + o.fee + ".00 EUR\n" +
            (o.iban ? "खातावाला: " + o.holder + "\nIBAN: " + o.iban + (o.bic ? "\nBIC: " + o.bic : "") + "\n" : "") +
            "भुक्तानी सन्दर्भ: " + (row.membershipNo || row._ref || "") + "\n\n" +
            "कृपया यही सन्दर्भसहित स्थायी भुक्तानी आदेश राख्नुहोस्, ताकि हामीले तपाईंका भुक्तानी छुट्याउन सकौँ।\n\n" +
            "अबदेखि तपाईंले हाम्रा कार्यक्रम र साधारण सभाको निमन्त्रणा पाउनुहुनेछ, जहाँ तपाईंलाई मताधिकार हुन्छ (§ ९)।\n\n" +
            signoff(lang, o.emailMembership);
        }
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
      label: { de: "Rückfrage stellen", en: "Ask for more detail", ne: "थप विवरण सोध्नुहोस्" },
      subject: { de: "Ihre Beitrittserklärung — eine Rückfrage", en: "Your membership application — one question", ne: "तपाईंको सदस्यता आवेदन — एउटा प्रश्न" },
      body: function (row, lang) {
        var o = org();
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "तपाईंको आवेदनका लागि धन्यवाद (सन्दर्भ " + (row._ref || "") + ")। कार्यसमितिले निर्णय गर्नुअघि हामीलाई अझै एउटा विवरण चाहिन्छ:\n\n" +
            "— [के छुटेको छ यहाँ लेख्नुहोस्]\n\n" +
            "त्यो प्राप्त भएपछि कार्यसमितिले आफ्नो अर्को बैठकमा निर्णय गर्नेछ।\n\n" + signoff(lang, o.emailMembership);
        }
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
      label: { de: "Ablehnung mitteilen", en: "Communicate a rejection", ne: "अस्वीकृतिको जानकारी दिनुहोस्" },
      subject: { de: "Ihre Beitrittserklärung", en: "Your membership application", ne: "तपाईंको सदस्यता आवेदन" },
      body: function (row, lang) {
        var o = org();
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "हाम्रो कामप्रति चासो देखाउनुभएकामा धन्यवाद। सावधानीपूर्वक विचार गरेपछि कार्यसमितिले अहिलेका लागि तपाईंको आवेदन स्वीकृत नगर्ने निर्णय गरेको छ।\n\n" +
            "[ऐच्छिक: कारणबारे एक वाक्य]\n\n" +
            "हाम्रा सार्वजनिक कार्यक्रममा तपाईंलाई सधैँ स्वागत छ; दान र स्वयंसेवा पनि तपाईंका लागि खुला छन्।\n\n" +
            signoff(lang, o.emailMembership);
        }
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
      label: { de: "Registrierung bestätigen", en: "Confirm the registration", ne: "दर्ता पुष्टि गर्नुहोस्" },
      subject: { de: "Ihre Registrierung bei One Day for Nation", en: "Your One Day for Nation registration", ne: "One Day for Nation मा तपाईंको दर्ता" },
      body: function (row, lang) {
        var o = org();
        var fields = [].concat(row.bereiche || []).join(", ");
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "One Day for Nation मा दर्ता गर्नुभएकामा धन्यवाद (सन्दर्भ " + (row._ref || "") + ")।\n\n" +
            (fields ? "तपाईंका क्षेत्र: " + fields + "\n" : "") +
            (row.land ? "बसोबासको देश: " + row.land + "\n" : "") + "\n" +
            "अब के हुन्छ:\n" +
            "१. NPYS-N ले तपाईंको प्रोफाइलसँग मिल्ने विद्यालय वा परियोजनामा तपाईंलाई राख्छ।\n" +
            "२. परिचालनभन्दा करिब दुई हप्ता अगाडि तपाईंले ब्रिफिङ पाउनुहुन्छ।\n" +
            "३. तपाईंको अन्तिम प्रतिवेदनपछि हामी NPJOE प्रमाणपत्र जारी गर्छौं।\n\n" +
            "दर्ता निःशुल्क र बाध्यकारी हुँदैन — तपाईंले सहमति जनाएपछि मात्र परिचालन हुन्छ।\n\n" +
            signoff(lang, o.emailVolunteer);
        }
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
      label: { de: "Einsatz anbieten", en: "Offer an assignment", ne: "परिचालन प्रस्ताव गर्नुहोस्" },
      subject: { de: "Ein Einsatz für Sie — One Day for Nation", en: "An assignment for you — One Day for Nation", ne: "तपाईंका लागि एउटा परिचालन — One Day for Nation" },
      body: function (row, lang) {
        var o = org();
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "NPYS-N ले तपाईंको प्रोफाइलसँग मिल्ने एउटा परिचालन भेट्टाएको छ:\n\n" +
            "विद्यालय / परियोजना: [नाम]\nक्षेत्र: [क्षेत्र]\nअवधि: [देखि] देखि [सम्म]\nके चाहिन्छ: [विवरण]\n\n" +
            "यो तपाईंलाई मिल्छ कि मिल्दैन कृपया [मिति] भित्र जानकारी दिनुहोस्। यात्रा, बसोबास र बिमा तपाईंकै जिम्मेवारी हुन्छ; स्थलगत योजनामा NPYS-N ले सहयोग गर्छ।\n\n" +
            signoff(lang, o.emailVolunteer);
        }
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
      label: { de: "Spende bestätigen", en: "Acknowledge the donation", ne: "दान पुष्टि गर्नुहोस्" },
      subject: { de: "Vielen Dank für Ihre Spende", en: "Thank you for your donation", ne: "तपाईंको दानका लागि धन्यवाद" },
      body: function (row, lang) {
        var o = org();
        var amount = row.betrag === "custom" ? row.betragCustom : row.betrag;
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "One Euro for Nation का लागि " + (amount || "—") + " EUR को दान प्रतिबद्धता जनाउनुभएकामा धन्यवाद।\n\n" +
            (o.iban ? "खातावाला: " + o.holder + "\nIBAN: " + o.iban + (o.bic ? "\nBIC: " + o.bic : "") + "\n" : "") +
            "भुक्तानी सन्दर्भ: " + (row._ref || "") + "\n\n" +
            "हामीले तपाईंको दान छुट्याउन सकौँ भनेर कृपया यही सन्दर्भ उल्लेख गर्नुहोस्।\n\n" +
            (row.zuwendungsbestaetigung ? "तपाईंले दान रसिद माग्नुभएको छ — रकम प्राप्त भएपछि हामी पठाउनेछौँ।\n\n" : "") +
            "तपाईंको योगदानले प्रमाणित प्राथमिक उपचार किट, नेपाली भाषाका तालिम सामग्री, शैक्षिक सामग्री र सरसफाइ किटमा खर्च जुटाउँछ।\n\n" +
            signoff(lang, o.emailDonation);
        }
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
      label: { de: "Allgemeine Antwort", en: "General reply", ne: "सामान्य जवाफ" },
      subject: { de: "Ihre Nachricht an die NPJOE", en: "Your message to NPJOE", ne: "NPJOE लाई तपाईंको सन्देश" },
      body: function (row, lang) {
        var o = org();
        if (lang === "ne") {
          return greeting(row, lang) + "\n\n" +
            "तपाईंको सन्देशका लागि धन्यवाद (सन्दर्भ " + (row._ref || "") + ")।\n\n" +
            "[तपाईंको जवाफ]\n\n" + signoff(lang, o.email);
        }
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
