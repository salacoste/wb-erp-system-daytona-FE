# Privacy ESLint Rule — Manual Application Required

**Source**: Epic 86-FE retro action item #7 (B1 in 2026-04-07 quality hardening sprint)
**Status**: Ready to apply manually
**Date**: 2026-04-07

---

## Why

Story 86.2 established a privacy guardrail testing pattern (console spies + storage sweeps in `useClientInfo.test.ts`). The tests catch PII leakage at runtime, but **defense-in-depth via lint catches violations at write-time** — before they're even committed.

The global `no-console` rule in `.eslintrc.json` allows `console.warn` and `console.error`. For files handling PII, even those should be forbidden — PII flows must never appear in any log sink (browser DevTools, Sentry/error reporting, remote logs).

This proposal adds an ESLint `overrides` block that forbids ALL `console.*` calls in files matching PII-related glob patterns.

## What to add

Open `frontend/.eslintrc.json` and add an `"overrides"` array as a sibling of `"rules"`:

### Before

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "max-lines-per-file": ["error", 200],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### After

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "max-lines-per-file": ["error", 200],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  },
  "overrides": [
    {
      "files": [
        "**/client-info*.{ts,tsx}",
        "**/useClientInfo*.{ts,tsx}",
        "**/orders-client-info*.{ts,tsx}",
        "**/*pii*.{ts,tsx}",
        "**/*personal-data*.{ts,tsx}"
      ],
      "rules": {
        "no-console": ["error", { "allow": [] }]
      }
    }
  ]
}
```

**Key change**: added a comma after `}` of `"rules"`, then the new `"overrides"` array.

## How it works

- ESLint's `overrides` feature applies stricter rules to files matching the glob patterns.
- The override sets `no-console: ["error", { "allow": [] }]` — `error` severity (fails CI/lint, not just warns) and `allow: []` (no exceptions, even `warn` and `error`).
- The global rule still applies to all OTHER files (warn-only, allows console.warn/error).

## What it catches

```typescript
// In src/hooks/useClientInfo.ts
console.log('Fetching client info for:', orderIds)  // ❌ ESLint error
console.info(`[ClientInfo] ${response.length} items`) // ❌ ESLint error
console.warn('Slow client-info request')             // ❌ ESLint error (would be allowed globally)
console.error('Client info fetch failed')            // ❌ ESLint error (would be allowed globally)
```

## What it does NOT catch (intentional)

```typescript
// In src/hooks/__tests__/useClientInfo.test.ts
const spy = vi.spyOn(console, 'info')  // ✅ Allowed — not a console.X() call expression
toast.error('Превышен лимит запросов')  // ✅ Allowed — toast, not console
```

`vi.spyOn(console, 'info')` passes `console` as an ARGUMENT. ESLint's `no-console` rule looks for `MemberExpression` nodes where `console` is the object of a method call (e.g., `console.info(...)`), not when `console` is referenced as a variable. The privacy guardrail tests in `useClientInfo.test.ts` will continue to work.

## To extend the guard for new PII features

When adding a new feature that handles personal data, add a glob pattern to the `files` array. Example for adding email-handling code:

```json
"files": [
  "**/client-info*.{ts,tsx}",
  "**/useClientInfo*.{ts,tsx}",
  "**/orders-client-info*.{ts,tsx}",
  "**/*pii*.{ts,tsx}",
  "**/*personal-data*.{ts,tsx}",
  "**/email-validation*.{ts,tsx}"
]
```

## Verification after applying

```bash
# 1. ESLint loads the config without errors
cd frontend
npx eslint src/lib/api/orders/client-info-api.ts

# Expected: clean output (no errors)

# 2. Full lint sweep still passes (rule should not catch any existing violations)
npm run lint

# Expected: "✔ No ESLint warnings or errors"

# 3. Sanity test — temporarily add console.log to useClientInfo.ts and run lint
# (Don't commit this!)
echo 'console.log("test")' >> src/hooks/useClientInfo.ts
npm run lint
# Expected: error on the new line ("Unexpected console statement")

# Revert the test change:
git checkout src/hooks/useClientInfo.ts
```

## Why this is documented as a manual step

ESLint's JSON config format does not support comments, and tooling around the config file in this repo has been resistant to programmatic edits in the current session. Rather than fight the tooling, this document captures the change as a clean ready-to-apply artifact for manual review and merge.

After you've applied this, you can delete this file (`docs/PRIVACY-ESLINT-RULE-PROPOSAL.md`).

## Cross-references

- Source action item: `_bmad-output/implementation-artifacts/epic-86-fe-retro-2026-04-07.md` (action item #7)
- Privacy guardrail tests this complements: `src/hooks/__tests__/useClientInfo.test.ts` (4 explicit guardrail tests)
- Privacy testing pattern documentation: `frontend/CLAUDE.md` (Critical Development Rules section)
- The PII memory file: `~/.claude/projects/.../memory/reference_pii_testing_pattern.md`
