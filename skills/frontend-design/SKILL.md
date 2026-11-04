---
name: frontend-design
description: Use for frontend and UI work, including building, extending, fixing, polishing, auditing, or redesigning websites, web apps, landing pages, and components. Preserve requested scope, reuse appropriate design systems, implement deliberately, and verify with the capabilities actually available.
---

# newLook frontend design

Use newLook to deliver useful, accessible, coherent interfaces without breaking existing behavior or expanding the user's request unnecessarily.

Distinctive design is valuable when it serves the product. Novelty does not take priority over usability, correctness, accessibility, or brand consistency.

## Start here

Read `reference/workflow.md` before editing.

Resolve paths relative to this skill's actual installation directory, not the user's current working directory.

The skill directory contains:

- `reference/workflow.md`: the canonical workflow.
- `reference/design-brief.md`: a proportional design-brief template.
- `reference/directions.md`: optional starting points for visual exploration.
- `reference/assets.md`: supporting asset guidance.
- `reference/lint-fixes.md`: guidance for interpreting findings.
- `scripts/`: optional audit and measurement helpers.

In the canonical workflow, `NEWLOOK_ROOT` means this skill's directory.

## Choose the smallest appropriate mode

- **Patch:** fix a bounded visual or interaction problem.
- **Extend:** add UI using the established design language.
- **Redesign:** intentionally change the agreed visual system or structure.
- **Audit:** inspect and report without editing.

Infer the mode from the user's request. Ask a focused question only when ambiguity materially affects scope, behavior, or authorization.

An existing design system skips unnecessary direction generation. It never skips implementation or verification.

## Capability honesty

Use the capabilities actually available in the host environment.

- A saved screenshot is not evidence that you inspected it.
- Source declarations do not establish rendered appearance.
- Passing automated checks does not establish complete accessibility.
- Missing tools must be reported, not silently treated as passing checks.
- Respect existing authorization for commands, dependency installation, network access, and global writes.

Do not assume that any particular browser, shell, package manager, or image-viewing tool exists.

## Supporting references

Load additional guidance only when relevant and available:

- Product UI and dashboards: `../interface-design/SKILL.md`.
- Marketing and editorial pages: `../hallmark/SKILL.md`.
- Typography: `../typography/SKILL.md` and relevant companion files.
- Assets: `reference/assets.md`.
- Optional visual libraries: `reference/libraries.md`.

These references provide craft guidance, not permission to expand the task.

If a supporting reference is missing, continue using the canonical workflow and report the limitation only when relevant.

Where supporting references conflict with this skill's scope, permissions, evidence requirements, or reporting rules, follow the canonical workflow.

Do not follow blanket instructions to replace suitable fonts, fill intentional whitespace, install unnecessary libraries, force a signature element, or redesign unrelated UI.
