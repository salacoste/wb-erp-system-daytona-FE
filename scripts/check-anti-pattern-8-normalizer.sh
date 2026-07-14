#!/usr/bin/env bash
# Anti-Pattern #8 normalizer helper-defeat ratchet — task-48
#
# Root-cause guard for the BD-2/10/16/29/32/34/38 money/ratio-null defect class,
# which lived exclusively inside src/lib/api/*-normalizer.ts / *-mapper.ts.
#
# Boundary normalizers/mappers funnel every field through the shared coercion
# helpers (src/lib/api/normalizer-helpers.ts): counts use toCount (0-safe by
# design), money/ratio use toNullableNumber (null-safe). A '?? 0' applied to a
#   toNullableNumber(...)  or  firstNumber(...)   result
# IMMEDIATELY collapses the null the helper just preserved — silently re-creating
# the exact money/ratio-null defect. This form is invisible to the AP#8
# no-restricted-syntax ESLint selectors because the left operand is a
# CallExpression, not a money-named MemberExpression (the ESLint block in
# eslint.config.js guards the bare-member form; this script guards the helper form).
#
# RATCHET, not 0-tolerance: task-47 migrates the pre-existing sites incrementally.
# A baseline COUNT (scripts/.anti-pattern-8-normalizer-baseline.txt) is allowed;
# the gate fails only when the count INCREASES (a NEW helper-defeat site). As
# task-47 removes sites the count drops — the gate prints "ratchet down" and you
# MUST lower the baseline in the same commit.
#
# WHY A SCRIPT, NOT AN ESLINT RULE: wiring this selector into eslint.config.js at
# 'error' would hard-fail the ~54 sites task-47 is still migrating, breaking the
# baseline before the fix lands. Mirrors the check:locale-percent ratchet pattern
# (frontend/CLAUDE.md § Dot-locale percent ratchet).
#
# Escape hatch: legitimate SEMANTIC-ZERO / AGGREGATION-REDUCE / DISPLAY-GUARD sites
# carry the AP#8 allowlist comment on the same line and are excluded:
#   // eslint-disable-next-line no-restricted-syntax -- <PATTERN>: <rationale>
#
# ENFORCEMENT: like its peers (check:docs / check:eslint-rules / check:locale-percent)
# this is a story-discipline gate run manually + in the 2-pass review, NOT in CI/husky.
#
# Usage:  scripts/check-anti-pattern-8-normalizer.sh [--self-test|--help]
# Exit:   0 = count <= baseline  |  1 = count > baseline (NEW)  |  2 = usage/setup error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="${ROOT_OVERRIDE:-$(cd "$SCRIPT_DIR/.." && pwd)}"
BASELINE_FILE="${BASELINE_FILE_OVERRIDE:-$SCRIPT_DIR/.anti-pattern-8-normalizer-baseline.txt}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

# The helper-defeat form (single source of truth). ESLint-selector-accurate:
# a '?? 0' whose left operand is a toNullableNumber(...) / firstNumber(...) call.
SELECTOR="LogicalExpression[operator='??'][right.value=0] > CallExpression.left[callee.name=/^(toNullableNumber|firstNumber)\$/]"

usage() {
  echo "Usage: $0 [--self-test|--help]"
  echo "Ratchets the count of AP#8 helper-defeat sites (toNullableNumber(...)/firstNumber(...) ?? 0)"
  echo "inside src/lib/api/*-normalizer.ts / *-mapper.ts against a baseline."
}

# Count helper-defeat OCCURRENCES among the normalizer/mapper .ts files under $1,
# via a throwaway flat ESLint config so counting matches the ESLint selector engine exactly.
# Lines carrying the no-restricted-syntax eslint-disable allowlist comment are already
# suppressed by ESLint itself (that's the escape hatch), so they don't count.
#
# IMPORTANT (ESLint 9 flat-config base-dir): the throwaway config file must live INSIDE
# $ROOT — ESLint uses the config file's directory as the lint base and silently ignores
# any target file outside it (macOS /tmp → /private/tmp is always "outside"). So we write
# the config as a temp file at $ROOT/<uuid>.js and target files must also be under $ROOT.
count_matches() {
  local dir="${1:-$ROOT/src/lib/api}"
  [[ -d "$dir" ]] || { echo 0; return 0; }
  # No normalizer/mapper files present → 0.
  local files
  files=$(find "$dir" \( -name '*-normalizer.ts' -o -name '*-mapper.ts' \) \
            ! -name '*.test.*' ! -name '*.spec.*' -type f 2>/dev/null || true)
  [[ -z "$files" ]] && { echo 0; return 0; }

  # Fixed config filename under $ROOT (NOT mktemp with a .js suffix — macOS mktemp does
  # not substitute the XXXXXX template when a suffix follows, yielding a literal name).
  # require the parser by BARE name so Node resolves it from $ROOT/node_modules regardless
  # of hoisting. Dot-prefixed so it's never itself a lint target.
  local cfg n
  cfg="$ROOT/.ap8n-normalizer-tmp-config.js"
  cat > "$cfg" <<CFGEOF
const parser = require('@typescript-eslint/parser');
module.exports = [{
  files: ['**/*.ts'],
  languageOptions: { parser, parserOptions: { sourceType: 'module' } },
  rules: {
    'no-restricted-syntax': ['error', {
      selector: "$SELECTOR",
      message: 'AP8_HELPER_DEFEAT'
    }]
  }
}];
CFGEOF

  # shellcheck disable=SC2086
  n=$(cd "$ROOT" && echo "$files" | xargs npx eslint --config "$cfg" --no-config-lookup 2>/dev/null \
        | grep -c 'AP8_HELPER_DEFEAT' || true)
  rm -f "$cfg"
  echo "${n:-0}"
}

