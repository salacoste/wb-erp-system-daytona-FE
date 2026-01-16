# Request #83: Epic 36 Product Card Linking - Frontend API Contract

**Date**: 2025-12-27 (Updated: 2025-12-28)
**Status**: ✅ **PRODUCTION READY** (Critical bugfix applied 2025-12-28)
**Priority**: High
**Epic**: 36 - Product Card Linking (склейки)
**Related**: Request #82 (Card Linking Investigation), Request #85 (Production Status)

---

## 📋 Executive Summary

Epic 36 **Product Card Linking** is now **100% complete** in the backend. This document serves as the **official API contract** for frontend integration.

**What's New**:
- ✅ Products table populated with `imtId` (WB merged card identifier)
- ✅ Daily automatic sync of imtId from WB Content API
- ✅ Analytics API supports `group_by=imtId` parameter
- ✅ Aggregated metrics for merged product groups
- ✅ Backward compatibility with existing `group_by=sku` mode

**Impact**: Solves the "spend=0 but revenue>0" problem identified in Request #82 by grouping all products with the same imtId.

---

## 🐛 Critical Bugfix Update (2025-12-28)

**⚠️ IMPORTANT**: WB Content API pagination limit corrected after production testing.

**Issue Discovered**:
- WB API rejected all sync requests with `ValidationError` (HTTP 400)
- Backend assumed 1000 cards/batch was acceptable (incorrect)

**Fix Applied**:
- Changed pagination limit from 1000 to **100 cards/batch** (WB API maximum)
- File: `src/products/services/product-imt-sync.service.ts:191`

**Impact on Frontend**:
- ✅ **NO breaking changes** - API contract remains identical
- ✅ **NO code updates needed** - all examples in this document still valid
- ✅ **Production validated** - 47 products synced successfully in 1.4s

**Performance Note**:
- Slightly more WB API requests for large catalogs (10× more batches for 1000+ products)
- Backend handles this transparently with 1000ms delay between batches
- Sync still completes in <15s for typical catalogs (50-200 products)

📖 **Full bugfix details**: Request #85 (`85-epic-36-production-status.md`)

---

## 🎯 Backend Implementation Summary

### Database Schema

**Table**: `products`
```prisma
model Product {
  nmId       Int      @id @map("nm_id")
  imtId      Int?     @map("imt_id")  // NEW: WB card linking ID
  vendorCode String   @map("vendor_code")
  cabinetId  String   @map("cabinet_id") @db.Uuid
  brand      String?
  category   String?
  subject    String?
  // ... other fields
}
```

**Key Points**:
- `imtId` is **nullable** (products without merging have NULL)
- Multiple products can share the same `imtId` (merged group)
- Auto-synced daily at 06:00 MSK from WB Content API

### API Endpoint

**Endpoint**: `GET /v1/analytics/advertising`

**New Parameter**: `group_by`
| Value | Description | Returns |
|-------|-------------|---------|
| `sku` (default) | Individual SKU metrics | Each nmId as separate row |
| `imtId` | Merged card metrics | Aggregated by imtId (склейки) |

**Example Request**:
```http
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-21&group_by=imtId
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

---

## 🔗 TypeScript Interface Extensions

### 1. Update `ViewByMode` → `GroupByMode`

**File**: `frontend/src/types/advertising-analytics.ts`

```typescript
// NEW: Grouping mode for advertising analytics
export type GroupByMode = 'sku' | 'imtId';

// DEPRECATED (keep for backward compatibility)
export type ViewByMode = 'sku' | 'campaign' | 'brand' | 'category';
```

### 2. Add `MergedProduct` Interface

```typescript
/**
 * Product information within a merged group (Epic 36)
 * Used when group_by=imtId
 */
export interface MergedProduct {
  /** WB article number */
  nmId: number;

  /** Seller's SKU code */
  vendorCode: string;
}
```

### 3. Extend `AdvertisingItem` Interface

```typescript
/**
 * Advertising analytics item - supports both individual SKUs and merged groups
 * Epic 36: Added support for product card linking (склейки)
 */
export interface AdvertisingItem {
  key: string;

