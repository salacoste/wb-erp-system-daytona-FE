#!/usr/bin/env bash
# Doc-Link Validator — Stories 89.3-FE (origin), 94.1-FE (baseline tracking)
#
# Scans Git-tracked Markdown/text files under CLAUDE.md + docs/ +
# _bmad-output/ + backlog/ for backtick-wrapped source citations of the form
# `src/path/to/file.ts:N` or `src/path/to/file.ts:N-M`
# and verifies each:
#   1. The file exists (relative to repo root).
#   2. The end line number (or single line) is within the file's line count.
#
# Exit codes: 0 = all citations resolve OR broken set matches baseline, 1 = mismatch.
#
# Usage:
#   scripts/check-doc-citations.sh                  # scan repo
#   scripts/check-doc-citations.sh --self-test      # run built-in self-tests
#   scripts/check-doc-citations.sh --update-baseline # regenerate baseline file
#
# Added via Epic 88-FE retrospective action item #A — broken citations recurred
# in 3 separate Epic 88 code reviews; this surfaces them at zero cognitive cost.
# Story 94.1-FE — added baseline comparison logic and --update-baseline flag.

set -euo pipefail

# Force C locale for stable sort/comm collation across systems (M-3 review fix).
export LC_ALL=C

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BASELINE_FILE="$SCRIPT_DIR/.check-docs-baseline.txt"
# Production entry points always use Git-tracked enumeration. The self-test
# function shadows this variable for its legacy filesystem-only fixtures.
DOC_CITATION_SCAN_MODE="git"

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
  "CLAUDE-PATTERNS.md"
  "CLAUDE-ANTI-PATTERNS.md"
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
# collect_tracked_scan_files — enumerate the production scan set from Git.
# Uses a NUL-delimited temporary list so spaces and Unicode paths remain intact.
# Deleted tracked files are skipped because validation reads working-tree content.
# There is deliberately no filesystem-recursion fallback when Git fails.
# Populates global: TRACKED_SCAN_FILES.
# ------------------------------------------------------------------------------
collect_tracked_scan_files() {
  TRACKED_SCAN_FILES=()

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "ERROR: doc citation scan requires a Git worktree." >&2
    return 1
  fi

  local tracked_list
  tracked_list=$(mktemp)
  if ! git ls-files -z -- "${SCAN_PATHS[@]}" > "$tracked_list"; then
    rm -f "$tracked_list"
    echo "ERROR: unable to enumerate Git-tracked documentation files." >&2
    return 1
  fi

  local path excluded_path is_excluded
  while IFS= read -r -d '' path; do
    case "$path" in
      *.md|*.txt) ;;
      *) continue ;;
    esac
    [[ -f "$path" ]] || continue

    is_excluded=0
    for excluded_path in "${EXCLUDE_PATHS[@]}"; do
      if [[ "$path" == "$excluded_path" || "$path" == "$excluded_path/"* ]]; then
        is_excluded=1
        break
      fi
    done
    [[ "$is_excluded" -eq 1 ]] && continue

    TRACKED_SCAN_FILES+=("$path")
  done < "$tracked_list"

  rm -f "$tracked_list"
}

