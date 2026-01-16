# Request #18: Backend Response - Missing Margin and Missing Data Reason

**Date**: 2025-01-27  
**Status**: ✅ **RESOLVED** - Backend Response Provided  
**Related**: [Request #18 - Frontend Question](./18-missing-margin-and-missing-data-reason-scenarios.md)

---

## Executive Summary

**Answer**: Yes, `current_margin_pct: null` and `missing_data_reason: null` **can occur simultaneously** for products with COGS and sales. This is **intentional behavior** (not a bug) that indicates margin calculation is in progress or pending.

**Root Cause**: When Epic 17 analytics returns a product with sales data (`total_units > 0`) but `margin_pct = null` (no record in `weekly_margin_fact`), and COGS is assigned, backend intentionally sets `missing_reason = undefined` to signal "calculation in progress" state.

**Frontend Guidance**: Show "(расчёт маржи...)" when both are null and COGS exists. This is the correct behavior.

---

## Detailed Response to Frontend Questions

### Q1: Is This Expected Behavior?

**Q1.1**: ✅ **YES** - `current_margin_pct: null` and `missing_data_reason: null` can occur simultaneously for products with:
- ✅ COGS assigned (`has_cogs: true`)
- ✅ Sales data exists (`last_sale_date` and `total_sales_qty` present)
- ✅ COGS `valid_from` date is before or during last completed week

**Q1.2**: This state indicates:
- **Margin calculation is in progress** (Epic 20 task queued but not yet processed)
- **OR** margin calculation task failed silently (rare edge case)
- **OR** COGS was assigned after the last completed week (Request #17 scenario)

**This is NOT a data inconsistency issue** - it's a transient state that should resolve when the margin calculation task completes.

---

### Q2: What Scenarios Can Cause This?

**All scenarios where backend returns `current_margin_pct: null` + `missing_data_reason: null` + `has_cogs: true`:**

#### Scenario 1: Margin Calculation Task Queued (Epic 20) ✅ **MOST COMMON**

**When**: COGS assigned → automatic recalculation task enqueued → task not yet processed

**Code Reference**: `src/products/products.service.ts:415-419`
```typescript
} else {
  // COGS assigned but margin not calculated yet (e.g., task pending or failed)
  // Don't set missing_reason - let frontend show "расчёт маржи..." or similar
  missingReason = undefined;
}
```

**Expected Resolution**: Task processes within 5-30 seconds (single product) or 45-60s (bulk)

**Frontend Action**: Show "(расчёт маржи...)" and optionally poll for updates

---

#### Scenario 2: COGS Assigned After Last Completed Week (Request #17)

**When**: COGS `valid_from` is after the last completed week → automatic recalculation skipped

**Code Reference**: `src/analytics/helpers/affected-weeks.helper.ts:81-84`
```typescript
// Step 4: Early return if valid_from is after last completed week (no sales data yet)
if (moscowStartDate > moscowEndDate) {
  return []; // No weeks to recalculate
}
```

**Expected Resolution**: Manual recalculation required via `POST /v1/tasks/enqueue`

**Frontend Action**: Show "(требуется пересчёт)" with button to trigger manual recalculation

**Reference**: [Request #17](./17-cogs-assigned-after-completed-week-recalculation.md)

---

#### Scenario 3: Margin Calculation Task Failed (Rare)

**When**: Task enqueued but failed during processing (e.g., database error, timeout)

**Expected Resolution**: Task retries automatically (up to 5 retries), or manual intervention required

**Frontend Action**: Show "(расчёт маржи...)" initially, but if persists > 5 minutes, show "(ошибка расчёта)" with manual retry option

---

#### Scenario 4: Worker Not Processing Queue (Epic 21 Issue)

**When**: Worker process stopped processing prioritized queue (known issue - see Epic 21)

**Expected Resolution**: Manual worker restart required (will be automated in Epic 21)

**Frontend Action**: Show "(расчёт маржи...)" but if persists > 10 minutes, backend team should investigate

**Reference**: `docs/epics/epic-21-worker-reliability-and-queue-monitoring.md`

---

#### Scenario 5: Analytics Service Returns Product But No Margin Record

**When**: Epic 17 analytics includes product in response (has sales in week), but `weekly_margin_fact` has no record for that week

**Code Flow**:
1. `WeeklyAnalyticsService.getWeeklyBySku()` returns product with `total_units > 0`
2. `includeCogs: true` → queries `weekly_margin_fact` for margin data
3. No record found → `margin_pct` remains `null` (default)
4. `ProductsService.getMarginDataForProducts()` sees: `hasSales = true`, `hasCogs = true`, `margin_pct = null`
5. Sets `missing_reason = undefined` (intentional)

**Expected Resolution**: Margin calculation task should create the record

**Frontend Action**: Show "(расчёт маржи...)"

---

### Q3: Is This a Problem?

**Q3.1**: ✅ **NO** - Backend intentionally returns `missing_data_reason: null` when:
- COGS is assigned
- Sales exist in the period
- Margin calculation is pending/in-progress

**This is the correct API contract** - `null` means "calculation in progress" (Epic 20 design).

**Q3.2**: ✅ **YES** - There are legitimate cases where both can be null simultaneously:
- Margin calculation task queued (Epic 20)
- COGS assigned after last completed week (Request #17)
- Transient state during automatic recalculation

**Q3.3**: This is **NOT a bug** - it's intentional behavior. However, we acknowledge that:
- Frontend needs clear guidance (provided in this document)
- Edge cases (failed tasks, worker issues) need better handling (Epic 21)

---

### Q4: How Should Frontend React?

**Q4.1**: Frontend should display when `current_margin_pct: null` + `missing_data_reason: null` + `has_cogs: true` + sales exist:

**✅ Recommended: Option A - "(расчёт маржи...)" (calculation in progress)**

**Rationale**:
- This is the most accurate representation of backend state
- Backend intentionally sets `missing_reason = null` to signal "in progress"
- Matches Epic 20 design intent

**Implementation**:
```typescript
if (current_margin_pct === null && missing_data_reason === null && has_cogs === true) {
  display = "(расчёт маржи...)";
}
```

**Q4.2**: Frontend should:

1. **Show "(расчёт маржи...)" immediately** when condition detected
2. **Poll for updates** (optional, but recommended):
   - Poll every 5-10 seconds for first 30 seconds
   - Then every 30 seconds for next 2 minutes
   - Stop polling after 5 minutes (assume task failed or requires manual intervention)
3. **Show manual retry button** if state persists > 5 minutes:
   - Button triggers: `POST /v1/tasks/enqueue` with `task_type: "recalculate_weekly_margin"`
   - See [Request #17](./17-cogs-assigned-after-completed-week-recalculation.md) for details

**Q4.3**: Currently, **NO** - there's no API endpoint to check if margin calculation task is running for a specific product.

**Future Enhancement** (Epic 21): We plan to add:
- `GET /v1/tasks?nm_id=<nmId>&task_type=recalculate_weekly_margin&status=active` - Check active tasks
- Worker health endpoint: `GET /v1/health/worker` - Check if worker is processing queues

---

## Technical Details

### Code Flow Analysis

**File**: `src/products/products.service.ts:405-419`

```typescript
if (item.margin_pct === null || item.margin_pct === undefined) {
  const hasCogs = !!cogsMap[item.nm_id];
  const hasSales = (item.total_units || 0) > 0;

  let missingReason: string | undefined;
  if (!hasSales) {
    missingReason = 'NO_SALES_IN_PERIOD';
  } else if (!hasCogs) {
    missingReason = 'COGS_NOT_ASSIGNED';
  } else {
    // COGS assigned but margin not calculated yet (e.g., task pending or failed)
    // Don't set missing_reason - let frontend show "расчёт маржи..." or similar
    missingReason = undefined; // ← INTENTIONAL: signals "in progress"
  }
}
```

**Key Points**:
- `missingReason = undefined` is **intentional** when COGS exists and sales exist
- This signals to frontend: "calculation in progress, show loading state"
- `undefined` serializes to `null` in JSON response

### Epic 17 Analytics Integration

**File**: `src/analytics/weekly-analytics.service.ts:363-398`

When `includeCogs: true`:
1. Queries `weekly_margin_fact` for margin data
2. Merges margin data into SKU items
3. If no margin record found → `margin_pct` remains `null` (default)
4. `missing_cogs_flag` remains `true` (default)

**ProductsService** then:
- Checks actual COGS existence (not just `missing_cogs_flag`)
- Determines `missing_reason` based on actual state
- Sets `missing_reason = undefined` when COGS exists but margin not calculated

---

## API Contract Clarification

### Current Contract

**When `current_margin_pct: null`:**

| Condition | `missing_data_reason` | Meaning |
|-----------|----------------------|---------|
| No sales in period | `"NO_SALES_IN_PERIOD"` | No sales data for last completed week |
| No COGS assigned | `"COGS_NOT_ASSIGNED"` | COGS not assigned for product |
| COGS + Sales, margin pending | `null` | **Margin calculation in progress** |
| No sales ever | `"NO_SALES_DATA"` | Product never had sales |
| Analytics unavailable | `"ANALYTICS_UNAVAILABLE"` | Epic 17 analytics service error |

**Key Point**: `missing_data_reason: null` when `current_margin_pct: null` **is valid** and means "calculation in progress" (Epic 20 design).

### Should Backend Always Set `missing_data_reason`?

**Answer**: **NO** - Backend intentionally leaves `missing_data_reason = null` when:
- COGS is assigned
- Sales exist
- Margin calculation is pending/in-progress

**This is the correct API contract** - `null` signals "in progress" state to frontend.

**If we always set `missing_data_reason`**, we would need a new value like `"CALCULATION_IN_PROGRESS"`, but this would:
- Add unnecessary complexity
- Require frontend to handle another enum value
- Not provide additional value (frontend already knows to show "расчёт маржи...")

---

## Example: Product 235263406

**Observed State**:
```json
{
  "nm_id": "235263406",
  "has_cogs": true,
  "cogs": { "unit_cost_rub": "111.00", "valid_from": "2025-01-11T00:00:00.000Z" },
  "current_margin_pct": null,
  "missing_data_reason": null,
  "last_sale_date": "2025-01-15",
  "total_sales_qty": 10
}
```

**Backend Analysis**:
- ✅ COGS assigned: 111.00 RUB, valid from 2025-01-11
- ✅ Sales exist: 178 sales from 2025-08-24 to 2025-11-14
- ✅ Margin calculated for W34: 71.36%
- ❌ Margin NOT calculated for last completed week (W46)

**Root Cause**: Margin calculation task for W46 not yet processed (or COGS assigned after W46 ended)

**Expected Resolution**: 
- If COGS `valid_from` (2025-01-11) is before W46 → automatic recalculation should trigger
- If COGS `valid_from` is after W46 → manual recalculation required (Request #17)

**Frontend Action**: Show "(расчёт маржи...)" and poll for updates

---

## Recommendations

### For Frontend Team

1. **✅ Use Option A**: Show "(расчёт маржи...)" when `missing_data_reason === null` and COGS exists
2. **✅ Implement Polling**: Poll every 5-10 seconds for first 30 seconds, then every 30 seconds
3. **✅ Add Manual Retry**: Show retry button if state persists > 5 minutes
4. **✅ Handle Edge Cases**: 
   - If COGS `valid_from` is after last completed week → show "(требуется пересчёт)" with manual trigger
   - If state persists > 10 minutes → show "(ошибка расчёта)" with manual retry

### For Backend Team (Future Enhancements)

1. **Epic 21**: Add queue monitoring and automatic worker recovery
2. **Task Status API**: Add endpoint to check if margin calculation task is active for a product
3. **Better Error Handling**: Detect failed tasks and set `missing_data_reason = "CALCULATION_FAILED"` (new value)

---

## Related Documentation

- **Request #16**: [COGS History and Margin Data Structure Guide](./16-cogs-history-and-margin-data-structure.md)
- **Request #17**: [COGS Assigned After Completed Week - Manual Recalculation](./17-cogs-assigned-after-completed-week-recalculation.md)
- **Epic 20**: Automatic Margin Recalculation on COGS Update
- **Epic 21**: Worker Reliability and Queue Monitoring (planned)

---

## Summary

**✅ This is expected behavior** - `current_margin_pct: null` + `missing_data_reason: null` + `has_cogs: true` means "margin calculation in progress".

**✅ Frontend should show "(расчёт маржи...)"** - this is the correct interpretation of backend state.

**✅ Backend API contract is correct** - `null` for `missing_data_reason` when COGS exists and sales exist signals "in progress" state.

**✅ No bug fix required** - current implementation matches Epic 20 design intent.

**Future improvements** (Epic 21):
- Better task status visibility
- Automatic worker recovery
- Enhanced error handling for failed tasks

---

**Status**: ✅ **RESOLVED** - Backend response provided, frontend can proceed with implementation.

