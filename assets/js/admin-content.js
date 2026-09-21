/* ==========================================================================
   NPJOE — Content editor for the board area
   Edits the collections the board maintains: events, news, FAQ, impact
   figures and organisation details. Everything else (statutes, imprint,
   privacy policy, page layout) stays in code on purpose.
   ========================================================================== */
(function () {
  "use strict";

  var API = (window.NPJOE && window.NPJOE.forms && window.NPJOE.forms.apiBase) || "/api";
  var T = function (de, en, ne) { return window.npjoeT ? window.npjoeT(de, en, ne) : de; };

  /* Field definitions drive the whole editor — add a field here and it
     appears in the form, is saved, and reaches the website. */
  var SCHEMA = {
    events: {
      labelDe: "Veranstaltungen", labelEn: "Events", labelNe: "कार्यक्रम",
      hintDe: "Termine erscheinen auf der Startseite und unter „Veranstaltungen“ — inklusive Kalender-Download.",
      hintEn: "Dates appear on the home page and under 'Events' — including calendar download.",
      hintNe: "कार्यक्रम गृहपृष्ठ र „कार्यक्रम“ खण्डमा देखिन्छन् — पात्रो डाउनलोडसहित।",
      titleKey: "de",
      sort: function (a, b) { return (a.date || "") < (b.date || "") ? -1 : 1; },
      blank: function () { return { id: "ev-" + Date.now(), date: "", time: "", de: "", en: "", ne: "", placeDe: "", placeEn: "", placeNe: "", descDe: "", descEn: "", descNe: "", tags: "" }; },
      fields: [
        { key: "date", de: "Datum", en: "Date", type: "date", required: true, half: true },
        { key: "time", de: "Uhrzeit", en: "Time", type: "text", half: true, phDe: "z. B. 14:00–19:00" },
        { key: "de", de: "Titel (Deutsch)", en: "Title (German)", type: "text", required: true },
        { key: "en", de: "Titel (Englisch)", en: "Title (English)", type: "text" },
        { key: "ne", de: "Titel (Nepali)", en: "Title (Nepali)", ne: "शीर्षक (नेपाली)", type: "text" },
        { key: "placeDe", de: "Ort (Deutsch)", en: "Place (German)", type: "text", half: true },
        { key: "placeEn", de: "Ort (Englisch)", en: "Place (English)", type: "text", half: true },
        { key: "placeNe", de: "Ort (Nepali)", en: "Place (Nepali)", ne: "स्थान (नेपाली)", type: "text", half: true },
        { key: "descDe", de: "Beschreibung (Deutsch)", en: "Description (German)", type: "textarea" },
        { key: "descEn", de: "Beschreibung (Englisch)", en: "Description (English)", type: "textarea" },
        { key: "descNe", de: "Beschreibung (Nepali)", en: "Description (Nepali)", ne: "विवरण (नेपाली)", type: "textarea" },
        { key: "tags", de: "Schlagwörter", en: "Tags", type: "text",
          phDe: "volunteer erste-hilfe bildung kultur sport online mitglieder",
          hintDe: "Mit Leerzeichen getrennt — steuert die Filter auf der Terminseite.",
          hintEn: "Space separated — drives the filters on the events page." }
      ]
    },
    news: {
      labelDe: "News", labelEn: "News", labelNe: "समाचार",
      hintDe: "Beiträge erscheinen im Feed. Der Volltext lässt sich in der Karte aufklappen.",
      hintEn: "Posts appear in the feed. The full text expands inside the card.",
      hintNe: "समाचार फिडमा देखिन्छन्। पूरा पाठ कार्डभित्रै खुल्छ।",
      titleKey: "de",
      sort: function (a, b) { return (a.date || "") > (b.date || "") ? -1 : 1; },
      blank: function () { return { id: "n-" + Date.now(), date: new Date().toISOString().slice(0, 10), tag: "verein", de: "", en: "", ne: "", exDe: "", exEn: "", exNe: "", bodyDe: "", bodyEn: "", bodyNe: "" }; },
      fields: [
        { key: "date", de: "Datum", en: "Date", type: "date", required: true, half: true },
        { key: "tag", de: "Kategorie", en: "Category", type: "select", half: true,
          options: ["verein", "partner", "erste-hilfe", "volunteer", "spenden", "kultur"] },
        { key: "de", de: "Überschrift (Deutsch)", en: "Headline (German)", type: "text", required: true },
        { key: "en", de: "Überschrift (Englisch)", en: "Headline (English)", type: "text" },
        { key: "ne", de: "Überschrift (Nepali)", en: "Headline (Nepali)", ne: "शीर्षक (नेपाली)", type: "text" },
        { key: "exDe", de: "Anrisstext (Deutsch)", en: "Excerpt (German)", type: "textarea" },
        { key: "exEn", de: "Anrisstext (Englisch)", en: "Excerpt (English)", type: "textarea" },
        { key: "exNe", de: "Anrisstext (Nepali)", en: "Excerpt (Nepali)", ne: "सारांश (नेपाली)", type: "textarea" },
        { key: "bodyDe", de: "Volltext (Deutsch)", en: "Full text (German)", type: "textarea", big: true,
          hintDe: "Optional. Wenn gefüllt, erscheint „Weiterlesen“ in der Karte.",
          hintEn: "Optional. When filled, a 'read more' link appears in the card." },
        { key: "bodyEn", de: "Volltext (Englisch)", en: "Full text (English)", type: "textarea", big: true },
        { key: "bodyNe", de: "Volltext (Nepali)", en: "Full text (Nepali)", ne: "पूरा पाठ (नेपाली)", type: "textarea", big: true }
      ]
    },
    faq: {
      labelDe: "FAQ", labelEn: "FAQ", labelNe: "जिज्ञासा",
      hintDe: "Fragen und Antworten, nach Kategorie filterbar.",
      hintEn: "Questions and answers, filterable by category.",
      hintNe: "प्रश्न र उत्तर, वर्गअनुसार छान्न मिल्ने।",
      titleKey: "qDe",
      blank: function () { return { cat: "mitglied", qDe: "", qEn: "", qNe: "", aDe: "", aEn: "", aNe: "" }; },
      fields: [
        { key: "cat", de: "Kategorie", en: "Category", type: "select",
          options: ["mitglied", "volunteer", "spenden", "programme", "verein"] },
        { key: "qDe", de: "Frage (Deutsch)", en: "Question (German)", type: "text", required: true },
        { key: "qEn", de: "Frage (Englisch)", en: "Question (English)", type: "text" },
        { key: "qNe", de: "Frage (Nepali)", en: "Question (Nepali)", ne: "प्रश्न (नेपाली)", type: "text" },
        { key: "aDe", de: "Antwort (Deutsch)", en: "Answer (German)", type: "textarea", required: true, big: true },
        { key: "aEn", de: "Antwort (Englisch)", en: "Answer (English)", type: "textarea", big: true },
        { key: "aNe", de: "Antwort (Nepali)", en: "Answer (Nepali)", ne: "उत्तर (नेपाली)", type: "textarea", big: true }
      ]
    }
  };

  var FIGURES = [
    { key: "schoolsReached", de: "Erreichte Partnerschulen", en: "Partner schools reached", ne: "पुगिएका साझेदार विद्यालय" },
    { key: "schoolsTarget", de: "Ziel: Schulen bis 2030", en: "Target: schools by 2030", ne: "लक्ष्य: २०३० सम्ममा विद्यालय" },
    { key: "studentsTrained", de: "Geschulte Schüler:innen", en: "Students trained", ne: "तालिम पाएका विद्यार्थी" },
    { key: "teachersCertified", de: "Zertifizierte Lehrkräfte", en: "Certified teachers", ne: "प्रमाणित शिक्षक" },
    { key: "volunteers", de: "Registrierte Volunteers", en: "Registered volunteers", ne: "दर्ता भएका स्वयंसेवक" },
    { key: "countries", de: "Länder der Diaspora", en: "Diaspora countries", ne: "प्रवासी समुदाय भएका देश" },
    { key: "donationsEur", de: "Spenden bisher (€)", en: "Donations so far (€)", ne: "अहिलेसम्मको दान (€)" },
    { key: "donationGoalEur", de: "Jahresziel Spenden (€)", en: "Annual donation goal (€)", ne: "वार्षिक दान लक्ष्य (€)" }
  ];

  var ORG_FIELDS = [
    { key: "email", de: "E-Mail allgemein", en: "General e-mail", ne: "सामान्य इमेल" },
    { key: "emailMembership", de: "E-Mail Mitgliedschaft", en: "Membership e-mail", ne: "सदस्यता इमेल" },
    { key: "emailVolunteer", de: "E-Mail Volunteering", en: "Volunteering e-mail", ne: "स्वयंसेवा इमेल" },
    { key: "emailDonation", de: "E-Mail Spenden", en: "Donations e-mail", ne: "दान इमेल" },
    { key: "phone", de: "Telefon", en: "Phone", ne: "फोन" },
    { key: "address.street", de: "Straße und Hausnummer", en: "Street and number", ne: "सडक र घर नम्बर" },
    { key: "address.zip", de: "PLZ", en: "ZIP code", ne: "हुलाक कोड" },
    { key: "address.city", de: "Ort", en: "City", ne: "सहर" },
    { key: "bank.holder", de: "Kontoinhaber", en: "Account holder", ne: "खातावाला" },
    { key: "bank.iban", de: "IBAN", en: "IBAN", ne: "IBAN" },
    { key: "bank.bic", de: "BIC", en: "BIC", ne: "BIC" },
    { key: "bank.bank", de: "Bank", en: "Bank", ne: "बैङ्क" }
  ];

  var state = { data: null, dirty: false };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o && o[k]; }, obj);
  }
  function set(obj, path, value) {
    var keys = path.split("."), last = keys.pop();
    var target = keys.reduce(function (o, k) { o[k] = o[k] || {}; return o[k]; }, obj);
    target[last] = value;
  }
  function markDirty() {
    state.dirty = true;
    var b = document.getElementById("contentSave");
    if (b) b.disabled = false;
    var s = document.getElementById("contentDirty");
    if (s) s.classList.remove("hide");
  }

  /* ------------------------------------------------------------- rendering */
  function fieldMarkup(def, value, path) {
    var label = T(def.de, def.en, def.ne) + (def.required ? ' <span class="req">*</span>' : "");
    var hint = def.hintDe ? '<span class="hint">' + esc(T(def.hintDe, def.hintEn || def.hintDe, def.hintNe)) + "</span>" : "";
    var ph = def.phDe ? ' placeholder="' + esc(T(def.phDe, def.phEn || def.phDe, def.phNe)) + '"' : "";
    var input;
    if (def.type === "textarea") {
      input = '<textarea class="input" rows="' + (def.big ? 5 : 2) + '" data-path="' + path + '"' + ph + '>' + esc(value) + "</textarea>";
    } else if (def.type === "select") {
      input = '<select class="select" data-path="' + path + '">' +
        def.options.map(function (o) {
          return '<option value="' + o + '"' + (String(value) === o ? " selected" : "") + ">" + o + "</option>";
        }).join("") + "</select>";
    } else {
      input = '<input class="input" type="' + (def.type || "text") + '" data-path="' + path + '" value="' + esc(value) + '"' + ph + ">";
    }
    return '<div class="field' + (def.half ? "" : " span-2") + '"><label>' + label + "</label>" + input + hint + "</div>";
  }

  function renderCollection(name) {
    var schema = SCHEMA[name];
    var items = state.data[name] || [];
    var host = document.getElementById("ce-" + name);
    if (!host) return;

    if (!items.length) {
      host.innerHTML = '<p class="text-muted">' + T("Noch keine Einträge.", "No entries yet.", "अहिलेसम्म कुनै विवरण छैन।") + "</p>";
      return;
    }
    host.innerHTML = items.map(function (item, i) {
      var title = esc(item[schema.titleKey] || T("(ohne Titel)", "(untitled)", "(शीर्षकविहीन)"));
      return '<details class="acc-item ce-row" data-index="' + i + '">' +
        "<summary><span>" + (item.date ? '<span class="badge badge-outline">' + esc(item.date) + "</span> " : "") +
        title + "</span></summary>" +
        '<div class="acc-body"><div class="form-grid">' +
        schema.fields.map(function (f) {
          return fieldMarkup(f, item[f.key], name + "." + i + "." + f.key);
        }).join("") +
        '</div><div class="flex mt-3">' +
        '<button class="btn btn-sm btn-ghost" type="button" data-move="up" data-coll="' + name + '" data-i="' + i + '">↑</button>' +
        '<button class="btn btn-sm btn-ghost" type="button" data-move="down" data-coll="' + name + '" data-i="' + i + '">↓</button>' +
        '<button class="btn btn-sm btn-ghost" type="button" data-dup data-coll="' + name + '" data-i="' + i + '">' + T("Duplizieren", "Duplicate", "प्रतिलिपि") + "</button>" +
        '<button class="btn btn-sm btn-ghost" type="button" data-del data-coll="' + name + '" data-i="' + i + '" style="color:var(--err)">' + T("Löschen", "Delete", "मेटाउनुहोस्") + "</button>" +
        "</div></div></details>";
    }).join("");
  }

  function renderFigures() {
    var host = document.getElementById("ce-figures");
    if (!host) return;
    var figures = state.data.figures || {};
    host.innerHTML = '<div class="form-grid">' + FIGURES.map(function (f) {
      return '<div class="field"><label>' + T(f.de, f.en, f.ne) + "</label>" +
        '<input class="input" type="number" min="0" data-path="figures.' + f.key + '" value="' + esc(figures[f.key] != null ? figures[f.key] : "") + '"></div>';
    }).join("") + "</div>";
  }

  function renderOrg() {
    var host = document.getElementById("ce-org");
    if (!host) return;
    var org = state.data.org || {};
    host.innerHTML = '<div class="form-grid">' + ORG_FIELDS.map(function (f) {
      return '<div class="field"><label>' + T(f.de, f.en, f.ne) + "</label>" +
        '<input class="input" type="text" data-path="org.' + f.key + '" value="' + esc(get(org, f.key) || "") + '"></div>';
    }).join("") + "</div>";
  }

  function renderAll() {
    Object.keys(SCHEMA).forEach(renderCollection);
    renderFigures();
    renderOrg();
    var stamp = document.getElementById("contentStamp");
    if (stamp) {
      stamp.textContent = state.data.updatedAt
        ? T("Zuletzt gespeichert: ", "Last saved: ", "पछिल्लो पटक सुरक्षित: ") + new Date(state.data.updatedAt).toLocaleString(T("de-DE", "en-GB", "ne-NP")) +
          (state.data.updatedBy ? " · " + state.data.updatedBy : "")
        : T("Noch nie über diesen Bereich gespeichert — es gelten die Werte aus dem Code.",
            "Never saved through this area — the values from the code apply.",
      "यो क्षेत्रबाट कहिल्यै सुरक्षित गरिएको छैन — कोडका मान लागू हुन्छन्।");
    }
  }

  /* --------------------------------------------------------------- loading */
  function seedFromDefaults(data) {
    /* First use: pre-fill the editor with what the site currently shows, so
       the board edits real content instead of an empty form. */
    var C = window.NPJOEContent || {};
    if (!data.events) data.events = JSON.parse(JSON.stringify(C.EVENTS || []));
    if (!data.news) data.news = JSON.parse(JSON.stringify(C.NEWS || []));
    if (!data.faq) data.faq = JSON.parse(JSON.stringify(C.FAQ || []));
    if (!data.figures) data.figures = Object.assign({}, (window.NPJOE || {}).impact);
    if (!data.org) {
      var o = (window.NPJOE || {}).org || {};
      data.org = {
        email: o.email, emailMembership: o.emailMembership, emailVolunteer: o.emailVolunteer,
        emailDonation: o.emailDonation, phone: o.phone,
        address: Object.assign({}, o.address), bank: Object.assign({}, o.bank)
      };
    }
    return data;
  }

  function load() {
    return fetch(API + "/admin/content", { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("load"); return r.json(); })
      .then(function (data) {
        state.data = seedFromDefaults(data || {});
        state.dirty = false;
        renderAll();
      });
  }

  function save() {
    var btn = document.getElementById("contentSave");
    var original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = T("Wird gespeichert …", "Saving …", "सुरक्षित गर्दै …");
    var payload = JSON.parse(JSON.stringify(state.data));
    payload._editor = (document.getElementById("contentEditorName") || {}).value || "Vorstand";

    fetch(API + "/admin/content", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (body) { return { ok: r.ok, status: r.status, body: body }; });
    }).then(function (res) {
      btn.innerHTML = original;
      if (!res.ok) {
        btn.disabled = false;
        var fields = (res.body && res.body.fields) || [];
        window.npjoeToast(
          T("Nicht gespeichert. Bitte prüfen: ", "Not saved. Please check: ", "सुरक्षित भएन। कृपया जाँच्नुहोस्: ") + fields.join(", "),
          "err"
        );
        return;
      }
      state.dirty = false;
      state.data.updatedAt = res.body.updatedAt;
      state.data.updatedBy = payload._editor;
      var d = document.getElementById("contentDirty");
      if (d) d.classList.add("hide");
      renderAll();
      window.npjoeToast(T("Gespeichert. Die Website zeigt die Änderung sofort.",
                          "Saved. The website shows the change immediately.",
      "सुरक्षित भयो। वेबसाइटमा परिवर्तन तुरुन्तै देखिन्छ।"), "ok");
    }).catch(function () {
      btn.disabled = false;
      btn.innerHTML = original;
      window.npjoeToast(T("Speichern fehlgeschlagen — läuft der Server?", "Saving failed — is the server running?", "सुरक्षित गर्न सकिएन — सर्भर चलिरहेको छ?"), "err");
    });
  }

  /* ---------------------------------------------------------------- events */
  function bind() {
    var root = document.getElementById("contentPanel");
    if (!root) return;

    /* Any field edit writes straight into the working copy. */
    root.addEventListener("input", function (e) {
      var path = e.target.getAttribute && e.target.getAttribute("data-path");
      if (!path) return;
      var value = e.target.value;
      if (e.target.type === "number") value = value === "" ? "" : Number(value);
      /* "events.3.title" → collection, index, key */
      var bits = path.split(".");
      if (SCHEMA[bits[0]]) {
        state.data[bits[0]][Number(bits[1])][bits[2]] = value;
      } else {
        set(state.data, path, value);
      }
      markDirty();
    });
    root.addEventListener("change", function (e) {
      if (e.target.tagName === "SELECT" && e.target.getAttribute("data-path")) {
        var bits = e.target.getAttribute("data-path").split(".");
        if (SCHEMA[bits[0]]) state.data[bits[0]][Number(bits[1])][bits[2]] = e.target.value;
        markDirty();
      }
    });

    root.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var coll = b.getAttribute("data-coll");
      var i = parseInt(b.getAttribute("data-i"), 10);

      if (b.hasAttribute("data-add")) {
        var name = b.getAttribute("data-add");
        state.data[name] = state.data[name] || [];
        state.data[name].unshift(SCHEMA[name].blank());
        markDirty(); renderCollection(name);
        var first = document.querySelector("#ce-" + name + " .ce-row");
        if (first) first.open = true;
        return;
      }
      if (b.hasAttribute("data-del")) {
        if (!confirm(T("Diesen Eintrag wirklich löschen?", "Really delete this entry?", "यो प्रविष्टि साँच्चै मेटाउने?"))) return;
        state.data[coll].splice(i, 1);
        markDirty(); renderCollection(coll);
        return;
      }
      if (b.hasAttribute("data-dup")) {
        var copy = JSON.parse(JSON.stringify(state.data[coll][i]));
        if (copy.id) copy.id = copy.id + "-copy";
        state.data[coll].splice(i + 1, 0, copy);
        markDirty(); renderCollection(coll);
        return;
      }
      if (b.hasAttribute("data-move")) {
        var to = b.getAttribute("data-move") === "up" ? i - 1 : i + 1;
        if (to < 0 || to >= state.data[coll].length) return;
        var arr = state.data[coll];
        var tmp = arr[i]; arr[i] = arr[to]; arr[to] = tmp;
        markDirty(); renderCollection(coll);
        return;
      }
      if (b.id === "contentSave") save();
      if (b.id === "contentReload") {
        if (state.dirty && !confirm(T("Nicht gespeicherte Änderungen verwerfen?", "Discard unsaved changes?", "सुरक्षित नगरिएका परिवर्तन हटाउने?"))) return;
        load().then(function () { window.npjoeToast(T("Neu geladen.", "Reloaded.", "पुनः लोड भयो।"), "ok"); });
      }
    });

    /* Guard against losing work by navigating away. */
    window.addEventListener("beforeunload", function (e) {
      if (!state.dirty) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  window.NPJOEAdminContent = {
    init: function () { bind(); return load(); },
    reload: load
  };
})();
