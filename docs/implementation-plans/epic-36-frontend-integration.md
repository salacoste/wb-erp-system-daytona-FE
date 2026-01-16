# Epic 36 Frontend Integration Plan

**Date**: 2025-12-27
**Status**: 📋 Ready to Implement
**Priority**: High
**Epic**: 36 - Product Card Linking (склейки)
**Backend Status**: ✅ 100% Complete

---

## 📋 Executive Summary

Epic 36 backend is **complete** and ready for frontend integration. This document provides a **step-by-step implementation plan** for frontend developers to add "Product Card Linking" (склейки) support to the advertising analytics page.

**What We're Building**:
- Toggle between "По артикулам" (individual SKUs) and "По склейкам" (merged groups)
- Display merged product badges with tooltips showing all products in group
- Proper ROAS/ROI calculations for merged groups (solves spend=0 but revenue>0 problem)
- Fully backward compatible with existing Epic 33 implementation

**Estimated Effort**: 3-4 hours
**Files to Change**: 6 files
**Files to Create**: 2 new components

---

## 🎯 User Story

**As a seller**, I want to see advertising metrics grouped by merged product cards (склейки), so that I can understand the true advertising efficiency for products that are merged on Wildberries.

**Problem Solved**: Currently, products with `spend=0` but `revenue>0` show "🔵 Нет данных" status because WB attributes sales to merged cards without showing direct spend. Epic 36 groups all products with the same `imtId` to show correct aggregated metrics.

**Example**:
```
BEFORE (Epic 33 - individual SKUs):
- ter-09: spend=0₽, revenue=1,105₽ → ROAS=null, status="unknown" ❌
- ter-10: spend=0₽, revenue=1,489₽ → ROAS=null, status="unknown" ❌
- ter-13-1: spend=11,337₽, revenue=31,464₽ → ROAS=2.8 ✅

AFTER (Epic 36 - grouped by imtId):
- Merged Group (imtId=328632):
  - Products: ter-09, ter-10, ter-13-1
  - Total spend: 11,337₽
  - Total revenue: 34,058₽ (1,105 + 1,489 + 31,464)
  - ROAS: 3.0 ✅
  - Status: "profitable" ✅
```

---

## 📂 File Changes Overview

### Files to Modify (6)

1. **`src/types/advertising-analytics.ts`** - Add Epic 36 types
2. **`src/lib/api/advertising-analytics.ts`** - Add `group_by` parameter support
3. **`src/hooks/useAdvertisingAnalytics.ts`** - Add hook for merged groups
4. **`src/app/(dashboard)/analytics/advertising/page.tsx`** - Add UI toggle and render logic
5. **`src/components/analytics/PerformanceMetricsTable.tsx`** - Update table to show merged groups
6. **`src/components/analytics/AdvertisingFilters.tsx`** - Add group by toggle

### Files to Create (2)

1. **`src/components/analytics/MergedProductBadge.tsx`** - NEW component
2. **`src/components/analytics/MergedProductsTooltip.tsx`** - NEW component (optional)

---

## 🔧 Implementation Steps

### Step 1: Update TypeScript Types (15 min)

**File**: `src/types/advertising-analytics.ts`

**Changes**:

