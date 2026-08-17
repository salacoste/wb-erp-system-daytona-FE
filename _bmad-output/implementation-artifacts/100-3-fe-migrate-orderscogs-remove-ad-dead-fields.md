# Story 100.3: Migrate ordersCogs → ordersCogsByDay + Remove Advertising Dead-Zero Fields

Status: done

## Story

As a developer,
I want the deprecated `ordersCogs` single-value option removed from the daily metrics pipeline and advertising dead-zero fields (`campaign_count`, `active_campaigns`) removed from the advertising types,
so that the codebase has zero deprecated annotations and all data flows use per-day COGS exclusively.

## Acceptance Criteria

1. **`ordersCogs` option removed** from `UseDailyMetricsOptions` (daily-metrics.ts:164-165)
2. **`ordersCogs` field removed** from `AggregateDailyMetricsInput` (daily-metrics.ts:185-186)
3. **Legacy fallback removed** from `aggregation.ts` — the `ordersCogs > 0 ? ordersCogs : null` path (lines 62-69) deleted; `dayCogs` now derives solely from `cogsMap`
4. **Hook signatures cleaned** — `useDailyMetrics` no longer accepts `ordersCogs`; `usePrefetchDailyMetrics` no longer takes `ordersCogs` parameter
5. **`campaign_count` and `active_campaigns` removed** from `AdvertisingSummary` type, API normalizer, mock handlers, and summary cards
6. **All quality gates green**: ESLint 0 errors, type-check 19 errors (pre-existing), tests ≥7205 passing, doc citations 20 baseline match
7. **Sprint-status.yaml** updated

## Tasks / Subtasks

