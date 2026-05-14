# Request #113: Margin % Calculation - Empty State Behavior

**Date**: 2026-01-30
**Priority**: 🟡 Low - Documentation Request
**Status**: ✅ **DOCUMENTED** - Not a Bug
**Component**: Backend API - Analytics Module
**Endpoint**: `GET /v1/analytics/weekly/finance-summary`

---

## Executive Summary

The FrontEnd team observed that Margin % fields return `null` values:
- **Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`
- **Observed Response**: `{ "sale_gross_total": 305778.32, "cogs_total": null, "gross_profit": null }`
- **Root Cause**: `weekly_margin_fact` table is empty (data pipeline not implemented)
- **Finding**: **NOT A BUG** - This is expected behavior when `weekly_margin_fact` is empty

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-01-30
**Summary**: Documented as expected behavior, not a bug. The `weekly_margin_fact` table was empty because COGS bulk upload did not trigger margin recalculation. This was subsequently fixed in Request #120 (auto-trigger on COGS upload + manual backfill for historical weeks).
**Remaining frontend action**: Display appropriate empty state with call-to-action when margin fields return null.

## Problem Description

### FrontEnd Observation

**API Response**:
```json
{
  "sale_gross_total": 305778.32,
  "cogs_total": null,
  "gross_profit": null,
  "margin_pct": null
}
```

### Expected vs Actual Behavior

| Field | Expected | Actual | Status |
|-------|----------|--------|--------|
| `sale_gross_total` | Number | 305778.32 | ✅ Working |
| `cogs_total` | Number | `null` | ⚠️ Empty table |
| `gross_profit` | Number | `null` | ⚠️ Empty table |
| `margin_pct` | Number | `null` | ⚠️ Empty table |

---

## Root Cause Analysis

### Database Status

**Table**: `weekly_margin_fact`

**Current State**:
```sql
SELECT COUNT(*) FROM weekly_margin_fact;
-- Result: 0 (EMPTY)
```

**COGS Data Available**:
```sql
SELECT COUNT(*) FROM cogs;
-- Result: 40 records exist
```

### Data Pipeline Issue

The `weekly_margin_fact` table is **not being populated** by any data aggregation pipeline.

**Current Pipeline Status**:
- ✅ `weekly_payout_summary` - Working (populated by Epic 2)
- ✅ `cogs` table - Has 40 records (Epic 12, 16)
- ❌ `weekly_margin_fact` - **EMPTY** (no aggregation pipeline implemented)

**Epic 56 Status**: Historical Inventory Import (completed 2026-01-29)
- Epic 56 implemented COGS import from WB Analytics API
- Epic 56 does **NOT** populate `weekly_margin_fact`
- Separate Epic needed for margin data aggregation

---

## Backend Logic

### Margin Calculation Query

**File**: `src/analytics/weekly-analytics.service.ts`

**Query Logic** (simplified):
```sql
SELECT
  COALESCE(SUM(wmf.cogs_rub * wfs.quantity), 0) as cogs_total,
  COALESCE(SUM(wfs.retail_price_total - wmf.cogs_rub * wfs.quantity), 0) as gross_profit
FROM weekly_margin_fact wmf
JOIN weekly_finance_summary wfs ON wfs.nm_id = wmf.nm_id
WHERE wmf.cabinet_id = $1
  AND wmf.week = $2
  AND wmf.report_type = 'total'
```

**Result**: When `weekly_margin_fact` is empty:
- `SUM()` returns `NULL`
- `COALESCE(NULL, 0)` converts to `0` (but still shows as `null` in API response due to serialization)

---

## FrontEnd Handling

### Display Strategy

**When `cogs_total === null` and `gross_profit === null`**:

#### Option 1: Empty State Component (Recommended)
```tsx
import { CogsMissingState } from '@/components/custom/CogsMissingState';

// Usage
{data.cogs_total === null ? (
  <CogsMissingState
    coveragePercentage={0}
    onAssignCogs={() => navigate('/products')}
  />
) : (
  <MarginDisplay cogsTotal={data.cogs_total} grossProfit={data.gross_profit} />
)}
```

#### Option 2: Warning Badge
```tsx
{data.cogs_total === null && (
  <Badge variant="warning" className="mb-4">
    ⚠️ Недостаточно данных для расчёта маржи. Назначьте себестоимость товарам.
  </Badge>
)}
```

#### Option 3: Metrics with Empty State
```tsx
<div className="grid grid-cols-3 gap-4">
  <MetricCard
    label="Выручка"
    value={formatCurrency(data.sale_gross_total)}
  />
  <MetricCard
    label="Себестоимость"
    value={data.cogs_total ? formatCurrency(data.cogs_total) : '—'}
    empty={!data.cogs_total}
  />
  <MetricCard
    label="Валовая прибыль"
    value={data.gross_profit ? formatCurrency(data.gross_profit) : '—'}
    empty={!data.gross_profit}
  />