```typescript
// ============================================================================
// Epic 36: Product Card Linking (склейки)
// See: frontend/docs/request-backend/83-epic-36-api-contract.md
// ============================================================================

/**
 * Grouping mode for advertising analytics (Epic 36).
 */
export type GroupByMode = 'sku' | 'imtId';

/**
 * Product information within a merged group (Epic 36).
 * Used when group_by=imtId.
 */
export interface MergedProduct {
  /** WB article number */
  nmId: number;
  /** Seller's SKU code */
  vendorCode: string;
}

/**
 * Individual advertising analytics item.
 *
 * UPDATED for Epic 36: Added support for merged product groups.
 *
 * Note: Identifier fields (sku_id, campaign_id, brand, category) are optional
 * based on the view_by mode. Only the relevant identifier for the current
 * view mode will be present.
 */
export interface AdvertisingItem {
  /** Unique identifier from backend (e.g., "sku:270937054", "imtId:328632") */
  key: string;

  // ========================================
  // Epic 36: NEW FIELDS (group_by=imtId)
  // ========================================

  /**
   * Item type discriminator (Epic 36).
   * - 'merged_group': Products grouped by shared imtId
   * - 'individual': Single product or product with NULL imtId
   * Only present when group_by=imtId parameter is used.
   */
  type?: 'merged_group' | 'individual';

  /**
   * WB merged card ID (склейка identifier) - Epic 36.
   * - For merged_group: shared imtId value (e.g., 328632)
   * - For individual: null (no merging)
   */
  imtId?: number | null;

  /**
   * Products within merged group (Epic 36).
   * Only present when type='merged_group'.
   * Contains array of nmId + vendorCode pairs.
   */
  mergedProducts?: MergedProduct[];

  // ========================================
  // Existing fields (Epic 33)
  // ========================================

  // Identifiers (depend on view_by mode)
  /** SKU identifier (present when view_by='sku') */
  sku_id?: string;
  /** Campaign identifier (present when view_by='campaign') */
  campaign_id?: number;
  /** Brand name (present when view_by='brand') */
  brand?: string;
  /** Category name (present when view_by='category') */
  category?: string;
  /** Product name (present when view_by='sku') */
  product_name?: string;

  // Core metrics
  /** Number of ad views/impressions */
  views: number;
  /** Number of ad clicks */
  clicks: number;
  /** Number of orders attributed to ads */
  orders: number;
  /** Total ad spend in rubles */
  spend: number;
  /** Total sales from all sources (organic + ad) - Epic 35 */
  total_sales: number;
  /** Revenue attributed to ads only in rubles */
  revenue: number;
  /** Profit before ad costs in rubles */
  profit: number;

  // Epic 35: Organic vs advertising split
  /** Organic sales not attributed to ads (totalSales - revenue) - Epic 35 */
  organic_sales: number;
  /** Percentage of sales from organic sources - Epic 35 */
  organic_contribution: number;

  // Calculated metrics
  /** Return on Ad Spend (revenue / spend) */
  roas: number;
  /** Return on Investment ((profit - spend) / spend) */
  roi: number;
  /** Click-through rate (clicks / views * 100) */
  ctr: number;
  /** Cost per click (spend / clicks) */
  cpc: number;
  /** Conversion rate (orders / clicks * 100) */
  conversion_rate: number;
  /** Profit after advertising costs (profit - spend) */
  profit_after_ads: number;

  // Classification
  /** Efficiency status based on ROAS/ROI thresholds */
  efficiency_status: EfficiencyStatus;
}

/**
 * Query parameters for advertising analytics endpoint.
 *
 * UPDATED for Epic 36: Added group_by parameter.
 */
export interface AdvertisingAnalyticsParams {
  /** Start date in YYYY-MM-DD format (required) */
  from: string;
  /** End date in YYYY-MM-DD format (required) */
  to: string;
  /** View aggregation mode (default: 'sku') */
  view_by?: ViewByMode;

  // Epic 36: NEW - grouping mode
  /** Grouping mode for product card linking (default: 'sku') - Epic 36 */
  group_by?: GroupByMode;

  /** Filter by efficiency status (default: 'all') */
  efficiency_filter?: EfficiencyStatus | 'all';
  /** Filter by campaign IDs (array of numbers) */
  campaign_ids?: number[];
  /** Filter by SKU IDs (array of strings) */
  sku_ids?: string[];
  /** Sort field (default: 'spend') - Request #80: Full backend support */
  sort_by?: 'spend' | 'revenue' | 'orders' | 'views' | 'clicks' | 'roas' | 'roi' | 'ctr' | 'cpc';
  /** Sort direction (default: 'desc') */
  sort_order?: 'asc' | 'desc';
  /** Maximum number of items to return */
  limit?: number;
  /** Number of items to skip (offset-based pagination) */
  offset?: number;
}
```

**Testing**:
```bash
cd frontend
npm run type-check  # Verify TypeScript compilation
```

---

### Step 2: Update API Client (10 min)

**File**: `src/lib/api/advertising-analytics.ts`

**Changes** (add to `getAdvertisingAnalytics` function):