  // ========================================
  // Epic 36: NEW FIELDS (group_by=imtId)
  // ========================================

  /** Item type discriminator (Epic 36) */
  type?: 'merged_group' | 'individual';

  /**
   * WB merged card ID (склейка identifier)
   * - For merged_group: shared imtId value
   * - For individual: null (no merging)
   */
  imtId?: number | null;

  /**
   * Products within merged group (Epic 36)
   * Only present when type='merged_group'
   * Contains array of nmId + vendorCode pairs
   */
  mergedProducts?: MergedProduct[];

  // ========================================
  // Existing fields (Epic 33)
  // ========================================

  sku_id?: string;
  campaign_id?: number;
  brand?: string;
  category?: string;
  product_name?: string;

  // Metrics
  views: number;
  clicks: number;
  orders: number;
  spend: number;
  total_sales: number;
  revenue: number;
  profit: number;
  organic_sales: number;
  organic_contribution: number;

  // Calculated metrics
  roas: number;
  roi: number;
  ctr: number;
  cpc: number;
  conversion_rate: number;
  profit_after_ads: number;

  // Efficiency
  efficiency_status: EfficiencyStatus;
}
```

### 4. Extend `AdvertisingAnalyticsParams`

```typescript
export interface AdvertisingAnalyticsParams {
  from: string;
  to: string;

  // Epic 36: NEW - grouping mode
  group_by?: GroupByMode;  // 'sku' | 'imtId'

