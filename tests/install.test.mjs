import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
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

const INSTALLER = path.join(REPO, 'scripts', 'install.mjs');

function run(args) {
  return spawnSync(process.execPath, [INSTALLER, ...args], {
    cwd: REPO,
    encoding: 'utf8',
    timeout: 30_000,
  });
}

function output(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

function successful(result) {
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, output(result));
}

function failed(result) {
  assert.equal(result.error, undefined, String(result.error));
  assert.notEqual(result.status, 0, output(result));
}

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'newlook installer '));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function findFiles(directory) {
  if (!existsSync(directory)) return [];

  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...findFiles(full));
    else files.push(full);
  }

  return files;
}

test('requires an explicit installation target', () => {
  const result = run([]);
  failed(result);
  assert.match(output(result), /No target selected/);
});

test('dry-run creates neither files nor target directory', (t) => {
  const root = fixture(t);
  const target = path.join(root, 'skills with spaces');

  successful(run(['--dir', target, '--dry-run']));

  assert.equal(existsSync(target), false);
});

test('project installation preserves unrelated AGENTS instructions', (t) => {
  const root = fixture(t);
  const agents = path.join(root, 'AGENTS.md');
  const original = '# Project instructions\n\nKeep the backend unchanged.\n';

  writeFileSync(agents, original);

  successful(run(['--project', root]));

  const text = readFileSync(agents, 'utf8');
  assert.ok(text.startsWith(original));
  assert.match(text, /<!-- newlook:start -->/);
  assert.match(text, /<!-- newlook:end -->/);

  assert.equal(
    existsSync(path.join(root, 'docs/newlook/reference/workflow.md')),
    true,
  );
  assert.equal(
    existsSync(path.join(root, 'docs/newlook/LICENSE')),
    true,
  );
  assert.equal(
    existsSync(path.join(root, '.newlook-install.json')),
    true,
  );

  // Reinstalling must not duplicate the managed section.
  successful(run(['--project', root]));

  const updated = readFileSync(agents, 'utf8');
  assert.equal(updated.split('<!-- newlook:start -->').length - 1, 1);
});

test('local helper changes block all planned writes without force', (t) => {
  const root = fixture(t);
  successful(run(['--project', root]));

  const helper = path.join(root, 'docs/newlook/scripts/look.mjs');
  const manifest = path.join(root, '.newlook-install.json');

  writeFileSync(helper, '// local modification\n');
  const beforeManifest = readFileSync(manifest, 'utf8');

  const result = run(['--project', root]);
  failed(result);

  assert.match(output(result), /conflicting file/);
  assert.equal(readFileSync(helper, 'utf8'), '// local modification\n');
  assert.equal(readFileSync(manifest, 'utf8'), beforeManifest);
});

test('force backs up conflicting files before replacement', (t) => {
  const root = fixture(t);
  successful(run(['--project', root]));

  const helper = path.join(root, 'docs/newlook/scripts/look.mjs');
  const local = '// preserve this local modification\n';
  writeFileSync(helper, local);

  successful(run(['--project', root, '--force']));

  assert.notEqual(readFileSync(helper, 'utf8'), local);

  const backups = findFiles(
    path.join(root, '.newlook-installer-backups'),
  );

  assert.ok(
    backups.some((file) => readFileSync(file, 'utf8') === local),
    'Expected the local file contents in a backup',
  );
});

test('legacy AGENTS section requires explicit migration', (t) => {
  const root = fixture(t);
  const agents = path.join(root, 'AGENTS.md');
  const original =
    '# Project\n\n## newLook frontend workflow\n\nOld instructions.\n';

  writeFileSync(agents, original);

  const result = run(['--project', root]);
  failed(result);

  assert.match(output(result), /Legacy unmarked/);
  assert.equal(readFileSync(agents, 'utf8'), original);
  assert.equal(existsSync(path.join(root, 'docs')), false);
});

test('malformed markers block installation without writes', (t) => {
  const root = fixture(t);
  writeFileSync(
    path.join(root, 'AGENTS.md'),
    '# Project\n<!-- newlook:start -->\nIncomplete section\n',
  );

  const result = run(['--project', root]);
  failed(result);

  assert.match(output(result), /Malformed or duplicate/);
  assert.equal(existsSync(path.join(root, 'docs')), false);
});

test('changed managed AGENTS section requires force', (t) => {
  const root = fixture(t);
  successful(run(['--project', root]));

  const agents = path.join(root, 'AGENTS.md');
  const text = readFileSync(agents, 'utf8').replace(
    '<!-- newlook:start -->',
    '<!-- newlook:start -->\nLocal section modification.',
  );
  writeFileSync(agents, text);

  failed(run(['--project', root]));
  assert.equal(readFileSync(agents, 'utf8'), text);

  successful(run(['--project', root, '--force']));
  assert.doesNotMatch(readFileSync(agents, 'utf8'), /Local section modification/);
});

test('custom skills installation includes all four skills', (t) => {
  const root = fixture(t);
  const target = path.join(root, 'agent skills');

  successful(run(['--dir', target]));

  for (const skill of [
    'frontend-design',
    'hallmark',
    'interface-design',
    'typography',
  ]) {
    assert.equal(
      existsSync(path.join(target, skill, 'SKILL.md')),
      true,
      `Missing ${skill}`,
    );
  }

  assert.equal(existsSync(path.join(target, 'NEWLOOK-NOTICE.md')), true);
});

test('multiple targets are rejected', (t) => {
  const root = fixture(t);
  mkdirSync(path.join(root, 'app'));

  const result = run([
    '--project',
    path.join(root, 'app'),
    '--dir',
    path.join(root, 'skills'),
  ]);

  failed(result);
  assert.match(output(result), /exactly one/);
  assert.equal(existsSync(path.join(root, 'skills')), false);
});
