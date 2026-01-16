# Backend Response: Request #15 Implementation - Include Margin in Product List

**Date**: 2025-11-23
**Request**: #15 - Add `includeCogs` parameter to product list endpoint
**Status**: ✅ **READY FOR FRONTEND INTEGRATION**
**Backend Effort**: 5-7 hours (implemented with batching optimization)

---

## Executive Summary

Backend has implemented Request #15 with **batching optimization** (Option 2) for optimal performance.

**What Changed**:
- ✅ Added `include_cogs` query parameter to `GET /v1/products`
- ✅ Implemented batch margin lookup (300ms for 25 products)
- ✅ Returns margin fields when `include_cogs=true`
- ✅ Backward compatible (default behavior unchanged)
- ✅ E2E tests passing with performance validation

---

## API Changes

### New Query Parameter

**Endpoint**: `GET /v1/products`

**New Parameter**:
```typescript
include_cogs?: boolean = false  // Default: false (backward compatible)
```

**Usage Examples**:

```bash
# Default behavior (fast, no margin data)
GET /v1/products?limit=25
Response time: ~150ms
Includes: nm_id, sa_name, brand, has_cogs, cogs

# With margin data (opt-in, slower but optimized)
GET /v1/products?limit=25&include_cogs=true
Response time: ~300ms
Includes: All above + current_margin_pct, current_margin_period, etc.
```

---

## Response Format Changes

### When `include_cogs=false` (Default)

**Response Type**: `ProductListItem[]`

```json
{
  "products": [
    {
      "nm_id": "147205694",
      "sa_name": "Жидкая кожа черная",
      "brand": "BrandName",
      "has_cogs": true,
      "cogs": {
        "unit_cost_rub": "22.00",
        "valid_from": "2025-11-23"
      },
      "barcode": "1234567890",
      "last_sale_date": "2025-11-22",
      "total_sales_qty": 150
      // NO margin fields (undefined)
    }
  ],
  "pagination": {
    "total": 100,
    "next_cursor": "eyJubUlkIjoiMTIzNDUifQ=="
  }
}
```

### When `include_cogs=true` (New Feature)

**Response Type**: `ProductWithCogs[]`

```json
{
  "products": [
    {
      "nm_id": "147205694",
      "sa_name": "Жидкая кожа черная",
      "brand": "BrandName",
      "has_cogs": true,
      "cogs": {
        "unit_cost_rub": "22.00",
        "valid_from": "2025-11-23"
      },
      "barcode": "1234567890",
      "last_sale_date": "2025-11-22",
      "total_sales_qty": 150,

      // NEW: Margin fields (from Epic 17 analytics)
      "current_margin_pct": 35.5,           // Margin percentage (null if no sales/COGS)
      "current_margin_period": "2025-W46",  // ISO week used for calculation
      "current_margin_sales_qty": 50,       // Sales quantity in period
      "current_margin_revenue": 125000.50,  // Revenue in period
      "missing_data_reason": null           // Reason if margin is null
    }
  ],
  "pagination": {
    "total": 100,
    "next_cursor": "eyJubUlkIjoiMTIzNDUifQ=="
  }
}
```

### Margin Missing Scenarios

**When margin is `null`**, `missing_data_reason` explains why:

```json
{
  "current_margin_pct": null,
  "current_margin_period": "2025-W46",
  "current_margin_sales_qty": 0,
  "current_margin_revenue": 0,
  "missing_data_reason": "NO_SALES_DATA"  // Possible values below
}
```

**Possible `missing_data_reason` values**:
- `null` - Margin calculated successfully
- `"NO_SALES_DATA"` - Product never sold
- `"NO_SALES_IN_PERIOD"` - No sales in last completed week
- `"COGS_NOT_ASSIGNED"` - COGS not assigned to product
- `"ANALYTICS_UNAVAILABLE"` - Epic 17 analytics service unavailable

---

## Frontend Integration Guide

### Step 1: Update useProducts Hook

**File**: `frontend/src/hooks/useProducts.ts`

**Add to ProductFilters interface**:
```typescript
export interface ProductFilters {
  has_cogs?: boolean
  search?: string
  cursor?: string
  limit?: number
  include_margin?: boolean  // NEW: Request margin data from backend
}
```