  // Existing Epic 33 parameters
  view_by?: ViewByMode;
  efficiency_filter?: EfficiencyStatus | 'all';
  campaign_ids?: number[];
  sku_ids?: string[];
  sort_by?: 'spend' | 'revenue' | 'orders' | 'views' | 'clicks' | 'roas' | 'roi' | 'ctr' | 'cpc';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

---

## 📊 API Response Examples

### Example 1: Merged Group (type='merged_group')

**Request**:
```http
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-21&group_by=imtId
```

**Response** (merged group with 3 products):
```json
{
  "data": [
    {
      "type": "merged_group",
      "key": "imtId:328632",
      "imtId": 328632,
      "mergedProducts": [
        { "nmId": 173588306, "vendorCode": "ter-09" },
        { "nmId": 173589306, "vendorCode": "ter-10" },
        { "nmId": 270937054, "vendorCode": "ter-13-1" }
      ],
      "totalViews": 6200,
      "totalClicks": 310,
      "totalOrders": 13,
      "totalSpend": 11337,
      "totalRevenue": 34058,
      "totalSales": 34058,
      "organicSales": 0,
      "organicContribution": 0,
      "financials": {
        "roas": 3.0,
        "roi": 2.0,
        "ctr": 5.0,
        "cpc": 36.57,
        "conversionRate": 4.19,
        "profitAfterAds": 22721
      },
      "efficiency": {
        "status": "profitable",
        "recommendation": "Рентабельная кампания"
      }
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

**Field Mapping**:
| Field | Type | Description |
|-------|------|-------------|
| `type` | `'merged_group'` | Indicates this is an aggregated group |
| `imtId` | `328632` | WB merged card identifier |
| `mergedProducts` | `MergedProduct[]` | Array of products in group (3 items) |
| `totalSpend` | `11337` | SUM of spend across all 3 products |
| `totalRevenue` | `34058` | SUM of revenue (1,105 + 1,489 + 31,464) |
| `financials.roas` | `3.0` | totalRevenue / totalSpend |

### Example 2: Individual Product (type='individual')

**Response** (product with NULL imtId):
```json
{
  "data": [
    {
      "type": "individual",
      "key": "sku:12345678",
      "nmId": 12345678,
      "vendorCode": "izo30white",
      "imtId": null,
      "totalViews": 3000,
      "totalClicks": 150,
      "totalOrders": 5,
      "totalSpend": 5000,
      "totalRevenue": 7500,
      "totalSales": 7500,
      "organicSales": 0,
      "organicContribution": 0,
      "financials": {
        "roas": 1.5,
        "roi": 0.5,
        "ctr": 5.0,
        "cpc": 33.33,
        "conversionRate": 3.33,
        "profitAfterAds": 2500
      },
      "efficiency": {
        "status": "profitable",
        "recommendation": "Умеренная рентабельность"
      }
    }
  ],
  "meta": {
    "total": 1,
    "limit": 100,
    "offset": 0
  }
}
```

**Field Mapping**:
| Field | Type | Description |
|-------|------|-------------|
| `type` | `'individual'` | Not part of a merged group |
| `imtId` | `null` | No card linking (standalone product) |
| `mergedProducts` | `undefined` | Field not present for individual products |
| `totalSpend` | `5000` | Direct advertising spend |
| `totalRevenue` | `7500` | Revenue from this product only |

### Example 3: Mixed Response (Both Types)

**Response** (1 merged group + 1 individual):
```json
{
  "data": [
    {
      "type": "merged_group",
      "imtId": 328632,
      "mergedProducts": [
        { "nmId": 173588306, "vendorCode": "ter-09" },
        { "nmId": 173589306, "vendorCode": "ter-10" },
        { "nmId": 270937054, "vendorCode": "ter-13-1" }
      ],
      "totalSpend": 11337,
      "totalRevenue": 34058,
      "financials": { "roas": 3.0, "roi": 2.0 }
    },
    {
      "type": "individual",
      "imtId": null,
      "nmId": 12345678,
      "vendorCode": "izo30white",
      "totalSpend": 5000,
      "totalRevenue": 7500,
      "financials": { "roas": 1.5, "roi": 0.5 }
    }
  ],
  "meta": {
    "total": 2,
    "limit": 100,
    "offset": 0
  }
}
```

---

## 🔍 Edge Cases & Behavior

### Edge Case 1: Single Product with imtId

**Scenario**: Product has `imtId=328632` but NO other products share this imtId.

**Backend Behavior**:
- Still returns `type='merged_group'`
- `mergedProducts` array has **1 item**
- Metrics are identical to individual product

**Frontend Handling**:
```typescript
// Check if merged group has only 1 product
if (item.type === 'merged_group' && item.mergedProducts?.length === 1) {
  // Display as individual product (no "merged" UI treatment)
  return <ProductRow product={item} displayAsMerged={false} />
}
```

### Edge Case 2: All Products Have NULL imtId

**Scenario**: No products in cabinet have imtId assigned.

**Backend Behavior**:
- Returns all products as `type='individual'`
- `imtId=null` for all items
- Identical to `group_by=sku` response

**Frontend Handling**:
- No UI changes needed
- Product list displays normally
- No "merged group" badges shown

### Edge Case 3: Products with spend=0 (Resolved)

**Scenario**: ter-09 has `spend=0, revenue=1105` (from Request #82).

**Backend Behavior**:
- When `group_by=imtId`:
  - ter-09 is merged with ter-13-1 (same imtId=328632)
  - ter-13-1 has `spend=11337`
  - Merged group shows `totalSpend=11337, totalRevenue=34058`
  - **ROAS is now calculable**: 34058 / 11337 = 3.0

**Frontend Handling**:
- ✅ No more "🔵 Нет данных" status for ter-09
- ✅ ROAS/ROI are now valid numbers (no NULL)
- ✅ Efficiency status is calculated correctly

---

## 🚀 Frontend Integration Guide

### Step 1: Update TypeScript Types

**File**: `frontend/src/types/advertising-analytics.ts`

```typescript
// Add new types
export type GroupByMode = 'sku' | 'imtId';

export interface MergedProduct {
  nmId: number;
  vendorCode: string;
}

// Extend AdvertisingItem
export interface AdvertisingItem {
  // ... existing fields

