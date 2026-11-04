import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const SCANNER = path.join(
  REPO,
  'skills/frontend-design/scripts/dom-contract.mjs',
);

function fixture(t) {
  const root = mkdtempSync(
    path.join(realpathSync(tmpdir()), 'newlook dom test '),
  );

  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function put(root, relative, content) {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
}

function scan(root, ...args) {
  const result = spawnSync(
    process.execPath,
    [SCANNER, root, '--json', ...args],
    {
      cwd: REPO,
      encoding: 'utf8',
      timeout: 15_000,
    },
  );

  assert.equal(result.error, undefined, String(result.error));
  assert.notEqual(result.status, null, result.stderr);

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    assert.fail(
      `Expected JSON.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`,
    );
  }

  return { status: result.status, report };
}

function hasFinding(report, code, name) {
  return report.findings.some(
    (finding) =>
      finding.code === code &&
      (name === undefined || finding.name === name),
  );
}

test('single and double quoted ID contracts are recognized', (t) => {
  const root = fixture(t);

  put(root, 'index.html', '<div id="first"></div><div id=\'second\'></div>');
  put(
    root,
    'app.js',
    `
      document.getElementById('first');
      document.getElementById("second");
    `,
  );

  const { status, report } = scan(root);

  assert.equal(status, 0);
  assert.equal(report.summary.errors, 0);
  assert.equal(report.snapshot.idReferences.length, 2);
});

test('missing ID produces an error-level finding and exit 1', (t) => {
  const root = fixture(t);
  put(root, 'app.js', "document.getElementById('missing');");

  const { status, report } = scan(root);

  assert.equal(status, 1);
  assert.ok(hasFinding(report, 'ID_DEFINITION_NOT_FOUND', 'missing'));
});

test('unstyled behavioral class warns without failing by default', (t) => {
  const root = fixture(t);
  put(root, 'app.js', "panel.classList.toggle('is-ready', ready);");

  const normal = scan(root);
  assert.equal(normal.status, 0);
  assert.ok(
    hasFinding(normal.report, 'STATE_STYLE_NOT_FOUND', 'is-ready'),
  );

  const strict = scan(root, '--strict');
  assert.equal(strict.status, 1);
});

test('inline styles and both classList.replace names are recognized', (t) => {
  const root = fixture(t);

  put(
    root,
    'index.html',
    `
      <style>
        .idle { color: black; }
        .active { color: red; }
      </style>
      <script>
        panel.classList.replace('idle', "active");
      </script>
    `,
  );

  const { status, report } = scan(root);

  assert.equal(status, 0);
  assert.deepEqual(report.snapshot.styledClasses, ['active', 'idle']);
  assert.equal(report.summary.warnings, 0);
});

test('selector extraction ignores hash characters in attribute values', (t) => {
  const root = fixture(t);

  put(root, 'index.html', '<button id="go"></button>');
  put(
    root,
    'app.js',
    `
      page.locator('#go');
      document.querySelector('[href="#external"]');
    `,
  );

  const { status, report } = scan(root);

  assert.equal(status, 0);
  assert.deepEqual(
    report.snapshot.idReferences.map((item) => item.name),
    ['go'],
  );
});

test('baseline comparison detects removal even if the reference is removed', (t) => {
  const root = fixture(t);
  const baseline = path.join(root, '.newlook', 'before.json');

  put(root, 'index.html', '<div id="readout"></div>');
  put(root, 'app.js', "document.getElementById('readout');");

  assert.equal(scan(root, '--save', baseline).status, 0);
  assert.equal(existsSync(baseline), true);

  put(root, 'index.html', '<div></div>');
  put(root, 'app.js', '');

  const { status, report } = scan(root, '--compare', baseline);

  assert.equal(status, 1);
  assert.ok(hasFinding(report, 'BASELINE_ID_REMOVED', 'readout'));
});

