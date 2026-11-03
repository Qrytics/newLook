# newLook

A frontend design workflow for AI coding agents. It makes an agent build or update a UI in four passes
instead of reaching for generic defaults:

1. **Design system first.** Reuse the project's tokens, or derive a palette, type scale and spacing scale from the brand.
2. **Plan layout, components and states** (hover, focus, empty, loading, error) before writing code.
3. **Typography pass.** A deliberate scale, line height, measure and spacing rhythm.
4. **Anti-template audit last.** Check for the tells of generated pages (default gradients, hero plus three cards, one radius everywhere, no focal point) and fix them before showing the result.

It works with Claude Code, Codex CLI, Cursor, OpenCode, and any agent that reads an `AGENTS.md` rules file.

## What is in the repo

| Path | What it is |
|---|---|
| `skills/frontend-design` | The router. It runs the four passes and decides which sibling skill owns the build. Original to this repo. |
| `skills/hallmark` | [Hallmark](https://github.com/nutlope/hallmark): distinctive pages, plus `sloplint.mjs`, a linter for generic-template tells. MIT. |
| `skills/interface-design` | [Interface Design](https://github.com/Dammyjay93/interface-design): craft rules for dashboards and product UI, plus a saved `system.md`. MIT. |
| `skills/typography` | [Practical Typography skill](https://github.com/danium/practicaltypography): web type rules and a ranked audit. MIT. |
| `templates/` | A rules-file section and a plain-language workflow doc, for agents with no skill loader. |
| `examples/metaflow/system.md` | A real saved design system, produced by running this workflow on a dashboard. |
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

- Node 18+ for Hallmark's linter (`skills/hallmark/scripts/sloplint.mjs`). Without Node, the agent uses the written checklist instead.
- Optional: `puppeteer-core` and a Chrome or Chromium binary, for the linter's rendered tier (contrast, widths, screenshots).
  Point `HALLMARK_PUPPETEER` at the folder holding puppeteer-core and `CHROME_PATH` at the browser.

## Optional libraries

The router knows three libraries and uses them only when a design calls for one. They are not bundled:

- `@react-three/fiber` for real 3D in React
- `@shadergradient/react` for animated gradient backgrounds, set in the brand's colors
- [`liquid-glass-js`](https://github.com/dashersw/liquid-glass-js) for glass controls, one to three elements at most

The skill skips them in dense dashboards and always supplies a reduced-motion and no-WebGL fallback.

## What has and has not been tested

- Run end to end in **Claude Code** to remake a React + Vite dashboard (the saved result is in `examples/metaflow/`). Hallmark's static lint passed with 0 FAIL, 0 REFLEX and 0 WARN.
- **Not tested** in Codex, Cursor, OpenCode or any other agent. The install paths come from Hallmark's own installer and each agent's documented skills folder, and the rules-file route is plain markdown, but how well each agent follows it is unverified.
- The rendered lint tier, mobile layout and screenshots were not run on that example.
- The bundled skills are unmodified copies taken on 2026-11-02 and may lag upstream. See `NOTICE.md`.

## License

MIT for the files written for newLook. The bundled skills keep their own MIT licenses. See `LICENSE` and `NOTICE.md`.
