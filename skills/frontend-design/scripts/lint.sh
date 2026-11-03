#!/usr/bin/env bash
# lint.sh: run Hallmark's anti-generic-template linter without knowing where it is installed.
#
#   lint.sh [path ...] [sloplint flags]
#
# Default path is ./src. Default scope is "app" (dashboards, tools); pass --scope page for a landing
# page or --scope component for one component. Add --render --url http://127.0.0.1:5173 for the
# rendered tier (needs puppeteer-core; if it is missing, use look.mjs instead).
#
# Lint the whole source folder, not index.html alone: the linter cannot follow /src/style.css links,
# so linting index.html by itself reports false "no focus styling / no overflow-x" failures.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Order matters: an explicit override, then the copy that travels with this script
# (sibling skill, or docs/newlook/hallmark in a project install), then the global installs.
CANDIDATES=(
  "${NEWLOOK_SKILLS:-}"
  "$HERE/.."
  "$HERE/../.."
  "$HOME/.claude/skills"
  "$HOME/.agents/skills"
  "$HOME/.config/opencode/skills"
)
LINT=""
for d in "${CANDIDATES[@]}"; do
  [ -n "$d" ] && [ -f "$d/hallmark/scripts/sloplint.mjs" ] && { LINT="$d/hallmark/scripts/sloplint.mjs"; break; }
done
if [ -z "$LINT" ]; then
  echo "Could not find hallmark/scripts/sloplint.mjs." >&2
  echo "Set NEWLOOK_SKILLS to the folder that holds the hallmark skill, or run newLook's ./install.sh." >&2
  exit 2
fi
command -v node >/dev/null || { echo "Node 18+ is required for the linter." >&2; exit 2; }

ARGS=("$@")
PATHS=(); FLAGS=(); HAS_SCOPE=0; SKIP_NEXT=0
for a in "${ARGS[@]+"${ARGS[@]}"}"; do
  if [ "$SKIP_NEXT" = 1 ]; then FLAGS+=("$a"); SKIP_NEXT=0; continue; fi
  case "$a" in
    --scope) HAS_SCOPE=1; FLAGS+=("$a"); SKIP_NEXT=1 ;;
    --genre|--url|--stage|--tier) FLAGS+=("$a"); SKIP_NEXT=1 ;;
    --*) FLAGS+=("$a") ;;
    *) PATHS+=("$a") ;;
  esac
done
[ ${#PATHS[@]} -eq 0 ] && PATHS=(src)
[ "$HAS_SCOPE" = 0 ] && FLAGS+=(--scope app)

echo "linter: $LINT"
set +e
node "$LINT" "${PATHS[@]}" "${FLAGS[@]}"
CODE=$?
set -e
echo
echo "How to read this: FAIL must be fixed. REFLEX must be fixed or waived with a reason in the stylesheet stamp."
echo "WARN means check it and fix or dismiss. See reference/lint-fixes.md for the fix for each code."
exit $CODE
