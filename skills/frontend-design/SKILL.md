---
name: frontend-design
description: Use for ANY request to build, create, improve, redesign, restyle, polish, or fix a website, web app, landing page, component, or UI. Runs a fixed checklist automatically - design brief, interface plan, typography, then a measured audit with screenshots - without asking the user.
---

# frontend-design

Follow this checklist in order on every frontend request. Do not ask the user whether to. Do not skip a step because the change looks small. Tick each step off in your head; the final report must say which ones you did.

The helper scripts and reference files are in this skill's folder: `scripts/` and `reference/`. Paths below are relative to it. Sibling skills (`../hallmark`, `../interface-design`, `../typography`) hold the detailed rules.

## The rule that matters most

**You must LOOK at your work.** Take screenshots with `scripts/look.mjs`, open the PNG files, and describe what you see before you say it is done. A page that builds and passes tests can still look broken or generic. Most bad results come from skipping this.

## Checklist

### Step 1. Read the project (no edits yet)
1. Find the entry HTML, the stylesheet(s), the script that draws or updates the UI, the tests, and any rules file (`AGENTS.md`, `CLAUDE.md`). Read them.
2. Look for an existing design system: `.interface-design/system.md`, `design.md`, tokens or a theme file, CSS `:root` variables. **If one exists, reuse it exactly and go to Step 4.**
3. Write down the **hard constraints** the project states (required readouts, "square corners", fixed ids). Keep every one. Constraints limit the layout; they do not decide the palette.
4. If the script reads ids or toggles classes, run `node scripts/dom-contract.mjs <project>` and keep the output. See `reference/lessons.md`, "Redesigning an app whose JavaScript draws the UI".
5. Take a "before" screenshot: `node scripts/look.mjs --serve <project> --tag before` (or `--url` if a server is already running). Open the PNGs. List five specific things that are wrong with the current design.

### Step 2. Pick a direction, then write the brief (before any CSS)
**This step is what stops every redesign looking the same. Do not skip it and do not improvise a look.**

1. Write one honest sentence about the project: what it is, who uses it, how it should feel.
2. Deal three directions: `node scripts/direction.mjs --project <project> --brief "<that sentence>"`. It knows what this project and recent other projects already used and leaves those out.
3. Read the three summaries. Pick the one a human designer would pick for this project. If none fits, run once more with `--reroll`, then pick the closest and say why.
4. Record it: `node scripts/direction.mjs --project <project> --choose <slug> --why "<one sentence>"`.
5. Open `reference/directions.md` at that direction and follow its palette, fonts, layout, depth, shape and signature exactly. Rename the tokens to the product's own words. Do not blend two directions.
6. Decide what fills empty space using `reference/assets.md`: the user's images, then the product itself, then drawn SVG, then Hallmark library photos, then type. Name what fills each region of the first screen.
7. Then fill in `reference/design-brief.md` (who and what, rejected defaults, the palette from the direction, type, space, **the signature element**, the stamp). If you cannot name the signature element, you are not ready to build.

If the project's own rules demand a look (for example "dark terminal HUD"), keep the hard requirements and still deal a direction for everything else. The direction `signal` is the dark-terminal look that weak models default to; choose it only when the project is genuinely watched in the dark.

Pick the build route:
- Dashboard, admin, tool, or settings: follow `../interface-design/SKILL.md`.
- Landing page or marketing site: follow `../hallmark/SKILL.md` for the build.
- One component, or unclear: use `../interface-design/SKILL.md`.
- The user says "redesign with Hallmark": use Hallmark's redesign mode.
Never run Hallmark's build mode over an existing design the user did not name Hallmark for.

### Step 3. Build
1. Install fonts as packages (see `design-brief.md`, section 4). Do not rely on a CDN.
2. Write the tokens first (`:root` variables), then the stylesheet, then the markup, then the few lines of script that print into it. Put the Hallmark stamp on **line 1** of the main stylesheet.
3. Use tokens only. No raw hex colors or raw pixel spacing outside `:root`. Name tokens after the product's world, not `--gray-700`.
4. Build every state: default, hover, focus-visible, active, disabled, loading, empty, error, plus the product's own (armed, live, dragging...).
5. Update colors that JavaScript draws itself (canvas `fillStyle`, inline styles) so they match the new palette.
6. Do not touch backend code, API calls, or logic. Only presentation.
7. If a library from `reference/libraries.md` genuinely serves the design, use it. In a dense dashboard the answer is usually no.

