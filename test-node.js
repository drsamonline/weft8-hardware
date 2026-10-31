/* test-node.js — the proof for Weft-8 on hardware.
 *
 * The C machine is compiled and checked in CI (this sandbox has no compiler);
 * what is asserted HERE is the other half of the bargain: that the Loom's machine
 * reproduces every hand-computed result, that the corpus really is a corpus, and
 * that the demo page is wired to both.
 *
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
"use strict";

const fs = require("fs");
const W = require("./docs/play/weft8.js");
const Parity = require("./docs/play/parity.js");
const CORPUS = require("./docs/play/corpus.js");

let pass = 0;
const failures = [];
const ok = (c, n) => { if (c) { pass++; return; } failures.push(n); console.log("  FAIL  " + n); };
const eq = (g, w, n) => ok(JSON.stringify(g) === JSON.stringify(w),
  n + "  (got " + JSON.stringify(g) + ", want " + JSON.stringify(w) + ")");

console.log("the corpus — hand-computed, not recorded");
eq(CORPUS.programs.length, 11, "eleven programs are in the corpus");
ok(CORPUS.programs.every(p => p.expect && p.expect.flags && p.expect.r), "every program carries an expectation");
ok(CORPUS.programs.every(p => typeof p.what === "string" && p.what.length > 10), "every program says what it proves");
eq(new Set(CORPUS.programs.map(p => p.id)).size, 11, "the ids are unique");

console.log("the Loom's machine — it reproduces every hand-computed result");
Parity.runAll().forEach(function (r) {
  ok(r.errors.length === 0, r.id + ": assembles");
  ok(r.match, r.id + ": matches the hand-computed result" +
    (r.match ? "" : " (regs " + r.regsOk + ", flags " + r.flagsOk + ", out " + r.outOk + ")"));
  ok(r.halted, r.id + ": reaches HLT");
  ok(r.bytes.length <= 128, r.id + ": fits the 128-byte ROM");
});

console.log("the C source — it is here, and it is the same machine");
const csrc = fs.readFileSync("./c/weft8.c", "utf8");
Object.keys(W.OPCODES).forEach(function (op) {
  ok(csrc.indexOf("W8_" + op) >= 0, "the C machine implements " + op);
});
eq((csrc.match(/case W8_/g) || []).length, 27, "the C switch has all 27 opcodes");
ok(/stack overflow/.test(csrc), "the C machine guards the stack");
ok(/step limit/.test(csrc), "the C machine has a step limit");
const hdr = fs.readFileSync("./c/weft8.h", "utf8");
ok(/uint8_t mem\[256\]/.test(hdr), "the C machine has the same 256-byte address space");
ok(/uint8_t r\[16\]/.test(hdr), "and the same sixteen registers");

console.log("the generated corpus header — it is generated, and it is current");
const gen = fs.readFileSync("./c/corpus.h", "utf8");
CORPUS.programs.forEach(function (p, i) {
  const a = W.assemble(p.source);
  ok(gen.indexOf("prog_" + i + "[] = {" + a.all.join(",") + "}") >= 0,
     "c/corpus.h carries the exact bytes of " + p.id);
});

console.log("the page — it loads the bench it is tested against");
const html = fs.readFileSync("./docs/play/index.html", "utf8");
["web-kit.js", "weft8.js", "corpus.js", "parity.js"].forEach(function (k) {
  ok(html.indexOf('<script src="' + k + '"></script>') > 0, "the page loads " + k);
});
ok(html.indexOf('id="rows"') > 0, "the page has the corpus table");


/* the family — every page links back to the Loom, and the Loom to every page */
{
  const fsm = require("fs");
  const landing = fsm.readFileSync("./docs/index.html", "utf8");
  ok(landing.indexOf('id="family"') > 0, "the landing page carries the family strip");
  ok(landing.indexOf("you are here") > 0, "and marks this page as the one you are on");
  ['app-jacquard', 'app-weft-puzzles', 'app-clip-loom', 'weft8-kit', 'weft8-classroom', 'weft8-compare'].forEach(function (slug) {
    ok(landing.indexOf("https://drsamonline.github.io/" + slug + "/") > 0, "it links to " + slug);
  });
  const readme = fsm.readFileSync("./README.md", "utf8");
  ok(readme.indexOf("The Weft-8 family") > 0, "the README carries the family table too");
  ok(readme.indexOf("you are here") > 0, "and marks this repository in it");
}


/* the copy counts what the data holds — so a new level cannot leave the page lying */
{
  const fsc = require("fs");
  const land = fsc.readFileSync("./docs/index.html", "utf8");
  ok(land.indexOf("eleven programs") >= 0, "the landing page states the right count: eleven programs");
  ok(CORPUS.programs.length === 11, "and the data really has that many");
}

console.log("");
console.log(pass + " passed, " + failures.length + " failed");
if (failures.length) { failures.forEach(f => console.log("  - " + f)); process.exit(1); }
