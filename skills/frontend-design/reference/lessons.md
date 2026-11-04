# Lessons: avoid the failure, not merely its appearance

These lessons describe failure patterns identified in earlier newLook work.

They are not universal aesthetic laws, controlled benchmark results, or proof that every application needs the same solution.

Read this file for Build and Redesign. Use relevant lessons for smaller tasks.

## 1. Passing code checks does not establish visual quality

### Failure

The application builds, but the agent never inspects the rendered interface.

Weak hierarchy, cramped controls, broken wrapping, and unreadable canvas content survive.

### Better action

Render the affected interface when possible, capture relevant views, and inspect them with an available image-viewing capability.

Describe concrete observations and revise confirmed weaknesses.

### Evidence

Report rendering, screenshot capture, and image inspection separately.

If visual inspection was unavailable, say so.

## 2. Repeating a default look is not deliberate direction selection

### Failure

The agent repeatedly produces the same dark dashboard, accent color, cards, and decorative treatment regardless of the product.

### Better action

Choose a direction explicitly from audience, task, brand, and content.

Use the catalog, an adapted direction, an existing system, or a concrete custom direction.

Compare meaningful alternatives when the brief is open-ended.

### Evidence

The brief explains why the chosen hierarchy, typography, palette, and composition suit this product.

A dark interface is not itself a failure. An unexplained default is.

## 3. Technical constraints do not determine every design decision

### Failure

A requirement such as square corners or monospace readouts is treated as a complete visual brief.

### Better action

Preserve actual constraints while making the remaining decisions deliberately.

Brand colors are constraints when specified. Do not discard them under the claim that constraints never determine the palette.

### Evidence

The brief distinguishes fixed requirements from decisions open to change.

## 4. Equal emphasis can erase hierarchy

### Failure

Several readouts or actions receive identical visual weight, leaving no clear starting point.

### Better action

Identify the primary task and make its relevant information or action dominant.

A metrics-led screen may need one dominant number. An editor or checkout may need a different focal point.

### Evidence

The rendered composition has an understandable reading order that supports the task.

## 5. Tiny labels and compressed controls reduce usability

### Failure

Small tracked capitals, abbreviations, and long rows of controls create an interface that is difficult to read or operate.

### Better action

Use clear terminology, deliberate grouping, readable type, suitable targets, and responsive wrapping.

For a new system, avoid text below 12px unless there is a justified exception.

### Evidence

Inspect actual text, target geometry, keyboard behavior, resizing, and narrow layouts.

Do not present house-style thresholds as complete accessibility standards.

## 6. Styling changes can break behavior

### Failure

A rewrite drops an ID, selector, public prop, or state representation that application code or tests depend on.

### Better action

Identify important contracts before editing.

Use the DOM source scanner where helpful, inspect its findings, and exercise affected interactions after implementation.

### Evidence

Report which behaviors were tested.

The current DOM scanner does not save a baseline or automatically compare two runs. Its class-style findings do not always affect the exit code.

A "contract intact" message is not a substitute for interaction testing.

## 7. Reviewing findings is not fixing them

### Failure

The agent labels many findings "triaged" and then claims zero defects without changing or validating the underlying issues.

### Better action

Classify each material finding as a regression, existing defect, recommendation, or unknown.

Fix confirmed regressions. Explain justified exceptions and blocked checks.

### Evidence

Preserve tool results and distinguish reviewed, fixed, waived, and unresolved findings.

Compare counts only when measurement conditions match.

## 8. Product-specific design is not mandatory decoration

### Failure

The interface could belong to any product, or an ornamental "signature" is added without improving comprehension.

### Better action

Make at least one substantive product-specific decision in Build and Redesign.

It may be a visualization, hierarchy, preview, workflow, content treatment, or interaction.

### Evidence

Explain how the decision supports a real user task.

Intentional whitespace and familiar controls may be the correct choices.

## 9. More process does not always mean better work

### Failure

A small correction triggers new fonts, a palette replacement, extensive documentation, and unrelated refactoring.

### Better action

Match the process to the mode.

Use strict planning and review for substantive design work. Keep bounded fixes bounded.

### Evidence

The diff and final report match the requested scope.

## 10. Evidence limits must remain visible

### Failure

Source declarations are described as rendered results, screenshots as inspected images, or heuristic checks as complete compliance.

### Better action

Name exactly what was checked and what remains unknown.

### Evidence

The report distinguishes source checks, rendering, interaction testing, screenshot capture, and visual inspection.
