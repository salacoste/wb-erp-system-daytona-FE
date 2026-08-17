# Story 85.2: FCU Analytics — re-enable /shipment-cost/by-sku

Status: ready-for-dev

## Story

As a seller who has confirmed shipments,
I want to see delivery cost per unit (FCU) on the unit-economics page,
so that I understand the full cost structure including logistics.

## Acceptance Criteria

1. `useFcuBySku` hook enabled when week is provided
2. Unit-economics "Доставка" column shows FCU values per SKU
3. No FCU data → "—" in column (existing merge logic)
4. Tests pass

## Tasks / Subtasks

- [ ] Task 1: Re-enable hook (AC: #1)
  - [ ] 1.1: Set `enabled: !!_week` (was `false`) in `src/hooks/use-fcu-aggregation.ts`
  - [ ] 1.2: Restore `getFcuBySku` import
  - [ ] 1.3: Restore `queryFn: () => getFcuBySku(week)` (was `Promise.resolve([])`)
  - [ ] 1.4: Rename `_week` back to `week`

- [ ] Task 2: Restore tests (AC: #4)
  - [ ] 2.1: Restore fetch + error test cases in `use-fcu-aggregation.test.ts`

- [ ] Task 3: Lint + type-check

## Dev Notes

### Current state (disabled in session 2026-03-30)

```typescript
// use-fcu-aggregation.ts — CURRENT (disabled):
export function useFcuBySku(_week?: string) {
  return useQuery<FcuBySkuItem[], Error>({
    queryKey: fcuAggregationKeys.bySku(_week),
    queryFn: () => Promise.resolve([]),
    enabled: false, // Endpoint not implemented — re-enable when backend delivers
  })
}
```

### Target state (re-enabled):

```typescript
export function useFcuBySku(week?: string) {
  return useQuery<FcuBySkuItem[], Error>({
    queryKey: fcuAggregationKeys.bySku(week),
    queryFn: () => getFcuBySku(week),
    enabled: !!week,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  })
}
```

### Files (2)

- `src/hooks/use-fcu-aggregation.ts` — re-enable
- `src/hooks/__tests__/use-fcu-aggregation.test.ts` — restore tests

### References

- [Source: _bmad-output/planning-artifacts/epics-80-83-fe.md#Story-852]
- [Source: src/lib/api/shipment-cost/fcu-aggregation-api.ts] — API function already exists

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Completion Notes List

### File List
