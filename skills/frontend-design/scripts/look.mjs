#!/usr/bin/env node
// look.mjs: take screenshots of a page and run measurable checks on it.
// It exists so an agent can LOOK at its work and get hard numbers, without puppeteer-core.
//
//   node look.mjs --url http://127.0.0.1:5173/            screenshots of a running dev server
//   node look.mjs --serve ./frontend --path "/?x=1"       start the project's own Vite, look, stop it
//
// Options:
//   --sizes 1600x1000,390x844   viewports (default: desktop and phone)
//   --out <dir>                 where PNGs go (default ./shots)
//   --tag <name>                file prefix, e.g. before / after (default "look")
//   --wait <selector>           wait for this selector first (default body)
//   --settle <ms>               extra wait after load (default 900)
//   --full                      full-page screenshots (phone size is always full-page)
//   --strict                    exit code 1 when there are PROBLEMS
//   --help
//
// Needs Playwright with a Chromium: `npm i -D @playwright/test && npx playwright install chromium`
// (or set CHROME_PATH to any Chrome/Chromium binary). It is found from the current folder,
// the --serve folder, or the global npm root.

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { createServer as netServer } from 'node:net';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };

if (flag('help') || args.length === 0) {
  console.log(`look.mjs: screenshots plus measurable checks.
  node look.mjs --url <url> | --serve <project dir> [--path "/"] [--sizes 1600x1000,390x844] [--out shots] [--tag after] [--wait "#root"] [--settle 900] [--full] [--strict]`);
  process.exit(0);
}

const url0 = opt('url', '');
const serveDir = opt('serve', '');
const sizes = opt('sizes', '1600x1000,390x844').split(',').map((s) => s.split('x').map(Number));
const outDir = path.resolve(opt('out', 'shots'));
const tag = opt('tag', 'look');
const waitSel = opt('wait', 'body');
const settle = Number(opt('settle', '900'));

async function resolveFrom(name, bases, sub = '') {
  for (const base of bases) {
    try {
      const req = createRequire(path.join(path.resolve(base), 'noop.js'));
      return req.resolve(sub ? `${name}/${sub}` : name);
    } catch { /* try next */ }
  }
  return null;
}

async function loadPlaywright() {
  let globalRoot = '';
  try { globalRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* none */ }
  const bases = [process.cwd(), serveDir || process.cwd(), globalRoot ? path.dirname(globalRoot) : ''].filter(Boolean);
  for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
    const p = await resolveFrom(name, bases);
    if (p) {
      const m = await import(pathToFileURL(p).href);
      // CommonJS entries expose their exports under `default` when loaded with import().
      const found = m.chromium || (m.default && m.default.chromium);
      if (found) return found;
    }
  }
  return null;
}

const freePort = () => new Promise((res, rej) => {
  const s = netServer(); s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }); s.on('error', rej);
});

let viteServer = null;
let baseUrl = url0;
if (serveDir) {
  const pj = await resolveFrom('vite', [serveDir], 'package.json');
  if (!pj) { console.error(`No Vite found under ${serveDir}. Start your dev server yourself and use --url.`); process.exit(2); }
  const { createServer } = await import(pathToFileURL(path.join(path.dirname(pj), 'dist/node/index.js')).href);
  const port = await freePort();
  viteServer = await createServer({ root: path.resolve(serveDir), server: { host: '127.0.0.1', port, strictPort: true }, logLevel: 'error' });
  await viteServer.listen();
  baseUrl = `http://127.0.0.1:${port}${opt('path', '/')}`;
}
if (!baseUrl) { console.error('Give --url <url> or --serve <project dir>.'); process.exit(2); }

const chromium = await loadPlaywright();
if (!chromium) {
  console.error('Playwright not found. Install it, then retry:\n  npm i -D @playwright/test && npx playwright install chromium\nOr set CHROME_PATH to a Chrome binary and install playwright-core.');
  if (viteServer) await viteServer.close();
  process.exit(2);
}

