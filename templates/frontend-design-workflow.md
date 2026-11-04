# newLook frontend workflow

This document is the entry point for agents without a native skill loader.

## Locate the canonical workflow

### Installed into an application project

Read:

`docs/newlook/reference/workflow.md`

Paths are relative to the application project's root.

For this installation:

- `NEWLOOK_ROOT` is the absolute path to `docs/newlook`.
- Helper scripts are in `docs/newlook/scripts/`.
- References are in `docs/newlook/reference/`.
- Optional Hallmark scripts are in `docs/newlook/hallmark/scripts/`.

### Reading directly from the newLook repository

Read:

`skills/frontend-design/reference/workflow.md`

For this route:

- `NEWLOOK_ROOT` is the absolute path to `skills/frontend-design` in the newLook checkout.
- The application directory is the separate project being changed.
- Run application commands from that application's directory.

Resolve actual paths before executing commands.

Do not assume shell variables persist across tool calls.

## Choose the smallest appropriate mode

- **Patch:** fix a bounded issue.
- **Extend:** add UI using the existing design system.
- **Redesign:** intentionally change the agreed visual system or structure.
- **Audit:** inspect and report without editing.

An existing design system skips unnecessary direction generation. It does not skip implementation or verification.

## Requirements

1. Read applicable project instructions and relevant source before editing.
2. Preserve unrelated changes and existing behavior.
3. Respect permissions for commands, dependencies, network access, and global writes.
4. Use available capabilities without claiming unavailable ones.
5. Verify affected surfaces proportionately to risk.
6. Distinguish source checks, rendered checks, interaction tests, screenshot capture, and visual inspection.
7. Report failed, blocked, and unrun checks honestly.

The direction catalog and aesthetic linter are supporting tools. They do not override user requirements, accessibility, or brand consistency.

Do not add libraries, replace suitable fonts, or fill intentional whitespace merely because a supporting reference suggests doing so.

## Missing files

If the canonical workflow is missing, report an incomplete installation.

Do not invent its contents or claim the complete workflow ran.

A bounded task may still proceed using the user's request and applicable project instructions, with the limitation stated clearly.

## Final report

Include:

- Mode and scope.
- Important changes or audit findings.
- Checks performed and their actual results.
- Artifacts captured and whether they were inspected.
- Remaining issues and verification limitations.

Do not claim visual review unless rendered output or screenshots were actually inspected.
