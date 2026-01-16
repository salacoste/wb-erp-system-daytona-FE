# Request #52: Storage SKU Breakdown for Weekly Reports

**Date**: 2025-12-08
**Status**: Documentation
**Epic**: 24 (Paid Storage Analytics)

---

## Problem Statement

Weekly Report (`weekly_payout_summary`) contains only **aggregate** storage cost:
```json
{
  "week": "2025-W49",
  "storageCost": 1923.34  // Total for the week, NO per-product details!
}
```

Frontend needs **per-SKU storage costs** to:
1. Show storage cost breakdown by product in weekly analytics
2. Calculate per-product profitability (revenue - COGS - storage - logistics)
3. Identify high-storage-cost products

---

## Solution: Join Weekly Report with Paid Storage API

### Data Sources

| Source | Granularity | SKU Breakdown | Update Freq |
|--------|-------------|---------------|-------------|
| `weekly_payout_summary.storageCost` | Weekly total | ❌ No | Weekly (Mon 12:00 MSK) |
| `paid_storage_daily` | Daily per-SKU | ✅ Yes | Daily (06:00 MSK) |

### Data Accuracy (Verified W49: Dec 1-7, 2025)

```
Weekly Report storageCost:  1,923.34₽
Paid Storage API (sum):     1,949.52₽
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Difference:                    26.18₽ (1.36%)
```

✅ **Data sources match with 98.6% accuracy**

Small discrepancy (~1-2%) is expected due to:
- Different date attribution methods in WB systems
- Cutoff time differences (midnight vs business day boundary)

---

## API Endpoints for SKU Breakdown

### 1. Storage Summary for Date Range

```http
GET /v1/analytics/storage/summary?dateFrom=2025-12-01&dateTo=2025-12-07
X-Cabinet-Id: {cabinetId}
Authorization: Bearer {token}
```

Response:
```json
{
  "data": {
    "totalCost": 1949.52,
    "totalVolume": 1234.56,
    "daysCount": 7,
    "uniqueSkus": 195,
    "dateFrom": "2025-12-01",
    "dateTo": "2025-12-07"
  }
}
```

### 2. Per-SKU Storage Breakdown

```http
GET /v1/analytics/storage/by-sku?dateFrom=2025-12-01&dateTo=2025-12-07
X-Cabinet-Id: {cabinetId}
Authorization: Bearer {token}
```

Response:
```json
{
  "data": [
    {
      "nmId": 123456789,
      "vendorCode": "LL-20-WH",
      "brand": "MyBrand",
      "subject": "Лампа",
      "totalCost": 156.78,
      "totalVolume": 12.5,
      "avgDailyCost": 22.40,
      "daysStored": 7
    }
  ],
  "pagination": {
    "total": 195,
    "limit": 50,
    "offset": 0
  }
}
```

### 3. Daily Breakdown for Specific SKU

```http
GET /v1/analytics/storage/by-sku/{nmId}?dateFrom=2025-12-01&dateTo=2025-12-07
X-Cabinet-Id: {cabinetId}
```

Response:
```json
{
  "data": {
    "nmId": 123456789,
    "vendorCode": "LL-20-WH",
    "dailyData": [
      { "date": "2025-12-01", "cost": 22.32, "volume": 1.8, "warehouse": "Краснодар" },
      { "date": "2025-12-02", "cost": 22.45, "volume": 1.8, "warehouse": "Краснодар" }
    ],
    "totals": { "cost": 156.78, "volume": 12.6 }
  }
}
```

---

## Matching Weekly Report Period

### ISO Week to Date Range

```typescript
/**
 * Convert ISO week to date range for Paid Storage API
 * ISO week: Monday-Sunday, e.g. "2025-W49" = Dec 1-7, 2025
 */
function getWeekDateRange(isoWeek: string): { dateFrom: string; dateTo: string } {
  const [year, weekNum] = isoWeek.replace('W', '').split('-').map(Number);
  
  // Find first Monday of the year
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  
  // Calculate week start (Monday)
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
  
  // Calculate week end (Sunday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    dateFrom: weekStart.toISOString().slice(0, 10),
    dateTo: weekEnd.toISOString().slice(0, 10)
  };
}

// Example:
getWeekDateRange('2025-W49')
// { dateFrom: "2025-12-01", dateTo: "2025-12-07" }
```

---

## Integration Pattern

### Joining Weekly Report with Storage SKU Data

```typescript
interface WeeklyReportWithStorageBreakdown {
  week: string;
  
  // From weekly_payout_summary (official total)
  storageCostOfficial: number;
  
  // From paid_storage_daily (SKU breakdown)
  storageCostFromSkus: number;
  storageBySkus: StorageSkuData[];
  
  // Discrepancy tracking
  discrepancyAmount: number;
  discrepancyPercent: number;
  discrepancyStatus: 'ok' | 'warning' | 'error';
}

async function getWeeklyReportWithStorageBreakdown(
  cabinetId: string,
  week: string
): Promise<WeeklyReportWithStorageBreakdown> {
  const { dateFrom, dateTo } = getWeekDateRange(week);
  
  // Fetch both sources in parallel
  const [weeklyReport, storageBySkus] = await Promise.all([
    api.get(`/v1/analytics/weekly/${week}`),
    api.get(`/v1/analytics/storage/by-sku?dateFrom=${dateFrom}&dateTo=${dateTo}`)
  ]);
  
  const storageCostFromSkus = storageBySkus.data.reduce(
    (sum, sku) => sum + sku.totalCost, 0
  );
  
  const discrepancyAmount = Math.abs(
    weeklyReport.storageCost - storageCostFromSkus
  );
  const discrepancyPercent = (discrepancyAmount / weeklyReport.storageCost) * 100;
  
  return {
    week,
    storageCostOfficial: weeklyReport.storageCost,
    storageCostFromSkus,
    storageBySkus: storageBySkus.data,
    discrepancyAmount,
    discrepancyPercent,
    discrepancyStatus: getDiscrepancyStatus(discrepancyPercent)
  };
}

function getDiscrepancyStatus(percent: number): 'ok' | 'warning' | 'error' {
  if (percent < 3) return 'ok';      // Expected variance
  if (percent < 5) return 'warning'; // Investigate if recurring
  return 'error';                     // Data quality issue
}
```

