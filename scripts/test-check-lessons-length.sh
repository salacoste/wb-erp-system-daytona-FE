#!/usr/bin/env bash
# test-check-lessons-length.sh — Story 111.1-FE
# Self-tests for check-lessons-length.sh.
# Mirrors scripts/test-anti-pattern-8-rule.sh structure (Story 105.1-FE precedent).
#
# Each test: create a temp file with a synthetic Change Log close-row,
# run `bash scripts/check-lessons-length.sh <tempfile>`, assert exit code.
#
# Requires: python3 >= 3.6
#
# Char-count note (Story 111.1-FE F-1 fix — switched from byte-count):
#   The validator uses char-count (Python len()) — NOT byte-count.
#   80 Cyrillic chars = 160 bytes BUT only 80 chars → should exit 0 (under 120 char cap).
#   This is the F-1 fix: char-count matches the Story 94.4-FE "≤120 chars" spec verbatim.
#   Test case 7 (80-char Cyrillic) expects exit 0, NOT exit 1.
#
# Exit 0 on all-pass, exit 1 on any failure.

set -euo pipefail

# Python3 dependency check — verify version >= 3.6 (not just availability).
if ! command -v python3 >/dev/null 2>&1; then
  echo "WARN: python3 not available — test-check-lessons-length.sh requires Python 3.6+. Skipping." >&2
  exit 0
fi
PYTHON_VERSION_OK=$(python3 -c 'import sys; print("ok" if sys.version_info >= (3, 6) else "fail")' 2>/dev/null || echo "fail")
if [[ "$PYTHON_VERSION_OK" != "ok" ]]; then
  echo "WARN: python3 < 3.6 detected — test-check-lessons-length.sh requires 3.6+. Skipping." >&2
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR="$SCRIPT_DIR/check-lessons-length.sh"

TMPDIR_LESSONS="$(mktemp -d -t check-lessons-self-test.XXXXXX)"
trap "rm -rf \"$TMPDIR_LESSONS\"" EXIT

PASS=0
FAIL=0

# ------------------------------------------------------------------------------
# Helper: make_story_file FILENAME LESSON_CONTENT
# Creates a temp file with a minimal Change Log table row that flips status to
# "review → done" and includes **Lessons:** with the given content.

make_story_file() {
  local filename="$1"
  local lesson_content="$2"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture
Status: in-progress

## Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created. |
| 2026-05-19 | Implementation complete. Status: review → done. **Lessons:** $lesson_content |
EOF

  printf '%s' "$filepath"
}

# Helper: make_story_file_no_lessons FILENAME
# Creates a temp file with a close-row but NO **Lessons:** marker.
make_story_file_no_lessons() {
  local filename="$1"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture — no Lessons line
Status: in-progress

## Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created. |
| 2026-05-19 | Implementation complete. Status: review → done. |
EOF

  printf '%s' "$filepath"
}

# Helper: make_story_file_no_close_row FILENAME
# Creates a temp file with a **Lessons:** line but NOT on a close-row.
make_story_file_no_close_row() {
  local filename="$1"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture — Lessons line not on a close-row
Status: in-progress

## Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created. |
| 2026-05-19 | Intermediate fix. **Lessons:** (1) Some mid-story note. |
EOF

  printf '%s' "$filepath"
}

# Helper: make_story_file_status_after_lessons FILENAME LESSON_CONTENT
# Creates a temp file where "Status: review → done" appears AFTER **Lessons:** text.
# Some story files use this word order in the close-row cell.
make_story_file_status_after_lessons() {
  local filename="$1"
  local lesson_content="$2"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture — Status appears after Lessons in close-row
Status: in-progress

## Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created. |
| 2026-05-19 | **Lessons:** $lesson_content Status: review → done. |
EOF

  printf '%s' "$filepath"
}

