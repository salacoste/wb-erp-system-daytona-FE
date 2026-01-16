# Story 36.2-FE: API Client & Hooks Update

## Story Info

- **Epic**: 36-FE - Product Card Linking (Frontend)
- **Priority**: High
- **Points**: 2
- **Status**: ✅ APPROVED (Ready for Development)

## User Story

**As a** frontend developer,
**I want** API client and React Query hooks updated to support product card linking,
**So that** I can fetch merged group data from the backend API.

## Background

Story 36.1 added TypeScript types for Epic 36. Now we need to update the API client and hooks to:
- Send `group_by` parameter to backend
- Map backend response to include new Epic 36 fields (`type`, `imtId`, `mergedProducts`)
- Provide convenience hook for merged groups (`useAdvertisingMergedGroups`)

**Dependencies**: Story 36.1 (TypeScript types) must be complete.

## Acceptance Criteria

### AC1: API Client Parameter Support
- [ ] `getAdvertisingAnalytics()` accepts `group_by` parameter
- [ ] Parameter is included in query string when provided
- [ ] Default behavior unchanged (no `group_by` = Epic 33 format)
- [ ] Console logs include `group_by` mode for debugging

### AC2: Response Mapping
- [ ] Backend `type` field mapped to frontend `AdvertisingItem.type`
- [ ] Backend `imtId` field mapped to frontend `AdvertisingItem.imtId`
- [ ] Backend `mergedProducts` array mapped to frontend `AdvertisingItem.mergedProducts`
- [ ] Existing Epic 33 field mapping unchanged

### AC3: Convenience Hook
- [ ] New `useAdvertisingMergedGroups()` hook created
- [ ] Hook automatically sets `group_by='imtId'`
- [ ] Hook uses same caching as `useAdvertisingAnalytics`
- [ ] Hook signature: `useAdvertisingMergedGroups(params, options?)`

### AC4: Backward Compatibility
- [ ] Existing Epic 33 components work without changes
- [ ] `useAdvertisingAnalytics()` without `group_by` returns Epic 33 format
- [ ] No breaking changes to hook API

## Tasks / Subtasks

### Phase 1: Update API Client (30 min)
- [ ] Open `src/lib/api/advertising-analytics.ts`
- [ ] Update `getAdvertisingAnalytics()` to handle `group_by` parameter
- [ ] Add Epic 36 fields to response mapping (lines ~165-191)
- [ ] Update console.info logs to include `group_by` mode
- [ ] Test with both `group_by=sku` and `group_by=imtId`

### Phase 2: Create Convenience Hook (15 min)
- [ ] Open `src/hooks/useAdvertisingAnalytics.ts`
- [ ] Add `useAdvertisingMergedGroups()` hook at end of file
- [ ] Use `useAdvertisingAnalytics` internally with `group_by='imtId'`
- [ ] Add JSDoc with usage examples

### Phase 3: Verification (15 min)
- [ ] Run `npm run type-check` - must pass
- [ ] Run `npm run lint` - must pass
- [ ] Test API call with `group_by=imtId` in browser console
- [ ] Verify Epic 33 functionality unchanged

## Technical Details

### File 1: API Client Update

**File**: `src/lib/api/advertising-analytics.ts`

**Lines to modify**: ~120 (console.info), ~165-191 (response mapping)

#### Change 1: Update Console Logging (line ~122)

**Before** (Epic 33):
```typescript
console.info('[Advertising Analytics] Fetching analytics:', {
  from: params.from,
  to: params.to,
  view_by: params.view_by ?? 'sku',
  efficiency_filter: params.efficiency_filter ?? 'all',
  sort_by: params.sort_by ?? 'spend',
  sort_order: params.sort_order ?? 'desc',
})
```

**After** (Epic 36):
```typescript
console.info('[Advertising Analytics] Fetching analytics:', {
  from: params.from,
  to: params.to,
  view_by: params.view_by ?? 'sku',
  group_by: params.group_by ?? 'sku', // Epic 36: Log grouping mode
  efficiency_filter: params.efficiency_filter ?? 'all',
  sort_by: params.sort_by ?? 'spend',
  sort_order: params.sort_order ?? 'desc',
})
```

#### Change 2: Add Epic 36 Fields to Response Mapping (line ~165)

**Before** (Epic 33):
```typescript
data: (backendResponse.items || []).map((item: any, index: number) => ({
  key: item.key || `item-${index}`,
  sku_id: item.nmId?.toString(),
  campaign_id: item.campaignId?.toString(),
  product_name: item.label,
  brand: item.brand,
  category: item.category,
  // ... existing metrics
})),
```

**After** (Epic 36):
```typescript
data: (backendResponse.items || []).map((item: any, index: number) => ({
  // Use backend's unique key
  key: item.key || `item-${index}`,

  // Epic 36: NEW FIELDS
  type: item.type, // 'merged_group' | 'individual' | undefined
  imtId: item.imtId ?? null, // number | null
  mergedProducts: item.mergedProducts?.map((p: any) => ({
    nmId: p.nmId,
    vendorCode: p.vendorCode,
  })),

  // Existing Epic 33 fields
  sku_id: item.nmId?.toString(),
  campaign_id: item.campaignId?.toString(),
  product_name: item.label,
  brand: item.brand,
  category: item.category,
  // ... existing metrics
})),
```

