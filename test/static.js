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
