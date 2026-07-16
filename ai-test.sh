#!/usr/bin/env bash
# Run ai from sources (same as pi-test.sh, renamed for the unified project)
set -euo pipefail
exec "$(dirname "$0")/pi-test.sh" "$@"