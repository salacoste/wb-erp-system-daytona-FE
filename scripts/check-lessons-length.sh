#!/usr/bin/env bash
# check-lessons-length.sh — Story 111.1-FE
#
# Validates that every **Lessons:** line on a story-close row (the row flipping
# Status to `review → done`) has each individual lesson ≤120 chars.
#
# Rule: each lesson ≤120 chars (counted via Python `len()` for Unicode-correct
# char counting). Cyrillic-safe. Matches Story 94.4-FE convention verbatim.
# Story 94.4-FE codified the "≤120 chars" cap on 2026-04-25.
# Char-count is the authoritative rule — byte-count was considered and rejected
# because it over-counts Cyrillic (2 bytes per char) relative to the ≤120 spec
# intent. Resolution documented in Story 111.1-FE F-1/F-2 fix batch.
#
# NOTE: This validator scans `_bmad-output/implementation-artifacts/*.md` which is
# typically gitignored. This makes the validator LOCAL-ONLY DEV TOOLING — not a CI gate.
# Run `npm run check:lessons` locally before flipping a story to `done`. Do NOT
# claim this as an Accepted Baseline in CLAUDE.md unless story files become tracked.
#
# Requires: python3 >= 3.6
#
# Exit codes:
#   0 = all lessons ≤120 chars (or no lessons found, or story is in allowlist)
#   1 = one or more lessons exceed 120 chars
#
# Usage:
#   bash scripts/check-lessons-length.sh                  # scan full corpus
#   bash scripts/check-lessons-length.sh <path/to/file.md> # single-file mode (for self-test)
#
# Defensive: malformed Change Log lines → stderr warning, skip, continue.
# Missing files / unreadable files → stderr warning, skip, continue.
# Stories without Lessons line → not a violation, skipped silently.
# Lessons row with no (N) markers → stderr warning, skip (exit 0).
# Stories in KNOWN_CARRYOVER_ALLOWLIST → exit 0 with stderr WARN (tracked as
# Epic 111-FE follow-up cleanup target; trimming is future work).

set -euo pipefail

# Python3 dependency check — required for char-count via len().
# Verify version >= 3.6 (not just availability) — f-strings and named groups require 3.6+.
if ! command -v python3 >/dev/null 2>&1; then
  echo "WARN: python3 not available — check-lessons-length.sh requires Python 3.6+. Skipping." >&2
  exit 0
fi
PYTHON_VERSION_OK=$(python3 -c 'import sys; print("ok" if sys.version_info >= (3, 6) else "fail")' 2>/dev/null || echo "fail")
if [[ "$PYTHON_VERSION_OK" != "ok" ]]; then
  echo "WARN: python3 < 3.6 detected — check-lessons-length.sh requires 3.6+. Skipping." >&2
  exit 0
fi

export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARTIFACTS_DIR="$PROJECT_ROOT/_bmad-output/implementation-artifacts"

MAX_CHARS=120
VIOLATIONS=0
FILES_SCANNED=0
LINES_CHECKED=0

# ------------------------------------------------------------------------------
# KNOWN_CARRYOVER_ALLOWLIST — stories with Lessons that exceed the 120-char cap
# but predate the Story 94.4-FE convention (codified 2026-04-25) being enforced
# by this validator. These stories are tracked as Epic 111-FE follow-up cleanup
# targets; trimming them retroactively is deferred to avoid attestation churn on
# closed stories.
#
# All 16 entries were verified as genuine violations (confirmed by removing the
# former date-gate and re-scanning the corpus — Story 111.1-FE F-1 fix).
# Each story closed on or after 2026-04-25, so they post-date the rule's origin
# but predate this validator's existence.
# ------------------------------------------------------------------------------
KNOWN_CARRYOVER_ALLOWLIST=(
  "96-1-fe-fix-usepreliminarytax-response-shape-enum.md"
  "96-12-fe-fbs-csv-export-async-polling-flow.md"
  "96-16-fe-remove-redundant-defensive-markers-backend-closures.md"
  "96-17-fe-test-only-seed-endpoint-integration-e2e-fixtures.md"
  "96-2-fe-unit-economics-query-param-view-by.md"
  "97-1-fe-pattern-4-fix-block-propagation-discipline.md"
  "97-2-fe-pattern-4-authoritative-source-citation-discipline.md"
  "97-3-fe-api-client-rate-limit-status-code-coverage.md"
  "97-4-fe-attestation-drift-chain-claude-md-meta-pattern.md"
  "97-5-fe-pattern-4-multi-tenant-cabinet-isolation-discipline.md"
  "98-1-fe-eslint-cap-tightening-400-target.md"
  "109-1-fe-model-type-selector-enriched-fields.md"
  "109-2-fe-forecast-chart-confidence-band.md"
  "109-3-fe-model-list-section.md"
  "109-4-fe-model-training-trigger-polling.md"
  "109-5-fe-model-performance-detail-mape-trend.md"
)

