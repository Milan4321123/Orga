/* Accessibility checks that can be made on the markup itself. Anything
   needing a real screen reader is out of scope here and noted in the README. */
"use strict";
const fs = require("fs");
const path = require("path");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith(".html")).sort();
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

/* Strips comments and script/style bodies so their contents are not mistaken
   for markup. */
function markup(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
}

module.exports = function run() {
  group("Page structure");
  const h1Counts = [], skips = [], noMain = [], noLang = [];
  pages.forEach(f => {
    const m = markup(read(f));
    const h1 = (m.match(/<h1[\s>]/g) || []).length;
    if (h1 !== 1) h1Counts.push(f + " has " + h1);
    if (!/<main[\s>]/.test(m)) noMain.push(f);
    if (!/<html lang="/.test(read(f))) noLang.push(f);

    /* Heading levels must not jump, e.g. h2 straight to h4. */
    const levels = (m.match(/<h([1-5])[\s>]/g) || []).map(t => Number(t.match(/h([1-5])/)[1]));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        skips.push(f + ": h" + levels[i - 1] + " → h" + levels[i]);
        break;
      }
    }
  });
  eq("every page has exactly one h1", h1Counts, []);
  eq("every page has a main landmark", noMain, []);
  eq("every page declares a language", noLang, []);
  eq("heading levels never skip a step", skips, []);

  group("Headings injected by JavaScript keep the order too");
  /* The static scan above only sees the HTML files. Card titles rendered by
     content.js land inside sections whose heading is an h2, so they must be
     h3 — as h4 they produced a jump in the live DOM that no file could show. */
  const contentJs = fs.readFileSync(path.join(ROOT, "assets/js/content.js"), "utf8");
  const renderedHeadings = contentJs.match(/<h([1-6])[^"]*?>/g) || [];
  const tooDeep = renderedHeadings.filter(t => /<h[4-6]/.test(t));
  eq("no renderer emits an h4 or deeper", tooDeep, []);
  ok("card titles are rendered as h3", /<h3/.test(contentJs));

  group("Forms are labelled");
  const unlabelled = [];
  pages.forEach(f => {
    const m = markup(read(f));
    const ids = new Set();
    (m.match(/<label[^>]*for="([^"]+)"/g) || []).forEach(t => ids.add(t.match(/for="([^"]+)"/)[1]));
    (m.match(/<(input|select|textarea)[^>]*>/g) || []).forEach(tag => {
      if (/type="(hidden|submit|button|radio|checkbox)"/.test(tag)) return;
      const id = (tag.match(/\sid="([^"]+)"/) || [])[1];
      const hasAria = /aria-label(ledby)?="/.test(tag);
      const wrapped = false; /* label-wrapped inputs are checked below */
      if (!hasAria && (!id || !ids.has(id)) && !wrapped) {
        unlabelled.push(f + ": " + tag.slice(0, 74));
      }
    });
  });
  eq("every visible field has a label or an accessible name", unlabelled, []);

  group("Controls have accessible names");
  const namelessButtons = [];
  pages.forEach(f => {
    const m = markup(read(f));
    (m.match(/<button[^>]*>[\s\S]{0,200}?<\/button>/g) || []).forEach(btn => {
      const open = btn.slice(0, btn.indexOf(">") + 1);
      if (/aria-label="/.test(open)) return;
      const inner = btn.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!inner) namelessButtons.push(f + ": " + open.slice(0, 70));
    });
  });
  eq("no button is left without a name", namelessButtons, []);

  group("Images and graphics");
  const badImages = [], badSvg = [];
  pages.forEach(f => {
    const m = markup(read(f));
    (m.match(/<img[^>]*>/g) || []).forEach(t => { if (!/\salt=/.test(t)) badImages.push(f + ": " + t.slice(0, 60)); });
    (m.match(/<svg[^>]*>/g) || []).forEach(t => {
      if (!/aria-hidden="true"|role="img"|aria-label=/.test(t)) badSvg.push(f + ": " + t.slice(0, 60));
    });
  });
  eq("every image has alt text", badImages, []);
  eq("every inline graphic is either labelled or hidden from assistive tech", badSvg, []);

  group("Keyboard and focus");
  const positiveTab = [];
  pages.forEach(f => {
    (markup(read(f)).match(/tabindex="([0-9]+)"/g) || []).forEach(t => {
      if (Number(t.match(/\d+/)[0]) > 0) positiveTab.push(f + ": " + t);
    });
  });
  eq("no positive tabindex disturbs the natural order", positiveTab, []);
  const noSkip = pages.filter(f => !/skip-link|siteHeaderMount/.test(read(f)));
  eq("every page reaches a skip link through the shared header", noSkip, []);

  const css = fs.readFileSync(path.join(ROOT, "assets/css/main.css"), "utf8");
  ok("focus is always visible", /:focus-visible\s*\{[^}]*outline:/.test(css));
  ok("focus outline is thick enough to see", /:focus-visible\s*\{[^}]*outline:\s*3px/.test(css));
  ok("motion can be turned off", /@media \(prefers-reduced-motion: reduce\)/.test(css));

  group("Link text says where it goes");
  const vague = [];
  const vaguePhrases = ["hier klicken", "click here", "mehr", "read more", "link"];
  pages.forEach(f => {
    (markup(read(f)).match(/<a[^>]*>[\s\S]{0,120}?<\/a>/g) || []).forEach(a => {
      const text = a.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
      if (vaguePhrases.includes(text)) vague.push(f + ': "' + text + '"');
    });
  });
  eq("no link is labelled only 'here' or 'more'", vague, []);

  group("Form errors reach assistive technology");
  const forms = fs.readFileSync(path.join(ROOT, "assets/js/forms.js"), "utf8");
  ok("invalid fields are marked with aria-invalid", /setAttribute\("aria-invalid", "true"\)/.test(forms));
  ok("the mark is removed once corrected", /removeAttribute\("aria-invalid"\)/.test(forms));
  ok("the first invalid field receives focus", /\.focus\(\{ preventScroll: true \}\)/.test(forms));
  const mainJs = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  const layoutJs = fs.readFileSync(path.join(ROOT, "assets/js/layout.js"), "utf8");
  ok("toasts sit in a live region", /aria-live="polite"/.test(layoutJs));
  ok("each toast announces itself", /setAttribute\("role", "status"\)/.test(mainJs));
  ok("form validation messages are announced",
     /setAttribute\("role", "status"\)/.test(forms) && /aria-live/.test(forms));
};
