import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
} from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseArgs,
  exitCode,
  loadChromium,
} from '../skills/frontend-design/scripts/look.mjs';

const execute = promisify(execFile);

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const SCRIPT = path.join(
  REPO,
  'skills/frontend-design/scripts/look.mjs',
);

function fixture(t) {
  const root = mkdtempSync(
    path.join(realpathSync(tmpdir()), 'newlook look test '),
  );
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

async function cli(args) {
  try {
    const result = await execute(
      process.execPath,
      [SCRIPT, ...args],
      { cwd: REPO, timeout: 60_000 },
    );

    return { code: 0, ...result };
  } catch (error) {
    if (typeof error.code !== 'number') throw error;

    return {
      code: error.code,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
}

test('valid options receive consistent defaults', () => {
  const options = parseArgs(['--url', 'http://localhost:5173']);

  assert.equal(options.url, 'http://localhost:5173/');
  assert.deepEqual(options.sizes, [
    [1600, 1000],
    [390, 844],
  ]);
  assert.equal(options.axe, false);
  assert.equal(options.timeout, 15_000);
});

test('custom viewports and waits are parsed', () => {
  const options = parseArgs([
    '--url', 'https://example.com',
    '--sizes', '1200x800,400x900',
    '--settle', '0',
    '--timeout', '1000',
    '--wait', '#ready',
  ]);

  assert.deepEqual(options.sizes, [
    [1200, 800],
    [400, 900],
  ]);
  assert.equal(options.settle, 0);
  assert.equal(options.wait, '#ready');
});

test('missing URL and missing option values are rejected', () => {
  assert.throws(() => parseArgs([]), /Supply --url/);
  assert.throws(() => parseArgs(['--url']), /requires a value/);
});

test('unsupported URL schemes and embedded credentials are rejected', () => {
  assert.throws(
    () => parseArgs(['--url', 'file:///tmp/page.html']),
    /Only HTTP/,
  );

  assert.throws(
    () => parseArgs(['--url', 'https://user:secret@example.com']),
    /credentials/,
  );
});

test('unsafe tags are rejected', () => {
  assert.throws(
    () => parseArgs([
      '--url', 'http://localhost',
      '--tag', '../escape',
    ]),
    /--tag/,
  );
});

test('invalid or duplicate sizes are rejected', () => {
  for (const sizes of [
    'large',
    '0x1000',
    '9000x800',
    '800x600,800x600',
  ]) {
    assert.throws(() => parseArgs([
      '--url', 'http://localhost',
      '--sizes', sizes,
    ]));
  }
});

test('invalid timeouts and unknown arguments are rejected', () => {
  assert.throws(
    () => parseArgs([
      '--url', 'http://localhost',
      '--timeout', '-1',
    ]),
    /--timeout/,
  );

  assert.throws(
    () => parseArgs([
      '--url', 'http://localhost',
      '--mystery',
    ]),
    /Unknown option/,
  );
});

test('legacy server-starting options fail explicitly', () => {
  assert.throws(
    () => parseArgs(['--serve', './app']),
    /no longer supported/,
  );
});

test('strict policy differs from collection success', () => {
  const report = {
    operationalErrors: [],
    views: [{
      findings: [{ severity: 'warning' }],
      accessibility: { incomplete: [] },
    }],
  };

  assert.equal(exitCode(report, false), 0);
  assert.equal(exitCode(report, true), 1);

  report.operationalErrors.push({ message: 'Navigation failed' });
  assert.equal(exitCode(report, true), 2);
});

test('incomplete accessibility checks fail strict review', () => {
  const report = {
    operationalErrors: [],
    views: [{
      findings: [],
      accessibility: { incomplete: [{ id: 'color-contrast' }] },
    }],
  };

  assert.equal(exitCode(report, false), 0);
  assert.equal(exitCode(report, true), 1);
});

test('CLI argument errors produce structured JSON and exit 2', async () => {
  const result = await cli(['--json', '--unknown']);

  assert.equal(result.code, 2);
  const report = JSON.parse(result.stdout);
  assert.match(report.operationalErrors[0].message, /Unknown option/);
});

test('real browser captures a fixture and reports runtime/design findings', async (t) => {
  let chromium;

  try {
    chromium = await loadChromium(REPO);
  } catch {
    t.skip('Playwright is not available; browser coverage was not run.');
    return;
  }

  // Confirm an actual browser can launch before claiming browser coverage.
  let probe;

  try {
    probe = await chromium.launch({
      executablePath: process.env.CHROME_PATH || undefined,
      timeout: 10_000,
    });
  } catch (error) {
    t.skip(`Chromium is unavailable: ${error.message}`);
    return;
  } finally {
    if (probe) await probe.close();
  }

  const root = fixture(t);

  const server = createServer((request, response) => {
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(`
      <!doctype html>
      <html lang="en">
        <head>
          <title>newLook test fixture</title>
          <style>
            body { margin: 0; }
            #small { font-size: 9px; }
            #wide { width: 1200px; height: 20px; }
          </style>
        </head>
        <body>
          <h1>Fixture</h1>
          <p id="small">Small text</p>
          <div id="wide"></div>
          <script>
            console.error('intentional fixture error');
          </script>
        </body>
      </html>
    `);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const screenshot = path.join(root, 'fixture-400x800.png');

    const common = [
      '--url', url,
      '--project', REPO,
      '--sizes', '400x800',
      '--out', root,
      '--tag', 'fixture',
      '--settle', '0',
      '--json',
    ];

    const first = await cli([...common, '--strict']);

    assert.equal(first.code, 1, first.stderr || first.stdout);

    const report = JSON.parse(first.stdout);
    assert.equal(report.operationalErrors.length, 0);
    assert.equal(report.views[0].screenshot, screenshot);
    assert.equal(existsSync(screenshot), true);

    // Verify that the file has a PNG signature.
    assert.deepEqual(
      [...readFileSync(screenshot).subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
    );

    const codes = report.views[0].findings.map((item) => item.code);
    assert.ok(codes.includes('SMALL_TEXT'));
    assert.ok(codes.includes('HORIZONTAL_OVERFLOW'));
    assert.ok(codes.includes('CONSOLE_ERROR'));
    assert.equal(report.views[0].accessibility.status, 'not-run');

    // Existing screenshots must not be overwritten silently.
    const second = await cli(common);
    assert.equal(second.code, 2);
    assert.match(
      JSON.parse(second.stdout).operationalErrors[0].message,
      /Output already exists/,
    );

    // Missing readiness selector must produce an operational failure.
    const missing = await cli([
      ...common,
      '--overwrite',
      '--wait', '#does-not-exist',
      '--timeout', '500',
    ]);

    assert.equal(missing.code, 2);
    assert.ok(
      JSON.parse(missing.stdout).operationalErrors.length > 0,
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('axe integration reports accessibility violations and saves JSON', async (t) => {
  // Unlike the optional browser smoke test, this test must fail if its
  // required dependencies or browser are unavailable.
  const root = fixture(t);

  const server = createServer((request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
    });

    response.end(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Accessibility integration fixture</title>
          <style>
            body {
              margin: 24px;
              background: #ffffff;
              color: #111111;
              font: 16px Arial, sans-serif;
            }

            button {
              width: 120px;
              height: 44px;
            }

            #low-contrast {
              color: #eeeeee;
              background: #ffffff;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <main>
            <h1>Accessibility fixture</h1>
            <button id="unnamed" type="button"></button>
            <p id="low-contrast">This text has insufficient contrast.</p>
          </main>
        </body>
      </html>
    `);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const url = `http://127.0.0.1:${server.address().port}/`;
    const reportFile = path.join(root, 'accessibility-report.json');

    const result = await cli([
      '--url', url,
      '--project', REPO,
      '--sizes', '800x600',
      '--out', root,
      '--tag', 'accessibility',
      '--settle', '0',
      '--axe',
      '--strict',
      '--json',
      '--report', reportFile,
    ]);

    assert.equal(result.code, 1, result.stderr || result.stdout);

    const report = JSON.parse(result.stdout);

    assert.deepEqual(report.operationalErrors, []);
    assert.equal(report.views.length, 1);
    assert.equal(
      report.visualInspection,
      'not-performed-by-this-tool',
    );

    const view = report.views[0];

    assert.equal(view.accessibility.status, 'completed');
    assert.ok(Array.isArray(view.accessibility.incomplete));
    assert.ok(view.accessibility.passes > 0);

    const violations = view.accessibility.violations.map(
      (violation) => violation.id,
    );

    assert.ok(
      violations.includes('button-name'),
      `Expected button-name; received: ${violations.join(', ')}`,
    );

    assert.ok(
      violations.includes('color-contrast'),
      `Expected color-contrast; received: ${violations.join(', ')}`,
    );

    assert.ok(
      view.findings.some(
        (finding) =>
          finding.code === 'AXE_button-name' &&
          finding.category === 'accessibility' &&
          finding.severity === 'error',
      ),
    );

    assert.ok(
      view.findings.some(
        (finding) => finding.code === 'AXE_color-contrast',
      ),
    );

    assert.ok(view.screenshot);
    assert.equal(existsSync(view.screenshot), true);
    assert.equal(existsSync(reportFile), true);

    const saved = JSON.parse(readFileSync(reportFile, 'utf8'));
    assert.deepEqual(saved, report);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
