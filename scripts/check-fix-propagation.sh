#!/usr/bin/env bash
# Fix-block propagation validator — Story 97.1-FE
#
# Greps for an EXACT phrase across given files; exits 1 if any hit found,
# 0 if zero hits. Intended use: after applying a fix that modifies prose /
# numbers / citations / quoted phrases, run this script with the BEFORE
# phrase + the list of story-related files to confirm no untouched
# occurrences remain in parallel locations.
#
# Empirical motivation: 11+ recurrence chain across Epics 94-96 (Epic 95-FE
# retro § C-1 + Epic 96-FE retro § C-6). Even authors who explicitly claim
# "I proactively re-scanned" miss occurrences (Story 95.3 most damning).
# Mechanical grep step is the structural countermeasure.
#
# Usage:
#   scripts/check-fix-propagation.sh "<BEFORE_PHRASE>" <file1> [file2 ...]
#   scripts/check-fix-propagation.sh --self-test
#   scripts/check-fix-propagation.sh --help
#
# Exit codes:
#   0 = phrase NOT found in any input file (fix is fully propagated)
#   1 = phrase still present in at least one file (untouched occurrences listed)
#   2 = usage error (missing args, invalid invocation)

set -euo pipefail

export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ------------------------------------------------------------------------------
# Help / usage

print_usage() {
  cat <<'EOF'
Usage:
  scripts/check-fix-propagation.sh "<BEFORE_PHRASE>" <file1> [file2 ...]
  scripts/check-fix-propagation.sh --self-test
  scripts/check-fix-propagation.sh --help

Exits 0 if BEFORE_PHRASE is NOT present in any input file (fix propagated).
Exits 1 if BEFORE_PHRASE is still present in at least one file (untouched
occurrences listed with file:line).

Examples:
  # After renaming "the file count was 20" → "the file count was 128",
  # confirm no untouched occurrences remain across story file + Debug Log:
  scripts/check-fix-propagation.sh "the file count was 20" \
    _bmad-output/implementation-artifacts/96-16-fe-*.md

  # Multi-file check with mixed paths:
  scripts/check-fix-propagation.sh "old_phrase" \
    CLAUDE.md docs/process/note.md src/components/X.tsx
EOF
}

# ------------------------------------------------------------------------------
# Core check function — grep phrase across given files; print hits + return status

check_phrase() {
  local phrase="$1"
  shift
  local hits=0
  local missing=0
  local total=$#
  local file

  for file in "$@"; do
    if [[ ! -f "$file" ]]; then
      # Warn on missing files — silently skipping masks typo'd paths and glob expansions
      # to no-match, which would otherwise produce a false PASS (Story 97.1-FE 1st-pass H-3 fix).
      echo "WARN: file not found, skipping: $file" >&2
      missing=$((missing + 1))
      continue
    fi
    # -F: fixed string (no regex interpretation), -n: line numbers, -H: filename.
    # Use --: prevents phrase starting with '-' from being treated as a flag.
    if grep -F -n -H -- "$phrase" "$file"; then
      hits=$((hits + 1))
    fi
  done

  # H-3 fix: if EVERY input file was missing, the script never actually checked
  # anything — exit 2 (usage error) rather than 0 (false PASS).
  if [[ $missing -eq $total && $total -gt 0 ]]; then
    echo "ERROR: all $total input files missing — nothing checked" >&2
    return 2
  fi

  if [[ $hits -eq 0 ]]; then
    return 0
  else
    return 1
  fi
}

# ------------------------------------------------------------------------------
# Self-tests — covers spec-mandated scenarios from Story 97.1-FE AC-3 plus
# defense-in-depth cases added during 1st-pass review:
#   (1) match-fail              — phrase present in 1 file → return 1, prints hit
#   (2) no-match-pass           — phrase absent in all files → return 0, no output
#   (3) multi-file-mixed-fail   — phrase in some files, absent in others → return 1
#   (4) leading-dash phrase     — `--` separator stops grep flag parsing (Story 97.1-FE original AC-3 + 1)
#   (5) all-files-missing-error — every input file missing → return 2 (1st-pass H-3 fix)
#   (6) empty-phrase-error      — empty phrase argument → return 2 (1st-pass M-3 fix)

