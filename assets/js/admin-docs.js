/* ==========================================================================
   NPJOE — Document desk in the board area
   Fills a document from a stored submission (or by hand) and prints it.
   ========================================================================== */
(function () {
  "use strict";

  var API = (window.NPJOE && window.NPJOE.forms && window.NPJOE.forms.apiBase) || "/api";
  var T = function (de, en) { return window.npjoeT ? window.npjoeT(de, en) : de; };
  var state = { type: "membership", values: {}, source: [] };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var today = function () { return new Date().toISOString().slice(0, 10); };

  /* Which stored submissions can pre-fill which document. */
  var SOURCE = {
    membership: "membership",
    volunteer: "volunteer",
    donation: "donation",
    school: null
  };

  function prefillFrom(row) {
    var v = {};
    if (state.type === "membership") {
      v.name = [row.vorname, row.nachname].filter(Boolean).join(" ");
      v.membershipNo = row.membershipNo || "";
      v.startDate = (row._receivedAt || "").slice(0, 10);
      v.fee = row.zahlungsintervall === "jaehrlich" ? 5 : 5;
    } else if (state.type === "volunteer") {
      v.name = [row.vorname, row.nachname].filter(Boolean).join(" ");
      /* The stored value is a field key such as "health"; a certificate has to
         name the field the way the website does. */
      var fields = (window.NPJOEContent && window.NPJOEContent.FIELDS) || [];
      v.field = [].concat(row.bereiche || []).map(function (key) {
        var match = fields.filter(function (f) { return f.key === key; })[0];
        return match ? match.de : key;
      }).join(", ");
      if (row.beruf) v.field = v.field ? v.field + " (" + row.beruf + ")" : row.beruf;
      v.from = today();
      v.days = 1;
    } else if (state.type === "donation") {
      v.donor = row.name || "";
      v.donorAddress = [row.adresse, row.land].filter(Boolean).join(", ");
      v.amount = row.betrag === "custom" ? row.betragCustom : row.betrag;
      v.donationDate = (row._receivedAt || "").slice(0, 10);
    }
    return v;
  }

  function renderFields() {
    var tpl = window.NPJOEDocs.TEMPLATES[state.type];
    var host = document.getElementById("docFields");
    host.innerHTML = '<div class="form-grid">' + tpl.fields.map(function (f) {
      var val = state.values[f.key] !== undefined ? state.values[f.key]
        : (f.value !== undefined ? f.value : (f.type === "date" && /date$/i.test(f.key) ? today() : ""));
      state.values[f.key] = val;
      return '<div class="field"><label>' + esc(f.label) +
        (f.required ? ' <span class="req">*</span>' : "") + "</label>" +
        '<input class="input" type="' + (f.type || "text") + '" data-doc-field="' + f.key +
        '" value="' + esc(val) + '"></div>';
    }).join("") + "</div>";
  }

  function renderPreview() {
    var tpl = window.NPJOEDocs.TEMPLATES[state.type];
    var missing = tpl.fields.filter(function (f) {
      return f.required && !String(state.values[f.key] || "").trim();
    });
    var warn = document.getElementById("docWarn");
    warn.innerHTML = "";
    if (tpl.warning) {
      warn.innerHTML += '<div class="callout callout-saffron mb-2"><strong>' +
        T("Vor dem Versand prüfen: ", "Check before sending: ") + "</strong>" + esc(tpl.warning) + "</div>";
    }
    if (missing.length) {
      warn.innerHTML += '<div class="callout mb-2">' +
        T("Noch auszufüllen: ", "Still to fill in: ") +
        missing.map(function (f) { return esc(f.label); }).join(", ") + "</div>";
    }
    document.getElementById("docSheet").innerHTML = tpl.render(state.values);
    var btn = document.getElementById("docPrint");
    btn.disabled = missing.length > 0;
  }

  function loadSource() {
    var type = SOURCE[state.type];
    var picker = document.getElementById("docSource");
    if (!type) {
      picker.innerHTML = '<option value="">' + T("— keine Vorlage aus Eingängen —", "— no stored source —") + "</option>";
      picker.disabled = true;
      return Promise.resolve();
    }
    picker.disabled = false;
    return fetch(API + "/admin/submissions?type=" + type, { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : { items: [] }; })
      .then(function (res) {
        state.source = res.items || [];
        picker.innerHTML = '<option value="">' + T("— leer beginnen —", "— start blank —") + "</option>" +
          state.source.map(function (row, i) {
            var name = [row.vorname, row.nachname].filter(Boolean).join(" ") || row.name || row.email || row._ref;
            return '<option value="' + i + '">' + esc(name) +
              (row.membershipNo ? " · " + esc(row.membershipNo) : "") + "</option>";
          }).join("");
      })
      .catch(function () { picker.innerHTML = '<option value="">—</option>'; });
  }

  function switchType(type) {
    state.type = type;
    state.values = {};
    renderFields();
    renderPreview();
    loadSource();
  }

  function bind() {
    var root = document.getElementById("docsPanel");
    if (!root) return;

    root.addEventListener("change", function (e) {
      if (e.target.id === "docType") return switchType(e.target.value);
      if (e.target.id === "docSource") {
        var idx = e.target.value;
        if (idx === "") { state.values = {}; renderFields(); return renderPreview(); }
        var pre = prefillFrom(state.source[Number(idx)]);
        Object.keys(pre).forEach(function (k) { if (pre[k]) state.values[k] = pre[k]; });
        renderFields();
        renderPreview();
      }
    });

    root.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-doc-field");
      if (!key) return;
      state.values[key] = e.target.value;
      renderPreview();
    });

    document.getElementById("docPrint").addEventListener("click", function () {
      document.body.classList.add("doc-printing");
      window.print();
      setTimeout(function () { document.body.classList.remove("doc-printing"); }, 400);
    });
  }

  window.NPJOEAdminDocs = {
    init: function () {
      var sel = document.getElementById("docType");
      if (sel) {
        sel.innerHTML = Object.keys(window.NPJOEDocs.TEMPLATES).map(function (k) {
          return '<option value="' + k + '">' + esc(window.NPJOEDocs.TEMPLATES[k].label) + "</option>";
        }).join("");
      }
      bind();
      switchType("membership");
    }
  };
})();
