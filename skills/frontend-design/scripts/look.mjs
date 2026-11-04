#!/usr/bin/env node

import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function parseArgs(args) {
  const options = {
    url: null,
    project: process.cwd(),
    sizes: [
      [1600, 1000],
      [390, 844],
    ],
    out: path.resolve('shots'),
    tag: 'look',
    wait: 'body',
    settle: 300,
    timeout: 15_000,
    full: false,
    strict: false,
    json: false,
    axe: false,
    overwrite: false,
    report: null,
  };

  const switches = new Set([
    'full',
    'strict',
    'json',
    'axe',
    'overwrite',
  ]);

  const values = new Set([
    'url',
    'project',
    'sizes',
    'out',
    'tag',
    'wait',
    'settle',
    'timeout',
    'report',
  ]);

  const seen = new Set();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help' || argument === '-h') {
      return { help: true };
    }

    if (argument === '--serve' || argument === '--path') {
      throw new Error(
        `${argument} is no longer supported. Start the application's ` +
        'normal server yourself and supply its full URL with --url.',
      );
    }

    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`);
    }

    const name = argument.slice(2);

    if (seen.has(name)) {
      throw new Error(`Duplicate option: ${argument}`);
    }
    seen.add(name);

    if (switches.has(name)) {
      options[name] = true;
      continue;
    }

    if (!values.has(name)) {
      throw new Error(`Unknown option: ${argument}`);
    }

    const value = args[index + 1];

    if (!value || value.startsWith('--')) {
      throw new Error(`${argument} requires a value.`);
    }

    options[name] = value;
    index += 1;
  }

  if (!options.url) {
    throw new Error('Supply --url with an already-running application URL.');
  }

  const url = new URL(options.url);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }

  if (url.username || url.password) {
    throw new Error('Do not embed credentials in the application URL.');
  }

  options.url = url.href;
  options.project = path.resolve(options.project);
  options.out = path.resolve(options.out);

  if (options.report) {
    options.report = path.resolve(options.report);
  }

  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(options.tag)) {
    throw new Error(
      '--tag must contain 1–80 letters, digits, underscores, or hyphens, ' +
      'starting with a letter or digit.',
    );
  }

  if (typeof options.sizes === 'string') {
    options.sizes = options.sizes.split(',').map((entry) => {
      const match = /^(\d+)x(\d+)$/.exec(entry);

      if (!match) {
        throw new Error('--sizes must look like 1600x1000,390x844.');
      }

      return [Number(match[1]), Number(match[2])];
    });
  }

  if (
    options.sizes.length > 8 ||
    options.sizes.some(
      ([width, height]) =>
        width < 100 ||
        height < 100 ||
        width > 4096 ||
        height > 4096,
    )
  ) {
    throw new Error('Use 1–8 viewports with dimensions from 100 to 4096.');
  }

  const distinct = new Set(
    options.sizes.map(([width, height]) => `${width}x${height}`),
  );

  if (distinct.size !== options.sizes.length) {
    throw new Error('Duplicate viewport sizes are not allowed.');
  }

  for (const [name, minimum, maximum] of [
    ['settle', 0, 30_000],
    ['timeout', 100, 120_000],
  ]) {
    const value = Number(options[name]);

    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      throw new Error(
        `--${name} must be an integer from ${minimum} to ${maximum}.`,
      );
    }

    options[name] = value;
  }

  return options;
}

export function resolveDependency(name, project) {
  for (const base of [project, HERE]) {
    try {
      const require = createRequire(
        path.join(path.resolve(base), '__newlook_resolve__.cjs'),
      );
      return require.resolve(name);
    } catch {
      // Try the next location.
    }
  }

  return null;
}

export async function loadChromium(project) {
  for (const name of [
    'playwright',
    '@playwright/test',
    'playwright-core',
  ]) {
    const entry = resolveDependency(name, project);

    if (!entry) continue;

    const imported = await import(pathToFileURL(entry).href);
    const chromium = imported.chromium || imported.default?.chromium;

    if (chromium) return chromium;
  }

  throw new Error(
    'Playwright not found. Use --project to identify a project with ' +
    'playwright, @playwright/test, or playwright-core installed. ' +
    'Install dependencies only when authorized.',
  );
}

// Executes inside the browser. Intentionally limited to layout/design hints.
// axe-core, when requested, handles supplementary accessibility checks.
export function auditInPage() {
  const findings = [];
  const fontSizes = new Set();
  const fontFamilies = new Set();

  function label(element) {
    return (
      element.tagName.toLowerCase() +
      (element.id ? `#${element.id}` : '')
    );
  }

  function visible(element) {
    const bounds = element.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return false;

    for (
      let current = element;
      current;
      current = current.parentElement
    ) {
      const style = getComputedStyle(current);

      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse' ||
        Number(style.opacity) === 0
      ) {
        return false;
      }
    }

    return true;
  }

  function add(code, message, element, details = {}) {
    findings.push({
      code,
      severity: 'warning',
      category: 'heuristic',
      message,
      element: element ? label(element) : null,
      ...details,
    });
  }

  for (const element of document.querySelectorAll('body *')) {
    if (
      ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(
        element.tagName,
      ) ||
      !visible(element)
    ) {
      continue;
    }

    const ownsText = [...element.childNodes].some(
      (node) =>
        node.nodeType === Node.TEXT_NODE &&
        node.textContent.trim().length > 0,
    );

    if (!ownsText) continue;

    const style = getComputedStyle(element);
    const size = Number.parseFloat(style.fontSize);

    fontSizes.add(size);
    fontFamilies.add(style.fontFamily);

    if (size < 12) {
      add(
        'SMALL_TEXT',
        'Text below the newLook 12px design default; review readability.',
        element,
        { size },
      );
    }
  }

  if (document.documentElement.scrollWidth > innerWidth + 1) {
    add(
      'HORIZONTAL_OVERFLOW',
      'Page exceeds viewport width; determine whether overflow is intentional.',
      null,
      {
        viewportWidth: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
      },
    );
  }

  for (const element of document.querySelectorAll(
    'button, a[href], input:not([type="hidden"]), select, textarea, ' +
    '[role="button"], summary',
  )) {
    if (!visible(element)) continue;

    const bounds = element.getBoundingClientRect();

    if (bounds.width < 32 || bounds.height < 32) {
      add(
        'SMALL_TARGET',
        'Small interactive target; review input method, spacing, and exceptions. ' +
        'This threshold is not a complete WCAG target-size rule.',
        element,
        {
          width: Math.round(bounds.width),
          height: Math.round(bounds.height),
        },
      );
    }
  }

  const canvasCount = [...document.querySelectorAll('canvas')]
    .filter(visible).length;

  return {
    findings,
    measurements: {
      fontSizes: [...fontSizes].sort((left, right) => left - right),
      // These are computed declarations, not proof of actual glyph font usage.
      fontFamilies: [...fontFamilies].sort(),
      visibleCanvases: canvasCount,
    },
  };
}