### Step 4. Typography pass
Read `../typography/SKILL.md` and `../typography/web.md`. Then check, by number:
- No text under 12px. Body 14 to 16px. A scale of 5 to 7 sizes.
- Labels in sentence case with normal tracking. No small tracked capitals.
- Numbers use `tabular-nums`. The key figure is the largest thing on the screen.
- Line length 45 to 75 characters. Headings `text-wrap: balance`.
`scripts/look.mjs` measures the first three and prints the font sizes and families in use.

### Step 5. Audit (this step is never optional)
Run these in order and fix what they report:
1. `node scripts/look.mjs --url <running dev server> --tag after` (desktop and phone). Open both PNGs. Fix overflow, cramped wrapping, and anything unreadable. Read any text drawn inside a `<canvas>` in the picture, because the numbers cannot see it.
2. Open each state that matters (straddling, modal open, empty, error, mobile menu) and screenshot it too.
3. `node scripts/direction.mjs --project <project> --verify`. It proves the fonts are installed and named in the CSS, the direction's palette is really used, and the result does not share its fonts or main colors with another project. Fix every PROBLEM, or switch direction and say so in the report.
4. `bash scripts/lint.sh src`. Fix every FAIL. Fix or waive every REFLEX. Look up each code in `reference/lint-fixes.md`. If the output says `render tier not run`, that is expected without puppeteer; `look.mjs` replaces it.
5. `node scripts/dom-contract.mjs <project>` again. It must say `contract intact`.
6. Run the project's own tests and build (`npm test`, `npm run build`, its browser scripts). If the app talks to a backend, start the backend first or the console-error checks fail for the wrong reason.
7. Check this list by eye against the screenshots, and fix any that apply:
   - default purple or blue gradients; gradient text
   - a centered hero over three equal cards over testimonials over a CTA
   - one border radius on every element
   - the same spacing between every section; everything centered
   - **no focal point: four things the same size**
   - icon-in-a-colored-circle cards; emoji as icons
   - a default font with no pairing
   - glass blur, glowing blobs, decorative orbs
   - an eyebrow label above every heading
   - invented numbers, logos or quotes
   - a button that looks the same when armed as when idle
   - swap test: replace the product name with another; if nothing else would change, add one move that belongs to this product

Do not dismiss a FAIL. A FAIL is changed in code. Only REFLEX and WARN can be waived or dismissed, with a written reason.

### Step 6. Report
End with a short report:
- Which steps you did (reused an existing system, or made a new brief).
- The direction you chose, the two you passed on, and why.
- The signature element, and what fills the empty space and why.
- What the audit caught and what you changed (numbers: how many FAIL, REFLEX, problems, before and after).
- What you could not check (say so plainly: rendered lint, a live backend mode, a second device).
- Offer to save the design system to `.interface-design/system.md` and write it only if the user says yes.

## If a step fails

| Problem | Do this |
|---|---|
| `look.mjs` says Playwright not found | `npm i -D @playwright/test && npx playwright install chromium`, then retry. If you cannot install, say so in the report and describe the page from the code only, clearly marked as unverified. |
| `sloplint` says `render tier not run` | Fine. Use `look.mjs`. |
| `lint.sh` cannot find the linter | `export NEWLOOK_SKILLS=<folder containing hallmark>` or run newLook's `./install.sh`. |
| No Node | Skip the scripts, do every check by eye from screenshots if you can take any, and say what you could not measure. |
| Cannot take screenshots at all | Say so at the top of the report. Do not claim the design was verified. |
| `direction.mjs --verify` says the build looks like another project | Change the palette, fonts and layout to the chosen direction's, or choose a different direction. Do not argue it away. |
| A project rule conflicts with a good design | Keep the rule, change something else, and tell the user which rule you kept. |