  // Epic 36: NEW
  type?: 'merged_group' | 'individual';
  imtId?: number | null;
  mergedProducts?: MergedProduct[];
}

// Extend params
export interface AdvertisingAnalyticsParams {
  // ... existing params
  group_by?: GroupByMode;  // NEW
}
```

### Step 2: Update API Client

**File**: `frontend/src/lib/api/advertising-analytics.ts`

```typescript
export async function getAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams
): Promise<AdvertisingAnalyticsResponse> {
  const queryParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  // Epic 36: Add group_by parameter
  if (params.group_by) {
    queryParams.append('group_by', params.group_by);
  }

  // ... existing parameters

  const response = await apiClient.get<AdvertisingAnalyticsResponse>(
    `/v1/analytics/advertising?${queryParams.toString()}`
  );

  return response.data;
}
```

### Step 3: Update React Query Hook

**File**: `frontend/src/hooks/useAdvertisingAnalytics.ts`

```typescript
export function useAdvertisingAnalytics(
  params: AdvertisingAnalyticsParams,
  options?: UseQueryOptions<AdvertisingAnalyticsResponse>
) {
  return useQuery({
    queryKey: ['advertising-analytics', params],
    queryFn: () => getAdvertisingAnalytics(params),
    ...options,
  });
}

// NEW: Hook specifically for merged groups
export function useAdvertisingMergedGroups(
  params: Omit<AdvertisingAnalyticsParams, 'group_by'>,
  options?: UseQueryOptions<AdvertisingAnalyticsResponse>
) {
  return useAdvertisingAnalytics(
    { ...params, group_by: 'imtId' },
    options
  );
}
```

### Step 4: Add UI Components

**File**: `frontend/src/components/analytics/MergedProductBadge.tsx` (NEW)

```typescript
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MergedProduct } from '@/types/advertising-analytics';

interface MergedProductBadgeProps {
  mergedProducts: MergedProduct[];
  imtId: number;
}

