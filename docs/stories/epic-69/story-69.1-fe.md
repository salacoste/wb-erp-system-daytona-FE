# Story 69.1-FE: Types & API Layer

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P1 |
| SP | 3 |
| Status | ✅ Complete |

## Description

Как разработчик, я хочу иметь типизированные интерфейсы и API-функции для аналитики выкупов, чтобы все компоненты могли безопасно работать с данными.

## Acceptance Criteria

- AC1: TypeScript interfaces for `BySkuBuyoutItem`, `BuyoutSummaryResponse`, params types
- AC2: Union types for `BuyoutSource`, `BuyoutConfidence`, `TrendDirection`
- AC3: API functions `getBuyoutBySku()` and `getBuyoutSummary()` with URLSearchParams
- AC4: Query key factory `buyoutQueryKeys` with `all`, `bySku`, `summary` keys
- AC5: Cache config `BUYOUT_CACHE` (staleTime=25min, gcTime=60min)
- AC6: `skipDataUnwrap: true` for analytics endpoint responses
- AC7: Console logging for debug traceability

## Files

| File | Action | Lines |
|------|--------|-------|
| `src/types/analytics-epics-68-71.ts` | Created (shared) | 218 ⚠️ |
| `src/lib/api/buyout-analytics.ts` | Created | 91 |

## Known Issues
- Types file exceeds 200-line limit (shared across Epics 68/69/71)
- `BuyoutSummaryResponse.source`/`.confidence` typed as `string` not union types

## Dependencies
- Blocks: 69.2, 69.3, 69.4
