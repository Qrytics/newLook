#!/usr/bin/env node

// Static DOM contract hints, not runtime verification.
//
// Examples:
//   node dom-contract.mjs ./app
//   node dom-contract.mjs ./app --json
//   node dom-contract.mjs ./app --save .newlook/dom-before.json
//   node dom-contract.mjs ./app --compare .newlook/dom-before.json
//
// Exit codes:
//   0: no error-level findings; warnings may exist
//   1: error-level findings, or warnings when --strict is used
//   2: invalid arguments, unreadable inputs, or operational failure
//
// --save creates a new baseline and refuses to overwrite an existing file.
// Baselines contain relative source paths and selector names, not source text.

import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const SKIP = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'venv',
  '__pycache__',
  'shots',
  'newlook',
]);

const SOURCE_EXTENSION =
  /\.(?:mjs|cjs|js|jsx|ts|tsx|html|css|scss|vue|svelte)$/i;

const CODE_EXTENSION =
  /\.(?:mjs|cjs|js|jsx|ts|tsx|html|vue|svelte)$/i;

const MAX_BYTES = 2_000_000;
const NAME = /^[A-Za-z_][A-Za-z0-9_-]*$/;

// Deliberately limited: simple quoted literals, without escapes or interpolation.
const LITERAL =
  /^(["'`])([A-Za-z_][A-Za-z0-9_-]*)\1$/;

function help() {
  console.log(`
DOM contract scanner

Usage:
  node dom-contract.mjs [PROJECT_DIR] [options]

Options:
  --json           Print one JSON report instead of human-readable output
  --strict         Exit 1 for warnings as well as errors
  --save FILE      Save a new baseline; never overwrite an existing file
  --compare FILE   Compare against a previously saved baseline
  --help           Show this help

Relative baseline paths resolve from the current working directory.

Exit codes:
  0  No error-level findings; warnings may exist
  1  Findings failed the selected policy
  2  Argument, input, or operational failure

This is a heuristic source scan. It does not parse JavaScript, resolve
routes, execute components, or prove that interactions work.
`);
}

function parseArgs(args) {
  const result = {
    root: null,
    json: false,
    strict: false,
    save: null,
    compare: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const argument = args[i];

    if (argument === '--help' || argument === '-h') {
      return { help: true };
    }

    if (argument === '--json') {
      result.json = true;
      continue;
    }

    if (argument === '--strict') {
      result.strict = true;
      continue;
    }

    if (argument === '--save' || argument === '--compare') {
      const value = args[i + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a file path.`);
      }

      const key = argument.slice(2);
      if (result[key]) {
        throw new Error(`${argument} was supplied more than once.`);
      }

      result[key] = path.resolve(value);
      i += 1;
      continue;
    }

    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    }

    if (result.root !== null) {
      throw new Error('Supply only one project directory.');
    }

    result.root = path.resolve(argument);
  }

  result.root ??= process.cwd();

  if (result.save && result.compare) {
    throw new Error(
      'Use --save or --compare, not both in the same run.',
    );
  }

  if (result.save && existsSync(result.save)) {
    throw new Error(
      'Baseline already exists. Choose a new filename to preserve the original.',
    );
  }

  return result;
}

function portable(relative) {
  return relative.split(path.sep).join('/');
}

function addReference(map, name, file) {
  if (!map.has(name)) map.set(name, new Set());
  map.get(name).add(file);
}

function simpleLiteral(text) {
  return LITERAL.exec(text.trim())?.[2] ?? null;
}

function firstArgument(text) {
  let quote = '';
  let depth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const character = text[i];

    if (quote) {
      if (character === '\\') {
        i += 1;
      } else if (character === quote) {
        quote = '';
      }
      continue;
    }

    if ('"\'`'.includes(character)) {
      quote = character;
    } else if ('([{'.includes(character)) {
      depth += 1;
    } else if (')]}'.includes(character)) {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      return text.slice(0, i);
    }
  }

  return text;
}

function scan(root) {
  const rootStat = lstatSync(root);

  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error('Project root must be a real directory, not a symlink.');
  }

  const files = [];
  const notices = [];

  function walk(directory) {
    for (const entry of readdirSync(directory).sort()) {
      if (entry.startsWith('.') || SKIP.has(entry)) continue;

      const full = path.join(directory, entry);
      const stat = lstatSync(full);
      const relative = portable(path.relative(root, full));

      if (stat.isSymbolicLink()) {
        notices.push(`Skipped symlink: ${relative}`);
        continue;
      }

      if (stat.isDirectory()) {
        walk(full);
      } else if (stat.isFile() && SOURCE_EXTENSION.test(entry)) {
        if (stat.size > MAX_BYTES) {
          notices.push(`Skipped oversized source file: ${relative}`);
        } else {
          files.push({ full, relative });
        }
      }
    }
  }

  walk(root);

  const idDefinitions = new Set();
  const idReferences = new Map();
  const classReferences = new Map();
  const cssParts = [];
  let dynamicCalls = 0;

  for (const file of files) {
    const source = readFileSync(file.full, 'utf8');

    if (/\.(?:css|scss)$/i.test(file.full)) {
      cssParts.push(source);
    }

    if (/\.(?:html|vue|svelte)$/i.test(file.full)) {
      for (const match of source.matchAll(
        /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
      )) {
        cssParts.push(match[1]);
      }
    }

    if (!CODE_EXTENSION.test(file.full)) continue;

    // HTML/JSX attributes, simple object properties, and direct assignments.
    for (const match of source.matchAll(
      /\bid\s*[=:]\s*\{?\s*(["'`])([A-Za-z_][A-Za-z0-9_-]*)\1/g,
    )) {
      idDefinitions.add(match[2]);
    }

    for (const match of source.matchAll(
      /\.id\s*=\s*(["'`])([A-Za-z_][A-Za-z0-9_-]*)\1/g,
    )) {
      idDefinitions.add(match[2]);
    }

    for (const match of source.matchAll(
      /setAttribute\s*\(\s*(["'])id\1\s*,\s*(["'`])([A-Za-z_][A-Za-z0-9_-]*)\2\s*\)/g,
    )) {
      idDefinitions.add(match[3]);
    }

    for (const match of source.matchAll(
      /\bgetElementById\s*\(([^)]*)\)/g,
    )) {
      const name = simpleLiteral(match[1]);

      if (name) {
        addReference(idReferences, name, file.relative);
      } else {
        dynamicCalls += 1;
      }
    }

    for (const match of source.matchAll(
      /(?:\bquerySelector(?:All)?|\blocator|\bwaitForSelector|\bclosest|\bmatches|\$\$?)\s*\(([^)]*)\)/g,
    )) {
      const argument = firstArgument(match[1]).trim();
      const quoted = /^(["'`])([\s\S]*)\1$/.exec(argument);

      if (!quoted || quoted[2].includes('${')) {
        dynamicCalls += 1;
        continue;
      }

      // Attribute selectors can contain # in values; do not treat those as IDs.
      const selector = quoted[2].replace(/\[[^\]]*\]/g, '');

      for (const id of selector.matchAll(
        /#([A-Za-z_][A-Za-z0-9_-]*)/g,
      )) {
        addReference(idReferences, id[1], file.relative);
      }
    }

    for (const match of source.matchAll(
      /\bclassList\.(add|remove|toggle|contains|replace)\s*\(([^)]*)\)/g,
    )) {
      const method = match[1];
      const argumentsText = match[2];

      if (method === 'add' || method === 'remove' || method === 'replace') {
        // Only collect simple comma-separated literals.
        // Expressions are deliberately left unresolved.
        for (const argument of argumentsText.split(',')) {
          const name = simpleLiteral(argument);

          if (name) {
            addReference(classReferences, name, file.relative);
          } else {
            dynamicCalls += 1;
          }
        }
      } else {
        // toggle's second argument is a condition, not a class name.
        const name = simpleLiteral(firstArgument(argumentsText));

        if (name) {
          addReference(classReferences, name, file.relative);
        } else {
          dynamicCalls += 1;
        }
      }
    }
  }

  const css = cssParts.join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
  const styledClasses = new Set();

  for (const name of classReferences.keys()) {
    // Names are restricted to simple identifiers, so escaping "-" is sufficient.
    const escaped = name.replace(/-/g, '\\-');

    if (new RegExp(`\\.${escaped}(?![\\w-])`).test(css)) {
      styledClasses.add(name);
    }
  }

  const references = (map) =>
    [...map]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, locations]) => ({
        name,
        files: [...locations].sort(),
      }));

  return {
    filesScanned: files.length,
    cssDetected: cssParts.length > 0,
    notices,
    dynamicCalls,
    snapshot: {
      schema: 1,
      idDefinitions: [...idDefinitions].sort(),
      idReferences: references(idReferences),
      classReferences: references(classReferences),
      styledClasses: [...styledClasses].sort(),
    },
  };
}

function readBaseline(file) {
  const baseline = JSON.parse(readFileSync(file, 'utf8'));

  function validNames(value) {
    return (
      Array.isArray(value) &&
      value.every((name) => typeof name === 'string' && NAME.test(name))
    );
  }

  function validReferences(value) {
    return (
      Array.isArray(value) &&
      value.every(
        (entry) =>
          entry &&
          typeof entry.name === 'string' &&
          NAME.test(entry.name) &&
          Array.isArray(entry.files) &&
          entry.files.every((file) => typeof file === 'string'),
      )
    );
  }

  if (
    !baseline ||
    baseline.schema !== 1 ||
    !validNames(baseline.idDefinitions) ||
    !validNames(baseline.styledClasses) ||
    !validReferences(baseline.idReferences) ||
    !validReferences(baseline.classReferences)
  ) {
    throw new Error('Invalid or unsupported DOM baseline.');
  }

  return baseline;
}

function makeReport(options, scanned, baseline) {
  const findings = [];

  function finding(code, severity, name, message, files = []) {
    findings.push({ code, severity, name, message, files });
  }

  const current = scanned.snapshot;
  const definitions = new Set(current.idDefinitions);
  const styled = new Set(current.styledClasses);

  for (const reference of current.idReferences) {
    if (!definitions.has(reference.name)) {
      finding(
        'ID_DEFINITION_NOT_FOUND',
        'error',
        reference.name,
        'Referenced ID has no simple static definition in the scanned source. Review for runtime-generated or external markup.',
        reference.files,
      );
    }
  }

  for (const reference of current.classReferences) {
    if (!styled.has(reference.name)) {
      finding(
        'STATE_STYLE_NOT_FOUND',
        'warning',
        reference.name,
        'No matching class style detected. This may be a valid behavioral hook or an unsupported styling pattern.',
        reference.files,
      );
    }
  }

  if (baseline) {
    const oldDefinitions = new Set(baseline.idDefinitions);
    const oldStyled = new Set(baseline.styledClasses);

    for (const reference of baseline.idReferences) {
      if (
        oldDefinitions.has(reference.name) &&
        !definitions.has(reference.name)
      ) {
        finding(
          'BASELINE_ID_REMOVED',
          'error',
          reference.name,
          'A previously referenced and statically defined ID is no longer defined. Confirm preservation or an intentional contract change.',
          reference.files,
        );
      }
    }

    for (const reference of baseline.classReferences) {
      if (
        oldStyled.has(reference.name) &&
        !styled.has(reference.name)
      ) {
        finding(
          'BASELINE_STATE_STYLE_REMOVED',
          'error',
          reference.name,
          'A previously referenced and styled class no longer has a detected style. Confirm preservation or an intentional contract change.',
          reference.files,
        );
      }
    }
  }

  if (!scanned.filesScanned) {
    finding(
      'NO_SOURCE_FILES',
      'warning',
      null,
      'No supported source files were scanned.',
    );
  }

  if (scanned.dynamicCalls) {
    finding(
      'DYNAMIC_EXPRESSIONS',
      'warning',
      null,
      `${scanned.dynamicCalls} expression(s) could not be resolved as simple literals.`,
    );
  }

  if (scanned.notices.length) {
    finding(
      'INCOMPLETE_SCAN',
      'warning',
      null,
      'Some paths were skipped; see notices.',
    );
  }

  const errors = findings.filter((item) => item.severity === 'error').length;
  const warnings = findings.filter(
    (item) => item.severity === 'warning',
  ).length;

  return {
    schema: 1,
    tool: 'newlook-dom-contract',
    root: options.root,
    comparison: options.compare,
    filesScanned: scanned.filesScanned,
    cssDetected: scanned.cssDetected,
    findings,
    notices: scanned.notices,
    summary: { errors, warnings },
    snapshot: current,
    limitations: [
      'Regex-based source hints, not JavaScript or CSS parsing.',
      'Comments and string contents can cause false positives.',
      'Dynamic IDs, generated styles, routes, shadow DOM, and external markup may not be resolved.',
      'Simple class references in CSS text are not proof that a visible style applies.',
      'Hidden directories and conventional build/dependency directories are excluded.',
      'Baseline comparison tracks observed selectors, not application behavior.',
    ],
  };
}

function printReport(report, json) {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log(`DOM source scan: ${report.root}`);
  console.log(`Files scanned: ${report.filesScanned}`);

  for (const item of report.findings) {
    const name = item.name ? ` ${item.name}` : '';
    console.log(`\n${item.severity.toUpperCase()} ${item.code}${name}`);
    console.log(`  ${item.message}`);
    if (item.files.length) console.log(`  ${item.files.join(', ')}`);
  }

  for (const notice of report.notices) {
    console.log(`NOTICE: ${notice}`);
  }

  console.log(
    `\nSummary: ${report.summary.errors} error-level finding(s), ` +
    `${report.summary.warnings} warning(s).`,
  );
  console.log(
    'Static findings require review. Runtime interactions were not tested.',
  );
}

let options;

try {
  options = parseArgs(process.argv.slice(2));

  if (options.help) {
    help();
  } else {
    // Read comparison input before any possible output-file write.
    const baseline = options.compare
      ? readBaseline(options.compare)
      : null;

    const scanned = scan(options.root);
    const report = makeReport(options, scanned, baseline);

    if (options.save) {
      mkdirSync(path.dirname(options.save), { recursive: true });
      writeFileSync(
        options.save,
        `${JSON.stringify(scanned.snapshot, null, 2)}\n`,
        { flag: 'wx' },
      );
      report.baselineSaved = options.save;
    }

    printReport(report, options.json);

    process.exitCode =
      report.summary.errors > 0 ||
      (options.strict && report.summary.warnings > 0)
        ? 1
        : 0;
  }
} catch (error) {
  if (options?.json || process.argv.includes('--json')) {
    console.log(
      JSON.stringify({
        schema: 1,
        tool: 'newlook-dom-contract',
        operationalError: error.message,
      }),
    );
  } else {
    console.error(`DOM scan failed: ${error.message}`);
  }

  process.exitCode = 2;
}
