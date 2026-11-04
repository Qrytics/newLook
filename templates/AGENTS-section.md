## newLook frontend workflow

For frontend and UI work, read `docs/frontend-design-workflow.md` and follow the canonical workflow it references.

Use the smallest mode that satisfies the request:

- **Patch:** a bounded fix.
- **Extend:** an addition using the existing design system.
- **Redesign:** an intentional change to the agreed visual direction or structure.
- **Audit:** inspection and recommendations without edits.

Requirements:

1. Read applicable project instructions, relevant source, and existing design-system documentation before editing.
2. Preserve unrelated work and behavior. Do not turn a small fix into an unsolicited redesign.
3. Reuse the existing design system unless the task authorizes changing it. An existing system does not skip implementation or verification.
4. Respect permissions for dependency installation, network access, process execution, and global configuration.
5. Use the tools actually available. Do not claim screenshots, browser tests, or visual inspection that did not occur.
6. Verify the affected surfaces proportionately to risk. Report failed, blocked, and unrun checks separately.
7. Treat direction catalogs and aesthetic lint as supporting guidance, not authority to override the user, accessibility, or brand requirements.
8. Finish with scope, changes, verification results, and remaining limitations.

If the workflow files are missing, report the incomplete installation rather than inventing their contents.
