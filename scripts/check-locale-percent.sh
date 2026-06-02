#!/usr/bin/env bash
# Dot-locale percent ratchet — iter-67 (consolidation of a ~108-site systemic debt)
#
# Bans NEW dot-locale percent rendering. The Russian-locale rule (frontend/CLAUDE.md § Formatters)
# requires "15,5 %" (comma decimal + NBSP) but inline
#   `${value.toFixed(N)}%`   or   value.toFixed(N) + '%'
# renders "15.5%" (dot, no separator). Use formatPercentage / formatPercentageInt (src/lib/utils.ts).
#
# RATCHET, not 0-tolerance: ~108 pre-existing sites are allowed via a baseline COUNT
# (scripts/.locale-percent-baseline.txt); the gate fails only when the count INCREASES. As sites
# migrate the count drops — the gate prints "ratchet down" and you MUST lower the baseline in the
# same commit. See docs/process/dot-locale-percent-consolidation-proposal.md.
#
# SCOPE BOUNDARY (known, by design — it's a bridge to a future ESLint rule):
#   - Catches the two INLINE idioms: `…${x.toFixed(N)}%…` (incl JSX `}%`) and `x.toFixed(N) + '%'`/"%".
#   - Does NOT catch intermediate-variable / helper-wrapped forms, e.g.
#       const f = x.toFixed(1); return f + '%'   (see advertising/utils/formatters.ts:52).
#     Those evade the count; the real fix for them is the proposed ESLint rule.
# ENFORCEMENT: like its peers (check:docs / check:next-params / check:eslint-rules) this is a
#   story-discipline gate run manually + in the 2-pass review, NOT in CI/husky.
#
# Escape hatch: append `// locale-percent-allow: <reason>` on a legitimate-exception line
# (recharts axis-tick formatter that must return a plain string, CSV-export numeric, etc.).
#
# Usage:  scripts/check-locale-percent.sh [--self-test|--help]
# Exit:   0 = count <= baseline  |  1 = count > baseline (NEW)  |  2 = usage/baseline error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_DIR="${SRC_DIR_OVERRIDE:-$SCRIPT_DIR/../src}"
BASELINE_FILE="${BASELINE_FILE_OVERRIDE:-$SCRIPT_DIR/.locale-percent-baseline.txt}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'

# Two dot-locale percent forms (single source of truth). Template arm tolerates a space before %;
# concat arm tolerates spaces around + and either quote style. M-2/M-3 (iter-67 review).
PATTERN="\.toFixed\([0-9]*\)\} *%|\.toFixed\([0-9]*\) *\+ *[\"']%[\"']"

usage() {
  echo "Usage: $0 [--self-test|--help]"
  echo "Ratchets the count of dot-locale percent occurrences (\`.toFixed(N)}%\`) against a baseline."
}

# Count dot-locale percent OCCURRENCES (not lines — M-2) under $1, excluding test/spec files,
# __tests__/fixtures paths, and any line carrying the `locale-percent-allow` escape comment.
count_matches() {
  local root="${1:-$SRC_DIR}"
  [[ -d "$root" ]] || { echo 0; return 0; }
  local n
  n=$(find "$root" \( -name '*.ts' -o -name '*.tsx' \) \
        ! -name '*.test.*' ! -name '*.spec.*' \
        ! -path '*__tests__*' ! -path '*/fixtures/*' ! -path '*/__mocks__/*' \
        -type f -print0 2>/dev/null \
      | xargs -0 grep -hE "$PATTERN" 2>/dev/null \
      | grep -v 'locale-percent-allow' \
      | grep -oE "$PATTERN" \
      | grep -c . || true)
  echo "${n:-0}"
}

self_test() {
  local pass=0 fail=0 tmp
  tmp=$(mktemp -d "/tmp/locale-percent-XXXXXX")
  mkdir -p "$tmp/src/__tests__"

  # 3 violations: template, single-quote concat, double-quote concat (M-3). 1 allowed, 1 clean.
  cat > "$tmp/src/a.tsx" <<'TSEOF'
const a = `${x.toFixed(1)}%`
const b = x.toFixed(2) + '%'
const e = x.toFixed(1) + "%"
const c = `${x.toFixed(1)}%` // locale-percent-allow: recharts axis tick needs a plain string
const d = formatPercentage(x)
TSEOF
  # Two violations on ONE line must count as 2 (M-2: occurrences, not lines).
  cat > "$tmp/src/two.tsx" <<'TSEOF'
const z = `${a.toFixed(1)}%` + `${b.toFixed(2)}%`
TSEOF
  # Test-support files under __tests__ (no .test. in name) must be excluded (LOW-1).
  cat > "$tmp/src/__tests__/fixtures.ts" <<'TSEOF'
export const mock = `${x.toFixed(1)}%`
TSEOF

  local c; c=$(count_matches "$tmp/src")
  if [[ "$c" -eq 5 ]]; then
    echo "  [PASS] Test 1: 5 occurrences (3 single-line + 2 on one line); allow/__tests__/clean excluded"; ((pass++))
  else
    echo "  [FAIL] Test 1: expected 5, got $c"; ((fail++))
  fi

  mkdir -p "$tmp/empty"
  if [[ "$(count_matches "$tmp/empty")" -eq 0 ]]; then
    echo "  [PASS] Test 2: empty tree → 0"; ((pass++))
  else echo "  [FAIL] Test 2: empty tree should be 0"; ((fail++)); fi

  local rc; bash "$0" --bogus 2>/dev/null && rc=0 || rc=$?
  if [[ "${rc:-0}" -eq 2 ]]; then
    echo "  [PASS] Test 3: invalid argument exits 2"; ((pass++))
  else echo "  [FAIL] Test 3: invalid argument should exit 2 (got ${rc:-0})"; ((fail++)); fi

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
current=$(count_matches "$SRC_DIR")

if [[ "$current" -gt "$baseline" ]]; then
  echo -e "${RED}FAIL: dot-locale percent occurrences increased $baseline → $current (+$((current - baseline)) NEW).${NC}"
  echo "Use formatPercentage / formatPercentageInt (src/lib/utils.ts) → \"15,5 %\"."
  echo "Escape hatch: \`// locale-percent-allow: <reason>\`. List: grep -rnE \"$PATTERN\" src --include='*.ts' --include='*.tsx' | grep -v '.test.'"
  exit 1
elif [[ "$current" -lt "$baseline" ]]; then
  echo -e "${YELLOW}OK (ratchet down): occurrences $baseline → $current. Lower the baseline to $current in${NC}"
  echo -e "${YELLOW}$BASELINE_FILE in this commit to lock in the migration.${NC}"
  exit 0
else
  echo -e "${GREEN}OK: dot-locale percent occurrences = $current (== baseline; no new violations)${NC}"
  exit 0
fi