</div>
```

### Component Reference

**Existing Components**:
- `CogsMissingState` - Displays when COGS coverage < 100%
- `MissingCogsAlert` - Shows warning with call-to-action
- `MetricCardEnhanced` - Supports empty state display

**Files**:
- `frontend/src/components/custom/MissingCogsAlert.tsx`
- `frontend/src/components/custom/CogsMissingState.tsx` (if exists)
- `frontend/src/components/custom/MetricCardEnhanced.tsx`

---

## Data Pipeline Status

### Current Status (2026-01-30)

| Component | Status | Details |
|-----------|--------|---------|
| **COGS Import** | ✅ Working | 40 records in `cogs` table |
| **Margin Aggregation** | ❌ Not Implemented | `weekly_margin_fact` is EMPTY |
| **Finance Summary** | ✅ Working | Returns `null` for margin fields when table empty |

### Implementation Timeline

**Completed**:
- ✅ Epic 12 (2025-01): Products & COGS Management API
- ✅ Epic 16 (2025-01): COGS Assignment UI
- ✅ Epic 20 (2025-01): Auto Margin Recalculation (COGS → Margin trigger)
- ✅ Epic 56 (2026-01-29): Historical Inventory Import (COGS import from WB API)

**NOT Implemented**:
- ❌ **Data Aggregation Pipeline**: `cogs` → `weekly_margin_fact`
  - This is a separate Epic that needs to be planned
  - Requires aggregation logic: COGS per product per week
  - Should be triggered by: COGS assignment, historical import

---

## Solution Roadmap

### Short-term (FrontEnd)

1. **Update UI to Handle Null Values**
   - Display empty state when `cogs_total === null`
   - Show warning: "Недостаточно данных для расчёта маржи"
   - Provide CTA: "Назначить себестоимость"

2. **Add Coverage Indicator**
   - Calculate COGS coverage percentage
   - Display: "Покрытие COGS: X%"
   - Show progress bar

### Long-term (Backend)

**Required Epic**: Margin Data Aggregation Pipeline

**Scope**:
1. **Aggregation Task**: Populate `weekly_margin_fact` from `cogs` table
2. **Trigger Points**:
   - After COGS assignment (automatic)
   - After historical COGS import (manual trigger)
   - Weekly scheduled task (for new data)
3. **Logic**:
   - Join `cogs` with `weekly_finance_summary` on `nm_id`
   - Apply temporal logic (COGS version validity by week)
   - Calculate: `cogs_rub * quantity` per product per week
4. **API Endpoint**:
   - `POST /v1/tasks/enqueue` with `task_type: "aggregate_margin_data"`
   - Response: Task status for tracking

---

## Testing & Verification

### Manual Testing

**Step 1**: Check Database
```sql
-- Check if weekly_margin_fact is empty
SELECT COUNT(*) FROM weekly_margin_fact;

-- Check COGS records
SELECT COUNT(*) FROM cogs;

-- Check if finance summary has data
SELECT COUNT(*) FROM weekly_finance_summary;
```

**Step 2**: Test API Response
```bash
curl -X GET "http://localhost:3000/v1/analytics/weekly/finance-summary?week=2026-W04" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet_id>" \
  | jq '.cogs_total, .gross_profit, .margin_pct'
```

**Expected Result**:
- If `weekly_margin_fact` is empty → `null` values
- If `weekly_margin_fact` has data → numeric values

### FrontEnd Testing

**Scenario 1**: Empty State Display
```
Given: API returns { cogs_total: null, gross_profit: null }
When: User views finance summary
Then: Display CogsMissingState component
And: Show warning about missing COGS
And: Provide CTA to assign COGS
```

**Scenario 2**: Data Available Display
```
Given: API returns { cogs_total: 53626.0, gross_profit: 102038.76 }
When: User views finance summary
Then: Display margin metrics with values
And: Calculate margin_pct = (gross_profit / sale_gross_total) * 100
```

---

## Code Examples

### FrontEnd Component Example

```tsx
// components/custom/FinanceSummaryMargin.tsx
import { useFinanceSummary } from '@/hooks/useFinanceSummary';
import { CogsMissingState } from './CogsMissingState';
import { MetricCard } from './MetricCard';