test('baseline comparison detects removed state styles', (t) => {
  const root = fixture(t);
  const baseline = path.join(root, '.newlook', 'before.json');

  put(root, 'app.js', "panel.classList.add('armed');");
  put(root, 'style.css', '.armed { color: red; }');

  assert.equal(scan(root, '--save', baseline).status, 0);

  put(root, 'style.css', '');

  const { status, report } = scan(root, '--compare', baseline);

  assert.equal(status, 1);
  assert.ok(
    hasFinding(report, 'BASELINE_STATE_STYLE_REMOVED', 'armed'),
  );
});

test('existing missing IDs are not mislabeled as removed baseline IDs', (t) => {
  const root = fixture(t);
  const baseline = path.join(root, '.newlook', 'before.json');

  put(root, 'app.js', "document.getElementById('already-missing');");

  // Saving preserves observations even when findings produce exit 1.
  assert.equal(scan(root, '--save', baseline).status, 1);

  const { status, report } = scan(root, '--compare', baseline);

  assert.equal(status, 1);
  assert.ok(
    hasFinding(report, 'ID_DEFINITION_NOT_FOUND', 'already-missing'),
  );
  assert.equal(
    hasFinding(report, 'BASELINE_ID_REMOVED', 'already-missing'),
    false,
  );
});

test('baseline save refuses to overwrite an existing file', (t) => {
  const root = fixture(t);
  const baseline = path.join(root, 'before.json');

  put(root, 'app.js', '');
  writeFileSync(baseline, 'preserve this');

  const { status, report } = scan(root, '--save', baseline);

  assert.equal(status, 2);
  assert.match(report.operationalError, /already exists/);
  assert.equal(readFileSync(baseline, 'utf8'), 'preserve this');
});

test('invalid baseline fails with exit 2', (t) => {
  const root = fixture(t);
  const baseline = put(root, 'before.json', '{"schema":999}');

  const { status, report } = scan(root, '--compare', baseline);

  assert.equal(status, 2);
  assert.match(report.operationalError, /Invalid or unsupported/);
});

test('dynamic IDs are reported as unresolved instead of invented', (t) => {
  const root = fixture(t);
  put(root, 'app.js', 'document.getElementById(variableName);');

  const { status, report } = scan(root);

  assert.equal(status, 0);
  assert.ok(hasFinding(report, 'DYNAMIC_EXPRESSIONS'));
  assert.equal(report.snapshot.idReferences.length, 0);
});

test('dependency directories are excluded', (t) => {
  const root = fixture(t);

  put(root, 'app.js', '');
  put(
    root,
    'node_modules/package/index.js',
    "document.getElementById('dependency-only');",
  );

  const { status, report } = scan(root);

  assert.equal(status, 0);
  assert.equal(report.filesScanned, 1);
  assert.equal(report.snapshot.idReferences.length, 0);
});

test('empty scans warn and fail only under strict policy', (t) => {
  const root = fixture(t);

  const normal = scan(root);
  assert.equal(normal.status, 0);
  assert.ok(hasFinding(normal.report, 'NO_SOURCE_FILES'));

  assert.equal(scan(root, '--strict').status, 1);
});

test('unknown flags fail with exit 2', (t) => {
  const root = fixture(t);

  const { status, report } = scan(root, '--unknown');

  assert.equal(status, 2);
  assert.match(report.operationalError, /Unknown option/);
});

test('symlink directories are skipped instead of followed', (t) => {
  const root = fixture(t);
  const outside = fixture(t);

  put(root, 'app.js', '');
  put(
    outside,
    'outside.js',
    "document.getElementById('outside-only');",
  );

  try {
    symlinkSync(
      outside,
      path.join(root, 'linked-source'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      t.skip('Creating symlinks is not permitted in this environment.');
      return;
    }
    throw error;
  }

  const { status, report } = scan(root);

  assert.equal(status, 0);
  assert.equal(report.filesScanned, 1);
  assert.ok(hasFinding(report, 'INCOMPLETE_SCAN'));
  assert.match(report.notices.join('\n'), /Skipped symlink/);
});