# ------------------------------------------------------------------------------
# Baseline comparison — compares current broken list against committed baseline.
# $1 = path to baseline file
# $2 = current sorted broken entries (one per line, may be empty string)
# Prints comparison block to stdout.
# Returns: 0 on match, 1 on mismatch.
# ------------------------------------------------------------------------------
compare_to_baseline() {
  local baseline_path="$1"
  local current_sorted="$2"

  if [[ ! -f "$baseline_path" ]]; then
    echo "ERROR: baseline file not found at $baseline_path." >&2
    echo "  Run \`bash scripts/check-doc-citations.sh --update-baseline\` to seed." >&2
    return 1
  fi

  local baseline_sorted
  baseline_sorted=$(grep -v '^\s*#' "$baseline_path" | grep -v '^\s*$' | sort || true)

  # Compute set differences using comm (requires sorted input).
  local added removed matched
  added=$(comm -23 <(echo "$current_sorted") <(echo "$baseline_sorted") || true)
  removed=$(comm -13 <(echo "$current_sorted") <(echo "$baseline_sorted") || true)
  matched=$(comm -12 <(echo "$current_sorted") <(echo "$baseline_sorted") || true)

  # Count non-empty lines safely.
  # Always-plural style for stable test assertions (1 entries reads awkwardly but
  # avoids singular/plural test fragility — M-2 review fix).
  local added_count removed_count matched_count
  added_count=$([ -z "$added" ] && echo 0 || printf '%s\n' "$added" | awk 'END{print NR}')
  removed_count=$([ -z "$removed" ] && echo 0 || printf '%s\n' "$removed" | awk 'END{print NR}')
  matched_count=$([ -z "$matched" ] && echo 0 || printf '%s\n' "$matched" | awk 'END{print NR}')

  echo ""
  echo "=== Baseline comparison ==="
  if [[ "$added_count" -eq 0 && "$removed_count" -eq 0 ]]; then
    echo "OK: broken citations match baseline ($matched_count entries)."
    return 0
  fi

  echo "MISMATCH: broken citations diverge from baseline."
  echo ""
  if [[ "$added_count" -gt 0 ]]; then
    echo "NEW broken citations ($added_count) — story introduced these:"
    printf '%s\n' "$added" | sed 's/^/  /'
    echo ""
  fi
  if [[ "$removed_count" -gt 0 ]]; then
    echo "RESOLVED broken citations ($removed_count) — story fixed these:"
    printf '%s\n' "$removed" | sed 's/^/  /'
    echo ""
  fi
  echo "ACCEPTED baseline matches: $matched_count"
  echo ""
  echo "FAIL: run \`bash scripts/check-doc-citations.sh --update-baseline\` to accept the new state."
  return 1
}

# ------------------------------------------------------------------------------
# Baseline header template — used by --update-baseline to regenerate the header.
# ------------------------------------------------------------------------------
write_baseline_header() {
  local file="$1"
  cat > "$file" <<'EOF'
# Doc-citation validator baseline
# Story 94.1-FE — automated baseline tracking
#
# Format: <citation> | <reason>
# One occurrence per line. Lines starting with # are comments.
#
# Update via: bash scripts/check-doc-citations.sh --update-baseline
# Exit code interpretation:
#   0 = current broken set matches this baseline (story closed cleanly)
#   1 = NEW citations introduced OR RESOLVED citations not yet baselined
#       (output enumerates what changed)
EOF
}