export function MergedProductBadge({ mergedProducts, imtId }: MergedProductBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="secondary">
          🔗 Склейка ({mergedProducts.length})
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="text-sm">
          <p className="font-semibold mb-1">Объединённая карточка #{imtId}</p>
          <ul className="list-disc pl-4 space-y-1">
            {mergedProducts.map((p) => (
              <li key={p.nmId}>
                {p.vendorCode} (#{p.nmId})
              </li>
            ))}
          </ul>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
```

### Step 5: Update Main Analytics Page

**File**: `frontend/src/app/(dashboard)/analytics/advertising/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useAdvertisingAnalytics } from '@/hooks/useAdvertisingAnalytics';
import { MergedProductBadge } from '@/components/analytics/MergedProductBadge';
import type { GroupByMode } from '@/types/advertising-analytics';

export default function AdvertisingAnalyticsPage() {
  const [groupBy, setGroupBy] = useState<GroupByMode>('sku');
  const [dateRange, setDateRange] = useState({ from: '2025-12-01', to: '2025-12-21' });

  const { data, isLoading } = useAdvertisingAnalytics({
    ...dateRange,
    group_by: groupBy,
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Рекламная аналитика</h1>

        {/* Epic 36: Group By Toggle */}
        <div className="flex gap-2">
          <Button
            variant={groupBy === 'sku' ? 'default' : 'outline'}
            onClick={() => setGroupBy('sku')}
          >
            По артикулам
          </Button>
          <Button
            variant={groupBy === 'imtId' ? 'default' : 'outline'}
            onClick={() => setGroupBy('imtId')}
          >
            По склейкам
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Table>
        <TableBody>
          {data?.data.map((item) => (
            <TableRow key={item.key}>
              <TableCell>
                {/* Epic 36: Show merged badge */}
                {item.type === 'merged_group' && item.mergedProducts && (
                  <MergedProductBadge
                    imtId={item.imtId!}
                    mergedProducts={item.mergedProducts}
                  />
                )}
                {item.type === 'individual' && (
                  <span>{item.vendorCode}</span>
                )}
              </TableCell>

              {/* Metrics */}
              <TableCell>{formatCurrency(item.totalSpend)}</TableCell>
              <TableCell>{formatCurrency(item.totalRevenue)}</TableCell>
              <TableCell>{item.financials.roas.toFixed(2)}</TableCell>
              <TableCell>{item.financials.roi.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## ⚠️ Breaking Changes

**None** - Epic 36 is fully backward compatible.

**Default Behavior**:
- If `group_by` parameter is **omitted**, backend defaults to `group_by=sku`
- Response format for `group_by=sku` is **identical** to Epic 33
- Existing frontend code continues to work without changes

**Opt-In**:
- Frontend must **explicitly pass** `group_by=imtId` to enable merged groups
- New fields (`type`, `imtId`, `mergedProducts`) only appear when `group_by=imtId`

---

## 🧪 Testing Checklist

### Backend Tests (Completed)

- ✅ **Unit Tests**: 96.63% coverage (ProductImtSyncService)
- ✅ **Integration Tests**: 6/6 passing (advertising-imt-grouping.e2e-spec.ts)
- ✅ **E2E Tests**: Full workflow test (product-card-linking.e2e-spec.ts)
- ✅ **Prometheus Metrics**: 3 metrics exposed at /metrics

### Frontend Tests (TODO)

**Component Tests**:
- [ ] MergedProductBadge renders with correct product count
- [ ] MergedProductBadge tooltip shows all products
- [ ] Group by toggle switches between 'sku' and 'imtId'

**Integration Tests**:
- [ ] API client sends `group_by` parameter correctly
- [ ] Response with merged groups is parsed correctly
- [ ] Response with individual products is parsed correctly
- [ ] Mixed response (both types) is handled correctly

**E2E Tests** (Playwright):
- [ ] User can toggle between "По артикулам" and "По склейкам"
- [ ] Merged groups display with badge and tooltip
- [ ] Individual products display without badge
- [ ] ROAS/ROI calculations are correct for merged groups
- [ ] Sorting works correctly for both modes

---

## 📊 Observability

### Prometheus Metrics

**Metrics Exposed** (backend already implemented):

1. **`product_imt_sync_total{cabinet_id, status}`** (Counter)
   - Tracks imtId sync job completions
   - Labels: `status=success|failure`
   - Use: Monitor sync health

2. **`product_imt_sync_duration_ms{cabinet_id}`** (Histogram)
   - Sync duration in milliseconds
   - Use: Performance monitoring

3. **`product_merged_groups_count{cabinet_id}`** (Gauge)
   - Number of unique merged groups (distinct imtId values)
   - Use: Business KPI

**Frontend Metrics** (TODO):
- Add `advertising_group_by_mode` counter (labels: `mode=sku|imtId`)
- Track user engagement with merged groups view

---

## 🔗 Related Documentation

### Backend Documentation
- **Epic 36 Main**: `docs/stories/epic-36/`
- **Story 36.6**: `docs/stories/epic-36/story-36.6-testing-documentation-observability.md`
- **API Paths**: `docs/API-PATHS-REFERENCE.md` (lines 986-1102)
- **Product Sync**: `docs/architecture/epic-36/product-sync-flow.md`

### Frontend Documentation
- **Request #82**: Card Linking Investigation (predecessor to Epic 36)
- **Epic 33**: Advertising Analytics (baseline implementation)

### WB API Documentation
- **Content API**: Product cards with imtId field
- **Promotion API**: Advertising statistics by nmId

---

## 📞 Support & Questions

**For Backend Questions**:
- Contact: Backend Team Lead
- Reference: Epic 36 documentation in `docs/stories/epic-36/`

**For Frontend Integration Support**:
- This document serves as the official contract
- All TypeScript types are provided above
- API behavior is guaranteed to match examples

**Priority**: High - Epic 36 backend is complete and ready for frontend integration.

---

## ✅ Acceptance Criteria (Frontend)

Epic 36 frontend integration is **complete** when:

- [ ] TypeScript types updated with `GroupByMode`, `MergedProduct`, extended `AdvertisingItem`
- [ ] API client supports `group_by` parameter
- [ ] React Query hook supports `group_by=imtId` mode
- [ ] UI displays merged group badge and tooltip
- [ ] UI toggle switches between SKU and imtId views
- [ ] All Epic 36 fields render correctly (type, imtId, mergedProducts)
- [ ] ROAS/ROI calculations display correctly for merged groups
- [ ] No regressions in existing Epic 33 functionality
- [ ] Component tests pass for new components
- [ ] E2E tests pass for merged groups flow
- [ ] Code review approved
- [ ] Documentation updated in `frontend/README.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Status**: ✅ Ready for Frontend Implementation
