/* Minimal zero-dependency test helpers. */
"use strict";
const state = { pass: 0, fail: 0, groups: [], current: null, failures: [] };

function group(name) {
  state.current = { name, pass: 0, fail: 0 };
  state.groups.push(state.current);
  console.log("\n\x1b[1m" + name + "\x1b[0m");
}
function ok(label, condition, detail) {
  if (condition) {
    state.pass++; state.current && state.current.pass++;
    console.log("  \x1b[32m✓\x1b[0m " + label);
  } else {
    state.fail++; state.current && state.current.fail++;
    state.failures.push(label + (detail ? "  →  " + detail : ""));
    console.log("  \x1b[31m✗\x1b[0m " + label + (detail ? "\n      \x1b[31m" + detail + "\x1b[0m" : ""));
  }
}
function eq(label, actual, expected) {
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  ok(label, a === e, a === e ? "" : "got " + a + ", expected " + e);
}
function summary() {
  const total = state.pass + state.fail;
  console.log("\n" + "─".repeat(58));
  state.groups.forEach(g => {
    const mark = g.fail ? "\x1b[31m✗\x1b[0m" : "\x1b[32m✓\x1b[0m";
    console.log("  " + mark + " " + g.name.slice(0, 44).padEnd(46) + g.pass + "/" + (g.pass + g.fail));
  });
  console.log("─".repeat(58));
  if (state.fail) {
    console.log("\x1b[31m  " + state.fail + " of " + total + " checks failed\x1b[0m\n");
    state.failures.forEach(f => console.log("    · " + f));
    console.log("");
  } else {
    console.log("\x1b[32m  all " + total + " checks passed\x1b[0m\n");
  }
  return state.fail === 0;
}
module.exports = { group, ok, eq, summary, state };
