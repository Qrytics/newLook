## newLook frontend workflow (mandatory for any UI change)

Applies to any request to build, create, improve, redesign, restyle, polish or fix a website, web app,
landing page, component or UI. Follow `docs/frontend-design-workflow.md` step by step, in order, without asking.

Non-negotiable:
1. Read the project and any saved design system first (`.interface-design/system.md`, `design.md`, tokens). Reuse it if it exists.
2. Pick a direction before any CSS: deal three with `direction.mjs`, choose one, record it, and follow it exactly. Never improvise a look and never reuse the previous redesign's look. Then write the design brief with one signature element. Verify with `direction.mjs --verify` afterwards.
3. Keep the project's hard constraints (required readouts, fixed ids, square corners). They limit layout, not the palette.
4. **Look at your work.** Take desktop and phone screenshots, open them, describe them. Never claim a design is verified without doing this.
5. Run the linter and the DOM-contract check, fix every FAIL, then run the project's tests and build.
6. Report which steps ran, what the audit changed, and what you could not check.
