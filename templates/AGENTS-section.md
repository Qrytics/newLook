## newLook frontend workflow (mandatory for any UI change)

Applies to any request to build, create, improve, redesign, restyle, polish or fix a website, web app,
landing page, component or UI.

1. Look for an existing design system first: `.interface-design/system.md`, `design.md`, a Tailwind config,
   theme or token files, or CSS `:root` variables. If one exists, reuse it. Do not add colors, fonts, radii or
   spacing values that are not in it.
2. Follow `docs/frontend-design-workflow.md`: design system, plan layout and states, typography, then audit
   for generic-template tells before showing the result.
3. Verify with the project's build and typecheck commands.
4. Report which steps ran, what the audit changed, and anything you could not verify.
