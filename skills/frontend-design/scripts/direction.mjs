#!/usr/bin/env node

// Direction suggestions and project-local choice history.
//
// Read-only:
//   --list
//   --brief "..." [--seed example] [--reroll]
//   --history
//   --check
//
// Writes project-local history:
//   --choose SLUG --why "Reason"
//
// --verify is a compatibility alias for --check.
// No home-directory history is accessed.

import {
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  closeSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG = path.join(HERE, '..', 'reference', 'directions.md');

function parseArgs(args) {
  const options = {
    project: process.cwd(),
    seed: '0',
    why: '',
    json: false,
    strict: false,
    reroll: false,
    action: null,
    value: null,
    legacyVerify: false,
  };

  const seen = new Set();

  function action(name, value = null) {
    if (options.action) {
      throw new Error('Choose exactly one action.');
    }
    options.action = name;
    options.value = value;
  }

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help' || argument === '-h') {
      return { help: true };
    }

    if (seen.has(argument)) {
      throw new Error(`Duplicate option: ${argument}`);
    }
    seen.add(argument);

    if (argument === '--json') {
      options.json = true;
    } else if (argument === '--strict') {
      options.strict = true;
    } else if (argument === '--reroll') {
      options.reroll = true;
    } else if (argument === '--list') {
      action('list');
    } else if (argument === '--history') {
      action('history');
    } else if (argument === '--check' || argument === '--verify') {
      action('check');
      options.legacyVerify = argument === '--verify';
    } else if (
      ['--project', '--seed', '--why', '--brief', '--choose'].includes(argument)
    ) {
      const value = args[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a value.`);
      }
      index += 1;

      if (argument === '--brief') {
        if (!value.trim()) throw new Error('--brief must not be empty.');
        action('suggest', value);
      } else if (argument === '--choose') {
        action('choose', value);
      } else {
        options[argument.slice(2)] = value;
      }
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.action) {
    throw new Error('Choose --list, --brief, --choose, --history, or --check.');
  }

  if (options.reroll && options.action !== 'suggest') {
    throw new Error('--reroll requires --brief.');
  }

  if (seen.has('--seed') && options.action !== 'suggest') {
    throw new Error('--seed requires --brief.');
  }

  if (seen.has('--why') && options.action !== 'choose') {
    throw new Error('--why requires --choose.');
  }

  if (options.action === 'choose' && !options.why.trim()) {
    throw new Error('--choose requires a nonempty --why explanation.');
  }

  if (options.strict && options.action !== 'check') {
    throw new Error('--strict is supported only with --check or --verify.');
  }

  options.project = path.resolve(options.project);
  return options;
}

function parseCatalog() {
  const text = readFileSync(CATALOG, 'utf8');
  const entries = [];
  const seen = new Set();

  for (const block of text.split(/\r?\n(?=## \d+\. )/)) {
    const heading = /^## (\d+)\. ([a-z][a-z0-9-]*) \((.+)\)/.exec(block);
    if (!heading) continue;

    const field = (label) => {
      const pattern = new RegExp(
        `\\*\\*${label}:\\*\\*\\s*([^\\r\\n]*)`,
        'i',
      );
      return pattern.exec(block)?.[1].trim() || '';
    };

    const fits = field('Fits').split(/\*\*Avoid for:\*\*/i)[0].trim();

    if (seen.has(heading[2])) {
      throw new Error(`Duplicate catalog slug: ${heading[2]}`);
    }
    seen.add(heading[2]);

    entries.push({
      number: Number(heading[1]),
      slug: heading[2],
      summary: heading[3],
      fits,
      avoid: field('Avoid for'),
      palette: field('Palette'),
      type: field('Type'),
      layout: field('Layout'),
      assets: field('Assets'),
      signature: field('Signature'),
    });
  }

  if (!entries.length) {
    throw new Error('No directions could be parsed from the catalog.');
  }

  return entries;
}

function projectPaths(project) {
  if (!existsSync(project) || !lstatSync(project).isDirectory()) {
    throw new Error(`Project directory not found: ${project}`);
  }

  // Canonicalize the supplied root. Managed history paths below must not
  // themselves be symlinks.
  const root = realpathSync(project);
  const directory = path.join(root, '.newlook');
  const history = path.join(directory, 'history.json');

  for (const candidate of [directory, history]) {
    let stat;
    try {
      stat = lstatSync(candidate);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (stat?.isSymbolicLink()) {
      throw new Error(`Refusing history symlink: ${candidate}`);
    }

    if (
      stat &&
      (candidate === directory ? !stat.isDirectory() : !stat.isFile())
    ) {
      throw new Error(`Unexpected history path type: ${candidate}`);
    }
  }

  return { root, directory, history };
}

function readHistory(file) {
  if (!existsSync(file)) return { schema: 1, runs: [] };

  const parsed = JSON.parse(readFileSync(file, 'utf8'));

  if (
    !parsed ||
    (parsed.schema !== undefined && parsed.schema !== 1) ||
    !Array.isArray(parsed.runs) ||
    !parsed.runs.every(
      (run) =>
        run &&
        typeof run.direction === 'string' &&
        /^[a-z][a-z0-9-]*$/.test(run.direction) &&
        typeof run.date === 'string' &&
        (run.why === undefined || typeof run.why === 'string'),
    )
  ) {
    throw new Error('Invalid or unsupported project history.');
  }

  // Legacy histories without a schema are accepted. Unknown fields in
  // existing entries are retained when a new choice is appended.
  return { schema: 1, runs: parsed.runs };
}

function recordChoice(paths, slug, why) {
  mkdirSync(paths.directory, { recursive: true });

  const lock = path.join(paths.directory, 'direction.lock');
  let descriptor;

  try {
    descriptor = openSync(lock, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(
        'Direction history is locked. Another choice may be recording. ' +
        'If a previous process crashed, inspect direction.lock before removing it.',
      );
    }
    throw error;
  }

  const temporary = path.join(
    paths.directory,
    `history-${randomUUID()}.tmp`,
  );

  try {
    writeFileSync(descriptor, `${process.pid}\n`);

    // Read under the lock to avoid losing another cooperating writer's update.
    const history = readHistory(paths.history);
    history.runs.push({
      date: new Date().toISOString(),
      direction: slug,
      why,
    });

    writeFileSync(
      temporary,
      `${JSON.stringify(history, null, 2)}\n`,
      { flag: 'wx' },
    );

    renameSync(temporary, paths.history);
    return history;
  } finally {
    try {
      if (existsSync(temporary)) unlinkSync(temporary);
    } finally {
      closeSync(descriptor);
      unlinkSync(lock);
    }
  }
}

const STOP = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'users',
  'user', 'app', 'website', 'page', 'should', 'feel',
]);

function words(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

const RELATED = {
  dashboard: ['monitoring', 'operations', 'control'],
  developer: ['code', 'api', 'devops', 'tools'],
  shop: ['commerce', 'shops', 'marketplaces'],
  store: ['commerce', 'shops'],
  portfolio: ['portfolios', 'photography', 'galleries'],
  finance: ['banking', 'audit', 'records'],
  health: ['wellness', 'health'],
  docs: ['documentation', 'research'],
  government: ['services', 'forms', 'civic'],
  game: ['games', 'playful', 'youth'],
};

function suggestions(catalog, brief, seed, history, reroll) {
  const wanted = new Set(words(brief));

  for (const word of [...wanted]) {
    for (const [key, related] of Object.entries(RELATED)) {
      if (word.startsWith(key)) {
        related.forEach((item) => wanted.add(item));
      }
    }
  }

  const recent = history.runs.slice(-3).map((run) => run.direction);

  const ranked = catalog.map((direction) => {
    const fits = words(direction.fits);
    const avoid = words(direction.avoid);
    let matchScore = 0;

    for (const word of wanted) {
      const matches = (candidate) =>
        word === candidate ||
        word.startsWith(candidate) ||
        candidate.startsWith(word);

      if (fits.some(matches)) matchScore += 3;
      if (avoid.some(matches)) matchScore -= 4;
    }

    const repetitionPenalty = recent.includes(direction.slug) ? 2 : 0;
    const tie = createHash('sha256')
      .update(`${seed}\0${brief}\0${direction.slug}`)
      .digest('hex');

    return {
      ...direction,
      matchScore,
      repetitionPenalty,
      rankScore: matchScore - repetitionPenalty,
      tie,
    };
  }).sort(
    (left, right) =>
      right.rankScore - left.rankScore ||
      left.tie.localeCompare(right.tie),
  );

  const initial = ranked.slice(0, 3);
  const pool = reroll
    ? ranked.filter(
        (entry) => !initial.some((first) => first.slug === entry.slug),
      )
    : ranked;

  return pool.slice(0, 3).map(({ tie, ...entry }) => entry);
}

function normalizeHex(value) {
  const digits = value.slice(1).toLowerCase();

  return digits.length === 3
    ? `#${[...digits].map((digit) => digit + digit).join('')}`
    : `#${digits}`;
}

function sourceCheck(root, direction) {
  const files = [];
  const notices = [];
  const skip = new Set([
    'node_modules', 'dist', 'build', 'coverage', 'shots', 'newlook',
  ]);

  function walk(directory) {
    for (const name of readdirSync(directory).sort()) {
      if (name.startsWith('.') || skip.has(name)) continue;

      const full = path.join(directory, name);
      const stat = lstatSync(full);

      if (stat.isSymbolicLink()) {
        notices.push(`Skipped symlink: ${path.relative(root, full)}`);
      } else if (stat.isDirectory()) {
        walk(full);
      } else if (
        stat.isFile() &&
        /\.(?:css|scss|html|jsx|tsx|vue|svelte|mjs|cjs|js|ts)$/i.test(name)
      ) {
        if (stat.size > 1_500_000) {
          notices.push(`Skipped oversized source: ${path.relative(root, full)}`);
        } else {
          files.push(full);
        }
      }
    }
  }

  walk(root);

  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');
  const expectedColors = [
    ...new Set(
      [...direction.palette.matchAll(/#[a-f0-9]{6}\b|#[a-f0-9]{3}\b/gi)]
        .map((match) => normalizeHex(match[0])),
    ),
  ];

  const sourceColors = new Set(
    [...source.matchAll(/#[a-f0-9]{6}\b|#[a-f0-9]{3}\b/gi)]
      .map((match) => normalizeHex(match[0])),
  );

  const packages = [
    ...new Set(
      [...direction.type.matchAll(
        /@fontsource(?:-variable)?\/[a-z0-9-]+/g,
      )].map((match) => match[0]),
    ),
  ];

  let declared = {};
  const manifest = path.join(root, 'package.json');

  if (existsSync(manifest)) {
    const parsed = JSON.parse(readFileSync(manifest, 'utf8'));
    declared = {
      ...parsed.dependencies,
      ...parsed.devDependencies,
    };
  }

  const fonts = packages.map((name) => ({
    package: name,
    declaredInRootManifest: Object.hasOwn(declared, name),
    packageTextFoundInSource: source.includes(name),
  }));

  const matchedColors = expectedColors.filter(
    (color) => sourceColors.has(color),
  );

  const warnings = [];

  if (!files.length) warnings.push('No supported source files scanned.');

  if (expectedColors.length && !matchedColors.length) {
    warnings.push(
      'No catalog hex colors found in source text. Adaptation, other color ' +
      'notations, or generated styles may explain this.',
    );
  }

  for (const font of fonts) {
    if (!font.declaredInRootManifest || !font.packageTextFoundInSource) {
      warnings.push(
        `Incomplete package-based source evidence for ${font.package}. ` +
        'Local fonts, workspaces, or another delivery strategy may be valid.',
      );
    }
  }

  if (notices.length) warnings.push('Some paths were skipped.');

  return {
    status: 'source-evidence-only',
    filesScanned: files.length,
    expectedColors,
    matchedColors,
    fonts,
    warnings,
    notices,
    limitations: [
      'Source text can include comments, fixtures, unused code, and selectors.',
      'Package declaration is not proof that a dependency is installed.',
      'Package text is not proof of an import or rendered font use.',
      'Hex matches are not proof that colors are visible.',
      'Only the root package manifest is inspected.',
      'Generated styles, other color notations, and dynamic code may be missed.',
      'Layout, accessibility, visual quality, and originality were not evaluated.',
    ],
  };
}

function printHelp() {
  console.log(`
Direction helper

Read-only actions:
  --list
  --brief "Audience, purpose, and desired character"
  --history
  --check

Writing action:
  --choose SLUG --why "Reason for this direction"
  --choose custom --why "Description and rationale"

Options:
  --project DIR    Existing project directory; default current directory
  --seed TEXT      Reproducible suggestion tie-breaker; default 0
  --reroll         Exclude the initial three suggestions for this brief/seed
  --json           Structured output
  --strict         Exit 1 for source-check warnings
  --verify         Compatibility alias for --check
  --help

Only --choose writes .newlook/history.json.
No home-directory history is read or written.
Existing legacy last-deal and global history files are left untouched.

Exit codes:
  0  Action completed; advisory warnings may remain
  1  Source-check warnings failed --strict policy
  2  Invalid arguments, input, lock, or operational failure
`);
}

function printResult(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Action: ${result.action}`);

  if (result.aliasNotice) console.log(result.aliasNotice);

  if (result.directions) {
    for (const direction of result.directions) {
      console.log(`\n${direction.slug}: ${direction.summary}`);
      console.log(`  Fits: ${direction.fits}`);
      console.log(`  Avoid: ${direction.avoid}`);

      if (direction.matchScore !== undefined) {
        console.log(
          `  Keyword score: ${direction.matchScore}; ` +
          `recent-use penalty: ${direction.repetitionPenalty}`,
        );
        console.log(`  Palette: ${direction.palette}`);
        console.log(`  Type: ${direction.type}`);
        console.log(`  Layout: ${direction.layout}`);
      }
    }
  }

  if (result.runs) {
    for (const run of result.runs) {
      console.log(`${run.date}  ${run.direction}  ${run.why || ''}`);
    }
  }

  if (result.chosen) {
    console.log(`Recorded: ${result.chosen}`);
    console.log('Document concrete design decisions in the brief.');
  }

  if (result.evidence) {
    console.log(JSON.stringify(result.evidence, null, 2));
  }

  for (const note of result.notes || []) console.log(`Note: ${note}`);
}

let options;

try {
  options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
  } else {
    const catalog = parseCatalog();
    let result = {
      schema: 1,
      tool: 'newlook-direction',
      action: options.action,
    };

    if (options.action === 'list') {
      result.directions = catalog;
    } else {
      const paths = projectPaths(options.project);

      if (options.action === 'choose') {
        if (
          options.value !== 'custom' &&
          !catalog.some((entry) => entry.slug === options.value)
        ) {
          throw new Error(`Unknown direction: ${options.value}`);
        }

        recordChoice(paths, options.value, options.why.trim());
        result.chosen = options.value;
        result.historyFile = paths.history;
      } else {
        const history = readHistory(paths.history);

        if (options.action === 'history') {
          result.runs = history.runs;
        } else if (options.action === 'suggest') {
          result.directions = suggestions(
            catalog,
            options.value,
            options.seed,
            history,
            options.reroll,
          );
          result.seed = options.seed;
          result.notes = [
            'Keyword ranking is guidance, not a design-quality score.',
            'Suggestions did not write history or a last-deal file.',
            'A custom or adapted direction remains valid.',
          ];

          if (result.directions.every((entry) => entry.matchScore < 3)) {
            result.notes.push(
              'Weak keyword matches. Review the catalog or define a custom direction.',
            );
          }
        } else {
          const last = history.runs.at(-1);

          if (!last) {
            throw new Error('No recorded choice. Use --choose with --why first.');
          }

          const direction = catalog.find(
            (entry) => entry.slug === last.direction,
          );

          if (!direction) {
            result.evidence = {
              status: 'not-applicable',
              warnings: [],
              reason:
                'The recorded direction is custom or no longer in the catalog. ' +
                'Review it against the project brief.',
            };
          } else {
            result.evidence = sourceCheck(paths.root, direction);
          }

          if (options.legacyVerify) {
            result.aliasNotice =
              '--verify is an alias for source checking, not visual verification.';
          }
        }
      }
    }

    printResult(result, options.json);

    process.exitCode =
      options.strict && result.evidence?.warnings.length ? 1 : 0;
  }
} catch (error) {
  const failure = {
    schema: 1,
    tool: 'newlook-direction',
    operationalError: error.message,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(failure, null, 2));
  } else {
    console.error(`Direction helper failed: ${error.message}`);
  }

  process.exitCode = 2;
}