# ------------------------------------------------------------------------------
# collect_broken_entries — shared citation-scanning helper (H-3 review fix).
#   $1     = "verbose" to emit [BROKEN] detail blocks to stdout; "" for silent.
#   $2..   = existing scan paths (positional args — L-NEW-1 fix: was dynamic scope).
#   Populates globals: BROKEN_ENTRIES (array), TOTAL_CITATIONS, BROKEN_COUNT.
#   The caller is responsible for any printing of [BROKEN] detail lines.
# ------------------------------------------------------------------------------
collect_broken_entries() {
  local verbose="${1:-}"
  shift
  local existing_paths=("$@")

  TOTAL_CITATIONS=0
  BROKEN_COUNT=0
  BROKEN_ENTRIES=()

  local scan_targets=()
  if [[ "$DOC_CITATION_SCAN_MODE" == "filesystem" ]]; then
    # Explicit self-test compatibility path for legacy scratch fixtures only.
    scan_targets=("${existing_paths[@]}")
  elif [[ "$DOC_CITATION_SCAN_MODE" == "git" ]]; then
    if ! collect_tracked_scan_files; then
      return 1
    fi
    scan_targets=("${TRACKED_SCAN_FILES[@]}")
  else
    echo "ERROR: unsupported DOC_CITATION_SCAN_MODE=${DOC_CITATION_SCAN_MODE}." >&2
    return 1
  fi

  if [[ ${#scan_targets[@]} -eq 0 ]]; then
    return 0
  fi

  # Grep all citations across the selected targets. Production targets are
  # individual Git-tracked files; -r remains only for explicit scratch mode.
  # `|| true` prevents grep's no-match exit 1 from aborting under set -e.
  local raw_matches
  raw_matches=$(grep -rHnoE "$CITATION_REGEX" "${scan_targets[@]}" --include="*.md" --include="*.txt" 2>/dev/null || true)

  # Filter out excluded paths.
  if [[ ${#EXCLUDE_PATHS[@]} -gt 0 && -n "$raw_matches" ]]; then
    for excl in "${EXCLUDE_PATHS[@]}"; do
      raw_matches=$(echo "$raw_matches" | grep -v "^${excl}" || true)
    done
  fi

  [[ -z "$raw_matches" ]] && return 0

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
      if [[ "$verbose" == "verbose" ]]; then
        echo "[BROKEN] $citation"
        echo "  cited in $source_file:$source_line"
        echo "  reason: file not found"
        echo ""
      fi
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      BROKEN_ENTRIES+=("$citation | file not found")
      continue
    fi

    # Check line range
    # Use awk NR (not `wc -l`) — counts logical lines including files without
    # trailing newline (common with "insertFinalNewline": false). H-1 review fix.
    local total_lines
    total_lines=$(awk 'END{print NR}' "$cited_path")

    if [[ "$end_line" -gt "$total_lines" ]]; then
      if [[ "$verbose" == "verbose" ]]; then
        echo "[BROKEN] $citation"
        echo "  cited in $source_file:$source_line"
        echo "  reason: line $end_line > file has $total_lines lines"
        echo ""
      fi
      BROKEN_COUNT=$((BROKEN_COUNT + 1))
      BROKEN_ENTRIES+=("$citation | line $end_line > file has $total_lines lines")
    fi
  done <<< "$raw_matches"
}

# ------------------------------------------------------------------------------
# Core validator
#   $1 = directory to treat as repo root for citation resolution
#   $2 = (optional) path to baseline file (defaults to $BASELINE_FILE)
# Sets globals: TOTAL_CITATIONS, BROKEN_COUNT; prints report to stdout.
# Returns: exit code from baseline comparison (0=match, 1=mismatch).
# ------------------------------------------------------------------------------
run_validator() {
  local root="$1"
  local baseline="${2:-$BASELINE_FILE}"
  cd "$root"

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

  # Collect broken entries with verbose [BROKEN] output (H-3: shared helper).
  if ! collect_broken_entries "verbose" "${existing_paths[@]}"; then
    return 1
  fi

  if [[ "$TOTAL_CITATIONS" -eq 0 ]]; then
    # Format as comma-separated globs to match AC-2 spec output (L-2 review fix).
    echo "Scanned: $(IFS=', '; echo "${existing_paths[*]}")"
    echo "Total citations: 0"
    echo "Broken: 0"
    echo "OK: no source citations found — nothing to validate."
    # Still compare against baseline (should show RESOLVED if baseline has entries).
    compare_to_baseline "$baseline" ""
    return $?
  fi

  # Format as comma-separated globs to match AC-2 spec output (L-2 review fix).
  echo "Scanned: $(IFS=', '; echo "${existing_paths[*]}")"
  echo "Total citations: $TOTAL_CITATIONS"
  echo "Broken: $BROKEN_COUNT"

  if [[ "$BROKEN_COUNT" -eq 0 ]]; then
    echo "OK: all citations resolve."
    # Still compare against baseline — baseline might have RESOLVED entries.
    compare_to_baseline "$baseline" ""
    return $?
  fi

  # Build sorted broken list for comparison.
  local current_sorted
  current_sorted=$(printf '%s\n' "${BROKEN_ENTRIES[@]}" | sort)

  # Emit baseline comparison block AFTER the Broken: N summary line.
  compare_to_baseline "$baseline" "$current_sorted"
  return $?
}

# ------------------------------------------------------------------------------
# Update baseline — regenerates scripts/.check-docs-baseline.txt from current state.
#   $1 = directory to treat as repo root
# ------------------------------------------------------------------------------
run_update_baseline() {
  local root="$1"
  cd "$root"

  # Build list of existing scan paths
  local existing_paths=()
  for path in "${SCAN_PATHS[@]}"; do
    if [[ -e "$path" ]]; then
      existing_paths+=("$path")
    fi
  done

  # Collect broken entries silently (H-3: shared helper eliminates duplication).
  if ! collect_broken_entries "" "${existing_paths[@]}"; then
    return 1
  fi

  # Load existing baseline for comparison summary.
  local old_baseline_sorted=""
  if [[ -f "$BASELINE_FILE" ]]; then
    old_baseline_sorted=$(grep -v '^\s*#' "$BASELINE_FILE" | grep -v '^\s*$' | sort || true)
  fi

  local new_sorted=""
  if [[ ${#BROKEN_ENTRIES[@]} -gt 0 ]]; then
    new_sorted=$(printf '%s\n' "${BROKEN_ENTRIES[@]}" | sort)
  fi

  # Write new baseline file.
  write_baseline_header "$BASELINE_FILE"
  if [[ -n "$new_sorted" ]]; then
    printf '%s\n' "$new_sorted" >> "$BASELINE_FILE"
  fi

  # Always-plural style for stable test assertions (M-2 review fix).
  local new_count
  new_count=$([ -z "$new_sorted" ] && echo 0 || printf '%s\n' "$new_sorted" | awk 'END{print NR}')

  echo "Baseline updated: $BASELINE_FILE"
  echo "- Wrote $new_count entries (sorted)"

  if [[ -z "$old_baseline_sorted" ]]; then
    echo "- Baseline seeded (no previous baseline existed)"
  else
    local added removed
    added=$(comm -23 <(echo "$new_sorted") <(echo "$old_baseline_sorted") || true)
    removed=$(comm -13 <(echo "$new_sorted") <(echo "$old_baseline_sorted") || true)
    local added_count removed_count
    added_count=$([ -z "$added" ] && echo 0 || printf '%s\n' "$added" | awk 'END{print NR}')
    removed_count=$([ -z "$removed" ] && echo 0 || printf '%s\n' "$removed" | awk 'END{print NR}')
    local net=$((added_count - removed_count))
    echo "- NEW since previous baseline: $added_count"
    echo "- RESOLVED since previous baseline: $removed_count"
    if [[ "$net" -ge 0 ]]; then
      echo "- Net change: +$net"
    else
      echo "- Net change: $net"
    fi
  fi

  return 0
}

# ------------------------------------------------------------------------------
# Self-test — spins up a scratch repo with known cases.
# ------------------------------------------------------------------------------
run_self_test() {
  # Tests 1-11 predate Git-tracked enumeration and intentionally use minimal
  # filesystem-only scratch fixtures. Tests 12-16 override this to "git".
  local DOC_CITATION_SCAN_MODE="filesystem"
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

  # Baseline for tests 1-6 (no baseline file needed — tests 1-6 predate baseline feature).
  # Provide a matching baseline so exit code is 0 when testing broken=2 scenario.
  mkdir -p "$scratch/scripts"
  cat > "$scratch/scripts/.check-docs-baseline.txt" <<'EOF'
# baseline for self-test
src/fake/gone.ts:42 | file not found
src/real/ok.ts:99999 | line 99999 > file has 10 lines
EOF

  echo "=== Self-test: running validator against scratch repo ==="
  echo ""

  # Save globals from enclosing run (should be unset during self-test)
  local test_output test_exit
  set +e
  test_output=$(run_validator "$scratch" "$scratch/scripts/.check-docs-baseline.txt")
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

  # Exit code = 0 (broken found but matches baseline)
  if [[ "$test_exit" -eq 0 ]]; then
    echo "  ✅ exit code 0 when broken citations match baseline"
    pass=$((pass + 1))
  else
    echo "  ❌ exit code $test_exit (expected 0 — baseline match)"
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
  echo "=== Self-test baseline-comparison scenarios (tests 7-11) ==="

  # ---------------------------------------------------------------------------
  # Test 7 — match: scratch repo with 1 broken citation + matching baseline.
  # Expect exit 0 + output contains "OK: broken citations match baseline".
  # ---------------------------------------------------------------------------
  local t7_scratch
  t7_scratch=$(mktemp -d)
  mkdir -p "$t7_scratch/src/fake" "$t7_scratch/docs" "$t7_scratch/scripts"
  printf 'line1\n' > "$t7_scratch/src/fake/exists.ts"
  cat > "$t7_scratch/docs/t7.md" <<'EOF'
Broken: `src/fake/gone.ts:42` (file not found)
EOF
  cat > "$t7_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
# test7 baseline
src/fake/gone.ts:42 | file not found
EOF
  local t7_out t7_exit
  set +e
  t7_out=$(run_validator "$t7_scratch" "$t7_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t7_exit=$?
  set -e
  rm -rf "$t7_scratch"
  if [[ "$t7_exit" -eq 0 ]] && echo "$t7_out" | grep -q "OK: broken citations match baseline"; then
    echo "  ✅ Test 7 (match): exit 0 + baseline match message"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 7 (match) failed: exit=$t7_exit"
    echo "     output: $t7_out"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 8 — new added: 2 broken citations, baseline lists only 1.
  # Expect exit 1 + output contains "NEW broken citations (1)".
  # ---------------------------------------------------------------------------
  local t8_scratch
  t8_scratch=$(mktemp -d)
  mkdir -p "$t8_scratch/docs" "$t8_scratch/scripts"
  cat > "$t8_scratch/docs/t8.md" <<'EOF'
Broken1: `src/fake/gone1.ts:42` (file not found)
Broken2: `src/fake/gone2.ts:99` (file not found)
EOF
  cat > "$t8_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
# test8 baseline - only lists 1 of 2 broken
src/fake/gone1.ts:42 | file not found
EOF
  local t8_out t8_exit
  set +e
  t8_out=$(run_validator "$t8_scratch" "$t8_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t8_exit=$?
  set -e
  rm -rf "$t8_scratch"
  if [[ "$t8_exit" -eq 1 ]] && echo "$t8_out" | grep -q "NEW broken citations (1)"; then
    echo "  ✅ Test 8 (new added): exit 1 + NEW broken citations (1)"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 8 (new added) failed: exit=$t8_exit"
    echo "     output: $t8_out"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 9 — resolved: 0 broken citations, baseline lists 1.
  # Expect exit 1 + output contains "RESOLVED broken citations (1)".
  # ---------------------------------------------------------------------------
  local t9_scratch
  t9_scratch=$(mktemp -d)
  mkdir -p "$t9_scratch/src/real" "$t9_scratch/docs" "$t9_scratch/scripts"
  printf 'line1\nline2\nline3\n' > "$t9_scratch/src/real/ok.ts"
  cat > "$t9_scratch/docs/t9.md" <<'EOF'
Valid: `src/real/ok.ts:1` (this resolves fine)
EOF
  cat > "$t9_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
# test9 baseline - lists a zombie entry that no longer breaks
src/fake/zombie.ts:1 | file not found
EOF
  local t9_out t9_exit
  set +e
  t9_out=$(run_validator "$t9_scratch" "$t9_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t9_exit=$?
  set -e
  rm -rf "$t9_scratch"
  if [[ "$t9_exit" -eq 1 ]] && echo "$t9_out" | grep -q "RESOLVED broken citations (1)"; then
    echo "  ✅ Test 9 (resolved): exit 1 + RESOLVED broken citations (1)"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 9 (resolved) failed: exit=$t9_exit"
    echo "     output: $t9_out"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 10 — update-flag: scratch repo with 2 broken + initial 1-entry baseline.
  # Run --update-baseline. Expect exit 0 + baseline file has 2 entries.
  # ---------------------------------------------------------------------------
  local t10_scratch
  t10_scratch=$(mktemp -d)
  mkdir -p "$t10_scratch/docs" "$t10_scratch/scripts"
  cat > "$t10_scratch/docs/t10.md" <<'EOF'
Broken1: `src/fake/gone1.ts:42` (file not found)
Broken2: `src/fake/gone2.ts:99` (file not found)
EOF
  # Initial baseline has only 1 entry
  cat > "$t10_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
# test10 baseline
src/fake/gone1.ts:42 | file not found
EOF
  # Subshell isolates BASELINE_FILE override; outer state unaffected by errors inside (L-NEW-2 fix).
  local t10_out t10_exit
  set +e
  t10_out=$(
    BASELINE_FILE="$t10_scratch/scripts/.check-docs-baseline.txt"
    run_update_baseline "$t10_scratch" 2>&1
  )
  t10_exit=$?
  set -e
  # Count non-comment, non-blank lines in updated baseline (L-3: awk over grep -c).
  local t10_entry_count t10_baseline_content
  t10_baseline_content="$t10_scratch/scripts/.check-docs-baseline.txt"
  t10_entry_count=$(grep -v '^\s*#' "$t10_baseline_content" | grep -v '^\s*$' | awk 'END{print NR}')
  # M-1 review fix: assert SPECIFIC entry content, not just count.
  if [[ "$t10_exit" -eq 0 ]] && \
     [[ "$t10_entry_count" -eq 2 ]] && \
     grep -q 'src/fake/gone1\.ts:42' "$t10_baseline_content" && \
     grep -q 'src/fake/gone2\.ts:99' "$t10_baseline_content"; then
    echo "  ✅ Test 10 (update-flag): exit 0 + baseline written with correct 2 entries"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 10 (update-flag) failed: exit=$t10_exit, entries=$t10_entry_count"
    echo "     output: $t10_out"
    fail=$((fail + 1))
  fi
  rm -rf "$t10_scratch"

  # ---------------------------------------------------------------------------
  # Test 11 — missing baseline: scratch repo with 1 broken, NO baseline file.
  # Expect exit 1 + output contains "baseline file not found at".
  # ---------------------------------------------------------------------------
  local t11_scratch
  t11_scratch=$(mktemp -d)
  mkdir -p "$t11_scratch/docs" "$t11_scratch/scripts"
  cat > "$t11_scratch/docs/t11.md" <<'EOF'
Broken: `src/fake/gone.ts:42` (file not found)
EOF
  # Intentionally do NOT create $t11_scratch/scripts/.check-docs-baseline.txt
  local t11_out t11_exit
  set +e
  t11_out=$(run_validator "$t11_scratch" "$t11_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t11_exit=$?
  set -e
  rm -rf "$t11_scratch"
  if [[ "$t11_exit" -eq 1 ]] && echo "$t11_out" | grep -q "baseline file not found at"; then
    echo "  ✅ Test 11 (missing baseline): exit 1 + baseline file not found message"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 11 (missing baseline) failed: exit=$t11_exit"
    echo "     output: $t11_out"
    fail=$((fail + 1))
  fi

  echo ""
  echo "=== Self-test Git-tracked enumeration scenarios (tests 12-16) ==="

  # ---------------------------------------------------------------------------
  # Test 12 — ignored docs are excluded from the production Git-tracked scan.
  # ---------------------------------------------------------------------------
  local t12_scratch
  t12_scratch=$(mktemp -d)
  git -C "$t12_scratch" init -q
  mkdir -p "$t12_scratch/docs" "$t12_scratch/scripts"
  cat > "$t12_scratch/.gitignore" <<'EOF'
docs/ignored.md
EOF
  cat > "$t12_scratch/docs/tracked.md" <<'EOF'
Tracked: `src/fake/tracked.ts:1`
EOF
  cat > "$t12_scratch/docs/ignored.md" <<'EOF'
Ignored: `src/fake/ignored.ts:1`
EOF
  cat > "$t12_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
src/fake/tracked.ts:1 | file not found
EOF
  git -C "$t12_scratch" add .gitignore docs/tracked.md scripts/.check-docs-baseline.txt
  local t12_out t12_exit
  set +e
  t12_out=$(DOC_CITATION_SCAN_MODE=git run_validator "$t12_scratch" "$t12_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t12_exit=$?
  set -e
  rm -rf "$t12_scratch"
  if [[ "$t12_exit" -eq 0 ]] && \
     echo "$t12_out" | grep -q '^Total citations: 1$' && \
     ! echo "$t12_out" | grep -q 'src/fake/ignored\.ts'; then
    echo "  ✅ Test 12 (ignored docs): ignored Markdown excluded"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 12 (ignored docs) failed: exit=$t12_exit"
    echo "     output: $t12_out"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 13 — untracked docs are excluded from the production Git-tracked scan.
  # ---------------------------------------------------------------------------
  local t13_scratch
  t13_scratch=$(mktemp -d)
  git -C "$t13_scratch" init -q
  mkdir -p "$t13_scratch/docs" "$t13_scratch/scripts"
  cat > "$t13_scratch/docs/tracked.md" <<'EOF'
Tracked: `src/fake/tracked.ts:1`
EOF
  cat > "$t13_scratch/docs/untracked.md" <<'EOF'
Untracked: `src/fake/untracked.ts:1`
EOF
  cat > "$t13_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
src/fake/tracked.ts:1 | file not found
EOF
  git -C "$t13_scratch" add docs/tracked.md scripts/.check-docs-baseline.txt
  local t13_out t13_exit
  set +e
  t13_out=$(DOC_CITATION_SCAN_MODE=git run_validator "$t13_scratch" "$t13_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t13_exit=$?
  set -e
  rm -rf "$t13_scratch"
  if [[ "$t13_exit" -eq 0 ]] && \
     echo "$t13_out" | grep -q '^Total citations: 1$' && \
     ! echo "$t13_out" | grep -q 'src/fake/untracked\.ts'; then
    echo "  ✅ Test 13 (untracked docs): untracked Markdown excluded"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 13 (untracked docs) failed: exit=$t13_exit"
    echo "     output: $t13_out"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 14 — tracked paths containing spaces and Unicode are scanned intact.
  # ---------------------------------------------------------------------------
  local t14_scratch
  t14_scratch=$(mktemp -d)
  git -C "$t14_scratch" init -q
  mkdir -p "$t14_scratch/docs/Guide Notes" "$t14_scratch/scripts"
  cat > "$t14_scratch/docs/Guide Notes/Русский файл.md" <<'EOF'
Tracked Unicode path: `src/fake/unicode.ts:1`
EOF
  cat > "$t14_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
src/fake/unicode-working-tree.ts:1 | file not found
src/fake/unicode-working-tree.ts:1 | file not found
EOF
  git -C "$t14_scratch" add "docs/Guide Notes/Русский файл.md" scripts/.check-docs-baseline.txt
  cat > "$t14_scratch/docs/Guide Notes/Русский файл.md" <<'EOF'
Modified tracked Unicode path: `src/fake/unicode-working-tree.ts:1`
Duplicate citation occurrence: `src/fake/unicode-working-tree.ts:1`
EOF
  local t14_out t14_exit
  set +e
  t14_out=$(DOC_CITATION_SCAN_MODE=git run_validator "$t14_scratch" "$t14_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t14_exit=$?
  set -e
  rm -rf "$t14_scratch"
  if [[ "$t14_exit" -eq 0 ]] && \
     echo "$t14_out" | grep -q '^Total citations: 2$' && \
     echo "$t14_out" | grep -q '^Broken: 2$' && \
     echo "$t14_out" | grep -q 'cited in docs/Guide Notes/Русский файл.md:1' && \
     echo "$t14_out" | grep -q 'cited in docs/Guide Notes/Русский файл.md:2'; then
    echo "  ✅ Test 14 (spaces + Unicode): tracked path and duplicate occurrences preserved"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 14 (spaces + Unicode) failed: exit=$t14_exit"
    echo "     output: $t14_out"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 15 — baseline regeneration contains only tracked document citations.
  # ---------------------------------------------------------------------------
  local t15_scratch
  t15_scratch=$(mktemp -d)
  git -C "$t15_scratch" init -q
  mkdir -p "$t15_scratch/docs" "$t15_scratch/scripts"
  cat > "$t15_scratch/.gitignore" <<'EOF'
docs/ignored.md
EOF
  cat > "$t15_scratch/docs/tracked.md" <<'EOF'
Tracked reverse-order zeta: `src/fake/zeta.ts:9`
Tracked reverse-order alpha: `src/fake/alpha.ts:1`
EOF
  cat > "$t15_scratch/docs/ignored.md" <<'EOF'
Ignored: `src/fake/ignored.ts:1`
EOF
  cat > "$t15_scratch/docs/untracked.md" <<'EOF'
Untracked: `src/fake/untracked.ts:1`
EOF
  cat > "$t15_scratch/scripts/.check-docs-baseline.txt" <<'EOF'
src/fake/obsolete.ts:1 | file not found
EOF
  git -C "$t15_scratch" add .gitignore docs/tracked.md scripts/.check-docs-baseline.txt
  local t15_out t15_exit
  set +e
  t15_out=$(
    DOC_CITATION_SCAN_MODE=git
    BASELINE_FILE="$t15_scratch/scripts/.check-docs-baseline.txt"
    run_update_baseline "$t15_scratch" 2>&1
  )
  t15_exit=$?
  set -e
  local t15_actual t15_expected t15_validator_out t15_validator_exit
  t15_actual=$(grep -v '^\s*#' "$t15_scratch/scripts/.check-docs-baseline.txt" | grep -v '^\s*$')
  t15_expected=$'src/fake/alpha.ts:1 | file not found\nsrc/fake/zeta.ts:9 | file not found'
  set +e
  t15_validator_out=$(DOC_CITATION_SCAN_MODE=git run_validator "$t15_scratch" "$t15_scratch/scripts/.check-docs-baseline.txt" 2>&1)
  t15_validator_exit=$?
  set -e
  if [[ "$t15_exit" -eq 0 ]] && \
     [[ "$t15_actual" == "$t15_expected" ]] && \
     ! grep -q 'src/fake/ignored\.ts:1' "$t15_scratch/scripts/.check-docs-baseline.txt" && \
     ! grep -q 'src/fake/untracked\.ts:1' "$t15_scratch/scripts/.check-docs-baseline.txt" && \
     ! grep -q 'src/fake/obsolete\.ts:1' "$t15_scratch/scripts/.check-docs-baseline.txt" && \
     echo "$t15_out" | grep -Fq -- '- NEW since previous baseline: 2' && \
     echo "$t15_out" | grep -Fq -- '- RESOLVED since previous baseline: 1' && \
     [[ "$t15_validator_exit" -eq 0 ]]; then
    echo "  ✅ Test 15 (tracked-only baseline): sorted payload, churn counts, and immediate validation"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 15 (tracked-only baseline) failed: update_exit=$t15_exit, validator_exit=$t15_validator_exit"
    echo "     update output: $t15_out"
    echo "     validator output: $t15_validator_out"
    echo "     actual payload: $t15_actual"
    fail=$((fail + 1))
  fi

  # ---------------------------------------------------------------------------
  # Test 16 — repeated tracked-only baseline regeneration is byte-idempotent.
  # ---------------------------------------------------------------------------
  local t16_first="$t15_scratch/scripts/.check-docs-baseline.first"
  cp "$t15_scratch/scripts/.check-docs-baseline.txt" "$t16_first"
  local t16_out t16_exit
  set +e
  t16_out=$(
    DOC_CITATION_SCAN_MODE=git
    BASELINE_FILE="$t15_scratch/scripts/.check-docs-baseline.txt"
    run_update_baseline "$t15_scratch" 2>&1
  )
  t16_exit=$?
  set -e
  if [[ "$t16_exit" -eq 0 ]] && cmp -s "$t16_first" "$t15_scratch/scripts/.check-docs-baseline.txt"; then
    echo "  ✅ Test 16 (byte idempotence): repeated regeneration is identical"
    pass=$((pass + 1))
  else
    echo "  ❌ Test 16 (byte idempotence) failed: exit=$t16_exit"
    echo "     output: $t16_out"
    fail=$((fail + 1))
  fi
  rm -rf "$t15_scratch"

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

if [[ "${1:-}" == "--update-baseline" ]]; then
  run_update_baseline "$PROJECT_ROOT"
  exit $?
fi

run_validator "$PROJECT_ROOT" "$BASELINE_FILE"
exit $?
