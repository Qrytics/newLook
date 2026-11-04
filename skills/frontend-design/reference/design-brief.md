# newLook design brief

Use this template for a redesign or a new visual system.

For a small patch, use a short implementation note instead.

For an extension, document only the new decisions and reference the established system. Do not fill out irrelevant sections merely to complete a template.

Write the brief before broad visual changes. Keep it proportional to the task.

## 1. Scope

- **Mode:** Patch / Extend / Redesign / Audit.
- **Requested outcome:**
- **Affected routes, components, and states:**
- **Out of scope:**
- **Acceptance criteria:**

State what success means in observable terms.

Example:

"The settings dialog remains keyboard-operable, fits narrow screens without horizontal page scrolling, and uses the application's existing tokens."

## 2. Audience and primary task

- **Who uses this interface?**
- **What are they trying to accomplish?**
- **What context matters?** Device, environment, expertise, frequency of use, or accessibility needs.
- **What must be easiest to notice or do?**
- **What content or behavior is secondary?**

Do not automatically make a numeric readout the largest element. Hierarchy should follow the task.

## 3. Baseline and constraints

- **Existing design-system location:**
- **Existing tokens and components to reuse:**
- **Brand requirements:**
- **Behavior and public APIs to preserve:**
- **DOM hooks or test selectors to preserve:**
- **Supported layouts, browsers, and languages:**
- **Dependency and performance constraints:**
- **Known baseline defects:**
- **Unavailable evidence:**

An explicit redesign can change the visual system. State which parts are retained, adapted, or replaced.

Do not interpret a technical constraint such as square corners or monospace readouts as permission to ignore the user's brand.

## 4. Direction

- **Direction:** Existing system / Catalog direction / Adapted catalog direction / Custom.
- **Why it fits this audience and task:**
- **What makes the hierarchy and composition appropriate:**
- **Relevant alternatives considered:**
- **Why those alternatives were not selected:**

The catalog in `directions.md` is a set of starting points, not an exhaustive list of acceptable design.

For a patch, "retain the existing direction" is a complete and valid decision.

For an extension, alternatives are optional unless a real design decision exists.

Do not reject a suitable direction solely because it uses common fonts, common colors, or a familiar layout.

## 5. Palette and semantics

- **Existing palette retained or changed:**
- **Page and panel surfaces:**
- **Primary and secondary text:**
- **Borders and separators:**
- **Primary action:**
- **Focus indicator:**
- **Success, warning, and error:**
- **Chart or categorical colors, if relevant:**
- **Dark-mode requirements, if relevant:**

Use the project's token conventions.

For a new system, prefer clear semantic roles. Product-specific names may be used when they remain understandable.

Pure black and white are allowed when appropriate. No color is automatically good or bad because it is common.

### Contrast

For WCAG AA text contrast:

- Normal text generally needs at least 4.5:1.
- Large text generally needs at least 3:1.
- Large text is approximately 24 CSS px, or 18.67 CSS px when bold.

Applicable non-text UI components and graphical objects also need contrast review.

These are not a complete accessibility checklist. Images, gradients, transparency, disabled states, focus indicators, and adjacent colors need appropriate evaluation.

Do not write "contrast: pass" before measuring the relevant combinations.

## 6. Typography

- **Families and roles:**
- **Existing delivery strategy:**
- **Language and glyph coverage:**
- **Fallbacks:**
- **Body size and line height:**
- **Heading hierarchy:**
- **Labels and supporting text:**
- **Numeric alignment, if relevant:**
- **Responsive behavior:**
- **Text-resizing behavior:**

Use a coherent scale, not an arbitrary fixed number of sizes.

Do not replace an appropriate brand or system font merely to appear distinctive.

Small text should receive deliberate review. There is no universal WCAG rule that makes every size below 12px an automatic failure.

Prefer clear labels and appropriate casing. Preserve meaningful acronyms, brand names, code, units, and established terminology.

Use tabular numerals where stable alignment helps.

Use comfortable line lengths for reading text. Do not impose paragraph line-length targets on buttons, tables, or compact controls.

Install additional fonts only when needed and authorized. Do not assume npm font packages are appropriate for every project.

## 7. Layout, spacing, and shape

- **Primary layout structure:**
- **Information hierarchy:**
- **Density:**
- **Spacing system:**
- **Container widths:**
- **Narrow-layout behavior:**
- **Long-content behavior:**
- **Radius roles:**
- **Borders, tonal fills, and shadows:**
- **Sticky or fixed elements, if any:**

Use the existing spacing system when one exists.

A new system should have a small, understandable set of repeated spacing decisions. One-off values are acceptable when they solve a genuine layout problem.

Borders, shadows, and tonal fills may be combined when their roles are coherent.

Touch-target sizing must account for applicable accessibility requirements, spacing exceptions, input method, and usability. A comfortable 44px target is a useful preference, not a blanket claim about every control's minimum legal size.

## 8. Product-specific expression and assets

- **Product-specific element, if useful:**
- **How it supports comprehension or interaction:**
- **Regions needing imagery or illustration:**
- **Asset source and usage rights:**
- **Alternative text or decorative treatment:**
- **Loading and fallback behavior:**
- **Performance budget:**

A signature element is optional. Do not add decoration merely to satisfy a uniqueness requirement.

Whitespace does not need to be filled.

Prefer real product content and user-provided assets when suitable.

Do not invent customer logos, testimonials, statistics, endorsements, screenshots, or capabilities.

Do not add a visual dependency without a task-specific benefit.

## 9. Interaction and states

List the states relevant to the affected component.

| Component or flow | Relevant states | Expected behavior | Verification |
|---|---|---|---|
| | | | |

Consider:

- Hover where applicable.
- Focus-visible.
- Pressed, selected, or expanded.
- Disabled.
- Loading.
- Empty.
- Error and recovery.
- Connected or disconnected.
- Dragging, recording, or other domain states.

Also consider:

- Keyboard navigation.
- Focus order and restoration.
- Accessible names.
- Screen-reader announcements where appropriate.
- Reduced motion.
- Pointer and touch behavior.

Do not create artificial states for static content.

## 10. Verification plan

- **Source checks:**
- **Build and type checks:**
- **Unit or component tests:**
- **Browser interactions:**
- **Routes and states:**
- **Viewport coverage:**
- **Keyboard and focus checks:**
- **Zoom, text resizing, and reflow checks:**
- **Screenshot artifacts:**
- **Who or what can inspect the screenshots:**
- **Known limitations:**

A source declaration does not establish rendered appearance.

A screenshot artifact does not establish visual inspection.

Automated accessibility checks do not establish complete accessibility compliance.

## 11. Optional Hallmark metadata

Some Hallmark lint configurations expect a stylesheet stamp. Use the bundled linter's documented format only when that integration is relevant.

Do not add or rewrite stylesheet metadata merely to complete this brief.

If a stamp is required, populate it truthfully. Do not claim:

- The user requested Hallmark by name when they did not.
- Contrast passed when it was not measured.
- States were implemented when they were not.
- A catalog direction was followed when the design intentionally differs.

If the linter's required metadata cannot represent an unknown result honestly, report the integration limitation instead of inventing a passing value.

Keep the brief in a normal documentation location when possible. Do not force extensive design documentation into a generated stylesheet.

## 12. Decision summary

Summarize:

- What is being preserved.
- What is changing.
- Why the change serves the user.
- What evidence will establish completion.
- What will remain unverified.
