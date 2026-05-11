# ESLint `max-lines-per-file` rule typo (discovered Story 96.16-FE)

**Status**: Closed (Story 97.6-FE)
**Discovered**: 2026-05-09 (Story 96.16-FE)
**Fixed**: 2026-05-10 (typo → `max-lines`, interim max=800 with skipBlankLines+skipComments)
**Severity**: Medium → Low (rule now active but at interim 800-line ceiling; full 200-line cap deferred)

## What's wrong

`.eslintrc.json:10` declares:

```json
"max-lines-per-file": ["error", 200],
```

But `max-lines-per-file` is **not a real ESLint rule**. The real rule name is `max-lines` (see ESLint docs: https://eslint.org/docs/latest/rules/max-lines). ESLint silently ignores rule names it doesn't recognize, so the documented 200-line cap was non-functional.

## Fix applied (2026-05-10)

Rule renamed to `max-lines` with object form and interim ceiling:

```json
"max-lines": ["error", { "max": 800, "skipBlankLines": true, "skipComments": true }],
```

This keeps the rule active (catches new violations above 800 lines) without breaking CI on 26 existing files that exceed the documented 200-line cap. The 800 ceiling was chosen to accommodate the largest existing source file (`src/types/price-calculator.ts` at 799 lines) with a small margin.

## Evidence

- `src/components/custom/orders/OrdersTableRow.tsx` is **215 lines**.
- `npm run lint` returns 0/0 against this file (cap not enforced).
- CLAUDE.md `### Critical Development Rules` documents: "**File size limit**: All source files MUST be under 200 lines (ESLint enforced)" — but ESLint is NOT actually enforcing.

## Why not fix to full 200-line cap here

26 non-test source files exceed 200 lines (11 are type definition files). Immediately enforcing the documented 200-line cap would break CI. The interim 800-line ceiling was chosen as a safe floor that:
- Catches egregious new violations
- Doesn't break CI on existing code
- Leaves the full 200-line tightening as a deliberate follow-up

## Remaining follow-up (Epic 97-FE candidate)

1. **Triage 26 violators**: refactor or add per-file `/* eslint-disable max-lines */` with rationale. 11 are `src/types/` files (data-heavy by nature) — consider a types-specific override.
2. **Tighten threshold incrementally**: 800 → 400 → 200, one pass at a time.
3. **Update CLAUDE.md `### Critical Development Rules` § "File size limit"** — currently states "All source files MUST be under 200 lines (ESLint enforced)" which is aspirational until the threshold reaches 200. Either bring all files under 200 lines and keep the prose, or update the documented cap to match the chosen sustainable target.

## Cross-references

- Story 96.16-FE Dev Agent Record (this story discovered the typo while assessing whether to extract `OrdersTableRow.tsx` into a sibling helpers file).
- Story 96.16-FE 2nd-pass review M2-1 fix (this section was updated post-2nd-pass-review to call out the CLAUDE.md inaccuracy explicitly — original Step 4 only mentioned CLAUDE.md if "the cap target changes", but the actual issue is enforcement state, not cap value).
- CLAUDE.md `### Critical Development Rules` § "File size limit" (the prose claim that needs reconciling with reality).

## Closure (Story 97.6-FE)

**Status**: Closed → Resolved.
**Date**: 2026-05-11
**Resolution**: The `.eslintrc.json` typo was fixed by renaming `max-lines-per-file` → `max-lines` using the object form with `skipBlankLines: true` and `skipComments: true`. A triage audit found 328 files exceeding 200 raw lines per `wc -l` (of which ~26 are non-test source files; the remainder are test files and fixtures). Path (c) "raise cap" was chosen with an 800-line ceiling to accommodate the largest existing source file (`src/types/price-calculator.ts` at 799 lines) without breaking CI. CLAUDE.md `### Critical Development Rules` § "File size limit" was reconciled to reflect the actual 800-line enforcement cap, and the companion "Extract at ~150 lines" proactive heuristic was preserved as an ergonomic target independent of the enforcement ceiling. Full 200-line tightening is deferred to a future sprint as an incremental tightening exercise (800 → 400 → 200). Post-fix lint state: 0 errors, 0 warnings.
**Cross-reference**: [`_bmad-output/implementation-artifacts/97-6-fe-eslint-max-lines-typo-fix-claude-md-reconcile.md`]
