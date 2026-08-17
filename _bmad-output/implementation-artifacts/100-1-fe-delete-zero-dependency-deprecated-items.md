# Story 100.1: Delete Zero-Dependency Deprecated Items

Status: done

## Story

As a developer,
I want 15 deprecated code items that have zero consumers removed from the codebase,
so that the codebase is clean and maintenance burden is reduced.

## Background & Context

**Source**: Epic 100-FE (tech debt cleanup). After 29 consecutive epics (71-99), 21 deprecated annotations accumulated across 11 files. This story handles the 15 items that have zero importers — the safest possible deletions.

**Classification**: All 15 items were verified by grepping the full codebase for importers. Each has exactly zero consumers outside its own definition and tests.

## Acceptance Criteria

1. **15 deprecated items deleted** across 11 files (see Tasks for full list)
2. **No files under 200 lines** after deletions (file size compliance maintained)
3. **All quality gates green**: ESLint 0 errors / 112 warnings, type-check 20 errors (advertising-analytics-api.ts only), tests ≥7216 passing, doc citations 13 baseline match
4. **CLAUDE.md Accepted Baselines** unchanged (no baseline-affecting changes)
5. **Sprint-status.yaml** updated

## Tasks / Subtasks

- [x] Task 1: Delete entire deprecated files (AC: #1)
  - [x] 1a. Delete `src/lib/tax-calculations.ts` (entire file — 0 importers, replaced by backend TaxMetrics since Epic 66-FE)
  - [x] 1b. Delete `src/lib/return-logistics-legacy.ts` (entire file — 0 importers, replaced by `calculateReturnLogistics`)
- [x] Task 2: Remove deprecated type/union members (AC: #1)
  - [x] 2a. `src/types/api.ts`: remove `enrich_cogs` from TaskType union + remove `Product` interface (replaced by ProductWithCogs)
  - [x] 2b. `src/types/tasks.ts`: remove `enrich_cogs` from TaskTypeNames union
  - [x] 2c. `src/types/fulfillment.ts`: remove `StartSyncRequest` type alias (replaced by StartFulfillmentSyncRequest)
  - [x] 2d. `src/types/advertising-analytics/analytics.ts`: remove `SyncStatus` type alias (replaced by SyncTaskStatus)
- [x] Task 3: Remove legacy re-exports and functions from return-logistics-utils (AC: #1)
  - [x] 3a. Remove legacy re-exports from `return-logistics-utils.ts` (lines 17-24: re-exports of LegacyReturnLogisticsBreakdown, getReturnLogisticsBreakdown)
  - [x] 3b. Remove `ReturnLogisticsParams` interface (lines 65-68)
  - [x] 3c. Remove `LegacyReturnLogisticsResult` interface (lines 71-77)
  - [x] 3d. Remove `calculateReturnLogisticsLegacy` function (lines 159+)
- [x] Task 4: Remove BuyoutRateCard legacy props (AC: #1)
  - [x] 4a. Remove 4 deprecated props from interface: `salesCount`, `ordersCount`, `previousSalesCount`, `previousOrdersCount`
  - [x] 4b. Remove their `_`-prefixed destructuring inside the component
- [x] Task 5: Verify quality gates (AC: #3, #4)
  - [x] 5a. ESLint: 0 errors, 112 warnings (was 114 — 2 fewer from deleted code)
  - [x] 5b. TypeScript: 20 errors in advertising-analytics-api.ts only (baseline match)
  - [x] 5c. Tests: 7216 passing, 0 failed (28 legacy tests removed with deleted code)
  - [x] 5d. Doc citations: 13 broken, baseline match
- [x] Task 6: Update sprint-status (AC: #5)
  - [x] 6a. Mark story status in sprint-status.yaml

## Dev Notes

### Deletion Safety

Each item was verified via `grep -rn "symbol_name" src/ --include="*.ts" --include="*.tsx" | grep -v "__tests__" | grep -v ".test."` to confirm zero consumers. The deletions are purely mechanical — no logic changes.

### File Size Impact

All affected files will shrink (removing code), so the 200-line ESLint cap is not a concern.

### tax-calculations.ts

This entire file (exports: `TaxSystem`, `TaxExpenses`, `calculateTax`, `calculateTaxPct`, `getTaxSystemLabel`, `TAX_SYSTEMS`) was deprecated in Epic 66-FE when tax calculations moved to the backend. The `TaxSystem` type used by components is independently defined in `src/types/cabinet.ts`.

### return-logistics-legacy.ts

This file exists solely for backward compatibility. All consumers migrated to `calculateReturnLogistics()` from `return-logistics-utils.ts` during Epic 76-FE. The re-export bridge in `return-logistics-utils.ts` (lines 17-24) can also be removed.

### BuyoutRateCard.tsx Props

The 4 legacy props were deprecated when `buyoutRate`/`previousBuyoutRate` became the primary interface. They are destructured with `_` prefix (TypeScript unused-variable convention) and no callers pass them.

### References

- [Source: `src/lib/tax-calculations.ts`] — deprecated since Epic 66-FE
- [Source: `src/lib/return-logistics-legacy.ts`] — deprecated since Epic 76-FE
- [Source: `src/lib/return-logistics-utils.ts`] — contains legacy re-exports to remove
- [Source: `src/components/custom/dashboard/BuyoutRateCard.tsx`] — 4 legacy props
- [Source: `src/types/api.ts`] — `enrich_cogs` union member + `Product` interface
- [Source: `src/types/tasks.ts`] — `enrich_cogs` union member
- [Source: `src/types/fulfillment.ts`] — `StartSyncRequest` type alias
- [Source: `src/types/advertising-analytics/analytics.ts`] — `SyncStatus` type alias
- [Source: `CLAUDE.md` § Accepted Baselines] — quality gate baselines

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (glm-5.1)

### Debug Log References

N/A

### Completion Notes List

### File List

- `src/lib/tax-calculations.ts` — DELETED (entire file)
- `src/lib/return-logistics-legacy.ts` — DELETED (entire file)
- `src/lib/return-logistics-utils.ts` — removed legacy re-exports, ReturnLogisticsParams, LegacyReturnLogisticsResult, calculateReturnLogisticsLegacy
- `src/types/api.ts` — removed `enrich_cogs` from Task union, removed `Product` interface
- `src/types/tasks.ts` — removed `enrich_cogs` from TaskType union
- `src/types/fulfillment.ts` — removed `StartSyncRequest` type alias
- `src/types/advertising-analytics/analytics.ts` — removed `SyncStatus` type alias
- `src/components/custom/dashboard/BuyoutRateCard.tsx` — removed 4 deprecated props + destructuring + stale JSDoc/comment
- `src/components/custom/dashboard/__tests__/epic65/BuyoutRateCard.test.tsx` — removed 2 stale legacy-prop tests
- `src/lib/__tests__/return-logistics-utils.test.ts` — removed 25 legacy function tests, kept calculateReturnRate tests

### Change Log

| Date | Change |
|---|---|
| 2026-05-12 | Story created. Delete 15 zero-dependency deprecated items across 11 files. Origin: Epic 99-FE retrospective tech debt audit. Classification: all items verified zero-consumer via codebase grep. |
| 2026-05-12 | Implementation complete. All 15 items deleted. 28 legacy tests removed with deleted code. Quality gates: ESLint 0e/112w, TS 20, tests 7216/0f, citations 13 baseline. |
| 2026-05-12 | 1st-pass review: M-1 stale JSDoc in BuyoutRateCard, L-1 stale legacy-prop tests in BuyoutRateCard.test.tsx, L-2 stale comment referencing removed props. All fixed. |
| 2026-05-12 | 2nd-pass review: M-1 AC #3 baseline text stale (7244→7216), M-2 Task 5c count drift (7217→7216), L-1 pre-edit line-number references. All factual corrections applied. **Lessons:** (1) AC text must update when baselines shift mid-story. (2) Task notes record point-in-time state — re-verify after review fixes. |