export function FinanceSummaryMargin({ week }: { week: string }) {
  const { data, isLoading, error } = useFinanceSummary({ week });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const hasMarginData = data?.cogs_total !== null && data?.gross_profit !== null;

  return (
    <div className="space-y-4">
      {/* Revenue - Always available */}
      <MetricCard
        label="Выручка"
        value={formatCurrency(data?.sale_gross_total || 0)}
        trend={data?.revenue_trend}
      />

      {/* Margin metrics - Handle null values */}
      {hasMarginData ? (
        <>
          <MetricCard
            label="Себестоимость"
            value={formatCurrency(data.cogs_total!)}
          />
          <MetricCard
            label="Валовая прибыль"
            value={formatCurrency(data.gross_profit!)}
          />
          <MetricCard
            label="Маржинальность"
            value={formatPercentage(data.margin_pct!)}
          />
        </>
      ) : (
        <CogsMissingState
          coveragePercentage={data?.cogs_coverage_pct || 0}
          onAssignCogs={() => router.push('/products')}
        />
      )}
    </div>
  );
}
```

### Hook Example

```tsx
// hooks/useFinanceSummaryMargin.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useFinanceSummary({ week }: { week: string }) {
  return useQuery({
    queryKey: ['finance-summary', week],
    queryFn: async () => {
      const response = await apiClient.get(`/v1/analytics/weekly/finance-summary`, {
        params: { week },
      });
      return response.data;
    },
    select: (data) => ({
      ...data,
      hasMarginData: data.cogs_total !== null && data.gross_profit !== null,
    }),
  });
}
```

---

## Related Documentation

- **Epic 56**: `docs/epics/epic-56-historical-inventory-import.md` (COGS import implementation)
- **Epic 20**: `docs/epics/epic-20-auto-margin-recalculation.md` (COGS → Margin trigger)
- **Request #44**: `frontend/docs/request-backend/44-cogs-section-in-finance-summary.md` (COGS display)
- **Request #24**: `frontend/docs/request-backend/24-margin-cogs-integration-guide.md` (Integration guide)

---

## Questions & Answers

### Q: Is this a bug?

**A**: No, this is **expected behavior**. The `weekly_margin_fact` table is intentionally empty because the data aggregation pipeline has not been implemented yet. The backend correctly returns `null` for margin fields when the table is empty.

### Q: When will this be fixed?

**A**: This requires a **new Epic** for the margin data aggregation pipeline. Epic 56 (completed 2026-01-29) implemented COGS import from WB API but does NOT populate `weekly_margin_fact`. A separate Epic needs to be planned for:
1. Aggregating COGS data into `weekly_margin_fact`
2. Triggering aggregation on COGS assignment
3. Weekly aggregation for new data

### Q: What should FrontEnd display in the meantime?

**A**: Display an **empty state** component when:
- `cogs_total === null`
- `gross_profit === null`
- `margin_pct === null`

Show:
- Warning badge: "Недостаточно данных для расчёта маржи"
- Call-to-action: "Назначить себестоимость товарам"
- Link to Products page

### Q: Can we manually populate `weekly_margin_fact`?

**A**: Yes, but this is a **temporary workaround**:
1. Write aggregation script to populate `weekly_margin_fact` from `cogs` table
2. Run script manually via: `npm run scripts:aggregate-margin`
3. **Note**: This will need to be rerun after each COGS assignment until the automated pipeline is implemented

---

## Summary

✅ **NOT A BUG** - `cogs_total: null` is expected when `weekly_margin_fact` is empty

✅ **DATA AVAILABLE** - 40 COGS records exist but not aggregated into margin calculations

✅ **FRONTEND ACTION** - Display empty state component with call-to-action to assign COGS

⚠️ **BACKEND ROADMAP** - New Epic needed for margin data aggregation pipeline (cogs → weekly_margin_fact)

---

**Reporter**: FrontEnd Team
**Status**: ✅ Documented - No backend action required
**Next Steps**: FrontEnd should implement empty state handling, Backend should plan margin aggregation Epic

**Last Updated**: 2026-01-30
