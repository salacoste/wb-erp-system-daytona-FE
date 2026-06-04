# Story 120.1-FE: Shared String + Normalizer Helper Extraction

**Epic**: 120-FE (Marketing Analytics Expansion)
**Track**: C (Tech-Debt Carry-Forwards)
**Status**: in-progress
**SP**: 3
**Assignee**: BMad Master

## Summary

Extract duplicated normalizer helper functions (`toCount`, `toNullableNumber`, `toStringOrNull`, `asRecord`, `toStr`) into a shared `src/lib/api/normalizer-helpers.ts` module. Migrate 11 normalizer files to import from shared module. Create `src/lib/string-utils.ts` for `truncateQuery`. Retire `filterValidQueries` per EPIC-120 RETIRE marker.

## Acceptance Criteria

1. `src/lib/api/normalizer-helpers.ts` exists with 5+ exported helper functions
2. `src/lib/string-utils.ts` exists with `truncateQuery`
3. All 11 normalizer files import from shared module (no private duplicates)
4. `filterValidQueries` retired from `funnel-table-columns.tsx`
5. FUTURE/EPIC-120 markers removed from source files
6. All 8,597+ existing tests still pass
7. TypeScript strict — 0 errors
8. New unit tests for shared helpers ≥95% coverage

## Files

### Create
- `src/lib/api/normalizer-helpers.ts`
- `src/lib/string-utils.ts`
- `src/lib/api/__tests__/normalizer-helpers.test.ts`
- `src/lib/__tests__/string-utils.test.ts`

### Modify (migrate imports)
- `src/lib/api/search-analytics-normalizer.ts`
- `src/lib/api/monitor-summary-normalizer.ts`
- `src/lib/api/acquiring-normalizer.ts`
- `src/lib/api/buyout-reconciliation-normalizer.ts`
- `src/lib/api/fbs-stock-normalizer.ts`
- `src/lib/api/fbs-enhanced-normalizer.ts`
- `src/lib/api/advertising-analytics-normalizer.ts`
- `src/lib/api/cabinet-normalizer.ts`
- `src/lib/api/funnel-normalizer.ts`
- `src/lib/api/bulk-cogs-normalizer.ts`
- `src/lib/api/margin-trends-normalizer.ts`
- `src/lib/api/fbs-export-normalizer.ts`
- `src/app/(dashboard)/analytics/funnel/components/funnel-table-columns.tsx`

## Change Log

| Date | Status | Notes |
|------|--------|-------|
| 2026-06-04 | in-progress | Started implementation |
