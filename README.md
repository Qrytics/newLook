# newLook

A deliberate frontend design workflow for AI coding agents.

newLook combines concrete design decisions, scope control, implementation, and verification. It aims to prevent both generic, unconsidered UI and unnecessary redesigns of working applications.

## Workflow

1. Choose the mode and scope.
2. Inspect the project and establish a baseline.
3. Establish a concrete design approach.
4. Implement the requested change.
5. Verify source, interactions, and appearance.
6. Resolve findings and report evidence.

For substantive Build and Redesign work, the agent must choose an explicit direction, establish hierarchy, and make a product-specific design decision.

A catalog direction is optional. Deliberate direction selection is not.

## Modes

| Mode | Purpose |
|---|---|
| Patch | A bounded correction |
| Extend | New UI using an established system |
| Redesign | An intentional visual or structural change |
| Build | A new interface |
| Audit | Inspection and recommendations without application edits |

Small fixes stay small. New builds and redesigns receive a fuller brief and visual review.

## Agent portability

The canonical workflow is plain Markdown.

Agents can use it through:

- A native skill loader.
- Project instructions that point to the workflow.
- A direct request to read the workflow from a local checkout.

Successful execution depends on the agent's actual capabilities and instruction support.

The installer contains targets for Claude Code, `.agents/skills` readers, and OpenCode. An installation path alone does not establish compatibility with every product or version.

Other agents can use the generic project or manual route. Native integrations should be documented and tested before being claimed as supported.

## Start without installing

Clone the repository:

```sh
git clone https://github.com/Qrytics/newLook.git
cd newLook
```

Give your agent the actual local checkout path and this instruction:

> Read templates/frontend-design-workflow.md in the newLook checkout. Follow its canonical workflow for my frontend task. Choose the appropriate mode, preserve unrelated work, and report actual verification results.

The application being edited can be a separate repository.

Reading local files avoids relying on a web viewer to preserve complete source content.

## Installation

The current installer requires Bash.

### Project-local workflow

From the newLook checkout:

```sh
bash install.sh --project "../my-app" --dry-run
```

Replace `../my-app` with your actual application directory.

Inspect the preview and the upgrade cautions below before running without `--dry-run`.

A project installation adds:

- A newLook section in `AGENTS.md`.
- `docs/frontend-design-workflow.md`.
- Helpers and references under `docs/newlook/`.
- A subset of Hallmark files used by the helpers.

Agents must actually read the project instructions or be directed to the entry document.

### Native skill folders

Available installer targets:

| Option | Destination |
|---|---|
| `--claude` | `~/.claude/skills` |
| `--codex` | `~/.agents/skills` |
| `--opencode` | `~/.config/opencode/skills` |
| `--dir PATH` | Explicit custom destination |

Example preview:

```sh
bash install.sh --claude --dry-run
```

Run without `--dry-run` only after confirming the destination.

Restart or rescan the host agent as needed.

### Current upgrade cautions

The installer has not yet been redesigned for safe managed upgrades:

- Project installation removes and recopies helper directories even without `--force`.
- Existing newLook sections in `AGENTS.md` are left unchanged.
- Existing global skill folders are skipped unless `--force` is supplied.
- `--force` can overwrite local skill modifications.
- Project installation still contains path rewriting inherited from an older template.
- There is no managed uninstall or backup mechanism.

Review and back up affected files before upgrading.

When updating project instructions, manually replace only the existing newLook section with `templates/AGENTS-section.md`. Preserve unrelated instructions.

## Make skill use explicit

Where the agent supports applicable rules, add:

> For frontend and UI work, use the newLook frontend-design workflow. Choose the appropriate mode, keep changes scoped, follow the design gates for Build and Redesign, and report checks and limitations honestly.

Do not add obsolete instructions requiring "all four passes" or mandatory new fonts for every UI task.

## Repository map

| Path | Purpose |
|---|---|
| `skills/frontend-design/SKILL.md` | Native skill entry point |
| `skills/frontend-design/reference/workflow.md` | Canonical workflow |
| `skills/frontend-design/reference/design-brief.md` | Brief template |
| `skills/frontend-design/reference/directions.md` | Direction catalog |
| `skills/frontend-design/reference/lessons.md` | Failure patterns and remedies |
| `skills/frontend-design/reference/lint-fixes.md` | Finding interpretation |
| `skills/frontend-design/scripts/` | Optional helper tools |
| `skills/hallmark/` | Bundled marketing/editorial guidance and lint tools |
| `skills/interface-design/` | Bundled product UI guidance |
| `skills/typography/` | Bundled typography guidance |
| `templates/` | No-loader entry point and project instruction section |
| `examples/` | Historical saved design-system examples |
| `NOTICE.md` | Third-party attribution |

