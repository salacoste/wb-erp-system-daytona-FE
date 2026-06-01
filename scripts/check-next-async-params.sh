#!/usr/bin/env bash
# Next.js 15 async-params/searchParams Validator — Epic 119-FE retro A-1
#
# Catches the Next.js 15 server-component contract footgun discovered in
# Story 119.2-FE (Pass-2 P2-1 CRITICAL): `params` and `searchParams` props on
# App Router page.tsx / layout.tsx MUST be typed as `Promise<...>` and awaited.
# A synchronous declaration passes `tsc --noEmit` (type-check gate) but FAILS
# `next build` route typegen — a gap between the local gate and the production
# build (Epic 119-FE retro SD-2 / I-3). This static check closes that gap
# without paying the full `next build` cost.
#
# Detection: in src/app/**/{page,layout}.tsx, any property declaration of
# `params` or `searchParams` whose type does not contain `Promise<` is flagged.
# Escape hatch: append `// next-async-params-allow: <reason>` on the line for a
# legitimate exception (e.g. an intentionally non-Promise local config object).
#
# Usage:
#   scripts/check-next-async-params.sh              # Validate all route files
#   scripts/check-next-async-params.sh --self-test  # Run self-tests
#   scripts/check-next-async-params.sh --help       # Usage info
#
# Exit codes:
#   0 = all params/searchParams props are Promise-typed
#   1 = synchronous (non-Promise) declaration(s) found
#   2 = usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR_OVERRIDE:-$SCRIPT_DIR/../src/app}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

usage() {
  echo "Usage: $0 [--self-test|--help]"
  echo ""
  echo "Validates that params/searchParams props on App Router page.tsx and"
  echo "layout.tsx files are typed as Promise<...> (Next.js 15 contract)."
}

# Emits "file:line:content" for every synchronous params/searchParams prop
# declaration found under the given directory. A declaration is a line where
# `params` or `searchParams` is followed by an optional `?` then `:` (property
# type position); it is a violation when the line lacks `Promise` and is not
# annotated with the allow comment.
find_violations() {
  local root="$1"
  [[ -d "$root" ]] || return 0
  local files
  files=$(find "$root" \( -name 'page.tsx' -o -name 'layout.tsx' \) -type f 2>/dev/null || true)
  [[ -z "$files" ]] && return 0

  while IFS= read -r file; do
    [[ -z "$file" ]] && continue
    # grep -n keeps line numbers; match a prop-type declaration at line start
    # (allowing leading whitespace): `params:`, `params?:`, `searchParams:`, etc.
    # `|| true` so a no-match file (grep exit 1) does not abort under set -e/pipefail
    { grep -nE '^[[:space:]]*(searchParams|params)[[:space:]]*\??:' "$file" 2>/dev/null || true; } \
    | while IFS= read -r hit; do
        local lineno="${hit%%:*}"   # "lineno:content" → "lineno"
        local content="${hit#*:}"   # "lineno:content" → "content" (colons inside content kept)
        # Skip Promise-typed declarations (correct pattern)
        echo "$content" | grep -q 'Promise' && continue
        # Skip explicitly allowed exceptions
        echo "$content" | grep -q 'next-async-params-allow' && continue
        echo "${file}:${lineno}:${content}"
      done
  done <<< "$files"
}

