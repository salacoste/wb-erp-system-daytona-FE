# ESLint `max-lines-per-file` rule typo (discovered Story 96.16-FE)

**Status**: Open — needs follow-up story
**Discovered**: 2026-05-09 (Story 96.16-FE)
**Severity**: Medium (silent quality-gate hole; existing files exempt from documented cap)

## What's wrong

`.eslintrc.json:9` declares:

```json
"max-lines-per-file": ["error", 200],
```

But `max-lines-per-file` is **not a real ESLint rule**. The real rule name is `max-lines` (see ESLint docs: https://eslint.org/docs/latest/rules/max-lines). ESLint silently ignores rule names it doesn't recognize, so the documented 200-line cap is non-functional.

## Evidence

- `src/components/custom/orders/OrdersTableRow.tsx` is **215 lines**.
- `npm run lint` returns 0/0 against this file (cap not enforced).
- CLAUDE.md `### Critical Development Rules` documents: "**File size limit**: All source files MUST be under 200 lines (ESLint enforced)" — but ESLint is NOT actually enforcing.

## Why not fix here

Story 96.16-FE is scoped to comment cleanup (single-file JSDoc swap). Fixing the ESLint typo would silently flag many existing files as 200-line violations and require either:
- A multi-file refactor pass to bring all source files under 200 lines, OR
- Per-file `eslint-disable-next-line max-lines` annotations as triage.

Either path is a net-new initiative outside this story's scope.

## Proposed follow-up

File a Sprint Epic 97-FE-candidate story:
1. Rename `.eslintrc.json` rule from `max-lines-per-file` to `max-lines`. Note: the real `max-lines` rule supports both bare-number form (`["error", 200]`) and object form (`["error", { max: 200, skipBlankLines: true, skipComments: true }]`) — choose intentionally based on whether comment lines should count toward the cap.
2. Run `npm run lint` to enumerate all violators (likely many — every file silently exempt for unknown duration).
3. Triage: refactor or add per-file disables with rationale (`// eslint-disable-next-line max-lines` with comment explaining why).
4. **Update CLAUDE.md `### Critical Development Rules` § "File size limit"** — line currently states "**File size limit**: All source files MUST be under 200 lines (ESLint enforced)" but ESLint is NOT actually enforcing. Either: (a) bring all files under 200 lines and KEEP the rule (preferred), or (b) raise/relax the cap to a sustainable target and update CLAUDE.md to match.

## Cross-references

- Story 96.16-FE Dev Agent Record (this story discovered the typo while assessing whether to extract `OrdersTableRow.tsx` into a sibling helpers file).
- Story 96.16-FE 2nd-pass review M2-1 fix (this section was updated post-2nd-pass-review to call out the CLAUDE.md inaccuracy explicitly — original Step 4 only mentioned CLAUDE.md if "the cap target changes", but the actual issue is enforcement state, not cap value).
- CLAUDE.md `### Critical Development Rules` § "File size limit" (the prose claim that needs reconciling with reality).
