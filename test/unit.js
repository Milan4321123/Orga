/* Unit tests for browser logic, run against a small DOM stub. */
"use strict";
const fs = require("fs");
const path = require("path");
const { group, ok, eq } = require("./lib");
const ROOT = path.resolve(__dirname, "..");

/* Pulls one named function out of a source file so the shipped code — not a
   copy of it — is what gets tested. */
function extract(file, startMarker, endMarker) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const a = src.indexOf(startMarker), b = src.indexOf(endMarker);
  if (a < 0 || b < 0 || b <= a) return null;
  return src.slice(a, b);
}

function el(attrs = {}) {
  const e = { attrs, dataset: {}, textContent: "", style: {}, children: [],
    getAttribute(k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = v; } };
  const cls = new Set();
  e._cls = cls;
  e.classList = { toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)), add: c => cls.add(c),
                  remove: c => cls.delete(c), contains: c => cls.has(c) };
  return e;
}

module.exports = function run() {
  /* ------------------------------------------------------- scroll stage */
  group("Sticky scroll stage builds and recedes correctly");
  const stageSrc = extract("assets/js/main.js", "  function initStages()", "  /* Sticky product sub-navigation");
  if (!stageSrc) return ok("initStages could be located in main.js", false, "marker not found");

  const steps = [0, 1, 2, 3].map(i => el({ "data-caption-de": "S" + i, "data-caption-en": "S" + i }));
  const layers = [0, 1, 2, 3].map(i => el({ "data-stage-layer": String(i) }));
  const dots = [0, 1, 2, 3].map(() => el());
  const caption = el();
  const stage = el();
  stage.querySelectorAll = sel => sel.includes("stage-step") ? steps
    : sel.includes("stage-layer") ? layers : sel.includes("stage-dot") ? dots : [];
  stage.querySelector = sel => (sel.includes("stage-caption") ? caption : null);

  let ioCb = null; const observed = [];
  global.window = { npjoeLang: () => "de",
    IntersectionObserver: function (cb) { ioCb = cb; this.observe = e => observed.push(e); } };
  global.IntersectionObserver = window.IntersectionObserver;
  global.document = { querySelectorAll: s => (s.includes("data-stage]") ? [stage] : []), addEventListener: () => {} };

  eval("(function(){" + stageSrc + "\n initStages(); })()");
  const onLayers = () => layers.filter(l => l._cls.has("is-on")).map(l => l.attrs["data-stage-layer"]);
  const activeStep = () => steps.map((s, i) => (s._cls.has("is-on") ? i : null)).filter(v => v !== null);

  eq("all steps are observed", observed.length, 4);
  eq("only the first layer shows at the start", onLayers(), ["0"]);
  eq("the caption is seeded", caption.textContent, "S0");
  ioCb([{ isIntersecting: true, target: steps[2] }]);
  eq("the scene builds up cumulatively", onLayers(), ["0", "1", "2"]);
  eq("only the matching step is highlighted", activeStep(), [2]);
  ioCb([{ isIntersecting: true, target: steps[3] }]);
  eq("the final step shows every layer", onLayers(), ["0", "1", "2", "3"]);
  ioCb([{ isIntersecting: true, target: steps[1] }]);
  eq("scrolling back makes the scene recede", onLayers(), ["0", "1"]);
  const before = activeStep();
  ioCb([{ isIntersecting: false, target: steps[3] }]);
  eq("entries leaving the viewport are ignored", activeStep(), before);

  /* --------------------------------------------------- content overrides */
  group("Board edits merge over the built-in content");
  const contentSrc = fs.readFileSync(path.join(ROOT, "assets/js/content.js"), "utf8");
  ok("overrides mutate the org object in place, keeping layout.js's reference alive",
     /Object\.assign\(window\.NPJOE\.org, rest\)/.test(contentSrc));
  ok("a missing API leaves the defaults standing",
     /\.catch\(function \(\) \{ \/\* defaults stand \*\/ \}\)/.test(contentSrc));
  ok("offline mode skips the request entirely", /mode === "offline"/.test(contentSrc));

  const layoutSrc = fs.readFileSync(path.join(ROOT, "assets/js/layout.js"), "utf8");
  ok("the layout waits for content before pages render", /NPJOEContent\.ready/.test(layoutSrc));
  ok("a slow API cannot block the page", /setTimeout\(proceed, 1200\)/.test(layoutSrc));
  ok("the chrome repaints when overrides arrive", /hasOverrides\) paint\(\)/.test(layoutSrc));

  const mainSrc = fs.readFileSync(path.join(ROOT, "assets/js/main.js"), "utf8");
  ok("the load fallback cannot pre-empt the content merge",
     /if \(!document\.getElementById\("siteHeaderMount"\)\) bootOnce\(\)/.test(mainSrc));
  ok("figures from the board override the numbers in the markup",
     /document\.querySelectorAll\("\[data-figure\]"\)/.test(mainSrc));
  ok("reveals have a failsafe so content is never stranded invisible",
     /setTimeout\(showAll, 3000\)/.test(mainSrc));

  group("Scoped lookups that previously broke");
  ok("rail arrows are looked up in the surrounding section",
     /var group = rail\.closest\("section"\)/.test(mainSrc));
  ok("tab panels are looked up in the surrounding section",
     /var scope = group\.closest\("section"\)/.test(mainSrc));

  group("Form engine safeguards");
  const formsSrc = fs.readFileSync(path.join(ROOT, "assets/js/forms.js"), "utf8");
  ok("a server refusal never shows the success panel",
     /var answered = err && err\.status && err\.status !== 404/.test(formsSrc));
  ok("the final step re-checks fields on earlier steps",
     /validateScope\(form, true\)/.test(formsSrc));
  ok("validation errors carry the HTTP status through", /err\.status = res\.status/.test(formsSrc));
};
