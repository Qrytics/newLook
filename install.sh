#!/usr/bin/env bash

# Optional compatibility wrapper.
# The installation implementation lives in scripts/install.mjs.
#
# Examples:
#   bash install.sh --help
#   bash install.sh --project "../my-app" --dry-run
#   bash install.sh --claude --dry-run

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "newLook installation requires Node.js 22 or newer." >&2
  echo "Install a supported Node.js release, then retry." >&2
  exit 1
fi

exec node "$HERE/scripts/install.mjs" "$@"
