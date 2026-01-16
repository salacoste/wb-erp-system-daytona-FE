# Request #17: COGS Assigned After Completed Week - Manual Recalculation Required

**Date**: 2025-01-27  
**Priority**: Medium - Documentation Request  
**Status**: ✅ **RESOLVED** - Backend Behavior Documented  
**Component**: Backend API - COGS Module + Margin Calculation (Epic 20)

---

## Problem Analysis

### Scenario

**Last completed week**: W46 (ended November 19, 2025)  
**COGS assigned**: November 23-24, 2025 (AFTER last completed week)  
**Expected behavior**: Margin should be calculated for week W46 using temporal COGS lookup  
**Actual behavior**: Margin not shown in API response (`current_margin_pct: null`)

### Root Cause

**Epic 20 Automatic Recalculation Logic**:

When COGS is assigned, backend calls `calculateAffectedWeeks(validFrom, isoWeekService)` to determine which weeks need recalculation.

**Code Logic** (from `src/analytics/helpers/affected-weeks.helper.ts`):

```typescript
// Step 4: Early return if valid_from is after last completed week
if (moscowStartDate > moscowEndDate) {
  return []; // Empty array = no weeks to recalculate
}
```

**What happens**:
1. `validFrom = 2025-11-23` (COGS assigned date)
2. `endDate = 2025-11-19` (end of last completed week W46)
3. `2025-11-23 > 2025-11-19` → **returns empty array**
4. `enqueueMarginRecalculation()` sees empty array → **skips enqueueing task**
5. `weekly_margin_fact` table is **NOT updated** for week W46
6. API response shows `current_margin_pct: null` (reads from `weekly_margin_fact`)

### Why This Happens

**Design Decision** (Epic 20):

The `calculateAffectedWeeks()` helper is designed to:
- ✅ Recalculate weeks from `valid_from` to last completed week (inclusive)
- ✅ Exclude incomplete weeks (Epic 19 logic)
- ⚠️ **Skip recalculation if `valid_from` is after last completed week**

**Rationale**: If COGS is assigned with a future date, there's no sales data yet for that period, so no recalculation is needed.

**BUT**: This logic doesn't account for **retroactive COGS assignment** where:
- COGS `valid_from` date is AFTER last completed week
- BUT there ARE sales in past weeks (W46) that need this COGS
- AND temporal lookup WOULD find this COGS for week W46

### Temporal Lookup Works, But Data Not Updated

**Important**: The margin calculation service (`MarginCalculationService`) DOES support temporal COGS lookup:

```typescript
// From src/analytics/services/margin-calculation.service.ts
private async lookupCogs(revenues: RevenueData[], start: Date, end: Date) {
  // Use midpoint of week for COGS lookup
  const midpoint = new Date((start.getTime() + end.getTime()) / 2);
  
  for (const revenue of revenues) {
    // Find COGS valid at week midpoint
    const cogs = await this.cogsService.findCogsAtDate(revenue.nmId, midpoint);
    // ... calculate margin using this COGS
  }
}
```

**What this means**:
- ✅ If recalculation IS triggered, temporal lookup WILL find COGS assigned on 2025-11-23 for week W46 (because `valid_from <= midpoint of W46`)
- ❌ But if recalculation is NOT triggered (empty array), `weekly_margin_fact` is never updated
- ❌ API reads from `weekly_margin_fact` → shows `null` instead of calculated margin

---

## Solution

### Manual Recalculation Required

**If COGS is assigned with date AFTER last completed week**, you need to manually trigger recalculation for historical weeks.

**API Endpoint**: `POST /v1/tasks/enqueue`