Supporting references provide craft guidance. The canonical workflow governs scope, permissions, and evidence reporting.

## Helper tools

The current helpers use Node.js. Their original documented baseline is Node 18+, but installed browser and framework dependencies may require a newer version.

Use a maintained Node release compatible with your project and chosen dependencies.

### Screenshots and accessibility checks

`look.mjs` captures screenshots and reports layout/design heuristics and runtime errors. Optional axe-core integration adds automated accessibility checks.

Start the application separately. The helper does not start servers; `--serve` and `--path` are unsupported.

From the newLook checkout:

```sh
node skills/frontend-design/scripts/look.mjs --url "http://127.0.0.1:5173/" --tag after
```

Replace the example URL with the actual application URL.

For accessibility checks and a saved JSON report:

```sh
node skills/frontend-design/scripts/look.mjs --url "http://127.0.0.1:5173/" --axe --json --report ".newlook/look-after.json" --tag after
```

Dependencies are resolved from the current directory or the helper's installation location. Use `--project DIR` to select another lookup directory.

When installation is authorized, a project can provide dependencies with:

```sh
npm install --save-dev playwright axe-core
npx playwright install chromium
```

Use the project's package manager and dependency policy. Installing newLook skills does not install these dependencies.

Useful options:

| Option | Purpose |
|---|---|
| `--project DIR` | Dependency lookup directory |
| `--sizes LIST` | Viewports, such as `1600x1000,390x844` |
| `--wait SELECTOR` | Application-readiness selector |
| `--timeout MS` | Per-operation timeout |
| `--out DIR` | Screenshot directory |
| `--tag NAME` | Screenshot prefix |
| `--full` | Full-page capture at all sizes |
| `--axe` | Run axe-core |
| `--json` | Print structured output |
| `--report FILE` | Also save the JSON report |
| `--strict` | Fail the review policy for findings or incomplete axe checks |
| `--overwrite` | Explicitly permit replacing existing output files |

Existing output files are protected by default. Use a new tag or explicitly allow replacement.

Exit codes:

- `0`: collection completed; findings may exist without strict mode.
- `1`: strict policy found issues requiring review.
- `2`: operational or input failure.

Limitations:

- Without `--axe`, automated contrast and accessible-name checks are not performed.
- Axe violations and incomplete results require interpretation.
- Automated accessibility testing is not complete compliance verification.
- The helper captures the requested URL's initial state; it does not set up authentication or exercise interaction flows.
- Font-loading readiness does not establish complete application readiness.
- Computed font-family declarations do not establish actual glyph font usage.
- Canvas, iframe, and shadow-DOM content require separate coverage.
- Screenshot capture does not establish visual inspection.
- This tool does not duplicate every Hallmark rendered-tier check.

Screenshots and reports may contain sensitive application content. Review before sharing.

#### Development tests

From the newLook checkout:

```sh
npm ci
npx playwright install chromium
npm test
```

The current tests include browser capture and axe-core integration. Passing fixture tests does not establish correctness on every application, operating system, or browser.

### DOM source scan

`dom-contract.mjs` checks simple source-level selector dependencies.

Standalone scan:

```sh
node skills/frontend-design/scripts/dom-contract.mjs "../my-app"
```

Save a baseline before changing an application:

```sh
node skills/frontend-design/scripts/dom-contract.mjs "../my-app" --save "../my-app/.newlook/dom-before.json"
```

Compare after the change:

```sh
node skills/frontend-design/scripts/dom-contract.mjs "../my-app" --compare "../my-app/.newlook/dom-before.json"
```

Replace the example application path with the actual directory.

Baseline paths resolve from the current working directory, not automatically from the application directory.

Saving creates a new file and refuses to overwrite an existing baseline. Use a new filename for each task.

Options:

- `--json`: structured report.
- `--strict`: fail on warnings as well as errors.

Exit codes:

