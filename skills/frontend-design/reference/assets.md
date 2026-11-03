# Assets: what fills the space

A redesign looks generic when empty space is filled with the same things: a gradient box, an icon in a coloured circle, a stock-looking hero. Decide what fills each empty region before you build, using this order. The direction in `directions.md` has an **Assets** line that tells you the preferred kind.

## Decision order (first that fits wins)

1. **The user's own images, recordings, logos.** They win every slot. Ask for them once if the project does not already have them. Check the repo for an `assets/`, `public/` or `images/` folder first.
2. **The product itself.** A real screenshot of the running app beats any picture. Use `scripts/look.mjs` to capture it, crop it into a frame, and let it be the hero. This is the right answer for software.
3. **Drawn assets in the palette**, made in SVG or CSS: diagrams, rulers, scales, timelines, charts, patterns, shapes. Use these when the direction says so (bench, blueprint, ledger, signal, arcade, studio) and when the product has nothing photographic about it.
4. **Photographs from Hallmark's library**, when the subject is a place, material, food, object, craft, outdoors, event or people at work. 755 openly licensed Wikimedia Commons photos, each with its credit.
5. **Type at full scale**, when the page is about words (poster, press, field-notes).

Never use: a stock gradient blob, an emoji as an icon, a person's photo standing in for a customer or teammate, an invented logo, an invented number or testimonial.

## Which kind of project gets which

| Project | Lead asset | Why |
|---|---|---|
| Developer tool, dashboard, device | The product's own screen, plus drawn diagrams | There is a real thing to show |
| Shop, food, local business | Photographs of the goods | People buy what they can see |
| Portfolio, photography | The user's own work, edge to edge | The work is the page |
| Docs, blog, research | Type; diagrams drawn in SVG; one photo at most | Words carry it |
| Finance, audit, admin | None; a ledger-style table or strip | Pictures add nothing true |
| Event, launch, campaign | One huge word or numeral | Impact beats information |
| Wellness, notes, creator tool | Soft SVG shapes and nature photos | Calm |

## Getting photographs (Hallmark library)

```
node <skills-dir>/hallmark/scripts/theme.mjs photos "bakery bread on a wooden counter" --n 3 --orient landscape
```
Ask for each subject concretely, in plain words. It prints an `<img>` with `srcset` and the credit line. Rules:

- **Show the credit on the page**, next to or under the photo (author, licence, link). It is required by the licences.
- Prefer the photos whose match line says "full match". "Partial match" means a word was missing (it said `no counter`); check the picture really fits before using it.
- Crop with CSS, not by editing: `aspect-ratio` and `object-fit: cover`, `object-position` to keep the subject.
- One strong photo beats six weak ones. Do not fill a grid just because there is room.
- If the project is software, a photo is a supporting actor at best, and only if it passes the deletion test: remove it, and does the page lose something true? If not, delete it.
- Without Node or network, say so and leave a clearly marked empty slot. Do not invent a placeholder gradient.

## Drawing assets

Draw in inline SVG using the palette tokens (`fill="var(--accent)"`), so the asset changes with the theme. Keep strokes 1 to 2px and use the direction's grid.
- A ruler or scale: ticks every sixth, labels at the ends and the middle.
- A process strip: numbered stages, each with a name, a model or tool in mono, and a time.
- A sparkline: one polyline, one dot at the latest value, no axes.
- A pattern: repeating hairlines, a dot grid, or a paper-grain via a very low-contrast `repeating-linear-gradient`. Decoration must stay under 5% contrast against the background.

## Check
Before finishing, list every region of the first screen and say what fills it and why. Any region filled with "nothing in particular" is a defect.
