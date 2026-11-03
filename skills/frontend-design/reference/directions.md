# Direction catalog

Fourteen genuinely different looks. `scripts/direction.mjs` deals three that fit the project and have not been used recently. You pick one, then build it exactly as written. Do not blend two. Do not invent a fifteenth because none feels safe.

Every direction fixes the same decisions so two redesigns cannot end up alike: **palette** (named tokens), **type** (installable fonts, scale), **layout** (how the screen is organised), **depth** (how things lift), **shape** (radius), **density**, **assets** (what fills empty space), and **signature** (the one memorable element). Fonts are all real `@fontsource-variable` packages; install exactly the ones listed. The CSS file to import is in the `import` line.

Values are starting points. Rename the tokens to words from the project's own world (`--ledger-ink`, not `--gray-700`).

---

## 1. bench (light instrument panel)
- **Fits:** developer tools, hardware, devices, control surfaces, anything with live readouts. **Avoid for:** content sites, consumer lifestyle.
- **Palette:** bone `#e4e1d9` page, paper `#f2efe8` panels, ink `#17181a`, two status accents (teal `#0b6e6a`, vermilion `#b83f12`), a signal yellow `#e8c600` only for AI or warnings. Dark wells `#0b1a1b` and `#1b1410` for live screens. The page is LIGHT; if you find yourself darkening it, you are in `signal`.
- **Type:** Schibsted Grotesk + Martian Mono. `import '@fontsource-variable/schibsted-grotesk/index.css'; import '@fontsource-variable/martian-mono/wdth.css'`. Scale 12/14/17/20/24/50.
- **Layout:** one wide readout strip leading (hero figure 50px), then framed screens side by side, controls in labeled groups below.
- **Depth:** hairlines and tonal fills. **Shape:** square. **Density:** medium.
- **Assets:** the product's own live views as screens. No photos.
- **Signature:** a ruler or scale that shows the thing the product measures.

## 2. ledger (warm paper, printed record)
- **Fits:** finance, audit, logs, history, verification, admin of records. **Avoid for:** playful or youth products.
- **Palette:** paper `#f5f1e8`, sheet `#fbf9f3`, ink `#1c1b18`, one correction red `#a82b12`, proof green `#2b6a3d`, flag amber `#7f5200`.
- **Type:** Newsreader (headings, figures) + Hanken Grotesk (interface). `import '@fontsource-variable/newsreader/opsz.css'; import '@fontsource-variable/hanken-grotesk/wght.css'`. Scale 13/14/16/20/25/31/49.
- **Layout:** left numbered rail, a verdict sentence as the page title, then ruled lists. Tables before cards.
- **Depth:** hairlines only. **Shape:** 3px controls, 6px panels, rotated 2px "stamps" for status. **Density:** medium.
- **Assets:** none; diagrams drawn in the ink colors.
- **Signature:** a process strip with the stages numbered, timings under each.

## 3. field-notes (editorial, serif-led, long reading)
- **Fits:** blogs, documentation, research, newsletters, case studies. **Avoid for:** dense control panels.
- **Palette:** cream `#f7f2e7`, text `#241f1a`, muted `#6b6256`, one ink-blue `#1f3a5f`, highlight `#f1d97a`.
- **Type:** Source Serif 4 body + Public Sans labels. `import '@fontsource-variable/source-serif-4/opsz.css'; import '@fontsource-variable/public-sans/wght.css'`. Body 18px, line-height 1.65, measure 62ch. Scale 14/16/18/22/30/44/64.
- **Layout:** single 62ch column with wide margins for notes; large drop-in headings; pull quotes break the grid.
- **Depth:** none. **Shape:** square, 1px rules. **Density:** airy.
- **Assets:** photographs from the Hallmark library, cropped wide, always credited. Captions in small sans.
- **Signature:** margin notes that sit beside the paragraph they annotate.

## 4. signal (dark, one hot color, operations)
- **Fits:** monitoring, security, DevOps, trading, incident tools, anything watched at night. **Avoid for:** anything meant to feel friendly.
- **Palette:** `#0b0f1a` page, `#121a2b` panel, `#1a2540` raised, text `#e9edf7`, muted `#98a3bd`, one signal `#ff4d2e`. Status: ok `#3dd6a0`, warn `#ff9f1c`. The page is a deep blue-black, never a neutral grey.
- **Type:** Archivo (width axis, condensed for headings) + JetBrains Mono. `import '@fontsource-variable/archivo/wdth.css'; import '@fontsource-variable/jetbrains-mono/wght.css'`. Scale 12/14/16/20/28/40.
- **Layout:** dense grid of panels, a single full-width status bar, one panel visibly larger than the rest. Tables over cards.
- **Depth:** borders and tonal steps, no shadows. **Shape:** 2px. **Density:** high.
- **Assets:** sparklines and bars drawn in the signal color. No photos.
- **Signature:** a status timeline that reads like a flight log, newest at the top.
- **Warning:** this is the look weak models default to. Choose it only when the project is genuinely watched in the dark, and still change the accent away from green or cyan.

