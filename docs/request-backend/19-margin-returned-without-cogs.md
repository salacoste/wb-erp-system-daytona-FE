# Request #19: Margin Returned Without COGS - Data Inconsistency

**Date**: 2025-01-27  
**Priority**: 🔴 High - Data Integrity Issue  
**Status**: ✅ **RESOLVED** - Bug Fixed  
**Component**: Backend API - Products Module + Analytics Module (Epic 17/20)  
**Backend Response**: [See Backend Response Document](./19-margin-returned-without-cogs-backend.md)

---

## Executive Summary

Frontend observes that `GET /v1/products?include_cogs=true` returns `current_margin_pct: 100.0` for products where `has_cogs: false` and `cogs: null`. This is logically inconsistent - margin cannot be calculated without COGS (Cost of Goods Sold).

**Example Product**: `nm_id: "412096139"` (Жидкая изолента герметик для проводов термостойкая)

**Observed API Response**:
```json
{
  "nm_id": "412096139",
  "sa_name": "Жидкая изолента герметик для проводов термостойкая",
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": 100.0,  // ❌ PROBLEM: Margin returned without COGS
  "current_margin_period": "2025-W46",
  "current_margin_sales_qty": 10,
  "current_margin_revenue": 5000.00,
  "missing_data_reason": null
}
```

**Expected Behavior**: If `has_cogs: false` or `cogs: null`, then `current_margin_pct` should be `null` and `missing_data_reason` should be `"COGS_NOT_ASSIGNED"`.

---

## Problem Description

### Current Behavior

When fetching product list with `include_cogs=true`, some products return:
- `has_cogs: false` (or `cogs: null`)
- `current_margin_pct: 100.0` (or other numeric value)
- `missing_data_reason: null`

### Why This Is a Problem

1. **Logical Inconsistency**: Margin calculation requires COGS. If COGS is not assigned, margin cannot be calculated.
2. **Formula**: `margin_percent = (gross_profit / revenue_net) × 100%`, where `gross_profit = revenue_net - cogs`. Without COGS, this calculation is impossible.
3. **Data Integrity**: This suggests either:
   - Stale data in `weekly_margin_fact` table (old margin record from when COGS existed)
   - Bug in margin calculation service that doesn't validate COGS existence
   - Issue with temporal COGS lookup that finds COGS when it shouldn't

### Impact

- **User Confusion**: Users see "100% margin" for products without COGS, which is misleading
- **Data Quality**: Frontend must add defensive checks to prevent displaying invalid margin data
- **Business Logic**: Incorrect margin values could lead to wrong business decisions

---

## Questions for Backend Team

1. **Is this expected behavior?**
   - Should `current_margin_pct` ever be non-null when `has_cogs: false`?
   - Or is this a bug in the margin calculation/retrieval logic?

2. **What could cause this scenario?**
   - Could it be stale data in `weekly_margin_fact` table (margin calculated when COGS existed, but COGS was later deleted)?
   - Could it be a race condition where margin is calculated before COGS deletion is processed?
   - Could it be an issue with temporal COGS lookup that incorrectly finds COGS for the week?

3. **How should frontend handle this?**
   - Should we always check `has_cogs` before displaying `current_margin_pct`?
   - Or should backend ensure `current_margin_pct` is always `null` when `has_cogs: false`?

4. **Is there a data cleanup needed?**
   - Should backend clean up `weekly_margin_fact` records where COGS no longer exists?
   - Or should margin calculation service validate COGS existence before returning margin data?

---

## Technical Context

### Frontend Current Handling

Frontend currently implements defensive check:
```typescript
// Only show margin if COGS is assigned AND margin is calculated
{product.has_cogs && product.cogs && typeof product.current_margin_pct === 'number' && Number.isFinite(product.current_margin_pct) ? (
  <span>{product.current_margin_pct.toFixed(1)}%</span>
) : (
  <span>— (нет COGS)</span>
)}
```

This prevents displaying invalid margin, but it's a workaround. The root cause should be fixed in backend.

### Backend Code References (Based on Previous Requests)

- **Margin Calculation**: `src/analytics/services/margin-calculation.service.ts`
- **Products Service**: `src/products/products.service.ts` (lines 405-419 for `missing_data_reason` logic)
- **COGS Lookup**: `src/cogs/cogs.service.ts` (temporal lookup via `findCogsAtDate`)
- **Margin Storage**: `weekly_margin_fact` table

### Related Documentation

- **Request #16**: [COGS History and Margin Data Structure Guide](./16-cogs-history-and-margin-data-structure.md)
- **Request #18**: [Missing Margin and Missing Data Reason - Edge Case Scenarios](./18-missing-margin-and-missing-data-reason-scenarios.md)

---

## Example Investigation Request

**Product to Investigate**: `nm_id: "412096139"`

**API Call**:
```bash
GET /v1/products?include_cogs=true&search=412096139
```

**Expected Investigation**:
1. Check if product has any COGS records in `cogs` table
2. Check if `weekly_margin_fact` has records for this product
3. Check if margin calculation service validates COGS existence before returning margin
4. Check if there's a data consistency issue (stale margin records)

---

## Recommended Backend Fix

If this is confirmed as a bug, backend should:

1. **Validate COGS existence** before returning margin data:
   ```typescript
   if (!hasCogs || !cogs) {
     current_margin_pct = null;
     missing_data_reason = 'COGS_NOT_ASSIGNED';
   }
   ```

2. **Clean up stale margin records** in `weekly_margin_fact` when COGS is deleted

3. **Add data integrity check** in margin calculation service to ensure COGS exists before calculating margin

---

## Frontend Action Plan (Pending Backend Response)

**Option A: If Backend Confirms Bug**
- Wait for backend fix
- Remove defensive check once backend ensures data consistency

**Option B: If Backend Confirms Expected Behavior**
- Keep defensive check in frontend
- Document this as expected behavior

**Option C: If Backend Needs Time to Fix**
- Keep defensive check as temporary workaround
- Add logging to track frequency of this issue
- Revisit after backend fix

---

## Related Documentation

- [Request #16: COGS History and Margin Data Structure Guide](./16-cogs-history-and-margin-data-structure.md)
- [Request #18: Missing Margin and Missing Data Reason - Edge Case Scenarios](./18-missing-margin-and-missing-data-reason-scenarios.md)
- `frontend/src/components/custom/ProductList.tsx` (defensive check implementation)

---

**Status**: ⏳ **PENDING** - Awaiting Backend Investigation and Response