is_in_allowlist() {
  local basename="$1"
  for entry in "${KNOWN_CARRYOVER_ALLOWLIST[@]}"; do
    if [[ "$entry" == "$basename" ]]; then
      return 0
    fi
  done
  return 1
}

# Temp dir for the Python helper script (created once, cleaned on EXIT).
_LESSONS_TMPDIR="$(mktemp -d -t check-lessons.XXXXXX)"
trap 'rm -rf "$_LESSONS_TMPDIR"' EXIT

# ------------------------------------------------------------------------------
# extract_lessons_from_line FILE LINENUM LINE
# Parses the **Lessons:** content from a close-row table line and checks each
# lesson's char-length. Updates global VIOLATIONS and LINES_CHECKED.
#
# Splitting strategy: use Python3 for reliable lesson extraction.
# The (N) markers are split points; each lesson is the text between adjacent
# markers. Pure-bash sed splitting is fragile when lesson text contains ". (2)"
# or similar substrings — Python's re.split is deterministic.
# The regex requires (N) to be at start of content or after whitespace+dot to
# avoid splitting on embedded "(2)" substrings within lesson text.

extract_lessons_from_line() {
  local file="$1"
  local linenum="$2"
  local line="$3"

  # Use python3 to extract lesson char-lengths.
  # Write the Python script to a temp file to avoid heredoc-inside-$() quoting issues
  # (single-quoted <<'PYEOF' is NOT honored inside $() — bash expands the body).
  local py_script="$_LESSONS_TMPDIR/extract_lessons.py"
  if [[ ! -f "$py_script" ]]; then
    # Create once per script invocation (reused across calls).
    cat > "$py_script" << 'ENDPY'
import sys, re

filepath = sys.argv[1]
linenum  = int(sys.argv[2])

try:
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    if linenum < 1 or linenum > len(lines):
        sys.exit(0)
    line = lines[linenum - 1]
except Exception:
    sys.exit(0)

# No date-gate: the 120-char cap is enforced universally per Story 94.4-FE
# (codified 2026-04-25). Pre-existing violations in closed stories are handled
# by the KNOWN_CARRYOVER_ALLOWLIST in the shell wrapper — they never reach
# this Python helper. Template placeholder dates (YYYY-MM-DD) are still skipped
# because they represent unfilled templates, not real close rows.
date_m = re.match(r'\|\s*(20\d{2}-\d{2}-\d{2})', line)
if not date_m:
    # No parseable real date (e.g., template placeholder "YYYY-MM-DD") — skip silently.
    sys.exit(0)

m = re.search(r'\*\*Lessons:\*\*\s*(.*)', line)
if not m:
    sys.exit(0)

raw = m.group(1)
raw = re.sub(r'\s*\|\s*$', '', raw)          # strip trailing table-cell "|"
raw = re.sub(r'[. ]*Status:.*$', '', raw)    # strip ". Status: review → done" suffix
raw = raw.strip()
if not raw:
    sys.exit(0)

# Check for malformed Lessons: no (N) markers at all → warn + skip (AC-8).
markers = re.findall(r'\(\d+\)', raw)
if not markers:
    print('WARN: malformed Lessons row (no (N) markers) — skipping', file=sys.stderr)
    sys.exit(0)

# Split on (N) markers only at lesson boundaries (start or after ". ").
# This prevents splitting on embedded "(2)" substrings within lesson text.
# Pattern: optional "." + whitespace + "(digits)" + required whitespace (lesson start).
parts = re.split(r'(?:^|(?<=\. ))\(\d+\)\s+', raw)
parts = [p.strip().rstrip('. ').strip() for p in parts if p.strip()]

# F-3: detect marker-vs-parts mismatch (malformed row with missing period before marker).
# markers count may exceed parts count when a (N) marker appears inside lesson text
# but is NOT preceded by ". " — regex doesn't split it, so it appears inside a part.
# Emit WARN but do not fail (defensive per AC-8).
if len(markers) > len(parts):
    print(
        f'WARN: malformed Lessons row (missing period before marker? markers={len(markers)}, parts={len(parts)}) — skipping',
        file=sys.stderr
    )
    sys.exit(0)

MAX = 120
for i, lesson in enumerate(parts, 1):
    n = len(lesson)  # char-count (Unicode-correct via Python len())
    status = 'VIOLATION' if n > MAX else 'OK'
    print(i, n, status, lesson)
ENDPY
  fi

  local py_output
  py_output="$(python3 "$py_script" "$file" "$linenum")" || true

  if [[ -z "$py_output" ]]; then
    return
  fi

  LINES_CHECKED=$((LINES_CHECKED + 1))

  # Parse python output: "LESSON_NUM CHAR_LEN STATUS LESSON_TEXT"
  while IFS= read -r py_line; do
    local lesson_num char_len status lesson_text
    lesson_num="$(printf '%s' "$py_line" | cut -d' ' -f1)"
    char_len="$(printf '%s' "$py_line" | cut -d' ' -f2)"
    status="$(printf '%s' "$py_line" | cut -d' ' -f3)"
    lesson_text="$(printf '%s' "$py_line" | cut -d' ' -f4-)"
    if [[ "$status" == "VIOLATION" ]]; then
      echo "$file:$linenum: lesson $lesson_num is $char_len chars (exceeds ${MAX_CHARS}-char cap): \"$lesson_text\"" >&2
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done <<< "$py_output"
}