# Helper: make_story_file_malformed_missing_period FILENAME
# Creates a close-row where a (N) marker is NOT preceded by ". " — the regex
# cannot split on it, causing marker count > parts count.
# Example: "(1) First lesson without period (2) Second." — no ". " before (2).
make_story_file_malformed_missing_period() {
  local filename="$1"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture — Lessons marker missing period before (2)
Status: in-progress

## Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created. |
| 2026-05-19 | Implementation complete. Status: review → done. **Lessons:** (1) First lesson without period (2) Second lesson here. |
EOF

  printf '%s' "$filepath"
}

# Helper: make_story_file_no_markers FILENAME
# Creates a temp file with a close-row + **Lessons:** but NO (N) markers.
make_story_file_no_markers() {
  local filename="$1"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture — Lessons without (N) markers
Status: in-progress

## Change Log

| Date | Change |
|---|---|
| 2026-05-19 | Story created. |
| 2026-05-19 | Implementation complete. Status: review → done. **Lessons:** Just some prose with no numbered markers. |
EOF

  printf '%s' "$filepath"
}

# ------------------------------------------------------------------------------
# assert_exit CODE LABEL FILE
# Runs the validator on FILE; asserts exit code == CODE.

assert_exit() {
  local expected="$1"
  local label="$2"
  local file="$3"

  local actual
  set +e
  bash "$VALIDATOR" "$file" >/dev/null 2>&1
  actual=$?
  set -e

  if [[ "$actual" -eq "$expected" ]]; then
    echo "  PASS [$label] — expected exit $expected, got $actual"
    PASS=$((PASS + 1))
  else
    echo "  FAIL [$label] — expected exit $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

# assert_exit_with_stderr CODE LABEL FILE EXPECTED_STDERR_PATTERN
# Like assert_exit but also checks that stderr contains a pattern.
assert_exit_with_stderr() {
  local expected="$1"
  local label="$2"
  local file="$3"
  local stderr_pattern="$4"

  local actual stderr_output
  set +e
  # REDIRECTION ORDER LOAD-BEARING: 2>&1 (stderr→stdout) AFTER >/dev/null (stdout→devnull). Captures stderr only. DO NOT REORDER.
  stderr_output="$(bash "$VALIDATOR" "$file" 2>&1 >/dev/null)"
  actual=$?
  set -e

  local stderr_ok=0
  if echo "$stderr_output" | grep -q "$stderr_pattern"; then
    stderr_ok=1
  fi

  if [[ "$actual" -eq "$expected" && "$stderr_ok" -eq 1 ]]; then
    echo "  PASS [$label] — expected exit $expected + stderr '$stderr_pattern', got both"
    PASS=$((PASS + 1))
  else
    echo "  FAIL [$label] — expected exit $expected (got $actual) + stderr '$stderr_pattern' (found: $stderr_ok)"
    echo "    stderr was: $stderr_output"
    FAIL=$((FAIL + 1))
  fi
}

# ------------------------------------------------------------------------------
echo "=== check-lessons-length.sh self-tests (Story 111.1-FE) ==="
echo ""
echo "--- Positive cases: lessons OVER cap → expect exit 1 ---"

# Test 1: 130-char ASCII lesson → expect exit 1
# 130 'a' chars = 130 chars (well over 120-char cap)
LESSON_130="$(printf '%.0sa' {1..130})"
FILE1="$(make_story_file "pos_130char.md" "(1) ${LESSON_130}.")"
assert_exit 1 "130-char ASCII (130 chars > 120)" "$FILE1"

# Test 2: 121-char ASCII lesson → expect exit 1 (boundary + 1)
LESSON_121="$(printf '%.0sa' {1..121})"
FILE2="$(make_story_file "pos_121char.md" "(1) ${LESSON_121}.")"
assert_exit 1 "121-char ASCII (121 chars > 120)" "$FILE2"

# Test 3: 200-char ASCII lesson → expect exit 1 (far over cap)
LESSON_200="$(printf '%.0sa' {1..200})"
FILE3="$(make_story_file "pos_200char.md" "(1) ${LESSON_200}.")"
assert_exit 1 "200-char ASCII (200 chars > 120)" "$FILE3"

echo ""
echo "--- Negative cases: lessons WITHIN cap → expect exit 0 ---"

# Test 4: 80-char ASCII lesson → expect exit 0 (well under 120 chars)
LESSON_80="$(printf '%.0sa' {1..80})"
FILE4="$(make_story_file "neg_80char.md" "(1) ${LESSON_80}.")"
assert_exit 0 "80-char ASCII (80 chars < 120)" "$FILE4"

# Test 5: 119-char ASCII lesson → expect exit 0 (boundary - 1)
LESSON_119="$(printf '%.0sa' {1..119})"
FILE5="$(make_story_file "neg_119char.md" "(1) ${LESSON_119}.")"
assert_exit 0 "119-char ASCII (119 chars < 120)" "$FILE5"

# Test 6: 120-char ASCII lesson → expect exit 0 (exact boundary, inclusive)
LESSON_120="$(printf '%.0sa' {1..120})"
FILE6="$(make_story_file "neg_120char.md" "(1) ${LESSON_120}.")"
assert_exit 0 "120-char ASCII (120 chars = 120, inclusive)" "$FILE6"

echo ""
echo "--- Cyrillic case: char-count vs byte-count distinction (F-1 switch) ---"

# Test 7: 80-char Russian lesson (2 bytes per Cyrillic char = 160 bytes, but only 80 chars).
# The validator uses CHAR-count (Python len()), so 80 chars < 120 cap → exit 0.
# If it returned exit 1, the validator would be using byte-count — a regression from F-1 fix.
# 'а' is U+0430 CYRILLIC SMALL LETTER A, 2 bytes in UTF-8 but 1 char.
LESSON_CYR="$(printf '%.0sа' {1..80})"  # 80 Cyrillic chars = 160 bytes but 80 chars
FILE7="$(make_story_file "neg_cyrillic_80char_160bytes.md" "(1) ${LESSON_CYR}.")"
assert_exit 0 "80-char Cyrillic (80 chars < 120) — verifies char-count not byte-count" "$FILE7"

echo ""
echo "--- Edge cases: missing/empty Lessons → expect exit 0 ---"

# Test 8: Story file with NO **Lessons:** line at all → expect exit 0
FILE8="$(make_story_file_no_lessons "edge_no_lessons.md")"
assert_exit 0 "No Lessons line in story → exit 0 (not a violation)" "$FILE8"

# Test 9: **Lessons:** on non-close-row (intermediate fix row, no 'review → done') → exit 0
FILE9="$(make_story_file_no_close_row "edge_lessons_not_on_close_row.md")"
assert_exit 0 "Lessons line not on close-row → exit 0 (only close-rows checked)" "$FILE9"

# Test 10: Close-row with empty Lessons content → expect exit 0
FILE10="$(make_story_file "edge_empty_lessons.md" "")"
assert_exit 0 "Empty Lessons content → exit 0 (no lessons to check)" "$FILE10"

# Test 11: Multiple lessons, one of them over cap → expect exit 1
LESSON_OK="$(printf '%.0sa' {1..80})"   # 80 chars — OK
LESSON_BIG="$(printf '%.0sa' {1..130})" # 130 chars — VIOLATION
FILE11="$(make_story_file "pos_multi_one_over.md" "(1) ${LESSON_OK}. (2) ${LESSON_BIG}.")"
assert_exit 1 "Multi-lesson: one OK, one over cap → exit 1" "$FILE11"

# Test 12: Multiple lessons, all within cap → expect exit 0
FILE12="$(make_story_file "neg_multi_all_ok.md" "(1) ${LESSON_OK}. (2) ${LESSON_OK}. (3) ${LESSON_OK}.")"
assert_exit 0 "Multi-lesson: all within cap → exit 0" "$FILE12"

echo ""
echo "--- F-6: word-order variants (Status before/after Lessons) ---"

# Test 13: Status-AFTER-Lessons word order (close-row cell with Lessons first, then Status).
# Some story files use: "| 2026-05-19 | **Lessons:** (1) ... Status: review → done. |"
# Validator must detect "review → done" regardless of position and check Lessons.
FILE13="$(make_story_file_status_after_lessons "edge_status_after_lessons.md" "(1) ${LESSON_OK}. (2) ${LESSON_OK}.")"
assert_exit 0 "Status appears AFTER Lessons in close-row → exit 0 (word order variant)" "$FILE13"

# Test 14: Close-row with "review → done" but NO Lessons content after Status (Status-only).
# Row exists and flips status but omits **Lessons:** entirely — should be exit 0 (not a violation).
FILE14="$(make_story_file_no_lessons "edge_status_only_no_lessons.md")"
assert_exit 0 "Status-only close-row (no **Lessons:** marker) → exit 0 (not a violation)" "$FILE14"

echo ""
echo "--- F-7: embedded (N) substring in lesson text ---"

# Test 15: Lesson containing an embedded "(2)" substring that is NOT a lesson separator.
# The validator regex must NOT split "The constant (2) is used here" into two lessons.
# Expected: 1 lesson total, well under cap → exit 0.
FILE15="$(make_story_file "edge_embedded_paren.md" "(1) The constant (2) is used here and this lesson is under cap.")"
assert_exit 0 "Embedded (2) in lesson text → treated as one lesson, exit 0" "$FILE15"

echo ""
echo "--- F-8: malformed Lessons row (no (N) markers) → warn + exit 0 ---"

# Test 16: Lessons row with prose but no (N) markers.
# Per AC-8: validator warns to stderr but does NOT fail (exits 0).
FILE16="$(make_story_file_no_markers "edge_no_n_markers.md")"
assert_exit_with_stderr 0 "No (N) markers in Lessons → exit 0 + stderr WARN" "$FILE16" "malformed"

echo ""
echo "--- F-3: malformed Lessons (missing period before marker) → warn + exit 0 ---"

# Test 17: Lessons row where (2) marker is NOT preceded by ". " — marker-vs-parts mismatch.
# The split regex requires ". " before (N) to avoid splitting embedded "(N)" substrings.
# When a real marker lacks ". ", markers count > parts count → WARN + exit 0 (defensive).
# Example: "(1) First lesson without period (2) Second." → 2 markers, but split yields 1 part.
FILE17="$(make_story_file_malformed_missing_period "edge_malformed_missing_period.md")"
assert_exit_with_stderr 0 "Missing period before (2) marker → exit 0 + stderr WARN (markers > parts)" "$FILE17" "malformed"

echo ""
echo "--- Test 18 (Story 112.5-FE updated): empty allowlist — formerly-allowlisted story validates normally ---"

# Test 18: A story file whose basename was formerly in KNOWN_CARRYOVER_ALLOWLIST.
# As of Story 112.5-FE, the allowlist is empty — the file is scanned normally.
# Its lesson is 130 chars → exit 1 (validator enforces cap normally, no allowlist bypass).
LESSON_OVER="$(printf '%.0sa' {1..130})"  # 130 chars — over cap
ALLOWLISTED_BASENAME="96-1-fe-fix-usepreliminarytax-response-shape-enum.md"
ALLOWLISTED_FILE="$TMPDIR_LESSONS/$ALLOWLISTED_BASENAME"
cat > "$ALLOWLISTED_FILE" <<EOF
# Story test fixture — formerly-allowlisted story with over-cap lesson (allowlist now empty)
Status: done

## Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Implementation complete. Status: review → done. **Lessons:** (1) ${LESSON_OVER}. |
EOF
assert_exit 1 "Formerly-allowlisted story with 130-char lesson → exit 1 (allowlist now empty, Story 112.5-FE)" "$ALLOWLISTED_FILE"

# ------------------------------------------------------------------------------
echo ""
echo "--- Scan-latest semantic (Story 112.5-FE): multi-close-row files ---"

# Helper: make_story_file_multi_close FILENAME LESSON1 LESSON2
# Creates a temp file with TWO close rows: first row uses LESSON1, second uses LESSON2.
# The scan-latest validator should ONLY check the SECOND (latest) row.
make_story_file_multi_close() {
  local filename="$1"
  local lesson1="$2"
  local lesson2="$3"
  local filepath="$TMPDIR_LESSONS/$filename"

  cat > "$filepath" <<EOF
# Story test fixture — multi-close-row (disclosure-row pattern)
Status: done

## Change Log

| Date | Change |
|---|---|
| 2026-05-01 | Story created. |
| 2026-05-08 | Implementation complete. Status: review → done. **Lessons:** $lesson1 |
| 2026-05-21 | Disclosure row (Story 112.5-FE). Status: review → done. **Lessons:** $lesson2 |
EOF

  printf '%s' "$filepath"
}

# Test 19: Multi-close-row file: latest row in-cap, prior row over-cap → exit 0.
# Scan-latest should see only the SECOND row's (in-cap) lesson and pass.
LESSON_OVER_130="$(printf '%.0sa' {1..130})"   # 130 chars — over cap
LESSON_OK_80="$(printf '%.0sa' {1..80})"        # 80 chars — in cap
FILE19="$(make_story_file_multi_close "multi_latest_ok_prior_over.md" \
  "(1) ${LESSON_OVER_130}." \
  "(1) ${LESSON_OK_80}.")"
assert_exit 0 "Multi-row: latest in-cap (80c), prior over-cap (130c) → exit 0 (scan-latest)" "$FILE19"

# Test 20: Multi-close-row file: latest row over-cap, prior row in-cap → exit 1.
# Scan-latest should see the SECOND row's (over-cap) lesson and fail.
# Violation should be reported on the LATEST row's line number only.
FILE20="$(make_story_file_multi_close "multi_latest_over_prior_ok.md" \
  "(1) ${LESSON_OK_80}." \
  "(1) ${LESSON_OVER_130}.")"
assert_exit 1 "Multi-row: latest over-cap (130c), prior in-cap (80c) → exit 1 (scan-latest, violation on latest)" "$FILE20"

# Test 21: Single-close-row file (legacy): in-cap → exit 0 (regression guard).
# Files with exactly one close row must behave identically to pre-112.5 behavior.
FILE21="$(make_story_file "single_legacy_ok.md" "(1) ${LESSON_OK_80}.")"
assert_exit 0 "Single-row legacy: in-cap (80c) → exit 0 (regression guard)" "$FILE21"

# Test 22: Single-close-row file (legacy): over-cap → exit 1 (regression guard).
# Files with exactly one close row must behave identically to pre-112.5 behavior.
FILE22="$(make_story_file "single_legacy_over.md" "(1) ${LESSON_OVER_130}.")"
assert_exit 1 "Single-row legacy: over-cap (130c) → exit 1 (regression guard)" "$FILE22"

echo ""
echo "--- F-1 fix (Story 112.5-FE): narrative-quoted **Lessons:** in close-row body ---"

# Test 23: Close-row where the change description body contains a narrative reference to
# **Lessons:** BEFORE the real Lessons content. This is the 96-14 pattern:
#   "... L2-1 `**Lessons:**` sub-line removed ... Status: review → done. **Lessons:** (1) Real. (2) Also real."
# Before F-1 fix: re.search matched the FIRST **Lessons:** (narrative, no (N) markers) → WARN.
# After F-1 fix: rfind picks the LAST **Lessons:** (real content) → validates correctly → exit 0.
FILE23="$TMPDIR_LESSONS/narrative_quoted_lessons.md"
cat > "$FILE23" <<'EOF'
# Story test fixture — narrative-quoted **Lessons:** in close-row body (96-14 pattern)
Status: done

## Change Log

| Date | Change |
|---|---|
| 2026-05-08 | Story created. |
| 2026-05-08 | Fix applied: L2-1 `**Lessons:**` sub-line removed from implementation row per convention. Status: review → done. **Lessons:** (1) Real lesson one, under cap. (2) Real lesson two, also under cap. |
EOF
assert_exit 0 "Narrative-quoted **Lessons:** in body → rfind extracts trailing real Lessons, exit 0 (F-1 fix)" "$FILE23"

# ------------------------------------------------------------------------------
echo ""
echo "=== Results: PASS: $PASS / FAIL: $FAIL (total: $((PASS + FAIL))) ==="

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
exit 0
