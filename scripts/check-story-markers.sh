#!/usr/bin/env bash
# check-story-markers.sh — HALT vs Prose Tier B (halt-vs-prose-investigation-2026-05.md § Tier B #3)
#
# Validates that story files in _bmad-output/implementation-artifacts/ have required
# structural markers before a `done` status transition:
#   1. ≥2 `### Post-Nth-pass-review fixes` sub-headings (2-pass review discipline, Story 94.3-FE)
#   2. Final Change Log row contains `**Lessons:**` (Story 94.4-FE)
#   3. File List section exists and is non-empty (Story 86.1-FE)
#
# Exit codes:
#   0 = all markers present (or story not at `done` status)
#   1 = one or more required markers missing
#
# Usage:
#   bash scripts/check-story-markers.sh                  # scan full corpus
#   bash scripts/check-story-markers.sh <path/to/file.md> # single-file mode
#   bash scripts/check-story-markers.sh --self-test       # run self-test

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ARTIFACTS_DIR="$PROJECT_ROOT/_bmad-output/implementation-artifacts"

VIOLATIONS=0
FILES_SCANNED=0

# --- Self-test ---
if [[ $# -eq 1 && "$1" == "--self-test" ]]; then
  TMPDIR="$(mktemp -d -t check-story-markers.XXXXXX)"
  trap 'rm -rf "$TMPDIR"' EXIT

  # Test 1: done story with all markers → passes
  cat > "$TMPDIR/good-story.md" << 'EOF'
# Good Story

## Status: done

## File List
- src/foo.ts

## Change Log
| 2026-01-01 | Post-1st-pass-review fixes (2026-01-01): Fixed stuff. |
| 2026-01-02 | Post-2nd-pass-review fixes (2026-01-02): Fixed more. Status: review → done. **Lessons:** (1) good lesson |
EOF

  # Test 2: done story missing 2nd pass → fails
  cat > "$TMPDIR/bad-passes.md" << 'EOF'
# Bad Story

## Status: done

## File List
- src/foo.ts

## Change Log
| 2026-01-01 | Post-1st-pass-review fixes (2026-01-01): Fixed stuff. Status: review → done. **Lessons:** (1) good lesson |
EOF

  # Test 3: done story missing Lessons → fails
  cat > "$TMPDIR/bad-lessons.md" << 'EOF'
# Bad Lessons

## Status: done

## File List
- src/foo.ts

## Change Log
| 2026-01-01 | Post-1st-pass-review fixes (2026-01-01): Fixed stuff. |
| 2026-01-02 | Post-2nd-pass-review fixes (2026-01-02): Fixed more. Status: review → done. done |
EOF

  # Test 4: done story missing File List → fails
  cat > "$TMPDIR/bad-filelist.md" << 'EOF'
# Bad File List

## Status: done

## Change Log
| 2026-01-01 | Post-1st-pass-review fixes (2026-01-01): Fixed stuff. |
| 2026-01-02 | Post-2nd-pass-review fixes (2026-01-02): Fixed more. Status: review → done. **Lessons:** (1) good lesson |
EOF

  # Test 5: non-done story → passes (not validated)
  cat > "$TMPDIR/wip-story.md" << 'EOF'
# WIP Story

## Status: in-progress
EOF

  PASSED=0
  FAILED=0

  # Run checks
  if bash "$SCRIPT_DIR/check-story-markers.sh" "$TMPDIR/good-story.md" >/dev/null 2>&1; then
    echo "PASS: good-story (all markers present)"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL: good-story should pass"
    FAILED=$((FAILED + 1))
  fi

  if bash "$SCRIPT_DIR/check-story-markers.sh" "$TMPDIR/bad-passes.md" >/dev/null 2>&1; then
    echo "FAIL: bad-passes should fail (only 1 review pass)"
    FAILED=$((FAILED + 1))
  else
    echo "PASS: bad-passes correctly rejected (only 1 review pass)"
    PASSED=$((PASSED + 1))
  fi

  if bash "$SCRIPT_DIR/check-story-markers.sh" "$TMPDIR/bad-lessons.md" >/dev/null 2>&1; then
    echo "FAIL: bad-lessons should fail (missing Lessons)"
    FAILED=$((FAILED + 1))
  else
    echo "PASS: bad-lessons correctly rejected (missing Lessons)"
    PASSED=$((PASSED + 1))
  fi

  if bash "$SCRIPT_DIR/check-story-markers.sh" "$TMPDIR/bad-filelist.md" >/dev/null 2>&1; then
    echo "FAIL: bad-filelist should fail (missing File List)"
    FAILED=$((FAILED + 1))
  else
    echo "PASS: bad-filelist correctly rejected (missing File List)"
    PASSED=$((PASSED + 1))
  fi

  if bash "$SCRIPT_DIR/check-story-markers.sh" "$TMPDIR/wip-story.md" >/dev/null 2>&1; then
    echo "PASS: wip-story correctly skipped (not done)"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL: wip-story should pass (not done, skipped)"
    FAILED=$((FAILED + 1))
  fi

  echo ""
  echo "Self-test: $PASSED passed, $FAILED failed"
  if [[ $FAILED -gt 0 ]]; then exit 1; fi
  exit 0
fi

# --- Single file check ---
check_file() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "WARN: file not found, skipping: $file" >&2
    return
  fi

  FILES_SCANNED=$((FILES_SCANNED + 1))

  # Only validate stories with Status: done (case-insensitive, with surrounding whitespace or EOL)
  if ! grep -qiE '^\s*##?\s*Status:.*\bdone\b' "$file"; then
    return
  fi

  local basename
  basename="$(basename "$file")"
  local file_violations=0

  # Check 1: ≥2 "Post-Nth-pass-review fixes" entries (heading OR table row)
  local pass_count
  pass_count="$(grep -cE 'Post-[0-9]+(st|nd|rd|th)-pass(-code)?-review\s+fixes' "$file" 2>/dev/null || true)"
  pass_count="$(printf '%s' "$pass_count" | tr -d '[:space:]')"
  : "${pass_count:=0}"
  if [[ "$pass_count" -lt 2 ]]; then
    echo "$file: only $pass_count review-pass entries, need ≥2 (Story 94.3-FE)" >&2
    file_violations=$((file_violations + 1))
  fi

  # Check 2: Final Change Log row contains **Lessons:**
  # Find the last table row (starts with |) containing "review → done" and check for **Lessons:**
  local last_close_line
  last_close_line="$(grep -E '^\s*\|.*review → done' "$file" | tail -1 || true)"
  if [[ -z "$last_close_line" ]]; then
    # No close row found — might be a done story with different format. Skip.
    return
  fi
  if ! printf '%s' "$last_close_line" | grep -qF '**Lessons:**'; then
    echo "$file: final close-row missing **Lessons:** (Story 94.4-FE)" >&2
    file_violations=$((file_violations + 1))
  fi

  # Check 3: File List section exists and has content
  # Look for "## File List" heading followed by at least one non-empty, non-heading line
  local file_list_start
  file_list_start="$(grep -nE '^##\s+File\s+List' "$file" | head -1 | cut -d: -f1 || true)"
  if [[ -z "$file_list_start" ]]; then
    echo "$file: missing File List section (Story 86.1-FE)" >&2
    file_violations=$((file_violations + 1))
  else
    # Check if the section has any content (lines after heading before next ## heading)
    local has_content=false
    local total_lines
    total_lines="$(wc -l < "$file" | tr -d '[:space:]')"
    local i=$((file_list_start + 1))
    while [[ $i -le $total_lines ]]; do
      local line
      line="$(sed -n "${i}p" "$file")"
      # Stop at next ## heading
      if printf '%s' "$line" | grep -qE '^##\s'; then
        break
      fi
      # Non-empty, non-whitespace-only line = content
      if [[ -n "$(printf '%s' "$line" | tr -d '[:space:]')" ]]; then
        has_content=true
        break
      fi
      i=$((i + 1))
    done
    if [[ "$has_content" != "true" ]]; then
      echo "$file: File List section is empty (Story 86.1-FE)" >&2
      file_violations=$((file_violations + 1))
    fi
  fi

  VIOLATIONS=$((VIOLATIONS + file_violations))
}

# --- Main ---

# Single-file mode
if [[ $# -eq 1 && "$1" != "--help" ]]; then
  check_file "$1"
  echo "Scanned: $FILES_SCANNED files. Violations: $VIOLATIONS."
  if [[ "$VIOLATIONS" -gt 0 ]]; then exit 1; fi
  exit 0
fi

# Full-corpus mode
if [[ ! -d "$ARTIFACTS_DIR" ]]; then
  echo "WARN: artifacts directory not found: $ARTIFACTS_DIR" >&2
  echo "Scanned: 0 files. Violations: 0."
  exit 0
fi

while IFS= read -r -d '' file; do
  check_file "$file"
done < <(find "$ARTIFACTS_DIR" -maxdepth 1 -name "*.md" -print0 | sort -z)

echo "Scanned: $FILES_SCANNED files. Violations: $VIOLATIONS."

if [[ "$VIOLATIONS" -gt 0 ]]; then
  exit 1
fi
exit 0
