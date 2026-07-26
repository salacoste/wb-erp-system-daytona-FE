#!/usr/bin/env bash
# test-anti-pattern-8-normalizer-rule.sh — task-48
# Self-tests for the boundary-normalizer/mapper Anti-Pattern #8 coverage.
#
# Two layers are exercised:
#   A) The no-restricted-syntax ESLint override (eslint.config.js, files:
#      src/lib/api/*-normalizer.ts / *-mapper.ts) — bare-member money/ratio '?? 0'.
#      Asserts: fires on money/ratio names, silent on counts, and silent when the
#      SAME code lives OUTSIDE a normalizer/mapper filename (scope check).
#   B) The helper-defeat ratchet (check-anti-pattern-8-normalizer.sh) — delegates
#      to that script's own --self-test.
#
# Exit 0 on all-pass, exit 1 on any failure.
# Usage: scripts/test-anti-pattern-8-normalizer-rule.sh [--self-test|--help]
#   (--self-test is an alias for the default run, for parity with sibling gates.)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$ROOT/scripts"
ESLINT_BIN="${ESLINT_BIN_OVERRIDE:-$ROOT/node_modules/.bin/eslint}"
CREATED_FILES=()

cleanup() {
  if [[ ${#CREATED_FILES[@]} -gt 0 ]]; then
    rm -f "${CREATED_FILES[@]}"
  fi
}
trap cleanup EXIT

if [[ ! -x "$ESLINT_BIN" ]]; then
  echo "AP#8 infrastructure error: ESLint binary is missing or not executable: $ESLINT_BIN" >&2
  exit 2
fi

[[ "${1:-}" == "--help" ]] && { echo "Usage: $0 [--self-test|--help]"; exit 0; }
if [[ -n "${1:-}" && "${1:-}" != "--self-test" ]]; then
  echo "ERROR: unknown argument '$1'" >&2; echo "Usage: $0 [--self-test|--help]" >&2; exit 2
fi

PASS=0
FAIL=0

# Run ESLint on a file INSIDE the frontend so the flat-config override matches by
# path glob. $1 = absolute path to a temp file already placed under src/lib/api.
run_eslint() {
  local file="$1" output status
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

# assert_fires <label> <basename-with-ext> <code>
# basename must end in -normalizer.ts / -mapper.ts (or NOT, for the scope test).
assert_fires() {
  local label="$1" name="$2" code="$3"
  local srcfile="$ROOT/src/lib/api/_ap8n_test_tmp_${name}"
  CREATED_FILES+=("$srcfile")
  printf '/* eslint-disable @typescript-eslint/no-unused-vars */\n%s\n' "$code" > "$srcfile"
  local out; out=$(run_eslint "$srcfile"); rm -f "$srcfile"
  if echo "$out" | grep -q 'no-restricted-syntax'; then
    echo "  PASS (fires)  [$label]"; PASS=$((PASS + 1))
  else
    echo "  FAIL (silent) [$label] — expected rule to fire"; echo "         code: $code"; FAIL=$((FAIL + 1))
  fi
}

# assert_silent <label> <basename-with-ext> <code>
assert_silent() {
  local label="$1" name="$2" code="$3"
  local srcfile="$ROOT/src/lib/api/_ap8n_test_tmp_${name}"
  CREATED_FILES+=("$srcfile")
  printf '/* eslint-disable @typescript-eslint/no-unused-vars */\n%s\n' "$code" > "$srcfile"
  local out; out=$(run_eslint "$srcfile"); rm -f "$srcfile"
  if echo "$out" | grep -q 'no-restricted-syntax'; then
    echo "  FAIL (fires)  [$label] — expected rule to be silent"; echo "         code: $code"; FAIL=$((FAIL + 1))
  else
    echo "  PASS (silent) [$label]"; PASS=$((PASS + 1))
  fi
}

echo "=== Anti-Pattern #8 normalizer/mapper coverage self-tests (task-48) ==="
echo ""
echo "--- A) ESLint override: bare-member money/ratio '?? 0' in a *-normalizer.ts ---"
echo "    (rule MUST fire)"

assert_fires "revenue_norm"  "revenue-normalizer.ts" "const x = raw.revenue ?? 0"
assert_fires "cost_optchain" "cost-normalizer.ts"    "const x = raw?.cost ?? 0"
assert_fires "price_mapper"  "price-mapper.ts"       "const x = raw.retail_price ?? 0"
assert_fires "margin_suffix" "margin-normalizer.ts"  "const x = raw.margin_pct ?? 0"

echo ""
echo "--- A) ESLint override: counts / documented exceptions in a *-normalizer.ts ---"
echo "    (rule MUST be silent)"

# Counts — no money/ratio name → silent.
assert_silent "orders_count" "orders-normalizer.ts"  "const x = raw.orders ?? 0"
assert_silent "total_count"  "total-normalizer.ts"   "const x = pagination.total ?? 0"
# Allowlisted money field — escape hatch honored.
assert_silent "allowlisted"  "ads-normalizer.ts"     "// eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: no ads
const x = raw.spend ?? 0"

echo ""
echo "--- A) Scope check: SAME money '?? 0' OUTSIDE a normalizer/mapper filename ---"
echo "    (this override MUST be silent — root selectors handle non-normalizer paths)"

# A file NOT ending in -normalizer.ts / -mapper.ts under src/lib/api must not trip
# THIS override. (Note: the file lands under src/lib/api but with a plain name, so
# only the source-wide block applies. raw.foo is not a money name, so silent.)
assert_silent "non_norm_scope" "_helper_plain.ts"    "const x = raw.foo ?? 0"

echo ""
echo "--- B) Helper-defeat ratchet self-test (delegated) ---"
if bash "$SCRIPT_DIR/check-anti-pattern-8-normalizer.sh" --self-test; then
  echo "  PASS (ratchet self-test)"; PASS=$((PASS + 1))
else
  echo "  FAIL (ratchet self-test)"; FAIL=$((FAIL + 1))
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -gt 0 ]] && exit 1
exit 0
