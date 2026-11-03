# Lessons from real runs

Collected from remaking two dashboards (a React app and a vanilla-JS canvas app) and from reviewing a weaker model's attempt at the same skill. Each item is something that actually went wrong.

## The mistakes a weaker model made (do not repeat)

1. **It kept the dark terminal look.** The project said "hardware KVM, monospace, square corners", so it produced black + neon green + 9px tracked uppercase labels again. The rules in `AGENTS.md` fixed *constraints* (square corners, required readouts), not the palette. Keep the constraints, change everything else.
2. **It never looked at the result in a browser.** It said "desktop+mobile verified" but the phone layout was cramped and the main screen was a black void. Run `scripts/look.mjs`, then open the PNGs and describe what you see.
3. **It treated "27 lint findings triaged to 0 actionable" as success.** Dismissing warnings is not fixing them. A FAIL means change the code.
4. **No focal point.** Four readouts of the same size. The number the product exists to show must be the biggest thing on the screen, with a plain sentence next to it that says what it means.
5. **Controls were a button soup.** One long row of equal buttons with abbreviations (`VOICE: 50%`, `KVM MIC`). Group them under small labels and write real words (`Straddle 50%`, `Mic`).
6. **Tiny text everywhere.** 9 to 11px monospace caps. Minimum 12px, body 14+.

## Mistakes made by the strong model, caught only by checking

1. **Linted `index.html` alone** and got false "no focus styling" failures. Lint the `src` folder.
2. **`sloplint` said "clean" while the render tier had not run.** The last line said `render tier not run`. Read the whole output.
3. **A focus ring that faded in** (a `transition: outline-color` on an element that also uses `:focus-visible`). Fixed by drawing the highlight on a `::after` element.
4. **File-icon names broke mid-word** (`deploy_server.p` / `s1`). Fixed with `<wbr>` after `_` and before `.`, and by widening the icon.
5. **A hero caption that changed length** made the readout jump. Reserve its height (`min-height`).
6. **Mobile top bar and stat grid wrapped badly** at 390px. Only the phone screenshot showed it.
7. **Seeded demo data into a database without checking what was there** (a `/teams` check looked empty but `/runs` held data). Look at every table, or ask, before running any seed or reset command. Never run one against data you have not read.
8. **A scripted rewrite of a source file with `sed -i`** failed on macOS (different flags). Use the editor tool or Python for in-place edits.

## Why redesigns all looked the same (and the fix)
Left to choose freely, a model returns to a handful of looks: dark with a neon accent, white cards with a blue gradient, a serif-and-cream "warm" page. Two redesigns by the same model on different projects had the same bones. The fix is mechanical, not advisory:
1. `scripts/direction.mjs` deals three of fourteen directions, with palettes, installable fonts, layouts, depth, shape, assets and a signature written out in full.
2. It keeps history per project and across projects, so a repeat is excluded or penalised.
3. `--verify` checks the build afterwards: fonts installed and used, the direction's colours really present, and no shared fonts or main colours with another project.
4. `reference/assets.md` decides what fills empty space, so it is not always a gradient and an icon.

## Things that look done but are not

- A component that "passes the build" can still be blank. Look at the screenshot.
- Hallmark's static lint cannot see text drawn inside `<canvas>`. Read the canvas text in the screenshot yourself.
- Zero console errors needs the backend running. If the app opens a WebSocket to its API, start the API first or the check fails for the wrong reason.
- "Playwright tests pass" proves the ids and flows still work. It does not say anything about whether the page looks good.

## Redesigning an app whose JavaScript draws the UI

If a script reads ids (`getElementById('m-fps')`), toggles classes (`classList.toggle('armed')`), or tests click selectors (`locator('#btn-span')`), a rewrite of the HTML and CSS can silently break it.

1. **Before changing anything**, run `node scripts/dom-contract.mjs <project>`. Save the list.
2. Keep every id and every state class, or rename it everywhere in the same change (script, tests, markup, CSS).
3. **After**, run `dom-contract.mjs` again. It must say `contract intact`.
4. Then run the project's own tests and its browser scripts.
5. If a state class (`armed`, `active`, `live`, `lit`) has no CSS rule, the control will not look different when the script turns it on. Add the style or use `aria-pressed="true"` as the selector and have the script set it.

Put the colors the canvas draws in a short list in `design-brief.md` too: a stylesheet can be perfect while the game canvas still paints the old palette. Update the hard-coded colors in the drawing code (`fillStyle = '#56d678'`) to match, or the app looks half redesigned.

## Order of work that worked

1. Read the project: entry HTML, stylesheet, the script's DOM contract, tests, rules file (`AGENTS.md`), and any saved design system.
2. Screenshot the current state (`look.mjs --tag before`). Describe what is wrong with it in five bullets.
3. Fill in `design-brief.md`. Write the signature element down.
4. Install fonts as packages.
5. Rewrite the stylesheet (tokens first), then the markup, then the few lines of script that print into it.
6. `look.mjs --tag after`, open the PNGs, fix, repeat. Check desktop, phone, and each state (straddling, spanning, modal open, empty, error).
7. `lint.sh src`, then `dom-contract.mjs`, then the project's tests and build.
8. Report what ran, what the audit caught, and what you could not check.

## Commands you will need

```
node scripts/dom-contract.mjs <project>
node scripts/look.mjs --serve <project> --path "/" --tag before
node scripts/look.mjs --url http://127.0.0.1:5173/ --tag after
bash scripts/lint.sh src
```

(All paths are relative to the `frontend-design` skill folder.)