## 5. civic (clear, trustworthy, forms and services)
- **Fits:** government, health admin, banking, schools, forms, onboarding. **Avoid for:** edgy or luxury brands.
- **Palette:** white `#ffffff`, tinted page `#f3f5f8`, text `#14213d`, one deep blue `#0b3d91`, focus `#ffbf47`, error `#b3261e`, success `#1e7a3c`.
- **Type:** Public Sans only, plus Red Hat Mono for codes. `import '@fontsource-variable/public-sans/wght.css'; import '@fontsource-variable/red-hat-mono/wght.css'`. Body 18px, scale 14/16/18/24/32/44.
- **Layout:** one task per screen, large labeled fields, a visible step indicator, plain-language headings.
- **Depth:** 1px borders, thick focus ring. **Shape:** 4px. **Density:** airy. **Targets:** 48px.
- **Assets:** simple line diagrams; real photos of people only with permission.
- **Signature:** a "what happens next" box on every screen.

## 6. atelier (luxury, high-contrast editorial)
- **Fits:** fashion, hospitality, jewellery, architecture, galleries. **Avoid for:** utilities.
- **Palette:** off-white `#f4f1ec`, black `#111`, one metal `#8a6d3b`, a soft grey `#c9c4ba`.
- **Type:** Fraunces display (light weight, large) + Hanken Grotesk small text. `import '@fontsource-variable/fraunces/opsz.css'; import '@fontsource-variable/hanken-grotesk/wght.css'`. Display 64 to 120px, text 15px, scale 13/15/20/32/64/110.
- **Layout:** asymmetric; one huge image or word per screen; generous empty space; text hangs off the grid.
- **Depth:** none. **Shape:** square. **Density:** very airy.
- **Assets:** photographs lead and fill the screen. Use the Hallmark library with tone filters, or the user's own images.
- **Signature:** a single oversized word or numeral cropped by the edge of the page.

## 7. market (warm, busy, friendly commerce)
- **Fits:** shops, food, marketplaces, local businesses, community products. **Avoid for:** serious technical tools.
- **Palette:** cream `#fff6e8`, ink `#2b1d12`, tomato `#d9432b`, leaf `#2e7d4f`, sun `#f2b632`, sky `#cfe6f2`.
- **Type:** Bricolage Grotesque (width and optical axes, characterful) + Figtree. `import '@fontsource-variable/bricolage-grotesque/opsz.css'; import '@fontsource-variable/figtree/wght.css'`. Scale 14/16/18/24/36/56.
- **Layout:** product or category tiles of different sizes, a chunky search bar, prices set large, badges that overlap tile corners.
- **Depth:** a hard offset shadow (4px 4px 0 ink) on key tiles only. **Shape:** 10px. **Density:** busy but ordered.
- **Assets:** food and object photographs from the Hallmark library, cropped square; stickers drawn in CSS.
- **Signature:** a price tag shape or stamp used as the main call to action.

## 8. blueprint (technical drawing)
- **Fits:** engineering, APIs, infrastructure, CAD, architecture, specs. **Avoid for:** consumer lifestyle.
- **Palette:** blueprint blue `#0f2a4a` page, line `#8fb4e3`, bright line `#e8f1ff`, accent `#ffd24a`, grid `rgba(143,180,227,0.15)`.
- **Type:** IBM Plex Sans (width axis) + Azeret Mono. `import '@fontsource-variable/ibm-plex-sans/wdth.css'; import '@fontsource-variable/azeret-mono/wght.css'`. Scale 12/14/16/20/28/40.
- **Layout:** a visible grid background, annotated diagrams with leader lines, a title block in the bottom corner, sections labeled like drawing sheets.
- **Depth:** line weight only. **Shape:** square, 1px lines. **Density:** high.
- **Assets:** line diagrams drawn in SVG in the line colors.
- **Signature:** the title block (project, sheet, revision) as the page footer, with live values.

## 9. studio (soft, rounded, calm, wellness and notes)
- **Fits:** journaling, meditation, habits, planning, creator tools. **Avoid for:** data-heavy or serious tools.
- **Palette:** oat `#f3eee6`, cloud `#fbf9f5`, text `#2c2a28`, muted `#79736b`, sage `#7f9a85`, clay `#c97b5a`.
- **Type:** Literata for headings + Figtree for UI. `import '@fontsource-variable/literata/opsz.css'; import '@fontsource-variable/figtree/wght.css'`. Scale 14/16/18/24/34/48.
- **Layout:** single column, big rounded cards with lots of padding, one gentle action per screen.
- **Depth:** very soft tonal fills, no hard edges. **Shape:** 20px. **Density:** airy.
- **Assets:** hand-drawn style SVG blobs or leaf shapes in sage and clay; nature photographs from the library.
- **Signature:** a large soft shape that changes with the user's state.