> **🔐 Authentication Required (Story 23.10)**
>
> This endpoint requires JWT authentication with **Manager role or higher**.
> Analyst users will receive `403 Forbidden` error.
>
> See: [`frontend/docs/request-backend/README.md#story-2310`](./README.md#-backend-update-story-2310---jwt-authentication-on-task--schedule-apis)

**Request Example**:

```http
POST /v1/tasks/enqueue
Authorization: Bearer <token>     # Required (Story 23.10)
X-Cabinet-Id: <cabinet_id>        # Required (cabinet isolation)
Content-Type: application/json

{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "cabinet_id": "<cabinet_id>",
    "weeks": ["2025-W46"],
    "nm_ids": ["321678606"]  // Optional: specific products
  }
}
```

**Response**:

```json
{
  "task_uuid": "uuid-123",
  "status": "pending",
  "enqueued_at": "2025-01-27T10:15:00Z"
}
```

**Check Status**:

```http
GET /v1/tasks/uuid-123
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
```

**Expected Result**:
- Task processes in 5-30 seconds (single product)
- `weekly_margin_fact` table updated with margin for week W46
- API response shows `current_margin_pct` with calculated value

---

## When This Happens

### Scenario 1: First COGS Assignment (No Historical COGS)

**Timeline**:
- Week W46 ends: November 19, 2025
- User assigns COGS: November 23, 2025 (with `valid_from = 2025-11-23`)
- Last completed week: W46 (ended November 19)

**Result**: 
- `calculateAffectedWeeks(2025-11-23)` → returns `[]` (empty)
- No automatic recalculation for W46
- **Manual recalculation required**

### Scenario 2: COGS Update (Historical COGS Exists)

**Timeline**:
- Week W46 ends: November 19, 2025
- Old COGS exists: `valid_from = 2025-10-01` (assigned before W46)
- User updates COGS: November 23, 2025 (with `valid_from = 2025-11-23`)
- Last completed week: W46 (ended November 19)

**Result**:
- Old COGS already triggered recalculation for W46 (when it was assigned)
- New COGS `calculateAffectedWeeks(2025-11-23)` → returns `[]` (empty)
- **BUT**: If old COGS was valid for W46, margin should already be calculated
- **Manual recalculation only needed if you want to use NEW COGS for W46** (backdating scenario)

---

## Alternative: Assign COGS with Historical Date

**Better Approach**: If you want COGS to apply to week W46, assign it with `valid_from` date BEFORE or DURING week W46.

**Example**:

```http
POST /v1/products/321678606/cogs
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_id>
Content-Type: application/json

{
  "unit_cost_rub": 999.00,
  "valid_from": "2025-11-15",  // ✅ Date DURING week W46 (Nov 11-17)
  "currency": "RUB",
  "source": "manual"
}
```

**Result**:
- `calculateAffectedWeeks(2025-11-15)` → returns `["2025-W46"]` (includes W46)
- Automatic recalculation triggered for W46
- Margin appears automatically in 5-30 seconds

**See**: `frontend/docs/COGS-BACKDATING-BUSINESS-LOGIC.md` for detailed explanation of temporal COGS versioning.

---

## Technical Details

### Epic 20 Automatic Recalculation Logic

**Code Location**: `src/products/products.service.ts:enqueueMarginRecalculation()`

```typescript
private async enqueueMarginRecalculation(
  cabinetId: string,
  validFrom: Date | string,
  nmIds?: string | string[],
  priority: 'normal' | 'low' = 'normal',
): Promise<void> {
  // Calculate affected weeks (Story 20.1)
  const affectedWeeks = calculateAffectedWeeks(validFrom, this.isoWeekService);

  // Early return: future date or no weeks
  if (affectedWeeks.length === 0) {
    this.logger.log(
      `No weeks to recalculate for cabinet ${cabinetId} ` +
        `(valid_from: ${validFrom}, reason: future date or no affected weeks)`,
    );
    return; // ⚠️ No task enqueued
  }
  
  // ... enqueue task if weeks.length > 0
}
```

**Helper Function**: `src/analytics/helpers/affected-weeks.helper.ts:calculateAffectedWeeks()`

**Key Logic**:
- Returns weeks from `valid_from` to last completed week (inclusive)
- Uses Epic 19 `getLastCompletedWeek()` to exclude incomplete weeks
- Returns empty array if `valid_from > last completed week end date`

### Margin Calculation Service

**Code Location**: `src/analytics/services/margin-calculation.service.ts`

**Temporal COGS Lookup**:
- Uses week midpoint for COGS lookup
- Calls `cogsService.findCogsAtDate(nmId, midpoint)`
- Finds COGS where `valid_from <= midpoint AND (valid_to IS NULL OR valid_to >= midpoint)`

**This means**: COGS assigned on 2025-11-23 with `valid_from = 2025-11-23` WILL be found for week W46 (midpoint ~ Nov 14) if `valid_from` is set to a date before or during W46.

**BUT**: If `valid_from = 2025-11-23` (after W46), temporal lookup will NOT find it for W46 (because `valid_from > midpoint of W46`).

---

## Recommendations

### For Frontend Team

1. **When COGS is assigned with future date**:
   - Show warning: "COGS assigned with date after last completed week. Historical weeks may need manual recalculation."
   - Provide button: "Recalculate Historical Margins" → calls `POST /v1/tasks/enqueue`
   - **🔐 Role Check (Story 23.10)**: Button should be hidden or disabled for Analyst users (they will get 403 error)

2. **Better UX**: Suggest assigning COGS with historical date if user wants it to apply to past weeks:
   - "To apply this COGS to week W46, set date to November 15 or earlier"

3. **Check for existing COGS**: Before assigning, check if historical COGS exists:
   - `GET /v1/cogs?nm_id=<nmId>&valid_at=2025-11-15`
   - If exists, margin may already be calculated

### For Backend Team (Future Enhancement)

**Potential Improvement**: Modify `calculateAffectedWeeks()` to check for sales data in past weeks, even if `valid_from` is after last completed week.

**Logic**:
1. If `valid_from > last completed week end`:
   - Check if there are sales in past weeks (W46, W45, etc.)
   - If yes, include those weeks in recalculation (temporal lookup will find COGS)
   - If no, return empty array (no sales to recalculate)

**Trade-off**: More complex logic, but better UX (automatic recalculation for retroactive COGS).

---

## Related Documentation

**Frontend Implementation:**
- **Story 4.1**: `frontend/docs/stories/4.1.single-product-cogs-assignment.md` - COGS assignment form with warning alert
- **Story 4.8**: `frontend/docs/stories/4.8.margin-recalculation-polling.md` - Polling and real-time updates
- **Hook**: `frontend/src/hooks/useManualMarginRecalculation.ts` - Manual recalculation hook
- **Component**: `frontend/src/components/custom/SingleCogsForm.tsx` - Warning alert and button
- **Helpers**: `frontend/src/lib/margin-helpers.ts` - `isCogsAfterLastCompletedWeek()`, `getLastCompletedWeek()`

**Backend Documentation:**
- **COGS Backdating Logic**: `frontend/docs/COGS-BACKDATING-BUSINESS-LOGIC.md`
- **Epic 20 Overview**: `docs/stories/epic-20/EPIC-20-OVERVIEW.md`
- **COGS History Guide**: `frontend/docs/request-backend/16-cogs-history-and-margin-data-structure.md`
- **Automatic Margin Recalculation**: `frontend/docs/request-backend/14-automatic-margin-recalculation-on-cogs-update-backend.md`
- **Request #14 Frontend Plan**: `frontend/docs/REQUEST-14-FRONTEND-IMPLEMENTATION-PLAN.md`

---

## Summary

**Question**: Why doesn't margin show when COGS is assigned after last completed week?

**Answer**:
1. ✅ **Temporal lookup works** - system CAN find COGS for historical weeks
2. ⚠️ **Automatic recalculation skipped** - `calculateAffectedWeeks()` returns empty array if `valid_from > last completed week`
3. 📋 **Manual recalculation required** - use `POST /v1/tasks/enqueue` to trigger recalculation for specific weeks
4. 💡 **Better approach** - assign COGS with historical date (before/during target week) to trigger automatic recalculation

**Status**: ✅ **RESOLVED** - Behavior documented, manual workaround available

---

**Document Version**: 1.1
**Last Updated**: 2025-11-26
**Status**: ✅ Complete
**Note**: Updated with Story 23.10 authentication requirements

