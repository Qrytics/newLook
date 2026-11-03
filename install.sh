#!/usr/bin/env bash
# newLook installer. Copies the four skills into an agent's skills folder, or writes
# project instructions for agents that read a rules file instead of skills.
#
#   ./install.sh                      auto-detect agents and install skills globally
#   ./install.sh --claude             ~/.claude/skills
#   ./install.sh --codex              ~/.agents/skills   (Codex CLI, Cursor, and other agents that read .agents)
#   ./install.sh --opencode           ~/.config/opencode/skills
#   ./install.sh --dir <path>         any folder you choose
#   ./install.sh --project <path>     write AGENTS.md + docs/ into a project (any agent that reads AGENTS.md)
#   ./install.sh --dry-run            show what would happen, change nothing
#   ./install.sh --force              overwrite skill folders that already exist
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS=(frontend-design hallmark interface-design typography)
DRY=0; FORCE=0; TARGETS=(); PROJECT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --claude)   TARGETS+=("$HOME/.claude/skills") ;;
    --codex)    TARGETS+=("$HOME/.agents/skills") ;;
    --opencode) TARGETS+=("$HOME/.config/opencode/skills") ;;
    --dir)      shift; [ $# -gt 0 ] || { echo "--dir needs a path" >&2; exit 1; }; TARGETS+=("$1") ;;
    --project)  shift; [ $# -gt 0 ] || { echo "--project needs a path" >&2; exit 1; }; PROJECT="$1" ;;
    --dry-run)  DRY=1 ;;
    --force)    FORCE=1 ;;
    -h|--help)  sed -n '2,13p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1 (try --help)" >&2; exit 1 ;;
  esac
  shift
done

run() { if [ "$DRY" = 1 ]; then echo "  [dry-run] $*"; else "$@"; fi; }

if [ -n "$PROJECT" ]; then
  [ -d "$PROJECT" ] || { echo "Project folder not found: $PROJECT" >&2; exit 1; }
  echo "Project install into $PROJECT"
  run mkdir -p "$PROJECT/docs"
  run cp "$HERE/templates/frontend-design-workflow.md" "$PROJECT/docs/frontend-design-workflow.md"
  # The workflow tells the agent to run scripts/ and read reference/, so they travel with it.
  # The linter needs hallmark/scripts, so a lean copy of that sits beside them.
  run mkdir -p "$PROJECT/docs/newlook"
  run rm -rf "$PROJECT/docs/newlook/scripts" "$PROJECT/docs/newlook/reference" "$PROJECT/docs/newlook/hallmark"
  run cp -R "$HERE/skills/frontend-design/scripts" "$PROJECT/docs/newlook/scripts"
  run cp -R "$HERE/skills/frontend-design/reference" "$PROJECT/docs/newlook/reference"
  # Photo search for assets.md lives in hallmark/scripts/theme.mjs, which is copied below with the linter.
  run mkdir -p "$PROJECT/docs/newlook/hallmark"
  run cp -R "$HERE/skills/hallmark/scripts" "$PROJECT/docs/newlook/hallmark/scripts"
  run cp "$HERE/skills/hallmark/LICENSE" "$PROJECT/docs/newlook/hallmark/LICENSE"
  if [ "$DRY" != 1 ]; then
    # Point the workflow's relative paths at where the files actually landed.
    sed -e 's#`scripts/#`docs/newlook/scripts/#g' -e 's#`reference/#`docs/newlook/reference/#g' \
        -e 's# scripts/# docs/newlook/scripts/#g' -e 's# reference/# docs/newlook/reference/#g' \
        -e 's#(`scripts/#(`docs/newlook/scripts/#g' \
        "$HERE/templates/frontend-design-workflow.md" > "$PROJECT/docs/frontend-design-workflow.md"
    echo "  copied scripts, references and the linter to docs/newlook/"
  fi
  if [ -f "$PROJECT/AGENTS.md" ] && grep -q "newLook frontend workflow" "$PROJECT/AGENTS.md"; then
    echo "  AGENTS.md already has the newLook section, leaving it alone"
  elif [ "$DRY" = 1 ]; then
    echo "  [dry-run] append newLook section to $PROJECT/AGENTS.md"
  else
    { [ -f "$PROJECT/AGENTS.md" ] && printf '\n'; cat "$HERE/templates/AGENTS-section.md"; } >> "$PROJECT/AGENTS.md"
    echo "  wrote the newLook section to AGENTS.md"
  fi
  echo "Done. Agents that read AGENTS.md will now follow docs/frontend-design-workflow.md."
  [ ${#TARGETS[@]} -eq 0 ] && exit 0
fi

if [ ${#TARGETS[@]} -eq 0 ]; then
  [ -d "$HOME/.claude" ] && TARGETS+=("$HOME/.claude/skills")
  { [ -d "$HOME/.agents" ] || [ -d "$HOME/.codex" ] || [ -d "$HOME/.cursor" ]; } && TARGETS+=("$HOME/.agents/skills")
  { [ -d "$HOME/.config/opencode" ] || [ -d "$HOME/.opencode" ]; } && TARGETS+=("$HOME/.config/opencode/skills")
  if [ ${#TARGETS[@]} -eq 0 ]; then
    echo "No known agent folder found (~/.claude, ~/.agents, ~/.codex, ~/.cursor, ~/.config/opencode)." >&2
    echo "Use --dir <path> to pick a folder, or --project <path> for a rules-file agent." >&2
    exit 1
  fi
fi

for dest in "${TARGETS[@]}"; do
  echo "Installing into $dest"
  run mkdir -p "$dest"
  for s in "${SKILLS[@]}"; do
    if [ -e "$dest/$s" ] && [ "$FORCE" != 1 ]; then
      echo "  skip $s (already there; use --force to overwrite)"
      continue
    fi
    [ -e "$dest/$s" ] && run rm -rf "$dest/$s"
    run cp -R "$HERE/skills/$s" "$dest/$s"
    if [ "$DRY" = 1 ]; then echo "  would install $s"; else echo "  installed $s"; fi
  done
done

echo
echo "Done. Restart your agent so it rescans its skills."
echo "Hallmark's linter needs Node 18+. Its rendered checks also need puppeteer-core and Chrome (optional)."
