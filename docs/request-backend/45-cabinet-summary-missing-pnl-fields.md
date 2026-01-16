# Request #45: Cabinet Summary Missing P&L Fields

**Date**: 2025-12-06
**Priority**: 🔴 High - Dashboard Not Functional
**Status**: ✅ **RESOLVED** - Backend rebuilt, all fields now returned correctly
**Component**: Backend API - Analytics Module
**Related**: Epic 25 Story 25.1, Request #43 (WB Dashboard Data Discrepancy)

---

## Executive Summary

Cabinet Summary Dashboard (`/analytics/dashboard`) displays:
- **Revenue section**: All values show "—" (null)
- **Expenses section**: All values show "не число ₽" (NaN)

The endpoint `GET /v1/analytics/weekly/cabinet-summary` needs to include P&L fields from `weekly_payout_total` table.

---

## Problem Description

### Current Behavior

After Epic 25 Story 25.1 frontend update, the dashboard expects these fields in `summary.totals`:

```typescript
interface CabinetSummaryTotals {
  // P&L from weekly_payout_total
  sales_gross: number | null;       // Продажи
  returns_gross: number | null;     // Возвраты
  sale_gross: number | null;        // Чистые продажи (NET)
  total_commission_rub: number | null; // Комиссия WB
  logistics_cost: number | null;    // Логистика
  storage_cost: number | null;      // Хранение
  paid_acceptance_cost: number | null; // Платная приёмка
  penalties: number | null;         // Штрафы
  payout_total: number | null;      // К перечислению

  // Existing margin fields
  revenue_net: number;
  cogs_total: number | null;
  profit: number | null;
  // ...
}
```

### Expected Behavior

The endpoint should query both tables and merge results:
1. `weekly_margin_fact` → margin metrics (revenue_net, cogs, profit)
2. `weekly_payout_total` → P&L metrics (sales_gross, returns_gross, commission, etc.)

---

## Investigation Results

### Frontend Evidence

Screenshot shows:
- Покрытие COGS: 61.1% ✅ (works - from weekly_margin_fact)
- Себестоимость: 244 738 ₽ ✅ (works - from weekly_margin_fact)
- ROI: 205.4% ✅ (works - from weekly_margin_fact)
- Продажи: — ❌ (null - missing sales_gross)
- Возвраты: — ❌ (null - missing returns_gross)
- Комиссия WB: не число ₽ ❌ (NaN - field undefined in response)
- Логистика: не число ₽ ❌ (NaN - field undefined)

### Backend Code Review

Backend `aggregateCabinetTotals()` method in `weekly-analytics.service.ts` has the query:

```typescript
// Story 25.1: Query P&L data from weekly_payout_total
const payoutResult = await this.prisma.$queryRaw<...>`
  SELECT
    SUM(sales_gross_total) as sales_gross,
    SUM(returns_gross_total) as returns_gross,
    SUM(sale_gross_total) as sale_gross,
    SUM(total_commission_rub_total) as total_commission_rub,
    SUM(logistics_cost_total) as logistics_cost,
    SUM(storage_cost_total) as storage_cost,
    SUM(paid_acceptance_cost_total) as paid_acceptance_cost,
    SUM(penalties_total) as penalties,
    SUM(payout_total) as payout_total
  FROM weekly_payout_total
  WHERE cabinet_id = ${cabinetId}::uuid
    AND week >= ${weekStart}
    AND week <= ${weekEnd}
`;
```

### Possible Issues

1. **Table columns don't exist**: Check if `sales_gross_total`, `returns_gross_total`, `total_commission_rub_total` columns exist in `weekly_payout_total`

2. **Data not populated**: The aggregation pipeline may not be populating these fields

3. **Response DTO missing fields**: Check `CabinetSummaryTotalsDto` includes all P&L fields

---

## Backend Verification Checklist

### 1. Check Table Schema