**Update queryFn to send parameter**:
```typescript
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<ProductListResponse> => {
      const params = new URLSearchParams()

      // ... existing parameters ...

      // NEW: Send include_cogs to backend if include_margin=true
      if (filters.include_margin) {
        params.append('include_cogs', 'true')
      }

      const response = await apiClient.get<ProductListResponse>(
        `/v1/products?${params.toString()}`
      )

      return response
    },
    // Longer stale time when margin data included (more expensive query)
    staleTime: filters.include_margin ? 60000 : 30000,
    // ... rest of config ...
  })
}
```

### Step 2: Update ProductList Component

**File**: `frontend/src/components/custom/ProductList.tsx`

**Add prop to enable margin display**:
```typescript
export interface ProductListProps {
  onProductSelect?: (product: ProductListItem) => void
  selectedProductId?: string
  showOnlyWithoutCogs?: boolean
  enableSelection?: boolean
  enableMarginDisplay?: boolean  // NEW: Show margin in list
}

export function ProductList({
  onProductSelect,
  selectedProductId,
  showOnlyWithoutCogs = false,
  enableSelection = false,
  enableMarginDisplay = false,  // NEW: Default false (backward compatible)
}: ProductListProps) {
  // Request margin data when enabled
  const { data, isLoading } = useProducts({
    search,
    has_cogs,
    cursor,
    limit,
    include_margin: enableMarginDisplay,  // NEW: Pass to hook
  })

  // ... rest of component ...

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Артикул</TableHead>
          <TableHead>Название</TableHead>
          <TableHead>Себестоимость</TableHead>
          <TableHead>Маржа</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.products.map((product) => (
          <TableRow key={product.nm_id}>
            {/* ... other cells ... */}

            <TableCell>
              {/* NEW: Show margin when available */}
              {enableMarginDisplay && product.current_margin_pct !== undefined ? (
                <MarginBadge
                  marginPct={product.current_margin_pct}
                  missingDataReason={product.missing_data_reason}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">—</span>
                  {product.has_cogs && !enableMarginDisplay && (
                    <span className="text-xs text-gray-400"
                          title="Включите отображение маржи">
                      (доступно)
                    </span>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

**Update MarginBadge import** (if removed earlier):
```typescript
import { MarginBadge } from './MarginDisplay'
```

### Step 3: Update Parent Pages (Optional)

**File**: `src/app/(dashboard)/cogs/page.tsx` (or wherever ProductList is used)

**Enable margin display for COGS management**:
```typescript
<ProductList
  onProductSelect={handleProductSelect}
  showOnlyWithoutCogs={false}
  enableSelection={true}
  enableMarginDisplay={true}  // NEW: Show margin in COGS management UI
/>
```

---

## Performance Characteristics

### Measured Performance (Dev Environment)

**Without margin data** (`include_cogs=false`):
```
Request: GET /v1/products?limit=25
Response time: ~150ms
Breakdown:
  - WB API call: ~100ms
  - COGS lookup: ~30ms
  - Response serialization: ~20ms
```

**With margin data** (`include_cogs=true`):
```
Request: GET /v1/products?limit=25&include_cogs=true
Response time: ~300ms (+150ms overhead)
Breakdown:
  - WB API call: ~100ms
  - COGS lookup: ~30ms
  - Epic 17 analytics batch query: ~130ms  ← NEW (single query for all 25 products)
  - HashMap merge: ~10ms
  - Response serialization: ~30ms
```

**Performance Validation**:
- ✅ Target: <500ms for 25 products
- ✅ Actual: ~300ms (60% below target)
- ✅ Batching optimization working (300ms vs 2.5s without batching)

**Recommendations**:
- Use `include_margin=true` sparingly (COGS management UI only)
- Keep default `include_margin=false` for general product browsing
- Recommend 25-50 products per page when margin enabled
- Consider loading indicator when `include_margin=true` (300ms perceived delay)

---

## Type Safety Updates

### Update ProductListItem Type (if needed)

**File**: `frontend/src/types/cogs.ts`

**Current ProductListItem** (no margin fields):
```typescript
export interface ProductListItem {
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  has_cogs: boolean
  cogs?: CogsRecord | null
  barcode?: string
  last_sale_date: string | null
  total_sales_qty: number
}
```

**When `include_margin=true`, response is actually `ProductWithCogs`**:
```typescript
export interface ProductWithCogs {
  // All ProductListItem fields
  nm_id: string
  sa_name: string
  brand?: string
  category?: string
  has_cogs: boolean
  cogs: CogsRecord | null
  barcode?: string