self_test() {
  local pass=0 fail=0
  local tmp
  tmp=$(mktemp -d "/tmp/next-async-params-XXXXXX")

  # Mimic the App Router layout: files must be named page.tsx / layout.tsx
  mkdir -p "$tmp/good" "$tmp/bad" "$tmp/allow" "$tmp/local"

  # GOOD: Promise-typed searchParams + params (Story 119.2 correct pattern)
  cat > "$tmp/good/page.tsx" <<'TSEOF'
interface Props {
  searchParams?: Promise<{ query?: string | string[] }>
  params: Promise<{ id: string }>
}
export default async function P({ searchParams }: Props) {
  const sp = (await searchParams) ?? {}
  return null
}
TSEOF

  # BAD: synchronous (non-Promise) declarations — the footgun
  cat > "$tmp/bad/page.tsx" <<'TSEOF'
interface Props {
  params: { id: string }
  searchParams: { query?: string }
}
export default function P({ params }: Props) { return null }
TSEOF

  # ALLOW: synchronous but explicitly annotated
  cat > "$tmp/allow/layout.tsx" <<'TSEOF'
interface Props {
  params: { id: string } // next-async-params-allow: legacy fixture, not a real route
}
TSEOF

  # LOCAL: `const params = await searchParams` must NOT be flagged (no colon)
  cat > "$tmp/local/page.tsx" <<'TSEOF'
export default async function P({ searchParams }: { searchParams?: Promise<Record<string, string>> }) {
  const params = (await searchParams) ?? {}
  return params
}
TSEOF

  # Test 1: good file → 0 violations
  if [[ -z "$(find_violations "$tmp/good")" ]]; then
    echo "  [PASS] Test 1: Promise-typed props produce no violations"; ((pass++))
  else
    echo "  [FAIL] Test 1: Promise-typed props were wrongly flagged"; ((fail++))
  fi

  # Test 2: bad file → exactly 2 violations (params + searchParams)
  local bad_count
  bad_count=$(find_violations "$tmp/bad" | grep -c . || true)
  if [[ "$bad_count" -eq 2 ]]; then
    echo "  [PASS] Test 2: synchronous params + searchParams both detected"; ((pass++))
  else
    echo "  [FAIL] Test 2: expected 2 violations, got $bad_count"; ((fail++))
  fi

  # Test 3: allow comment suppresses the violation
  if [[ -z "$(find_violations "$tmp/allow")" ]]; then
    echo "  [PASS] Test 3: next-async-params-allow suppresses violation"; ((pass++))
  else
    echo "  [FAIL] Test 3: allow comment did not suppress violation"; ((fail++))
  fi

  # Test 4: `const params = await ...` (no type colon) is NOT a false positive
  if [[ -z "$(find_violations "$tmp/local")" ]]; then
    echo "  [PASS] Test 4: local 'const params = await' not flagged"; ((pass++))
  else
    echo "  [FAIL] Test 4: local variable assignment wrongly flagged"; ((fail++))
  fi

  # Test 5: invalid argument → exit 2
  local rc
  bash "$0" --bogus 2>/dev/null && rc=0 || rc=$?
  if [[ "${rc:-0}" -eq 2 ]]; then
    echo "  [PASS] Test 5: invalid argument exits 2"; ((pass++))
  else
    echo "  [FAIL] Test 5: invalid argument should exit 2 (got ${rc:-0})"; ((fail++))
  fi

  # Test 6: a route with NO params/searchParams must not error under set -e
  # (regression guard: grep exit-1 on no-match previously aborted the scan)
  mkdir -p "$tmp/nomatch"
  cat > "$tmp/nomatch/page.tsx" <<'TSEOF'
export default function P() { return null }
TSEOF
  local nm_out nm_rc
  nm_out=$(find_violations "$tmp/nomatch") && nm_rc=0 || nm_rc=$?
  if [[ "${nm_rc:-0}" -eq 0 && -z "$nm_out" ]]; then
    echo "  [PASS] Test 6: no-params route scans cleanly (no set -e abort)"; ((pass++))
  else
    echo "  [FAIL] Test 6: no-params route errored (rc=${nm_rc:-0}) or false-flagged"; ((fail++))
  fi

  rm -rf "$tmp"

  echo ""
  if [[ $fail -eq 0 ]]; then
    echo -e "${GREEN}All $pass self-tests passed${NC}"
    exit 0
  else
    echo -e "${RED}$fail self-test(s) failed, $pass passed${NC}"
    exit 1
  fi
}

if [[ "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--self-test" ]]; then
  self_test
fi

if [[ -n "${1:-}" ]]; then
  echo -e "${RED}ERROR: unknown argument '$1'${NC}" >&2
  usage
  exit 2
fi

# --- Main validation ---
violations=$(find_violations "$APP_DIR")

if [[ -n "$violations" ]]; then
  echo -e "${RED}FAIL: synchronous params/searchParams declaration(s) found:${NC}"
  echo "$violations" | while IFS= read -r v; do
    [[ -z "$v" ]] && continue
    echo -e "  ${RED}$v${NC}"
  done
  echo ""
  echo "Next.js 15 requires page/layout params & searchParams to be Promise<...>"
  echo "and awaited. A synchronous type passes tsc but fails 'next build' typegen."
  echo "Fix: type as Promise<...> + 'await' it (see src/app/(dashboard)/analytics/search/page.tsx)."
  echo "Exception: append '// next-async-params-allow: <reason>' to the line."
  exit 1
else
  echo -e "${GREEN}OK: all params/searchParams props are Promise-typed (Next.js 15 contract)${NC}"
  exit 0
fi
