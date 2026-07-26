#!/usr/bin/env bash
# test-anti-pattern-8-rule.sh — Story 105.1-FE
# Self-tests for the no-restricted-syntax Anti-Pattern #8 ESLint rule.
# Asserts: 6 positive cases (rule fires) + 3 negative cases (rule silent).
# Exit 0 on all-pass, exit 1 on any failure.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMPDIR_AP8="$(mktemp -d)"
ESLINT_BIN="${ESLINT_BIN_OVERRIDE:-$ROOT/node_modules/.bin/eslint}"
CREATED_FILES=()

cleanup() {
  rm -rf "$TMPDIR_AP8"
  if [[ ${#CREATED_FILES[@]} -gt 0 ]]; then
    rm -f "${CREATED_FILES[@]}"
  fi
}
trap cleanup EXIT

if [[ ! -x "$ESLINT_BIN" ]]; then
  echo "AP#8 infrastructure error: ESLint binary is missing or not executable: $ESLINT_BIN" >&2
  exit 2
fi

PASS=0
FAIL=0

run_eslint() {
  local file="$1" output status
  # ESLint status 0 means no findings and 1 means lint findings. Any higher status
  # is an infrastructure/configuration failure and must never become semantic silence.
  set +e
  output=$(cd "$ROOT" && "$ESLINT_BIN" "$file" 2>&1)
  status=$?
  set -e
  if [[ $status -gt 1 ]]; then
    echo "AP#8 infrastructure error: ESLint exited with status $status" >&2
    printf '%s\n' "$output" >&2
    return "$status"
  fi
  printf '%s\n' "$output"
}

assert_fires() {
  local label="$1"
  local code="$2"
  local tmpfile="$TMPDIR_AP8/pos_${label}.tsx"
  # Wrap in a no-unused-vars suppression so only our rule fires.
  printf '/* eslint-disable @typescript-eslint/no-unused-vars */\n%s\n' "$code" > "$tmpfile"
  # Copy into frontend/src so the eslint flat-config frontend block matches.
  local srcfile="$ROOT/src/_ap8_test_tmp_${label}.tsx"
  CREATED_FILES+=("$srcfile")
  cp "$tmpfile" "$srcfile"
  local out
  out=$(run_eslint "$srcfile")
  rm -f "$srcfile"
  if echo "$out" | grep -q "no-restricted-syntax"; then
    echo "  PASS (fires)  [$label]"
    PASS=$((PASS + 1))
  else
    echo "  FAIL (silent) [$label] — expected rule to fire"
    echo "         code: $code"
    FAIL=$((FAIL + 1))
  fi
}

assert_silent() {
  local label="$1"
  local code="$2"
  local tmpfile="$TMPDIR_AP8/neg_${label}.tsx"
  printf '/* eslint-disable @typescript-eslint/no-unused-vars */\n%s\n' "$code" > "$tmpfile"
  local srcfile="$ROOT/src/_ap8_test_tmp_${label}.tsx"
  CREATED_FILES+=("$srcfile")
  cp "$tmpfile" "$srcfile"
  local out
  out=$(run_eslint "$srcfile")
  rm -f "$srcfile"
  if echo "$out" | grep -q "no-restricted-syntax"; then
    echo "  FAIL (fires)  [$label] — expected rule to be silent"
    echo "         code: $code"
    FAIL=$((FAIL + 1))
  else
    echo "  PASS (silent) [$label]"
    PASS=$((PASS + 1))
  fi
}

echo "=== Anti-Pattern #8 ESLint rule self-tests (Story 105.1-FE) ==="
echo ""
echo "--- Positive cases (rule MUST fire) ---"

# Root money/ratio names — direct access
assert_fires "revenue_direct"    "const x = item.revenue ?? 0"
# Root money/ratio names — optional chain
assert_fires "roas_optchain"     "const x = data?.roas ?? 0"
# Root ratio name
assert_fires "cpc_direct"        "const x = stats.cpc ?? 0"
# Root money name — cost
assert_fires "cost_direct"       "const x = d.cost ?? 0"
# Suffix _pct
assert_fires "margin_pct_suffix" "const x = item.margin_pct ?? 0"
# Suffix _fee — optional chain
assert_fires "acquiring_fee"     "const x = exp?.acquiring_fee ?? 0"

echo ""
echo "--- Negative cases (rule MUST be silent) ---"

# Count fields — allowlisted
assert_silent "views_count"      "const x = item.views ?? 0"
assert_silent "clicks_count"     "const x = data.clicks ?? 0"
assert_silent "orders_count"     "const x = pagination.total ?? 0"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
