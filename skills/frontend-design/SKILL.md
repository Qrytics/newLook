---
name: frontend-design
description: Use for ANY request to build, create, improve, redesign, restyle, polish, or fix a website, web app, landing page, component, or UI. Runs four mandatory passes automatically - design system tokens, Interface Design, Typography, Hallmark audit - without asking the user.
---

# frontend-design

Standing workflow for all frontend/UI work. Run all four passes on every request, automatically. Never ask whether to run them.

## Sibling skills this router calls
These live next to this file, in `../interface-design`, `../typography` and `../hallmark` (in a Claude Code install: `~/.claude/skills/<name>`; for other agents: wherever `install.sh` put them, see the repo README). Read each one's `SKILL.md` when its pass starts.
- `interface-design`: product UI craft, tokens, states. Its own scope: dashboards, admin, SaaS, tools. NOT marketing pages.
- `typography`: Practical Typography audit and rules.
- `hallmark`: distinctive page building and anti-generic lint. Its own rules: build with it only for NEW pages. Its `audit` and `redesign` modes run only when the user names Hallmark; any other change to an existing design is not a Hallmark run (do it in the project's own system). So on existing designs, run its linter script directly (see Pass 4) instead of its audit mode.

## Routing (which skill owns the BUILD step)
| Request | Build | Audit |
|---|---|---|
| New landing page / marketing / brand site | hallmark | sloplint + checklist |
| Dashboard, admin, SaaS app, tool, settings | interface-design | sloplint + checklist |
| Existing project with an established design system | reuse that system | sloplint + checklist (report, fix only what you changed) |
| User says "redesign with Hallmark" | hallmark redesign mode on `<path>` (`hallmark/references/redesign.md`) | hallmark audit mode on `<path>` |
| Component / ambiguous | interface-design | sloplint + checklist |

## Pass 0 - Detect existing design system
Look for `.interface-design/system.md`, `design.md`, `tailwind.config.*`, theme/token files, CSS `:root` variables, `components.json`. If found: REUSE it, skip generation in Pass 1, still run Passes 3 and 4.

## Pass 1 - Design system first
Before any UI code, derive from the brand (state the assumption in one line if the brand is unknown) and write to code as CSS variables / theme file:
- Color: primary, accent, neutral ramp tinted toward primary, semantic colors, surface/text/border roles, WCAG AA contrast (4.5:1 body, 3:1 large/UI). Light and dark if needed.
- Type: font pairing and a named modular scale (e.g. 1.200/1.250).
- Spacing: base unit 4 or 8px and a scale.
- Shape/elevation: radius scale with roles (2+ distinct values), one depth strategy, motion durations/easings.
- Forbidden: default framework colors (stock Tailwind indigo/blue-500, Bootstrap blue), generic purple-to-blue gradients, untinted pure gray everywhere.
When the project has no system file, offer to save the result to `.interface-design/system.md` (interface-design's format), as that skill does, and write it only on a yes.

## Pass 2 - Interface Design: plan before code
Follow the `interface-design` skill workflow (for landing pages, follow hallmark's build flow instead and apply this step's state/interaction checks). Plan layout, components, and states BEFORE writing code:
purpose and primary action; layout and one focal point; component inventory; states for every interactive/data component (default, hover, focus-visible, active, disabled, loading, empty, error, success); keyboard order, 44px targets, `prefers-reduced-motion`; semantic HTML and accessibility. Use Pass 1 tokens only.

## Pass 3 - Typography
Read the sibling `typography` skill and apply it to the built UI (`web.md`, `layout.md`). Apply its ranked MAJOR/MINOR fixes. Where it conflicts with the brand's stated type, the user's stated intent wins. Baseline checks: deliberate scale (5-6 sizes max), body >= 16-18px, line-height per the skill, measure about 65ch, consistent spacing rhythm, `text-wrap: balance` on headings, tabular numerals for data.

## Pass 4 - Hallmark audit (LAST, before showing the result)
If Node is available, run `node <skills-dir>/hallmark/scripts/sloplint.mjs <files> --render` (`<skills-dir>` is the folder holding the sibling skills) (add `--scope component` or `--scope app` where it applies; in a framework project use `--url http://localhost:<port>/<route>` with the dev server running). Fix every FAIL in code you wrote or changed and re-run until clean; fix or waive each REFLEX with a stated reason. On pre-existing code you did not touch, report findings and do not rewrite it. Only use Hallmark's audit or redesign modes when the user names Hallmark. Also check these tells manually:
- default purple/blue gradients, gradient text for no reason
- cookie-cutter hero + 3 equal cards + testimonials + CTA
- uniform border radius everywhere
- stock identical section spacing, everything centered
- no visual focal point
- icon-in-colored-circle cards, emoji icons
- default fonts with no deliberate pairing
- glassmorphism, glowing blobs, decorative orbs without purpose
- eyebrow above every heading, single colored word in headlines
- filler copy ("Unlock the power of...", "Seamless"), fake logos or stats, forms that claim success without sending
- missing states, hardcoded values outside tokens, low contrast
- "swap the brand name and nothing changes": add one brand-specific distinctive move
Verify visually at mobile and desktop widths when the app can be run.

## Library toolbox (available to you on every frontend task)
You HAVE these three libraries available. During Pass 2 (planning), actively consider whether one fits the brief and use it when it does; do not wait to be asked by name. Install into the project only when you use it (never globally). Tell the user in the final report which you used and why. Whatever you use goes through Passes 3 and 4 like everything else.

Decision rule: use a library when it serves a specific purpose in the design (a hero that benefits from depth or motion, a floating control that benefits from glass). Skip it when it would be decoration, when the project is a dense dashboard/admin tool, or when performance or accessibility budget is tight. Always provide a static fallback (solid or CSS gradient background, plain translucent panel) for `prefers-reduced-motion`, no-WebGL, and low-end devices, and never put essential text directly on a moving or refracting layer without a contrast check.

### 1. Liquid glass - `dashersw/liquid-glass-js` (vanilla JS, WebGL refraction)
Use for: floating nav bars, pill buttons, small overlay controls, media-player style chrome over rich imagery or a colorful background. Glass needs something visually interesting behind it; on a flat background it does nothing.
Avoid for: body content cards, forms, long text, whole-page glass (this is also a Hallmark tell: glassmorphism everywhere). Use on 1-3 elements at most, with a reason.
Constraints: needs WebGL 2 and html2canvas; no npm package, no accessibility work done by the library (add your own roles, labels, focus styles, and keyboard handling around `button.element`); mobile touch not done; needs a local server (`npx serve .`).
Setup: copy `container.js`, `button.js`, `styles.css`, `glass.css` from the repo into the project (`git clone https://github.com/dashersw/liquid-glass-js.git` into a temp dir, then copy; keep the MIT license notice).
Load order matters: `styles.css`, `glass.css`, html2canvas, `container.js`, then `button.js` (Button extends Container).
```html
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="container.js"></script>
<script src="button.js"></script>
<script>
  const button = new Button({ text: 'Save Changes', size: 28, type: 'pill', tintOpacity: 0.4, warp: true,
    onClick: () => { /* handler */ } })
  document.body.appendChild(button.element)

  const bar = new Container({ borderRadius: 24, type: 'pill', tintOpacity: 0.3 })
  bar.addChild(new Button({ text: 'Action', size: 24, type: 'pill' }))
  bar.addChild(new Button({ text: '✓', size: 24, type: 'circle' }))
  document.body.appendChild(bar.element)
</script>
```
Options: Container `borderRadius` (48), `type` ('rounded'|'circle'|'pill'), `tintOpacity` (0-1, 0.2). Button adds `text`, `size` (font px; diameter for circle), `onClick`, `warp` (center distortion). Methods: `addChild`, `removeChild`, `updateSizeFromDOM`. In React/Next, create it in a `useEffect` on the client only and clean up on unmount.

### 2. ShaderGradient - `@shadergradient/react` (animated 3D gradient backgrounds)
Use for: hero or section backgrounds that need soft, living color; brand-colored ambient motion behind large type.
Avoid for: dense app UI, anything behind small body text without a scrim, pages that must be light on GPU. Never ship the default preset colors or the stock purple/blue look: set `color1-3` from the Pass 1 brand palette.
Install (React project): `pnpm add @shadergradient/react @react-three/fiber three three-stdlib camera-controls` and `pnpm add -D @types/three` (use the project's package manager).
Version rules: three >= 0.158. Next.js 15 App Router needs React ^19 and @react-three/fiber ^9 (R3F 8 does not work there). Next 14, Next 15 Pages, Vite: React 18 or 19 with matching R3F 8.x/9.x. The README does not document SSR handling; in Next, render it from a client component (`'use client'`) and consider a dynamic import with `ssr: false` if hydration errors appear.
```tsx
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

<ShaderGradientCanvas style={{ position: 'absolute', inset: 0 }} pixelDensity={1.5} fov={45}>
  <ShaderGradient type="plane" animate="on" uSpeed={0.4}
    color1="#..." color2="#..." color3="#..."   // from the brand palette
    grain="on" lightType="3d" cameraZoom={1} cDistance={3.6} cPolarAngle={90} />
</ShaderGradientCanvas>
```
Values: `type` 'plane'|'sphere'|'waterPlane'; `animate` 'on'|'off'; `grain` 'on'|'off'; `lightType` '3d'|'env'. Canvas also takes `pixelDensity`, `fov`, `lazyLoad`, `threshold`, `rootMargin`, `powerPreference`. A preset can be loaded with `control='query'` and `urlString` copied from shadergradient.co/customize. Set `animate="off"` under `prefers-reduced-motion`, keep the canvas behind content (`z-index`, `pointer-events: none`), and give the page a static CSS gradient fallback.

### 3. react-three-fiber - `@react-three/fiber` (React renderer for Three.js)
Use for: real 3D content (product viewers, interactive scenes, WebGL hero objects) in React projects. It is also the dependency under ShaderGradient, so installing ShaderGradient already provides it.
Avoid for: anything a CSS transform or image would do. 3D adds bundle weight, GPU cost, and accessibility work (provide a text alternative, keyboard-reachable controls, and a static poster image fallback).
Install: `npm install three @types/three @react-three/fiber`. Match versions to React: R3F v8 with React 18, R3F v9 with React 19 (Next 15 App Router needs 9). Client components only in Next. Use `<Canvas>` as the root, build the scene from JSX (`<mesh>`, `<boxGeometry>`, lights), animate with `useFrame`, and lazy-load the canvas below the fold.
Check the project's React and Next versions (package.json) BEFORE installing so the R3F major matches.

## Final report (always, brief)
- Which of the four passes ran (note if Pass 1 reused an existing system).
- Which toolbox libraries (liquid glass, ShaderGradient, react-three-fiber) were used and why, or that none fit.
- What the Hallmark audit caught and changed.
- Assumptions made (brand inferred, etc.).
