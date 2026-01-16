# Request #48: Storage Analytics Multi-Brand Filter Bug

**Date**: 2025-12-06
**Priority**: High
**Status**: ✅ Resolved
**Epic**: 24 - Paid Storage Analytics
**Story**: 24.9-FE - Multi-select Brand & Warehouse Filters

## Problem

When selecting multiple brands in the Storage Analytics filters, the API returns `has_data: false` and no results are shown. Single brand selection works correctly.

## Current Behavior

1. User selects single brand "Space Chemical" → **Works** (shows 9 products)
2. User selects two brands "Protape" + "Space Chemical" → **Fails** (shows "Нет данных")

## Frontend Request

Frontend sends comma-separated brand values as documented in types:

```
GET /v1/analytics/storage/by-sku?weekStart=2025-W45&weekEnd=2025-W48&brand=Protape,Space Chemical&limit=20
```

The `StorageBySkuParams` type specifies:
```typescript
/** Filter by brand (comma-separated for multiple) */
brand?: string
```

## Expected Backend Behavior

Backend should parse comma-separated brand values and use OR logic:

```sql
WHERE brand IN ('Protape', 'Space Chemical')
```

## Current Backend Behavior (Bug)

Backend appears to be matching the literal string "Protape,Space Chemical" instead of splitting and using OR logic.

## Affected Endpoints

- `GET /v1/analytics/storage/by-sku` - `brand` parameter
- `GET /v1/analytics/storage/by-sku` - `warehouse` parameter (likely same issue)

## Suggested Fix

In the backend controller/service, split comma-separated values:

```typescript
// Before
where: { brand: params.brand }

// After
where: {
  brand: params.brand?.includes(',')
    ? In(params.brand.split(',').map(b => b.trim()))
    : params.brand
}
```

## Screenshots

See attached screenshots showing:
1. Single brand selection working
2. Multi-brand selection failing

## Files Involved

**Frontend** (working correctly):
- `src/app/(dashboard)/analytics/storage/page.tsx` - lines 75-76
- `src/components/custom/MultiSelectDropdown.tsx`
- `src/lib/api/storage-analytics.ts`

**Backend** (fixed):
- `src/analytics/services/storage-analytics.service.ts`
- `src/analytics/dto/query/storage-by-sku-query.dto.ts`

## Solution Implemented

### Changes Made

1. **Added `parseMultiValueFilter()` helper method** in `StorageAnalyticsService`:
   - Splits comma-separated values: `"Protape,Space Chemical"` → `["Protape", "Space Chemical"]`
   - Trims whitespace from each value
   - Returns `null` for empty/undefined values

2. **Refactored `getStorageBySku()` to use dynamic WHERE clause**:
   - Single value: `WHERE brand = 'Protape'`
   - Multi-value: `WHERE brand IN ('Protape', 'Space Chemical')`
   - Uses `Prisma.join()` for parameterized IN clause (SQL injection safe)

3. **Updated DTO documentation** with comma-separated examples

### Code Example

```typescript
// Before (literal match - BUG)
WHERE brand = ${brand}  // brand = "Protape,Space Chemical" - no match!

// After (IN clause)
const brandValues = this.parseMultiValueFilter(brand);
if (brandValues.length === 1) {
  conditions.push(Prisma.sql`brand = ${brandValues[0]}`);
} else {
  conditions.push(Prisma.sql`brand IN (${Prisma.join(brandValues)})`);
}
```

### Affected Filters
- ✅ `brand` - fixed with IN clause
- ✅ `warehouse` - fixed with IN clause
