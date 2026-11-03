# newLook

A frontend design workflow for AI coding agents. It makes an agent build or update a UI from a fixed checklist
instead of reaching for generic defaults, and it gives the agent tools to check its own work, so it still works
when the model is weak:

1. **Read the project and screenshot it** before touching anything.
2. **Pick a direction, then write a brief.** A dealer offers three of fourteen genuinely different looks that fit the project and have not been used lately; the agent picks one and follows it exactly. This is what stops every redesign looking the same.
3. **Build with tokens**, every state, and the project's own constraints kept.
4. **Typography check by number**: no text under 12px, a real scale, sentence-case labels.
5. **Measured audit**: screenshots at desktop and phone width, automatic checks for contrast, overflow, tiny text and tap targets, Hallmark's linter, and a check that the script's element ids and state classes survived the rewrite.
6. **Report** what ran, what was caught, and what could not be checked.

It works with Claude Code, Codex CLI, Cursor, OpenCode, and any agent that reads an `AGENTS.md` rules file.

## How it keeps redesigns from all looking alike

Left to choose freely, a model returns to the same few looks. So the choice is mechanical:

- `reference/directions.md` holds fourteen complete directions (bench, ledger, field-notes, signal, civic, atelier, market, blueprint, studio, arcade, press, terminal-light, gallery, poster). Each fixes a palette, installable fonts, layout, depth, shape, density, what fills empty space, and a signature element.
- `scripts/direction.mjs --brief "..."` deals three that fit, skipping anything this project used before and penalising anything another project used recently. `--reroll` deals a different three. `--choose` records the pick.
- `scripts/direction.mjs --verify` checks the finished build: the fonts are installed and used, the direction's colours are really in the CSS, and the fonts and main colours differ from every other project it has verified.
- `reference/assets.md` decides what fills empty space (the user's images, a real screenshot, drawn SVG, credited library photos, or type), so it is not always a gradient and an icon.

History lives in `<project>/.newlook/history.json` and `~/.newlook-history.json`.

## Why it has tools, not just advice

Telling a weak model "make it distinctive" does not work. It keeps the dark neon-green terminal look, never opens
a screenshot, calls lint warnings "triaged", and gives four numbers equal weight. The fix is to give it commands
that print hard numbers and force it to look at pictures. See `skills/frontend-design/reference/lessons.md`
for exactly what went wrong on real runs.

## What is in the repo

| Path | What it is |
|---|---|
| `skills/frontend-design` | The router: a numbered checklist, plus `scripts/` and `reference/` (below). Original to this repo. |
| `skills/frontend-design/scripts/direction.mjs` | Deals three design directions that fit the project and were not used lately, records the choice, and verifies the finished build really uses it and does not copy another project. |
| `skills/frontend-design/scripts/look.mjs` | Takes desktop and phone screenshots and prints measured problems (text under 12px, low contrast, sideways scroll, small tap targets, unnamed controls, console errors). Needs only Playwright. |
| `skills/frontend-design/scripts/dom-contract.mjs` | Lists the element ids and state classes your JavaScript and tests depend on, and fails if a redesign dropped one. |
| `skills/frontend-design/scripts/lint.sh` | Runs Hallmark's linter without knowing where it is installed. |
| `skills/frontend-design/reference/` | `directions.md` (the fourteen looks), `assets.md` (what fills space), `design-brief.md` (decide before coding), `lint-fixes.md` (the fix for every lint code), `lessons.md` (real mistakes), `libraries.md` (optional 3D, gradient, glass libraries). |
| `skills/hallmark` | [Hallmark](https://github.com/nutlope/hallmark): distinctive pages, plus `sloplint.mjs`, a linter for generic-template tells. MIT. |
| `skills/interface-design` | [Interface Design](https://github.com/Dammyjay93/interface-design): craft rules for dashboards and product UI, plus a saved `system.md`. MIT. |
| `skills/typography` | [Practical Typography skill](https://github.com/danium/practicaltypography): web type rules and a ranked audit. MIT. |
| `templates/` | A rules-file section and a plain-language workflow doc, for agents with no skill loader. |
| `examples/` | Two real saved design systems from running this workflow on very different apps. |
| `install.sh` | Copies the skills to the right folder for each agent. |
| `NOTICE.md` | Third-party licenses and upstream links. |

## Install

```bash
git clone git@github.com:Qrytics/newLook.git
cd newLook
./install.sh                # auto-detects Claude Code, Codex/Cursor, OpenCode
```

Or pick the target:

| Agent | Command | Installs to |
|---|---|---|
| Claude Code | `./install.sh --claude` | `~/.claude/skills` |
| Codex CLI, Cursor, other `.agents` readers | `./install.sh --codex` | `~/.agents/skills` |
| OpenCode | `./install.sh --opencode` | `~/.config/opencode/skills` |
| Any other folder | `./install.sh --dir <path>` | the path you give |
| Agent with only a rules file (no skills) | `./install.sh --project <your-repo>` | `AGENTS.md` section + `docs/frontend-design-workflow.md` in that repo |

`--dry-run` previews, `--force` overwrites skills already installed. Restart the agent afterward.

### Make it automatic

The `frontend-design` skill describes itself as the thing to use for any request to build, create, improve,
redesign, restyle or fix a website, web app, landing page, component or UI. Many agents pick a skill from
that description alone. To make it reliable, add one line to your global rules file:

- Claude Code: `~/.claude/CLAUDE.md`
- Codex and others: `~/.codex/AGENTS.md`, or `AGENTS.md` in the project

```
For ALL frontend/UI work (build, improve, redesign, restyle, polish or fix any website, web app,
landing page, component or UI), always use the frontend-design skill and run all four passes
without asking. Finish by reporting which passes ran and what the audit changed.
```

### Manual paste (no install at all)

Give the agent this prompt:

> Read `templates/frontend-design-workflow.md` in the newLook repo and follow it for this change: [what you want].
> Reuse the existing design system. Report which passes ran and what the audit changed.

## Requirements

- **Node 18+** for all the scripts. Without Node the agent falls back to the written checklist and must say it could not measure anything.
- **Playwright with Chromium** for `look.mjs` (screenshots and measured checks): `npm i -D @playwright/test && npx playwright install chromium`. If you already have a browser, set `CHROME_PATH` to it and install `playwright-core`.
- Not needed: `puppeteer-core`. Hallmark's own rendered tier wants it, but `look.mjs` covers the same ground, and `lint.sh` explains the "render tier not run" message.

## Optional libraries

The router knows three libraries and uses them only when a design calls for one. They are not bundled:

- `@react-three/fiber` for real 3D in React
- `@shadergradient/react` for animated gradient backgrounds, set in the brand's colors
- [`liquid-glass-js`](https://github.com/dashersw/liquid-glass-js) for glass controls, one to three elements at most

The skill skips them in dense dashboards and always supplies a reduced-motion and no-WebGL fallback.

## What has and has not been tested

- Run end to end in **Claude Code** on two real apps: a React + Vite dashboard (`examples/metaflow/`) and a vanilla-JS canvas app (`examples/metabridge/`). Both ended with Hallmark's lint at 0 FAIL, 0 REFLEX, 0 WARN. The second was run again after a weaker model's attempt at the same checklist looked generic, and `reference/lessons.md` records what it got wrong.
- The three scripts were tested on those real projects, and `look.mjs` was run against a deliberately broken page to confirm each check fires. `dom-contract.mjs` was shown to catch a dropped id and a state class with no style.
- **Not tested** in Codex, Cursor, OpenCode or any other agent. The install paths come from Hallmark's own installer and each agent's documented skills folder, and the rules-file route is plain markdown, but how well each agent follows it is unverified.
- `look.mjs` checks what the DOM exposes. It cannot see text drawn inside a `<canvas>`, an ugly layout, or a weak focal point. The checklist makes the agent open the screenshots for that, and a weak model may still do it badly.
- `direction.mjs` was tested on six very different briefs (it dealt different, sensible directions for each), for exclusion across repeat redesigns, cross-project steering, reroll, and `--verify` on a real build and on two deliberately wrong ones. The fourteen directions' fonts were checked to exist on npm with the named CSS files, and their palettes were measured for overlap and tuned apart.
- The brief-to-direction match is keyword scoring. It is a nudge: a human-style read of the three summaries still decides, and a very unusual project may get weak matches (the dealer says so).
- `install.sh --project` was tested by installing into a scratch folder and running the copied scripts from there.
- The bundled skills are unmodified copies taken on 2026-11-02 and may lag upstream. See `NOTICE.md`.

## License

MIT for the files written for newLook. The bundled skills keep their own MIT licenses. See `LICENSE` and `NOTICE.md`.
