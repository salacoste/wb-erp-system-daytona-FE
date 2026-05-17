#!/usr/bin/env bash
# Test-Change Counter — Story 109.6-FE (Epic 108-FE retro A-3)
#
# Counts new test files, added test cases, and removed test cases between two
# git refs. Addresses the 4-instance commit-message count-drift pattern across
# Stories 104.2, 106.1, 108.2 (commit-log titles), and 9daa910 (body).
#
# Usage:
#   scripts/count-test-changes.sh <commit>               # compare HEAD~1..commit
#   scripts/count-test-changes.sh <commit> <base-ref>    # compare base-ref..commit
#   scripts/count-test-changes.sh --self-test            # run built-in self-tests
#   scripts/count-test-changes.sh --help                 # usage info
#
# Outputs (one line per category):
#   +X new test files
#   +Y new test cases
#   -Z removed test cases
#
# Exit codes:
#   0 = success
#   1 = script-internal error
#   2 = usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors — disabled when stdout is not a TTY (e.g. piped to grep/jq/CI logs)
# F-12: mirrors check-eslint-rules.sh pattern to prevent escape-sequence leakage.
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
if [[ ! -t 1 ]]; then
  RED='' GREEN='' NC=''
fi

usage() {
  echo "Usage: $0 <commit> [base-ref]"
  echo ""
  echo "Count test-file and test-case changes between two git refs."
  echo ""
  echo "Arguments:"
  echo "  commit     Target commit hash or ref (required)"
  echo "  base-ref   Comparison base ref (optional, defaults to <commit>~1)"
  echo ""
  echo "Options:"
  echo "  --self-test    Run built-in validation tests"
  echo "  --help         Show this usage message"
  echo ""
  echo "Output:"
  echo "  +X new test files   (added via --diff-filter=A)"
  echo "  +Y new test cases   (lines matching '^\+\\s*it\\(' in diff)"
  echo "  -Z removed test cases (lines matching '^-\\s*it\\(' in diff)"
  echo ""
  echo "Rename behavior:"
  echo "  Renamed test files (e.g. useFoo.test.ts → useBar.test.ts) are excluded"
  echo "  from --diff-filter=A new-file counts. Renames with extension change"
  echo "  (e.g. useFoo.spec.ts → useFoo.test.ts) may NOT be detected as new tests"
  echo "  either — Git's rename heuristic may match the old path. Use --find-renames"
  echo "  in advanced workflows; this script trusts the .test.{ts,tsx} extension."
}

# Count new test files added between two refs
# F-9: removed redundant '**/__tests__/**/*.test.ts' / '**/__tests__/**/*.test.tsx'
# patterns — '**/*.test.ts' and '**/*.test.tsx' already cover files in any directory.
count_new_test_files() {
  local base="$1"
  local target="$2"
  { git diff --diff-filter=A --name-only "$base" "$target" \
    -- '**/*.test.ts' '**/*.test.tsx' \
    2>/dev/null | grep -c "." ; } || true
}

# Count added it() test-case lines in diff
count_added_test_cases() {
  local base="$1"
  local target="$2"
  { git diff "$base" "$target" \
    -- '**/*.test.ts' '**/*.test.tsx' \
    2>/dev/null | grep -cE '^\+[[:space:]]*(it|test)\(' ; } || true
}

# Count removed it() test-case lines in diff
count_removed_test_cases() {
  local base="$1"
  local target="$2"
  { git diff "$base" "$target" \
    -- '**/*.test.ts' '**/*.test.tsx' \
    2>/dev/null | grep -cE '^-[[:space:]]*(it|test)\(' ; } || true
}

run_count() {
  local commit="$1"
  local base_ref="${2:-${commit}~1}"

  if ! git cat-file -e "${commit}^{commit}" 2>/dev/null; then
    echo -e "${RED}ERROR: '${commit}' is not a valid commit${NC}" >&2
    exit 1
  fi
  if ! git cat-file -e "${base_ref}^{commit}" 2>/dev/null; then
    echo -e "${RED}ERROR: base ref '${base_ref}' is not a valid commit${NC}" >&2
    exit 1
  fi

  local new_files added_cases removed_cases
  new_files=$(count_new_test_files "$base_ref" "$commit")
  added_cases=$(count_added_test_cases "$base_ref" "$commit")
  removed_cases=$(count_removed_test_cases "$base_ref" "$commit")

  echo "+${new_files} new test files"
  echo "+${added_cases} new test cases"
  echo "-${removed_cases} removed test cases"
}

