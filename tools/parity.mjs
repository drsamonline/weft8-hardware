/* tools/parity.mjs — three-way parity.
 *
 *   corpus.json (hand-computed)   vs   the C machine (c/)   vs   the Loom's JS machine
 *
 * All three must agree, program by program. Run: node tools/parity.mjs [path-to-binary]
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin · PolyForm-Noncommercial-1.0.0 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const W = require("../docs/play/weft8.js");
const root = path.join(import.meta.dirname, "..");
const corpus = JSON.parse(fs.readFileSync(path.join(root, "corpus.json"), "utf8"));
const binary = process.argv[2] || path.join(root, "weft8-corpus");

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log("PASS  " + name); return; }
  fail++; console.log("FAIL  " + name + (extra ? "  [" + extra + "]" : ""));
};

/* the C machine */
let cLines = [];
try {
  cLines = execFileSync(binary, { encoding: "utf8" }).trim().split("\n").map((l) => JSON.parse(l));
} catch (e) {
  console.log("could not run " + binary + " — build it first: gcc -O2 -o weft8-corpus c/weft8.c c/main.c");
  process.exit(2);
}

const byId = (rows, id) => rows.find((r) => r.id === id);

function matches(expect, r, flags, out) {
  const regsOk = Object.keys(expect.r).every((k) => r[+k] === expect.r[k]);
  const flagsOk = ["z", "c", "n", "v"].every((f) => !!flags[f] === !!expect.flags[f]);
  const outOk = JSON.stringify(out) === JSON.stringify(expect.out);
  return { ok: regsOk && flagsOk && outOk, regsOk, flagsOk, outOk };
}

corpus.programs.forEach((p) => {
  const a = W.assemble(p.source);
  ok(p.id + ": assembles with the Loom's assembler", a.errors.length === 0, JSON.stringify(a.errors));

  /* the JavaScript machine */
  const host = { output: [], "in": () => 0, out: (port, v) => host.output.push(v) };
  const vm = new W.VM({ rom: a.bytes, peripherals: host });
  vm.run(20000);
  const js = matches(p.expect, vm.r, vm.flags, host.output);
  ok(p.id + ": the JavaScript machine matches the hand-computed result", js.ok,
     JSON.stringify({ regs: js.regsOk, flags: js.flagsOk, out: js.outOk }));

  /* the C machine */
  const row = byId(cLines, p.id);
  ok(p.id + ": the C machine ran", !!row);
  if (row) {
    const c = matches(p.expect, row.r, row.flags, row.out);
    ok(p.id + ": the C machine matches the hand-computed result", c.ok,
       JSON.stringify({ regs: c.regsOk, flags: c.flagsOk, out: c.outOk }));

    const sameRegs = Array.from(vm.r).every((v, i) => v === row.r[i]);
    ok(p.id + ": the two machines agree on every register", sameRegs);
    ok(p.id + ": and on every flag",
       ["Z", "C", "N", "V"].every((f) => !!vm.flags[f] === !!row.flags[f.toLowerCase()]));
    ok(p.id + ": and on what was written to the ports",
       JSON.stringify(host.output) === JSON.stringify(row.out));
  }
});

console.log("");
console.log(pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