| Code | Meaning |
|---|---|
| 0 | No error-level findings; warnings may exist |
| 1 | Findings failed the selected policy |
| 2 | Invalid arguments, input failure, or operational error |

Missing static ID definitions are error-level findings. State classes without detected styles are warnings. Baseline comparison can flag removed ID definitions and state styles.

These findings require interpretation. Runtime-generated markup and unsupported patterns can produce false positives or omissions.

The scanner is regex-based. It does not prove that components render or interactions work.

Baselines contain relative source paths and selector names. Review them before committing or sharing.

### Direction catalog and project history

The direction helper offers keyword-ranked alternatives and records intentional choices.

List the catalog:

```sh
node skills/frontend-design/scripts/direction.mjs --list
```

Suggest directions for an application:

```sh
node skills/frontend-design/scripts/direction.mjs --project "../my-app" --brief "Developer dashboard for monitoring operations" --seed exploration-1
```

Replace the application path and brief with actual values.

The same brief, seed, catalog, and project history produce reproducible suggestions. Add `--reroll` to exclude the initial three suggestions.

Recent choices receive a small ranking penalty, not permanent exclusion. Keyword ranking is guidance, not a measure of design quality.

Record a choice:

```sh
node skills/frontend-design/scripts/direction.mjs --project "../my-app" --choose bench --why "Its workbench hierarchy fits the operational workflow"
```

Use an actual catalog slug and rationale. Custom directions can be recorded with `--choose custom`.

Inspect project history:

```sh
node skills/frontend-design/scripts/direction.mjs --project "../my-app" --history
```

Only `--choose` writes history, stored in the application's `.newlook/history.json`.

Listing, suggestions, history inspection, and source checking are read-only. No home-directory history is accessed, and no last-deal file is created.

Legacy history entries without a schema are accepted when valid. Existing global and last-deal files are left untouched.

History recording uses an exclusive lock and atomic replacement. Corrupt history causes an error instead of being silently discarded. An interrupted process can leave a lock file requiring inspection.

#### Source evidence—not visual verification

After recording a catalog choice:

```sh
node skills/frontend-design/scripts/direction.mjs --project "../my-app" --check --json
```

The check reports catalog hex matches, font-package declarations in the root package manifest, and font-package text found in source.

It does not establish:

- Dependency installation.
- Actual imports or rendered font use.
- Visible palette use.
- Layout fidelity.
- Accessibility.
- Design quality or originality.

Source comments, fixtures, unused code, generated styles, and workspace arrangements can affect results.

Custom or no-longer-cataloged choices return `not-applicable`. Review those against their brief.

`--verify` is retained as an explicitly labeled compatibility alias for `--check`.

Exit codes:

| Code | Meaning |
|---|---|
| 0 | Action completed; advisory warnings may remain |
| 1 | Source-check warnings failed `--strict` policy |
| 2 | Invalid arguments, input, lock, or operational failure |

No cross-project similarity certification is performed. Shared fonts and colors are not independently defects.

### Aesthetic lint

`lint.sh` locates Hallmark's source linter.

It requires Bash and Node. Some optional rendered checks need additional dependencies.

Interpret findings using `reference/lint-fixes.md`.

A justified exception does not turn a failing command into a passing command. Report both accurately.

## Evidence and testing status

Historical documentation reported end-to-end use of an earlier workflow in Claude Code on two applications, with examples preserved under `examples/`.

Those historical runs do not establish that the current rewritten workflow or all installer targets have been validated.

Do not assume verified behavior in Codex, Cursor, OpenCode, Muse, or other agents without current test evidence.

The documentation changes do not themselves repair or test the helper implementations.

Before a validated release, test:

- Patch scope preservation.
- Extension of an existing system.
- New builds and redesigns.
- Audit without application edits.
- Missing browser, Node, network, or image-viewing capability.
- Installation and upgrades in scratch directories.
- Important interactions and responsive states.
- Truthful reporting of failures and unavailable checks.

## Optional visual dependencies

References discuss optional libraries for effects such as 3D, gradients, and glass.

They are not bundled requirements.

Add them only when they serve the task, are authorized, and have appropriate performance, accessibility, and fallback behavior.

## License

Original newLook files use the repository's MIT license.

Bundled third-party material retains its own licenses and attribution.

See `LICENSE` and `NOTICE.md`.
