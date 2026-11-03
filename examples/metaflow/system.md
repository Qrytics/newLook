# metaFlow design system: the proof sheet

Source of truth for values: `frontend/src/styles.css` (`:root` tokens). Reuse this; do not generate a new system.

## Direction
- Who: an engineer or lead checking whether a standup turned into a PR that actually passes. Wants a verdict first, evidence second.
- Feel: a proof sheet. Warm paper, black ink, one vermilion correction mark. Quiet, exact, editorial.
- Signature: the five-stage pipeline strip (transcribe, draft, checks, critic, diagram). Shown on Overview as the explainer and on each run with timings; a critic loop that ran more than once gets a vermilion wash and a "N critic passes" note.
- Focal point per view: Overview leads with "N of M runs came out verified." over a proof bar. Run detail leads with the title, status stamp and pipeline strip.

## Depth
Hairlines only (`--rule`, `--rule-strong`). No card shadows. Popovers (menu, profile) use shadow with no border (`--shadow-menu`, `--shadow-pop`), never both.

## Color (tokens)
- Paper: `--paper #f5f1e8`, `--paper-sunk #ece6d8`, `--sheet #fbf9f3`
- Ink: `--ink #1c1b18`, `--ink-2 #4f4b44`, `--ink-3 #6a655b`, `--ink-4 #8d877b`
- Rules: `--rule` and `--rule-strong` (ink at 13% and 28%)
- Mark (error, correction, focus ring): `--mark #a82b12`, `--mark-wash #f6e0d8`
- Proof (verified): `--proof #2b6a3d`, `--proof-wash #dfeadb`
- Flag (needs fix): `--flag #7f5200`, `--flag-wash #f1e1bd`
- Rule: color means state. Accent is the vermilion mark only; no gradients.

## Type
- Display: Newsreader Variable (opsz axis), weight 500. Interface: Hanken Grotesk Variable. Mono: system mono for ids, models, timings, diffs.
- Scale, 1.25 on 16px: 13 / 14 / 16 / 20 / 25 / 31 / 49 (`--t-xs` to `--t-3xl`).
- Hierarchy by size, face and color together. Verdict line 49px display; h1 31px; h2 20px; body 16px.
- Body measure about 62ch. `text-wrap: balance` on headings, `pretty` on body. Tabular numerals on all figures. Tight tracking on large display.

## Spacing and shape
- Base 4px: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 (`--s1` to `--s8`). Off-scale values are not allowed.
- Radius: 3px controls, 6px panels, 2px stamps and tags, 0 on the pipeline strip.
- Hit areas 44px minimum (buttons, inputs, nav, chips, menu options).

## Components
- Primary button: 44px high, ink fill, paper text, 3px radius, 24px side padding. Secondary: transparent, strong-rule border. Danger ghost: mark text, wash on hover. Press: `scale(0.97)`.
- Input: 44px high, sunk fill, bottom rule, turns to sheet fill with ink border on focus. Placeholder `--ink-4`.
- Status stamp (`.pill`): 13px/650, 1.5px currentColor border, 2px radius, rotated -1.5deg; done = proof, needs_fix = flag, error = mark.
- Run row: 76px id, title over meta line, stamp at right, 60px min height. Meta uses commas, never middle dots.
- Check and diagnostic rows: mono word `pass`/`ok` in proof or `fail` in mark. No status dots anywhere.
- Violations: 8px vermilion square marker, no side stripe.
- Nav: numbered left rail (224px), active item has a 3px vermilion bar on the rail edge. Below 860px it becomes a top bar with a horizontal scrolling tab row.
- Motion: 120 to 160ms, `cubic-bezier(0.23, 1, 0.32, 1)`, transform and opacity only; no entry splash. `prefers-reduced-motion` and the "Calm motion" setting disable animation.

## Rejected defaults
- Blue/navy SaaS dashboard with a dark sidebar, drop-shadow cards and pill buttons.
- Four equal stat cards with big numbers and small labels.
- Colored status dots as decoration; eyebrow labels above headings; middle-dot meta strings.

## Hallmark stamp
Line 1 of `styles.css` carries the Hallmark stamp (custom app screen, restrained posture). Static lint at remake time: 0 FAIL, 0 REFLEX, 0 WARN. Rendered lint, contrast on real pixels and the mobile layout were not checked.
