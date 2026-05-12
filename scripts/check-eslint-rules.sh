#!/usr/bin/env bash
# ESLint Rule-Name Validator — Story 99.2-FE
#
# Validates that all rule names declared in ESLint config files are recognized
# by ESLint. Catches silent disablement from typos (e.g., `max-lines-per-file`
# instead of `max-lines` — the Class 5 defect from Story 97.7 investigation).
#
# Usage:
#   scripts/check-eslint-rules.sh              # Validate all configs
#   scripts/check-eslint-rules.sh --self-test  # Run self-tests
#   scripts/check-eslint-rules.sh --help       # Usage info
#
# Exit codes:
#   0 = all rule names valid
#   1 = unknown rule names found
#   2 = usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

usage() {
  echo "Usage: $0 [--self-test|--help]"
  echo ""
  echo "Validates ESLint rule names in .eslintrc.json and eslint.config.js"
  echo "against ESLint's known rule registry."
}

load_known_rules() {
  local rules
  rules=$(cd "$MONOREPO_ROOT" && npx eslint --print-config frontend/src/app/page.tsx 2>/dev/null \
    | node -e "
      const chunks = [];
      process.stdin.on('data', c => chunks.push(c));
      process.stdin.on('end', () => {
        const cfg = JSON.parse(Buffer.concat(chunks).toString());
        Object.keys(cfg.rules || {}).forEach(r => console.log(r));
      });
    ")
  if [[ -z "$rules" ]]; then
    rules=$(cd "$MONOREPO_ROOT" && node -e "
      const eslint = require('eslint');
      const linter = new eslint.Linter();
      process.stdout.write([...linter.getRules().keys()].join('\n'));
    " 2>/dev/null)
  fi
  echo "$rules"
}

extract_eslintrc_rules() {
  local filepath="$1"
  node -e "
    const c = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
    const rules = c.rules || {};
    Object.keys(rules).forEach(r => console.log(r));
    (c.overrides || []).forEach(o => {
      Object.keys(o.rules || {}).forEach(r => console.log(r));
    });
  " "$filepath" 2>/dev/null
}

extract_flat_config_rules() {
  local filepath="$1"
  grep -oE "'([@a-z][@a-z0-9-]*/[a-z0-9-]+|[@a-z][a-z0-9-]+)'" "$filepath" \
    | tr -d "'" \
    | grep -vE '^(error|warn|off|module|sourceType|latest|browser|node|jest|dist|commonjs|@typescript-eslint)$' \
    | grep -vE '/(parser|eslint-plugin)$' \
    | sort -u || true
}

self_test() {
  local pass=0 fail=0

  local known_rules
  known_rules=$(load_known_rules)

  if [[ -z "$known_rules" ]]; then
    echo "  [FAIL] Cannot load known rules — aborting self-tests"
    exit 1
  fi

  # Test 1: current .eslintrc.json rules should all be known
  local current_rules t1_fail=0
  current_rules=$(extract_eslintrc_rules "$SCRIPT_DIR/../.eslintrc.json")
  while IFS= read -r rule; do
    [[ -z "$rule" ]] && continue
    if ! echo "$known_rules" | grep -qx "$rule"; then
      echo "  [FAIL] Test 1: current rule '$rule' not in known set"
      t1_fail=1
    fi
  done <<< "$current_rules"
  if [[ $t1_fail -eq 0 ]]; then
    echo "  [PASS] Test 1: current .eslintrc.json rules all valid"
    ((pass++))
  else
    ((fail++))
  fi

  # Test 2: unknown rule should be detected
  if ! echo "$known_rules" | grep -qx "this-rule-does-not-exist-at-all"; then
    echo "  [PASS] Test 2: unknown rule correctly detected"
    ((pass++))
  else
    echo "  [FAIL] Test 2: fake rule should NOT be in known rules"
    ((fail++))
  fi

  # Test 3: max-lines-per-file (the original typo) should NOT be known
  if ! echo "$known_rules" | grep -qx "max-lines-per-file"; then
    echo "  [PASS] Test 3: max-lines-per-file typo correctly detected"
    ((pass++))
  else
    echo "  [FAIL] Test 3: max-lines-per-file should NOT be a known rule"
    ((fail++))
  fi

  # Test 4: max-lines (the correct name) SHOULD be known
  if echo "$known_rules" | grep -qx "max-lines"; then
    echo "  [PASS] Test 4: max-lines correctly recognized"
    ((pass++))
  else
    echo "  [FAIL] Test 4: max-lines should be a known rule"
    ((fail++))
  fi

  # Test 5: flat-config extraction should capture @typescript-eslint rules
  local flat_rules
  flat_rules=$(extract_flat_config_rules "$MONOREPO_ROOT/eslint.config.js")
  if echo "$flat_rules" | grep -q "@typescript-eslint/no-explicit-any"; then
    echo "  [PASS] Test 5: flat-config extraction captures @typescript-eslint rules"
    ((pass++))
  else
    echo "  [FAIL] Test 5: flat-config extraction missing @typescript-eslint rules"
    ((fail++))
  fi

  # Test 6: invalid argument should error
  local err_output
  err_output=$(bash "$0" --bogus-flag 2>&1) && rc=0 || rc=$?
  if [[ $rc -eq 2 ]] && echo "$err_output" | grep -q "unknown argument"; then
    echo "  [PASS] Test 6: invalid argument produces usage error (exit 2)"
    ((pass++))
  else
    echo "  [FAIL] Test 6: invalid argument should exit 2 with error (got exit $rc)"
    ((fail++))
  fi

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

# Unknown argument → usage error
if [[ -n "${1:-}" ]]; then
  echo -e "${RED}ERROR: unknown argument '$1'${NC}" >&2
  usage
  exit 2
fi

# --- Main validation ---

known_rules=$(load_known_rules)

if [[ -z "$known_rules" ]]; then
  echo -e "${RED}ERROR: Could not load ESLint rule registry${NC}"
  exit 2
fi

unknown_count=0
checked_files=0

# --- Validate .eslintrc.json (documentation/IDE file) ---
eslintrc="${ESLINTRC_OVERRIDE:-$SCRIPT_DIR/../.eslintrc.json}"
if [[ -f "$eslintrc" ]]; then
  checked_files=$((checked_files + 1))
  declared_rules=$(extract_eslintrc_rules "$eslintrc")

  while IFS= read -r rule; do
    [[ -z "$rule" ]] && continue
    if ! echo "$known_rules" | grep -qx "$rule"; then
      echo -e "${RED}UNKNOWN: $rule${NC} (in .eslintrc.json)"
      unknown_count=$((unknown_count + 1))
    fi
  done <<< "$declared_rules"
fi

# --- Validate eslint.config.js (flat config, enforcement path) ---
flat_config="$MONOREPO_ROOT/eslint.config.js"
if [[ -f "$flat_config" ]]; then
  checked_files=$((checked_files + 1))
  flat_rules=$(extract_flat_config_rules "$flat_config")

  while IFS= read -r rule; do
    [[ -z "$rule" ]] && continue
    if ! echo "$known_rules" | grep -qx "$rule"; then
      echo -e "${RED}UNKNOWN: $rule${NC} (in eslint.config.js)"
      unknown_count=$((unknown_count + 1))
    fi
  done <<< "$flat_rules"
fi

# --- Summary ---
if [[ $unknown_count -gt 0 ]]; then
  echo ""
  echo -e "${RED}FAIL: $unknown_count unknown rule name(s) in $checked_files file(s)${NC}"
  echo "Unknown rules are silently ignored by ESLint — fix or remove them."
  exit 1
else
  echo -e "${GREEN}OK: all rule names valid in $checked_files file(s)${NC}"
  exit 0
fi
