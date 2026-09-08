# Bug Fix: Margin Not Displayed in Product List

**Date**: 2025-11-23
**Issue**: Margin column shows "—" despite COGS being assigned
**Status**: ✅ **TEMPORARY FIX APPLIED** (Backend enhancement needed for full solution)

---

## Problem Description

### User Report

User reported that product list shows COGS assigned (22,00 ₽ since 23.11.2025) but margin column displays only "—" (dash).

**Screenshot Evidence**:

```
┌─────────────┬──────────────────────────────┬───────────────┬────────┐
│ Артикул     │ Название                     │ Себестоимость │ Маржа  │
├─────────────┼──────────────────────────────┼───────────────┼────────┤
│ 147205694   │ Жидкая кожа черная для...    │ 22,00 ₽       │   —    │
│             │                              │ с 23.11.2025  │        │
└─────────────┴──────────────────────────────┴───────────────┴────────┘
```

**User's Mental Model**: "COGS is assigned, so margin should be calculated and displayed."

---

## Root Cause Analysis

### Investigation Steps

1. **Checked MarginDisplay Component** (`MarginDisplay.tsx:103-149`)
   - Component correctly displays margin when `marginPct` prop is provided
   - Shows "—" when `marginPct` is `null` or `undefined`
   - Component logic is working as designed ✅

2. **Checked ProductList Component** (`ProductList.tsx:295-297`)
   - **Found Issue**: Hardcoded `marginPct={null}` instead of using product data
   - Original code:
     ```typescript
     <MarginBadge
       marginPct={null}  // ❌ Hardcoded null
       missingDataReason={product.has_cogs ? null : 'no_cogs'}
     />
     ```

3. **Checked API Response Type** (`types/cogs.ts:64-74`)
   - **Design Decision**: `ProductListItem` type intentionally excludes margin fields
   - Comment in type definition:
     ```typescript
     /**
      * Product list item (margin calculation disabled for performance)
      */
     export interface ProductListItem {
       nm_id: string
       sa_name: string
       // ... other fields ...
       // NO margin fields: current_margin_pct, current_margin_period, etc.
     }
     ```

4. **Checked Backend API** (`src/products/products.service.ts`)
   - `GET /v1/products` returns `ProductListItem[]` without margin data
   - Margin calculation only happens in single product endpoint: `GET /v1/products/:nmId`
   - **Reason**: Performance optimization (margin calculation is expensive)

---

## Why This Design Exists

### Performance Trade-off

**Margin Calculation Cost** (from Epic 18 implementation):

- Each product requires Epic 17 analytics query (100ms per product)
- Product list with 25 items = 2.5 seconds if calculated sequentially
- Batching optimization could reduce to ~500ms, but still significant overhead

**Design Decision** (Epic 18 Phase 1):

- Product list: Fast loading, no margin data
- Single product view: Full details including margin calculation

### Reference Documentation

From `frontend/src/types/cogs.ts:62-74`:

```typescript
/**
 * Product list item (margin calculation disabled for performance)
 */
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

From `frontend/src/types/cogs.ts:36-59`:

```typescript
/**
 * Product with COGS and margin data
 * Epic 18 Phase 1: Enhanced ProductResponseDto with 9 new fields
 */
export interface ProductWithCogs {
  // ... all ProductListItem fields ...

  // Margin calculation (from Epic 17 analytics)
  current_margin_pct: number | null       // ← Only in single product view
  current_margin_period: string | null
  current_margin_sales_qty: number | null
  current_margin_revenue: number | null
  missing_data_reason: MissingDataReason
  // ...
}
```

---

## Solutions Implemented

### Temporary Fix (Immediate)

**File**: `frontend/src/components/custom/ProductList.tsx:294-307`

**Change**: Updated UI to show helpful hint instead of confusing dash

**Before**:

```typescript
<TableCell>
  <MarginBadge
    marginPct={null}  // Always null
    missingDataReason={product.has_cogs ? null : 'no_cogs'}
  />
</TableCell>
```

**After**:

```typescript
<TableCell>
  {/* Note: Margin calculation disabled for performance in list view
      See: frontend/src/types/cogs.ts:62-74 (ProductListItem type)
      Backend Request #15: Add includeCogs parameter to enable margin in list
      For now, margin only shown in single product detail view */}
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-400">—</span>
    {product.has_cogs && (
      <span className="text-xs text-gray-400" title="Маржа рассчитывается в карточке товара">
        (в карточке)
      </span>
    )}
  </div>
