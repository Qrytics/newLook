#!/usr/bin/env node

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const MANIFEST = '.newlook-install.json';
const START = '<!-- newlook:start -->';
const END = '<!-- newlook:end -->';

const SKILLS = [
  'frontend-design',
  'hallmark',
  'interface-design',
  'typography',
];

function fail(message) {
  throw new Error(message);
}

function hash(content) {
  return createHash('sha256').update(content).digest('hex');
}

function inside(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return (
    relative === '' ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== '..' &&
      !path.isAbsolute(relative))
  );
}

function toPortable(relative) {
  return relative.split(path.sep).join('/');
}

function help() {
  console.log(`
newLook installer

Use Node.js 22 or newer.

Choose exactly one target:
  --project PATH   Install project workflow and managed AGENTS.md section
  --dir PATH       Install all four skills in an explicit skills directory
  --claude         Install skills in ~/.claude/skills
  --codex          Install skills in ~/.agents/skills
  --opencode       Install skills in ~/.config/opencode/skills

Options:
  --dry-run        Validate and preview without writing files
  --force          Replace conflicting files after backing them up
  --help           Show this help

Examples:
  node scripts/install.mjs --project "../my-app" --dry-run
  node scripts/install.mjs --claude --dry-run

The installer does not delete directories, remove obsolete files, or uninstall.
Installation paths do not establish compatibility with every agent version.
`);
}

function parseArgs(args) {
  const options = {
    target: null,
    mode: null,
    dryRun: false,
    force: false,
  };

  function target(mode, directory) {
    if (options.target !== null) {
      fail('Choose exactly one installation target.');
    }
    options.mode = mode;
    options.target = path.resolve(directory);
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help' || argument === '-h') {
      return { help: true };
    }

    if (argument === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (argument === '--force') {
      options.force = true;
      continue;
    }

    if (argument === '--project' || argument === '--dir') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        fail(`${argument} requires a path.`);
      }

      index += 1;
      target(argument === '--project' ? 'project' : 'skills', value);
      continue;
    }

    if (argument === '--claude') {
      target('skills', path.join(homedir(), '.claude', 'skills'));
      continue;
    }

    if (argument === '--codex') {
      target('skills', path.join(homedir(), '.agents', 'skills'));
      continue;
    }

    if (argument === '--opencode') {
      target(
        'skills',
        path.join(homedir(), '.config', 'opencode', 'skills'),
      );
      continue;
    }

    fail(`Unknown argument: ${argument}`);
  }

  if (!options.target) {
    fail('No target selected. Run with --help for installation options.');
  }

  return options;
}

/*
 * Refuse symlinks in the destination path and its existing ancestors.
 * This is intentionally conservative: use a real path instead.
 *
 * This is not protection against another process changing paths concurrently.
 */
