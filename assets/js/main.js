/* ==========================================================================
   NPJOE — Global behaviour
   Language switch · theme · navigation · reveal · counters · tabs · lightbox
   ========================================================================== */
(function () {
  "use strict";

  var LS = {
    get: function (k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------------------------------------------------------- Language */
  var LANG_KEY = "npjoe.lang";

  function detectLang() {
    var q = new URLSearchParams(location.search).get("lang");
    if (q === "de" || q === "en") return q;
    var saved = LS.get(LANG_KEY, "");
    if (saved === "de" || saved === "en") return saved;
    return (navigator.language || "de").toLowerCase().indexOf("de") === 0 ? "de" : "en";
  }

  function applyLang(lang) {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === lang));
    });
    /* Swap bilingual attribute pairs, e.g. data-de-placeholder / data-en-placeholder */
    ["placeholder", "title", "aria-label", "alt"].forEach(function (attr) {
      document.querySelectorAll("[data-" + lang + "-" + attr + "]").forEach(function (el) {
        el.setAttribute(attr, el.getAttribute("data-" + lang + "-" + attr));
      });
    });
    /* <option> cannot hold markup, so its label is swapped by text */
    document.querySelectorAll("option[data-de][data-en]").forEach(function (o) {
      o.textContent = o.getAttribute("data-" + lang);
    });
    LS.set(LANG_KEY, lang);
    document.dispatchEvent(new CustomEvent("npjoe:lang", { detail: { lang: lang } }));
  }

  window.npjoeLang = function () { return document.documentElement.getAttribute("data-lang") || "de"; };
  window.npjoeT = function (de, en) { return window.npjoeLang() === "en" ? en : de; };

  /* ------------------------------------------------------------------ Theme */
  var THEME_KEY = "npjoe.theme";

  /* persist = only when the visitor actually chose. Writing the default on a
     first visit would store a preference nobody expressed and would freeze
     that default for everyone who ever loaded the page. */
  function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);
    if (persist) LS.set(THEME_KEY, theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0d1117" : "#ffffff");
  }

  /* The site is dark by default. A visitor's own choice is remembered and
     always wins; the toggle in the header switches and stores it. */
  var DEFAULT_THEME = "dark";

  function initTheme() {
    var saved = LS.get(THEME_KEY, "");
    applyTheme(saved === "dark" || saved === "light" ? saved : DEFAULT_THEME);
  }

  /* -------------------------------------------------------------- Toast API */
  window.npjoeToast = function (message, kind) {
    var wrap = document.getElementById("toastWrap");
    if (!wrap) { return; }
    var t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.setAttribute("role", "status");
    t.innerHTML = '<span aria-hidden="true">' + (kind === "err" ? "⚠" : kind === "ok" ? "✓" : "ℹ") + "</span><span>" + message + "</span>";
    wrap.appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .3s, translate .3s";
      t.style.opacity = "0";
      t.style.translate = "0 10px";
      setTimeout(function () { t.remove(); }, 320);
    }, 4600);
  };

  /* ------------------------------------------------------------ Interactions */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    var scrim = document.getElementById("navScrim");
    if (!toggle || !links) return;

    function setOpen(open) {
      if (open) {
        /* Measure before anything else changes. The top bar scrolls away with
           the page, so the header's bottom edge is not a constant — and
           locking body scroll would break its sticky position and move it. */
        var header = document.getElementById("siteHeader");
        var bottom = header ? Math.max(0, Math.round(header.getBoundingClientRect().bottom)) : 76;
        document.documentElement.style.setProperty("--drawer-top", bottom + "px");
      }
      links.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (scrim) { scrim.classList.toggle("is-open", open); scrim.hidden = !open; }
      /* The drawer contains its own scrolling (overscroll-behavior in the
         stylesheet), so the page behind needs no overflow lock — one would
         knock the sticky header out of place and hide the close button. */
    }
    toggle.addEventListener("click", function () { setOpen(!links.classList.contains("is-open")); });
    if (scrim) scrim.addEventListener("click", function () { setOpen(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });

    /* On a phone every section is already expanded, so the heading is a label
       rather than a control. On a wider screen it stays a normal link with a
       hover dropdown. */
    function syncDropdownRoles() {
      var isPhone = window.matchMedia("(max-width: 1080px)").matches;
      links.querySelectorAll(".has-dropdown > .nav-link").forEach(function (a) {
        if (isPhone) {
          a.setAttribute("aria-hidden", "true");
          a.setAttribute("tabindex", "-1");
          a.removeAttribute("aria-haspopup");
          a.removeAttribute("aria-expanded");
        } else {
          a.removeAttribute("aria-hidden");
          a.removeAttribute("tabindex");
          a.setAttribute("aria-haspopup", "true");
          a.setAttribute("aria-expanded", "false");
        }
      });
    }
    syncDropdownRoles();
    window.addEventListener("resize", syncDropdownRoles);

    /* Following a link should close the drawer behind you. */
    links.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 1080px)").matches) setOpen(false);
      });
    });

    var header = document.getElementById("siteHeader");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-stuck", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function initReveal() {
    var els = document.querySelectorAll(".reveal, .reveal-scale");
    if (!els.length) return;
    var showAll = function () { els.forEach(function (el) { el.classList.add("is-in"); }); };
    if (!("IntersectionObserver" in window)) return showAll();
    /* Failsafe: never leave content invisible if the observer does not fire
       (background tabs, print, unusual rendering conditions). */
    setTimeout(showAll, 3000);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          setTimeout(function () { el.classList.add("is-in"); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  function initCounters() {
    /* A figure maintained in the board area overrides the number in the
       markup, so editing it there updates every page that shows it. */
    var figures = (window.NPJOE && window.NPJOE.impact) || {};
    document.querySelectorAll("[data-figure]").forEach(function (el) {
      var key = el.getAttribute("data-figure");
      var v = figures[key];
      if (v !== undefined && v !== null && v !== "") el.setAttribute("data-count", String(v));
    });

    var els = document.querySelectorAll("[data-count]");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count")) || 0;
        var prefix = el.getAttribute("data-prefix") || "";
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1250, t0 = null;
        function frame(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = Math.round(target * eased);
          el.textContent = prefix + val.toLocaleString(window.npjoeLang() === "en" ? "en-GB" : "de-DE") + suffix;
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initProgressBars() {
    var els = document.querySelectorAll("[data-progress]");
    if (!els.length) return;
    var run = function (el) {
      var fill = el.querySelector("span");
      if (fill) fill.style.width = Math.max(0, Math.min(100, parseFloat(el.getAttribute("data-progress")) || 0)) + "%";
    };
    if (!("IntersectionObserver" in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initBackToTop() {
    var btn = document.getElementById("backToTop");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("is-visible", window.scrollY > 620);
    }, { passive: true });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  function initConsent() {
    var banner = document.getElementById("consentBanner");
    if (!banner) return;
    if (LS.get("npjoe.consent", "") !== "1") {
      setTimeout(function () { banner.classList.add("is-open"); }, 900);
    }
    var ok = document.getElementById("consentOk");
    if (ok) ok.addEventListener("click", function () {
      LS.set("npjoe.consent", "1");
      banner.classList.remove("is-open");
    });
  }

  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (group) {
      var tabs = group.querySelectorAll(".tab");
      tabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
          var id = tab.getAttribute("data-tab");
          tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t === tab)); });
          /* Panels are usually siblings further up than the tab bar's own
             parent, so scope the search to the surrounding section. */
          var scope = group.closest("section") || document;
          scope.querySelectorAll(".tab-panel").forEach(function (p) {
            p.classList.toggle("is-active", p.getAttribute("data-panel") === id);
          });
        });
      });
    });
  }

  function initFilters() {
    document.querySelectorAll("[data-filter-group]").forEach(function (group) {
      var targetSel = group.getAttribute("data-filter-target");
      var items = document.querySelectorAll(targetSel);
      group.querySelectorAll("[data-filter]").forEach(function (chip) {
        chip.addEventListener("click", function () {
          var val = chip.getAttribute("data-filter");
          group.querySelectorAll("[data-filter]").forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
          var shown = 0;
          items.forEach(function (item) {
            var tags = (item.getAttribute("data-tags") || "").split(/\s+/);
            var match = val === "all" || tags.indexOf(val) !== -1;
            item.style.display = match ? "" : "none";
            if (match) shown++;
          });
          var empty = document.querySelector(group.getAttribute("data-filter-empty") || "");
          if (empty) empty.classList.toggle("hide", shown > 0);
        });
      });
    });
  }

  function initSearchFilter() {
    document.querySelectorAll("[data-search-target]").forEach(function (input) {
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        var items = document.querySelectorAll(input.getAttribute("data-search-target"));
        var shown = 0;
        items.forEach(function (item) {
          var match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
          item.style.display = match ? "" : "none";
          if (match) shown++;
        });
        var empty = document.querySelector(input.getAttribute("data-search-empty") || "");
        if (empty) empty.classList.toggle("hide", shown > 0);
      });
    });
  }

  function initLightbox() {
    if (!document.querySelector(".gallery, [data-lightbox]")) return;
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Bildvorschau / Image preview");
    box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Schließen / Close">✕</button><figure><div id="lbBody"></div><figcaption id="lbCap"></figcaption></figure>';
    document.body.appendChild(box);
    var lastTrigger = null;
    function close() {
      if (!box.classList.contains("is-open")) return;
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    }
    function open(fig) {
      var inner = fig.querySelector("img, svg");
      var cap = fig.querySelector("figcaption");
      if (!inner) return;
      lastTrigger = fig;
      var body = document.getElementById("lbBody");
      body.innerHTML = "";
      /* The grid images are loading="lazy". Cloning one into a dialog that is
         still display:none gives the browser no box to intersect, so it never
         fetched the file and the preview opened blank. Drop the attribute on
         the copy — it is being shown right now, by definition. */
      var copy = inner.cloneNode(true);
      if (copy.tagName === "IMG") copy.removeAttribute("loading");
      body.appendChild(copy);
      document.getElementById("lbCap").innerHTML = cap ? cap.innerHTML : "";
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      box.querySelector(".lightbox-close").focus();
    }
    box.addEventListener("click", function (e) { if (e.target === box || e.target.classList.contains("lightbox-close")) close(); });
    document.addEventListener("click", function (e) {
      var fig = e.target.closest ? e.target.closest("[data-lightbox]") : null;
      if (fig) open(fig);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
      if (e.key !== "Enter" && e.key !== " ") return;
      var fig = e.target.closest ? e.target.closest("[data-lightbox]") : null;
      if (fig) {
        e.preventDefault();
        open(fig);
      }
    });
  }

  function initToc() {
    var toc = document.querySelector("[data-toc]");
    if (!toc) return;
    var links = toc.querySelectorAll("a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) map[el.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          if (map[e.target.id]) map[e.target.id].classList.add("is-active");
        }
      });
    }, { rootMargin: "-90px 0px -70% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* Horizontal card rails: arrow buttons page through, disabled at the ends. */
  function initRails() {
    document.querySelectorAll("[data-rail]").forEach(function (rail) {
      /* The arrows usually live in the rail heading, a sibling of the rail
         itself — so scope the lookup to the surrounding section. */
      var group = rail.closest("section") || document;
      var prev = group.querySelector("[data-rail-prev]");
      var next = group.querySelector("[data-rail-next]");
      if (!prev || !next) return;

      function step() {
        var card = rail.firstElementChild;
        return card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
      }
      function sync() {
        var max = rail.scrollWidth - rail.clientWidth - 2;
        prev.disabled = rail.scrollLeft <= 2;
        next.disabled = rail.scrollLeft >= max;
      }
      prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
      next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
      rail.addEventListener("scroll", sync, { passive: true });
      window.addEventListener("resize", sync);
      sync();
    });
  }

  /* Sticky scroll stage: the pinned illustration advances as each caption
     beside it comes into view. Falls back to showing everything at once. */
  function initStages() {
    document.querySelectorAll("[data-stage]").forEach(function (stage) {
      var steps = stage.querySelectorAll("[data-stage-step]");
      var layers = stage.querySelectorAll("[data-stage-layer]");
      var dots = stage.querySelectorAll(".stage-dot");
      var caption = stage.querySelector("[data-stage-caption]");
      if (!steps.length) return;

      function activate(index) {
        if (stage.dataset.active === String(index)) return;
        stage.dataset.active = String(index);
        steps.forEach(function (s, i) { s.classList.toggle("is-on", i === index); });
        dots.forEach(function (d, i) { d.classList.toggle("is-on", i === index); });
        /* Layers are cumulative: the scene builds up rather than swapping. */
        layers.forEach(function (l) {
          l.classList.toggle("is-on", parseInt(l.getAttribute("data-stage-layer"), 10) <= index);
        });
        if (caption) {
          var text = steps[index].getAttribute("data-caption-" + window.npjoeLang());
          caption.textContent = text || "";
        }
      }

      if (!("IntersectionObserver" in window)) {
        layers.forEach(function (l) { l.classList.add("is-on"); });
        steps.forEach(function (s) { s.classList.add("is-on"); });
        return;
      }

      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) activate(Array.prototype.indexOf.call(steps, e.target));
        });
      }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

      steps.forEach(function (s) { io.observe(s); });
      activate(0);
      document.addEventListener("npjoe:lang", function () {
        var i = parseInt(stage.dataset.active || "0", 10);
        stage.dataset.active = "";
        activate(i);
      });
    });
  }

  /* Sticky product sub-navigation highlights the section in view. */
  function initSubnav() {
    var nav = document.querySelector(".subnav");
    if (!nav || !("IntersectionObserver" in window)) return;
    var links = nav.querySelectorAll("a[href^='#']");
    var map = {};
    links.forEach(function (a) {
      var target = document.getElementById(a.getAttribute("href").slice(1));
      if (target) map[target.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        if (map[e.target.id]) map[e.target.id].classList.add("is-active");
      });
    }, { rootMargin: "-140px 0px -65% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        var done = function () { window.npjoeToast(window.npjoeT("Kopiert.", "Copied."), "ok"); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () {});
        } else {
          var ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); done(); } catch (e) {}
          ta.remove();
        }
      });
    });
  }

  function initPrintButtons() {
    document.querySelectorAll("[data-print]").forEach(function (b) {
      b.addEventListener("click", function () { window.print(); });
    });
  }

  function initShare() {
    document.querySelectorAll("[data-share]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var data = { title: document.title, url: location.href };
        if (navigator.share) { navigator.share(data).catch(function () {}); }
        else if (navigator.clipboard) {
          navigator.clipboard.writeText(location.href);
          window.npjoeToast(window.npjoeT("Link kopiert.", "Link copied."), "ok");
        }
      });
    });
  }

  /* ------------------------------------------------------------------- Boot */
  function boot() {
    applyLang(detectLang());
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.addEventListener("click", function () { applyLang(b.getAttribute("data-set-lang")); });
    });
    var themeBtn = document.getElementById("themeToggle");
    if (themeBtn) themeBtn.addEventListener("click", function () {
      applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    });
    initNav();
    initReveal();
    initCounters();
    initProgressBars();
    initBackToTop();
    initConsent();
    initTabs();
    initFilters();
    initSearchFilter();
    initLightbox();
    initRails();
    initStages();
    initSubnav();
    initToc();
    initCopy();
    initPrintButtons();
    initShare();
  }

  var booted = false;
  function bootOnce() { if (!booted) { booted = true; boot(); } }

  /* Marks that JS is available — scroll-reveal styles hinge on this class,
     so a browser without JS still shows every section. */
  document.documentElement.classList.add("js");

  initTheme();
  if (window.__npjoeLayoutReady) bootOnce();
  else document.addEventListener("npjoe:layout-ready", bootOnce);
  /* Safety net for pages without the shared layout. It must not fire on a
     normal page: layout.js delays npjoe:layout-ready until the board-edited
     content has merged, and booting early would freeze the old figures in. */
  window.addEventListener("load", function () {
    if (!document.getElementById("siteHeaderMount")) bootOnce();
  });
})();
