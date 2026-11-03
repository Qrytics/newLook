#!/usr/bin/env node
// dom-contract.mjs: list what the project's JavaScript and tests depend on in the markup and CSS,
// and report anything that is missing. Run it BEFORE restructuring a UI, and again AFTER.
//
//   node dom-contract.mjs [projectDir]
//
// Catches the classic redesign breakage: a rewritten index.html or stylesheet that drops an id the
// script reads (getElementById('m-fps')), an id a test clicks (locator('#btn-span')), or a state
// class the script toggles (classList.toggle('armed')) that no CSS rule styles any more.
// Exit code 1 when something is missing.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const SKIP = new Set(['node_modules', 'dist', 'build', '.git', 'coverage', '.next', '.venv', 'venv', '__pycache__', 'shots', '.turbo', 'newlook']);
const EXT = /\.(m?js|cjs|jsx|ts|tsx|html|css|scss|vue|svelte)$/i;

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name) || name.startsWith('.') && name !== '.') continue;
    const p = path.join(dir, name), st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (EXT.test(name) && st.size < 2_000_000) files.push(p);
  }
})(root);

const rel = (p) => path.relative(root, p);
const isCode = (p) => /\.(m?js|cjs|jsx|ts|tsx|vue|svelte)$/i.test(p);
const isMarkup = (p) => /\.(html|jsx|tsx|vue|svelte|m?js|ts)$/i.test(p);
const isCss = (p) => /\.(css|scss)$/i.test(p);


// String literals in an argument list, skipping ones used in comparisons like  x === 'win'.
function literals(argStr) {
  const out = [];
  for (const m of argStr.matchAll(/["'`]([A-Za-z][\w-]*)["'`]/g)) {
    const before = argStr.slice(Math.max(0, m.index - 6), m.index);
    if (/[=!]=\s*$/.test(before) || /[=!]==\s*$/.test(before)) continue;
    const after = argStr.slice(m.index + m[0].length, m.index + m[0].length + 6);
    if (/^\s*[=!]==?/.test(after)) continue;
    out.push(m[1]);
  }
  return out;
}
function splitArgs(argStr) {
  const parts = []; let depth = 0, cur = '', q = '';
  for (const ch of argStr) {
    if (q) { cur += ch; if (ch === q) q = ''; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { q = ch; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

const idRefs = new Map();   // id -> Set(files)
const classRefs = new Map(); // class -> Set(files)
const idDefs = new Set();
const cssText = [];
const add = (map, key, file) => { if (!map.has(key)) map.set(key, new Set()); map.get(key).add(rel(file)); };

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  if (isCss(f)) cssText.push(src);
  if (/\.(html|vue|svelte)$/i.test(f)) { for (const m of src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) cssText.push(m[1]); }
  if (isMarkup(f)) {
    for (const m of src.matchAll(/\bid\s*[=:]\s*\{?\s*["'`]([A-Za-z][\w-]*)["'`]/g)) idDefs.add(m[1]);
    for (const m of src.matchAll(/\.id\s*=\s*["'`]([A-Za-z][\w-]*)["'`]/g)) idDefs.add(m[1]);
  }
  if (isCode(f) || /\.html$/i.test(f)) {
    for (const m of src.matchAll(/getElementById\(([^)]*)\)/g)) for (const q of literals(m[1])) add(idRefs, q, f);
    for (const m of src.matchAll(/(?:querySelector(?:All)?|locator|waitForSelector|closest|matches|\$\$?)\(\s*([^)]*)\)/g)) {
      for (const q of m[1].matchAll(/#([A-Za-z][\w-]*)/g)) add(idRefs, q[1], f);
    }
    // State classes only: the FIRST argument of classList calls (the others are usually conditions).
    for (const m of src.matchAll(/classList\.(add|remove|toggle|contains|replace)\(\s*([^)]*)\)/g)) {
      const parts = splitArgs(m[2]);
      const take = m[1] === 'add' || m[1] === 'remove' ? parts : parts.slice(0, 1);
      for (const part of take) { const lit = /^["'`]([A-Za-z][\w-]*)["'`]$/.exec(part.trim()); if (lit) add(classRefs, lit[1], f); }
    }
  }
}

const css = cssText.join('\n');
const classInCss = (c) => new RegExp(`\\.${c.replace(/[-]/g, '\\-')}(?![\\w-])`).test(css);

const missingIds = [...idRefs].filter(([id]) => !idDefs.has(id));
const missingClasses = css.length ? [...classRefs].filter(([c]) => !classInCss(c)) : [];

console.log(`dom-contract for ${root}`);
console.log(`  scanned ${files.length} files; ${idRefs.size} ids are read by code or tests, ${classRefs.size} state classes are toggled by code\n`);
console.log(`IDS referenced by code or tests: ${idRefs.size - missingIds.length} found in markup, ${missingIds.length} not found`);
for (const [id, where] of missingIds) console.log(`  MISSING #${id}   used in ${[...where].slice(0, 3).join(', ')}`);
if (missingIds.length) console.log('  (an id can be legitimately missing if the script builds it from a variable at runtime; check each one)');
console.log(`\nSTATE CLASSES the code toggles: ${classRefs.size - missingClasses.length} styled in CSS, ${missingClasses.length} with no CSS rule`);
for (const [c, where] of missingClasses) console.log(`  NO CSS RULE .${c}   used in ${[...where].slice(0, 3).join(', ')}`);
if (!css.length) console.log('  (no CSS files found; class check skipped)');
if (missingClasses.length) console.log('  (a state class with no rule means a button or panel will look the same when the script turns it on: add the style)');
console.log(missingIds.length || missingClasses.length ? '\nRESULT: fix the items above.' : '\nRESULT: contract intact.');
process.exit(missingIds.length ? 1 : 0);