#### Change 3: Update Response Console Log (line ~194)

**After** (Epic 36):
```typescript
console.info('[Advertising Analytics] Response:', {
  itemCount: response.data?.length ?? 0,
  totalSpend: response.summary?.total_spend ?? 0,
  overallRoas: response.summary?.overall_roas ?? 0,
  viewBy: response.meta?.view_by ?? 'unknown',
  groupBy: params.group_by ?? 'sku', // Epic 36: Log actual grouping
  efficiencyFilter: params.efficiency_filter ?? 'all',
})
```

### File 2: Convenience Hook

**File**: `src/hooks/useAdvertisingAnalytics.ts`

**Location**: Append at end of file (after existing hooks)

```typescript
/**
 * Hook for advertising analytics with merged product groups (Epic 36).
 *
 * Convenience hook that automatically sets group_by=imtId.
 * Returns aggregated metrics for products with the same imtId (склейки).
 *
 * @param params - Analytics parameters (group_by will be set to 'imtId')
 * @param options - React Query options
 * @returns Query result with merged group data
 *
 * @example
 * // Fetch merged groups for last 14 days
 * const { data, isLoading } = useAdvertisingMergedGroups({
 *   from: '2025-12-08',
 *   to: '2025-12-21',
 * });
 *
 * @example
 * // With efficiency filter
 * const { data } = useAdvertisingMergedGroups({
 *   from: '2025-12-01',
 *   to: '2025-12-21',
 *   efficiency_filter: 'excellent',
 * });
 */
export function useAdvertisingMergedGroups(
  params: Omit<AdvertisingAnalyticsParams, 'group_by'>,
  options?: UseQueryOptions<AdvertisingAnalyticsResponse>,
) {
  return useAdvertisingAnalytics(
    { ...params, group_by: 'imtId' },
    options,
  );
}
```

### Parameter Handling in buildQueryString

The existing `buildQueryString()` helper (line ~57) already handles all parameters correctly via `URLSearchParams`. No changes needed - it will automatically include `group_by` when provided.

## Testing Checklist

### API Client Tests
- [ ] Call `getAdvertisingAnalytics({ from: '...', to: '...', group_by: 'imtId' })`
- [ ] Verify `group_by=imtId` in request URL
- [ ] Verify response includes `type`, `imtId`, `mergedProducts` fields
- [ ] Call without `group_by` - verify Epic 33 format returned

### Hook Tests
- [ ] Call `useAdvertisingMergedGroups({ from: '...', to: '...' })`
- [ ] Verify `group_by=imtId` sent automatically
- [ ] Verify caching works (same query key as `useAdvertisingAnalytics`)
- [ ] Verify `options` parameter works (staleTime, enabled, etc.)

### Backward Compatibility Tests
- [ ] Open existing advertising page (`/analytics/advertising`)
- [ ] Verify page loads without errors
- [ ] Verify table displays Epic 33 data correctly
- [ ] Verify no console errors

### Manual Testing (Browser Console)

```typescript
// Test merged groups query
const { data } = await queryClient.fetchQuery({
  queryKey: ['advertising-analytics', { from: '2025-12-01', to: '2025-12-21', group_by: 'imtId' }],
  queryFn: () => getAdvertisingAnalytics({
    from: '2025-12-01',
    to: '2025-12-21',
    group_by: 'imtId'
  })
});

console.log(data.data[0].type); // 'merged_group' or 'individual'
console.log(data.data[0].imtId); // number or null
console.log(data.data[0].mergedProducts); // array or undefined
```

## Dependencies

- **Prerequisite**: Story 36.1 (TypeScript types) complete
- **Backend**: Epic 36 API ready at `GET /v1/analytics/advertising?group_by=imtId`

## Definition of Done

- [ ] API client sends `group_by` parameter
- [ ] Response mapping includes Epic 36 fields
- [ ] `useAdvertisingMergedGroups` hook created
- [ ] All acceptance criteria met
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] Manual testing complete
- [ ] No breaking changes to Epic 33
- [ ] Code review approved
- [ ] Story marked DONE

## Notes for PO Review

### Questions for PO

**Q1: Query Key Strategy**
Should `group_by` be part of React Query cache key?

**Current Proposal**: YES - different `group_by` values should have separate cache entries.

```typescript
// Two separate cache entries:
queryKey: ['advertising-analytics', { from: '...', to: '...', group_by: 'sku' }]
queryKey: ['advertising-analytics', { from: '...', to: '...', group_by: 'imtId' }]
```

**Q2: Stale Time**
Should merged groups data have different staleTime than SKU data?

**Current Proposal**: NO - use same default (5 minutes) for consistency.

### Estimated Time

**Total**: 60 minutes (1 hour)
- Phase 1: 30 min (API client)
- Phase 2: 15 min (hook)
- Phase 3: 15 min (verification)

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Response mapping error | Medium | High | Comprehensive manual testing |
| Cache invalidation issues | Low | Medium | Use same query key structure |
| Breaking changes | Low | High | All changes backward compatible |

---

**Document Version**: 1.1
**Created**: 2025-12-28
**Status**: ✅ **APPROVED - Ready for Development**
**PO Approval**: Sarah | 2025-12-28 22:45 MSK
**Dependencies**: Story 36.1 (TypeScript Types)
**Next Action**: Developer begins implementation after Story 36.1 complete
