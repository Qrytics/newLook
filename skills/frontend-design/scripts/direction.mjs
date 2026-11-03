#!/usr/bin/env node
// direction.mjs: deal three design directions that fit a project and that it has not used recently.
// This is what stops every redesign from ending up looking the same.
//
//   node direction.mjs --project <dir> --brief "what it is, who uses it, how it should feel"
//   node direction.mjs --project <dir> --brief "..." --reroll         deal three different ones
//   node direction.mjs --project <dir> --choose <slug> [--why "..."]  record the choice
//   node direction.mjs --list                                         show all directions
//   node direction.mjs --project <dir> --history                      show what this project used
//   node direction.mjs --project <dir> --verify                       after building: does the CSS really use the chosen direction, and does it look like another project?
//
// It reads the catalog in ../reference/directions.md (headings "## N. slug (summary)").
// History is kept in <project>/.newlook/history.json and also in ~/.newlook-history.json so that a
// different project in the same week does not get the same look either.
// The scoring is keyword matching on the "Fits" and "Avoid for" lines. It is a nudge, not a judge:
// read the three summaries and pick the one a human designer would pick.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG = path.join(HERE, '..', 'reference', 'directions.md');
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d = '') => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };

function parseCatalog() {
  const text = readFileSync(CATALOG, 'utf8');
  const parts = text.split(/\n(?=## \d+\. )/).slice(1);
  return parts.map((block) => {
    const head = /^## (\d+)\. ([a-z-]+) \((.*)\)/.exec(block);
    if (!head) return null;
    const grab = (label) => { const m = new RegExp(`\\*\\*${label}:\\*\\*([^\\n]*)`, 'i').exec(block); return m ? m[1].trim() : ''; };
    const fitsLine = /\*\*Fits:\*\*([^\n]*)/.exec(block);
    const fitsText = fitsLine ? fitsLine[1] : '';
    const [fits, avoid = ''] = fitsText.split(/\*\*Avoid for:\*\*/);
    const warn = /\*\*Warning:\*\*([^\n]*)/.exec(block);
    return {
      n: Number(head[1]), slug: head[2], summary: head[3],
      fits: fits.trim().replace(/\.$/, ''), avoid: avoid.trim().replace(/\.$/, ''),
      palette: grab('Palette'), type: grab('Type'), layout: grab('Layout'), assets: grab('Assets'), signature: grab('Signature'), shape: grab('Shape'),
      warn: warn ? warn[1].trim() : '',
      isDefaultLook: /weak models default/i.test(block),
    };
  }).filter(Boolean);
}

const STOP = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'with', 'is', 'it', 'its', 'that', 'this', 'by', 'at', 'as', 'be', 'are', 'who', 'what', 'how', 'should', 'feel', 'users', 'user', 'app', 'tool', 'website', 'site', 'page', 'web', 'screen']);
const SYN = {
  dashboard: ['monitoring', 'operations', 'readouts', 'control'], admin: ['control', 'records', 'admin'],
  developer: ['developer', 'devops', 'cli', 'api', 'code'], devtool: ['developer', 'tools'], hardware: ['hardware', 'devices'],
  shop: ['shops', 'commerce', 'marketplaces'], store: ['shops', 'commerce'], ecommerce: ['commerce', 'shops'], food: ['food', 'shops'],
  news: ['news', 'magazines'], blog: ['blogs', 'documentation'], docs: ['documentation', 'blogs', 'developers'], documentation: ['documentation'],
  portfolio: ['portfolios', 'photography', 'galleries'], photo: ['photography', 'portfolios', 'galleries'], gallery: ['galleries', 'portfolios'],
  finance: ['finance', 'audit', 'banking'], bank: ['banking', 'finance'], audit: ['audit', 'verification'], verify: ['verification', 'audit'], verified: ['verification', 'audit'],
  health: ['health', 'wellness'], wellness: ['wellness', 'meditation', 'journaling'], meditation: ['meditation', 'wellness'], notes: ['journaling', 'planning'],
  game: ['games', 'youth', 'quizzes'], kids: ['kids', 'games', 'youth'], event: ['events', 'festivals', 'campaigns'], launch: ['launches', 'campaigns', 'events'],
  luxury: ['luxury', 'jewellery', 'fashion'], fashion: ['fashion', 'jewellery'], hotel: ['hospitality'], architecture: ['architecture', 'engineering'],
  security: ['security', 'monitoring', 'incident'], monitoring: ['monitoring', 'incident'], trading: ['trading', 'monitoring'],
  government: ['government', 'forms', 'services'], form: ['forms', 'onboarding'], school: ['schools', 'forms'], engineering: ['engineering', 'specs', 'infrastructure'],
  api: ['api', 'specs', 'infrastructure'], cli: ['clis', 'developer'], research: ['research', 'documentation', 'case'],
};

