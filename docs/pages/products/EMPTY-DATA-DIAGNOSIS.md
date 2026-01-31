# Empty Dashboard Data - Diagnostic Guide

**Issue**: Dashboard shows "Нет данных за выбранный период" (No data for selected period)

**Context**:
- **Cabinet ID**: `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`
- **Test Credentials**: `test@test.com` / `Russia23!`
- **Period Shown**: 20-26 Jan 2026 (Week 2026-W04)
- **Backend Status**: COGS data filled for weeks 2025-W47 to 2026-W04

**Created**: 2026-01-30

---

## Quick Diagnosis Checklist

Run the test file `test-api/diagnose-empty-data.http` in order:

1. **Login** - Get JWT token
2. **Available Weeks** - Check if 2026-W04 is in the list
3. **Finance Summary** - Verify data exists for 2026-W04
4. **Advertising Analytics** - Check advertising data for Jan 20-26
5. **COGS Data** - Verify COGS is assigned
6. **Period Calculation** - Confirm frontend/backend week alignment

---

## Common Causes & Solutions

### Cause 1: Backend Has Not Processed Week 2026-W04

**Symptoms**:
- `GET /v1/analytics/weekly/available-weeks` does NOT include `2026-W04`
- All finance-summary calls return `null` or empty

**Solution**:
- Wait for backend to process the week (usually within 24 hours)
- Check a week that IS in the available-weeks list (e.g., 2025-W47)
- Verify backend processing tasks are running

---

### Cause 2: No Data for Specific Cabinet

**Symptoms**:
- Available weeks includes 2026-W04
- But `finance-summary?week=2026-W04` returns `null` for YOUR cabinet
- Other cabinets may have data

**Solution**:
- Verify cabinet ID is correct: `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`
- Check if weekly_payout_summary table has rows for this cabinet + week
- Check if weekly_margin_fact table has margin data for this cabinet + week

**SQL Check**:
```sql
-- Check payout data
SELECT * FROM weekly_payout_summary
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
AND week = '2026-W04';

-- Check margin data
SELECT * FROM weekly_margin_fact
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
AND week = '2026-W04';
```

---

### Cause 3: Advertising Data Not Synced

**Symptoms**:
- Finance data loads but advertising widget shows empty
- `sync-status` shows `health_status: "stale"` or old `lastSyncAt`

**Solution**:
- Check advertising sync status endpoint
- Verify daily advertising sync job is running
- Check dataAvailableFrom/dataAvailableTo in sync status

**Expected Sync Status**:
```json
{
  "status": "healthy",
  "lastSyncAt": "2026-01-30T06:00:00Z",
  "dataAvailableFrom": "2025-12-01",
  "dataAvailableTo": "2026-01-29"
}
```

---

### Cause 4: Week Date Range Mismatch (Frontend vs Backend)

**Symptoms**:
- Data exists for the week but frontend shows empty
- Week calculations differ between systems

**Solution**:
- Frontend uses ISO 8601 week definition (Monday-Sunday)
- Week 2026-W04 = Mon Jan 20 to Sun Jan 26, 2026
- Verify backend uses same week definition

**Test**:
```bash
# Frontend calculation (date-fns)
startOfISOWeek(new Date(2026, 0, 22))  # → 2026-01-20
endOfISOWeek(new Date(2026, 0, 22))    # → 2026-01-26

# Backend should return data for this exact range:
GET /v1/analytics/advertising?from=2026-01-20&to=2026-01-26
```

---

### Cause 5: COGS Not Assigned (No Margin Calculation)

**Symptoms**:
- Payout data loads (К перечислению shows value)
- But Маржа % shows null/empty
- COGS coverage = 0%

**Solution**:
- Assign COGS to products in COGS management page
- Margin calculation requires COGS data
- Check products_with_cogs count

**Expected COGS Coverage**:
```json
{
  "products_total": 100,
  "products_with_cogs": 80,
  "cogs_coverage_pct": 80.0
}
```

---

## Frontend API Call Analysis

### Dashboard Period Calculation

The frontend uses `DashboardPeriodContext` to manage period selection:

**Week Mode** (default):
- Selected week: `2026-W04` (from `getLastCompletedWeek()`)
- Date range: Mon Jan 20 to Sun Jan 26, 2026
- API call: `/v1/analytics/weekly/finance-summary?week=2026-W04`

**Month Mode**:
- Selected month: `2026-01`
- Date range: Jan 1 to Jan 31, 2026
- API call: Aggregates weeks 2026-W01 to 2026-W05

**Key Files**:
- `/src/contexts/dashboard-period-context.tsx` - Period state management
- `/src/lib/date-utils.ts` - Week/month to date range conversion
- `/src/hooks/useDashboardMetricsWithPeriod.ts` - Data fetching hook

### Advertising Widget Date Range

**Story 60.6-FE**: Sync with global dashboard period

```typescript
// DashboardContent.tsx (lines 86-91)
const advertisingDateRange = useMemo(() => {
  if (periodType === 'week') {
    return weekToDateRange(selectedWeek)  // 2026-W04 → {from: '2026-01-20', to: '2026-01-26'}
  }
  return monthToDateRange(selectedMonth)
}, [periodType, selectedWeek, selectedMonth])
```

**Widget calls**:
```typescript
useAdvertisingAnalytics({
  from: advertisingDateRange.from,  // '2026-01-20'
  to: advertisingDateRange.to,      // '2026-01-26'
  limit: 1,
})
```

---

