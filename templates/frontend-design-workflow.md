# newLook frontend workflow

Use this entry point when the agent does not have a native newLook skill loader.

## Locate the workflow

### Project installation

From the application root, read:

`docs/newlook/reference/workflow.md`

For this route:

- `NEWLOOK_ROOT` is the absolute application path ending in `docs/newlook`.
- `PROJECT_DIR` is the application or relevant workspace directory.

### Direct use from a newLook checkout

Read:

`skills/frontend-design/reference/workflow.md`

For this route:

- `NEWLOOK_ROOT` is the absolute path to `skills/frontend-design` in the newLook checkout.
- `PROJECT_DIR` is the separate application being changed.

Resolve paths before executing commands. Run application commands from the application's directory.

Do not assume shell variables persist between tool calls.

## Follow the canonical procedure

1. Select Patch, Extend, Redesign, Build, or Audit.
2. Inspect the project and establish a baseline.
3. Establish a concrete design approach.
4. Implement unless the task is Audit.
5. Verify source, interactions, and appearance using available capabilities.
6. Resolve findings and report actual evidence.

For Build and Redesign:

- Read the lessons.
- Write a concrete brief.
- Choose an explicit direction.
- Establish hierarchy and a product-specific design decision.
- Inspect the rendered result when possible.
- Revise material weaknesses.

For Patch and Extend, keep work proportional and preserve the established design system.

## Boundaries

Preserve unrelated work and required behavior.

Respect applicable project instructions and existing permissions.

Do not invent audit results or claim unavailable tools ran.

Saving a screenshot does not establish visual inspection.

Supporting references and aesthetic lint do not override the user's scope, brand, accessibility, or evidence requirements.

## Missing installation files

If the canonical workflow is missing, report an incomplete installation.

A bounded task may proceed using the user request and applicable project instructions, but do not claim the complete newLook workflow ran.

## Report

Finish with scope, important changes, checks and results, visual coverage, remaining issues, and limitations.