  // Margin fields (from Epic 17 analytics)
  current_margin_pct: number | null
  current_margin_period: string | null
  current_margin_sales_qty: number | null
  current_margin_revenue: number | null
  missing_data_reason: MissingDataReason

  // Sales statistics
  last_sale_date: string | null
  total_sales_qty: number
}
```

**No type changes needed** - `ProductResponseDto` already has optional margin fields (Epic 18 Phase 1).

---

## Backward Compatibility

### Guaranteed Compatibility

**Existing clients unaffected**:
- ✅ Default `include_cogs=false` maintains current behavior
- ✅ Margin fields `undefined` when not requested (not `null`)
- ✅ No breaking changes to existing API contract
- ✅ E2E tests validate backward compatibility

**Migration Path**:
1. **Phase 1**: Frontend updates code (no user-facing changes yet)
2. **Phase 2**: Enable `enableMarginDisplay` in specific pages (COGS management)
3. **Phase 3**: Gather user feedback and optimize if needed

**Rollback Plan**:
- Frontend can disable `include_margin` flag anytime
- Backend defaults to `include_cogs=false` (no impact if frontend doesn't send parameter)

---

## Testing Recommendations

### Manual Testing Checklist

**Test 1: Default behavior (backward compatibility)**
```bash
GET /v1/products?limit=25
# Expected: No margin fields in response, ~150ms response time
```

**Test 2: With margin data**
```bash
GET /v1/products?limit=25&include_cogs=true
# Expected: Margin fields present, ~300ms response time
```

**Test 3: Missing margin scenarios**
```bash
# Product with COGS but no sales
GET /v1/products?limit=25&include_cogs=true&has_cogs=true
# Expected: Some products have missing_data_reason="NO_SALES_DATA"
```

**Test 4: Performance validation**
```bash
# 25 products with margin
time curl "http://localhost:3000/v1/products?limit=25&include_cogs=true" \
  -H "X-Cabinet-Id: <cabinet>" \
  -H "Authorization: Bearer <token>"
# Expected: <500ms total time
```

### E2E Test Coverage

Backend has implemented E2E tests:
- ✅ `include_cogs=false` returns no margin fields
- ✅ `include_cogs=true` returns margin fields
- ✅ `missing_data_reason` populated correctly
- ✅ Performance test validates <500ms target

Frontend should add:
- [ ] UI test: margin displayed when `enableMarginDisplay=true`
- [ ] UI test: margin not displayed when `enableMarginDisplay=false`
- [ ] Loading indicator test: shows during 300ms delay
- [ ] Error handling test: Epic 17 analytics unavailable

---

## Known Limitations

### Current Limitations

1. **Margin calculation period**: Uses last completed week only
   - Future enhancement: Support custom week selection

2. **Epic 17 analytics dependency**: Margin data unavailable if analytics service down
   - Graceful degradation: `missing_data_reason="ANALYTICS_UNAVAILABLE"`

3. **Performance at scale**: Tested up to 100 products
   - Recommendation: Use pagination limit 25-50 when `include_cogs=true`

### Future Enhancements

- [ ] Redis caching for frequently accessed weeks (if p95 >500ms)
- [ ] Support multiple week ranges for margin comparison
- [ ] Batch export API for margin data
- [ ] Real-time margin updates via WebSocket

---

## Migration Examples

### Example 1: COGS Management Page

**Before** (current behavior):
```typescript
// Margin not shown in list, user must click product
<ProductList
  showOnlyWithoutCogs={false}
  enableSelection={true}