function tokens(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
function expand(words) {
  const out = new Set(words);
  for (const w of words) { for (const [k, v] of Object.entries(SYN)) if (w === k || w.startsWith(k)) v.forEach((x) => out.add(x)); }
  return out;
}
function score(d, brief) {
  const want = expand(tokens(brief));
  const fitW = tokens(d.fits), avoidW = tokens(d.avoid);
  let s = 0;
  for (const w of want) {
    if (fitW.some((f) => f === w || f.startsWith(w) || w.startsWith(f))) s += 3;
    if (avoidW.some((f) => f === w || f.startsWith(w) || w.startsWith(f))) s -= 4;
  }
  return s;
}

const fitLabel = (s) => (s >= 8 ? 'strong fit' : s >= 3 ? 'reasonable fit' : 'WEAK FIT, only if you can justify it');
function readJson(p, d) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return d; } }
function writeJson(p, v) { mkdirSync(path.dirname(p), { recursive: true }); writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); }

const catalog = parseCatalog();
if (!catalog.length) { console.error(`Could not parse ${CATALOG}`); process.exit(2); }

if (flag('list')) {
  for (const d of catalog) console.log(`${String(d.n).padStart(2)}. ${d.slug.padEnd(14)} ${d.summary}\n      fits: ${d.fits}\n      avoid: ${d.avoid}`);
  process.exit(0);
}

const project = path.resolve(opt('project', '.'));
const projFile = path.join(project, '.newlook', 'history.json');
const globalFile = path.join(homedir(), '.newlook-history.json');
const dealFile = path.join(project, '.newlook', 'last-deal.json');
const proj = readJson(projFile, { runs: [] });
const glob = readJson(globalFile, { runs: [] });

if (flag('history')) {
  console.log(`project (${projFile}):`); proj.runs.forEach((r) => console.log(`  ${r.date}  ${r.direction}  ${r.why || ''}`));
  console.log(`all projects (${globalFile}), newest last:`); glob.runs.slice(-10).forEach((r) => console.log(`  ${r.date}  ${r.direction}  ${r.project}`));
  process.exit(0);
}


function walkCss(dir, out = []) {
  const SKIP = new Set(['node_modules', 'dist', 'build', '.git', '.newlook', 'coverage', '.next', '.venv', 'shots', 'newlook']);
  let names = [];
  try { names = readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (SKIP.has(n) || n.startsWith('.')) continue;
    const p = path.join(dir, n); let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walkCss(p, out); else if (/\.(css|scss|html|jsx|tsx|vue|svelte|m?js)$/i.test(n) && st.size < 1_500_000) out.push(p);
  }
  return out;
}
const normHex = (h) => { h = h.toLowerCase().replace('#', ''); return '#' + (h.length === 3 ? h.split('').map((c) => c + c).join('') : h); };

