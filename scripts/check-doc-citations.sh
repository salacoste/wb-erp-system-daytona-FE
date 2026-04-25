#!/usr/bin/env bash
# Doc-Link Validator — Story 89.3-FE
#
# Scans CLAUDE.md + docs/ + _bmad-output/ + backlog/ for backtick-wrapped source
# citations of the form `src/path/to/file.ts:N` or `src/path/to/file.ts:N-M`
# and verifies each:
#   1. The file exists (relative to repo root).
#   2. The end line number (or single line) is within the file's line count.
#
# Exit codes: 0 = all citations resolve, 1 = broken citations found.
#
# Usage:
#   scripts/check-doc-citations.sh          # scan repo
#   scripts/check-doc-citations.sh --self-test   # run built-in self-tests
#
# Added via Epic 88-FE retrospective action item #A — broken citations recurred
# in 3 separate Epic 88 code reviews; this surfaces them at zero cognitive cost.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ------------------------------------------------------------------------------
# Citation regex — requires leading backtick so we don't flag illustrative text
# in prose or code blocks. Matches:
#   `src/foo.ts:42`
#   `src/foo.tsx:42-55`
#   `src/app/(dashboard)/foo.ts:1-10`
# ------------------------------------------------------------------------------
# Citation scope: any single-backtick `src/...` substring is matched, INCLUDING
# substrings embedded inside double-backtick wrappers (``src/foo.ts:42`` is
# matched as the inner `src/foo.ts:42`). Fenced ``` code blocks ``` are
# similarly matched. To exclude demonstrative bad citations from validation,
# add the file to EXCLUDE_PATHS below — DO NOT rely on backtick wrapping.
CITATION_REGEX='`src/[A-Za-z0-9_/()\.\-]+\.(ts|tsx|js|jsx):[0-9]+(-[0-9]+)?`'

# ------------------------------------------------------------------------------
# Scan paths (relative to PROJECT_ROOT). Non-existent paths are silently skipped
# so the script works in any checkout variant.
# ------------------------------------------------------------------------------
SCAN_PATHS=(
  "CLAUDE.md"
  "docs"
  "_bmad-output"
  "backlog/docs"
  "backlog/tasks"
)

# ------------------------------------------------------------------------------
# Exclusion list — paths to skip during scanning.
# - docs/request-backend: cites backend source (cross-repo, can't validate here).
# - 89-3-fe-*: this story's own spec documents bad-citation examples by design.
# Promote to .docignore convention or CLI flag in a follow-up if needed.
# M-2, M-3 review fixes.
# ------------------------------------------------------------------------------
EXCLUDE_PATHS=(
  "docs/request-backend"
  "_bmad-output/implementation-artifacts/89-3-fe-doc-link-validator-script.md"
  # 93-5-fe-*: this story's spec embeds the 13-citation baseline table by design (mirrors 89-3 precedent).
  "_bmad-output/implementation-artifacts/93-5-fe-check-docs-signal-quality-investigation.md"
)