</TableCell>
```

**Result**:

```
┌─────────────┬──────────────────────────────┬───────────────┬─────────────────┐
│ Артикул     │ Название                     │ Себестоимость │ Маржа           │
├─────────────┼──────────────────────────────┼───────────────┼─────────────────┤
│ 147205694   │ Жидкая кожа черная для...    │ 22,00 ₽       │ — (в карточке)  │
│             │                              │ с 23.11.2025  │                 │
└─────────────┴──────────────────────────────┴───────────────┬─────────────────┘
```

**Benefits**:

- ✅ Less confusing UX (explains why margin not shown)
- ✅ Hints where user can see margin (single product view)
- ✅ Tooltip provides additional context on hover
- ✅ No performance impact

**Limitations**:

- ⚠️ Still doesn't show margin in list view
- ⚠️ Requires user to navigate to single product detail to see margin

---

## Long-Term Solution (Backend Enhancement)

### Backend Request Created

**Document**: `docs/request-backend/15-add-includecogs-to-product-list-endpoint.md`

**Proposal**: Add optional `includeCogs` parameter to product list endpoint, following pattern from Epic 17 Story 17.2.

**API Enhancement**:

```typescript
GET /v1/products?include_cogs=false  // Default: fast, no margin (current behavior)
GET /v1/products?include_cogs=true   // New: slower, with margin data
```

**Response Type**:

- `include_cogs=false` → `ProductListItem[]` (current)
- `include_cogs=true` → `ProductWithCogs[]` (with margin fields)

**Performance Strategy**:

1. **Option 1**: Accept 2-3s response time for COGS management UI (simple implementation)
2. **Option 2**: Batch Epic 17 analytics query for all products (500ms target)
3. **Option 3**: Enforce smaller pagination limit when `include_cogs=true` (max 10 products)

**Estimated Effort**:

- Backend: 4-6 hours
- Frontend: 2-3 hours (separate story)
- Total: 6-9 hours

**Acceptance Criteria**:

- [ ] `include_cogs=true` returns margin data for all products
- [ ] Backward compatible (default behavior unchanged)
- [ ] Response time ≤3s for 25 products (or ≤500ms with batching)
- [ ] E2E tests validate margin data presence

---

## User Workaround (Current)

Until backend enhancement is implemented, users can see margin in single product detail view:

1. **Navigate to COGS management page** (`/cogs`)
2. **Search for product** (e.g., article 147205694)
3. **Select product** - Opens single product detail
4. **Margin displayed** in detail panel with:
   - Current margin percentage (e.g., 35.5%)
   - Margin calculation period (e.g., "2025-W46")
   - Sales quantity for period
   - Revenue for period
   - Missing data reason (if applicable)

**API Used**: `GET /v1/products/:nmId` (returns `ProductWithCogs`)

---

## Related Issues

### Similar Pattern in Analytics Endpoints

Epic 17 Story 17.2 implemented the same pattern for analytics endpoints:

- `GET /v1/analytics/weekly/by-sku?include_cogs=false` → Fast, no COGS data
- `GET /v1/analytics/weekly/by-sku?include_cogs=true` → Slower, with COGS/margin data

**Implementation Reference**:

- File: `src/analytics/weekly-analytics.service.ts:357-399`
- Pattern: Conditional query based on parameter
- Performance: Single additional query + HashMap merge (O(1) lookup)

**Success**: Deployed and functional, users can opt-in to margin data when needed.

---

## Testing

### Manual Verification Steps

1. ✅ **Verify temporary fix applied**:

   ```bash
   cd frontend
   grep -A 5 "в карточке" src/components/custom/ProductList.tsx
   ```

   Should show hint text in Russian.

2. ✅ **Verify lint passes**:

   ```bash
   npm run lint
   ```

   No errors related to `MarginBadge` import.

3. ✅ **Visual test**:
   - Navigate to `/cogs` page
   - Search for product with COGS assigned
   - Verify margin column shows "— (в карточке)" with tooltip

4. ⏳ **Backend enhancement** (pending):
   - Wait for Request #15 implementation
   - Test `include_cogs=true` parameter
   - Verify margin data displayed in list view

---

## Documentation Updates

### Files Created

- ✅ `frontend/docs/BUG-FIX-MARGIN-NOT-DISPLAYED.md` (this file)
- ✅ `docs/request-backend/15-add-includecogs-to-product-list-endpoint.md`

### Files Modified

- ✅ `frontend/src/components/custom/ProductList.tsx` (lines 294-307)
  - Removed unused `MarginBadge` import
  - Updated margin column to show hint text

### No Changes Needed

- ✅ `frontend/src/components/custom/MarginDisplay.tsx` (component works correctly)
- ✅ `frontend/src/hooks/useProducts.ts` (hook returns correct data type)
- ✅ `frontend/src/types/cogs.ts` (types correctly model API contracts)

---

## References

### Type Definitions

- `ProductListItem`: `frontend/src/types/cogs.ts:64-74`
- `ProductWithCogs`: `frontend/src/types/cogs.ts:36-59`

### Backend Implementation

- Epic 18 Phase 1: `docs/backend-response-09-epic-18-products-api-enhancement.md`
- Single product endpoint: `src/products/products.service.ts:210-259` (has margin)
- List endpoint: `src/products/products.service.ts:83-182` (no margin)

### Related Stories

- Epic 17 Story 17.2: `includeCogs` pattern for analytics
- Epic 18 Phase 1: Margin calculation integration

---

## Conclusion

**Current State**: ✅ **Temporary fix applied**

- UI now shows helpful hint: "— (в карточке)"
- User understands margin visible in single product view
- No confusing empty dash without explanation

**Next Steps**: 📋 **Backend Request #15 pending review**

- Adds `includeCogs` parameter to product list endpoint
- Enables margin display in list view (opt-in for performance)
- Estimated 6-9 hours implementation effort

**Success Criteria Met**:

- ✅ User confusion reduced (helpful hint added)
- ✅ Root cause documented (performance design decision)
- ✅ Long-term solution proposed (backend enhancement request)
- ✅ Workaround documented (single product detail view)

---

**Created**: 2025-11-23
**Status**: Temporary fix deployed, backend enhancement pending
