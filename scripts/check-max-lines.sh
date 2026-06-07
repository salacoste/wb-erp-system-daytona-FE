#!/usr/bin/env bash
# Max-Lines Source Compliance Validator
#
# Reports files violating the ESLint max-lines rule using the real config
# from the monorepo root (the enforcement path per CLAUDE.md).
#
# Why this exists: raw `wc -l` counts JSDoc comments and blank lines that
# ESLint's skipBlankLines+skipComments correctly excludes, causing false
# "over-cap" reports. This script uses ESLint as the source of truth.
#
# Usage:
#   scripts/check-max-lines.sh              # Check all files via ESLint
#   scripts/check-max-lines.sh --self-test  # Run self-tests
#   scripts/check-max-lines.sh --help       # Usage info
#
# Exit codes:
#   0 = all files within limits
#   1 = violations found
#   2 = usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

usage() {
  echo "Usage: $0 [--self-test|--help]"
  echo ""
  echo "Reports files exceeding ESLint max-lines caps (200 source / 800 test)."
  echo "Uses the monorepo root eslint.config.js (the enforcement path)."
}

self_test() {
  local pass=0 fail=0

  echo "Running self-tests..."

  # Test 1: the project should have 0 max-lines violations with the real config
  local violations
  violations=$(cd "$MONOREPO_ROOT" && npx eslint 'frontend/src/**/*.{ts,tsx}' \
    --format compact 2>&1 | grep -c "max-lines" || true)
  violations=$(echo "$violations" | tr -d '[:space:]')
  violations=${violations:-0}
  if [[ "$violations" -eq 0 ]]; then
    echo "  [PASS] Test 1: ESLint reports 0 max-lines violations with real config"
    ((pass++))
  else
    echo "  [FAIL] Test 1: ESLint reports $violations max-lines violations with real config"
    ((fail++))
  fi

  # Test 2: a file with 201 code lines should violate the 200 cap
  local tmp_big
  tmp_big=$(mktemp /tmp/max-lines-test-XXXXXX.ts)
  for i in $(seq 1 201); do echo "const x$i = $i" >> "$tmp_big"; done
  local big_violations
  big_violations=$(cd "$MONOREPO_ROOT" && npx eslint "$tmp_big" \
    --no-ignore \
    --rule 'max-lines: ["error", {"max": 200, "skipBlankLines": true, "skipComments": true}]' \
    --format compact 2>&1 | grep -c "max-lines" || true)
  rm -f "$tmp_big"
  big_violations=$(echo "$big_violations" | tr -d '[:space:]')
  big_violations=${big_violations:-0}
  if [[ "$big_violations" -ge 1 ]]; then
    echo "  [PASS] Test 2: 201-line file correctly flagged as violation"
    ((pass++))
  else
    echo "  [FAIL] Test 2: 201-line file should be flagged (got $big_violations violations)"
    ((fail++))
  fi

  # Test 3: invalid argument should error
  local err_output
  err_output=$(bash "$0" --bogus-flag 2>&1) && rc=0 || rc=$?
  if [[ $rc -eq 2 ]] && echo "$err_output" | grep -q "unknown argument"; then
    echo "  [PASS] Test 3: invalid argument produces usage error (exit 2)"
    ((pass++))
  else
    echo "  [FAIL] Test 3: invalid argument should exit 2 with error (got exit $rc)"
    ((fail++))
  fi

  echo ""
  if [[ $fail -eq 0 ]]; then
    echo -e "${GREEN}All $pass self-tests passed${NC}"
    exit 0
  else
    echo -e "${RED}$fail self-test(s) failed, $pass passed${NC}"
    exit 1
  fi
}

if [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--self-test" ]]; then
  self_test
fi

# Unknown argument → usage error
if [[ -n "${1:-}" ]]; then
  echo -e "${RED}ERROR: unknown argument '$1'${NC}" >&2
  usage
  exit 2
fi

# --- Main check: use real ESLint config from monorepo root ---

cd "$MONOREPO_ROOT"

output=$(npx eslint 'frontend/src/**/*.{ts,tsx}' \
  --format compact 2>&1 | grep "max-lines" || true)

count=$(echo "$output" | grep -c "max-lines" 2>/dev/null || echo 0)
count=$(echo "$count" | tr -d '[:space:]')
count=${count:-0}

if [[ $count -gt 0 ]]; then
  echo -e "${RED}FAIL: $count file(s) exceed max-lines cap${NC}"
  echo "$output"
  exit 1
else
  echo -e "${GREEN}OK: all files within max-lines caps (source: 200, test: 800)${NC}"
  exit 0
fi