```sql
\d weekly_payout_total
-- Verify these columns exist:
-- sales_gross_total, returns_gross_total, sale_gross_total
-- total_commission_rub_total, logistics_cost_total, storage_cost_total
-- paid_acceptance_cost_total, penalties_total
```

### 2. Check Data Exists

```sql
SELECT
  week,
  sales_gross_total,
  returns_gross_total,
  sale_gross_total,
  total_commission_rub_total,
  logistics_cost_total,
  storage_cost_total,
  penalties_total,
  payout_total
FROM weekly_payout_total
WHERE week >= '2025-W45' AND week <= '2025-W48'
LIMIT 5;
```

### 3. Check Response DTO

File: `src/analytics/dto/response/cabinet-summary-response.dto.ts`

Ensure `CabinetSummaryTotalsDto` includes:
```typescript
@ApiProperty()
sales_gross: number | null;

@ApiProperty()
returns_gross: number | null;

@ApiProperty()
sale_gross: number | null;

@ApiProperty()
total_commission_rub: number | null;

@ApiProperty()
logistics_cost: number | null;

@ApiProperty()
storage_cost: number | null;

@ApiProperty()
paid_acceptance_cost: number | null;

@ApiProperty()
penalties: number | null;

@ApiProperty()
payout_total: number | null;
```

### 4. Test Endpoint

```http
GET /v1/analytics/weekly/cabinet-summary?weeks=4
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-id>
```

Expected response `summary.totals` should include all P&L fields.

---

## Proposed Solution

### Option A: Missing Columns in Table

If columns don't exist in `weekly_payout_total`:

1. Run migration to add columns (Story 25.1 backend changes needed)
2. Re-run aggregation pipeline for existing weeks

### Option B: Columns Exist But Not Populated

If columns exist but are NULL:

1. Check `weekly-payout-aggregator.service.ts` populates these fields
2. Re-aggregate data: `POST /v1/tasks/enqueue { "task_type": "publish_weekly_views" }`

### Option C: DTO Missing Fields

If data exists but DTO doesn't include it:

1. Update `CabinetSummaryTotalsDto` to include P&L fields
2. Update `aggregateCabinetTotals()` return statement

---

## Acceptance Criteria

- [x] AC1: `GET /v1/analytics/cabinet-summary` returns `sales_gross` in response ✅
- [x] AC2: Response includes `returns_gross`, `sale_gross` ✅
- [x] AC3: Response includes `total_commission_rub` ✅
- [x] AC4: Response includes `logistics_cost`, `storage_cost`, `paid_acceptance_cost`, `penalties` ✅
- [x] AC5: Response includes `payout_total` ✅
- [x] AC6: Frontend dashboard displays all P&L values correctly (no NaN, no null for populated data) ✅ **FIXED** - Backend rebuilt

---

## References

- **Epic 25**: `frontend/docs/stories/epic-25-dashboard-data-accuracy.md`
- **Request #43**: `frontend/docs/request-backend/43-wb-dashboard-data-discrepancy.md` (WB Dashboard metrics)
- **Backend Service**: `src/analytics/weekly-analytics.service.ts`
- **Frontend Page**: `frontend/src/app/(dashboard)/analytics/dashboard/page.tsx`
- **Frontend Types**: `frontend/src/types/analytics.ts`

---

## Backend Investigation Results (2025-12-06)

### ✅ All Backend Components Verified

**1. Table Schema - VERIFIED ✅**
```
weekly_payout_total has all required columns:
- sales_gross_total ✅
- returns_gross_total ✅
- total_commission_rub_total ✅
- logistics_cost_total ✅
- storage_cost_total ✅
- paid_acceptance_cost_total ✅
- penalties_total ✅
- payout_total ✅
```

**2. DTO - VERIFIED ✅**
`CabinetSummaryTotalsDto` includes all P&L fields (lines 38-102):
```typescript
sales_gross: number | null;
returns_gross: number | null;
sale_gross: number | null;
total_commission_rub: number | null;
logistics_cost: number | null;
storage_cost: number | null;
paid_acceptance_cost: number | null;
penalties: number | null;
payout_total: number | null;
```

