# Design brief: decide these things in writing BEFORE you write any CSS

A weak model skips this and produces the default dark dashboard with a green accent. Fill every line in. If you cannot, you are about to produce a template.

## 1. Who and what
- **Who is using this, where, doing what?** One sentence. ("An engineer dragging a game window between two monitors during a demo.")
- **The one thing the screen must make obvious.** This becomes the focal point and the biggest thing on it.
- **Three words for how it should feel.** Not "clean", "modern" or "sleek". Pick concrete words: "a lab bench", "a printed ledger", "a cockpit".

## 2. Break the first idea (the direction you were dealt already did this)
`scripts/direction.mjs` deals the look. This section is the reason it exists: left alone, a model produces the same few designs every time. Use the three below only to double-check that your chosen direction really is different from them.
Write down the three most obvious designs for this kind of screen, then choose something else.

| Kind of screen | Obvious (rejected by default) |
|---|---|
| Dev tool, dashboard, "hacker" product | Black background, neon green or cyan accent, tiny uppercase monospace labels |
| SaaS | Blue/purple gradient, white cards with soft shadows, stat cards in a row of four |
| Landing page | Centered hero, three feature cards with icons, testimonials, CTA banner |
| Anything AI | Dark mode, glassy blur cards, glowing gradient orbs |

A project's `AGENTS.md` may demand a style ("dark terminal HUD"). Keep the hard requirements (required fields, square corners) but you can still choose the palette, scale, layout and hierarchy yourself. Say which rules you kept.

## 3. Palette: start from the direction, rename to the product's world
Take the palette from your chosen direction in `directions.md`. If you change a value, tune it (a shade lighter, a hue shifted) and keep the idea. Below is how to think about it.

### Pick a palette from a place, not from a mood
Name a real physical place or object where this product lives, list its colors, then use them.
- A KVM switch and two monitors: bone-colored front panel, black screens, one teal and one orange status light.
- A ledger: warm paper, black ink, one red correction mark.

Then define tokens (names that belong to the product, not `--gray-700`):
- 3 surfaces (page, panel, sunken well), 4 text levels (ink, ink-2, ink-3, on-dark), 2 hairlines.
- ONE accent per meaning. Two sides of a product can each get one (teal = Windows, vermilion = Mac). Do not add more.
- Every pairing text-on-surface at 4.5:1 or better. The audit script checks this; do not trust your eye.
- Never pure `#000` or `#fff`. Tint toward the accent hue.

## 4. Type: use the direction's fonts
- **Two families at most plus a mono.** One for words, one mono for numbers and code. A dense tool can use one family.
- Banned as a default: Inter, Roboto, Open Sans, Lato, Poppins, Montserrat, system-ui, Arial, Helvetica. Fine, readable choices: Schibsted Grotesk, Hanken Grotesk, Newsreader (serif), Martian Mono, JetBrains Mono, IBM Plex Sans/Mono, Familjen Grotesk, Spline Sans Mono.
- Install them as npm packages so they work offline: `npm i @fontsource-variable/schibsted-grotesk @fontsource-variable/martian-mono`, then `import '@fontsource-variable/schibsted-grotesk/index.css'` in the entry file. Check the exact CSS file names in `node_modules/@fontsource-variable/<name>/`.
- **Scale**: pick sizes from `12 / 14 / 17 / 20 / 24 / 50` (ratio about 1.2) and use nothing else. Body 14 to 16. Nothing under 12px, anywhere.
- **Labels**: sentence case, normal tracking, body face, one step smaller. Not tiny tracked capitals.
- **Numbers**: `font-variant-numeric: tabular-nums`. Numbers that matter are big (the hero figure at 50px, others at 24px).
- Body lines 45 to 75 characters; line-height 1.5; headings `text-wrap: balance`.

## 5. Space and shape
- 4px base: `4 8 12 16 24 32 48`. Put them in `:root` as `--s1` to `--s7`. Never type a raw spacing value.
- Radius: either all square (when the brief says so) or two sizes with roles. Never one radius on everything.
- Depth: pick ONE of hairlines, shadows, or tonal fills. Not a mix.
- Hit targets 40px high (44 on touch). Controls grouped under a small label, not one long row of equal buttons.

## 6. The signature
One element that could only exist for THIS product, shown on the first screen. Ask: what is this product's one job, and can I draw it? Examples that worked:
- A window crossing two monitors: a 0 to 1920 ruler under both screens with the window's span filled in.
- A standup becoming a PR: a five-stage pipeline strip with timings and the critic loop marked.

Write it down: `Signature: ______`. Then build it before anything else.

## 7. The stamp (line 1 of the main stylesheet)
Hallmark's linter requires a comment as the first line. Fill every field truthfully:

```css
/* Hallmark · shape: app screen · genre: modern-minimal · theme: custom (remake, asked for by name) · paper: <your paper> · accent: <your accent> · display: <face> · body: <face>
 * nav: <how the screen is navigated> · signature: <the one element> · states: <the states you built>
 * axes: <paper>/<face>/<accent> · posture: restrained · contrast: pass
 * <one line: the idea, the scale, the spacing> */
```

Genres: `editorial` (consumer, story), `modern-minimal` (SaaS, dev tools), `atmospheric` (AI, music, video), `playful`. Use `shape: app screen` for dashboards and tools.

## 8. States are part of the design
For every interactive or data element, build: default, hover, focus-visible, active, disabled, loading, empty, error. For a live tool also: connected, disconnected, armed, recording, dragging, selected. A screen with only the happy state is a quarter done.
