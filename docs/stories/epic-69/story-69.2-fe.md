# Story 69.2-FE: TanStack Query Hooks

| Field | Value |
|-------|-------|
| Epic | 69-FE Buyout Analytics |
| Priority | P1 |
| SP | 3 |
| Status | ✅ Complete |

## Description

Как разработчик, я хочу React-хуки для получения данных выкупов, чтобы компоненты могли декларативно работать с API.

## Acceptance Criteria

- AC1: `useBuyoutBySku(from, to, params?)` hook with default source=blended, trend=true
- AC2: `useBuyoutSummary(from, to, source?)` hook
- AC3: `enabled: !!from && !!to` guard prevents fetch without date range
- AC4: staleTime=25min, gcTime=60min, retry=1
- AC5: Query keys delegate to `buyoutQueryKeys` factory from API module

## Files

| File | Action | Lines |
|------|--------|-------|
| `src/hooks/use-buyout-analytics.ts` | Created | 49 |

## Dependencies
- Blocked by: 69.1
- Blocks: 69.3, 69.4, 69.5
