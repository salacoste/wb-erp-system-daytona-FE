# Request #15: Add includeCogs Parameter to Product List Endpoint

**Date**: 2025-11-23
**Priority**: 🟡 **P2 - ENHANCEMENT** (improves UX, not blocking)
**Status**: 📝 **PENDING REVIEW**
**Frontend Issue**: Margin data not shown in product list despite COGS being assigned

---

## Problem Statement

**Current State**:
- Product list endpoint `GET /v1/products` returns `ProductListItem[]` without margin data
- Backend response includes: `nm_id`, `sa_name`, `brand`, `has_cogs`, `cogs`, `barcode`, `last_sale_date`, `total_sales_qty`
- **Missing**: `current_margin_pct`, `current_margin_period`, `current_margin_sales_qty`, `current_margin_revenue`, `missing_data_reason`

**User Experience Issue**:
```
Product List UI:
┌─────────────┬──────────────────┬───────────────┬────────┐
│ Артикул     │ Название         │ Себестоимость │ Маржа  │
├─────────────┼──────────────────┼───────────────┼────────┤
│ 147205694   │ Жидкая кожа...   │ 22,00 ₽       │   —    │  ← Confusing!
│             │                  │ с 23.11.2025  │        │
└─────────────┴──────────────────┴───────────────┴────────┘

User's mental model: "COGS is assigned, why no margin?"
```

**Why This Happens**:
- `ProductListItem` type intentionally excludes margin fields for performance (see `frontend/src/types/cogs.ts:62-74`)
- Comment: "margin calculation disabled for performance"
- Frontend shows "—" because `ProductList.tsx:296` receives `ProductListItem` without margin data

---

## Proposed Solution

Add **optional** `includeCogs` query parameter to product list endpoint, following the pattern from Epic 17 analytics endpoints (Story 17.2).

### API Enhancement

**Endpoint**: `GET /v1/products`

**New Query Parameter**:
```typescript
@ApiPropertyOptional({
  description: 'Include margin calculation in response (from Epic 17 analytics)',
  example: true,
  default: false,
})
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
@IsBoolean()
@IsOptional()
include_cogs?: boolean = false;
```

**Behavior**:
1. **`include_cogs=false`** (default) - Current behavior, no change
   - Response: `ProductListItem[]` (without margin fields)
   - Performance: Fast (no margin calculation overhead)
   - Backward compatible

2. **`include_cogs=true`** - New behavior
   - Response: `ProductWithCogs[]` (with margin fields)
   - Performance: +50-100ms per product (Epic 17 analytics query)
   - Use case: COGS management UI where margin visibility is critical

### Example Requests

**Default (fast, no margin)**:
```bash
GET /v1/products?has_cogs=true&limit=25
# Response: ProductListItem[] (current behavior)
```

**With margin data**:
```bash
GET /v1/products?has_cogs=true&include_cogs=true&limit=25
# Response: ProductWithCogs[] (includes current_margin_pct, etc.)
```

---

## Implementation Pattern (Reference: Story 17.2)

### Step 1: Update QueryProductsDto

**File**: `src/products/dto/query-products.dto.ts`

```typescript
@ApiPropertyOptional({
  description: 'Include COGS and margin data in response (uses Epic 17 analytics)',
  example: false,
  default: false,
})
@Transform(({ value }) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
})
@IsBoolean()
@IsOptional()
include_cogs?: boolean = false;
```

### Step 2: Update ProductsService

**File**: `src/products/products.service.ts`

**Modify `findAll()` method** (lines 83-182):

```typescript
async findAll(cabinetId: string, query: QueryProductsDto) {
  const { include_cogs = false, ...otherFilters } = query;

  // Existing logic: fetch products from WB API + COGS status
  const products = await this.fetchProductsWithCogs(cabinetId, otherFilters);

  // NEW: If include_cogs=true, enrich with margin data
  if (include_cogs === true) {
    // Use existing getMarginForProduct() method (lines 322-413)
    // Similar to how findOne() works (lines 210-259)
    const enrichedProducts = await Promise.all(
      products.map(async (product) => {
        const marginData = await this.getMarginForProduct(product.nm_id, cabinetId);

        return {
          ...product,
          current_margin_pct: marginData.margin_pct,
          current_margin_period: marginData.period,
          current_margin_sales_qty: marginData.sales_qty,
          current_margin_revenue: marginData.revenue,
          missing_data_reason: marginData.missing_reason,
        };
      })
    );

    return enrichedProducts; // ProductWithCogs[]
  }

  // Default: return products without margin data (backward compatible)
  return products; // ProductListItem[]
}
```

