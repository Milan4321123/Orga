/* ==========================================================================
   NPJOE — Form engine
   Validation · multi-step wizard · draft autosave · signature pad ·
   API submission with offline fallback (download + e-mail) · review step
   ========================================================================== */
(function () {
  "use strict";

  var CFG = (window.NPJOE && window.NPJOE.forms) || { mode: "auto", apiBase: "/api" };
  var ORG = (window.NPJOE && window.NPJOE.org) || {};
  var T = function (de, en) { return (window.npjoeT ? window.npjoeT(de, en) : de); };

  /* ------------------------------------------------------------ Validation */
  var RULES = {
    email: {
      test: function (v) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v); },
      msg: ["Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid e-mail address."]
    },
    tel: {
      test: function (v) { return /^[+0-9()\/.\-\s]{6,25}$/.test(v); },
      msg: ["Bitte eine gültige Telefonnummer angeben.", "Please enter a valid phone number."]
    },
    zip: {
      test: function (v) { return /^[0-9A-Za-z\- ]{3,10}$/.test(v); },
      msg: ["Bitte eine gültige Postleitzahl angeben.", "Please enter a valid postal code."]
    },
    iban: {
      test: function (v) { return !v || /^[A-Z]{2}[0-9]{2}[A-Z0-9 ]{8,32}$/.test(v.toUpperCase().replace(/\s+/g, " ").trim()); },
      msg: ["Bitte eine gültige IBAN angeben.", "Please enter a valid IBAN."]
    },
    minage: {
      test: function (v, el) {
        if (!v) return false;
        var min = parseInt(el.getAttribute("data-minage") || "0", 10);
        var b = new Date(v);
        if (isNaN(b.getTime())) return false;
        var now = new Date();
        var age = now.getFullYear() - b.getFullYear();
        var m = now.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
        return age >= min && age < 120;
      },
      msg: ["Bitte ein gültiges Geburtsdatum angeben (Mindestalter beachten).", "Please enter a valid date of birth (note the minimum age)."]
    }
  };

  function errorNode(field) {
    var wrap = field.closest(".field") || field.closest(".check") || field.parentElement;
    if (!wrap) return null;
    var node = wrap.querySelector(".error-msg");
    if (!node) {
      node = document.createElement("p");
      node.className = "error-msg";
      wrap.appendChild(node);
    }
    return node;
  }

  function setError(field, message) {
    var node = errorNode(field);
    if (message) {
      field.setAttribute("aria-invalid", "true");
      if (node) node.textContent = message;
    } else {
      field.removeAttribute("aria-invalid");
      if (node) node.textContent = "";
    }
  }

  function validateField(field) {
    if (field.disabled || field.type === "hidden" || field.closest(".honeypot")) return true;
    var val = (field.value || "").trim();
    var required = field.hasAttribute("required");

    if (field.type === "checkbox" && required && !field.checked) {
      setError(field, T("Bitte bestätigen, um fortzufahren.", "Please confirm to continue."));
      return false;
    }
    if (field.type === "checkbox") { setError(field, ""); return true; }

    if (required && !val) {
      setError(field, T("Dieses Feld ist erforderlich.", "This field is required."));
      return false;
    }
    if (!val) { setError(field, ""); return true; }

    var rule = field.getAttribute("data-rule");
    if (!rule && field.type === "email") rule = "email";
    if (!rule && field.type === "tel") rule = "tel";
    if (rule && RULES[rule] && !RULES[rule].test(val, field)) {
      setError(field, T(RULES[rule].msg[0], RULES[rule].msg[1]));
      return false;
    }
    var min = parseInt(field.getAttribute("minlength") || "0", 10);
    if (min && val.length < min) {
      setError(field, T("Bitte mindestens " + min + " Zeichen eingeben.", "Please enter at least " + min + " characters."));
      return false;
    }
    setError(field, "");
    return true;
  }

  /* includeHidden = true also checks fields sitting on inactive wizard steps,
     which matters when the final submit validates the whole form. */
  function validateScope(scope, includeHidden) {
    var ok = true, first = null;
    scope.querySelectorAll("input, select, textarea").forEach(function (f) {
      if (!includeHidden && f.offsetParent === null && f.type !== "hidden" && !f.closest(".sig-wrap")) return;
      if (!validateField(f)) { ok = false; if (!first) first = f; }
    });
    /* checkbox groups: data-require-group="min" on the wrapper */
    scope.querySelectorAll("[data-require-group]").forEach(function (group) {
      var min = parseInt(group.getAttribute("data-require-group"), 10) || 1;
      var checked = group.querySelectorAll("input[type=checkbox]:checked").length;
      var node = group.querySelector(".error-msg") || (function () {
        var p = document.createElement("p"); p.className = "error-msg"; group.appendChild(p); return p;
      })();
      if (checked < min) {
        ok = false;
        node.textContent = T("Bitte mindestens " + min + " Option auswählen.", "Please select at least " + min + " option.");
        if (!first) first = group;
      } else { node.textContent = ""; }
    });
    if (first) {
      validateScope.lastInvalid = first;
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      if (first.focus) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 260);
    }
    return ok;
  }

  /* --------------------------------------------------------------- Payload */
  function collect(form) {
    var data = {};
    var fd = new FormData(form);
    fd.forEach(function (value, key) {
      if (key === "_hp") return;
      if (data[key] !== undefined) {
        if (!Array.isArray(data[key])) data[key] = [data[key]];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    });
    /* unchecked checkboxes -> explicit false for consent tracking */
    form.querySelectorAll('input[type="checkbox"][data-track]').forEach(function (cb) {
      if (!cb.checked && data[cb.name] === undefined) data[cb.name] = false;
      else if (cb.checked) data[cb.name] = true;
    });
    return data;
  }

  function labelFor(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return name;
    var wrap = el.closest(".field");
    var lab = wrap && wrap.querySelector("label");
    if (lab) {
      var vis = lab.querySelector('[data-lang="' + (window.npjoeLang ? window.npjoeLang() : "de") + '"]');
      return (vis ? vis.textContent : lab.textContent).replace(/\*/g, "").trim();
    }
    return name;
  }

  function summarise(form, data) {
    var lines = [];
    Object.keys(data).forEach(function (k) {
      if (k.charAt(0) === "_") return;
      var v = data[k];
      if (Array.isArray(v)) v = v.join(", ");
      if (v === true) v = T("Ja", "Yes");
      if (v === false) v = T("Nein", "No");
      if (v === "" || v === undefined || v === null) return;
      if (String(v).indexOf("data:image") === 0) v = T("[Unterschrift erfasst]", "[signature captured]");
      lines.push(labelFor(form, k) + ": " + v);
    });
    return lines.join("\n");
  }

  /* --------------------------------------------------------------- Storage */
  function saveLocal(type, payload) {
    try {
      var key = "npjoe.submissions." + type;
      var list = JSON.parse(localStorage.getItem(key) || "[]");
      list.push(payload);
      localStorage.setItem(key, JSON.stringify(list.slice(-200)));
    } catch (e) {}
  }

  function download(filename, text, mime) {
    var blob = new Blob([text], { type: (mime || "application/json") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  window.npjoeDownload = download;

  function mailtoLink(type, form, data) {
    var to = form.getAttribute("data-email") || CFG.fallbackEmail || ORG.email;
    var subject = (form.getAttribute("data-subject") || "NPJOE " + type) + " — " + (data.vorname || data.name || data.email || "");
    var body = summarise(form, data).slice(0, 1600);
    return "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  /* ------------------------------------------------------------ Draft save */
  function draftKey(form) { return "npjoe.draft." + (form.getAttribute("data-form") || "form"); }

  function saveDraft(form) {
    if (form.getAttribute("data-no-draft") !== null) return;
    try {
      var data = {};
      form.querySelectorAll("input, select, textarea").forEach(function (f) {
        if (!f.name || f.name === "_hp" || f.type === "file") return;
        if (f.type === "checkbox" || f.type === "radio") {
          if (f.checked) { data[f.name] = data[f.name] || []; data[f.name].push(f.value); }
        } else if (f.value) { data[f.name] = f.value; }
      });
      localStorage.setItem(draftKey(form), JSON.stringify({ t: Date.now(), d: data }));
    } catch (e) {}
  }

  function restoreDraft(form) {
    if (form.getAttribute("data-no-draft") !== null) return false;
    var raw;
    try { raw = localStorage.getItem(draftKey(form)); } catch (e) { return false; }
    if (!raw) return false;
    var parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return false; }
    if (!parsed || !parsed.d || Date.now() - parsed.t > 1000 * 60 * 60 * 24 * 30) return false;
    var restored = 0;
    Object.keys(parsed.d).forEach(function (name) {
      var val = parsed.d[name];
      var fields = form.querySelectorAll('[name="' + CSS.escape(name) + '"]');
      fields.forEach(function (f) {
        if (f.type === "checkbox" || f.type === "radio") {
          if (Array.isArray(val) && val.indexOf(f.value) !== -1) { f.checked = true; restored++; }
        } else if (!Array.isArray(val)) { f.value = val; restored++; }
      });
    });
    return restored > 0;
  }

  function clearDraft(form) {
    try { localStorage.removeItem(draftKey(form)); } catch (e) {}
  }

  /* ------------------------------------------------------------- Reference */
  function reference(prefix) {
    var d = new Date();
    var y = d.getFullYear();
    var rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return prefix + "-" + y + "-" + rand;
  }

  /* ---------------------------------------------------------- Multi-step UI */
  function initWizard(form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll(".form-step"));
    if (steps.length < 2) return null;
    var stepper = form.querySelector(".stepper");
    var idx = 0;

    function render() {
      steps.forEach(function (s, i) { s.classList.toggle("is-active", i === idx); });
      if (stepper) {
        stepper.querySelectorAll(".stepper-item").forEach(function (it, i) {
          it.classList.toggle("is-active", i === idx);
          it.classList.toggle("is-done", i < idx);
        });
      }
      var top = form.getBoundingClientRect().top + window.scrollY - 110;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
      form.dispatchEvent(new CustomEvent("npjoe:step", { detail: { index: idx, total: steps.length } }));
    }

    function go(next) {
      if (next > idx && !validateScope(steps[idx])) return;
      idx = Math.max(0, Math.min(steps.length - 1, next));
      render();
    }

    form.querySelectorAll("[data-step-next]").forEach(function (b) {
      b.addEventListener("click", function () { go(idx + 1); });
    });
    form.querySelectorAll("[data-step-prev]").forEach(function (b) {
      b.addEventListener("click", function () { go(idx - 1); });
    });
    render();
    return {
      current: function () { return idx; },
      total: steps.length,
      steps: steps,
      go: go
    };
  }

  /* --------------------------------------------------------- Signature pad */
  function initSignature(wrap) {
    var canvas = wrap.querySelector("canvas");
    var input = wrap.parentElement.querySelector('input[type="hidden"][data-signature]');
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var drawing = false, dirty = false;

    function resize() {
      var ratio = window.devicePixelRatio || 1;
      var rect = canvas.getBoundingClientRect();
      var data = dirty ? canvas.toDataURL() : null;
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#101828";
      if (data) { var img = new Image(); img.onload = function () { ctx.drawImage(img, 0, 0, rect.width, rect.height); }; img.src = data; }
    }
    setTimeout(resize, 60);
    window.addEventListener("resize", function () { resize(); });

    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var p = e.touches ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function start(e) { e.preventDefault(); drawing = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
    function move(e) {
      if (!drawing) return;
      e.preventDefault();
      var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (!dirty) { dirty = true; wrap.classList.add("has-ink"); }
    }
    function end() {
      if (!drawing) return;
      drawing = false;
      if (input && dirty) input.value = canvas.toDataURL("image/png");
    }
    ["mousedown", "touchstart"].forEach(function (ev) { canvas.addEventListener(ev, start, { passive: false }); });
    ["mousemove", "touchmove"].forEach(function (ev) { canvas.addEventListener(ev, move, { passive: false }); });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(function (ev) { canvas.addEventListener(ev, end); });

    var clear = wrap.parentElement.querySelector("[data-sig-clear]");
    if (clear) clear.addEventListener("click", function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dirty = false; wrap.classList.remove("has-ink");
      if (input) input.value = "";
    });
  }

  /* ------------------------------------------------------------- Review UI */
  function fillReview(form) {
    var target = form.querySelector("[data-review]");
    if (!target) return;
    var data = collect(form);
    var html = "";
    Object.keys(data).forEach(function (k) {
      if (k.charAt(0) === "_" || k === "signature") return;
      var v = data[k];
      if (Array.isArray(v)) v = v.join(", ");
      if (v === true) v = T("Ja", "Yes");
      if (v === false || v === "" || v === undefined) return;
      html += '<div class="review-row"><dt>' + labelFor(form, k) + "</dt><dd>" + String(v).replace(/[<>]/g, "") + "</dd></div>";
    });
    target.innerHTML = html || '<p class="text-muted">' + T("Noch keine Angaben.", "No entries yet.") + "</p>";
  }

  /* ------------------------------------------------------------- Submitting */
  function postJSON(url, payload) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          var err = new Error("HTTP " + res.status);
          err.status = res.status;
          err.body = body;
          throw err;
        });
      }
      return res.json().catch(function () { return {}; });
    });
  }

  function showSuccess(form, ref, viaApi) {
    var panel = form.parentElement.querySelector("[data-success]");
    var status = form.querySelector(".form-status");
    if (panel) {
      var refSlot = panel.querySelector("[data-ref]");
      if (refSlot) refSlot.textContent = ref;
      var note = panel.querySelector("[data-delivery]");
      if (note) {
        note.innerHTML = viaApi
          ? T("Ihre Angaben sind bei uns eingegangen.", "Your details have reached us.")
          : T("Ihre Angaben wurden als Datei gespeichert und Ihr E-Mail-Programm geöffnet — bitte die E-Mail noch absenden.",
              "Your details were saved as a file and your mail client opened — please still send the e-mail.");
      }
      form.classList.add("hide");
      panel.classList.remove("hide");
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      panel.setAttribute("tabindex", "-1");
      try { panel.focus({ preventScroll: true }); } catch (e) {}
    } else if (status) {
      status.className = "form-status ok is-visible";
      status.textContent = T("Vielen Dank! Ihre Nachricht ist eingegangen. Referenz: ", "Thank you! Your message was received. Reference: ") + ref;
    }
  }

  function handleSubmit(form, wizard) {
    var type = form.getAttribute("data-form") || "contact";
    var prefix = (form.getAttribute("data-ref-prefix") || type.slice(0, 3)).toUpperCase();
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('[type="submit"]');

    /* honeypot */
    var hp = form.querySelector('input[name="_hp"]');
    if (hp && hp.value) { return; }

    function showFieldError() {
      if (status) {
        status.className = "form-status err is-visible";
        status.textContent = T("Bitte prüfen Sie die markierten Felder.", "Please check the highlighted fields.");
      }
    }

    if (!validateScope(wizard ? wizard.steps[wizard.current()] : form)) {
      showFieldError();
      return;
    }
    /* Re-check every step, including the ones currently hidden — a value may have
       been cleared after the user stepped past it. Jump back to the offending step. */
    if (wizard && !validateScope(form, true)) {
      var bad = validateScope.lastInvalid;
      var badStep = bad && bad.closest(".form-step");
      if (badStep) {
        var index = wizard.steps.indexOf(badStep);
        if (index > -1 && index !== wizard.current()) wizard.go(index);
      }
      showFieldError();
      return;
    }

    var payload = collect(form);
    var ref = reference(prefix);
    payload._ref = ref;
    payload._type = type;
    payload._submittedAt = new Date().toISOString();
    payload._lang = window.npjoeLang ? window.npjoeLang() : "de";
    payload._page = location.pathname.split("/").pop();

    saveLocal(type, payload);

    var busyLabel = T("Wird gesendet …", "Sending …");
    var original = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = busyLabel; }
    if (status) { status.className = "form-status info is-visible"; status.textContent = busyLabel; }

    function finishOffline() {
      download("NPJOE-" + type + "-" + ref + ".json", JSON.stringify(payload, null, 2));
      var link = mailtoLink(type, form, payload);
      setTimeout(function () { window.open(link, "_blank"); }, 350);
      clearDraft(form);
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
      if (status) status.classList.remove("is-visible");
      showSuccess(form, ref, false);
    }

    if (CFG.mode === "offline") return finishOffline();

    postJSON((CFG.apiBase || "/api") + "/" + type, payload)
      .then(function (res) {
        clearDraft(form);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
        if (status) status.classList.remove("is-visible");
        showSuccess(form, (res && res.ref) || ref, true);
      })
      .catch(function (err) {
        /* The server answered and refused: never pretend this succeeded.
           Only a genuinely unreachable API (network error, or no API at all)
           may fall back to the offline route. */
        var answered = err && err.status && err.status !== 404;
        if (answered || CFG.mode === "api") {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = original; }
          if (status) {
            status.className = "form-status err is-visible";
            if (err && err.status === 422) {
              var fields = (err.body && err.body.fields) || [];
              fields.forEach(function (name) {
                var f = form.querySelector('[name="' + name + '"]');
                if (f) setError(f, T("Bitte prüfen Sie diese Angabe.", "Please check this entry."));
              });
              status.textContent = T(
                "Einige Angaben konnten nicht angenommen werden: ",
                "Some entries could not be accepted: "
              ) + fields.map(function (n) { return labelFor(form, n); }).join(", ");
            } else if (err && err.status === 429) {
              status.textContent = T(
                "Zu viele Einsendungen in kurzer Zeit. Bitte versuchen Sie es später erneut.",
                "Too many submissions in a short time. Please try again later."
              );
            } else {
              status.textContent = T(
                "Senden fehlgeschlagen. Bitte später erneut versuchen oder schreiben Sie an " + (ORG.email || ""),
                "Sending failed. Please try again later or write to " + (ORG.email || "")
              );
            }
          }
          return;
        }
        finishOffline();
      });
  }

  /* ------------------------------------------------------------ Newsletter */
  function initNewsletter(form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      if (!input || !RULES.email.test(input.value.trim())) {
        window.npjoeToast(T("Bitte eine gültige E-Mail-Adresse eingeben.", "Please enter a valid e-mail address."), "err");
        return;
      }
      var payload = { email: input.value.trim(), _type: "newsletter", _submittedAt: new Date().toISOString() };
      saveLocal("newsletter", payload);
      var done = function () {
        window.npjoeToast(T("Danke! Sie sind für den Newsletter vorgemerkt.", "Thank you! You are signed up for the newsletter."), "ok");
        form.reset();
      };
      if (CFG.mode === "offline") return done();
      postJSON((CFG.apiBase || "/api") + "/newsletter", payload).then(done).catch(done);
    });
  }

  /* ------------------------------------------------------------------ Boot */
  function initForm(form) {
    var type = form.getAttribute("data-form");
    if (form.getAttribute("data-init") === "1") return;
    form.setAttribute("data-init", "1");

    if (type === "newsletter") return initNewsletter(form);

    /* honeypot field */
    if (!form.querySelector('input[name="_hp"]')) {
      var hp = document.createElement("div");
      hp.className = "honeypot";
      hp.setAttribute("aria-hidden", "true");
      hp.innerHTML = '<label>Website<input type="text" name="_hp" tabindex="-1" autocomplete="off"></label>';
      form.appendChild(hp);
    }

    /* Validation feedback has to reach screen readers, not only the eye. */
    form.querySelectorAll(".form-status").forEach(function (el) {
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      el.setAttribute("aria-atomic", "true");
    });

    var wizard = initWizard(form);

    form.querySelectorAll(".sig-wrap").forEach(initSignature);

    /* live validation after first blur */
    form.querySelectorAll("input, select, textarea").forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value || f.hasAttribute("required")) validateField(f); });
      f.addEventListener("input", function () {
        if (f.getAttribute("aria-invalid") === "true") validateField(f);
      });
    });

    /* draft autosave */
    var draftTimer;
    form.addEventListener("input", function () {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(function () { saveDraft(form); }, 700);
    });
    if (restoreDraft(form)) {
      var note = form.querySelector("[data-draft-note]");
      if (note) {
        note.classList.remove("hide");
        var discard = note.querySelector("[data-draft-discard]");
        if (discard) discard.addEventListener("click", function () {
          clearDraft(form); form.reset(); note.classList.add("hide");
          window.npjoeToast(T("Entwurf verworfen.", "Draft discarded."), "ok");
        });
      }
    }

    /* review step */
    form.addEventListener("npjoe:step", function () { fillReview(form); });
    form.querySelectorAll("[data-step-next]").forEach(function (b) {
      b.addEventListener("click", function () { setTimeout(function () { fillReview(form); }, 0); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSubmit(form, wizard);
    });
  }

  function boot() {
    document.querySelectorAll("form[data-form]").forEach(initForm);
  }

  if (window.__npjoeLayoutReady) boot();
  else document.addEventListener("npjoe:layout-ready", boot);
  window.addEventListener("load", boot); /* safety net: initForm is idempotent */
})();
