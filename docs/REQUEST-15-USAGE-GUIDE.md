# Request #15: Usage Guide - Show Margin in Product List

**Status**: ✅ **READY TO USE** (После деплоя backend Request #15)
**Frontend Changes**: COMPLETE
**Backend Requirement**: Request #15 must be deployed first

---

## Quick Start

### Enable Margin Display in Product List

```typescript
import { ProductList } from '@/components/custom/ProductList'

// Enable margin display (requires backend Request #15 deployed)
<ProductList
  showOnlyWithoutCogs={false}
  enableSelection={true}
  enableMarginDisplay={true}  // ← Add this prop
/>
```

**Result**:
- Products with sales: `35.5%` (green for positive, red for negative)
- Products without sales: `— (нет продаж)`
- Products without COGS: `— (нет COGS)`
- Backend unavailable: `— (недоступно)`

---

## Usage Examples

### Example 1: COGS Management Page (Recommended)

**File**: `src/app/(dashboard)/cogs/page.tsx`

```typescript
export default function CogsPage() {
  return (
    <div>
      <h1>Управление себестоимостью</h1>

      {/* Show margin in list for COGS management */}
      <ProductList
        showOnlyWithoutCogs={false}
        enableSelection={true}
        enableMarginDisplay={true}  // ← Users can see margin immediately
      />
    </div>
  )
}
```

**User Experience**:
- ✅ See margin without clicking each product
- ✅ Identify products with missing COGS quickly
- ✅ Response time: ~300ms (acceptable for management UI)

### Example 2: Product Browsing (Default - Fast)

**File**: `src/app/(dashboard)/products/page.tsx`

```typescript
export default function ProductsPage() {
  return (
    <div>
      <h1>Список товаров</h1>

      {/* Fast loading, no margin (default behavior) */}
      <ProductList
        enableMarginDisplay={false}  // ← Default: keep fast
      />
    </div>
  )
}
```

**User Experience**:
- ✅ Fast loading (~150ms)
- ❌ Margin shown as "— (в карточке)" hint
- ℹ️ Users can click product to see margin in detail view

### Example 3: Toggle Margin Display

**Dynamic enable/disable based on user preference**:

```typescript
'use client'

import { useState } from 'react'
import { ProductList } from '@/components/custom/ProductList'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  const [showMargin, setShowMargin] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Список товаров</h1>

        {/* Toggle button */}
        <Button
          variant={showMargin ? 'default' : 'outline'}
          onClick={() => setShowMargin(!showMargin)}
        >
          {showMargin ? 'Скрыть маржу' : 'Показать маржу'}
        </Button>
      </div>

      {/* Product list with dynamic margin display */}
      <ProductList
        enableMarginDisplay={showMargin}
      />

      {showMargin && (
        <p className="text-sm text-gray-500 mt-2">
          ℹ️ Отображение маржи увеличивает время загрузки (~300ms)
        </p>
      )}
    </div>
  )
}
```

---

## API Reference

### ProductList Props

```typescript
interface ProductListProps {
  onProductSelect?: (product: ProductListItem) => void
  selectedProductId?: string
  showOnlyWithoutCogs?: boolean
  enableSelection?: boolean
  enableMarginDisplay?: boolean  // NEW: Request #15
}
```

**New Prop: `enableMarginDisplay`**
- **Type**: `boolean`
- **Default**: `false` (backward compatible)
- **Purpose**: Request margin data from backend and display in list
- **Performance**: Adds ~150ms to response time (300ms total for 25 products)
- **Backend Requirement**: Request #15 must be deployed

### useProducts Hook

```typescript
interface ProductFilters {
  has_cogs?: boolean
  search?: string
  cursor?: string
  limit?: number
  include_margin?: boolean  // NEW: Request #15
}

// Usage
const { data, isLoading } = useProducts({
  search: 'Nike',
  has_cogs: true,
  limit: 25,
  include_margin: true,  // ← Request margin data
})
```

**New Filter: `include_margin`**
- **Type**: `boolean`
- **Default**: `false`
- **Backend Parameter**: Sends `include_cogs=true` to API
- **Response**: Returns `ProductWithCogs[]` instead of `ProductListItem[]`

---

## Response Format

### Without Margin (`enableMarginDisplay=false`)

**Response Type**: `ProductListItem[]`

```json
{
  "nm_id": "147205694",
  "sa_name": "Жидкая кожа черная",
  "has_cogs": true,
  "cogs": { "unit_cost_rub": "22.00" }
  // NO margin fields
}
```

**Display**: `— (в карточке)` hint

### With Margin (`enableMarginDisplay=true`)

**Response Type**: `ProductWithCogs[]`

```json
{
  "nm_id": "147205694",
  "sa_name": "Жидкая кожа черная",
  "has_cogs": true,
  "cogs": { "unit_cost_rub": "22.00" },

  // NEW: Margin fields
  "current_margin_pct": 35.5,
  "current_margin_period": "2025-W46",
  "current_margin_sales_qty": 50,
  "current_margin_revenue": 125000.50,
  "missing_data_reason": null
}
```

**Display**: `35.5%` (green color for positive margin)

### Missing Margin Scenarios

**No sales**:
```json
{
  "current_margin_pct": null,
  "missing_data_reason": "NO_SALES_DATA"
}
```
**Display**: `— (нет продаж)`

**No COGS**:
```json
{
  "current_margin_pct": null,
  "missing_data_reason": "COGS_NOT_ASSIGNED"
}
```
**Display**: `— (нет COGS)`

**Backend unavailable**:
```json
{
  "current_margin_pct": null,
  "missing_data_reason": "ANALYTICS_UNAVAILABLE"
}
```
**Display**: `— (недоступно)`

---

## Performance Guidelines

### Response Time Comparison

| Scenario | Products | `enableMarginDisplay` | Response Time |
|----------|----------|----------------------|---------------|
| Fast browsing | 25 | `false` | ~150ms |
| With margin | 25 | `true` | ~300ms |
| Fast browsing | 50 | `false` | ~200ms |
| With margin | 50 | `true` | ~500ms |

### Recommendations

1. **Use margin display sparingly**
   - COGS management UI: ✅ Yes
   - Product browsing: ❌ No (use default)
   - Analytics pages: ✅ Yes (if needed)

2. **Pagination limits**
   - Without margin: 50-100 products per page ✅
   - With margin: 25-50 products per page ✅

3. **Loading indicators**
   - Consider showing loading spinner when `enableMarginDisplay=true`
   - ~300ms delay is perceptible to users

4. **Cache optimization**
   - Margin data cached for 60 seconds (vs 30s without)
   - Avoid frequent refetches when margin enabled

---

## Troubleshooting

### Issue 1: Margin Always Shows "—"

**Symptoms**: All products show `— (нет продаж)` despite having sales

**Possible Causes**:
1. Backend Request #15 not deployed
2. Epic 17 analytics service unavailable
3. Products have no sales in last completed week

**Solution**:
```bash
# Check backend deployed
curl "http://localhost:3000/v1/products?limit=1&include_cogs=true" \
  -H "X-Cabinet-Id: <cabinet>" \
  -H "Authorization: Bearer <token>"

# Should return current_margin_pct field
```

### Issue 2: Response Time >500ms

**Symptoms**: Product list loads slowly when margin enabled

**Possible Causes**:
1. Too many products requested (>50)
2. Epic 17 analytics slow
3. Network latency

**Solution**:
- Reduce pagination limit to 25 products
- Check Epic 17 analytics performance
- Add loading indicator to improve perceived performance

### Issue 3: TypeScript Errors

**Symptoms**: `Property 'current_margin_pct' does not exist`

**Cause**: Type mismatch - expecting `ProductListItem` but receiving `ProductWithCogs`

**Solution**:
```typescript
// Use type guard
if ('current_margin_pct' in product) {
  // product is ProductWithCogs
  console.log(product.current_margin_pct)
}
```

---

## Migration Checklist

### Before Deployment

- [ ] Backend Request #15 deployed to dev/staging
- [ ] Test endpoint: `GET /v1/products?include_cogs=true`
- [ ] Verify margin data in response
- [ ] Check response time <500ms for 25 products

### Frontend Deployment

- [ ] Code changes already merged (useProducts + ProductList)
- [ ] No breaking changes (backward compatible)
- [ ] Default behavior unchanged (`enableMarginDisplay=false`)

### After Deployment

- [ ] Enable `enableMarginDisplay=true` on COGS management page
- [ ] Test with real data
- [ ] Gather user feedback
- [ ] Monitor performance metrics
- [ ] Consider enabling on other pages if feedback positive

---

## Code Changes Summary

### Modified Files

1. ✅ **`src/hooks/useProducts.ts`**
   - Added `include_margin` to `ProductFilters`
   - Sends `include_cogs=true` to backend when requested
   - Longer cache time (60s) when margin included

2. ✅ **`src/components/custom/ProductList.tsx`**
   - Added `enableMarginDisplay` prop
   - Passes `include_margin` to `useProducts` hook
   - Displays margin with color coding (green/red/gray)
   - Shows `missing_data_reason` explanation

### New Documentation

3. ✅ **`frontend/docs/backend-response-15-includecogs-implementation.md`**
   - Complete backend API documentation
   - Integration guide
   - Performance characteristics

4. ✅ **`frontend/docs/REQUEST-15-USAGE-GUIDE.md`** (this file)
   - Usage examples
   - API reference
   - Troubleshooting

---

## Next Steps

1. **Wait for Backend Deployment**
   - Backend team completes Request #15 implementation
   - Verify endpoint works: `GET /v1/products?include_cogs=true`

2. **Enable on COGS Page**
   - Add `enableMarginDisplay={true}` to COGS management page
   - Test with real data

3. **User Feedback**
   - Gather feedback on margin display UX
   - Monitor performance metrics
   - Iterate based on feedback

4. **Optional Enhancements**
   - Add loading indicator during 300ms delay
   - Consider toggle button for user preference
   - Extend to other pages if needed

---

**Created**: 2025-11-23
**Status**: ✅ READY TO USE (после деплоя backend)
**Estimated Frontend Effort**: 0 hours (уже готово!)