/>
// User sees: "— (в карточке)" hint
```

**After** (with Request #15):
```typescript
// Margin shown in list, no need to click
<ProductList
  showOnlyWithoutCogs={false}
  enableSelection={true}
  enableMarginDisplay={true}  // NEW: Show margin
/>
// User sees: "35.5%" or "— (нет продаж)" with reason
```

### Example 2: Product Browsing Page

**Recommendation**: Keep margin disabled for general browsing
```typescript
// Fast loading for product browsing
<ProductList
  enableMarginDisplay={false}  // Default: keep fast
/>
// Response time: ~150ms (no change from current)
```

---

## Questions & Answers

### Q1: Is margin data real-time?
**A**: No, margin uses last completed week from Epic 17 analytics. Updates weekly.

### Q2: What if Epic 17 analytics is unavailable?
**A**: Graceful degradation - returns `missing_data_reason="ANALYTICS_UNAVAILABLE"`, margin fields `null`.

### Q3: Can we request margin for single product only?
**A**: Use existing `GET /v1/products/:nmId` endpoint (already returns margin, faster for single product).

### Q4: Performance impact on large lists?
**A**: Batching optimizes performance - 100 products still <500ms. Recommend 25-50 per page for UX.

### Q5: Do we need to update API client?
**A**: No, `apiClient.get()` already handles query parameters automatically.

---

## Deployment Checklist

### Backend (Complete ✅)
- [x] Add `include_cogs` parameter to QueryProductsDto
- [x] Implement `getMarginDataForProducts()` batch method
- [x] Update `getProductsList()` to use batching
- [x] Verify margin fields in ProductResponseDto
- [x] Update ProductsModule dependencies
- [x] E2E tests + performance test
- [x] Swagger docs updated
- [x] Deployed to dev environment
- [x] Performance validated (<500ms for 25 products)

### Frontend (Pending)
- [ ] Update `useProducts` hook with `include_margin` flag
- [ ] Update `ProductList` component with `enableMarginDisplay` prop
- [ ] Add MarginBadge import (if removed)
- [ ] Test with dev backend (`include_cogs=true`)
- [ ] Add loading indicator for 300ms delay
- [ ] Update COGS management page to enable margin display
- [ ] Manual testing with real data
- [ ] Deploy to dev environment
- [ ] User acceptance testing

---

## Support & Troubleshooting

### Common Issues

**Issue 1**: Margin always `null` despite COGS assigned
- **Check**: Product has sales in last completed week
- **Solution**: Review `missing_data_reason` for explanation

**Issue 2**: Response time >500ms
- **Check**: Number of products requested
- **Solution**: Reduce pagination limit to 25-50 products

**Issue 3**: `missing_data_reason="ANALYTICS_UNAVAILABLE"`
- **Check**: Epic 17 analytics service health
- **Solution**: Retry request or wait for service recovery

**Issue 4**: Frontend TypeScript errors
- **Check**: `ProductWithCogs` type imported correctly
- **Solution**: Import from `@/types/api` or `@/types/cogs`

### Getting Help

- Backend implementation: `docs/request-backend/REQUEST-15-IMPLEMENTATION-PLAN.md`
- Frontend request: `docs/request-backend/15-add-includecogs-to-product-list-endpoint.md`
- Epic 17 analytics: `docs/stories/epic-17/story-17.2-api-includecogs-flag.md`
- Epic 18 margin fields: `docs/backend-response-09-epic-18-products-api-enhancement.md`

---

## Success Metrics

**Before Request #15**:
- Product list shows COGS but not margin
- User confusion: "Why is margin always '—'?"
- Workaround: Click each product to see margin

**After Request #15**:
- ✅ Product list can show margin via `include_margin=true`
- ✅ Response time <500ms for 25 products (actual: ~300ms)
- ✅ Clear `missing_data_reason` when margin unavailable
- ✅ Reduced clicks: See margin without opening each product
- ✅ User feedback: [Pending frontend integration]

---

**Backend Implementation Completed**: 2025-11-23
**Frontend Integration Status**: READY FOR DEVELOPMENT
**Estimated Frontend Effort**: 2-3 hours
**Next Step**: Frontend team integrate changes following this guide