// Runs inside the page. Returns { problems: [], notes: [] }.
function auditInPage() {
  const problems = [], notes = [];
  const sel = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.');
    return s;
  };
  const visible = (el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && r.width > 0 && r.height > 0;
  };
  const cvs = document.createElement('canvas'); cvs.width = cvs.height = 1;
  const cx = cvs.getContext('2d', { willReadFrequently: true });
  const rgba = (css) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const over = (top, under) => { const a = top[3] + under[3] * (1 - top[3]); return a === 0 ? [0, 0, 0, 0] : [0, 1, 2].map((i) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a).concat(a); };
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const bgOf = (el) => {
    const chain = [];
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none') return null; // gradient or image: unknown
      chain.push(rgba(cs.backgroundColor));
      if (chain[chain.length - 1][3] === 1) break;
    }
    let acc = [255, 255, 255, 1];
    for (let i = chain.length - 1; i >= 0; i--) acc = over(chain[i], acc);
    return acc;
  };

  // text elements: elements that directly own non-empty text
  const textEls = [...document.querySelectorAll('body *')].filter((el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0) && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName));
  const small = [], caps = [], lowContrast = [], sizes = new Set(), families = new Set();
  for (const el of textEls) {
    const cs = getComputedStyle(el), px = parseFloat(cs.fontSize);
    sizes.add(Math.round(px));
    families.add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
    const txt = el.textContent.trim().slice(0, 28);
    if (px < 12) small.push(`${sel(el)} ${px}px "${txt}"`);
    const ls = cs.letterSpacing === 'normal' ? 0 : parseFloat(cs.letterSpacing) / px;
    if (px <= 15 && (cs.textTransform === 'uppercase' || cs.fontVariantCaps !== 'normal' || ls > 0.03) && /[a-zA-Z]{3,}/.test(el.textContent)) {
      if (cs.textTransform === 'uppercase' || ls > 0.03) caps.push(`${sel(el)} ${px}px "${txt}"`);
    }
    const fg = rgba(cs.color), bg = bgOf(el);
    if (bg) {
      const eff = over(fg, bg), r = ratio(eff, bg), large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
      if (r < (large ? 3 : 4.5)) lowContrast.push(`${sel(el)} ${r.toFixed(1)}:1 "${txt}"`);
    }
  }
  const list = (arr, n = 5) => arr.slice(0, n).join('\n      ') + (arr.length > n ? `\n      ... and ${arr.length - n} more` : '');
  if (small.length) problems.push(`${small.length} text elements under 12px (minimum 12, body 14+):\n      ${list(small)}`);
  if (caps.length) problems.push(`${caps.length} small uppercase or letter-spaced labels (use sentence case, no tracking):\n      ${list(caps)}`);
  if (lowContrast.length) problems.push(`${lowContrast.length} text elements below contrast 4.5:1 (3:1 if large):\n      ${list(lowContrast)}`);

  // horizontal overflow
  const vw = window.innerWidth;
  if (document.documentElement.scrollWidth > vw + 1) {
    const off = [...document.querySelectorAll('body *')].filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1).map((el) => `${sel(el)} right=${Math.round(el.getBoundingClientRect().right)}`);
    problems.push(`page scrolls sideways at ${vw}px wide (scrollWidth ${document.documentElement.scrollWidth}):\n      ${list(off)}`);
  }

  // hit targets
  const targets = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=button], summary')].filter(visible);
  const tiny = targets.filter((el) => { const r = el.getBoundingClientRect(); return (r.height < 32 || r.width < 32) && !(el.type === 'checkbox' || el.type === 'radio'); }).map((el) => { const r = el.getBoundingClientRect(); return `${sel(el)} ${Math.round(r.width)}x${Math.round(r.height)}`; });
  if (tiny.length) problems.push(`${tiny.length} controls smaller than 32px (aim for 40 to 44):\n      ${list(tiny)}`);

  // accessible names
  const unnamed = targets.filter((el) => {
    if (el.matches('input,select,textarea')) return !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || (el.labels && el.labels.length) || el.closest('label'));
    return !(el.textContent.trim() || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title'));
  }).map(sel);
  if (unnamed.length) problems.push(`${unnamed.length} controls with no accessible name (add text or aria-label):\n      ${list(unnamed)}`);
  const noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
  if (noAlt) problems.push(`${noAlt} images with no alt attribute`);

  // structure and system health
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) notes.push(`${h1} <h1> elements (expected exactly 1)`);
  if (!document.documentElement.lang) notes.push('<html> has no lang attribute');
  if (sizes.size > 9) notes.push(`${sizes.size} distinct font sizes (${[...sizes].sort((a, b) => a - b).join(', ')}). A scale has 5 to 7.`);
  if (families.size > 3) notes.push(`${families.size} font families in use: ${[...families].join(', ')} (use at most 2 plus a mono)`);
  const sizeList = [...sizes].sort((a, b) => a - b);
  notes.push(`font sizes in use: ${sizeList.join(', ')}px; families: ${[...families].join(', ')}`);
  const canv = [...document.querySelectorAll('canvas')].filter(visible).length;
  if (canv) notes.push(`${canv} visible <canvas>: text drawn inside a canvas is NOT covered by these checks, read it in the screenshot`);
  return { problems, notes };
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
let totalProblems = 0;
try {
  for (const [w, h] of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(`console: ${m.text().slice(0, 160)}`); });
    await page.goto(baseUrl, { waitUntil: 'load' });
    try { await page.waitForSelector(waitSel, { timeout: 8000 }); } catch { errs.push(`selector never appeared: ${waitSel}`); }
    await page.waitForTimeout(settle);
    const file = path.join(outDir, `${tag}-${w}x${h}.png`);
    await page.screenshot({ path: file, fullPage: flag('full') || w < 600 });
    const { problems, notes } = await page.evaluate(auditInPage);
    console.log(`\n=== ${w}x${h}  ${file}`);
    if (errs.length) { console.log(`  ERRORS (${errs.length}):`); [...new Set(errs)].slice(0, 6).forEach((e) => console.log(`    ${e}`)); totalProblems += errs.length; }
    if (problems.length) { console.log('  PROBLEMS:'); problems.forEach((p) => console.log(`   - ${p}`)); totalProblems += problems.length; }
    else console.log('  PROBLEMS: none found by the automatic checks');
    notes.forEach((n) => console.log(`  note: ${n}`));
    await page.close();
  }
} finally {
  await browser.close();
  if (viteServer) await viteServer.close();
}
console.log(`\nNow OPEN the PNG files above and look at them. Numbers cannot see empty space, a weak focal point, or ugly spacing.`);
process.exit(flag('strict') && totalProblems ? 1 : 0);
