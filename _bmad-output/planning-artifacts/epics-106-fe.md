# Epic 106-FE: Triage Anti-Pattern #8 Allowlists from Story 105.1

**Priority**: P3 (debt cleanup — converts allowlist comments into permanent documented exceptions)
**Estimate**: ~2.5 SP (range [2, 4])
**Source**: Epic 105-FE retrospective action item A-1
**Created**: 2026-05-15

## Objective

Triage the 63-64 `eslint-disable-next-line no-restricted-syntax` comments added in Story 105.1-FE and turn them from "PRE-EXISTING — review in Story 105.X follow-up" placeholders into permanent, specific allowlists with concrete rationales. Plus fix the one genuine Anti-Pattern #8 violation discovered during triage.

## Triage Results (already complete, 2026-05-15)

| Category | Count |
|---|---|
| **FIX** — real violation requiring `?? null` + type widening | 1 |
| **KEEP** — legitimate exception with valid reason | 63 |
| **REMOVE** — false positive | 0 |
| **Total** | 64 |

**The one FIX**: `src/lib/daily/aggregation.ts:104` — `theoreticalProfit: finance?.net_profit ?? 0`. Story 88.2-FE inline comment in code says this SHOULD be `null` (COGS-unknown semantic) but aggregation requires number. Must widen to `number | null` and add display-layer `—` guard.

**The 63 KEEP cases** fall into 6 canonical patterns:

