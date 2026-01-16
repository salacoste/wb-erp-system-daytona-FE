# Request #18: Missing Margin and Missing Data Reason - Edge Case Scenarios

**Date**: 2025-01-27  
**Priority**: 🟡 Medium - Clarification Request  
**Status**: ✅ **RESOLVED** - Backend Response Provided  
**Component**: Backend API - Products Module + Analytics Module (Epic 17/20)  
**Backend Response**: [See Backend Response Document](./18-missing-margin-and-missing-data-reason-scenarios-backend.md)

---

## Executive Summary

Frontend team has observed cases where the API response for products includes:
- `current_margin_pct: null` (no margin value)
- `missing_data_reason: null` (no reason provided)
- `has_cogs: true` (COGS is assigned)
- `cogs: { ... }` (COGS object is present with valid_from date)

**Question**: Is this expected behavior? In what scenarios can this occur? How should frontend handle this case?

---

## Problem Description

### Observed Behavior

When calling `GET /v1/products?include_cogs=true` or `GET /v1/products/:nmId?include_cogs=true`, some products return:

```json
{
  "nm_id": "235263406",
  "sa_name": "Жидкая изолента для проводов черная",
  "has_cogs": true,
  "cogs": {
    "id": "uuid-here",
    "unit_cost_rub": "111.00",
    "valid_from": "2025-01-11T00:00:00.000Z",
    "valid_to": null,
    "source": "manual",
    "created_at": "2025-01-11T10:00:00.000Z"
  },
  "current_margin_pct": null,        // ⚠️ No margin value
  "current_margin_period": null,
  "current_margin_sales_qty": null,
  "current_margin_revenue": null,
  "missing_data_reason": null,       // ⚠️ No reason provided
  "last_sale_date": "2025-01-15",    // ✅ Sales exist
  "total_sales_qty": 10              // ✅ Sales exist
}
```

### Expected Behavior (Based on Request #16)

According to Request #16 documentation, backend should return:
- **Either** `current_margin_pct: number` (margin calculated)
- **Or** `missing_data_reason: string` (reason why margin is not available)

