/* tools/sync-demo.mjs — write docs/play/corpus.js from corpus.json, so the page
 * and the C machine read the same corpus. CI fails if the file is stale.
 * SPDX-FileCopyrightText: 2026 Dr Sohil Momin · PolyForm-Noncommercial-1.0.0 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(import.meta.dirname, "..");
const corpus = JSON.parse(fs.readFileSync(path.join(root, "corpus.json"), "utf8"));
const out =
  "/* GENERATED from corpus.json by tools/sync-demo.mjs — do not edit. */\n" +
  "(function (root) {\n  var DATA = " + JSON.stringify(corpus, null, 1) + ";\n" +
  "  root.CORPUS = DATA;\n" +
  "  if (typeof module !== \"undefined\" && module.exports) module.exports = DATA;\n" +
  "})(typeof self !== \"undefined\" ? self : this);\n";
fs.writeFileSync(path.join(root, "docs", "play", "corpus.js"), out);
console.log("wrote docs/play/corpus.js — " + corpus.programs.length + " programs");