# ---------------------------------------------------------------------------
# Self-test: Creates a temp git repo, makes a known-shape commit, asserts output.
# Also validates against known historical commits from Epic 108/109 work.
# Mirrors the --self-test pattern from scripts/check-eslint-rules.sh (Story 109.1-FE).
# ---------------------------------------------------------------------------
self_test() {
  local pass=0 fail=0 skip=0

  echo "Running self-tests for count-test-changes.sh..."
  echo ""

  # --- Test 1: Temp repo with known-shape commit ---
  local tmpdir
  tmpdir=$(mktemp -d /tmp/count-test-XXXXXX)
  trap "rm -rf $tmpdir" EXIT

  (
    cd "$tmpdir"
    git init -q
    git config user.email "test@test.com"
    git config user.name "Test"
    git config commit.gpgsign false

    # Base commit — existing test file with 2 test cases
    mkdir -p src/__tests__
    cat > src/__tests__/existing.test.ts <<'EOF'
import { describe, it } from 'vitest'
describe('existing', () => {
  it('does the thing', () => {})
  it('handles error', () => {})
})
EOF
    git add .
    git commit -q -m "base commit"

    # Target commit — adds 1 new test file with 3 it(), removes 1 it() from existing
    cat > src/__tests__/new.test.ts <<'EOF'
import { describe, it } from 'vitest'
describe('new suite', () => {
  it('case one', () => {})
  it('case two', () => {})
  it('case three', () => {})
})
EOF
    # Remove one test from existing file
    cat > src/__tests__/existing.test.ts <<'EOF'
import { describe, it } from 'vitest'
describe('existing', () => {
  it('does the thing', () => {})
})
EOF
    git add .
    git commit -q -m "add tests"
  )

  # Run script against temp repo
  local target_commit
  target_commit=$(cd "$tmpdir" && git rev-parse HEAD)
  local output
  output=$(cd "$tmpdir" && bash "$SCRIPT_DIR/count-test-changes.sh" "$target_commit" 2>&1) || {
    echo -e "  ${RED}[FAIL]${NC} Test 1: script errored: $output"
    ((fail++))
  }

  # Validate expected output
  local t1_fail=0
  if echo "$output" | grep -qF "+1 new test files"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 1a: new test files = +1"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 1a: expected '+1 new test files', got: $(echo "$output" | grep 'new test files')"
    t1_fail=1
    ((fail++))
  fi

  if echo "$output" | grep -qF "+3 new test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 1b: new test cases = +3"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 1b: expected '+3 new test cases', got: $(echo "$output" | grep 'new test cases')"
    t1_fail=1
    ((fail++))
  fi

  if echo "$output" | grep -q -- "-1 removed test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 1c: removed test cases = -1"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 1c: expected '-1 removed test cases', got: $(echo "$output" | grep 'removed test cases')"
    t1_fail=1
    ((fail++))
  fi

  trap - EXIT
  rm -rf "$tmpdir"

  # --- Test 2: Invalid commit hash → exit 1 ---
  local err_output rc
  err_output=$(bash "$0" "deadbeefdeadbeefdeadbeefdeadbeef000000" 2>&1) && rc=0 || rc=$?
  if [[ $rc -eq 1 ]] && echo "$err_output" | grep -q "not a valid commit"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 2: invalid commit → exit 1 with error"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 2: invalid commit should exit 1 (got exit $rc)"
    ((fail++))
  fi

  # --- Test 3: No arguments → exit 2 ---
  local usage_output usage_rc
  usage_output=$(bash "$0" 2>&1) && usage_rc=0 || usage_rc=$?
  if [[ $usage_rc -eq 2 ]] && echo "$usage_output" | grep -q "Usage"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 3: no arguments → exit 2 (usage error)"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 3: no arguments should exit 2 (got exit $usage_rc)"
    ((fail++))
  fi

  # --- Test 4: --help → exit 0 ---
  local help_rc
  bash "$0" --help > /dev/null 2>&1 && help_rc=0 || help_rc=$?
  if [[ $help_rc -eq 0 ]]; then
    echo -e "  ${GREEN}[PASS]${NC} Test 4: --help → exit 0"
    ((pass++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 4: --help should exit 0 (got exit $help_rc)"
    ((fail++))
  fi

  # --- Tests 5-6: Historical commit validation ---
  # Story 109.6 validation: commit c9dd18e added ForecastChart.test.tsx + useAiModels.test.ts
  # (2 new test files, 25 it() additions, 0 removals — verified at story authoring time)
  local historical_output historical_rc
  historical_output=$(cd "$SCRIPT_DIR/.." && bash "$0" c9dd18e c9dd18e~1 2>&1) && historical_rc=0 || historical_rc=$?

  if [[ $historical_rc -eq 0 ]] && echo "$historical_output" | grep -qF "+25 new test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 5: historical commit c9dd18e resolved successfully (+25 new test cases confirmed)"
    ((pass++))
  elif echo "$historical_output" | grep -q "not a valid commit"; then
    # This commit may not exist in shallow clones — warn but don't fail
    echo -e "  [SKIP]  Test 5: commit c9dd18e not found (shallow clone?) — skipping"
    ((skip++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 5: c9dd18e should exit 0 and report +25 new test cases (got: $historical_output)"
    ((fail++))
  fi

  # Verify +2 new test files in c9dd18e (ForecastChart.test.tsx + useAiModels.test.ts)
  if [[ $historical_rc -eq 0 ]] && echo "$historical_output" | grep -qF "+2 new test files"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 6: c9dd18e reports +2 new test files (ForecastChart + useAiModels)"
    ((pass++))
  elif [[ $historical_rc -ne 0 ]]; then
    echo -e "  [SKIP]  Test 6: c9dd18e not found (shallow clone?) — skipping"
    ((skip++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 6: c9dd18e should report +2 new test files, got: $(echo "$historical_output" | grep 'new test files')"
    ((fail++))
  fi

  # ---------------------------------------------------------------------------
  # Tests 7-10: Historical drift-commit validation (F-4, Story 109.6-FE 1st-pass review)
  # These verify that the script reports accurate counts for commits where the original
  # commit message claimed different numbers — the 4-instance drift pattern from Epic 108 retro A-3.
  #
  # Drift summary (commit message claim → script actual):
  #   9b26306 (Story 104.2 feat): no test-count claim in message — +0 files, +4 cases, -0 removed
  #   2218b34 (Story 106.1 feat): no test-count claim in message — +0 files, +2 cases, -2 removed
  #   d15b164 (Story 108.2 feat): claimed "11 new tests" — script: +4 files, +26 cases, -0 removed
  #   9daa910 (Stories 108.4+108.5): claimed "+28 new across 6 files" — script: +3 files, +36 cases, -4 removed
  #
  # Note: "11 new tests" vs "+26 cases" discrepancy for d15b164 — the commit message counted
  # top-level describe blocks and suite assertions selectively; the script counts all it()/test()
  # declarations including nested ones. Both are correct counts of different things.
  # The "6 files" vs "3 files" discrepancy for 9daa910 — commit message counted all modified files
  # with test content; script counts only net-new files via --diff-filter=A.
  # ---------------------------------------------------------------------------

  # Test 7: Story 104.2 feat commit (9b26306) — enrich AdvertisingDailyData
  local t7_output t7_rc
  t7_output=$(cd "$SCRIPT_DIR/.." && bash "$0" 9b26306 9b26306~1 2>&1) && t7_rc=0 || t7_rc=$?
  if echo "$t7_output" | grep -q "not a valid commit"; then
    echo -e "  [SKIP]  Test 7: commit 9b26306 not reachable (shallow clone?)"
    ((skip++))
  elif [[ $t7_rc -eq 0 ]] && echo "$t7_output" | grep -qF "+4 new test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 7: Story 104.2 feat 9b26306 → +4 new test cases (verified)"
    ((pass++))
  elif [[ $t7_rc -eq 0 ]]; then
    echo -e "  ${RED}[FAIL]${NC} Test 7: 9b26306 expected +4 new test cases, got: $(echo "$t7_output" | grep 'new test cases')"
    ((fail++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 7: script error on 9b26306: $t7_output"
    ((fail++))
  fi

  # Test 8: Story 106.1 feat commit (2218b34) — preserve net_profit null semantics
  local t8_output t8_rc
  t8_output=$(cd "$SCRIPT_DIR/.." && bash "$0" 2218b34 2218b34~1 2>&1) && t8_rc=0 || t8_rc=$?
  if echo "$t8_output" | grep -q "not a valid commit"; then
    echo -e "  [SKIP]  Test 8: commit 2218b34 not reachable (shallow clone?)"
    ((skip++))
  elif [[ $t8_rc -eq 0 ]] && echo "$t8_output" | grep -qF "+2 new test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 8: Story 106.1 feat 2218b34 → +2 new test cases (verified)"
    ((pass++))
  elif [[ $t8_rc -eq 0 ]]; then
    echo -e "  ${RED}[FAIL]${NC} Test 8: 2218b34 expected +2 new test cases, got: $(echo "$t8_output" | grep 'new test cases')"
    ((fail++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 8: script error on 2218b34: $t8_output"
    ((fail++))
  fi

  # Test 9: Story 108.2 feat commit (d15b164) — commit message claimed "11 new tests"
  # Script actual: +4 new test files, +26 new test cases (counts all nested it()/test() calls)
  local t9_output t9_rc
  t9_output=$(cd "$SCRIPT_DIR/.." && bash "$0" d15b164 d15b164~1 2>&1) && t9_rc=0 || t9_rc=$?
  if echo "$t9_output" | grep -q "not a valid commit"; then
    echo -e "  [SKIP]  Test 9: commit d15b164 not reachable (shallow clone?)"
    ((skip++))
  elif [[ $t9_rc -eq 0 ]] && echo "$t9_output" | grep -qF "+4 new test files" && echo "$t9_output" | grep -qF "+26 new test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 9: Story 108.2 feat d15b164 → +4 files +26 cases (msg claimed '11 new tests' — drift confirmed)"
    ((pass++))
  elif [[ $t9_rc -eq 0 ]]; then
    echo -e "  ${RED}[FAIL]${NC} Test 9: d15b164 expected +4 files +26 cases, got: $t9_output"
    ((fail++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 9: script error on d15b164: $t9_output"
    ((fail++))
  fi

  # Test 10: commit 9daa910 (Stories 108.4+108.5) — message claimed "+28 new across 6 files"
  # Script actual: +3 new test files, +36 new test cases, -4 removed
  local t10_output t10_rc
  t10_output=$(cd "$SCRIPT_DIR/.." && bash "$0" 9daa910 9daa910~1 2>&1) && t10_rc=0 || t10_rc=$?
  if echo "$t10_output" | grep -q "not a valid commit"; then
    echo -e "  [SKIP]  Test 10: commit 9daa910 not reachable (shallow clone?)"
    ((skip++))
  elif [[ $t10_rc -eq 0 ]] && echo "$t10_output" | grep -qF "+3 new test files" && echo "$t10_output" | grep -qF "+36 new test cases"; then
    echo -e "  ${GREEN}[PASS]${NC} Test 10: commit 9daa910 → +3 files +36 cases (msg claimed '+28 across 6 files' — drift confirmed)"
    ((pass++))
  elif [[ $t10_rc -eq 0 ]]; then
    echo -e "  ${RED}[FAIL]${NC} Test 10: 9daa910 expected +3 files +36 cases, got: $t10_output"
    ((fail++))
  else
    echo -e "  ${RED}[FAIL]${NC} Test 10: script error on 9daa910: $t10_output"
    ((fail++))
  fi

  echo ""
  if [[ $fail -eq 0 ]]; then
    if [[ $skip -gt 0 ]]; then
      echo -e "${GREEN}All $pass passed, $skip skipped (commit hashes unreachable — shallow clone?)${NC}"
    else
      echo -e "${GREEN}All $pass self-tests passed${NC}"
    fi
    exit 0
  else
    echo -e "${RED}$fail self-test(s) failed, $pass passed, $skip skipped${NC}"
    exit 1
  fi
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

if [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--self-test" ]]; then
  self_test
fi

if [[ $# -eq 0 ]]; then
  echo -e "${RED}ERROR: commit hash required${NC}" >&2
  usage >&2
  exit 2
fi

run_count "${1}" "${2:-${1}~1}"
