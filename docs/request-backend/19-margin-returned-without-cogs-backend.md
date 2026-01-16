# Request #19: Backend Response - Margin Returned Without COGS

**Date**: 2025-01-27  
**Status**: ✅ **RESOLVED** - Bug Fixed  
**Related**: [Request #19 - Frontend Question](./19-margin-returned-without-cogs.md)

---

## Executive Summary

**Answer**: This was a **BUG** in the backend logic. Backend was returning `current_margin_pct: 100.0` for products without COGS because margin calculation service stores records in `weekly_margin_fact` even when COGS is missing (margin = 100% when cogs = 0).

**Root Cause**: `ProductsService.getMarginDataForProducts()` did not validate COGS existence before returning margin data from Epic 17 analytics. When `weekly_margin_fact` contained records with `cogs_rub = 0.0` and `margin_percent = 100.0`, these were returned without checking if COGS actually exists.

**Fix Applied**: Added COGS validation before returning margin data. If `margin_pct` exists but COGS is missing, backend now sets `margin_pct = null` and `missing_reason = 'COGS_NOT_ASSIGNED'`.

---

## Detailed Response to Frontend Questions

### Q1: Is This Expected Behavior?

**Answer**: ❌ **NO** - This was a bug. `current_margin_pct` should **never** be non-null when `has_cogs: false`.

**Expected Behavior**: If `has_cogs: false` or `cogs: null`, then:
- `current_margin_pct` should be `null`
- `missing_data_reason` should be `"COGS_NOT_ASSIGNED"`

---

### Q2: What Could Cause This Scenario?

**Root Cause Identified**:

1. **Margin Calculation Service Behavior**:
   - `MarginCalculationService` creates records in `weekly_margin_fact` for **all products with sales**, even when COGS is not assigned
   - When COGS is missing, it stores `cogs_rub = 0.0` and calculates `margin_percent = 100.0` (because `profit = revenue - 0 = revenue`)
   - This is intentional for analytics purposes (to track products without COGS)

2. **ProductsService Bug**:
   - `getMarginDataForProducts()` retrieved margin data from Epic 17 analytics (which reads from `weekly_margin_fact`)
   - When `margin_pct` was present (e.g., 100.0), code returned it **without validating COGS existence**
   - Code only checked COGS when `margin_pct === null`, but not when `margin_pct` had a value

**Database Evidence** (Product `412096139`):
```sql
-- No COGS records
SELECT * FROM cogs WHERE nm_id = '412096139';
-- Result: 0 rows

-- But margin records exist with cogs_rub = 0.0
SELECT week, cogs_rub, margin_percent, missing_cogs_units 
FROM weekly_margin_fact 
WHERE nm_id = '412096139';
-- Result:
-- week      | cogs_rub | margin_percent | missing_cogs_units
-- 2025-W46  | 0.00     | 100.00        | 44
-- 2025-W45  | 0.00     | 100.00        | 20
-- 2025-W44  | 0.00     | 100.00        | 22
```

**Why Margin = 100% When COGS = 0**:
- Formula: `margin_percent = (gross_profit / revenue) × 100%`
- When `cogs_rub = 0.0`: `gross_profit = revenue - 0 = revenue`
- Therefore: `margin_percent = (revenue / revenue) × 100% = 100%`

This is mathematically correct but **logically invalid** - margin cannot be calculated without COGS.

---

### Q3: How Should Frontend Handle This?

**Answer**: Frontend should **NOT need defensive checks** after this fix. Backend now guarantees:
- `current_margin_pct` is always `null` when `has_cogs: false`
- `missing_data_reason` is always set when `current_margin_pct: null` and COGS is missing

**Frontend Can Remove Defensive Check**:
```typescript
// ❌ OLD (defensive check - no longer needed)
{product.has_cogs && product.cogs && typeof product.current_margin_pct === 'number' ? (
  <span>{product.current_margin_pct.toFixed(1)}%</span>
) : (
  <span>— (нет COGS)</span>
)}

// ✅ NEW (backend guarantees data consistency)
{product.current_margin_pct !== null ? (
  <span>{product.current_margin_pct.toFixed(1)}%</span>
) : (
  <span>— ({product.missing_data_reason || 'нет данных'})</span>
)}
```

---

### Q4: Is There a Data Cleanup Needed?

**Answer**: **NO** - Data cleanup is not required. The fix handles this at the API layer.

**Why No Cleanup Needed**:
- `weekly_margin_fact` records with `cogs_rub = 0.0` are **intentionally stored** for analytics purposes
- They help track which products have sales but no COGS assigned
- The fix validates COGS existence at the API layer before returning margin data
- This is more efficient than cleaning up historical data

**If Cleanup Is Desired** (optional, not required):
```sql
-- Optional: Delete margin records where COGS no longer exists
-- This is NOT required - API layer fix is sufficient
DELETE FROM weekly_margin_fact wmf
WHERE NOT EXISTS (
  SELECT 1 FROM cogs c
  WHERE c.nm_id = wmf.nm_id
    AND c.valid_to IS NULL
);
```

**Recommendation**: Keep existing data - API layer fix is sufficient and more maintainable.

---

## Technical Details

### Bug Location

**File**: `src/products/products.service.ts`  
**Method**: `getMarginDataForProducts()`  
**Lines**: 431-436 (before fix)

**Problematic Code** (before fix):
```typescript
// ❌ BUG: Returned margin_pct without validating COGS existence
marginMap[item.nm_id] = {
  margin_pct: item.margin_pct,  // Could be 100.0 when COGS missing
  period: usedWeek,
  sales_qty: item.total_units,
  revenue: item.revenue_net,
};
```

### Fix Applied

**File**: `src/products/products.service.ts`  
**Method**: `getMarginDataForProducts()`  
**Lines**: 431-450 (after fix)

**Fixed Code**:
```typescript
// ✅ FIX: Validate COGS existence before returning margin
const hasCogs = !!cogsMap[item.nm_id];
if (!hasCogs) {
  // COGS not assigned - margin data is invalid (stale record from weekly_margin_fact)
  marginMap[item.nm_id] = {
    margin_pct: null,
    period: usedWeek,
    sales_qty: item.total_units || null,
    revenue: item.revenue_net || null,
    missing_reason: 'COGS_NOT_ASSIGNED',
  };
} else {
  // COGS exists - margin data is valid
  marginMap[item.nm_id] = {
    margin_pct: item.margin_pct,
    period: usedWeek,
    sales_qty: item.total_units,
    revenue: item.revenue_net,
  };
}
```

### Why This Happens

**Margin Calculation Service Logic** (`src/analytics/services/margin-calculation.service.ts`):

1. **Calculates margin for all products with sales** (line 104-110):
   ```typescript
   const cogs = cogsBySku.get(nmId) || {
     nmId,
     unitCostRub: null,
     cogsRub: new Decimal(0),  // Default to 0 if COGS missing
     missingCogsUnits: revenue.quantitySold,
   };
   ```

2. **Stores records even when COGS = 0** (line 125-144):
   - Creates `weekly_margin_fact` records for all products
   - When COGS missing: `cogs_rub = 0.0`, `margin_percent = 100.0`
   - This is intentional for analytics (tracks products without COGS)

3. **ProductsService should validate** before returning:
   - Check if COGS actually exists (not just if margin record exists)
   - If COGS missing, return `margin_pct = null` regardless of `weekly_margin_fact` value

---

## API Contract After Fix

**Guaranteed Behavior**:

| Condition | `current_margin_pct` | `missing_data_reason` |
|-----------|---------------------|----------------------|
| COGS exists + margin calculated | `number` (e.g., 35.5) | `null` |
| COGS exists + margin pending | `null` | `null` (calculation in progress) |
| COGS missing + sales exist | `null` | `"COGS_NOT_ASSIGNED"` |
| COGS missing + no sales | `null` | `"NO_SALES_DATA"` |
| No sales in period | `null` | `"NO_SALES_IN_PERIOD"` |

**Key Guarantee**: `current_margin_pct` is **never** non-null when `has_cogs: false`.

---

## Testing

**Test Case**: Product `412096139` (Жидкая изолента герметик для проводов термостойкая)

**Before Fix**:
```json
{
  "nm_id": "412096139",
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": 100.0,  // ❌ BUG
  "missing_data_reason": null
}
```

**After Fix**:
```json
{
  "nm_id": "412096139",
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": null,  // ✅ FIXED
  "missing_data_reason": "COGS_NOT_ASSIGNED"  // ✅ FIXED
}
```

---

## Related Issues

**Why Margin Calculation Stores Records Without COGS**:

This is **intentional design** for analytics purposes:
- Tracks which products have sales but no COGS assigned
- Helps identify products that need COGS assignment
- `missing_cogs_units` field indicates how many units are missing COGS

**API Layer Validation**:

The fix validates at the API layer (ProductsService) rather than changing margin calculation logic:
- More maintainable (single validation point)
- Doesn't break existing analytics queries
- Ensures API contract consistency

---

## Summary

**✅ Bug Confirmed**: Backend was returning invalid margin data for products without COGS.

**✅ Fix Applied**: Added COGS validation in `ProductsService.getMarginDataForProducts()`.

**✅ Data Cleanup**: Not required - API layer fix is sufficient.

**✅ Frontend Action**: Can remove defensive checks - backend now guarantees data consistency.

**✅ API Contract**: `current_margin_pct` is never non-null when `has_cogs: false`.

---

**Status**: ✅ **RESOLVED** - Bug fixed, backend response provided, frontend can proceed with implementation.