export function exitCode(report, strict) {
  if (report.operationalErrors.length) return 2;

  if (
    strict &&
    report.views.some(
      (view) =>
        view.findings.length > 0 ||
        (view.accessibility?.incomplete.length ?? 0) > 0,
    )
  ) {
    return 1;
  }

  return 0;
}

export async function runLook(options) {
  const report = {
    schema: 1,
    tool: 'newlook-look',
    url: options.url,
    startedAt: new Date().toISOString(),
    views: [],
    operationalErrors: [],
    visualInspection: 'not-performed-by-this-tool',
    limitations: [
      'Screenshots must be opened and inspected separately.',
      'Heuristic findings are review signals, not compliance verdicts.',
      'Computed font-family declarations do not establish actual glyph font usage.',
      'Canvas content, shadow DOM, and iframe coverage require separate review.',
      'Only the requested URL and its initial state are inspected.',
      'No authentication setup or interaction sequence is performed.',
      'Accessibility automation does not establish complete compliance.',
    ],
  };

  let browser;

  try {
    const files = options.sizes.map(([width, height]) =>
      path.join(options.out, `${options.tag}-${width}x${height}.png`),
    );

    if (options.report && files.includes(options.report)) {
      throw new Error('The JSON report path cannot be a screenshot path.');
    }

    for (const file of [
      ...files,
      ...(options.report ? [options.report] : []),
    ]) {
      if (!options.overwrite && existsSync(file)) {
        throw new Error(
          `Output already exists: ${file}. Choose another tag/path, ` +
          'or explicitly use --overwrite.',
        );
      }
    }

    let axeSource = null;

    if (options.axe) {
      const axeEntry = resolveDependency('axe-core/axe.min.js', options.project);

      if (!axeEntry) {
        throw new Error(
          '--axe requested, but axe-core was not found. ' +
          'Install it in the selected project only when authorized.',
        );
      }

      axeSource = readFileSync(axeEntry, 'utf8');
    }

    const chromium = await loadChromium(options.project);

    browser = await chromium.launch({
      executablePath: process.env.CHROME_PATH || undefined,
      timeout: options.timeout,
    });

    mkdirSync(options.out, { recursive: true });

    for (let index = 0; index < options.sizes.length; index += 1) {
      const [width, height] = options.sizes[index];
      const view = {
        viewport: { width, height },
        screenshot: null,
        findings: [],
        measurements: null,
        accessibility: {
          status: options.axe ? 'pending' : 'not-run',
          violations: [],
          incomplete: [],
          passes: 0,
        },
      };

      report.views.push(view);

      let context;

      try {
        context = await browser.newContext({
          viewport: { width, height },
        });

        const page = await context.newPage();
        page.setDefaultTimeout(options.timeout);
        page.setDefaultNavigationTimeout(options.timeout);

        function runtimeFinding(code, message) {
          // Cap log collection to avoid unbounded application error loops.
          if (view.findings.length >= 200) return;

          view.findings.push({
            code,
            severity: 'error',
            category: 'runtime',
            message: String(message).slice(0, 1000),
          });
        }

        page.on('pageerror', (error) => {
          runtimeFinding('PAGE_ERROR', error.message);
        });

        page.on('console', (message) => {
          if (message.type() === 'error') {
            runtimeFinding('CONSOLE_ERROR', message.text());
          }
        });

        const response = await page.goto(options.url, {
          waitUntil: 'load',
        });

        if (response && response.status() >= 400) {
          runtimeFinding(
            'HTTP_ERROR',
            `Navigation returned HTTP ${response.status()}.`,
          );
        }

        await page.waitForSelector(options.wait, {
          state: 'visible',
        });

        await page.waitForFunction(
          () => !document.fonts || document.fonts.status === 'loaded',
          null,
          { timeout: options.timeout },
        );

        if (options.settle) {
          await page.waitForTimeout(options.settle);
        }

        const audit = await page.evaluate(auditInPage);
        view.findings.push(...audit.findings);
        view.measurements = audit.measurements;

        if (axeSource) {
          await page.addScriptTag({ content: axeSource });

          const accessibility = await page.evaluate(async () => {
            const result = await window.axe.run(document, {
              resultTypes: ['violations', 'incomplete', 'passes'],
            });

            function simplify(rule) {
              return {
                id: rule.id,
                impact: rule.impact,
                description: rule.description,
                help: rule.help,
                helpUrl: rule.helpUrl,
                nodes: rule.nodes.map((node) => ({
                  target: node.target,
                  failureSummary: node.failureSummary,
                })),
              };
            }

            return {
              status: 'completed',
              violations: result.violations.map(simplify),
              incomplete: result.incomplete.map(simplify),
              passes: result.passes.length,
            };
          });

          view.accessibility = accessibility;

          for (const violation of accessibility.violations) {
            view.findings.push({
              code: `AXE_${violation.id}`,
              severity: 'error',
              category: 'accessibility',
              message: violation.help,
              impact: violation.impact,
              helpUrl: violation.helpUrl,
            });
          }
        }

        await page.screenshot({
          path: files[index],
          fullPage: options.full || width < 600,
          timeout: options.timeout,
        });

        view.screenshot = files[index];
      } catch (error) {
        report.operationalErrors.push({
          viewport: { width, height },
          message: error.message,
        });
      } finally {
        if (context) {
          try {
            await context.close();
          } catch (error) {
            report.operationalErrors.push({
              message: `Context cleanup failed: ${error.message}`,
            });
          }
        }
      }
    }
  } catch (error) {
    report.operationalErrors.push({ message: error.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        report.operationalErrors.push({
          message: `Browser cleanup failed: ${error.message}`,
        });
      }
    }
  }

  return report;
}