## Step-by-Step Verification

### Step 1: Verify Authentication

```http
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "Russia23!"
}
```

**Expected**: JWT token in response

---

### Step 2: Check Available Weeks

```http
GET http://localhost:3000/v1/analytics/weekly/available-weeks
Authorization: Bearer <TOKEN>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

**Expected**: Array including `2026-W04` or later weeks

**If missing**: Backend has not processed week 2026-W04

---

### Step 3: Get Finance Summary

```http
GET http://localhost:3000/v1/analytics/weekly/finance-summary?week=2026-W04
Authorization: Bearer <TOKEN>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

**Expected Response**:
```json
{
  "summary_total": {
    "to_pay_goods_total": 123456.78,
    "sale_gross_total": 234567.89,
    "gross_profit": 50000.00,
    "cogs_total": 150000.00,
    "products_total": 100,
    "products_with_cogs": 80
  },
  "meta": {
    "week": "2026-W04",
    "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
    "generated_at": "2026-01-30T10:00:00Z"
  }
}
```

**If `summary_total` is `null`**: No data for this week/cabinet

---

### Step 4: Get Advertising Analytics

```http
GET http://localhost:3000/v1/analytics/advertising?from=2026-01-20&to=2026-01-26&limit=1
Authorization: Bearer <TOKEN>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

**Expected Response**:
```json
{
  "summary": {
    "total_spend": 5000.00,
    "total_sales": 25000.00,
    "overall_roas": 5.0,
    "total_organic_sales": 15000.00
  },
  "data": [...]
}
```

**If `data` array is empty**: No advertising campaigns for this period

---

### Step 5: Check Advertising Sync Status

```http
GET http://localhost:3000/v1/analytics/advertising/sync-status
Authorization: Bearer <TOKEN>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

**Expected**: `health_status: "healthy"`, recent `lastSyncAt`

---

### Step 6: Verify COGS Data

```http
GET http://localhost:3000/v1/products?include_cogs=true&limit=1
Authorization: Bearer <TOKEN>
X-Cabinet-Id: f75836f7-c0bc-4b2c-823c-a1f3508cce8e
```

**Expected**: `pagination.total > 0` (products with COGS)

---

## Solutions to Try

### Solution 1: Select Different Week

If 2026-W04 is not processed yet:
1. Use week selector to choose 2025-W47 (first week with COGS)
2. Or select any week from available-weeks list
3. Dashboard should load data for that week

### Solution 2: Assign COGS

If payout data loads but margin is null:
1. Navigate to COGS page (`/cogs`)
2. Assign COGS to products
3. Margin calculation will run automatically
4. Dashboard will show gross_profit after COGS assigned

### Solution 3: Trigger Advertising Sync

If advertising data is stale:
1. Navigate to Advertising Analytics page
2. Check sync status
3. If stale, contact backend to trigger manual sync

### Solution 4: Check Cabinet Context

If wrong cabinet is selected:
1. Check localStorage for cabinet selection
2. Verify X-Cabinet-Id header in API calls
3. Switch to correct cabinet if multiple exist

---

## Backend Database Checks

If you have database access, run these queries:

```sql
-- 1. Check if week exists in payout_summary
SELECT week, COUNT(*) FROM weekly_payout_summary
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
GROUP BY week
ORDER BY week DESC;

-- 2. Check if week exists in margin_fact
SELECT week, COUNT(*) FROM weekly_margin_fact
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
GROUP BY week
ORDER BY week DESC;

-- 3. Check advertising data
SELECT DATE(created_at) as date, COUNT(*)
FROM advertising_stats
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
AND created_at >= '2026-01-20'
AND created_at < '2026-01-27'
GROUP BY DATE(created_at)
ORDER BY date;

-- 4. Check COGS assignment
SELECT COUNT(DISTINCT nm_id) FROM cogs
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e';
```

---

## Expected Data Flow

```
User selects week 2026-W04
        ↓
Frontend: DashboardPeriodContext
        ↓
weekToDateRange('2026-W04')
        ↓
Returns: { from: '2026-01-20', to: '2026-01-26' }
        ↓
useDashboardMetricsWithComparison()
        ↓
API: GET /v1/analytics/weekly/finance-summary?week=2026-W04
        ↓
Backend: weekly_payout_summary + weekly_margin_fact
        ↓
Response: summary_total with metrics
        ↓
Frontend: MetricCardEnhanced displays values
```

---

## Contact Backend Team

If all API calls fail unexpectedly:

1. **Include in ticket**:
   - Cabinet ID: `f75836f7-c0bc-4b2c-823c-a1f3508cce8e`
   - Week: `2026-W04`
   - API responses from diagnostic tests
   - Frontend period calculation output

2. **Backend tasks to check**:
   - Is weekly report import running for this cabinet?
   - Does `weekly_payout_summary` have data for 2026-W04?
   - Does `weekly_margin_fact` have data for 2026-W04?
   - Is advertising daily sync running?

3. **Backend queries**:
   ```sql
   -- Check recent imports
   SELECT * FROM imports
   WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
   ORDER BY created_at DESC
   LIMIT 5;

   -- Check processing tasks
   SELECT * FROM task_queue
   WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

## Related Documentation

- **API Integration Guide**: `docs/api-integration-guide.md`
- **Frontend Spec**: `docs/front-end-spec.md`
- **Business Logic**: `docs/BUSINESS-LOGIC-REFERENCE.md`
- **Backend API Docs**: `/test-api/*.http` (in backend repo)