**Possible `missing_data_reason` values** (from Request #16):
- `NO_SALES_IN_PERIOD` - No sales in the last completed week
- `COGS_NOT_ASSIGNED` - No COGS valid for the last completed week
- `NO_SALES_DATA` - Product never had sales
- `ANALYTICS_UNAVAILABLE` - Analytics service unavailable
- `null` - Margin calculation in progress (Epic 20)

### Current Frontend Handling

Frontend currently shows "(расчёт...)" (calculation in progress) when:
- `current_margin_pct === null`
- `missing_data_reason === null`
- `has_cogs === true`
- COGS `valid_from` is before or during last completed week

**But**: This may be incorrect if backend is not actually calculating margin in these cases.

---

## Questions for Backend Team

### 1. Is This Expected Behavior?

**Q1.1**: Can `current_margin_pct: null` and `missing_data_reason: null` occur simultaneously for products with:
- ✅ COGS assigned (`has_cogs: true`)
- ✅ Sales data exists (`last_sale_date` and `total_sales_qty` present)
- ✅ COGS `valid_from` date is before or during last completed week

**Q1.2**: If yes, what does this state indicate?
- Is margin calculation in progress (Epic 20)?
- Is this a data inconsistency issue?
- Is this a transient state that will resolve?

### 2. What Scenarios Can Cause This?

**Q2.1**: Please list all scenarios where backend returns:
- `current_margin_pct: null`
- `missing_data_reason: null`
- `has_cogs: true`

**Possible scenarios we've considered**:
1. **Margin calculation task queued but not started yet** (Epic 20)
   - Task is in queue but worker hasn't processed it
   - Expected: Should resolve when task completes
   
2. **Data inconsistency in weekly_margin_fact table**
   - COGS exists, sales exist, but no margin record in `weekly_margin_fact`
   - Expected: Should be fixed by recalculation task
   
3. **Race condition during COGS assignment**
   - COGS just assigned, margin calculation not yet triggered
   - Expected: Should resolve within seconds (Epic 20 automatic recalculation)
   
4. **Last completed week calculation edge case**
   - COGS valid_from is exactly at boundary of last completed week
   - Expected: Should be handled by temporal lookup logic
   
5. **Analytics service temporary unavailability**
   - Backend couldn't fetch analytics data but didn't set `missing_data_reason`
   - Expected: Should set `ANALYTICS_UNAVAILABLE` or retry

### 3. Is This a Problem?

**Q3.1**: Should backend always return `missing_data_reason` when `current_margin_pct` is null?

**Q3.2**: Are there legitimate cases where both can be null simultaneously?

**Q3.3**: If this is a bug, what is the root cause and expected fix timeline?

### 4. How Should Frontend React?

**Q4.1**: What should frontend display when:
- `current_margin_pct: null`
- `missing_data_reason: null`
- `has_cogs: true`
- Sales data exists

**Options we're considering**:
- **Option A**: Show "(расчёт маржи...)" (calculation in progress)
  - Assumes Epic 20 task is running
  - May be misleading if task is not actually running
  
- **Option B**: Show "(нет данных)" (no data available)
  - Generic message, doesn't imply calculation
  - May confuse users if calculation is actually in progress
  
- **Option C**: Show "(требуется пересчёт)" (recalculation required)
  - Suggests user should trigger manual recalculation
  - May be incorrect if automatic recalculation is in progress

**Q4.2**: Should frontend:
- Poll for updates (like we do after COGS assignment)?
- Show a button to trigger manual recalculation?
- Just show a generic "no data" message?

**Q4.3**: Is there a way for frontend to check if margin calculation task is actually running for a product?

---

## Technical Context

### API Endpoints Affected

1. **`GET /v1/products?include_cogs=true`** - Product list with margin data
2. **`GET /v1/products/:nmId?include_cogs=true`** - Single product with margin data

### Frontend Code Location

- **Component**: `src/components/custom/ProductList.tsx` (lines 324-366)
- **Logic**: Determines what to display when margin data is missing
- **Current behavior**: Shows "(расчёт...)" when `missing_data_reason === null` and COGS exists

### Related Documentation

- **Request #16**: COGS History and Margin Data Structure Guide
  - Documents `missing_data_reason` values
  - Explains margin calculation logic
  
- **Request #17**: COGS Assigned After Completed Week - Manual Recalculation Required
  - Documents scenarios where automatic recalculation is skipped
  - Provides manual recalculation workaround

---

## Example API Response (Problematic Case)

**Request**:
```http
GET /v1/products/235263406?include_cogs=true
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Response** (Current - Problematic):
```json
{
  "nm_id": "235263406",
  "sa_name": "Жидкая изолента для проводов черная",
  "brand": "Protape",
  "has_cogs": true,
  "cogs": {
    "id": "87fe46ee-3933-400c-a40e-827df238aed9",
    "unit_cost_rub": "111.00",
    "valid_from": "2025-01-11T00:00:00.000Z",
    "valid_to": null,
    "source": "manual",
    "created_by": "user-uuid",
    "created_at": "2025-01-11T10:00:00.000Z",
    "notes": "Initial assignment"
  },
  "current_margin_pct": null,           // ⚠️ No value
  "current_margin_period": null,
  "current_margin_sales_qty": null,
  "current_margin_revenue": null,
  "missing_data_reason": null,         // ⚠️ No reason
  "last_sale_date": "2025-01-15",
  "total_sales_qty": 10
}
```

**Expected Response** (What we expect):
```json
{
  "nm_id": "235263406",
  "sa_name": "Жидкая изолента для проводов черная",
  "brand": "Protape",
  "has_cogs": true,
  "cogs": { /* same as above */ },
  "current_margin_pct": null,
  "current_margin_period": null,
  "current_margin_sales_qty": null,
  "current_margin_revenue": null,
  "missing_data_reason": "NO_SALES_IN_PERIOD",  // ✅ Reason provided
  // OR
  "missing_data_reason": null,                  // ✅ If calculation in progress (Epic 20)
  "last_sale_date": "2025-01-15",
  "total_sales_qty": 10
}
```

---

## Requested Information

Please provide:

1. **Clarification**: Is this expected behavior or a bug?
2. **Scenarios**: List all scenarios where both `current_margin_pct` and `missing_data_reason` can be null
3. **Root Cause**: If this is a bug, what causes it?
4. **Fix Timeline**: If this is a bug, when will it be fixed?
5. **Frontend Guidance**: How should frontend handle this case?
6. **API Contract**: Should backend guarantee that `missing_data_reason` is always set when `current_margin_pct` is null?

---

## Related Issues

- **Epic 20**: Automatic Margin Recalculation on COGS Update
  - May be related to task queue processing delays
  
- **Request #17**: COGS Assigned After Completed Week
  - Similar issue with missing margin data
  - Solution: Manual recalculation via `POST /v1/tasks/enqueue`

---

## Frontend Impact

**Current State**: Frontend shows "(расчёт...)" which may be misleading if calculation is not actually in progress.

**Desired State**: Frontend should display accurate status based on actual backend state.

**Blocking**: This affects user experience and may cause confusion about margin calculation status.

---

**Next Steps**: Awaiting backend team response to clarify expected behavior and provide guidance for frontend implementation.

