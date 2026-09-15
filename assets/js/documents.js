/* ==========================================================================
   NPJOE — Official documents
   Builds the four printable documents the association has committed to
   issuing: volunteer certificate, school certificate, membership
   confirmation and donation receipt.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------- amounts in words (DE)
     A donation receipt must state the sum in words as well as in figures. */
  var ONES = ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
  var TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn",
               "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
  var TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig",
              "sechzig", "siebzig", "achtzig", "neunzig"];

  function underThousand(n) {
    var out = "";
    var h = Math.floor(n / 100);
    var rest = n % 100;
    if (h) out += ONES[h] + "hundert";
    if (rest >= 20) {
      var unit = rest % 10;
      out += (unit ? ONES[unit] + "und" : "") + TENS[Math.floor(rest / 10)];
    } else if (rest >= 10) {
      out += TEENS[rest - 10];
    } else if (rest > 0) {
      out += ONES[rest];
    }
    return out;
  }

  function integerInWords(n) {
    if (n === 0) return "null";
    var parts = [];
    var millions = Math.floor(n / 1000000);
    var thousands = Math.floor((n % 1000000) / 1000);
    var rest = n % 1000;

    if (millions) {
      parts.push(millions === 1 ? "eine Million" : underThousand(millions) + " Millionen");
    }
    if (thousands) parts.push(underThousand(thousands) + "tausend");
    if (rest) parts.push(underThousand(rest));

    var joined = parts.join(millions ? " " : "");
    /* German writes the final one as "eins", not "ein" — so 1, 101, 1001 and
       201 all end in "eins". Compounds like "einundzwanzig" and "elf" do not
       end in "ein" and are therefore untouched. */
    return joined.replace(/ein$/, "eins");
  }

  /* "50.00" → "fünfzig Euro"; "1234.50" → "eintausendzweihundertvierunddreißig Euro
     und fünfzig Cent" */
  function amountInWords(value) {
    var n = Math.round(Number(value) * 100);
    if (!isFinite(n) || n < 0) return "";
    var euro = Math.floor(n / 100);
    var cent = n % 100;
    var text = integerInWords(euro) + " Euro";
    if (cent) text += " und " + integerInWords(cent) + " Cent";
    return text;
  }

  function formatAmount(value) {
    return Number(value).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function org() {
    var o = (window.NPJOE && window.NPJOE.org) || {};
    var a = o.address || {};
    return {
      name: o.nameDe || "Nepalesische Progressive Jugendorganisation e.V.",
      register: o.register || "VR 84826 – Amtsgericht Darmstadt",
      street: a.street || "",
      zip: a.zip || "",
      city: a.city || "Darmstadt",
      email: o.email || "",
      taxNumber: o.taxNumber || "",
      charitableSinceIso: o.charitableSinceIso || "",
      /* The board is a list now, not a pair of fields. A donation receipt is
         signed by whoever currently holds the office, so the name is looked up
         by role rather than hard-coded — and an older {chair, secretary}
         object still works, because a receipt must never lose its signature
         line over a change of shape in a config file. */
      chair: boardMember(o.board, "chair"),
      secretary: boardMember(o.board, "secretary")
    };
  }

  /* which: "chair" or "secretary" */
  function boardMember(board, which) {
    if (!board) return "";
    if (!Array.isArray(board)) return board[which] || "";
    var wanted = which === "chair" ? /^Vorsitzende/ : /^Schriftf/;
    for (var i = 0; i < board.length; i++) {
      if (wanted.test(board[i].roleDe || "")) return board[i].name || "";
    }
    return "";
  }

  function letterhead() {
    var o = org();
    return '<header class="doc-head">' +
      '<div class="doc-mark" aria-hidden="true">' +
        '<svg viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="17" fill="#c8102e"/>' +
        '<circle cx="42" cy="21" r="7" fill="#e8951a"/>' +
        '<path d="M8 47 L21 25 L30 39 L38 27 L56 47 Z" fill="#fff"/></svg>' +
      "</div>" +
      "<div><strong>" + esc(o.name) + "</strong><br>" +
      '<span class="doc-small">' + esc(o.register) +
      (o.street ? " · " + esc(o.street) : "") + " · " + esc(o.zip) + " " + esc(o.city) +
      (o.email ? " · " + esc(o.email) : "") + "</span></div></header>";
  }

  function signatures(leftRole, rightRole) {
    var o = org();
    return '<div class="doc-sign">' +
      '<div><span class="doc-line"></span>' + esc(o.chair || "") +
        '<br><span class="doc-small">' + esc(leftRole || "Vorsitz") + "</span></div>" +
      '<div><span class="doc-line"></span>' + esc(o.secretary || "") +
        '<br><span class="doc-small">' + esc(rightRole || "Schriftführung") + "</span></div>" +
      "</div>";
  }

  /* --------------------------------------------------------------- templates */
  var TEMPLATES = {
    membership: {
      label: "Mitgliedsbestätigung",
      fields: [
        { key: "name", label: "Name des Mitglieds", required: true },
        { key: "membershipNo", label: "Mitgliedsnummer", required: true },
        { key: "startDate", label: "Mitglied seit", type: "date", required: true },
        { key: "fee", label: "Monatsbeitrag in €", type: "number", value: "5" },
        { key: "place", label: "Ort", value: "Darmstadt" },
        { key: "date", label: "Datum der Ausstellung", type: "date" }
      ],
      render: function (d) {
        return letterhead() +
          '<h1 class="doc-title">Bestätigung der Mitgliedschaft</h1>' +
          "<p>Hiermit bestätigen wir, dass</p>" +
          '<p class="doc-highlight">' + esc(d.name) + "</p>" +
          "<p>seit dem " + esc(formatDate(d.startDate)) + " Mitglied der " + esc(org().name) +
          " ist. Über die Aufnahme hat der Vorstand gemäß § 5 der Satzung beschlossen.</p>" +
          '<dl class="doc-facts">' +
            "<div><dt>Mitgliedsnummer</dt><dd>" + esc(d.membershipNo) + "</dd></div>" +
            "<div><dt>Mitglied seit</dt><dd>" + esc(formatDate(d.startDate)) + "</dd></div>" +
            "<div><dt>Monatsbeitrag</dt><dd>" + esc(formatAmount(d.fee || 5)) + " €</dd></div>" +
          "</dl>" +
          "<p>Die Mitgliedschaft berechtigt zur Teilnahme und Stimmabgabe in der Mitgliederversammlung " +
          "gemäß § 9 der Satzung.</p>" +
          '<p class="doc-place">' + esc(d.place || "Darmstadt") + ", den " +
            esc(formatDate(d.date || new Date().toISOString().slice(0, 10))) + "</p>" +
          signatures();
      }
    },

    volunteer: {
      label: "Volunteer-Zertifikat (One Day for Nation)",
      fields: [
        { key: "name", label: "Name der/des Freiwilligen", required: true },
        { key: "field", label: "Berufsfeld / Einsatzbereich", required: true },
        { key: "school", label: "Schule oder Projekt in Nepal", required: true },
        { key: "from", label: "Einsatz von", type: "date", required: true },
        { key: "to", label: "Einsatz bis", type: "date" },
        { key: "days", label: "Einsatztage", type: "number", value: "1" },
        { key: "place", label: "Ort", value: "Darmstadt" },
        { key: "date", label: "Datum der Ausstellung", type: "date" }
      ],
      render: function (d) {
        var period = d.to && d.to !== d.from
          ? "vom " + formatDate(d.from) + " bis " + formatDate(d.to)
          : "am " + formatDate(d.from);
        return letterhead() +
          '<p class="doc-eyebrow">One Day for Nation · Beschluss NPJOE-2026-001</p>' +
          '<h1 class="doc-title">Zertifikat</h1>' +
          '<p class="doc-center">Hiermit wird bestätigt, dass</p>' +
          '<p class="doc-highlight doc-center">' + esc(d.name) + "</p>" +
          '<p class="doc-center">' + esc(period) + " im Rahmen des Programms " +
          "<strong>One Day for Nation</strong> als Freiwillige:r an</p>" +
          '<p class="doc-highlight doc-center" style="font-size:15pt">' + esc(d.school) + "</p>" +
          '<p class="doc-center">im Bereich <strong>' + esc(d.field) + "</strong> mitgewirkt hat" +
          (d.days ? " — insgesamt " + esc(d.days) + (Number(d.days) === 1 ? " Einsatztag" : " Einsatztage") : "") +
          ".</p>" +
          '<p class="doc-center doc-small" style="margin-top:14mm">Die Umsetzung vor Ort erfolgte in ' +
          "Zusammenarbeit mit der Nepalese Progressive Youth Society - Nepal (NPYS-N).<br>" +
          "Wir danken für das ehrenamtliche Engagement.</p>" +
          '<p class="doc-place">' + esc(d.place || "Darmstadt") + ", den " +
            esc(formatDate(d.date || new Date().toISOString().slice(0, 10))) + "</p>" +
          signatures("Vorsitz, NPJOE e.V.", "Koordination, NPYS-N");
      }
    },

    school: {
      label: "Schulzertifikat „Erste-Hilfe-Schule“",
      fields: [
        { key: "school", label: "Name der Schule", required: true },
        { key: "district", label: "Distrikt / Region", required: true },
        { key: "students", label: "Geschulte Schüler:innen", type: "number", required: true },
        { key: "teachers", label: "Ausgebildete Lehrkräfte (Trainer:innen)", type: "number" },
        { key: "trainingDate", label: "Datum der Schulung", type: "date", required: true },
        { key: "validUntil", label: "Gültig bis (Auffrischung)", type: "date" },
        { key: "place", label: "Ort", value: "Darmstadt" },
        { key: "date", label: "Datum der Ausstellung", type: "date" }
      ],
      render: function (d) {
        return letterhead() +
          '<p class="doc-eyebrow">Nationale Erste-Hilfe-Kampagne · Programm 02</p>' +
          '<h1 class="doc-title">Erste-Hilfe-Schule</h1>' +
          '<p class="doc-center">Diese Auszeichnung wird verliehen an</p>' +
          '<p class="doc-highlight doc-center">' + esc(d.school) + "</p>" +
          '<p class="doc-center doc-small">' + esc(d.district) + ", Nepal</p>" +
          '<p class="doc-center" style="margin-top:8mm">Am ' + esc(formatDate(d.trainingDate)) +
          " wurden an dieser Schule</p>" +
          '<dl class="doc-facts">' +
            "<div><dt>Schüler:innen der Klassen 9–12</dt><dd>" + esc(d.students) + " zertifiziert</dd></div>" +
            (d.teachers ? "<div><dt>Lehrkräfte als dauerhafte Trainer:innen</dt><dd>" + esc(d.teachers) + " ausgebildet</dd></div>" : "") +
            "<div><dt>Ausstattung</dt><dd>Zertifiziertes Erste-Hilfe-Kit und Handbücher auf Nepali</dd></div>" +
            (d.validUntil ? "<div><dt>Auffrischung vorgesehen bis</dt><dd>" + esc(formatDate(d.validUntil)) + "</dd></div>" : "") +
          "</dl>" +
          "<p>Die ausgebildeten Lehrkräfte führen die Erste-Hilfe-Kurse an dieser Schule eigenständig " +
          "weiter. NPYS-N besucht die Schule jährlich zur Auffrischung.</p>" +
          '<p class="doc-place">' + esc(d.place || "Darmstadt") + ", den " +
            esc(formatDate(d.date || new Date().toISOString().slice(0, 10))) + "</p>" +
          signatures("Vorsitz, NPJOE e.V.", "Koordination, NPYS-N");
      }
    },

    donation: {
      label: "Zuwendungsbestätigung (Spendenquittung)",
      warning: "Prüfen Sie vor dem Versand die Angaben zum Freistellungsbescheid. " +
               "Für den Abzug beim Finanzamt ist der amtlich vorgeschriebene Vordruck maßgeblich — " +
               "lassen Sie die Fassung einmalig steuerlich prüfen.",
      fields: [
        { key: "donor", label: "Name der/des Zuwendenden", required: true },
        { key: "donorAddress", label: "Anschrift der/des Zuwendenden", required: true },
        { key: "amount", label: "Betrag in €", type: "number", required: true },
        { key: "donationDate", label: "Tag der Zuwendung", type: "date", required: true },
        { key: "taxOffice", label: "Finanzamt", value: "Finanzamt Darmstadt" },
        { key: "taxNumber", label: "Steuernummer", value: org().taxNumber },
        { key: "noticeDate", label: "Freistellungsbescheid vom", type: "date", value: org().charitableSinceIso },
        { key: "purposeYear", label: "Für den Veranlagungszeitraum", value: String(new Date().getFullYear()) },
        { key: "place", label: "Ort", value: "Darmstadt" },
        { key: "date", label: "Datum der Ausstellung", type: "date" }
      ],
      render: function (d) {
        var o = org();
        return letterhead() +
          '<h1 class="doc-title">Bestätigung über Geldzuwendungen</h1>' +
          '<p class="doc-small doc-center">im Sinne des § 10b des Einkommensteuergesetzes an eine der in ' +
          "§ 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes bezeichneten Körperschaften</p>" +
          '<dl class="doc-facts" style="margin-top:8mm">' +
            "<div><dt>Zuwendende:r</dt><dd>" + esc(d.donor) + "<br>" + esc(d.donorAddress) + "</dd></div>" +
            "<div><dt>Betrag der Zuwendung</dt><dd><strong>" + esc(formatAmount(d.amount)) + " €</strong></dd></div>" +
            "<div><dt>in Buchstaben</dt><dd>" + esc(amountInWords(d.amount)) + "</dd></div>" +
            "<div><dt>Tag der Zuwendung</dt><dd>" + esc(formatDate(d.donationDate)) + "</dd></div>" +
            "<div><dt>Art der Zuwendung</dt><dd>Geldzuwendung</dd></div>" +
          "</dl>" +
          "<p>Es handelt sich nicht um den Verzicht auf die Erstattung von Aufwendungen.</p>" +
          "<p>Wir sind wegen Förderung der in § 3 der Satzung genannten gemeinnützigen und mildtätigen " +
          "Zwecke nach dem Freistellungsbescheid des " + esc(d.taxOffice || "—") +
          (d.taxNumber ? ", Steuernummer " + esc(d.taxNumber) : "") +
          (d.noticeDate ? ", vom " + esc(formatDate(d.noticeDate)) : "") +
          " für den letzten Veranlagungszeitraum " + esc(d.purposeYear || "") +
          " nach § 5 Abs. 1 Nr. 9 des Körperschaftsteuergesetzes von der Körperschaftsteuer und nach " +
          "§ 3 Nr. 6 des Gewerbesteuergesetzes von der Gewerbesteuer befreit.</p>" +
          "<p>Es wird bestätigt, dass die Zuwendung nur zur Förderung der satzungsmäßigen Zwecke " +
          "verwendet wird.</p>" +
          '<p class="doc-place">' + esc(d.place || "Darmstadt") + ", den " +
            esc(formatDate(d.date || new Date().toISOString().slice(0, 10))) + "</p>" +
          signatures("Vorsitz", "Schatzmeisterei") +
          '<p class="doc-note doc-small">Hinweis: Wer vorsätzlich oder grob fahrlässig eine unrichtige ' +
          "Zuwendungsbestätigung erstellt oder veranlasst, dass Zuwendungen nicht zu den in der " +
          "Bestätigung angegebenen steuerbegünstigten Zwecken verwendet werden, haftet für die " +
          "entgangene Steuer. Diese Bestätigung wird nicht als Nachweis für die steuerliche " +
          "Berücksichtigung der Zuwendung anerkannt, wenn das Datum des Freistellungsbescheides " +
          "länger als 5 Jahre bzw. das Datum der Feststellung der Einhaltung der satzungsmäßigen " +
          "Voraussetzungen länger als 3 Jahre seit Ausstellung des Bescheides zurückliegt.</p>";
      }
    }
  };

  window.NPJOEDocs = {
    TEMPLATES: TEMPLATES,
    amountInWords: amountInWords,
    integerInWords: integerInWords,
    formatAmount: formatAmount,
    formatDate: formatDate
  };
})();
