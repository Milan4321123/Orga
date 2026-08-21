/* ==========================================================================
   NPJOE — Data-subject requests in the board area
   Answering "what do you hold about me?" (Art. 15) and "delete it"
   (Art. 17) within the one-month deadline the privacy policy promises.
   ========================================================================== */
(function () {
  "use strict";

  var API = (window.NPJOE && window.NPJOE.forms && window.NPJOE.forms.apiBase) || "/api";
  var T = function (de, en) { return window.npjoeT ? window.npjoeT(de, en) : de; };
  var last = { query: "", items: [] };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var TYPE_LABEL = {
    membership: ["Beitrittserklärung", "Membership application"],
    volunteer: ["Volunteer-Registrierung", "Volunteer registration"],
    donation: ["Spendenzusage", "Donation pledge"],
    contact: ["Kontaktanfrage", "Contact enquiry"],
    partner: ["Kooperationsanfrage", "Cooperation enquiry"],
    newsletter: ["Newsletter-Anmeldung", "Newsletter sign-up"]
  };

  function search() {
    var q = document.getElementById("dsQuery").value.trim();
    var out = document.getElementById("dsResult");
    if (q.length < 3) {
      out.innerHTML = '<p class="text-muted">' +
        T("Bitte mindestens drei Zeichen eingeben.", "Please enter at least three characters.") + "</p>";
      return;
    }
    out.innerHTML = '<p class="text-muted">' + T("Wird gesucht …", "Searching …") + "</p>";

    fetch(API + "/admin/person?q=" + encodeURIComponent(q), { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        last = { query: q, items: res.items || [] };
        render(res);
      })
      .catch(function () {
        out.innerHTML = '<div class="callout" style="border-color:var(--err)">' +
          T("Suche fehlgeschlagen.", "Search failed.") + "</div>";
      });
  }

  function render(res) {
    var out = document.getElementById("dsResult");
    if (!res.count) {
      out.innerHTML = '<div class="callout callout-ok"><strong>' +
        T("Keine Daten gefunden.", "No data found.") + "</strong> " +
        T("Zu dieser Angabe ist nichts gespeichert. Das können Sie der Person so mitteilen.",
          "Nothing is stored under this entry. You can tell the person exactly that.") + "</div>";
      document.getElementById("dsActions").classList.add("hide");
      return;
    }

    var retained = res.retainedTypes || [];
    out.innerHTML =
      '<p class="text-sm text-muted mb-2">' + res.count + " " +
        T("Datensätze gefunden für", "records found for") + " <strong>" + esc(res.query) + "</strong></p>" +
      res.items.map(function (item) {
        var lab = TYPE_LABEL[item.type] || [item.type, item.type];
        var r = item.record;
        var isRestricted = r._restricted === true;
        var willRetain = retained.indexOf(item.type) !== -1;
        var fields = Object.keys(r).filter(function (k) { return k[0] !== "_" && r[k] !== "" && r[k] != null; });
        return '<details class="acc-item mb-2"><summary><span>' +
          '<span class="badge ' + (isRestricted ? "badge-warn" : willRetain ? "badge-navy" : "badge-outline") + '">' +
            (isRestricted ? T("eingeschränkt", "restricted") : T(lab[0], lab[1])) + "</span> " +
          esc(r._ref || "") + " · " + fields.length + " " + T("Felder", "fields") +
          "</span></summary><div class=\"acc-body\">" +
          (isRestricted ? '<p class="text-sm"><strong>' + T("Bereits eingeschränkt: ", "Already restricted: ") +
             "</strong>" + esc(r._restrictedReason || "") + " · " +
             T("aufzubewahren bis", "retain until") + " " + esc(r._retainUntil || "") + "</p>" : "") +
          '<dl class="review-list">' + fields.map(function (k) {
            var v = r[k];
            if (Array.isArray(v)) v = v.join(", ");
            if (typeof v === "boolean") v = v ? T("Ja", "Yes") : T("Nein", "No");
            if (String(v).indexOf("data:image") === 0) v = T("[Unterschrift]", "[signature]");
            return '<div class="review-row"><dt>' + esc(k) + "</dt><dd>" + esc(String(v).slice(0, 300)) + "</dd></div>";
          }).join("") + "</dl></div></details>";
      }).join("");

    /* Explain, before anything is clicked, exactly what erasure will do. */
    var toDelete = res.items.filter(function (i) { return retained.indexOf(i.type) === -1 && !i.record._restricted; });
    var toRestrict = res.items.filter(function (i) { return retained.indexOf(i.type) !== -1 && !i.record._restricted; });
    document.getElementById("dsPlan").innerHTML =
      '<div class="callout callout-navy"><strong>' + T("Was beim Löschen passiert:", "What erasure will do:") + "</strong>" +
      "<ul class=\"mt-2 text-sm\">" +
        "<li><strong>" + toDelete.length + "</strong> " +
          T("Datensätze werden vollständig gelöscht", "records will be deleted outright") +
          (toDelete.length ? " (" + toDelete.map(function (i) { return T(TYPE_LABEL[i.type][0], TYPE_LABEL[i.type][1]); }).join(", ") + ")" : "") + "</li>" +
        "<li><strong>" + toRestrict.length + "</strong> " +
          T("Datensätze werden eingeschränkt statt gelöscht — Beitrags- und Spendenbuchhaltung unterliegt der steuerlichen Aufbewahrungspflicht (§ 147 AO, § 50 EStDV). Dabei bleiben nur die dafür nötigen Felder übrig; Anschrift, Geburtsdatum, E-Mail und Freitexte werden entfernt.",
            "records will be restricted rather than deleted — membership and donation accounting is subject to statutory retention (§ 147 AO, § 50 EStDV). Only the fields needed for that remain; address, date of birth, e-mail and free text are removed.") + "</li>" +
      "</ul></div>";
    document.getElementById("dsActions").classList.remove("hide");
  }

  function exportFile() {
    var q = document.getElementById("dsQuery").value.trim();
    if (q.length < 3) return;
    window.location.href = API + "/admin/person-export?q=" + encodeURIComponent(q);
  }

  function erase() {
    var q = document.getElementById("dsQuery").value.trim();
    var actor = (document.getElementById("dsActor") || {}).value || "Vorstand";
    if (q.length < 3) return;
    if (!confirm(T(
      "Wirklich löschen? Vollständig gelöschte Datensätze lassen sich nicht wiederherstellen.",
      "Really erase? Records deleted outright cannot be recovered."))) return;

    fetch(API + "/admin/erase", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: q, confirm: true, actor: actor })
    }).then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
      .then(function (res) {
        if (!res.ok) {
          window.npjoeToast(T("Löschen fehlgeschlagen.", "Erasure failed."), "err");
          return;
        }
        var b = res.body;
        document.getElementById("dsReceipt").innerHTML =
          '<div class="callout callout-ok"><strong>' + T("Erledigt am ", "Completed on ") +
          new Date(b.at).toLocaleString(T("de-DE", "en-GB")) + "</strong>" +
          "<p class=\"text-sm mt-2\">" + b.deleted.length + " " + T("gelöscht", "deleted") + " · " +
          b.restricted.length + " " + T("eingeschränkt", "restricted") + " · " +
          T("bearbeitet von", "handled by") + " " + esc(b.actor) + "</p>" +
          (b.restricted.length ? "<p class=\"text-sm mt-1\">" +
            T("Eingeschränkt bleiben nur: ", "Restricted records keep only: ") +
            b.restricted.map(function (r2) { return esc(r2.keeps.join(", ")); }).join(" · ") + "</p>" : "") +
          "<p class=\"text-sm mt-2\">" + T(
            "Teilen Sie der Person mit, was gelöscht und was aus steuerlichen Gründen eingeschränkt aufbewahrt wird.",
            "Tell the person what was deleted and what is retained in restricted form for tax reasons.") +
          "</p></div>";
        window.npjoeToast(T("Anfrage bearbeitet.", "Request handled."), "ok");
        search();
        loadLog();
      });
  }

  function loadLog() {
    fetch(API + "/admin/erasures", { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var host = document.getElementById("dsLog");
        if (!host) return;
        var items = res.items || [];
        if (!items.length) {
          host.innerHTML = '<p class="text-sm text-muted">' +
            T("Noch keine Löschungen protokolliert.", "No erasures logged yet.") + "</p>";
          return;
        }
        host.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
          "<th>" + T("Zeitpunkt", "When") + "</th><th>" + T("Bearbeitet von", "Handled by") + "</th>" +
          "<th>" + T("Gelöscht", "Deleted") + "</th><th>" + T("Eingeschränkt", "Restricted") + "</th>" +
          "<th>" + T("Kennung", "Reference") + "</th></tr></thead><tbody>" +
          items.map(function (e) {
            return "<tr><td>" + new Date(e.at).toLocaleString(T("de-DE", "en-GB")) + "</td>" +
              "<td>" + esc(e.actor) + "</td><td>" + e.deleted + "</td><td>" + e.restricted + "</td>" +
              "<td><code>" + esc(e.subject) + "</code></td></tr>";
          }).join("") + "</tbody></table></div>";
      }).catch(function () {});
  }

  window.NPJOEAdminDsgvo = {
    init: function () {
      var root = document.getElementById("dsgvoPanel");
      if (!root) return;
      document.getElementById("dsSearch").addEventListener("click", search);
      document.getElementById("dsQuery").addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); search(); }
      });
      document.getElementById("dsExport").addEventListener("click", exportFile);
      document.getElementById("dsErase").addEventListener("click", erase);
      loadLog();
    },
    search: search
  };
})();