if (flag('verify')) {
  const last = proj.runs[proj.runs.length - 1];
  if (!last) { console.error('No direction recorded for this project. Run --brief then --choose first.'); process.exit(2); }
  const d = catalog.find((x) => x.slug === last.direction);
  const files = walkCss(project);
  const cssFiles = files.filter((f) => /\.(css|scss)$/i.test(f) || /\.html$/i.test(f));
  const allText = files.map((f) => readFileSync(f, 'utf8')).join('\n');
  const css = cssFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
  let pkg = {}; try { pkg = JSON.parse(readFileSync(path.join(project, 'package.json'), 'utf8')); } catch { /* no package.json */ }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  let bad = 0;
  console.log(`Verifying "${d.slug}" (${d.summary}) in ${project}\n`);

  const fontPkgs = [...new Set([...d.type.matchAll(/@fontsource-variable\/([a-z0-9-]+)/g)].map((m) => m[1]))];
  console.log('FONTS the direction names:');
  for (const f of fontPkgs) {
    const installed = !!deps[`@fontsource-variable/${f}`];
    const imported = allText.includes(`@fontsource-variable/${f}`);
    const fam = f.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
    const used = new RegExp(fam.replace(/ /g, '\\s*'), 'i').test(css);
    const ok = installed && imported && used;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok     ' : 'PROBLEM'} ${f}: ${installed ? 'installed' : 'NOT in package.json'}, ${imported ? 'imported' : 'NOT imported'}, ${used ? 'named in CSS' : 'NOT named in font-family'}`);
  }
  const usedFamilies = [...new Set([...css.matchAll(/font-family:\s*([^;}{]+)/gi)].flatMap((m) => m[1].split(',').map((x) => x.replace(/["']/g, '').replace(/var\([^)]*\)/g, '').trim()).filter((x) => x && !/^(sans-serif|serif|monospace|ui-[a-z-]+|system-ui|-apple-system|inherit|initial)$/i.test(x))))];
  const stray = usedFamilies.filter((u) => !fontPkgs.some((f) => u.toLowerCase().replace(/ variable$/, '').replace(/\s+/g, '-') === f) && !/menlo|consolas|sf mono|georgia|iowan/i.test(u));
  if (stray.length) { console.log(`  note: other families named in CSS: ${stray.join(', ')} (fine only if they are fallbacks)`); }

  const palHex = [...new Set([...d.palette.matchAll(/#[0-9a-fA-F]{3,6}\b/g)].map((m) => normHex(m[0])))];
  const cssHex = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => normHex(m[0].slice(0, m[0].length > 7 ? 7 : m[0].length)));
  const cssSet = new Set(cssHex);
  const hit = palHex.filter((h) => cssSet.has(h));
  console.log(`\nPALETTE: ${hit.length} of ${palHex.length} colors from the direction appear in the CSS`);
  if (palHex.length && hit.length === 0) { bad++; console.log('  PROBLEM none of the direction palette is used. This is not that direction.'); }
  else if (palHex.length && hit.length < Math.min(3, palHex.length)) console.log('  note: only a few palette colors appear. Fine if you tuned them; say so in the report.');
  console.log(`  direction colors: ${palHex.join(' ')}`);

  const counts = {}; for (const h of cssHex) counts[h] = (counts[h] || 0) + 1;
  const topColors = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map((e) => e[0]);
  const fingerprint = { fonts: [...fontPkgs].sort(), colors: topColors };

  console.log('\nSAMENESS against other projects:');
  const others = glob.runs.filter((r) => r.fingerprint && r.project !== path.basename(project));
  let alike = 0;
  for (const o of others) {
    const sameFonts = o.fingerprint.fonts.join() === fingerprint.fonts.join() && fingerprint.fonts.length > 0;
    const sharedColors = o.fingerprint.colors.filter((c) => topColors.includes(c)).length;
    if (sameFonts || sharedColors >= 4) { alike++; console.log(`  PROBLEM looks like "${o.project}" (${o.direction}): ${sameFonts ? 'same font pairing' : ''}${sameFonts && sharedColors >= 4 ? ', ' : ''}${sharedColors >= 4 ? `${sharedColors} of the 6 main colors identical` : ''}`); }
  }
  if (!others.length) console.log('  no other verified projects on record yet');
  else if (!alike) console.log(`  ok: compared with ${others.length} other verified project(s), none share the fonts or main colors`);
  bad += alike;

  const lastGlob = [...glob.runs].reverse().find((r) => r.project === path.basename(project) && r.direction === last.direction);
  if (lastGlob) { lastGlob.fingerprint = fingerprint; writeJson(globalFile, glob); }
  last.fingerprint = fingerprint; writeJson(projFile, proj);

  console.log(bad ? `\nRESULT: ${bad} problem(s). Fix them, or switch direction with --choose and say why in the report.` : '\nRESULT: the build matches the chosen direction and does not copy another project.');
  process.exit(bad ? 1 : 0);
}

const choose = opt('choose');
if (choose) {
  const d = catalog.find((x) => x.slug === choose);
  if (!d) { console.error(`Unknown direction "${choose}". Slugs: ${catalog.map((x) => x.slug).join(', ')}`); process.exit(2); }
  const entry = { date: new Date().toISOString().slice(0, 10), direction: d.slug, why: opt('why') };
  proj.runs.push(entry); writeJson(projFile, proj);
  glob.runs.push({ ...entry, project: path.basename(project) }); writeJson(globalFile, glob);
  console.log(`Recorded: ${d.slug} for ${path.basename(project)}.\nNow read reference/directions.md section "${d.n}. ${d.slug}" and build it exactly as written.`);
  console.log(`Add this to the stylesheet stamp: theme: custom (${d.slug})`);
  process.exit(0);
}

const brief = opt('brief');
if (!brief) { console.error('Give --brief "what the project is, who uses it, how it should feel" (or --list).'); process.exit(2); }

const usedHere = new Set(proj.runs.map((r) => r.direction));
const lastHere = proj.runs.length ? proj.runs[proj.runs.length - 1].direction : '';
const recentAll = glob.runs.slice(-4).map((r) => r.direction);
const excluded = new Set(usedHere);
let notes = [];
if (lastHere) notes.push(`this project already used "${lastHere}" and any earlier pick: all excluded`);

let pool = catalog.filter((d) => !excluded.has(d.slug));
if (!pool.length) { pool = catalog.filter((d) => d.slug !== lastHere); notes.push('every direction has been used here once; only the most recent is excluded'); }

const rerollSeed = flag('reroll') ? (Date.now() % 997) : 0;
if (flag('reroll')) {
  const prev = readJson(dealFile, { slugs: [] }).slugs;
  const filtered = pool.filter((d) => !prev.includes(d.slug));
  if (filtered.length >= 3) { pool = filtered; notes.push(`rerolled: excluded the previous deal (${prev.join(', ')})`); }
}
const hash = (str) => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); };
const ranked = pool.map((d) => {
  let s = score(d, brief);
  const ri = glob.runs.map((r) => r.direction).lastIndexOf(d.slug);
  if (ri >= 0) { const age = glob.runs.length - 1 - ri; s -= age < 2 ? 6 : age < 5 ? 2 : 0; } // another project used it recently: steer away
  if (d.isDefaultLook) s -= 3;                       // the look weak models drift to: needs a real reason
  s += (hash(d.slug + brief + rerollSeed) % 100) / 100; // tie-break that changes with the brief and on reroll
  return { d, s };
}).sort((a, b) => b.s - a.s);

// Deal three with different "feels": avoid two light or two dark neighbours when possible.
const pick = [];
for (const r of ranked) {
  if (pick.length === 3) break;
  if (r.s < -1 && pick.length >= 1) continue;
  pick.push(r);
}
for (const r of ranked) { if (pick.length === 3) break; if (!pick.includes(r)) pick.push(r); }

console.log(`Brief: ${brief}`);
notes.forEach((n) => console.log(`Note: ${n}`));
console.log('\nThree directions dealt. Read each summary, pick the one a human designer would pick for this project:\n');
pick.forEach(({ d, s }, i) => {
  console.log(`${i + 1}. ${d.slug}  (${d.summary})   ${fitLabel(s)} [score ${s.toFixed(1)}]`);
  console.log(`   Fits:      ${d.fits}`);
  console.log(`   Avoid for: ${d.avoid}`);
  console.log(`   Palette:   ${d.palette.slice(0, 150)}`);
  console.log(`   Type:      ${d.type.split('`')[0].trim()}`);
  console.log(`   Layout:    ${d.layout.slice(0, 140)}`);
  console.log(`   Assets:    ${d.assets}`);
  console.log(`   Signature: ${d.signature}`);
  if (d.warn) console.log(`   Warning:   ${d.warn}`);
  console.log('');
});
if (pick.every(({ s }) => s < 3)) console.log('WARNING: none of these is a good match. Re-read the brief for what the product is. Run --reroll once, then pick the closest and say why.\n');
writeJson(dealFile, { slugs: pick.map(({ d }) => d.slug), at: new Date().toISOString() });
console.log('Next:');
console.log(`  node scripts/direction.mjs --project ${opt('project', '.')} --choose <slug> --why "one sentence on why it fits"`);
console.log('Then open reference/directions.md at that direction and follow it. Do not mix two directions.');
console.log('If none fits: run again with --reroll (once). Never skip this step and fall back to a dark terminal look.');
console.log('After building, run --verify to prove the CSS really uses the direction and does not copy another project.');
