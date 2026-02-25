# Story 69.7-FE: Unit & Integration Tests

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P3 |
| SP | 3 |
| Status | 📋 Planned |

## Description

Как разработчик, я хочу тесты для компонентов и хуков аналитики выкупов, чтобы предотвратить регрессии.

## Acceptance Criteria

- AC1: Hook tests for `useBuyoutBySku` and `useBuyoutSummary` (enabled guard, params, cache)
- AC2: `BuyoutSummaryWidget` renders progress bar, decliners, return breakdown
- AC3: `BuyoutSummaryWidget` handles null/empty data gracefully
- AC4: `BuyoutTable` renders all 12 columns with mock data
- AC5: `BuyoutTable` pagination controls navigate correctly
- AC6: `BuyoutTable` sort buttons trigger re-fetch with correct params
- AC7: Confidence badges render correctly for high/medium/low
- AC8: Trend indicators show correct icon and color for up/down/stable
- AC9: API module tests for URL construction and skipDataUnwrap
- AC10: Integration test: page renders with mocked API responses

## Files

| File | Action |
|------|--------|
| `src/hooks/__tests__/use-buyout-analytics.test.ts` | Create |
| `src/app/(dashboard)/analytics/buyout/components/__tests__/BuyoutSummaryWidget.test.tsx` | Create |
| `src/app/(dashboard)/analytics/buyout/components/__tests__/BuyoutTable.test.tsx` | Create |
| `src/lib/api/__tests__/buyout-analytics.test.ts` | Create |

## Dependencies
- Blocked by: 69.1-69.6
