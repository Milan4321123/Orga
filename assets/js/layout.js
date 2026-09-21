/* ==========================================================================
   NPJOE — Shared layout: header, navigation, footer, consent banner
   Injected on every page so navigation stays consistent in one place.
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.NPJOE || {};
  var ORG = CFG.org || {};

  var LOGO =
    '<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="lg-{ID}" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#c8102e"/><stop offset="55%" stop-color="#a70d26"/>' +
    '<stop offset="100%" stop-color="#123a7a"/></linearGradient></defs>' +
    '<rect x="2" y="2" width="60" height="60" rx="17" fill="url(#lg-{ID})"/>' +
    '<circle cx="42" cy="21" r="7" fill="#e8951a"/>' +
    '<path d="M8 47 L21 25 L30 39 L38 27 L56 47 Z" fill="#fff" opacity="0.96"/>' +
    '<path d="M21 25 L26.5 34 L21 36 L16 33 Z" fill="#dfe6f2"/>' +
    '<rect x="8" y="47" width="48" height="4.5" rx="2.2" fill="#fff" opacity="0.75"/></svg>';

  function logo(id) { return LOGO.replace(/\{ID\}/g, id); }

  /* ---- Navigation model ------------------------------------------------- */
  var NAV = [
    { id: "home", href: "index.html", de: "Start", en: "Home", ne: "गृहपृष्ठ" },
    {
      id: "about", href: "ueber-uns.html", de: "Über uns", en: "About us", ne: "हाम्रो बारेमा",
      children: [
        { href: "ueber-uns.html", de: "Wer wir sind", en: "Who we are", ne: "हामी को हौँ", subDe: "Vision, Mission, Geschichte", subEn: "Vision, mission, history", subNe: "परिकल्पना, ध्येय, इतिहास" },
        { href: "ueber-uns.html#vorstand", de: "Vorstand & Organe", en: "Board & bodies", ne: "कार्यसमिति र अङ्गहरू", subDe: "Nach § 2 und § 12 der Satzung", subEn: "Under §§ 2 and 12 of the statutes", subNe: "विधानको § २ र § १२ अनुसार" },
        { href: "satzung.html", de: "Satzung", en: "Statutes", ne: "विधान", subDe: "Vollständiger Text, Stand Juni 2026", subEn: "Full text, as of June 2026", subNe: "पूर्ण पाठ, जुन २०२६ सम्म" },
        { href: "ueber-uns.html#partner", de: "Partnerschaft NPYS-N", en: "NPYS-N partnership", ne: "NPYS-N साझेदारी", subDe: "Unser Partner vor Ort", subEn: "Our partner on the ground", subNe: "नेपालमा हाम्रो साझेदार" },
        { href: "wirkung.html", de: "Wirkung & Ablauf", en: "Impact & process", ne: "प्रभाव र प्रक्रिया", subDe: "Von der Registrierung bis zum Zertifikat", subEn: "From registration to certificate", subNe: "दर्तादेखि प्रमाणपत्रसम्म" },
        { href: "transparenz.html", de: "Transparenz", en: "Transparency", ne: "पारदर्शिता", subDe: "Berichte, Zahlen, Mittelverwendung", subEn: "Reports, figures, use of funds", subNe: "प्रतिवेदन, तथ्याङ्क, रकमको प्रयोग" }
      ]
    },
    {
      id: "programmes", href: "programme.html", de: "Programme", en: "Programmes", ne: "कार्यक्रमहरू",
      children: [
        { href: "programme.html", de: "Alle Programme", en: "All programmes", ne: "सबै कार्यक्रम", subDe: "Übersicht 2026–2030", subEn: "Overview 2026–2030", subNe: "सिंहावलोकन २०२६–२०३०" },
        { href: "one-day-for-nation.html", de: "One Day for Nation", en: "One Day for Nation", ne: "One Day for Nation", subDe: "Freiwilligenprogramm nach Berufsfeld", subEn: "Volunteering by profession", subNe: "पेसाअनुसार स्वयंसेवा" },
        { href: "erste-hilfe-kampagne.html", de: "Erste-Hilfe-Kampagne", en: "First Aid Campaign", ne: "प्राथमिक उपचार अभियान", subDe: "Flaggschiff — Klassen 9–12", subEn: "Flagship — Grades 9–12", subNe: "प्रमुख कार्यक्रम — कक्षा ९–१२" },
        { href: "one-euro-for-nation.html", de: "One Euro for Nation", en: "One Euro for Nation", ne: "One Euro for Nation", subDe: "Spendeninitiative ab 1 €", subEn: "Donation initiative from €1", subNe: "१ युरोबाट सुरु हुने दान अभियान" }
      ]
    },
    {
      id: "join", href: "mitmachen.html", de: "Mitmachen", en: "Get involved", ne: "सहभागी हुनुहोस्",
      children: [
        { href: "mitmachen.html", de: "Alle vier Wege", en: "All four routes", ne: "चारै बाटो", subDe: "Vergleich: Aufwand, Kosten, Voraussetzungen", subEn: "Compare commitment, cost, requirements", subNe: "तुलना: समय, खर्च, आवश्यकता" },
        { href: "mitglied-werden.html", de: "Mitglied werden", en: "Become a member", ne: "सदस्य बन्नुहोस्", subDe: "Beitrittserklärung online, 5 €/Monat", subEn: "Online application, €5/month", subNe: "अनलाइन फारम, मासिक ५ युरो" },
        { href: "volunteer.html", de: "Volunteer werden", en: "Become a volunteer", ne: "स्वयंसेवक बन्नुहोस्", subDe: "12 Berufsfelder, ab 1 Tag", subEn: "12 fields, from one day", subNe: "१२ पेसागत क्षेत्र, एक दिनदेखि" },
        { href: "spenden.html", de: "Spenden", en: "Donate", ne: "दान गर्नुहोस्", subDe: "Steuerlich absetzbar in Deutschland", subEn: "Tax-deductible in Germany", subNe: "जर्मनीमा करछुट पाइने" },
        { href: "kontakt.html#partner-werden", de: "Partner & Schulen", en: "Partners & schools", ne: "साझेदार र विद्यालय", subDe: "Kooperation anfragen", subEn: "Request a cooperation", subNe: "सहकार्यका लागि सम्पर्क" }
      ]
    },
    {
      id: "news", href: "news.html", de: "Aktuelles", en: "News", ne: "समाचार",
      children: [
        { href: "news.html", de: "News & Berichte", en: "News & reports", ne: "समाचार र प्रतिवेदन", subDe: "Neues aus Verein und Projekten", subEn: "From the association and projects", subNe: "संगठन र परियोजनाका गतिविधि" },
        { href: "veranstaltungen.html", de: "Veranstaltungen", en: "Events", ne: "कार्यक्रम तथा गतिविधि", subDe: "Termine, Kalender, Anmeldung", subEn: "Dates, calendar, registration", subNe: "मिति, पात्रो, दर्ता" }
      ]
    },
    {
      id: "gallery", href: "galerie.html", de: "Galerie", en: "Gallery", ne: "ग्यालरी",
      children: [
        { href: "galerie.html", de: "Alle Alben", en: "All albums", ne: "सबै एल्बम", subDe: "Alle Alben auf einen Blick", subEn: "All albums at a glance", subNe: "सबै एल्बम एकै नजरमा" },
        { href: "naya-barsha-2026.html", de: "Neujahr 2026", en: "New Year 2026", ne: "नयाँ वर्ष २०२६", subDe: "10. April 2026 · Darmstadt · 9 Fotos", subEn: "10 April 2026 · Darmstadt · 9 photos", subNe: "१० अप्रिल २०२६ · डार्मस्टाट · ९ तस्बिर" },
        { href: "naya-barsha-2025.html", de: "Neujahr 2025", en: "New Year 2025", ne: "नयाँ वर्ष २०२५", subDe: "11. April 2025 · Knabenschule Halle · 1 Foto, 11 Videos", subEn: "11 April 2025 · Knabenschule Halle · 1 photo, 11 videos", subNe: "११ अप्रिल २०२५ · क्नाबेनशुले हाले · १ तस्बिर, ११ भिडियो" },
        { href: "dashain-2024.html", de: "Dashain-Feier 2024", en: "Dashain 2024", ne: "दसैँ २०२४", subDe: "5. Oktober 2024 · 16 Fotos, 1 Video", subEn: "5 October 2024 · 16 photos, 1 video", subNe: "५ अक्टोबर २०२४ · १६ तस्बिर, १ भिडियो" }
      ]
    },
    { id: "faq", href: "faq.html", de: "FAQ", en: "FAQ", ne: "जिज्ञासा" },
    { id: "contact", href: "kontakt.html", de: "Kontakt", en: "Contact", ne: "सम्पर्क" }
  ];

  var CARET = '<svg class="caret" viewBox="0 0 12 8" fill="none" aria-hidden="true"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ne is optional: a string nobody has translated yet falls back to the
     English wording rather than rendering as an empty gap. */
  function bi(de, en, ne) {
    return '<span data-lang="de">' + de + '</span>' +
           '<span data-lang="en">' + en + "</span>" +
           '<span data-lang="ne">' + (ne || en) + "</span>";
  }

  function navMarkup(active) {
    return NAV.map(function (item) {
      var isActive = item.id === active;
      var cur = isActive ? ' aria-current="page"' : "";
      if (!item.children) {
        return '<li><a class="nav-link" href="' + item.href + '"' + cur + ">" + bi(item.de, item.en, item.ne) + "</a></li>";
      }
      var sub = item.children.map(function (c) {
        return '<li><a href="' + c.href + '">' + bi(c.de, c.en, c.ne) +
          (c.subDe ? "<small>" + bi(c.subDe, c.subEn, c.subNe) + "</small>" : "") + "</a></li>";
      }).join("");
      return '<li class="has-dropdown"><a class="nav-link" href="' + item.href + '"' + cur +
        ' aria-haspopup="true" aria-expanded="false">' + bi(item.de, item.en, item.ne) + CARET + "</a>" +
        '<ul class="dropdown">' + sub + "</ul></li>";
    }).join("");
  }

  /* ---- Header ----------------------------------------------------------- */
  function header(active) {
    return '' +
      '<a class="skip-link" href="#main">' + bi("Zum Inhalt springen", "Skip to content", "सामग्रीमा जानुहोस्") + "</a>" +
      '<div class="topbar no-print"><div class="container flex-between">' +
        '<span>' + bi(
          "Gemeinnütziger Verein · " + (ORG.register || ""),
          "Registered non-profit · " + (ORG.register || ""),
          "दर्ता भएको गैरनाफामूलक संस्था · " + (ORG.register || "")
        ) + "</span>" +
        '<span class="topbar-extra flex" style="gap:1.1rem">' +
          '<a href="mailto:' + ORG.email + '">' + ORG.email + "</a>" +
          '<a href="spenden.html">' + bi("Jetzt spenden", "Donate now", "अहिले दान गर्नुहोस्") + "</a>" +
        "</span>" +
      "</div></div>" +
      '<header class="site-header no-print" id="siteHeader"><div class="container">' +
        '<nav class="nav" aria-label="' + "Hauptnavigation" + '">' +
          '<a class="brand" href="index.html">' + logo("hdr") +
            '<span class="brand-text">' +
              '<span class="brand-name">NPJOE</span>' +
              '<span class="brand-sub">' + bi("Jugend · Nepal · Deutschland", "Youth · Nepal · Germany", "युवा · नेपाल · जर्मनी") + "</span>" +
            "</span>" +
          "</a>" +
          '<ul class="nav-links" id="navLinks">' + navMarkup(active) +
            '<li class="nav-mobile-cta" style="margin-top:1rem">' +
              '<a class="btn btn-block" href="mitglied-werden.html">' + bi("Mitglied werden", "Become a member", "सदस्य बन्नुहोस्") + "</a>" +
            "</li>" +
          "</ul>" +
          '<div class="nav-actions">' +
            '<div class="lang-switch" role="group" aria-label="Sprache / Language / भाषा">' +
              '<button type="button" data-set-lang="de" aria-pressed="false">DE</button>' +
              '<button type="button" data-set-lang="en" aria-pressed="false">EN</button>' +
              '<button type="button" data-set-lang="ne" aria-pressed="false" lang="ne">ने</button>' +
            "</div>" +
            '<a class="btn btn-sm nav-desktop-cta" href="mitglied-werden.html">' + bi("Mitglied werden", "Join us", "सदस्य बन्नुहोस्") + "</a>" +
            '<button class="icon-btn nav-toggle" id="navToggle" type="button" aria-label="Menü öffnen / Open menu" aria-expanded="false" aria-controls="navLinks">' +
              '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
            "</button>" +
          "</div>" +
        "</nav>" +
      "</div></header>" +
      '<div class="nav-scrim" id="navScrim" hidden></div>';
  }

  /* ---- Footer ----------------------------------------------------------- */
  function footer() {
    var s = ORG.social || {};
    function soc(href, label, path) {
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" aria-label="' + label + '">' +
        '<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">' + path + "</svg></a>";
    }
    return '' +
      '<footer class="site-footer no-print"><div class="container">' +
        '<div class="footer-grid">' +
          "<div>" +
            '<div class="footer-brand">' + logo("ftr") +
              '<span class="brand-text"><span class="brand-name">NPJOE</span>' +
              '<span class="brand-sub">e.V. · ' + (ORG.register || "") + "</span></span></div>" +
            "<p style=\"font-size:0.875rem;line-height:1.65\">" + bi(
              "Wir verbinden die nepalesische Jugend in Deutschland, bewahren unsere Kultur und tragen aktiv zur Entwicklung Nepals bei — gemeinsam mit NPYS-N.",
              "We connect Nepali youth in Germany, preserve our culture and actively contribute to Nepal's development — together with NPYS-N.",
              "हामी जर्मनीमा रहेका नेपाली युवालाई जोड्छौँ, हाम्रो संस्कृति जोगाउँछौँ र NPYS-N सँग मिलेर नेपालको विकासमा सक्रिय योगदान दिन्छौँ।"
            ) + "</p>" +
            '<div class="social mt-3">' +
              soc(s.facebook, "Facebook", '<path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H16.7V4.6c-.3 0-1.3-.13-2.47-.13-2.44 0-4.11 1.49-4.11 4.23v2.36H7.4V14h2.72v8h3.38z"/>') +
              soc(s.tiktok, "TikTok", '<path d="M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.6 2.6 0 01-2.6-2.6 2.6 2.6 0 013.36-2.48v-3.1a5.7 5.7 0 00-.76-.05A5.69 5.69 0 004.17 15.3 5.69 5.69 0 009.86 21a5.69 5.69 0 005.69-5.7V9.01a7.35 7.35 0 004.3 1.38v-3.1a4.28 4.28 0 01-3.25-1.47z"/>') +
              soc(s.instagram, "Instagram", '<path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 5.68a4.16 4.16 0 100 8.32 4.16 4.16 0 000-8.32zm0 6.86a2.7 2.7 0 110-5.4 2.7 2.7 0 010 5.4zm4.34-7.03a.97.97 0 11.001-1.941.97.97 0 01-.001 1.941z"/>') +
              soc(s.youtube, "YouTube", '<path d="M21.6 7.2s-.2-1.4-.8-2c-.75-.8-1.6-.8-2-.85C16 4.2 12 4.2 12 4.2h-.01s-4 0-6.8.15c-.4.05-1.25.05-2 .85-.6.6-.8 2-.8 2S2.2 8.8 2.2 10.4v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.75.8 1.75.78 2.2.86 1.6.15 6.8.2 6.8.2s4 0 6.8-.16c.4-.05 1.25-.05 2-.85.6-.6.8-2 .8-2s.2-1.6.2-3.2v-1.5c0-1.6-.2-3.25-.2-3.25zM9.9 14.1V8.5l5.15 2.8-5.15 2.8z"/>') +
              soc(s.linkedin, "LinkedIn", '<path d="M6.94 5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.2 8.4h3.5V21H3.2V8.4zm5.8 0h3.35v1.72h.05c.47-.85 1.6-1.75 3.3-1.75 3.53 0 4.18 2.2 4.18 5.07V21h-3.5v-6.05c0-1.44-.03-3.3-2.03-3.3-2.03 0-2.34 1.57-2.34 3.2V21H9V8.4z"/>') +
            "</div>" +
          "</div>" +
          "<div><h5>" + bi("Verein", "Association", "संगठन") + "</h5><ul>" +
            '<li><a href="ueber-uns.html">' + bi("Über uns", "About us", "हाम्रो बारेमा") + "</a></li>" +
            '<li><a href="satzung.html">' + bi("Satzung", "Statutes", "विधान") + "</a></li>" +
            '<li><a href="ueber-uns.html#vorstand">' + bi("Vorstand", "Board", "कार्यसमिति") + "</a></li>" +
            '<li><a href="wirkung.html">' + bi("Wirkung & Ablauf", "Impact & process", "प्रभाव र प्रक्रिया") + "</a></li>" +
            '<li><a href="transparenz.html">' + bi("Transparenz", "Transparency", "पारदर्शिता") + "</a></li>" +
            '<li><a href="news.html">' + bi("News", "News", "समाचार") + "</a></li>" +
          "</ul></div>" +
          "<div><h5>" + bi("Programme", "Programmes", "कार्यक्रमहरू") + "</h5><ul>" +
            '<li><a href="one-day-for-nation.html">One Day for Nation</a></li>' +
            '<li><a href="erste-hilfe-kampagne.html">' + bi("Erste-Hilfe-Kampagne", "First Aid Campaign", "प्राथमिक उपचार अभियान") + "</a></li>" +
            '<li><a href="one-euro-for-nation.html">One Euro for Nation</a></li>' +
            '<li><a href="veranstaltungen.html">' + bi("Veranstaltungen", "Events", "कार्यक्रम तथा गतिविधि") + "</a></li>" +
            '<li><a href="galerie.html">' + bi("Galerie", "Gallery", "ग्यालरी") + "</a></li>" +
            '<li><a href="naya-barsha-2026.html">' + bi("Neujahr 2026", "New Year 2026", "नयाँ वर्ष २०२६") + "</a></li>" +
            '<li><a href="naya-barsha-2025.html">' + bi("Neujahr 2025", "New Year 2025", "नयाँ वर्ष २०२५") + "</a></li>" +
            '<li><a href="dashain-2024.html">' + bi("Dashain-Feier 2024", "Dashain 2024", "दसैँ २०२४") + "</a></li>" +
          "</ul></div>" +
          "<div><h5>" + bi("Mitmachen", "Get involved", "सहभागी हुनुहोस्") + "</h5><ul>" +
            '<li><a href="mitmachen.html">' + bi("Alle vier Wege", "All four routes", "चारै बाटो") + "</a></li>" +
            '<li><a href="mitglied-werden.html">' + bi("Mitglied werden", "Become a member", "सदस्य बन्नुहोस्") + "</a></li>" +
            '<li><a href="volunteer.html">' + bi("Volunteer werden", "Volunteer", "स्वयंसेवक बन्नुहोस्") + "</a></li>" +
            '<li><a href="spenden.html">' + bi("Spenden", "Donate", "दान गर्नुहोस्") + "</a></li>" +
            '<li><a href="kontakt.html">' + bi("Kontakt", "Contact", "सम्पर्क") + "</a></li>" +
            '<li><a href="faq.html">FAQ</a></li>' +
          "</ul></div>" +
          "<div><h5>" + bi("Newsletter", "Newsletter", "न्यूजलेटर") + "</h5>" +
            '<p style="font-size:0.85rem">' + bi(
              "Ein kurzer Rückblick pro Quartal: Einsätze, Schulen, Zahlen.",
              "One short recap per quarter: deployments, schools, figures.",
              "हरेक त्रैमासमा एउटा छोटो सारांश: परिचालन, विद्यालय, तथ्याङ्क।"
            ) + "</p>" +
            '<form class="newsletter-inline" data-form="newsletter" novalidate>' +
              '<input class="input" type="email" name="email" required placeholder="E-Mail" aria-label="E-Mail" />' +
              '<button class="btn btn-sm" type="submit">→</button>' +
            "</form>" +
            '<p class="text-xs mt-2" style="color:#77839a">' + bi(
              "Abmeldung jederzeit. Siehe Datenschutz.",
              "Unsubscribe anytime. See privacy policy.",
              "जुनसुकै बेला हटाउन सकिन्छ। गोपनीयता नीति हेर्नुहोस्।"
            ) + "</p>" +
            '<div class="mt-3" style="font-size:0.85rem">' +
              "<div>" + (ORG.email || "") + "</div><div>" + (ORG.seat || "") + "</div>" +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="footer-bottom">' +
          "<span>© " + new Date().getFullYear() + " " + (ORG.nameDe || "") + " · " + (ORG.register || "") + "</span>" +
          '<span class="flex" style="gap:1.1rem">' +
            '<a href="impressum.html">Impressum</a>' +
            '<a href="datenschutz.html">' + bi("Datenschutz", "Privacy", "गोपनीयता") + "</a>" +
            '<a href="datenschutz.html#dsgvo-rechte">' + bi("Ihre Rechte (DSGVO)", "Your rights (GDPR)", "तपाईंका अधिकार (GDPR)") + "</a>" +
            /* No link to the board area. It is for two people, it holds the
               members' addresses and signatures, and a link in the footer of
               every page tells the whole internet it is there. The board
               reaches it by bookmark, at the path NPJOE_ADMIN_PATH names. */
          "</span>" +
        "</div>" +
      "</div></footer>";
  }

  /* ---- Consent banner ---------------------------------------------------- */
  function consent() {
    return '<div class="consent no-print" id="consentBanner" role="dialog" aria-live="polite" aria-label="Datenschutzhinweis">' +
      "<h4 style=\"font-size:1.05rem;margin-bottom:.4rem\">" + bi("Datenschutz auf dieser Seite", "Privacy on this site", "यस वेबसाइटमा गोपनीयता") + "</h4>" +
      '<p class="text-sm">' + bi(
        "Diese Website setzt keine Tracking- oder Werbe-Cookies. Wir speichern lediglich lokal in Ihrem Browser, welche Sprache Sie gewählt haben, sowie Zwischenstände Ihrer Formulare.",
        "This website uses no tracking or advertising cookies. We only store your language preference, plus form drafts, locally in your browser.",
        "यस वेबसाइटले ट्र्याकिङ वा विज्ञापन कुकी प्रयोग गर्दैन। तपाईंले रोज्नुभएको भाषा र फारमका अधुरा विवरण मात्र तपाईंकै ब्राउजरमा स्थानीय रूपमा सुरक्षित हुन्छन्।"
      ) + "</p>" +
      '<div class="flex mt-3"><button class="btn btn-sm" id="consentOk" type="button">' + bi("Verstanden", "Understood", "बुझेँ") + "</button>" +
      '<a class="btn btn-sm btn-ghost" href="datenschutz.html">' + bi("Datenschutzerklärung", "Privacy policy", "गोपनीयता नीति") + "</a></div></div>";
  }

  /* ---- Mount ------------------------------------------------------------- */
  function mount() {
    var page = document.body.getAttribute("data-page") || "";
    var h = document.getElementById("siteHeaderMount");
    var f = document.getElementById("siteFooterMount");

    function paint() {
    if (h) h.innerHTML = header(page);
    if (f) f.innerHTML = footer() + consent() +
      '<button class="back-to-top no-print" id="backToTop" type="button" aria-label="Nach oben / Back to top">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' +
      '<div class="toast-wrap" id="toastWrap" aria-live="polite"></div>';
    }

    /* Paint straight away with the built-in data so the page appears fast. */
    paint();

    /* Page scripts render their lists on npjoe:layout-ready, so hold that
       event until the board-edited content has merged — but never for long:
       a slow or missing API must not delay the site. If overrides did arrive,
       repaint the chrome first, since the footer carries contact details. */
    var content = window.NPJOEContent && window.NPJOEContent.ready;
    var proceed = function () {
      if (window.__npjoeLayoutReady) return;
      if (window.NPJOEContent && window.NPJOEContent.hasOverrides) paint();
      window.__npjoeLayoutReady = true;
      document.dispatchEvent(new CustomEvent("npjoe:layout-ready"));
    };
    if (content && typeof content.then === "function") {
      setTimeout(proceed, 1200);
      content.then(proceed, proceed);
    } else {
      proceed();
    }
  }

  /* Mount on DOMContentLoaded so every deferred script and every inline page
     script has had the chance to subscribe to npjoe:layout-ready first. */
  if (document.readyState === "complete") mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