**Performance Note**:
- Reuses existing `getMarginForProduct()` method from Epic 18 Phase 1
- Already has Epic 17 analytics integration + fallback strategy
- Batching possible if performance becomes issue (use Promise.all)

### Step 3: Update ProductListResponseDto

**File**: `src/products/dto/product-list-response.dto.ts`

**Current**:
```typescript
@ApiProperty({ type: [ProductResponseDto] })
products: ProductResponseDto[];
```

**New** (conditional type based on `include_cogs`):
```typescript
// Keep as-is - ProductResponseDto already has optional margin fields (Epic 18)
// When include_cogs=false, margin fields are undefined/null
// When include_cogs=true, margin fields are populated
```

**No DTO change needed** - `ProductResponseDto` already supports optional margin fields from Epic 18 Phase 1.

---

## Performance Considerations

### Baseline (Current)
- `GET /v1/products?limit=25` → ~150ms (WB API + COGS lookup)

### With `include_cogs=true`
- `GET /v1/products?include_cogs=true&limit=25` → ~2-3 seconds (25 products × 100ms margin lookup)

### Optimization Strategies

**Option 1: Accept slower response** (2-3s is acceptable for COGS management UI)
- Pros: Simple implementation, reuses existing code
- Cons: Not suitable for high-frequency calls

**Option 2: Batch margin lookup** (recommended if >10 products)
```typescript
// Instead of 25 sequential calls to getMarginForProduct()
// Make single Epic 17 analytics query with all nm_ids
const lastWeek = this.isoWeekService.getIsoWeek(lastWeekDate);
const analyticsData = await this.weeklyAnalyticsService.getWeeklyBySku(
  cabinetId,
  lastWeek,
  { includeCogs: true } // Returns ALL SKUs for the week
);

// Build HashMap: nm_id → margin_data
const marginMap = new Map(analyticsData.data.map(item => [item.nm_id, item]));

// O(1) lookup for each product
products.forEach(product => {
  const marginData = marginMap.get(product.nm_id);
  // ... populate margin fields
});
```

**Expected Performance**: ~200-300ms (single analytics query + O(1) lookup)

**Option 3: Conditional pagination limit**
- When `include_cogs=true`, enforce smaller `limit` (e.g., max 10 products)
- Prevents accidental 100-product queries with margin enrichment

---

## Acceptance Criteria

### Functional Requirements
- [ ] **AC1**: `GET /v1/products?include_cogs=true` returns margin data for all products
- [ ] **AC2**: `GET /v1/products?include_cogs=false` maintains current behavior (backward compatible)
- [ ] **AC3**: Default behavior (parameter omitted) remains unchanged
- [ ] **AC4**: Margin fields populated using Epic 17 analytics (reuse `getMarginForProduct()`)
- [ ] **AC5**: `missing_data_reason` field correctly indicates why margin is missing

### Non-Functional Requirements
- [ ] **AC6**: Response time ≤3s for 25 products (or ≤500ms with batching optimization)
- [ ] **AC7**: No N+1 query issues (use batched Epic 17 analytics query)
- [ ] **AC8**: Swagger docs updated with `include_cogs` parameter documentation

### Testing Requirements
- [ ] **AC9**: E2E test for `include_cogs=true` with margin data validation
- [ ] **AC10**: E2E test for `include_cogs=false` (backward compatibility)
- [ ] **AC11**: Performance test with 25 products (measure response time)

---

## Alternative Solutions Considered

### Alternative 1: Always Include Margin (No Parameter)
**Rejected** - Breaks performance for existing clients who don't need margin data.

### Alternative 2: Separate Endpoint (`GET /v1/products/with-margins`)
**Rejected** - Increases API surface area, less flexible than query parameter.

### Alternative 3: Client-Side Batch Fetch
**Current Workaround**:
```typescript
// Frontend makes additional request for each selected product
const { data: product } = useProductDetail(selectedNmId);
// product.current_margin_pct now available
```
**Problem**: N+1 requests if user selects multiple products.

---

## Migration Strategy

### Phase 1: Backend Implementation (This Request)
1. Add `include_cogs` parameter to `QueryProductsDto`
2. Implement conditional margin enrichment in `ProductsService.findAll()`
3. Add E2E tests
4. Deploy to dev environment

