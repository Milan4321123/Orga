/* Static checks over the source files — no server needed. */
"use strict";
const fs = require("fs");
const path = require("path");
const { group, ok, eq } = require("./lib");

const ROOT = path.resolve(__dirname, "..");
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html")).sort();
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

module.exports = function run() {
  /* ---------------------------------------------------- page boilerplate */
  group("Every page carries the required boilerplate");
  const required = ["site.js", "layout.js", "main.js", "forms.js", "content.js"];
  let missingScripts = [], missingMeta = [], missingMount = [], missingLang = [];
  pages.forEach(f => {
    const s = read(f);
    required.forEach(js => { if (!s.includes("assets/js/" + js)) missingScripts.push(f + ":" + js); });
    if (!/<meta name="description"/.test(s)) missingMeta.push(f);
    if (!s.includes('id="siteHeaderMount"') || !s.includes('id="siteFooterMount"')) missingMount.push(f);
    if (!/<html lang="de" data-lang="de"/.test(s)) missingLang.push(f);
  });
  eq("all " + pages.length + " pages load the five scripts", missingScripts, []);
  eq("all pages have a meta description", missingMeta, []);
  eq("all pages mount header and footer", missingMount, []);
  eq("all pages declare the language", missingLang, []);

  /* ------------------------------------------------------- bilingual text */
  group("German and English are kept in balance");
  const unbalanced = [];
  pages.forEach(f => {
    const s = read(f);
    const de = (s.match(/data-lang="de"/g) || []).length;
    const en = (s.match(/data-lang="en"/g) || []).length;
    /* the <html> element itself carries data-lang="de", hence the extra one */
    if (de - en !== 1) unbalanced.push(f + " (de=" + de + " en=" + en + ")");
  });
  eq("each page has a matching English span for every German one", unbalanced, []);

  /* ----------------------------------------------------------- unique ids */
  group("Markup integrity");
  const dupIds = [];
  pages.forEach(f => {
    const ids = (read(f).match(/\sid="([^"]+)"/g) || []).map(m => m.slice(5, -1));
    const seen = new Set(), dup = new Set();
    ids.forEach(i => (seen.has(i) ? dup.add(i) : seen.add(i)));
    if (dup.size) dupIds.push(f + ": " + [...dup].join(", "));
  });
  eq("no duplicate element ids", dupIds, []);

  const optionMarkup = [];
  pages.forEach(f => {
    if (/<option[^>]*>[^<]*<span/.test(read(f))) optionMarkup.push(f);
  });
  eq("no <option> contains markup (it would not render)", optionMarkup, []);

  const svgTitleSpans = [];
  pages.forEach(f => { if (/<title[^>]*>\s*<span/.test(read(f))) svgTitleSpans.push(f); });
  eq("no <title> holds elements", svgTitleSpans, []);

  /* --------------------------------------------------------- internal links */
  group("Internal links point at files that exist");
  const broken = [];
  pages.forEach(f => {
    const hrefs = (read(f).match(/href="([^"]+)"/g) || []).map(m => m.slice(6, -1));
    hrefs.forEach(h => {
      if (/^(https?:|mailto:|tel:|#|data:)/.test(h)) return;
      const file = h.split(/[?#]/)[0];
      if (!file) return;
      if (!fs.existsSync(path.join(ROOT, file))) broken.push(f + " → " + h);
    });
  });
  eq("no link points at a missing file", broken, []);

  /* ---------------------------------------------------- Dashain event media */
  group("Dashain 2024 media set is complete");
  const dashainDir = path.join(ROOT, "assets/media/dashain-2024");
  const expectedDashain = [
    "community-meal-video-poster.jpg", "community-meal-video.mp4", "community-meal.jpg",
    "dashain-banner.jpg", "evening-welcome-desk.jpg", "event-team.jpg", "festival-food.jpg",
    "friends-at-meal.jpg", "guest-registration.jpg", "guest-speech.jpg", "honour-presentation.jpg",
    "guest-contribution.jpg", "sel-roti-moment.jpg", "stage-programme.jpg", "trophy-and-medals.jpg",
    "trophy-presentation.jpg", "welcome-address.jpg", "welcome-team.jpg"
  ];
  const dashainFiles = fs.existsSync(dashainDir) ? fs.readdirSync(dashainDir).sort() : [];
  eq("all 16 photographs, the video and its poster are present", dashainFiles, expectedDashain.sort());
  const contentJs = fs.readFileSync(path.join(ROOT, "assets/js/content.js"), "utf8");
  const unreferencedPhotos = expectedDashain
    .filter(f => f.endsWith(".jpg") && f !== "community-meal-video-poster.jpg")
    .filter(f => !contentJs.includes("assets/media/dashain-2024/" + f));
  eq("all 16 photographs are represented in the gallery data", unreferencedPhotos, []);
  const galleryPage = read("galerie.html");
  const dashainPage = read("dashain-2024.html");
  const nayaPage = read("naya-barsha-2026.html");
  const naya25Page = read("naya-barsha-2025.html");
  /* The album lives on its own page now; the gallery is the index in front of
     both. The video is rendered from DASHAIN_CLIPS, so the reference to it is
     in the content module rather than in the page. */
  ok("the Dashain album page renders its clip from the shared content module",
     /renderClipEssay\("#dashainClips", C\.DASHAIN_CLIPS\)/.test(dashainPage));
  ok("the clip data names the video and its poster base",
     /assets\/media\/dashain-2024\/community-meal-video/.test(
       fs.readFileSync(path.join(ROOT, "assets/js/content.js"), "utf8")));
  ok("the server sends MP4 files with the correct MIME type",
     /"\.mp4":\s*"video\/mp4"/.test(fs.readFileSync(path.join(ROOT, "server/server.js"), "utf8")));

  /* ----------------------------------------- Naya Barsha 2026 event media */
  group("Naya Barsha 2026 album is complete and wired up");
  const nayaDir = path.join(ROOT, "assets/media/naya-barsha-2026");
  const nayaFiles = fs.existsSync(nayaDir) ? fs.readdirSync(nayaDir).sort() : [];
  const nayaPhotos = nayaFiles.filter(f => f.endsWith(".jpg") && !f.endsWith("-poster.jpg"));
  eq("all 9 photographs are on disk", nayaPhotos.length, 9);
  eq("the 2026 album holds no video — the clips are from 11 April 2025",
     nayaFiles.filter(f => f.endsWith(".mp4")), []);

  /* ----------------------------------------- Naya Barsha 2025 event media */
  const naya25Dir = path.join(ROOT, "assets/media/naya-barsha-2025");
  const naya25Files = fs.existsSync(naya25Dir) ? fs.readdirSync(naya25Dir).sort() : [];
  const naya25Photos = naya25Files.filter(f => f.endsWith(".jpg") && !f.endsWith("-poster.jpg"));
  const nayaClips = naya25Files.filter(f => f.endsWith(".mp4"));
  eq("the single 2025 photograph is on disk", naya25Photos, ["president-with-members.jpg"]);
  eq("all 11 videos are on disk", nayaClips.length, 11);

  /* A video without its poster shows a black rectangle until it is played —
     with preload="none" the poster is the only thing the visitor ever sees. */
  const missingPosters = nayaClips
    .map(f => f.replace(/\.mp4$/, "-poster.jpg"))
    .filter(p => !naya25Files.includes(p));
  eq("every video has its poster frame", missingPosters, []);

  const unreferencedNaya = nayaPhotos.filter(f => !contentJs.includes("assets/media/naya-barsha-2026/" + f));
  eq("every photograph is referenced in the album data", unreferencedNaya, []);
  const unreferencedClips = nayaClips
    .map(f => f.replace(/\.mp4$/, ""))
    .filter(b => !contentJs.includes("assets/media/naya-barsha-2025/" + b));
  eq("every video is referenced in the album data", unreferencedClips, []);
  const unreferenced25 = naya25Photos.filter(f => !contentJs.includes("assets/media/naya-barsha-2025/" + f));
  eq("the 2025 photograph is referenced in the album data", unreferenced25, []);

  /* The whole point of the story block: the ceremony is explained, not just shown. */
  ok("the album page explains what Naya Barsha is", /Bikram[- ]Sambat/.test(nayaPage));
  ok("it names the date, the venue and the turnout",
     /10\. April 2026/.test(nayaPage) && /Knabenschule/.test(nayaPage) && /150/.test(nayaPage));
  ok("the Dashain page explains what Dashain is",
     /Vijaya Dashami/.test(dashainPage) && /Durga/.test(dashainPage) && /[Jj]amara/.test(dashainPage));
  ok("all three albums are reachable from the gallery index",
     /href="naya-barsha-2026\.html"/.test(galleryPage) &&
     /href="naya-barsha-2025\.html"/.test(galleryPage) &&
     /href="dashain-2024\.html"/.test(galleryPage));
  ok("each album is rendered from the shared content module",
     /renderEssay\("#nayaPhotos", C\.NAYA_BARSHA\)/.test(nayaPage) &&
     /renderClipEssay\("#naya25Clips", C\.NAYA_BARSHA_2025_CLIPS\)/.test(naya25Page) &&
     /renderEssay\("#naya25Photos", C\.NAYA_BARSHA_2025\)/.test(naya25Page) &&
     /renderEssay\("#dashainPhotos", C\.GALLERY\)/.test(dashainPage));
  /* The 2025 evening is a separate event with a separate date — the resolution
     of the general meeting names 11 April 2025 and the Knabenschule Halle. */
  ok("the 2025 album states its own date and venue",
     /11\. April 2025/.test(naya25Page) && /Knabenschule Halle/.test(naya25Page));
  /* The pager still links forward to the 2025 album, so "11 Videos" legitimately
     appears there. What must be gone is the album's own video section. */
  ok("the 2026 album no longer claims the 2025 videos",
     !/nayaClips/.test(nayaPage) && !/id="videos"/.test(nayaPage) &&
     !/9 Fotos · 11 Videos/.test(nayaPage));

  /* ------------------------------- Medical camp at the NRNA Cup, Stuttgart */
  group("The NRNA Cup medical camp is documented and playable");
  const campDir = path.join(ROOT, "assets/media/erste-hilfe-nrna-cup");
  const campFiles = fs.existsSync(campDir) ? fs.readdirSync(campDir).sort() : [];
  const campPhotos = ["campaign-shirt.jpg", "pitchside-treatment.jpg",
                      "stand-wide.jpg", "team-and-stand.jpg"];
  eq("the clip and its poster are on disk",
     campFiles.filter(f => /^medical-camp/.test(f)), ["medical-camp-poster.jpg", "medical-camp.mp4"]);
  /* A caption that describes a photograph nobody can see is worse than no
     caption, so the files and the entries are checked against each other in
     both directions. */
  eq("every photograph the page promises is on disk",
     campPhotos.filter(f => !campFiles.includes(f)), []);
  /* The clip and its poster are referenced by base name, without extension —
     that is how renderClipEssay builds the pair — so they are matched that way. */
  eq("and every file in the folder is described somewhere",
     campFiles.filter(f => !contentJs.includes(
       "assets/media/erste-hilfe-nrna-cup/" + f.replace(/\.(mp4|jpg)$/, "").replace(/-poster$/, ""))), []);
  const campPage = read("erste-hilfe-kampagne.html");
  ok("the first-aid page renders the clip from the shared content module",
     /renderClipEssay\("#medicalCampClips", C\.MEDICAL_CAMP_CLIPS\)/.test(campPage));
  ok("and renders the photographs from it too",
     /renderEssay\("#medicalCampPhotos", C\.MEDICAL_CAMP_PHOTOS\)/.test(campPage));
  ok("every medical-camp photograph carries a caption in both languages",
     campPhotos.every(f => {
       const at = contentJs.indexOf("erste-hilfe-nrna-cup/" + f);
       if (at === -1) return false;
       const entry = contentJs.slice(at, at + 1400);
       return /nDe:/.test(entry) && /nEn:/.test(entry) && /de:/.test(entry) && /en:/.test(entry);
     }));
  ok("it names the tournament, the doctors and the host club",
     /NRNA/.test(campPage) && /Sagar Raju Kharel/.test(campPage) &&
     /Saurav/.test(campPage) && /NFC Stuttgart/.test(campPage));

  /* The association's real Facebook and TikTok profiles, not the placeholders. */
  group("Social profiles point at the real accounts");
  const siteSrc = fs.readFileSync(path.join(ROOT, "assets/js/site.js"), "utf8");
  ok("Facebook and TikTok carry the association's own URLs",
     /facebook\.com\/share\/1FpT4ZvjFC/.test(siteSrc) &&
     /tiktok\.com\/@progressive_youth023/.test(siteSrc));
  ok("the footer renders a TikTok icon alongside the others",
     /soc\(s\.tiktok, "TikTok"/.test(fs.readFileSync(path.join(ROOT, "assets/js/layout.js"), "utf8")));

  /* --------------------------------------------- one album, one page, explained */
  group("Each album has its own page, and every frame is explained");
  const contentSrc = fs.readFileSync(path.join(ROOT, "assets/js/content.js"), "utf8");
  function album(name) {
    const from = contentSrc.indexOf("var " + name + " = [");
    return contentSrc.slice(from, contentSrc.indexOf("\n  ];", from));
  }
  [["NAYA_BARSHA", 9], ["NAYA_BARSHA_2025", 1], ["GALLERY", 16],
   ["NAYA_BARSHA_2025_CLIPS", 11], ["DASHAIN_CLIPS", 1], ["MEDICAL_CAMP_CLIPS", 1]].forEach(([name, count]) => {
    const block = album(name);
    eq(name + ": every entry carries a German explanation", (block.match(/nDe:/g) || []).length, count);
    eq(name + ": and an English one", (block.match(/nEn:/g) || []).length, count);
  });
  ok("the plate renderer prints the explanation under the caption",
     /plate-note/.test(contentSrc) && /g\.nDe \|\| g\.de/.test(contentSrc));
  ok("the clip renderer prints one too", /clip-note/.test(contentSrc));

  /* Both album pages must stand on their own: hero, facts, in-page rail. */
  [["naya-barsha-2026.html", nayaPage], ["naya-barsha-2025.html", naya25Page], ["dashain-2024.html", dashainPage]].forEach(([name, src]) => {
    ok(name + " opens with its own full-bleed frame", /class="album-hero"/.test(src));
    ok(name + " states the facts of the evening", /class="album-facts"/.test(src));
    ok(name + " carries an in-page rail", /class="album-rail no-print" data-toc/.test(src));
    ok(name + " links back to the gallery index", /href="galerie\.html"/.test(src));
  });
  const sitemapSrc = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
  const layoutSrc = fs.readFileSync(path.join(ROOT, "assets/js/layout.js"), "utf8");
  ok("the album pages are in the sitemap",
     ["naya-barsha-2026", "naya-barsha-2025", "dashain-2024"]
       .every(n => sitemapSrc.includes("/" + n + ".html</loc>")));
  ok("and reachable from the main navigation",
     ["naya-barsha-2026", "naya-barsha-2025", "dashain-2024"]
       .every(n => layoutSrc.includes(n + ".html")));
  /* The plate flips sides visually; the DOM order must stay picture-then-text
     so a screen reader and a phone both read it the right way round. */
  const plateCss = fs.readFileSync(path.join(ROOT, "assets/css/main.css"), "utf8");
  ok("the alternating plate turns around in CSS, not in the markup",
     /\.plate:nth-child\(even\) > \.plate-frame \{ grid-column: 2; \}/.test(plateCss));
  /* `order` alone handed the picture the narrow track on every second row. */
  ok("and the picture keeps the wide track on whichever side it lands",
     /\.plate:nth-child\(even\) \{ grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1\.55fr\); \}/.test(plateCss));

  /* 67 MB of clips: nothing may download before the visitor asks for it. */
  const clipRenderer = contentJs.slice(contentJs.indexOf("function renderClipEssay"));
  /* Anchored on the emitted markup, not on any mention of the word: an earlier
     version of this check also matched the explanatory comment above it. */
  ok("clips never preload — the page costs a visitor nothing until they press play",
     /<video controls playsinline preload="none"/.test(clipRenderer));
  const eagerVideo = pages
    .map(f => [f, (read(f).match(/<video(?![^>]*preload="none")[^>]*>/g) || [])])
    .filter(([, hits]) => hits.length)
    .map(([f]) => f);
  eq("no video written into a page preloads either", eagerVideo, []);

  /* Nothing is cropped: a plate frame shows the whole photograph and the
     portraits are held to a width that does not swamp their own caption. */
  const albumCss = fs.readFileSync(path.join(ROOT, "assets/css/main.css"), "utf8");
  ok("the renderer marks each frame by its real shape",
     /g\.width >= g\.height \? " is-landscape" : " is-portrait"/.test(contentJs));
  ok("a plate frame shows the whole photograph rather than cropping it",
     /\.plate-frame img \{ display: block; width: 100%; height: auto;/.test(albumCss));
  ok("a portrait frame is capped so it does not swamp its caption",
     /\.plate\.is-portrait > \.plate-frame \{ max-width: 440px/.test(albumCss));
  ok("both plates stack into one column on a phone",
     /@media \(max-width: 860px\) \{\s*\.plate, \.plate:nth-child\(even\)/.test(albumCss));

  /* ------------------------------------------------------- image preview */
  group("The image preview actually shows the image");
  /* Regression: the preview used to set innerHTML to the grid image's
     outerHTML while the dialog was still display:none. Every grid image is
     loading="lazy", and a lazy image inserted into a subtree with no layout
     box is never fetched — so the lightbox opened with a caption and an
     empty frame, for both albums. */
  const mainSrc = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  const lightboxSrc = mainSrc.slice(mainSrc.indexOf("function initLightbox"),
                                    mainSrc.indexOf("function initToc"));
  ok("initLightbox could be located", lightboxSrc.length > 200);
  ok("the preview no longer re-parses the grid image's markup into a hidden dialog",
     !/lbBody"\)\.innerHTML = inner\.outerHTML/.test(lightboxSrc));
  ok("it inserts a cloned node instead", /cloneNode\(true\)/.test(lightboxSrc));
  ok("and makes that copy eager, so the file is actually fetched",
     /removeAttribute\("loading"\)/.test(lightboxSrc));
  /* The dialog is appended last in <body>, so its ✕ is the final tabbable
     element on the page. Without containment, Tab walked out of the dialog
     onto header links sitting invisible behind a 92%-opaque scrim — a
     WCAG 2.2 SC 2.4.11 (Focus Not Obscured) failure. */
  /* Assert the call sites, not just the helper: an earlier version of this
     check passed with the helper defined but never invoked. */
  const openFn = lightboxSrc.slice(lightboxSrc.indexOf("function open(fig)"),
                                   lightboxSrc.indexOf("box.addEventListener"));
  const closeFn = lightboxSrc.slice(lightboxSrc.indexOf("function close()"),
                                    lightboxSrc.indexOf("function open(fig)"));
  ok("the page behind the preview is taken out of the tab order while it is open",
     /setAttribute\("inert", ""\)/.test(lightboxSrc) && /setAttribute\("aria-hidden", "true"\)/.test(lightboxSrc));
  ok("and containment is actually switched on inside open()", /setBehindInert\(true\)/.test(openFn));
  ok("and switched off again inside close()", /setBehindInert\(false\)/.test(closeFn));
  ok("and put back when it closes",
     /removeAttribute\("inert"\)/.test(lightboxSrc) && /removeAttribute\("aria-hidden"\)/.test(lightboxSrc));
  ok("the page is released before focus returns — focus() is ignored on an inert node",
     lightboxSrc.indexOf("setBehindInert(false)") > -1 &&
     lightboxSrc.indexOf("setBehindInert(false)") < lightboxSrc.indexOf("lastTrigger.focus()"));
  ok("all three page regions are covered, not just <main>",
     /"#siteHeaderMount", "#main", "#siteFooterMount"/.test(lightboxSrc));
  /* The consent banner is z-index 320; at 300 the preview opened underneath it. */
  const zLightbox = Number((albumCss.match(/\.lightbox \{[\s\S]*?z-index: (\d+)/) || [])[1]);
  const zConsent = Number((albumCss.match(/\.consent \{[\s\S]*?z-index: (\d+)/) || [])[1]);
  ok("the preview stacks above the consent banner", zLightbox > zConsent,
     "lightbox " + zLightbox + " vs consent " + zConsent);

  /* The gallery index and both album heroes set white type straight over a
     photograph. The scrim has to be dark where the text actually begins, not
     only at the very bottom edge — over a brightly lit frame the earlier ramp
     left glyphs at about 2.7:1. */
  const scrimRules = albumCss.match(/(\.album-hero|\.album-feature)::after \{[\s\S]*?\}/g) || [];
  eq("both scrims exist", scrimRules.length, 2);
  const weakScrim = scrimRules.filter(r => !/rgba\(6, 7, 11, 0\.[5-9][0-9]?\) 4[0-9]%/.test(r));
  eq("each darkens where the first line of text sits", weakScrim.length, 0);




  /* ------------------------------------------------- anchors resolve on page */
  const badAnchors = [];
  pages.forEach(f => {
    const s = read(f);
    const ids = new Set((s.match(/\sid="([^"]+)"/g) || []).map(m => m.slice(5, -1)));
    (s.match(/href="#([^"]+)"/g) || []).map(m => m.slice(7, -1)).forEach(a => {
      if (a && !ids.has(a)) badAnchors.push(f + " → #" + a);
    });
  });
  eq("in-page anchors have a matching target", badAnchors, []);

  /* -------------------------------------------------------- css integrity */
  group("Stylesheet integrity");
  const css = fs.readFileSync(path.join(ROOT, "assets/css/main.css"), "utf8");
  eq("braces balance", (css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
  ok("no leftover scroll-timeline animation (it stranded content invisible)",
     !/animation-timeline:\s*view\(\)/.test(css.replace(/\/\*[\s\S]*?\*\//g, "")));

  /* Any rule that hides content must be reachable again: either gated behind
     .js (so a browser without JS shows it) or tied to an interaction state. */
  const hideRules = css.split("\n")
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    .filter(l => /opacity:\s*0;/.test(l.line) && !l.line.startsWith("/*") && !/@keyframes|from|to/.test(l.line));
  const ungated = hideRules.filter(l =>
    !/^\.js /.test(l.line) && !/visibility: hidden/.test(l.line) && !/input/.test(l.line));
  eq("every opacity:0 rule is gated behind .js or an interaction state",
     ungated.map(l => "line " + l.n + ": " + l.line.slice(0, 60)), []);

  /* ------------------------------------------------------- mobile navigation */
  group("The menu works on a phone");
  const mobileStart = css.indexOf("@media (max-width: 1080px) {");
  let depth = 0, mobileEnd = mobileStart;
  for (let i = css.indexOf("{", mobileStart); i < css.length && mobileStart >= 0; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") { depth--; if (depth === 0) { mobileEnd = i; break; } }
  }
  const mobileBlock = mobileStart >= 0 ? css.slice(mobileStart, mobileEnd + 1) : "";
  ok("a mobile breakpoint exists", mobileBlock.length > 200);

  /* Each of these was a real defect that made the menu unusable. */
  ok("the sticky header is not trapped by its wrapper — display:contents on the mount",
     /#siteHeaderMount \{ display: contents; \}/.test(css));
  ok("the body clips rather than hides overflow, so sticky still engages",
     /overflow-x: clip/.test(css) && !/^\s*overflow-x: hidden;/m.test(css.slice(0, css.indexOf("@supports not (overflow: clip)"))));
  ok("the header drops its backdrop-filter on phones, so the drawer is sized against the screen",
     /backdrop-filter: none/.test(mobileBlock));
  ok("every section is expanded on a phone", /\.dropdown \{[^}]*display: block;/.test(mobileBlock));
  ok("section headings become labels rather than links", /\.has-dropdown > \.nav-link \{[^}]*pointer-events: none/.test(mobileBlock));
  ok("the drawer keeps its scrolling to itself", /overscroll-behavior: contain/.test(css));

  const mainJsNav = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  ok("the drawer is anchored to the header's measured bottom edge",
     /--drawer-top/.test(css) && /setProperty\("--drawer-top"/.test(mainJsNav));
  ok("no body scroll lock, which would displace the sticky header",
     !/document\.body\.style\.overflow = open/.test(mainJsNav));
  ok("choosing a page closes the drawer", /if \(window\.matchMedia\("\(max-width: 1080px\)"\)\.matches\) setOpen\(false\)/.test(mainJsNav));

  /* Desktop must keep its hover dropdowns. */
  const outsideMobile = css.slice(0, mobileStart) + css.slice(mobileEnd + 1);
  ok("dropdowns still open on hover on wide screens", /\.has-dropdown:hover \.dropdown/.test(outsideMobile));
  ok("and stay hidden until then", /\.dropdown \{[^}]*visibility: hidden/.test(outsideMobile));

  /* ------------------------------------------------------------- theming */
  group("One theme only — the dark navy one");
  const notDark = pages.filter(f => !/<html lang="de" data-lang="de" data-theme="dark">/.test(read(f)));
  eq("every page is dark before any script runs", notDark, []);
  const wrongChrome = pages.filter(f => !/<meta name="theme-color" content="#060a14">/.test(read(f)));
  eq("browser chrome matches the canvas", wrongChrome, []);
  const osKeyed = pages.filter(f => /prefers-color-scheme: dark\)"\)\.matches/.test(read(f)));
  eq("no page falls back to the operating system setting", osKeyed, []);
  const stillStores = pages.filter(f => /npjoe\.theme/.test(read(f)));
  eq("no page reads or writes a stored theme any more", stillStores, []);

  const mainJs = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  ok("the script carries no theme switching", !/THEME|applyTheme/.test(mainJs));
  const layoutJs = fs.readFileSync(path.join(ROOT, "assets/js/layout.js"), "utf8");
  ok("the header has no theme toggle", !/themeToggle/.test(layoutJs));
  ok("the tokens are defined once, on :root", !/data-theme=/.test(css));

  /* Printed paper is white regardless of what the board sees on screen. */
  ok("printed documents stay on white paper",
     /\.doc-sheet \{[\s\S]{0,140}background: #ffffff/.test(css));
  ok("printed documents keep dark text", /\.doc-sheet \{[\s\S]{0,180}color: #101828/.test(css));

  /* ------------------------------------------------------ printed documents */
  group("Documents are laid out for real A4 paper");
  const printBlock = (css.match(/@media print \{[\s\S]*$/) || [""])[0];
  ok("a print stylesheet exists", printBlock.length > 100);
  ok("the page is set to A4 with no browser margin", /@page \{ size: A4; margin: 0; \}/.test(printBlock));
  ok("the sheet prints at full 210mm width", /\.doc-sheet \{[^}]*width: 210mm/.test(printBlock));
  ok("the sheet keeps its 297mm height", /\.doc-sheet \{[^}]*min-height: 297mm/.test(printBlock));
  ok("only the document is printed, not the whole admin page",
     /body > \*:not\(\.doc-print-root\) \{ display: none/.test(printBlock));
  ok("the sheet carries its own print padding", /\.doc-sheet \{[^}]*padding: 22mm 20mm/.test(printBlock));
  ok("the document sheet is white regardless of the site theme",
     /\.doc-sheet \{[\s\S]{0,120}background: #ffffff/.test(css));

  /* --------------------------------------------------------- class clashes */
  group("No class serves two different purposes");
  /* .tile was once both a page section and a donation button; that broke the
     donation form. Guard the two systems against colliding again. */
  const jsFiles = fs.readdirSync(path.join(ROOT, "assets/js"))
    .filter(f => f.endsWith(".js"))
    .map(f => ({ name: "assets/js/" + f, text: fs.readFileSync(path.join(ROOT, "assets/js", f), "utf8") }));
  const sources = pages.map(f => ({ name: f, text: read(f) })).concat(jsFiles);

  const optUsers = sources.filter(s => /class=\\?"opt\\?"|class="optgrid/.test(s.text));
  const tileSections = pages.filter(f => /<section class="tile/.test(read(f)));
  ok("form options use .opt", optUsers.length >= 3, "found in " + optUsers.length + " files");
  ok("page sections use .tile", tileSections.length >= 3, "found in " + tileSections.length + " pages");

  /* Markup is generated in JavaScript as well as written in HTML, so both
     have to be searched — an earlier version of this check missed the
     renderer in content.js and let the collision through. */
  const clash = sources.filter(s => /<label class=\\?"tile\\?"/.test(s.text)).map(s => s.name);
  eq("no form option is labelled .tile (it would inherit section padding)", clash, []);

  /* ------------------------------------------------------------ javascript */
  group("Scripts parse");
  fs.readdirSync(path.join(ROOT, "assets/js")).filter(f => f.endsWith(".js")).forEach(f => {
    let good = true, err = "";
    try { new Function(fs.readFileSync(path.join(ROOT, "assets/js", f), "utf8")); }
    catch (e) { good = false; err = e.message; }
    ok("assets/js/" + f, good, err);
  });
};