```typescript
export async function getAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams,
): Promise<AdvertisingAnalyticsResponse> {
  // Epic 36: Include group_by parameter in query string
  const queryParams = buildQueryString({ ...params })

  console.info('[Advertising Analytics] Fetching analytics:', {
    from: params.from,
    to: params.to,
    view_by: params.view_by ?? 'sku',
    group_by: params.group_by ?? 'sku', // Epic 36: Log grouping mode
    efficiency_filter: params.efficiency_filter ?? 'all',
    sort_by: params.sort_by ?? 'spend',
    sort_order: params.sort_order ?? 'desc',
  })

  // ... existing code ...

  const response: AdvertisingAnalyticsResponse = {
    // ... existing meta and summary ...

    data: (backendResponse.items || []).map((item: any, index: number) => ({
      key: item.key || `item-${index}`,

      // Epic 36: NEW FIELDS
      type: item.type, // 'merged_group' | 'individual' | undefined
      imtId: item.imtId ?? null, // number | null
      mergedProducts: item.mergedProducts?.map((p: any) => ({
        nmId: p.nmId,
        vendorCode: p.vendorCode,
      })),

      // Existing fields
      sku_id: item.nmId?.toString(),
      campaign_id: item.campaignId?.toString(),
      product_name: item.label,
      brand: item.brand,
      category: item.category,
      views: item.views ?? 0,
      clicks: item.clicks ?? 0,
      orders: item.orders ?? 0,
      spend: item.spend ?? 0,
      total_sales: item.totalSales ?? 0,
      revenue: item.revenue ?? 0,
      profit: item.profit ?? 0,
      organic_sales: item.organicSales ?? 0,
      organic_contribution: item.organicContribution ?? 0,
      roas: item.roas ?? 0,
      roi: item.roi ?? 0,
      ctr: item.ctr ?? 0,
      cpc: item.cpc ?? 0,
      conversion_rate: item.conversionRate ?? 0,
      profit_after_ads: item.profitAfterAds ?? 0,
      efficiency_status: item.efficiency?.status || 'unknown',
    })),
  }

  console.info('[Advertising Analytics] Response:', {
    itemCount: response.data?.length ?? 0,
    totalSpend: response.summary?.total_spend ?? 0,
    overallRoas: response.summary?.overall_roas ?? 0,
    viewBy: response.meta?.view_by ?? 'unknown',
    groupBy: params.group_by ?? 'sku', // Epic 36: Log actual grouping
    efficiencyFilter: params.efficiency_filter ?? 'all',
  })

  return response
}
```

**Testing**:
```bash
cd frontend
npm run lint  # Verify ESLint passes
```

---

### Step 3: Update React Query Hooks (5 min)

**File**: `src/hooks/useAdvertisingAnalytics.ts`

**Add new hook** (append to end of file):

```typescript
/**
 * Hook for advertising analytics with merged product groups (Epic 36).
 *
 * Convenience hook that automatically sets group_by=imtId.
 *
 * @param params - Analytics parameters (group_by will be set to 'imtId')
 * @param options - React Query options
 * @returns Query result with merged group data
 *
 * @example
 * const { data, isLoading } = useAdvertisingMergedGroups({
 *   from: '2025-12-01',
 *   to: '2025-12-21',
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

---

### Step 4: Create MergedProductBadge Component (20 min)

**File**: `src/components/analytics/MergedProductBadge.tsx` (NEW)

```typescript
/**
 * MergedProductBadge Component (Epic 36)
 *
 * Displays a badge indicating a merged product group (склейка) with a tooltip
 * showing all products in the group.
 *
 * @see frontend/docs/request-backend/83-epic-36-api-contract.md
 */

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { MergedProduct } from '@/types/advertising-analytics';

interface MergedProductBadgeProps {
  /** WB merged card identifier */
  imtId: number;
  /** Products within the merged group */
  mergedProducts: MergedProduct[];
  /** Optional custom badge text */
  label?: string;
}