# ------------------------------------------------------------------------------
# scan_file FILE
# Scans a single file for Lessons lines on close-rows.

scan_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "WARN: file not found, skipping: $file" >&2
    return
  fi

  if [[ ! -r "$file" ]]; then
    echo "WARN: file not readable, skipping: $file" >&2
    return
  fi

  local basename
  basename="$(basename "$file")"

  # Check allowlist before scanning. Carry-over stories are silently exempt with a
  # stderr WARN so the CI output is traceable without blocking the gate.
  if is_in_allowlist "$basename"; then
    echo "WARN: $basename is in KNOWN_CARRYOVER_ALLOWLIST — lessons-length violations not enforced (Epic 111-FE follow-up cleanup target). Skipping." >&2
    FILES_SCANNED=$((FILES_SCANNED + 1))
    return
  fi

  FILES_SCANNED=$((FILES_SCANNED + 1))

  local linenum=0
  local line

  while IFS= read -r line || [[ -n "$line" ]]; do
    linenum=$((linenum + 1))

    # Only process lines that are close-rows: must be Markdown table rows (start with "|")
    # AND contain both "review → done" and "**Lessons:**".
    # "review → done" is the canonical Status flip marker per Story 94.4-FE.
    # Lines with "Lessons:" but NOT "review → done" are skipped (earlier rows, template rows).
    # Requiring a leading "|" prevents false-positive matches on task-checkbox lines
    # like "- [x] Final Change Log row (review → done close) carries **Lessons:**".
    if printf '%s' "$line" | grep -q '^\s*|' && \
       printf '%s' "$line" | grep -qF 'review → done' && \
       printf '%s' "$line" | grep -qF '**Lessons:**'; then
      extract_lessons_from_line "$file" "$linenum" "$line"
    fi

  done < "$file"
}

# ------------------------------------------------------------------------------
# Main

# Single-file mode: accept an explicit path argument (for self-test invocations).
if [[ $# -eq 1 && "$1" != "--help" ]]; then
  scan_file "$1"
  echo "Scanned: $FILES_SCANNED files. Lesson lines checked: $LINES_CHECKED. Violations: $VIOLATIONS."
  if [[ "$VIOLATIONS" -gt 0 ]]; then
    exit 1
  fi
  exit 0
fi

# Full-corpus mode: scan _bmad-output/implementation-artifacts/*.md
if [[ ! -d "$ARTIFACTS_DIR" ]]; then
  echo "WARN: artifacts directory not found: $ARTIFACTS_DIR" >&2
  echo "Scanned: 0 files. Lesson lines checked: 0. Violations: 0."
  exit 0
fi

# Use find for null-safety (no glob expansion issues on empty dir).
while IFS= read -r -d '' file; do
  scan_file "$file"
done < <(find "$ARTIFACTS_DIR" -maxdepth 1 -name "*.md" -print0 | sort -z)

echo "Scanned: $FILES_SCANNED files. Lesson lines checked: $LINES_CHECKED. Violations: $VIOLATIONS."

if [[ "$VIOLATIONS" -gt 0 ]]; then
  exit 1
fi
exit 0
