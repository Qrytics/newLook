## newLook frontend workflow

For frontend and UI tasks, read `docs/frontend-design-workflow.md` and follow the canonical workflow it references.

Choose the appropriate mode:

- Patch: a bounded correction.
- Extend: an addition within the existing system.
- Redesign: an intentional visual or structural change.
- Build: a new interface.
- Audit: inspection and recommendations without application edits.

Requirements:

1. Inspect applicable instructions, relevant source, existing design decisions, and required behavior before editing.
2. Preserve unrelated work. Do not turn a bounded correction into an unsolicited redesign.
3. For Build and Redesign, read the lessons, write a concrete brief, choose a direction, establish hierarchy, and make a product-specific design decision.
4. Reuse the established system for Patch and Extend unless the task authorizes changing it.
5. Implement relevant states and preserve keyboard operation and required interactions.
6. Verify source, behavior, and appearance proportionately to risk.
7. Inspect rendered output when possible. Distinguish screenshot capture from visual inspection.
8. Fix confirmed regressions and report failed, blocked, and unrun checks honestly.
9. Respect permission boundaries for commands, dependencies, external services, and global writes.
10. Finish with scope, changes, evidence, remaining issues, and limitations.

Direction catalogs and aesthetic lint support judgment; they do not replace it.

If workflow files are missing, report the incomplete installation rather than inventing their contents.