## 10. arcade (playful, bold, saturated)
- **Fits:** games, kids, quizzes, social, events, youth brands. **Avoid for:** finance, medical.
- **Palette:** ink `#1b1340`, paper `#fff8e7`, grape `#6c3df4`, lemon `#ffd23f`, coral `#ff5d73`, mint `#2ee6a6`. Use 3 of these per screen, not all.
- **Type:** Epilogue (heavy, 800 to 900) + Lexend for small text. `import '@fontsource-variable/epilogue/wght.css'; import '@fontsource-variable/lexend/wght.css'`. Scale 14/16/20/28/44/80.
- **Layout:** oversized type, tilted stickers, chunky buttons with a thick bottom edge, motion on hover.
- **Depth:** hard offset shadows. **Shape:** 14px and fully round pills. **Density:** medium.
- **Assets:** CSS and SVG shapes (stars, blobs, squiggles) in the palette.
- **Signature:** a mascot-free "score" or counter that bounces when it changes.
- **Warning:** keep contrast at 4.5:1; saturated pairs often fail it.

## 11. press (newsroom, dense and typographic)
- **Fits:** news, magazines, dashboards of text, aggregators, research indexes. **Avoid for:** playful products.
- **Palette:** white `#fcfcfa`, text `#111`, grey `#6a6a66`, rule `#111`, one red `#c8102e`.
- **Type:** Source Serif 4 (headlines, bold) + Libre Franklin (labels and small text). `import '@fontsource-variable/source-serif-4/opsz.css'; import '@fontsource-variable/libre-franklin/wght.css'`. Scale 12/14/16/20/28/44/72.
- **Layout:** multi-column grid with a lead story twice the width of the others; thin black rules between sections; datelines.
- **Depth:** rules only. **Shape:** square. **Density:** high.
- **Assets:** photographs with captions and credits; charts in black and one red.
- **Signature:** a masthead with a live date and edition line.

## 12. terminal-light (a quiet developer tool, not a hacker movie)
- **Fits:** CLIs, docs for developers, package registries, code review tools. **Avoid for:** non-technical audiences.
- **Palette:** page `#fbfbf8`, text `#1c2127`, muted `#5d6670`, line `#dcdfe3`, one accent, burnt orange `#b35900` (not blue, not green, not purple unless the brand already has purple). Code background `#f0efe9`.
- **Type:** JetBrains Mono for code and headings + Public Sans for prose. Scale 13/14/16/20/28/40.
- **Layout:** left file-tree style nav, content column 70ch, code blocks as the main visual, copy buttons on every block.
- **Depth:** borders. **Shape:** 4px. **Density:** medium.
- **Assets:** real code and real command output only.
- **Signature:** a command palette hint (`Ctrl K`) pinned top right and used as the primary search.

## 13. gallery (image-first, quiet chrome)
- **Fits:** portfolios, photography, media libraries, products where pictures sell. **Avoid for:** text-heavy tools.
- **Palette:** `#f6f6f4` page or `#111` page (pick one by the images), text to match, no accent beyond a single `#e5484d` for selection.
- **Type:** Manrope only, small and light. `import '@fontsource-variable/manrope/wght.css'`. Scale 12/13/15/20/32.
- **Layout:** masonry or a justified row grid edge to edge; the interface shrinks to a thin bar; click opens a full-bleed view.
- **Depth:** none. **Shape:** square. **Density:** low chrome.
- **Assets:** the user's own images first; otherwise Hallmark library photos, credited.
- **Signature:** the grid itself, with one image shown 3x larger as the lead.

## 14. poster (big type, few colors, loud)
- **Fits:** events, campaigns, launches, festivals, one-page announcements. **Avoid for:** multi-screen apps.
- **Palette:** pick exactly two colors plus black: for example `#f2ff3d` + `#1a1aff`, or `#ff4d2e` + `#fff1de`. Text is always black or the lighter color.
- **Type:** Big Shoulders Display (very condensed, huge) + Hanken Grotesk. `import '@fontsource-variable/big-shoulders-display/wght.css'; import '@fontsource-variable/hanken-grotesk/wght.css'`. Display 140 to 280px, text 16px.
- **Layout:** one giant word fills the first screen; details in a tight grid below; no cards.
- **Depth:** none. **Shape:** square. **Density:** low text, high impact.
- **Assets:** type itself. At most one cropped photograph or cut-out.
- **Signature:** the headline word, set so large it is cropped by the viewport.

---

## Direction rules for every pick
1. Keep the project's hard constraints (required readouts, fixed ids, square corners). If a constraint conflicts with a direction, drop the direction, not the constraint.
2. Use the direction's palette, type, layout, depth and shape as written. Rename tokens to the product's vocabulary.
3. Never use the same direction as the project's previous redesign. `direction.mjs` records history and enforces this.
4. The signature element is required. Build it first.
5. If none of the three dealt fits, run `node scripts/direction.mjs --reroll` once. After that, pick the closest and say why.