# ------------------------------------------------------------------------------
# Core validator
#   $1 = directory to treat as repo root for citation resolution
# Sets globals: TOTAL_CITATIONS, BROKEN_COUNT; prints report to stdout.
# ------------------------------------------------------------------------------
run_validator() {
  local root="$1"
  cd "$root"

  TOTAL_CITATIONS=0
  BROKEN_COUNT=0

  # Build list of existing scan paths
  local existing_paths=()
  for path in "${SCAN_PATHS[@]}"; do
    if [[ -e "$path" ]]; then
      existing_paths+=("$path")
    fi
  done

  if [[ ${#existing_paths[@]} -eq 0 ]]; then
    echo "No scan paths exist in $root — nothing to check."
    return 0
  fi

  # Grep all citations across scan paths.
  # -r recursive, -n line numbers, -H with filename (even on single file),
  # -o only matching text, -E extended regex.
  # `|| true` so set -e doesn't abort when grep finds zero matches (exit 1).
  local raw_matches
  raw_matches=$(grep -rHnoE "$CITATION_REGEX" "${existing_paths[@]}" --include="*.md" --include="*.txt" 2>/dev/null || true)

  # Filter out excluded paths (M-2, M-3).
  if [[ ${#EXCLUDE_PATHS[@]} -gt 0 && -n "$raw_matches" ]]; then
    for excl in "${EXCLUDE_PATHS[@]}"; do
      raw_matches=$(echo "$raw_matches" | grep -v "^${excl}" || true)
    done
  fi

  if [[ -z "$raw_matches" ]]; then
    # Format as comma-separated globs to match AC-2 spec output (L-2 review fix).
    echo "Scanned: $(IFS=', '; echo "${existing_paths[*]}")"
    echo "Total citations: 0"
    echo "Broken: 0"
    echo "OK: no source citations found — nothing to validate."
    return 0
  fi

  # Process each match: "<source_file>:<source_line>:<citation>"
  # Strip surrounding backticks from citation for resolution.
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    TOTAL_CITATIONS=$((TOTAL_CITATIONS + 1))

    # Split: source_file, source_line, citation (rest after second :)
    # Using parameter expansion to handle paths with colons defensively.
    local source_file source_line citation
    source_file="${line%%:*}"
    local rest="${line#*:}"
    source_line="${rest%%:*}"
    citation="${rest#*:}"

    # Strip backticks from citation
    citation="${citation#\`}"
    citation="${citation%\`}"

    # Split citation into path + range
    local cited_path cited_range
    cited_path="${citation%:*}"
    cited_range="${citation##*:}"

    # Parse range: "42" or "42-55"
    local start_line end_line
    if [[ "$cited_range" == *-* ]]; then
      start_line="${cited_range%-*}"
      end_line="${cited_range#*-}"
    else
      start_line="$cited_range"
      end_line="$cited_range"
    fi

    # Check file exists
    if [[ ! -f "$cited_path" ]]; then
      echo "[BROKEN] $citation"
      echo "  cited in $source_file:$source_line"
      echo "  reason: file not found"
      echo ""
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      continue
    fi

    # Check line range
    local total_lines
    # Use awk NR (not `wc -l`) — counts logical lines including files without
    # trailing newline (common with "insertFinalNewline": false). H-1 review fix.
    total_lines=$(awk 'END{print NR}' "$cited_path")

    if [[ "$end_line" -gt "$total_lines" ]]; then
      echo "[BROKEN] $citation"
      echo "  cited in $source_file:$source_line"
      echo "  reason: line $end_line > file has $total_lines lines"
      echo ""
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
    fi
  done <<< "$raw_matches"

  # Format as comma-separated globs to match AC-2 spec output (L-2 review fix).
  echo "Scanned: $(IFS=', '; echo "${existing_paths[*]}")"
  echo "Total citations: $TOTAL_CITATIONS"
  echo "Broken: $BROKEN_COUNT"

  if [[ "$BROKEN_COUNT" -eq 0 ]]; then
    echo "OK: all citations resolve."
    return 0
  else
    echo "FAIL: $BROKEN_COUNT broken citation(s)."
    return 1
  fi
}

# ------------------------------------------------------------------------------
# Self-test — spins up a scratch repo with 4 known cases.
# ------------------------------------------------------------------------------
run_self_test() {
  local scratch=""
  scratch=$(mktemp -d)
  # Guard against `set -u` firing at top-level EXIT where `scratch` is function-local.
  # H-2 review fix.
  trap '[[ -n "${scratch:-}" ]] && rm -rf "$scratch"' EXIT

  mkdir -p "$scratch/src/real"
  mkdir -p "$scratch/docs"

  # Real source file with 10 lines
  printf 'line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n' > "$scratch/src/real/ok.ts"

  # Doc file with 4 citations: 1 ok, 1 missing-file, 1 out-of-range line, 1 range-ok
  cat > "$scratch/docs/cites.md" <<'EOF'
Valid citation: `src/real/ok.ts:1` should resolve.
Valid range: `src/real/ok.ts:1-5` should resolve.
Missing file: `src/fake/gone.ts:42` should fail.
Out of range: `src/real/ok.ts:99999` should fail (only 10 lines).
EOF

  echo "=== Self-test: running validator against scratch repo ==="
  echo ""

  # Save globals from enclosing run (should be unset during self-test)
  local test_output test_exit
  set +e
  test_output=$(run_validator "$scratch")
  test_exit=$?
  set -e

  echo "$test_output"
  echo ""
  echo "=== Self-test assertions ==="

  local pass=0 fail=0

  # Expected: 4 total citations, 2 broken
  if echo "$test_output" | grep -qE '^Total citations: 4$'; then
    echo "  ✅ total-count assertion: 4 citations found"
    pass=$((pass + 1))
  else
    echo "  ❌ total-count assertion failed (expected 4)"
    fail=$((fail + 1))
  fi

  if echo "$test_output" | grep -qE '^Broken: 2$'; then
    echo "  ✅ broken-count assertion: 2 broken"
    pass=$((pass + 1))
  else
    echo "  ❌ broken-count assertion failed (expected 2)"
    fail=$((fail + 1))
  fi

  # Specific broken citations present
  if echo "$test_output" | grep -qE 'file not found' && \
     echo "$test_output" | grep -qE 'src/fake/gone\.ts:42'; then
    echo "  ✅ missing-file detection"
    pass=$((pass + 1))
  else
    echo "  ❌ missing-file detection failed"
    fail=$((fail + 1))
  fi

  if echo "$test_output" | grep -qE 'line 99999 > file has 10 lines'; then
    echo "  ✅ out-of-range detection"
    pass=$((pass + 1))
  else
    echo "  ❌ out-of-range detection failed"
    fail=$((fail + 1))
  fi

  # Exit code = 1 (broken found)
  if [[ "$test_exit" -eq 1 ]]; then
    echo "  ✅ exit code 1 when broken citations present"
    pass=$((pass + 1))
  else
    echo "  ❌ exit code $test_exit (expected 1)"
    fail=$((fail + 1))
  fi

  # Verify valid citation NOT reported as broken (explicit positive assertion — L-1).
  if ! echo "$test_output" | grep -qE '^\[BROKEN\] `?src/real/ok\.ts:1`?$'; then
    echo "  ✅ valid-single-line citation not flagged as broken"
    pass=$((pass + 1))
  else
    echo "  ❌ valid-single-line citation incorrectly flagged"
    fail=$((fail + 1))
  fi

  echo ""
  echo "Self-test: $pass passed / $fail failed"
  if [[ "$fail" -eq 0 ]]; then
    return 0
  else
    return 1
  fi
}

# ------------------------------------------------------------------------------
# Main
# ------------------------------------------------------------------------------
if [[ "${1:-}" == "--self-test" ]]; then
  run_self_test
  exit $?
fi

run_validator "$PROJECT_ROOT"
exit $?
