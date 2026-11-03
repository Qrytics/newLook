# Lint fixes: what each Hallmark code means and the exact fix

Run `scripts/lint.sh` (it finds the linter for you). Read the code at the start of each line.
Fix every FAIL. Fix every REFLEX or waive it with a reason. Confirm every WARN, then fix it or dismiss it.

| Code | What it caught | The fix |
|---|---|---|
| 1 | Inter, Roboto, system-ui, Arial or Helvetica as the main face | Pick a real face from the font list in `design-brief.md`. Install it, do not rely on the CDN. |
| 2a / 2b | Purple-to-blue gradient; gradient text | Solid ink. One accent hue. Delete the gradient. |
| 3 | Three equal columns (icon tiles) | Make the columns different widths, or drop the tiles. A stat strip: one wide hero cell and narrower ones. |
| 7a | Pure `#000` or `#fff` as a color | Tint it: `#17181a` for ink, `#f2efe8` for paper. |
| 15 | A `transition` on a property that `:focus-visible` also sets (the focus ring fades in) | Rings must appear instantly. Draw the highlight with a `::after` pseudo-element and transition only its `border-color`, or transition `background-color` only. |
| 20 | No Hallmark stamp on line 1 of the CSS | Paste the stamp comment as the first line. See `design-brief.md` for the format. |
| 23 | Accent color covers more than about 5% of the screen | Use the accent for state and the primary action only. Big fills use paper or ink. |
| 24a / 24b | Raw `px` spacing, or values off the 4px scale | Use `var(--s1)` to `var(--s7)` tokens. Allowed odd values: at most three optical nudges. |
| 26a | No `:focus-visible` rule anywhere | Add `:focus-visible { outline: 2px solid var(--ink); outline-offset: 2px; }`. |
| 26b | No `:active` or `:disabled` styling | Add both for buttons. Press: `transform: translateY(1px)`. Disabled: dashed border, muted text. |
| 34 | No `overflow-x: clip` on html and body | Add it to both. |
| 38i | `<em>` or `<i>` inside an `<h1>` | Roman headings. Emphasis by weight or by a different element. |
| 40 / 41 | Contrast under 4.5:1, or a dark surface that sets no text color | Darken the text or lighten the surface. Set `color` in the same rule as the dark `background`. |
| 48 | A color literal (`#e7dfcf`, `rgba(...)`) outside the token block | Move the value into `:root` as a named token, then use `var(--name)`. Do this for hover and pressed shades too. |
| 54 | Eyebrow: small label above a heading | Delete it, or make it the heading itself. |
| 63 | Middle dots between items (`A · B · C`), decorative status dots, an arrow glued to link text | Use commas, line breaks, or separate elements. A dot is only legal when it shows live state. |
| 64 | Monospace used for a label | Labels in the body face, sentence case. Mono is only for code and figures. |
| 67 | Small text (15px or less) in uppercase or letter-spaced | Sentence case, no tracking, body face. Wordmarks are exempt. |
| side stripe | A colored `border-left` on a card or alert | Use a full hairline border, or a small square marker made with `::before`. |

## Two ways the linter itself misleads you

1. **Do not lint `index.html` alone.** The linter cannot follow `<link href="/src/style.css">`, so it reports "no focus styling, no overflow-x" for a file that is fine. Lint the whole `src` folder: `scripts/lint.sh src`.
2. **`--render` needs `puppeteer-core`.** If the output ends with `render tier not run`, the contrast, width and screenshot checks did NOT happen, even though it says `clean`. Run `scripts/look.mjs` instead; it needs only Playwright.

## What a waiver looks like

Only REFLEX codes can be waived, never FAIL. Put it in the first comment block of the stylesheet:

```css
/* Hallmark · waive 47b · one frame, a real terminal capture inside · the terminal is the product being sold */
```

Three fields: the code, the evidence, a reason of at least 24 characters that shares a word with the page. If you cannot write that, fix the code instead.