run_self_tests() {
  local rc tmpdir
  tmpdir="$(mktemp -d -t check-fix-propagation-selftest.XXXXXX)"
  # 1st-pass M-2 fix: EXIT trap (not RETURN) — RETURN doesn't fire on `exit`,
  # which would leak the tmpdir on test failure. EXIT fires reliably.
  # Double-quote the trap body so $tmpdir expands AT TRAP-INSTALLATION TIME — the
  # path string is captured into the trap body verbatim, so the trap body at fire
  # time is e.g. `rm -rf "/tmp/check-fix-propagation-selftest.XXXXXX"`. This means
  # tmpdir's variable scope at fire time is irrelevant; `local` is fine because the
  # value is already substituted into the trap. (Corrected during 2nd-pass M2-3 review.)
  trap "rm -rf \"$tmpdir\"" EXIT

  local pass=0
  local fail=0

  # Helper: run check_phrase, capture exit code, suppress output.
  # Disables `set -e` for the call so non-zero exit codes don't kill the script.
  run_check() {
    local _rc
    set +e
    check_phrase "$@" >/dev/null 2>&1
    _rc=$?
    set -e
    echo "$_rc"
  }

  # Test 1: match-fail (expect rc=1)
  echo "the file count was 20" >"$tmpdir/match.txt"
  rc=$(run_check "the file count was 20" "$tmpdir/match.txt")
  if [[ "$rc" == "1" ]]; then
    echo "PASS: test 1 (match-fail) returned 1 as expected"
    pass=$((pass + 1))
  else
    echo "FAIL: test 1 (match-fail) returned $rc; expected 1"
    fail=$((fail + 1))
  fi

  # Test 2: no-match-pass (expect rc=0)
  echo "the file count was 128" >"$tmpdir/no-match.txt"
  rc=$(run_check "the file count was 20" "$tmpdir/no-match.txt")
  if [[ "$rc" == "0" ]]; then
    echo "PASS: test 2 (no-match-pass) returned 0 as expected"
    pass=$((pass + 1))
  else
    echo "FAIL: test 2 (no-match-pass) returned $rc; expected 0"
    fail=$((fail + 1))
  fi

  # Test 3: multi-file-mixed-fail (expect rc=1)
  echo "phrase here" >"$tmpdir/mixed-yes.txt"
  echo "phrase elsewhere absent" >"$tmpdir/mixed-no.txt"
  rc=$(run_check "phrase here" "$tmpdir/mixed-yes.txt" "$tmpdir/mixed-no.txt")
  if [[ "$rc" == "1" ]]; then
    echo "PASS: test 3 (multi-file-mixed-fail) returned 1 as expected"
    pass=$((pass + 1))
  else
    echo "FAIL: test 3 (multi-file-mixed-fail) returned $rc; expected 1"
    fail=$((fail + 1))
  fi

  # Test 4: leading-dash phrase (expect rc=1; verifies `--` separator)
  echo "--no-such-flag was here" >"$tmpdir/leading-dash.txt"
  rc=$(run_check "--no-such-flag" "$tmpdir/leading-dash.txt")
  if [[ "$rc" == "1" ]]; then
    echo "PASS: test 4 (leading-dash phrase) returned 1 as expected"
    pass=$((pass + 1))
  else
    echo "FAIL: test 4 (leading-dash phrase) returned $rc; expected 1"
    fail=$((fail + 1))
  fi

  # Test 5 (1st-pass H-3 fix): all-files-missing → rc=2 (NOT 0).
  # This is the silent-PASS-when-everything-missing defect class.
  rc=$(run_check "any phrase" "$tmpdir/does-not-exist-1.txt" "$tmpdir/does-not-exist-2.txt")
  if [[ "$rc" == "2" ]]; then
    echo "PASS: test 5 (all-files-missing-error) returned 2 as expected"
    pass=$((pass + 1))
  else
    echo "FAIL: test 5 (all-files-missing-error) returned $rc; expected 2"
    fail=$((fail + 1))
  fi

  # Test 6 (1st-pass M-3 fix): empty phrase → rc=2 (usage error)
  set +e
  bash "$0" "" "$tmpdir/no-match.txt" >/dev/null 2>&1
  rc=$?
  set -e
  if [[ "$rc" == "2" ]]; then
    echo "PASS: test 6 (empty-phrase-error) returned 2 as expected"
    pass=$((pass + 1))
  else
    echo "FAIL: test 6 (empty-phrase-error) returned $rc; expected 2"
    fail=$((fail + 1))
  fi

  echo
  echo "Self-tests: $pass passed, $fail failed"
  if [[ $fail -gt 0 ]]; then
    exit 1
  fi
}

# ------------------------------------------------------------------------------
# Main entry

if [[ $# -eq 0 ]]; then
  print_usage
  exit 2
fi

case "${1:-}" in
  --help | -h)
    print_usage
    exit 0
    ;;
  --self-test)
    run_self_tests
    exit 0
    ;;
  *)
    if [[ $# -lt 2 ]]; then
      echo "ERROR: missing file arguments" >&2
      print_usage >&2
      exit 2
    fi
    phrase="$1"
    shift
    # 1st-pass M-3 fix: empty phrase is a usage error, not a "grep everything" invocation.
    if [[ -z "$phrase" ]]; then
      echo "ERROR: phrase argument is empty" >&2
      print_usage >&2
      exit 2
    fi
    set +e
    check_phrase "$phrase" "$@"
    rc=$?
    set -e
    # check_phrase returns 0 (no hits — propagated), 1 (hits — incomplete), or 2 (all files missing).
    exit "$rc"
    ;;
esac