- [x] Task 1: Remove ordersCogs from types (AC: #1, #2)
  - [x] 1a. Removed `ordersCogs?: number` from `UseDailyMetricsOptions`
  - [x] 1b. Removed `ordersCogs?: number` from `AggregateDailyMetricsInput` and its `@deprecated` comment
- [x] Task 2: Remove legacy fallback from aggregation (AC: #3)
  - [x] 2a. Removed `ordersCogs = 0` from destructuring
  - [x] 2b. Replaced legacy fallback logic with `cogsMap.has(date) ? (cogsMap.get(date) ?? null) : null`
- [x] Task 3: Clean hook signatures (AC: #4)
  - [x] 3a. Removed `ordersCogs = 0` from options destructuring
  - [x] 3b. Removed `ordersCogs` from aggregation call
  - [x] 3c. Removed `ordersCogs = 0` from `usePrefetchDailyMetrics` signature
  - [x] 3d. Removed `ordersCogs` from aggregation call
  - [x] 3e. Cleaned up JSDoc examples referencing `ordersCogs`
- [x] Task 4: Remove advertising dead-zero fields (AC: #5)
  - [x] 4a. Removed `campaign_count` and `active_campaigns` from `AdvertisingSummary` type
  - [x] 4b. Removed field mappings from normalizer
  - [x] 4c. Removed from mock handlers (3 locations)
  - [x] 4d. Removed from `AdvertisingSummaryCards.tsx`, updated grid cols 6→5, removed unused `Target` import
- [x] Task 5: Update tests and verify quality gates (AC: #6)
  - [x] 5a. Updated daily-helpers.test.ts (removed ordersCogs option), over-attribution-utils.test.ts, AdvertisingSummaryCards.test.tsx
  - [x] 5b. type-check: 19 errors (18 advertising-analytics-api.ts + 1 pre-existing LogoutButton.test.tsx)
  - [x] 5c. Vitest: 7205 passing, 0 failed
  - [x] 5d. Doc citations: 20 broken, matches baseline
- [x] Task 6: Update sprint-status (AC: #7)
  - [x] 6a. Status → review

## Dev Notes

### CRITICAL: `ordersCogs` field on `DailyMetrics` is NOT deprecated

The `ordersCogs: number | null` field on the `DailyMetrics` interface (daily-metrics.ts:35) is the per-day COGS value populated by `ordersCogsByDay`. This field STAYS. Only the single-value `ordersCogs` OPTION on `UseDailyMetricsOptions` and `AggregateDailyMetricsInput` is deprecated and should be removed.

Similarly, these files use `ordersCogs` as the DailyMetrics field (keep these):
- `chart-config.ts` — chart metric key
- `table-columns.ts` — aggregation column
- `DailyBreakdownTooltip.tsx` — tooltip display
- `DailyCogsGapFootnote.tsx` — gap detection
- `DashboardMetricsGridTypes.ts` — grid type
- `day-utils.ts` — empty metrics factory (`ordersCogs: 0`)
- `usePreviousPeriodData.ts` — comparison initial value

### aggregation.ts Legacy Fallback

Current logic (lines 62-69):
```typescript
const dayCogs: number | null = cogsMap.has(date)
  ? (cogsMap.get(date) ?? null)
  : ordersCogs > 0
    ? ordersCogs
    : null
```

After removal:
```typescript
const dayCogs: number | null = cogsMap.has(date)
  ? (cogsMap.get(date) ?? null)
  : null
```

The `ordersCogs > 0` branch was a legacy fallback for when `ordersCogsByDay` was empty. Since `getAllDailyData` now always fetches per-day COGS, this fallback is dead code.

### Advertising Dead-Zero Fields (Request #160)

Backend always returns 0 for `campaign_count` and `active_campaigns`. The summary card at `AdvertisingSummaryCards.tsx:149-152` displays "N из M" (active out of total) — remove this card entirely since the data is meaningless (always "0 из 0").

### Files NOT to Touch

- `src/hooks/useOrdersCogs.ts` — this is the hook for fetching per-day COGS data (the replacement), keep it
- `src/hooks/orders-cogs-types.ts` — query key definitions for the replacement, keep it
- `src/lib/daily/day-utils.ts` — `ordersCogs: 0` in `createEmptyDailyMetrics` stays (it's the DailyMetrics field)
- `src/lib/api/daily-analytics/api.ts` — `ordersCogsByDay` in `getAllDailyData` return type stays

### Test Impact

The `daily-helpers.test.ts` file has an aggregation test (around line 497+) that passes `ordersCogs: 50000` to `aggregateDailyMetrics`. This must be removed. The test's `theoreticalProfit` assertion was already updated to `0` in Story 100.2, so removing the `ordersCogs` param should not change the assertion.

### References

- [Source: `src/types/daily-metrics.ts`] — UseDailyMetricsOptions.ordersCogs + AggregateDailyMetricsInput.ordersCogs
- [Source: `src/lib/daily/aggregation.ts`] — legacy fallback logic
- [Source: `src/hooks/useDailyMetrics.ts`] — primary consumer of ordersCogs option
- [Source: `src/types/advertising-analytics/analytics.ts`] — AdvertisingSummary with dead-zero fields
- [Source: `src/lib/api/advertising-analytics-api.ts`] — normalizer field mappings
- [Source: `src/mocks/handlers/advertising.ts`] — mock data with dead-zero values
- [Source: `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx`] — dead-zero card display
- [Source: `CLAUDE.md` § Accepted Baselines] — quality gate baselines

## Dev Agent Record

### Agent Model Used

Claude Opus 4 (glm-5.1)

### Debug Log References

N/A

### Completion Notes List

### File List

- `src/types/daily-metrics.ts` — removed ordersCogs from UseDailyMetricsOptions and AggregateDailyMetricsInput
- `src/lib/daily/aggregation.ts` — removed ordersCogs destructuring and legacy fallback
- `src/hooks/useDailyMetrics.ts` — removed ordersCogs option from useDailyMetrics and usePrefetchDailyMetrics
- `src/types/advertising-analytics/analytics.ts` — removed campaign_count and active_campaigns from AdvertisingSummary
- `src/lib/api/advertising-analytics-api.ts` — removed dead-zero field mappings
- `src/mocks/handlers/advertising.ts` — removed dead-zero fields from mock data (3 locations)
- `src/app/(dashboard)/analytics/advertising/components/AdvertisingSummaryCards.tsx` — removed campaigns card, grid cols 6→5
- `src/lib/__tests__/daily-helpers.test.ts` — removed ordersCogs option from aggregation test
- `src/app/(dashboard)/analytics/advertising/utils/__tests__/over-attribution-utils.test.ts` — removed dead-zero field assertions
- `src/app/(dashboard)/analytics/advertising/components/__tests__/AdvertisingSummaryCards.test.tsx` — removed dead-zero fields from mock
- `scripts/.check-docs-baseline.txt` — regenerated baseline (20 entries)
- `CLAUDE.md` — updated baselines (TS 21→19)

### Change Log

| Date | Change |
|---|---|
| 2026-05-13 | Story created. Remove deprecated ordersCogs single-value option + advertising dead-zero fields. |
| 2026-05-13 | Implementation complete. Removed ordersCogs from 3 type/hook files, legacy fallback from aggregation, campaign_count/active_campaigns from 4 advertising files. Quality gates: ESLint 0e, TS 19e, Vitest 7205 pass, citations baseline match. Status: review. |
| 2026-05-13 | Post-1st-pass-review fixes (2026-05-13): H1 — skeleton Array(6)→Array(5) in AdvertisingSummaryCards (visual bug: loading state rendered 6 skeletons into 5-col grid). M2 — removed stale active_campaigns: 8 from epic65/fixtures.ts. L1 — updated stale comment "6 cards" → "5 cards". |
| 2026-05-13 | Post-2nd-pass-review fixes (2026-05-13): M1 — AC #6 updated from "21 errors" to "19 errors" to match Task 5b and actual gate output. Status: review → done. **Lessons:** (1) Skeleton card count must match data card count after removing a card — grid mismatch is a visible UI bug. (2) AC numbers drift when stories change error baselines — update the AC line with task findings. |