function assertSafePath(candidate) {
  let current = path.resolve(candidate);

  while (true) {
    let stat;
    try {
      stat = lstatSync(current);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (stat?.isSymbolicLink()) {
      fail(`Refusing a symlink path: ${current}`);
    }

    if (current === path.resolve(candidate)) {
      if (stat && !stat.isFile() && !stat.isDirectory()) {
        fail(`Unsupported destination type: ${current}`);
      }
    } else if (stat && !stat.isDirectory()) {
      fail(`An ancestor is not a directory: ${current}`);
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
}

function requireDirectory(directory) {
  assertSafePath(directory);

  if (!existsSync(directory) || !lstatSync(directory).isDirectory()) {
    fail(`Directory not found: ${directory}`);
  }
}

function readManifest(root) {
  const file = path.join(root, MANIFEST);
  assertSafePath(file);

  if (!existsSync(file)) {
    return { schema: 1, files: {} };
  }

  if (!lstatSync(file).isFile()) {
    fail(`Manifest is not a regular file: ${file}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    fail(`Invalid installation manifest: ${file}`);
  }

  if (
    parsed.schema !== 1 ||
    !parsed.files ||
    typeof parsed.files !== 'object' ||
    Array.isArray(parsed.files)
  ) {
    fail(`Unsupported installation manifest: ${file}`);
  }

  for (const value of Object.values(parsed.files)) {
    if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
      fail(`Invalid file hash in manifest: ${file}`);
    }
  }

  return parsed;
}

function buildPlan(options) {
  const plan = new Map();

  function add(relative, content) {
    const destination = path.resolve(options.target, relative);

    if (
      !inside(options.target, destination) ||
      destination === options.target
    ) {
      fail(`Invalid managed path: ${relative}`);
    }

    if (plan.has(relative)) {
      fail(`Duplicate managed path: ${relative}`);
    }

    plan.set(relative, Buffer.from(content));
  }

  function copyFile(sourceRelative, destinationRelative) {
    const source = path.join(REPO, sourceRelative);

    if (
      !existsSync(source) ||
      !lstatSync(source).isFile() ||
      lstatSync(source).isSymbolicLink()
    ) {
      fail(`Required source file missing or unsafe: ${sourceRelative}`);
    }

    add(destinationRelative, readFileSync(source));
  }

  function copyTree(sourceRelative, destinationRelative) {
    const source = path.join(REPO, sourceRelative);

    if (
      !existsSync(source) ||
      lstatSync(source).isSymbolicLink() ||
      !lstatSync(source).isDirectory()
    ) {
      fail(`Required source directory missing or unsafe: ${sourceRelative}`);
    }

    for (const name of readdirSync(source).sort()) {
      const sourceChild = path.join(sourceRelative, name);
      const destinationChild = path.join(destinationRelative, name);
      const stat = lstatSync(path.join(REPO, sourceChild));

      if (stat.isSymbolicLink()) {
        fail(`Refusing source symlink: ${sourceChild}`);
      }

      if (stat.isDirectory()) {
        copyTree(sourceChild, destinationChild);
      } else if (stat.isFile()) {
        copyFile(sourceChild, destinationChild);
      } else {
        fail(`Unsupported source file: ${sourceChild}`);
      }
    }
  }

  // Both routes need the canonical workflow.
  const canonical = path.join(
    REPO,
    'skills/frontend-design/reference/workflow.md',
  );
  if (!existsSync(canonical)) {
    fail('Canonical workflow is missing. Complete the documentation patch first.');
  }

  if (options.mode === 'skills') {
    for (const skill of SKILLS) {
      copyTree(path.join('skills', skill), skill);
    }

    copyFile('NOTICE.md', 'NEWLOOK-NOTICE.md');
    copyFile('LICENSE', 'NEWLOOK-LICENSE');
    return plan;
  }

  copyFile(
    'templates/frontend-design-workflow.md',
    'docs/frontend-design-workflow.md',
  );
  copyTree(
    'skills/frontend-design/scripts',
    'docs/newlook/scripts',
  );
  copyTree(
    'skills/frontend-design/reference',
    'docs/newlook/reference',
  );
  copyTree(
    'skills/hallmark/scripts',
    'docs/newlook/hallmark/scripts',
  );
  copyFile(
    'skills/hallmark/LICENSE',
    'docs/newlook/hallmark/LICENSE',
  );
  copyFile('NOTICE.md', 'docs/newlook/NOTICE.md');
  copyFile('LICENSE', 'docs/newlook/LICENSE');

  const agentsFile = path.join(options.target, 'AGENTS.md');
  assertSafePath(agentsFile);

  if (existsSync(agentsFile) && !lstatSync(agentsFile).isFile()) {
    fail('AGENTS.md is not a regular file.');
  }

  const original = existsSync(agentsFile)
    ? readFileSync(agentsFile, 'utf8')
    : '';

  const template = readFileSync(
    path.join(REPO, 'templates/AGENTS-section.md'),
    'utf8',
  ).trim();

  if (template.includes(START) || template.includes(END)) {
    fail('The AGENTS template must not contain installer markers.');
  }

  const startCount = original.split(START).length - 1;
  const endCount = original.split(END).length - 1;
  const section = `${START}\n${template}\n${END}`;

  let updated;

  if (startCount === 0 && endCount === 0) {
    if (/^##\s+newLook frontend workflow\b/im.test(original)) {
      fail(
        'Legacy unmarked newLook section found in AGENTS.md. ' +
        'Surround only that section with ' + START + ' and ' + END +
        ', then preview again. No files were changed.',
      );
    }

    const separator = original
      ? original.endsWith('\n\n')
        ? ''
        : original.endsWith('\n')
          ? '\n'
          : '\n\n'
      : '';

    updated = `${original}${separator}${section}\n`;
  } else {
    const start = original.indexOf(START);
    const end = original.indexOf(END);

    if (startCount !== 1 || endCount !== 1 || end < start) {
      fail('Malformed or duplicate newLook markers in AGENTS.md.');
    }

    updated =
      original.slice(0, start) +
      section +
      original.slice(end + END.length);
  }

  add('AGENTS.md', updated);
  return plan;
}

function atomicWrite(file, content) {
  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.newlook-${randomUUID()}.tmp`;

  try {
    writeFileSync(temporary, content, { flag: 'wx' });
    renameSync(temporary, file);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function install(options) {
  assertSafePath(options.target);

  if (existsSync(options.target) && !lstatSync(options.target).isDirectory()) {
    fail('Installation target must be a directory.');
  }

  // Avoid copying the repository into itself or overwriting its source.
  if (inside(REPO, options.target) || inside(options.target, REPO)) {
    fail('Choose an installation target outside the newLook checkout and its ancestors.');
  }

  if (options.mode === 'project') {
    requireDirectory(options.target);
  }

  const manifest = readManifest(options.target);

  if (manifest.mode && manifest.mode !== options.mode) {
    fail('This destination already contains a different installation mode.');
  }

  const plan = buildPlan(options);
  const changes = [];
  const conflicts = [];
  const nextFiles = { ...manifest.files };

  for (const [relative, content] of plan) {
    const destination = path.join(options.target, relative);
    const key = toPortable(relative);
    const desiredHash = hash(content);

    assertSafePath(destination);

    let current = null;

    if (existsSync(destination)) {
      if (!lstatSync(destination).isFile()) {
        fail(`Managed destination is not a regular file: ${relative}`);
      }
      current = readFileSync(destination);
    }

    let status = 'create';

    if (current !== null) {
      const currentHash = hash(current);

      if (currentHash === desiredHash) {
        status = 'unchanged';
      } else if (relative === 'AGENTS.md') {
        /*
         * Only the marked section changes. Preserve surrounding instructions.
         * Detect local changes inside the managed section separately.
         */
        const text = current.toString('utf8');
        const start = text.indexOf(START);
        const end = text.indexOf(END);
        const section = start >= 0 && end >= start
          ? text.slice(start, end + END.length)
          : null;

        if (section === null) {
          // A new section is being appended; unrelated content is preserved.
          status = 'update';
        } else if (
          manifest.agentsSectionHash &&
          hash(section) === manifest.agentsSectionHash
        ) {
          status = 'update';
        } else {
          status = 'conflict';
        }
      } else if (manifest.files[key] === currentHash) {
        status = 'update';
      } else {
        status = 'conflict';
      }
    }

    if (status === 'conflict') {
      conflicts.push({ relative, destination, current });
    }

    if (status !== 'unchanged') {
      changes.push({ relative, destination, content, status });
    }

    nextFiles[key] = desiredHash;
  }

  const stale = Object.keys(manifest.files).filter(
    (key) => ![...plan.keys()].some((relative) => toPortable(relative) === key),
  );

  console.log(`Target: ${options.target}`);
  console.log(`Mode: ${options.mode}`);

  for (const change of changes) {
    console.log(`  ${change.status}: ${toPortable(change.relative)}`);
  }

  if (!changes.length) {
    console.log('  Managed file contents are already current.');
  }

  for (const key of stale) {
    console.log(`  retained: ${key} (not removed automatically)`);
  }

  if (conflicts.length && !options.force) {
    fail(
      `${conflicts.length} conflicting file(s). Nothing was written. ` +
      'Review them, then use --force only if replacement is intended.',
    );
  }

  if (options.dryRun) {
    console.log('Dry run complete. No files were written.');
    return;
  }

  /*
   * Back up all conflicts before replacing any managed file.
   * These backups may contain private project instructions.
   */
  if (conflicts.length) {
    const backupRoot = path.join(
      options.target,
      '.newlook-installer-backups',
      `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`,
    );

    for (const conflict of conflicts) {
      const backup = path.join(backupRoot, conflict.relative);
      assertSafePath(backup);
      atomicWrite(backup, conflict.current);
    }

    console.log(`Conflict backups: ${backupRoot}`);
    console.log('Review backup contents before committing or sharing them.');
  }

  for (const change of changes) {
    assertSafePath(change.destination);
    atomicWrite(change.destination, change.content);
  }

  let agentsSectionHash;

  if (options.mode === 'project') {
    const text = plan.get('AGENTS.md').toString('utf8');
    const start = text.indexOf(START);
    const end = text.indexOf(END);
    agentsSectionHash = hash(text.slice(start, end + END.length));
  }

  const nextManifest = {
    schema: 1,
    mode: options.mode,
    installedAt: new Date().toISOString(),
    files: nextFiles,
    ...(agentsSectionHash ? { agentsSectionHash } : {}),
  };

  atomicWrite(
    path.join(options.target, MANIFEST),
    `${JSON.stringify(nextManifest, null, 2)}\n`,
  );

  console.log('Installation complete.');
  console.log('No obsolete files were deleted.');
}

try {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) fail('This installer requires Node.js 22 or newer.');

  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    help();
  } else {
    install(options);
  }
} catch (error) {
  console.error(`newLook install failed: ${error.message}`);
  console.error(
    'If an I/O error occurred during writing, some files may have been updated. ' +
    'Resolve the error and rerun; this is not a transaction across all files.',
  );
  process.exitCode = 1;
}