### Phase 2: Frontend Adoption (Separate Story)
1. Update `useProducts` hook to accept `includeMargin` option
2. Update `ProductList` component to use margin data when available
3. Add loading indicator for slower response with margin data
4. Update UI to show margin when present

### Phase 3: Performance Optimization (If Needed)
1. Implement batched Epic 17 analytics query (Option 2 above)
2. Add Redis caching for frequently accessed weeks
3. Consider pagination limit enforcement when `include_cogs=true`

---

## Frontend Changes (After Backend Implementation)

### Update useProducts Hook

**File**: `frontend/src/hooks/useProducts.ts`

```typescript
export interface ProductFilters {
  has_cogs?: boolean
  search?: string
  cursor?: string
  limit?: number
  include_margin?: boolean  // NEW: Frontend flag
}

export function useProducts(filters: ProductFilters = {}) {
  const { include_margin = false, ...otherFilters } = filters;

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<ProductListResponse> => {
      const params = new URLSearchParams();

      // ... existing parameter logic ...

      // NEW: Send include_cogs to backend if include_margin=true
      if (include_margin) {
        params.append('include_cogs', 'true');
      }

      const response = await apiClient.get<ProductListResponse>(
        `/v1/products?${params.toString()}`
      );

      return response;
    },
    // Longer stale time when margin data included (more expensive query)
    staleTime: include_margin ? 60000 : 30000,
  });
}
```

### Update ProductList Component

**File**: `frontend/src/components/custom/ProductList.tsx`

```typescript
export function ProductList({ enableMarginDisplay = false, ...props }) {
  const { data, isLoading } = useProducts({
    // ... existing filters ...
    include_margin: enableMarginDisplay,  // NEW: Request margin data when needed
  });

  return (
    <Table>
      {/* ... */}
      <TableCell>
        {enableMarginDisplay && product.current_margin_pct !== undefined ? (
          <MarginBadge
            marginPct={product.current_margin_pct}
            missingDataReason={product.missing_data_reason}
          />
        ) : (
          <Tooltip content="Маржа рассчитывается только при загрузке с COGS">
            <span className="text-gray-400">—</span>
          </Tooltip>
        )}
      </TableCell>
    </Table>
  );
}
```

---

## References

### Related Implementation
- **Story 17.2**: `includeCogs` parameter for analytics endpoints (pattern to follow)
  - File: `docs/stories/epic-17/story-17.2-api-includecogs-flag.md`
  - Implementation: `src/analytics/weekly-analytics.service.ts` (lines 357-399, 516-570, 718-780)

### Related Types
- **ProductListItem**: `frontend/src/types/cogs.ts:64-74` (current response type)
- **ProductWithCogs**: `frontend/src/types/cogs.ts:36-59` (target response type when `include_cogs=true`)

### Related Services
- **Epic 18 Phase 1**: `getMarginForProduct()` method already exists
  - File: `src/products/products.service.ts:322-413`
  - Integration: Epic 17 analytics + fallback strategy + sales stats

---

## Questions for Backend Team

1. **Performance Target**: Is 2-3s acceptable for 25 products with margin data? Or should we implement batching optimization (Option 2) from the start?

2. **Pagination Limit**: Should we enforce smaller `limit` when `include_cogs=true` (e.g., max 10 instead of 1000)?

3. **Caching Strategy**: Should we add Redis caching for margin data? (Same TTL as Epic 17 analytics)

4. **Breaking Change Risk**: Can we guarantee `ProductResponseDto` backward compatibility? (Margin fields are optional, so should be safe)

---

## Estimated Effort

**Backend Implementation**: 4-6 hours
- Add parameter: 30 min
- Implement conditional enrichment: 2-3 hours
- E2E tests: 1-2 hours
- Performance testing: 1 hour

**Frontend Adoption**: 2-3 hours (separate story)
- Update hook: 30 min
- Update component: 1 hour
- Testing: 1 hour

**Total**: 6-9 hours (can be split across 2 stories)

---

## Success Metrics

**Before** (Current State):
- Users see COGS but not margin in product list
- Confusion: "Why is margin always '—'?"

**After** (With Implementation):
- Users can request margin data via `include_margin` flag
- Margin displayed for products with COGS + recent sales
- Clear `missing_data_reason` when margin unavailable
- Performance acceptable for COGS management workflows

---

**Created**: 2025-11-23
**Author**: Frontend Team
**Awaiting**: Backend Team Review