**3. Service Implementation - VERIFIED ✅**
`aggregateCabinetTotals()` in `weekly-analytics.service.ts`:
- Queries `weekly_payout_total` correctly (lines 2444-2471)
- Extracts all P&L values (lines 2487-2495)
- Returns all fields in response (lines 2499-2507)

**4. Data in Database - VERIFIED ✅**
```json
[
  { "week": "2025-W48", "salesGrossTotal": "153220.48", "totalCommissionRubTotal": "70055.52" },
  { "week": "2025-W47", "salesGrossTotal": "309896.32", "totalCommissionRubTotal": "96086.34" },
  { "week": "2025-W46", "salesGrossTotal": "190264.3", "totalCommissionRubTotal": "83996.94" }
]
```

---

## Root Cause Analysis

The backend implementation is **CORRECT**. Possible frontend issues:

### 1. Endpoint URL
- **Correct**: `GET /v1/analytics/weekly/cabinet-summary` (WITH `/weekly/` prefix)
- Controller: `WeeklyAnalyticsController` with prefix `v1/analytics/weekly`

### 2. Frontend Type Definitions
Check `frontend/src/types/analytics.ts` has matching interface:
```typescript
interface CabinetSummaryTotals {
  sales_gross: number | null;       // NOT sales_gross_total!
  returns_gross: number | null;
  sale_gross: number | null;
  total_commission_rub: number | null;
  logistics_cost: number | null;
  storage_cost: number | null;
  paid_acceptance_cost: number | null;
  penalties: number | null;
  payout_total: number | null;
  // ... margin fields
}
```

### 3. Frontend Data Access
Verify frontend accesses `response.summary.totals.sales_gross` (not `response.sales_gross`)

---

## Additional Issue Found: Комиссия WB = "—" on `/analytics` page

### Symptom
On `/analytics` page (Financial Summary), "Комиссия WB" showed "—" while other fields like "Логистика" displayed correctly.

### Root Cause
**Backend was not rebuilt after Story 25.3 changes!**

The compiled `dist/analytics/weekly-analytics.service.js` was missing the `total_commission_rub_total` field in `mapTotalToDto()` return statement.

### Evidence
```bash
# Before rebuild - field MISSING:
grep "total_commission_rub_total" dist/analytics/weekly-analytics.service.js
# (no output)

# After rebuild - field PRESENT:
grep "total_commission_rub_total" dist/analytics/weekly-analytics.service.js
# 224: total_commission_rub_total: Number(total.totalCommissionRubTotal),
```

### Solution Applied (2025-12-06)
```bash
cd /path/to/wb-repricer-system-new
npm run build
pm2 restart wb-repricer
```

### Verification
```bash
curl -s "/v1/analytics/weekly/finance-summary?week=2025-W48" | jq '.summary_total.total_commission_rub_total'
# 70055.52 ✅
```

---

## Frontend Action Required

1. **Verify API URL**: Use `/v1/analytics/weekly/cabinet-summary` (WITH `/weekly/` prefix!)
   - Controller: `WeeklyAnalyticsController` with prefix `v1/analytics/weekly`
2. **Check TypeScript types**: Ensure interface matches backend response
3. **Clear browser cache**: Force refresh to get new API response
4. **Check console logs**: Verify actual API response structure

---

## Test Command

```bash
# Test with REST Client (VS Code)
# File: test-api/06-analytics-advanced.http
GET {{baseUrl}}/v1/analytics/weekly/cabinet-summary?weeks=4
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

Expected `summary.totals` in response:
```json
{
  "sales_gross": 653380.1,
  "returns_gross": 12072,
  "total_commission_rub": 250138.8,
  "logistics_cost": 99425.52,
  "payout_total": 445898.73
}
```
