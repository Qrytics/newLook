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

### Screenshots and heuristics

`look.mjs` captures screenshots and reports heuristic findings such as small text, contrast, overflow, control sizing, missing names, and console errors.

It needs Playwright and a compatible Chromium browser.

When dependency installation is authorized, one possible setup is:

```sh
npm install --save-dev @playwright/test
npx playwright install chromium
```

Use the project's package manager and dependency policy.

For an already-running application:

```sh
node skills/frontend-design/scripts/look.mjs --url "http://127.0.0.1:5173/" --tag after
```

Use the actual application URL.

The helper's `--serve` route is Vite-specific.

Limitations:

- Automated findings require interpretation.
- Some backgrounds and rendered content are not covered.
- Canvas text requires separate inspection.
- Capturing screenshots does not mean an agent viewed them.
- This is not a complete accessibility audit.
- It does not duplicate all Hallmark rendered-tier checks.

### DOM source scan

`dom-contract.mjs` looks for source-level selector dependencies:

```sh
node skills/frontend-design/scripts/dom-contract.mjs "../my-app"
```

It is a regex-based heuristic, not a runtime contract verifier.

It does not save or compare baselines automatically. Missing state-class styles can be reported without a failing exit code.

Inspect findings and test important interactions.

### Direction catalog and legacy dealer

List directions:

```sh
node skills/frontend-design/scripts/direction.mjs --list
```

The dealer can suggest directions and record choices.

History-writing commands use:

- The project's `.newlook/history.json`.
- The project's `.newlook/last-deal.json` for dealt alternatives.
- The home directory's `.newlook-history.json`.

Use those commands only when their writes are authorized.

The legacy verifier checks source configuration and history-based similarity. It does not prove rendered font use, visible palette use, visual quality, or originality.

Shared fonts and colors are not independently defects.

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
