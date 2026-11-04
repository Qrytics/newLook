# Interpreting newLook and Hallmark findings

## Purpose

Use lint output as evidence to investigate, not as a substitute for the user's requirements, browser testing, accessibility evaluation, or design judgment.

This document changes how findings are handled. It does not change the bundled linter's implementation or rule definitions.

## First identify the finding

Record:

- Tool and command.
- Rule code, if provided.
- Affected file, selector, route, or state.
- Reported severity.
- Whether it existed before the change.
- Whether the result is confirmed, heuristic, or unknown.

Read the actual rule description. Do not infer a rule's meaning from its name alone.

## Classify by substance

### Functional defect

Examples:

- A control no longer performs its action.
- A modal cannot be dismissed.
- A required readout disappeared.
- Content is clipped and inaccessible.
- A state change is not represented correctly.

Fix regressions introduced by the change. Report existing defects outside scope.

### Accessibility defect

Examples:

- An interactive control has no usable accessible name.
- Keyboard focus is lost.
- Required text contrast is insufficient.
- Relevant content cannot reflow.
- Motion lacks a needed reduced-motion alternative.

Confirm with an appropriate method. Fix defects within scope and identify broader risks.

A custom heuristic may misidentify an accessible name or miss a complex contrast case. Investigate rather than automatically accepting or rejecting its result.

### Design-system inconsistency

Examples:

- A new component bypasses established tokens.
- Focus styling differs without a reason.
- A new spacing pattern is inconsistent.
- A font was replaced accidentally.

Prefer the project's conventions unless the task authorizes changing them.

### Aesthetic signal

Examples:

- A familiar hero arrangement.
- A common font.
- Repeated radii.
- Gradient usage.
- Uppercase labels.
- Symmetrical cards.
- Shared colors across projects.

These are not independently defects.

Evaluate whether the choice is suitable for the audience, content, brand, and task.

Do not remove a useful pattern solely because it is common.

### Integration or configuration problem

Examples:

- Missing stylesheet metadata.
- Incorrect source paths.
- Unsupported syntax.
- Missing browser dependency.
- An unavailable rendered tier.
- An incorrect lint scope.

Correct the integration when authorized and worthwhile.

Otherwise report the check as blocked or incomplete. Do not claim that another tool implements identical coverage unless that equivalence has been established.

## Handling reported severities

The bundled linter uses labels such as FAIL, REFLEX, and WARN.

Preserve those labels when reporting its output, but also explain the actual impact.

- Fix confirmed defects introduced by the change.
- Investigate uncertain findings.
- Document justified exceptions.
- Report existing issues separately.
- Do not hide a nonzero exit code.
- Do not describe suppressed findings as fixed.
- Do not turn aesthetic preferences into unsupported accessibility claims.

If a required project CI gate rejects a justified exception, report that the gate still fails. Use the project's supported exception process rather than bypassing it silently.

## Common investigations

### Missing focus styling

Check the actual focused control in the browser.

A stylesheet search may miss shared styles, utility classes, browser defaults, or component-library behavior.

Confirm that keyboard focus is visible and not obscured.

### Missing accessible name

Check the computed accessible name when tools support it.

Valid naming mechanisms vary by element. An attribute merely existing does not guarantee it resolves to a useful name.

### Small controls

Review target size, spacing, input method, and applicable exceptions.

Do not report a universal 32px or 44px minimum as though it were a complete WCAG rule.

### Small text

Review readability, resizing, contrast, density, and language.

A size threshold is a useful heuristic, not a standalone accessibility verdict.

### Overflow

Determine whether overflow is intentional and usable.

A horizontally scrollable data table is different from accidental page-wide scrolling that hides controls.

### Missing state-class styles

Determine whether the class is:

- A visual state.
- A behavioral hook.
- A selector consumed elsewhere.
- A generated or framework-specific class.

A behavioral class does not necessarily need its own CSS rule.

### Missing DOM ID

Check for runtime creation, dynamic IDs, route-specific markup, shadow DOM, or stale references.

The source scanner cannot prove runtime behavior.

### Font or palette mismatch

Source text can establish configuration, not visible use.

Inspect rendered elements before claiming that the browser applied the expected font or color.

### Similarity to another project

Shared typography or colors do not prove copying.

Evaluate layout, content, hierarchy, interaction, and brand context. Treat similarity warnings as advisory.

## Before-and-after reporting

Only compare counts when:

- The same tool version was used.
- The same scope and configuration were used.
- The same routes and states were checked.
- The environment was sufficiently comparable.

Otherwise report the two runs separately.

Do not turn "27 findings reviewed" into "0 defects" unless the evidence supports that conclusion.

## Suggested finding record

- **Finding:**
- **Tool and rule:**
- **Reported severity:**
- **Impact classification:**
- **Baseline or regression:**
- **Evidence:**
- **Action taken:**
- **Remaining uncertainty:**

Keep records proportional to the task. A small patch does not need a large audit document.
