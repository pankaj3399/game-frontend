#!/usr/bin/env node
/**
 * Verifies every static t("…") key exists in all locale JSON files
 * and that locale files share the same key set as English.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "src/locales");
const srcDir = path.join(root, "src");

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (["node_modules", "dist", "locales"].includes(ent.name)) continue;
      walk(p, acc);
    } else if (/\.tsx?$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function get(obj, key) {
  const parts = key.split(".");
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return cur;
}

function hasI18nKey(obj, key) {
  if (get(obj, key) !== undefined) return true;
  for (const suf of ["_zero", "_one", "_two", "_few", "_many", "_other"]) {
    if (get(obj, key + suf) !== undefined) return true;
  }
  return false;
}

function flatten(obj, prefix = "") {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) out.push(...flatten(v, key));
    else out.push(key);
  }
  return out;
}

function collectStaticKeys(text) {
  const keys = [];
  const re = /\bt\(\s*(['"`])([^'"`]+)\1/g;
  let m;
  while ((m = re.exec(text))) {
    if (!m[2].includes("${")) keys.push(m[2]);
  }
  return keys;
}

const used = new Set();
for (const file of walk(srcDir)) {
  for (const k of collectStaticKeys(fs.readFileSync(file, "utf8"))) used.add(k);
}

const locales = Object.fromEntries(
  fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.replace(".json", ""), JSON.parse(fs.readFileSync(path.join(localesDir, f), "utf8"))]),
);

const enKeySet = new Set(flatten(locales.en));
let failed = false;

for (const [loc, data] of Object.entries(locales)) {
  const missingFromCode = [...used].filter((k) => !hasI18nKey(data, k));
  if (missingFromCode.length) {
    failed = true;
    console.error(`[${loc}] missing ${missingFromCode.length} keys used in code:`);
    for (const k of missingFromCode) console.error(`  - ${k}`);
  }
  if (loc === "en") continue;
  const locKeys = new Set(flatten(data));
  const missingVsEn = [...enKeySet].filter((k) => !locKeys.has(k));
  const extraVsEn = [...locKeys].filter((k) => !enKeySet.has(k));
  if (missingVsEn.length) {
    failed = true;
    console.error(`[${loc}] missing ${missingVsEn.length} keys vs en (first 10):`, missingVsEn.slice(0, 10));
  }
  if (extraVsEn.length) {
    failed = true;
    console.error(`[${loc}] ${extraVsEn.length} extra keys vs en:`, extraVsEn);
  }
}

if (failed) process.exit(1);
console.log(
  `Locale audit passed: ${Object.keys(locales).length} locales, ${enKeySet.size} keys, ${used.size} static t() keys.`,
);