---

## Important Notes

### 1. Which Storage Value to Display?

| Use Case | Recommended Source | Reason |
|----------|-------------------|--------|
| Dashboard "Storage" card | `storageCostOfficial` | Matches WB reports |
| Per-product breakdown | `storageBySkus` | Only available source |
| Product profitability | `storageBySkus` | Need per-SKU values |
| Reconciliation | Show both + diff | Transparency |

### 2. Expected Discrepancy (~1-2%)

Always expect small variance between sources:
```typescript
// UI: Show discrepancy status
{discrepancyPercent < 3 && (
  <Badge variant="success">✓ Data matches</Badge>
)}
{discrepancyPercent >= 3 && discrepancyPercent < 5 && (
  <Badge variant="warning">⚠ Small variance ({discrepancyPercent.toFixed(1)}%)</Badge>
)}
{discrepancyPercent >= 5 && (
  <Badge variant="error">⚠ Check data ({discrepancyPercent.toFixed(1)}%)</Badge>
)}
```

### 3. Data Availability

| Data | When Available |
|------|----------------|
| Storage for yesterday | 06:00 MSK today |
| Storage for today | Same day (may be partial) |
| Weekly Report | Monday 12:00 MSK (after week ends) |

**Important**: If querying for current week, Paid Storage API will have partial data!

### 4. Handling Missing Data

```typescript
// If no SKU data available for the week
if (storageBySkus.data.length === 0) {
  return {
    week,
    storageCostOfficial: weeklyReport.storageCost,
    storageCostFromSkus: null,
    storageBySkus: [],
    discrepancyStatus: null,
    notice: "Per-SKU storage data not available for this week"
  };
}
```

---

## Example: Product Profitability Card

```tsx
interface ProductProfitabilityProps {
  nmId: number;
  week: string;
  revenue: number;         // From weekly report
  cogs: number;            // From COGS table
  storageCost: number;     // From paid_storage_daily
  logisticsCost: number;   // From weekly report (allocated)
}

function ProductProfitabilityCard(props: ProductProfitabilityProps) {
  const profit = props.revenue - props.cogs - props.storageCost - props.logisticsCost;
  const margin = (profit / props.revenue) * 100;
  
  return (
    <Card>
      <CardHeader>{props.week} Profitability</CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Row label="Revenue" value={props.revenue} />
          <Row label="COGS" value={-props.cogs} negative />
          <Row label="Storage" value={-props.storageCost} negative />
          <Row label="Logistics" value={-props.logisticsCost} negative />
          <Separator />
          <Row label="Profit" value={profit} highlight />
          <Row label="Margin" value={`${margin.toFixed(1)}%`} />
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## Database Schema Reference

### paid_storage_daily

```sql
-- Key fields for frontend
SELECT
  nm_id,              -- Product ID (join with products/weekly_margin_fact)
  vendor_code,        -- Article for display
  warehouse_price,    -- Storage cost in RUB
  volume,             -- Volume in liters
  warehouse,          -- Warehouse name
  date                -- Storage date
FROM paid_storage_daily
WHERE cabinet_id = $1
  AND date BETWEEN $2 AND $3;
```

### Joining with Weekly Margin Data

```sql
-- Get product profitability for a week
SELECT 
  wmf.nm_id,
  wmf.sa_name,
  wmf.revenue_net_rub,
  wmf.cogs_rub,
  COALESCE(psd.storage_cost, 0) as storage_cost,
  wmf.revenue_net_rub - wmf.cogs_rub - COALESCE(psd.storage_cost, 0) as profit
FROM weekly_margin_fact wmf
LEFT JOIN (
  SELECT nm_id, SUM(warehouse_price) as storage_cost
  FROM paid_storage_daily
  WHERE cabinet_id = $1 AND date BETWEEN $2 AND $3
  GROUP BY nm_id
) psd ON wmf.nm_id = psd.nm_id
WHERE wmf.cabinet_id = $1 AND wmf.week = $4;
```

---

## Cron Schedules Reference

| Task | Cron | Time (MSK) | Description |
|------|------|------------|-------------|
| Paid Storage Import | `0 6 * * *` | 06:00 daily | Yesterday's storage data |
| Weekly Finance Import | `0 9 * * 1` | 12:00 Monday | Previous week's report |

---

## See Also

- [Request #51: Paid Storage Import Methods](./51-paid-storage-import-methods.md)
- [Request #36: Epic 24 Paid Storage Analytics API](./36-epic-24-paid-storage-analytics-api.md)
- [API Reference: Storage Analytics](../../../docs/API-PATHS-REFERENCE.md#storage-analytics-epic-24)
