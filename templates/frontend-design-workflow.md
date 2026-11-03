# Frontend design workflow

Agent-neutral version of the newLook `frontend-design` skill, for agents that read a rules file such as
`AGENTS.md` and have no skill loader. The full skill, with scripts and reference files, is in the newLook
repo under `skills/frontend-design/`. Where this file says `scripts/` or `reference/`, that is where.

Follow every step, in order, on every build, improve, redesign, restyle or fix of a UI. Do not ask whether to.
Do not skip a step because the change looks small.

## The rule that matters most
Look at your work. Take screenshots, open them, and describe what you see before saying it is done.
A page that builds and passes tests can still look broken or generic.

## Step 1. Read the project, change nothing
- Find the entry HTML, stylesheets, the script that draws the UI, the tests, and the rules file.
- If a design system exists (`.interface-design/system.md`, `design.md`, tokens, `:root` variables), reuse it exactly and skip to step 4.
- Write down the project's hard constraints (required readouts, square corners, fixed ids). Keep them all. Constraints limit layout; they do not choose the palette.
- If the script reads element ids or toggles classes, run `node scripts/dom-contract.mjs <project>` and keep the result.
- Screenshot the current UI: `node scripts/look.mjs --serve <project> --tag before`. Open the images. List five specific things wrong with it.

## Step 2. Pick a direction, then write a design brief (this is what stops every redesign looking the same)
Do not improvise a look. Do not skip this.
1. Write one honest sentence: what the project is, who uses it, how it should feel.
2. `node scripts/direction.mjs --project <project> --brief "<that sentence>"` deals three directions from a catalog of fourteen, leaving out what this project and recent other projects already used.
3. Pick the one a human designer would pick. If none fits, `--reroll` once, then pick the closest and say why.
4. `node scripts/direction.mjs --project <project> --choose <slug> --why "<why>"` records it.
5. Open `reference/directions.md` at that direction and follow its palette, fonts, layout, depth, shape and signature exactly. Rename tokens to the product's words. Never blend two directions.
6. Decide what fills empty space with `reference/assets.md`: the user's images, then a screenshot of the product, then drawn SVG, then Hallmark library photos, then type. Name what fills each region of the first screen.
Then fill in every section of `reference/design-brief.md`:
- who uses it and the one thing the screen must make obvious
- the three obvious designs you reject (dark terminal with a green accent; blue gradient cards; centered hero with three cards)
- a palette taken from a real physical place, as named tokens, never pure black or white
- fonts: at most two families plus a mono, none of Inter, Roboto, Arial, system-ui; installed as packages
- a type scale (12 / 14 / 17 / 20 / 24 / 50) with nothing under 12px, labels in sentence case
- a 4px spacing scale, one depth strategy, radius with roles
- **one signature element** that only this product would have, shown on the first screen

## Step 3. Build
- Tokens first in `:root`, then the stylesheet, then the markup, then the few script lines that print into it.
- Put the Hallmark stamp comment on line 1 of the main stylesheet (format in `design-brief.md`).
- Tokens only: no raw hex or raw pixel spacing outside `:root`.
- Build every state: default, hover, focus-visible, active, disabled, loading, empty, error, plus the product's own.
- Update colors the JavaScript draws itself (canvas fills, inline styles).
- Change presentation only. Do not touch backend code or API calls.

## Step 4. Typography check, by number
No text under 12px; body 14 to 16px; 5 to 7 sizes; sentence-case labels with normal tracking; tabular numerals; the key figure is the largest thing on screen; 45 to 75 characters per line; headings balanced.

## Step 5. Audit, never optional
1. `node scripts/look.mjs --url <dev server> --tag after`: desktop and phone screenshots plus measured checks (small text, contrast, overflow, tap targets, missing names). Open the images. Read any text drawn inside a canvas yourself.
2. Screenshot each important state: straddling, modal open, empty, error.
3. `node scripts/direction.mjs --project <project> --verify`: proves the fonts are installed and used, the direction's palette is really in the CSS, and the result does not share fonts or main colors with another project. Fix every PROBLEM.
4. `bash scripts/lint.sh src` (Hallmark's linter). Fix every FAIL. Fix or waive each REFLEX with a written reason. Look codes up in `reference/lint-fixes.md`. Lint the whole `src` folder, not `index.html` alone.
5. `node scripts/dom-contract.mjs <project>` again. It must say `contract intact`.
6. Run the project's tests and build. Start the backend first if the app needs one.
7. Check by eye: purple or blue gradients; hero plus three equal cards; one radius on everything; identical section spacing; **no focal point**; icon-in-circle cards; default fonts; glass blur and glowing blobs; an eyebrow above every heading; invented numbers or logos; an armed button that looks the same as an idle one; and the swap test (swap the product name, does anything else change?).

A FAIL is fixed in code, never dismissed.

## Step 6. Report
Say which steps you did, which direction you chose and which two you passed on, the signature element, what fills the empty space, what the audit caught and changed (with counts), and what you could not check. If you could not take screenshots, say so at the top and do not claim the design was verified. Offer to save the design system to `.interface-design/system.md`; write it only if the user agrees.

## Mistakes a weaker model made on a real run
It kept the dark neon-green terminal look because the project rules said "monospace, square corners". It never opened a screenshot. It called 27 lint findings "triaged to 0 actionable" without fixing them. It gave four readouts equal weight so nothing led. It used 9px tracked capitals everywhere. It strung nine abbreviated buttons in one row. Do not do any of these.
