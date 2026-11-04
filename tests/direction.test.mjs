import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
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

const SCRIPT = path.join(
  REPO,
  'skills/frontend-design/scripts/direction.mjs',
);

function fixture(t) {
  const root = mkdtempSync(
    path.join(realpathSync(tmpdir()), 'newlook direction test '),
  );

  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function run(project, args, extraEnv = {}) {
  const result = spawnSync(
    process.execPath,
    [SCRIPT, '--project', project, '--json', ...args],
    {
      cwd: REPO,
      encoding: 'utf8',
      timeout: 15_000,
      env: { ...process.env, ...extraEnv },
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

function successful(result) {
  assert.equal(result.status, 0, JSON.stringify(result.report));
  return result.report;
}

function historyPath(root) {
  return path.join(root, '.newlook', 'history.json');
}

function putHistory(root, contents) {
  mkdirSync(path.join(root, '.newlook'), { recursive: true });
  writeFileSync(historyPath(root), contents);
}

function catalog(root) {
  return successful(run(root, ['--list'])).directions;
}

test('catalog lists unique directions without project writes', (t) => {
  const root = fixture(t);
  const entries = catalog(root);

  assert.ok(entries.length >= 3);
  assert.equal(
    new Set(entries.map((entry) => entry.slug)).size,
    entries.length,
  );
  assert.deepEqual(readdirSync(root), []);
});

test('suggestions are reproducible and read-only', (t) => {
  const root = fixture(t);
  const args = [
    '--brief', 'Developer dashboard for monitoring operations',
    '--seed', 'reproducible-example',
  ];

  const first = successful(run(root, args));
  const second = successful(run(root, args));

  assert.deepEqual(first, second);
  assert.equal(first.directions.length, 3);
  assert.deepEqual(readdirSync(root), []);
});

test('reroll excludes the initial suggestions', (t) => {
  const root = fixture(t);
  const entries = catalog(root);
  assert.ok(entries.length >= 6, 'Test needs at least six directions');

  const args = ['--brief', 'Product interface', '--seed', 'example'];
  const first = successful(run(root, args)).directions;
  const second = successful(run(root, [...args, '--reroll'])).directions;

  assert.equal(second.length, 3);
  assert.ok(
    second.every(
      (entry) => !first.some((initial) => initial.slug === entry.slug),
    ),
  );
  assert.deepEqual(readdirSync(root), []);
});

test('choose records project-local history without home-directory writes', (t) => {
  const root = fixture(t);
  const fakeHome = fixture(t);
  const slug = catalog(root)[0].slug;

  successful(run(
    root,
    ['--choose', slug, '--why', 'Fits the audience and task'],
    { HOME: fakeHome, USERPROFILE: fakeHome },
  ));

  const history = JSON.parse(readFileSync(historyPath(root), 'utf8'));

  assert.equal(history.schema, 1);
  assert.equal(history.runs.length, 1);
  assert.equal(history.runs[0].direction, slug);
  assert.deepEqual(readdirSync(fakeHome), []);
  assert.deepEqual(readdirSync(path.join(root, '.newlook')), ['history.json']);
});

test('custom choices are supported and source checking is not applicable', (t) => {
  const root = fixture(t);

  successful(run(root, [
    '--choose', 'custom',
    '--why', 'Use the established brand and a task-specific hierarchy',
  ]));

  const checked = successful(run(root, ['--check', '--strict']));
  assert.equal(checked.evidence.status, 'not-applicable');
});

test('choice requires a reason and rejects unknown slugs without writes', (t) => {
  const root = fixture(t);

  assert.equal(run(root, ['--choose', 'custom']).status, 2);

  assert.equal(run(root, [
    '--choose', 'not-in-the-catalog',
    '--why', 'Example',
  ]).status, 2);

  assert.deepEqual(readdirSync(root), []);
});

test('invalid history is preserved rather than silently reset', (t) => {
  const root = fixture(t);
  const corrupt = '{"runs":"not-an-array"}';
  putHistory(root, corrupt);

  const result = run(root, [
    '--choose', 'custom',
    '--why', 'Example',
  ]);

  assert.equal(result.status, 2);
  assert.match(result.report.operationalError, /Invalid or unsupported/);
  assert.equal(readFileSync(historyPath(root), 'utf8'), corrupt);
  assert.equal(existsSync(path.join(root, '.newlook/direction.lock')), false);
});

test('legacy history entries survive an appended choice', (t) => {
  const root = fixture(t);
  const old = {
    date: '2026-01-01',
    direction: 'custom',
    why: 'Original',
    fingerprint: { fonts: ['legacy'] },
  };

  putHistory(root, JSON.stringify({ runs: [old] }));

  successful(run(root, [
    '--choose', 'custom',
    '--why', 'Updated design decisions',
  ]));

  const history = JSON.parse(readFileSync(historyPath(root), 'utf8'));
  assert.deepEqual(history.runs[0], old);
  assert.equal(history.runs.length, 2);
});

test('an existing lock blocks recording without replacing history', (t) => {
  const root = fixture(t);
  putHistory(root, '{"schema":1,"runs":[]}');

  const lock = path.join(root, '.newlook', 'direction.lock');
  writeFileSync(lock, 'another process');

  const before = readFileSync(historyPath(root), 'utf8');
  const result = run(root, [
    '--choose', 'custom',
    '--why', 'Example',
  ]);

  assert.equal(result.status, 2);
  assert.match(result.report.operationalError, /locked/);
  assert.equal(readFileSync(historyPath(root), 'utf8'), before);
  assert.equal(readFileSync(lock, 'utf8'), 'another process');
});

test('source check and verify alias do not mutate history', (t) => {
  const root = fixture(t);
  const slug = catalog(root)[0].slug;

  successful(run(root, ['--choose', slug, '--why', 'Example']));

  const before = readFileSync(historyPath(root), 'utf8');
  const checked = successful(run(root, ['--check']));
  const alias = successful(run(root, ['--verify']));

  assert.equal(checked.evidence.status, 'source-evidence-only');
  assert.ok(checked.evidence.warnings.length > 0);
  assert.match(alias.aliasNotice, /not visual verification/);
  assert.equal(readFileSync(historyPath(root), 'utf8'), before);
  assert.equal(run(root, ['--check', '--strict']).status, 1);
});

test('source check reports matching hex text without claiming rendered use', (t) => {
  const root = fixture(t);

  const direction = catalog(root).find(
    (entry) => /#[a-f0-9]{3,6}\b/i.test(entry.palette),
  );

  assert.ok(direction, 'Expected a catalog direction containing hex colors');

  successful(run(root, [
    '--choose', direction.slug,
    '--why', 'Example',
  ]));

  writeFileSync(
    path.join(root, 'style.css'),
    `/* Catalog palette text: ${direction.palette} */\n`,
  );

  const report = successful(run(root, ['--check']));

  assert.ok(report.evidence.matchedColors.length > 0);
  assert.ok(
    report.evidence.limitations.some(
      (limitation) => limitation.includes('not proof that colors are visible'),
    ),
  );
});

test('history is read-only and empty history does not create files', (t) => {
  const root = fixture(t);

  const report = successful(run(root, ['--history']));
  assert.deepEqual(report.runs, []);
  assert.deepEqual(readdirSync(root), []);
});

test('invalid argument combinations fail explicitly', (t) => {
  const root = fixture(t);

  for (const args of [
    [],
    ['--list', '--history'],
    ['--list', '--reroll'],
    ['--history', '--seed', 'example'],
    ['--list', '--strict'],
    ['--unknown'],
    ['--brief', ''],
  ]) {
    assert.equal(run(root, args).status, 2, JSON.stringify(args));
  }
});

test('checking without a recorded choice fails without writes', (t) => {
  const root = fixture(t);

  const result = run(root, ['--check']);

  assert.equal(result.status, 2);
  assert.match(result.report.operationalError, /No recorded choice/);
  assert.deepEqual(readdirSync(root), []);
});
