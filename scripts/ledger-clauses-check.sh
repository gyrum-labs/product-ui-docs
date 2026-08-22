#!/usr/bin/env bash
# ledger-clauses-check.sh — thin wrapper; the logic lives in the Python
# sibling so the lint is unit-testable and shell-quoting-free.
set -euo pipefail
exec python3 "$(dirname "${BASH_SOURCE[0]}")/ledger-clauses-check.py" "$@"
