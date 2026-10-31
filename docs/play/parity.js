/* parity.js — the corpus, run in the browser on the Loom's machine.
 *
 * The hand-computed expectations live in CORPUS (copied from corpus.json by
 * tools/sync-demo.mjs). This file runs each program on the Loom's Weft-8 and
 * compares the result with them, in front of you.
 *
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin
 * SPDX-License-Identifier: PolyForm-Noncommercial-1.0.0
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./weft8.js"), require("./corpus.js"));
  else root.Parity = factory(root.Weft8, root.CORPUS);
})(typeof self !== "undefined" ? self : this, function (Weft8, CORPUS) {
  "use strict";

  function runOne(entry) {
    var a = Weft8.assemble(entry.source);
    if (a.errors.length) return { errors: a.errors, match: false };
    var out = [];
    var host = { output: out, "in": function () { return 0; }, out: function (p, v) { out.push(v); } };
    var vm = new Weft8.VM({ rom: a.bytes, peripherals: host });
    vm.run(20000);
    var exp = entry.expect;
    var regsOk = Object.keys(exp.r).every(function (k) { return vm.r[+k] === exp.r[k]; });
    var flagsOk = ["z", "c", "n", "v"].every(function (f) { return !!vm.flags[f.toUpperCase()] === !!exp.flags[f]; });
    var outOk = JSON.stringify(out) === JSON.stringify(exp.out);
    return {
      errors: [], bytes: a.all, steps: vm.steps, halted: vm.halted, error: vm.error,
      regs: Array.from(vm.r), flags: vm.flags, out: out,
      regsOk: regsOk, flagsOk: flagsOk, outOk: outOk, match: regsOk && flagsOk && outOk
    };
  }

  function runAll() {
    return CORPUS.programs.map(function (p) {
      var r = runOne(p);
      r.id = p.id; r.what = p.what; r.source = p.source; r.expect = p.expect;
      return r;
    });
  }

  return { runOne: runOne, runAll: runAll };
});