export function MergedProductBadge({
  imtId,
  mergedProducts,
  label,
}: MergedProductBadgeProps) {
  const productCount = mergedProducts.length;

  // Edge case: Single product with imtId (display as individual)
  if (productCount === 1) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="ml-2 cursor-help">
            🔗 {label ?? `Склейка (${productCount})`}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">
              Объединённая карточка #{imtId}
            </p>
            <p className="text-xs text-muted-foreground">
              Товары в группе:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              {mergedProducts.map((product) => (
                <li key={product.nmId}>
                  <span className="font-mono">{product.vendorCode}</span>
                  <span className="text-muted-foreground ml-1">
                    (#{product.nmId})
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              💡 Рекламные затраты основной карточки распределены между всеми
              товарами группы
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

### Step 5: Update Main Analytics Page (30 min)

**File**: `src/app/(dashboard)/analytics/advertising/page.tsx`

**Changes**:

1. **Add state for grouping mode**:

```typescript
'use client';

import { useState } from 'react';
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics';
import { MergedProductBadge } from '@/components/analytics/MergedProductBadge';
import { Button } from '@/components/ui/button';
import type { GroupByMode } from '@/types/advertising-analytics';

export default function AdvertisingAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: '2025-12-01',
    to: '2025-12-21',
  });

  // Epic 36: Add groupBy state
  const [groupBy, setGroupBy] = useState<GroupByMode>('sku');

  const { data, isLoading, error } = useAdvertisingAnalytics({
    ...dateRange,
    group_by: groupBy, // Epic 36: Pass groupBy parameter
  });

  // ... rest of existing code ...
}
```

2. **Add UI toggle for grouping mode**:

```typescript
{/* Epic 36: Group By Toggle */}
<div className="flex items-center gap-4 mb-6">
  <h1 className="text-2xl font-bold">Рекламная аналитика</h1>

  <div className="flex gap-2 ml-auto">
    <Button
      variant={groupBy === 'sku' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setGroupBy('sku')}
    >
      По артикулам
    </Button>
    <Button
      variant={groupBy === 'imtId' ? 'default' : 'outline'}
      size="sm"
      onClick={() => setGroupBy('imtId')}
    >
      По склейкам
    </Button>
  </div>
</div>
```

3. **Update table rendering to show merged badges**:

```typescript
<TableBody>
  {data?.data.map((item) => (
    <TableRow key={item.key}>
      <TableCell>
        {/* Epic 36: Show product name or merged group */}
        <div className="flex items-center">
          {item.type === 'merged_group' && item.mergedProducts ? (
            <>
              <span className="font-medium">
                Группа #{item.imtId}
              </span>
              <MergedProductBadge
                imtId={item.imtId!}
                mergedProducts={item.mergedProducts}
              />
            </>
          ) : (
            <span className="font-medium">
              {item.product_name || item.sku_id || 'N/A'}
            </span>
          )}
        </div>
      </TableCell>

      {/* Metrics columns - existing code */}
      <TableCell>{formatCurrency(item.spend)}</TableCell>
      <TableCell>{formatCurrency(item.revenue)}</TableCell>
      <TableCell>{item.roas.toFixed(2)}</TableCell>
      <TableCell>{item.roi.toFixed(2)}</TableCell>
      <TableCell>
        <EfficiencyBadge status={item.efficiency_status} />
      </TableCell>
    </TableRow>
  ))}
</TableBody>
```

---

### Step 6: Update Filters Component (Optional - 15 min)

**File**: `src/components/analytics/AdvertisingFilters.tsx`

**Add group by toggle to filters panel**:

```typescript
interface AdvertisingFiltersProps {
  // ... existing props
  groupBy?: GroupByMode;
  onGroupByChange?: (mode: GroupByMode) => void;
}

export function AdvertisingFilters({
  // ... existing props
  groupBy = 'sku',
  onGroupByChange,
}: AdvertisingFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Existing filters */}

      {/* Epic 36: Group By Filter */}
      <div>
        <label className="text-sm font-medium">Группировка</label>
        <div className="flex gap-2 mt-2">
          <Button
            variant={groupBy === 'sku' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onGroupByChange?.('sku')}
          >
            По артикулам
          </Button>
          <Button
            variant={groupBy === 'imtId' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onGroupByChange?.('imtId')}
          >
            По склейкам
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Склейки объединяют метрики для объединённых карточек товаров
        </p>
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Checklist

### Unit Tests

**File**: `src/components/analytics/MergedProductBadge.test.tsx` (NEW)

```typescript
import { render, screen } from '@testing-library/react';
import { MergedProductBadge } from './MergedProductBadge';

describe('MergedProductBadge', () => {
  it('renders badge with correct product count', () => {
    render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={[
          { nmId: 173588306, vendorCode: 'ter-09' },
          { nmId: 173589306, vendorCode: 'ter-10' },
          { nmId: 270937054, vendorCode: 'ter-13-1' },
        ]}
      />
    );

    expect(screen.getByText(/Склейка \(3\)/)).toBeInTheDocument();
  });

  it('returns null for single product with imtId', () => {
    const { container } = render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={[{ nmId: 173588306, vendorCode: 'ter-09' }]}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows all products in tooltip', async () => {
    render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={[
          { nmId: 173588306, vendorCode: 'ter-09' },
          { nmId: 173589306, vendorCode: 'ter-10' },
        ]}
      />
    );

    const badge = screen.getByText(/Склейка/);
    await userEvent.hover(badge);

    expect(screen.getByText('ter-09')).toBeInTheDocument();
    expect(screen.getByText('ter-10')).toBeInTheDocument();
    expect(screen.getByText(/#328632/)).toBeInTheDocument();
  });
});
```

### Integration Tests

**Test Scenarios**:
1. ✅ Toggle switches between SKU and imtId modes
2. ✅ API client sends correct `group_by` parameter
3. ✅ Merged groups display with badge and tooltip
4. ✅ Individual products display without badge
5. ✅ Mixed response (both types) renders correctly
6. ✅ ROAS/ROI calculations are correct for merged groups
7. ✅ Sorting works correctly for both modes
8. ✅ Filters work with both grouping modes

### E2E Tests (Playwright)

**File**: `frontend/e2e/advertising-analytics-epic-36.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Epic 36: Product Card Linking', () => {
  test('should toggle between SKU and imtId grouping modes', async ({ page }) => {
    await page.goto('/analytics/advertising');

    // Default: По артикулам
    await expect(page.getByRole('button', { name: 'По артикулам' })).toHaveAttribute(
      'data-state',
      'active'
    );

    // Switch to По склейкам
    await page.getByRole('button', { name: 'По склейкам' }).click();

    // Verify merged groups are displayed
    await expect(page.getByText(/Группа #/)).toBeVisible();
    await expect(page.getByText(/🔗 Склейка/)).toBeVisible();
  });

  test('should show merged product tooltip on hover', async ({ page }) => {
    await page.goto('/analytics/advertising');
    await page.getByRole('button', { name: 'По склейкам' }).click();

    // Hover over merged badge
    await page.getByText(/🔗 Склейка/).first().hover();

    // Verify tooltip content
    await expect(page.getByText(/Объединённая карточка #/)).toBeVisible();
    await expect(page.getByText(/Товары в группе:/)).toBeVisible();
  });

  test('should display correct ROAS for merged groups', async ({ page }) => {
    await page.goto('/analytics/advertising');
    await page.getByRole('button', { name: 'По склейкам' }).click();

    // Find merged group row
    const mergedRow = page.locator('tr:has-text("Группа #328632")');

    // Verify ROAS is displayed (not null or "N/A")
    const roasCell = mergedRow.locator('td').nth(3); // Assuming ROAS is 4th column
    await expect(roasCell).not.toHaveText(/N\/A|null/);
    await expect(roasCell).toHaveText(/^\d+\.\d+$/); // Numeric value
  });
});
```

---

## 📊 Performance Considerations

### API Response Size

**Before (group_by=sku)**:
- 100 individual products → ~50KB response

**After (group_by=imtId)**:
- 20 merged groups + 30 individuals → ~35KB response (30% reduction)
- `mergedProducts` array adds ~2KB per group (acceptable)

**Optimization**: Backend already implements this efficiently. No frontend optimizations needed.

### React Re-renders

**State Updates**:
- Toggling `groupBy` triggers full data refetch (expected)
- React Query caches both `group_by=sku` and `group_by=imtId` responses separately
- No unnecessary re-renders (memoized components)

**Recommendation**: Use `React.memo()` for `MergedProductBadge` to prevent re-renders on parent updates.

---

## 🚨 Edge Cases & Error Handling

### Edge Case 1: Single Product with imtId

**Scenario**: Product has `imtId=328632` but NO other products share this imtId.

**Backend Response**:
```json
{
  "type": "merged_group",
  "imtId": 328632,
  "mergedProducts": [{ "nmId": 173588306, "vendorCode": "ter-09" }]
}
```

**Frontend Handling**:
```typescript
// In MergedProductBadge.tsx
if (mergedProducts.length === 1) {
  return null; // Display as individual product (no badge)
}
```

### Edge Case 2: All Products Have NULL imtId

**Scenario**: No products in cabinet have imtId assigned.

**Backend Response**: All products return `type='individual'`, `imtId=null`.

**Frontend Behavior**:
- No merged groups displayed
- UI toggle still works (but shows same data as `group_by=sku`)
- No errors, graceful degradation

### Edge Case 3: Network Error

**Scenario**: API request fails due to network issues.

**Frontend Handling**:
```typescript
const { data, isLoading, error } = useAdvertisingAnalytics({
  ...dateRange,
  group_by: groupBy,
});

if (error) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Ошибка загрузки данных</AlertTitle>
      <AlertDescription>
        {getAdvertisingErrorMessage(error.status)}
      </AlertDescription>
    </Alert>
  );
}
```

---

## 📚 Documentation Updates

### Files to Update

1. **`frontend/README.md`**:
   - Add Epic 36 to completed features list
   - Update version to indicate Epic 36 support

2. **`frontend/docs/features/advertising-analytics.md`**:
   - Document "По склейкам" feature
   - Add screenshots of merged groups UI
   - Explain imtId concept for users

3. **`frontend/CHANGELOG.md`**:
   ```markdown
   ## [Unreleased]
   ### Added
   - Epic 36: Product Card Linking (склейки) support in advertising analytics
   - Toggle between individual SKUs and merged product groups
   - Merged product badge with tooltip showing all products in group
   - Correct ROAS/ROI calculations for merged cards
   ```

---

## ✅ Acceptance Criteria

Epic 36 frontend integration is **complete** when:

- [ ] TypeScript types updated with `GroupByMode`, `MergedProduct`, extended `AdvertisingItem`
- [ ] API client sends `group_by` parameter to backend
- [ ] React Query hook supports `group_by=imtId` mode
- [ ] UI displays "По артикулам" / "По склейкам" toggle
- [ ] Merged group badge renders with correct product count
- [ ] Tooltip shows all products in merged group
- [ ] ROAS/ROI display correctly for merged groups (no NULL or "unknown")
- [ ] Single product with imtId displays as individual (no badge)
- [ ] All products with NULL imtId display correctly
- [ ] Network errors handled gracefully
- [ ] Unit tests pass for `MergedProductBadge`
- [ ] Integration tests pass for grouping toggle
- [ ] E2E tests pass for full workflow
- [ ] No regressions in existing Epic 33 functionality
- [ ] Code review approved
- [ ] Documentation updated in `frontend/README.md`

---

## 🔗 Resources

### Backend Documentation
- **API Contract**: `frontend/docs/request-backend/83-epic-36-api-contract.md`
- **API Reference**: `docs/API-PATHS-REFERENCE.md:986-1102`
- **Epic 36 Main**: `docs/stories/epic-36/`
- **Grafana Dashboard**: `monitoring/grafana/dashboards/epic-36-product-card-linking.json`

### Frontend Resources
- **shadcn/ui Badge**: https://ui.shadcn.com/docs/components/badge
- **shadcn/ui Tooltip**: https://ui.shadcn.com/docs/components/tooltip
- **TanStack Query**: https://tanstack.com/query/latest/docs/react/overview

### Related Issues
- **Request #82**: Card Linking Investigation (predecessor)
- **Epic 33**: Advertising Analytics (baseline)
- **Story 36.6**: Backend Testing & Observability (complete)

---

## 📞 Support

**For Questions**:
- Backend API: See `frontend/docs/request-backend/83-epic-36-api-contract.md`
- Frontend Implementation: This document
- Slack: #epic-36-product-linking

**Priority**: High - Backend is complete and waiting for frontend integration.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Status**: 📋 Ready to Implement