self_test() {
  local pass=0 fail=0 tmp
  # Temp sample dir MUST live under $ROOT (ESLint 9 flat-config base-dir constraint —
  # see count_matches). Use a uniquely-named subdir of src/lib/api so the glob/find picks
  # it up, then always clean it up (trap covers early exits from set -e).
  # NOTE: NOT dot-prefixed — ESLint 9 auto-ignores dotfile directories, which would make
  # count_matches always return 0 for the sample. Cleaned up on every exit path below.
  tmp=$(mktemp -d "$ROOT/src/lib/api/ap8n_selftest_XXXXXX")

  # BAD: 3 helper-defeat sites (toNullableNumber ?? 0, firstNumber ?? 0, optchain-arg ?? 0),
  # 1 allowlisted (excluded), 1 GOOD (toNullableNumber kept nullable), 1 GOOD (toCount).
  cat > "$tmp/bad-normalizer.ts" <<'TSEOF'
function n(raw) {
  return {
    absolute: toNullableNumber(raw.absolute) ?? 0,
    revenue: firstNumber(raw.revenue, raw.revenue_net) ?? 0,
    ratio: toNullableNumber(raw.ratio ?? raw.rate) ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: backend guarantees non-null, 0 means "no ads"
    adSpend: toNullableNumber(raw.adSpend) ?? 0,
    margin: toNullableNumber(raw.margin),
    orders: toCount(raw.orders),
  }
}
TSEOF

  # GOOD file: no helper-defeat at all (mapper suffix).
  cat > "$tmp/good-mapper.ts" <<'TSEOF'
function m(raw) {
  return {
    price: toNullableNumber(raw.current_price),
    count: toCount(raw.count),
  }
}
TSEOF

  local c; c=$(count_matches "$tmp")
  if [[ "$c" -eq 3 ]]; then
    echo "  [PASS] Test 1: 3 helper-defeat sites (allowlisted + nullable-kept + toCount excluded)"; ((pass++))
  else
    echo "  [FAIL] Test 1: expected 3, got $c"; ((fail++))
  fi

  # GOOD-only tree → 0.
  local goodonly; goodonly=$(mktemp -d "$ROOT/src/lib/api/ap8n_good_XXXXXX")
  cp "$tmp/good-mapper.ts" "$goodonly/x-mapper.ts"
  if [[ "$(count_matches "$goodonly")" -eq 0 ]]; then
    echo "  [PASS] Test 2: helper-defeat-free tree → 0"; ((pass++))
  else echo "  [FAIL] Test 2: clean tree should be 0"; ((fail++)); fi
  rm -rf "$goodonly"

  # Empty tree → 0 (no normalizer/mapper files).
  local empty; empty=$(mktemp -d "$ROOT/src/lib/api/ap8n_empty_XXXXXX")
  if [[ "$(count_matches "$empty")" -eq 0 ]]; then
    echo "  [PASS] Test 3: empty tree → 0"; ((pass++))
  else echo "  [FAIL] Test 3: empty tree should be 0"; ((fail++)); fi
  rm -rf "$empty"

  local rc; bash "$0" --bogus 2>/dev/null && rc=0 || rc=$?
  if [[ "${rc:-0}" -eq 2 ]]; then
    echo "  [PASS] Test 4: invalid argument exits 2"; ((pass++))
  else echo "  [FAIL] Test 4: invalid argument should exit 2 (got ${rc:-0})"; ((fail++)); fi

  rm -rf "$tmp"
  echo ""
  if [[ $fail -eq 0 ]]; then echo -e "${GREEN}All $pass self-tests passed${NC}"; exit 0
  else echo -e "${RED}$fail self-test(s) failed, $pass passed${NC}"; exit 1; fi
}

[[ "${1:-}" == "--help" ]] && { usage; exit 0; }
[[ "${1:-}" == "--self-test" ]] && self_test
if [[ -n "${1:-}" ]]; then
  echo -e "${RED}ERROR: unknown argument '$1'${NC}" >&2; usage; exit 2
fi

# --- Main ratchet check ---
[[ -f "$BASELINE_FILE" ]] || { echo -e "${RED}ERROR: missing baseline at $BASELINE_FILE${NC}" >&2; exit 2; }
baseline=$(tr -dc '0-9' < "$BASELINE_FILE" 2>/dev/null || echo "")
[[ -z "$baseline" ]] && { echo -e "${RED}ERROR: invalid (non-numeric) baseline in $BASELINE_FILE${NC}" >&2; exit 2; }
current=$(count_matches "$ROOT/src/lib/api")

if [[ "$current" -gt "$baseline" ]]; then
  echo -e "${RED}FAIL: AP#8 normalizer helper-defeat sites increased $baseline → $current (+$((current - baseline)) NEW).${NC}"
  echo "A 'toNullableNumber(...)/firstNumber(...) ?? 0' collapses money/ratio null → 0. Drop the '?? 0'"
  echo "(keep the field nullable) or, for a genuine count, use toCount(...). SEMANTIC-ZERO/AGGREGATION-REDUCE/"
  echo "DISPLAY-GUARD: add // eslint-disable-next-line no-restricted-syntax -- <PATTERN>: <rationale>."
  exit 1
elif [[ "$current" -lt "$baseline" ]]; then
  echo -e "${YELLOW}OK (ratchet down): helper-defeat sites $baseline → $current. Lower the baseline to $current in${NC}"
  echo -e "${YELLOW}$BASELINE_FILE in this commit to lock in the task-47 migration.${NC}"
  exit 0
else
  echo -e "${GREEN}OK: AP#8 normalizer helper-defeat sites = $current (== baseline; no new violations)${NC}"
  exit 0
fi
