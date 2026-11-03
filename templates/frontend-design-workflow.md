# Frontend design workflow

Agent-neutral version of the newLook `frontend-design` skill, for agents that read a rules file such as
`AGENTS.md` and have no skill loader. The full skills are in the newLook repo under `skills/`.

Run all four passes on every build, improve, redesign, restyle or fix of a UI. Do not ask whether to.

## Pass 0: find the existing system
Check for `.interface-design/system.md`, `design.md`, a Tailwind config, theme or token files, CSS `:root`
variables and shared components. If a system exists, reuse it and generate nothing new. Still run passes 2 to 4.

## Pass 1: design system (only when none exists)
Derive it from the brand, then write it as CSS variables before any component code:
- Color: one ink or primary, one accent used for meaning, a neutral ramp tinted toward the primary, semantic colors, surface, text and border roles. WCAG AA: 4.5:1 for body text, 3:1 for large text and UI.
- Type: a font pairing and a named scale (1.2 to 1.25).
- Spacing: a 4px or 8px base and a scale. No off-scale values.
- Shape and depth: a radius scale with roles, one depth strategy (hairlines, shadows or tonal shifts, not a mix), motion durations and easings.
- Forbidden: framework default colors, purple-to-blue gradients, untinted pure gray everywhere.
- Offer to save the result to `.interface-design/system.md`; write it only if the user says yes.

## Pass 2: plan before code
Write a short plan first:
- Who the user is, what they must do, how it should feel (in words that mean something, not "clean and modern").
- The one focal point of each view and how it wins: size, weight, contrast or space.
- The component list. Reuse existing components before making new ones.
- States for every interactive or data component: default, hover, focus-visible, active, disabled, loading, empty, error, success.
- Native HTML first. Keyboard order, 44px hit areas, `prefers-reduced-motion`, semantic markup.
- For each component, state intent, hierarchy, palette, depth, typography and spacing, each with a reason. A choice you cannot justify is a default.
Then build with tokens only. No hardcoded colors or one-off pixel values.

Product UI (dashboards, admin, tools): follow `skills/interface-design/SKILL.md`.
Marketing and landing pages: follow `skills/hallmark/SKILL.md` for the build.

## Pass 3: typography
- Use the type scale, with 5 or 6 sizes at most. Build hierarchy from size, weight and color together.
- Body text 16 to 18px, line height about 1.45 to 1.6, measure about 62ch, never edge to edge.
- `text-wrap: balance` on headings, `pretty` on body. Tabular numerals on every figure. Tighter tracking on large display type.
- Left-align running text. One signal for emphasis. Links identifiable without relying on color alone.
- Accessibility outranks taste: text must survive 1.5x line height, 0.12em letter spacing and browser zoom without clipping.
- Details and rule IDs: `skills/typography/SKILL.md`.

## Pass 4: audit last, before showing the result
Fix everything that flags, then check again:
- purple or blue gradients; gradient text for no reason
- a centered hero, three equal cards, testimonials, then a CTA
- one border radius on everything
- identical spacing between every section; everything centered
- no focal point
- icon-in-colored-circle cards; emoji as icons
- default fonts with no pairing
- glass blur, glowing blobs, decorative orbs
- an eyebrow label above every heading; one colored word in a headline
- decorative status dots; middle-dot meta strings; an arrow glued to link text
- side-stripe borders (a colored left border on a card)
- filler copy ("Unlock the power of...", "Seamless"); invented logos, quotes or numbers
- missing states; colors or spacing outside the tokens; low contrast
- swap test: if the product name changed and nothing else would, add one move that belongs to this product

If Node 18+ is available, run Hallmark's linter, from `skills/hallmark/scripts/` in the newLook repo or from
wherever it was installed:
`node <path>/hallmark/scripts/sloplint.mjs <src> --scope app`
Add `--render --url http://localhost:<port>` for the rendered tier, which needs puppeteer-core and Chrome.
Fix every FAIL in code you wrote or changed. Fix or waive each REFLEX with a stated reason. Keep the Hallmark
stamp comment on line 1 of the main stylesheet if the project has one. On code you did not touch, report
findings and do not rewrite it.

## Report when done
- Which of the four passes ran, and whether an existing system was reused.
- What the audit caught and what you changed.
- Anything you could not verify, such as the rendered lint, mobile layout or screenshots.