1. **Backend-contract-non-null**: backend service explicitly types field as `number` (verified via test-api/*.http or service source). Examples: `calculate-margin-stats.ts:25` (`sales_gross`), `fbs-analytics-normalizer.ts:25` (`revenue`).
2. **Semantic-zero**: 0 is the legitimate "no activity" value for this field. Examples: `daily/aggregation.ts:59` (`total_spend` = no ads ran), `two-level-pricing.ts:64` (`vat_pct` = non-VAT payer).
3. **Aggregation-reduce**: null per item = no contribution to the sum. Examples: `over-attribution-utils.ts:22` (`revenue` reduce), `useDashboardMetricsWithPeriod-utils.ts:78` (weekly profit sum).
4. **Display-guard**: null = absent line item; renders "0₽" because the row is shown but value is zero. Examples: `SkuCashflowSection.tsx:62` (`acquiring_fee`), `OtherAdjustmentsRows.tsx:52` (`wb_promotion_cost`).
5. **Debug-log**: never rendered to user; null→0 in log string interpolation. Examples: `daily/aggregation.ts:73` (`wb_sales_gross` in debug), `storage-analytics-queries.ts:116`.
6. **Test-assertion**: TypeScript guard already established non-null in scope; the `?? 0` is for compiler not runtime. Examples: `useAdvertisingAnalytics.test.ts:415` (revenue post-guard assertion).

## Stories

### Story 106.1-FE: Fix net_profit nullability in daily aggregation (~0.5 SP)

Change the one real Anti-Pattern #8 violation.

**Tasks**:
- `src/lib/daily/aggregation.ts:104`: change `theoreticalProfit: finance?.net_profit ?? 0` to `theoreticalProfit: finance?.net_profit ?? null`
- `src/types/daily-metrics.ts`: widen `DailyMetrics.theoreticalProfit` type from `number` to `number | null`
- Search consumers of `theoreticalProfit` (grep `theoreticalProfit` in `src/`):
  - For display-layer usage: add `—` guard (e.g., `value === null ? '—' : formatCurrency(value)`)
  - For arithmetic/aggregation usage: handle null defensively
- Remove the `eslint-disable-next-line` comment at line 104 (no longer needed)
- Update at least 1 unit test asserting null preservation

**Acceptance criteria**:
- `theoreticalProfit` typed as `number | null`
- Display layer renders `—` for null (no implicit `0` rendering)
- 1 new/updated test asserting null preservation through aggregation pipeline
- ESLint rule passes (1 fewer allowlist disable comment)
- All baseline gates green
- Story passes 2-pass adversarial review per CLAUDE.md discipline

### Story 106.2-FE: Replace 63 PRE-EXISTING rationales with concrete reasons (~1.5 SP)

Mechanical sweep across 25 files updating allowlist comments.

**Tasks**:
- For each of 63 KEEP allowlists from the triage table, replace the comment `// eslint-disable-next-line no-restricted-syntax -- PRE-EXISTING — review in Story 105.X follow-up. <terse rationale>` with `// eslint-disable-next-line no-restricted-syntax -- <PATTERN-NAME>: <specific rationale>`
- Use the 6 canonical pattern names from triage results as the prefix
- Examples of the new format:
  - `// eslint-disable-next-line no-restricted-syntax -- BACKEND-CONTRACT-NON-NULL: CabinetExpenses.sales_gross is typed number in /v1/finance/cabinet-expenses response`
  - `// eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: 0 = no ads ran (legitimate "no activity" value, Story 91.2-FE)`
  - `// eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: null per week = no contribution to weekly sum`
  - `// eslint-disable-next-line no-restricted-syntax -- DISPLAY-GUARD: null = absent line item; renders 0₽ for visual consistency`
  - `// eslint-disable-next-line no-restricted-syntax -- DEBUG-LOG: never rendered to user; null→0 in console output only`
  - `// eslint-disable-next-line no-restricted-syntax -- TEST-ASSERTION: TypeScript guard above narrows to non-null; ?? 0 is compiler-only`
- No source-logic changes — only comment updates

**Acceptance criteria**:
- 63 comments updated with concrete rationales matching the 6 canonical patterns
- Zero source-logic changes
- ESLint clean (0 errors / 112 warnings baseline)
- All baseline gates green
- 2-pass review passes (mostly to verify rationales are accurate per the triage table)

### Story 106.3-FE: Document Anti-Pattern #8 Exceptions in CLAUDE-PATTERNS.md (~0.5 SP)

New section codifying the 6 legitimate exception patterns.

**Tasks**:
- Add new section "Anti-Pattern #8 Exceptions" to `CLAUDE-PATTERNS.md`
- For each of 6 canonical patterns, document:
  - **When to apply**: trigger criteria
  - **Comment format**: the standard allowlist syntax
  - **Canonical example**: file:line citation
  - **Anti-pattern (don't confuse with)**: how it differs from a real Anti-Pattern #8 violation
- Update CLAUDE.md § Known Anti-Patterns #8 to cross-reference the new exceptions section
- Add validation: future code reviews should classify any new `eslint-disable no-restricted-syntax` into one of these 6 patterns

**Acceptance criteria**:
- New section in CLAUDE-PATTERNS.md with all 6 patterns documented
- CLAUDE.md cross-reference added
- Citations verified (doc-citation gate clean)
- All baseline gates green
- 2-pass review passes

### Story 106.4-FE: Tests + polish + retrospective (~0.5 SP)

Final quality-gate sweep + Epic 106-FE retrospective.

**Tasks**:
- Run all baseline gates (lint, tsc, vitest, doc-citations, ESLint rule names, self-test)
- Verify Story 106.1 source change didn't break vitest baseline
- File Epic 106-FE retrospective at `_bmad-output/implementation-artifacts/epic-106-fe-retro-{date}.md`
- Update sprint-status: epic-106-fe + 4 stories + retrospective → done

**Acceptance criteria**:
- All quality gates baseline-clean
- Retrospective filed with action items
- Epic 106-FE marked done in sprint-status

## Dependencies

- Story 105.1-FE: ESLint rule + 66 allowlists (Epic 105-FE)
- Story 88.2-FE: original null-preservation pattern for net_profit
- Story 91.2-FE: daily/finance with advertisingSpend + netProfit
- CLAUDE.md § Known Anti-Patterns #8
- CLAUDE-PATTERNS.md (new exceptions section)

## Risks / Open Questions

1. **net_profit consumer count unknown**: Story 106.1 needs `grep theoreticalProfit src/` first — may surface multiple display sites needing `—` guards. Could expand SP if many consumers.
2. **Comment format consistency**: 25 files with 63 comments to update means high chance of typos or inconsistent formatting. Consider scripted sweep (sed/awk) for deterministic replacement.
3. **Pattern documentation drift**: CLAUDE-PATTERNS.md additions need to match the actual code allowlist comments. If Story 106.2 uses a slightly different rationale than Story 106.3 documents, 2-pass review must catch the divergence.
