# MetaBridge design system: the bench

Second worked example, from remaking a vanilla-JS canvas app. Values belong to that project. Use this file only to see the shape of a good result and to compare it with the first example in `../metaflow/`.

## Direction
- Who: someone demoing one keyboard and mouse driving two computers, dragging a live window across the gap between two monitors.
- Feel: a lab bench. A light front panel holding two dark screens. Precise, flat, a little industrial.
- What led before: a dark terminal with a neon green accent and 9px tracked capitals. Rejected because it is the default look for anything "KVM" or "hacker".
- Kept from the project rules: square corners, monospace telemetry, and the four required readouts (`FPS`, `LATENCY_MS`, `STRADDLE_OFFSET_PX`, `CURSOR_OWNER`). Everything else changed.
- Focal point: `STRADDLE_OFFSET_PX` at 50px, with a sentence that says what it means ("220 px on Windows, 260 px on the Mac").
- Signature: a 0 to 1920 ruler under both screens. The window's span fills in as it crosses the seam at 960. A screen with the cursor gets a cursor tag and a colored border; the bezel strip lights up while the window straddles it.

## Color (tokens)
- Surfaces: bone `#e4e1d9` (page), paper `#f2efe8` (panels), bone-2 `#d8d4c9` (bezel)
- Ink: `#17181a`, `#3c4045`, `#575b60` (three text levels), hairlines at 14% and 34% ink
- Windows side: teal `#0b6e6a`, well `#0b1a1b`. Mac side: vermilion `#b83f12`, well `#1b1410`
- Membrane (AI action, caution): amber `#d9a400`, wash `#f1e2a6`
- Rule: one accent per meaning. Teal always means Windows, vermilion always means Mac, amber always means the AI membrane.
- The canvas drawing code was updated to the same colors (window chrome, rip outline), so the page is not half redesigned.

## Type
- Schibsted Grotesk Variable for words; Martian Mono Variable (width axis at 90%) for telemetry and logs. Both self-hosted via `@fontsource-variable`.
- Scale: 12 / 14 / 17 / 20 / 24 / 50. Nothing under 12px. Labels in sentence case, no tracking.

## Space and shape
- 4px base: 4 / 8 / 12 / 16 / 24 / 32 / 48. All square corners (a project rule).
- Depth: hairlines and tonal fills only, no shadows.
- Controls 40px high. Buttons grouped under small labels (Source, View, Window position, Voice, Rip). An armed button inverts to ink on paper and sets `aria-pressed="true"`.

## What the audit found and fixed
- First pass of the linter: 5 FAIL, 3 REFLEX, 4 WARN. Examples: a focus ring that faded in, a mono-font label, three equal HUD columns, a dark canvas with no text color set.
- First look at screenshots: file names breaking mid-word, a hero caption that changed length and made the number jump, a phone layout where the status row wrapped badly.
- Final: 0 FAIL, 0 REFLEX, 0 WARN; unit tests, build, and three browser regression scripts passed.
- Not verified: Hallmark's rendered tier (no puppeteer-core), live-agent mode, and two-machine mode.