function printHelp() {
  console.log(`
look.mjs: screenshots, layout hints, and optional axe-core checks

Usage:
  node look.mjs --url http://127.0.0.1:5173/ [options]

Options:
  --project DIR    Dependency lookup directory; default current directory
  --sizes LIST     Default 1600x1000,390x844
  --out DIR        Screenshot directory; default shots
  --tag NAME       Screenshot prefix; default look
  --wait SELECTOR  Wait for a visible element; default body
  --settle MS      Additional wait; default 300
  --timeout MS     Per-operation timeout; default 15000
  --full           Full-page capture at all sizes
  --axe            Run locally installed axe-core
  --json           Print a JSON report
  --report FILE    Also save the JSON report
  --strict         Exit 1 for findings or incomplete axe checks
  --overwrite      Permit replacement of existing output files
  --help           Show help

Exit codes:
  0  Collection completed; findings may exist without --strict
  1  Strict policy found issues requiring review
  2  Argument, dependency, navigation, capture, or other operational failure

Start your application separately. --serve and --path are unsupported.
No dependencies are installed automatically.
Screenshot capture is not visual inspection.
`);
}

function printHuman(report) {
  for (const view of report.views) {
    console.log(
      `\n${view.viewport.width}x${view.viewport.height}`,
    );
    console.log(`Screenshot: ${view.screenshot || 'not captured'}`);
    console.log(`Accessibility: ${view.accessibility.status}`);

    for (const finding of view.findings) {
      console.log(
        `  ${finding.severity.toUpperCase()} ${finding.code}: ` +
        finding.message,
      );
    }

    if (view.accessibility.incomplete.length) {
      console.log(
        `  Axe checks needing review: ${view.accessibility.incomplete.length}`,
      );
    }
  }

  for (const error of report.operationalErrors) {
    console.error(`Operational failure: ${error.message}`);
  }

  console.log(
    '\nOpen the screenshots for visual review. This tool did not inspect them.',
  );
  console.log(
    'Reports can include application URLs, selectors, and error text. ' +
    'Review artifacts before sharing.',
  );
}

async function main() {
  let options;
  let report;

  try {
    options = parseArgs(process.argv.slice(2));

    if (options.help) {
      printHelp();
      return;
    }

    report = await runLook(options);

    if (options.report) {
      /*
       * Do not overwrite reports on a failed preflight unless explicitly
       * allowed. A report destination may have appeared after preflight.
       */
      if (options.overwrite || !existsSync(options.report)) {
        try {
          mkdirSync(path.dirname(options.report), { recursive: true });
          writeFileSync(
            options.report,
            `${JSON.stringify(report, null, 2)}\n`,
            { flag: options.overwrite ? 'w' : 'wx' },
          );
        } catch (error) {
          report.operationalErrors.push({
            message: `Report save failed: ${error.message}`,
          });
        }
      }
    }

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printHuman(report);
    }

    process.exitCode = exitCode(report, options.strict);
  } catch (error) {
    const failure = {
      schema: 1,
      tool: 'newlook-look',
      operationalErrors: [{ message: error.message }],
    };

    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(failure, null, 2));
    } else {
      console.error(`look.mjs failed: ${error.message}`);
    }

    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
