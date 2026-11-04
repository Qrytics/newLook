---
name: frontend-design
description: Use for building, improving, extending, fixing, polishing, redesigning, or auditing frontend interfaces. Provides a concrete design-and-verification workflow: inspect the project, establish scope, choose a deliberate direction, implement, inspect rendered results, and report evidence.
---

# newLook frontend design

Deliver interfaces that are useful, coherent, accessible, and recognizably suited to their product.

Do not stop at technically valid code. For substantive design work, establish visual hierarchy, make deliberate design decisions, and inspect the rendered result when the environment permits it.

Do not turn a bounded fix into an unsolicited redesign.

## Required entry point

Read `reference/workflow.md` before starting.

That document is the authoritative newLook workflow. Do not create a competing procedure from supporting references.

Resolve this skill's actual directory before using its scripts.

In the workflow:

- `NEWLOOK_ROOT` is this skill's absolute directory.
- `PROJECT_DIR` is the application's absolute directory.

Never execute commands containing unresolved path names or missing arguments.

## Modes

- **Patch:** a bounded correction.
- **Extend:** new UI within an established design system.
- **Redesign:** an intentional visual or structural change.
- **Build:** a new interface without an established design.
- **Audit:** inspect and recommend without editing application files.

Infer the mode from the request and project context. Ask a focused question only when ambiguity materially changes scope or behavior.

## Concrete outputs

For substantive Build and Redesign tasks, produce:

1. Baseline observations or a documented absence of an existing UI.
2. A brief with a chosen direction, hierarchy, tokens, and relevant states.
3. The implementation.
4. Verification evidence and a final report.

Save baseline and brief notes under `.newlook/` when project writes are authorized and that location is appropriate. Otherwise keep them in the plan or response.

For Patch and Extend, use shorter notes proportional to the change.

Evidence documents are not a substitute for implementation or testing.

## Supporting material

Load only what is relevant:

- `reference/lessons.md`: known failure patterns; required for Build and Redesign.
- `reference/design-brief.md`: brief template.
- `reference/directions.md`: visual direction catalog.
- `reference/lint-fixes.md`: finding interpretation.
- `reference/assets.md`: asset guidance.
- `reference/libraries.md`: optional visual libraries.
- `../interface-design/SKILL.md`: product UI craft.
- `../hallmark/SKILL.md`: marketing and editorial craft.
- `../typography/SKILL.md`: typography guidance.

Missing optional references must not block otherwise useful work.

Supporting material does not override the user's scope, project constraints, permission boundaries, or evidence requirements.

## Non-negotiable behavior

- Read before editing.
- Preserve unrelated changes and required behavior.
- Make design decisions deliberately.
- Use available tools; do not pretend unavailable tools ran.
- Inspect rendered results when possible.
- Fix confirmed regressions.
- Report blocked checks and remaining uncertainty.
- Never invent customer claims, endorsements, statistics, or audit results.
