# Request #157: Daily Breakdown Endpoints for Dashboard

## Problem Summary

Dashboard показывает секцию "Daily Breakdown" (ежедневная детализация), но бэкенд не предоставляет данные для ежедневной разбивки по финансам и рекламе.

---

## Current State

| Endpoint | Daily Breakdown | Status |
|----------|-----------------|--------|
| `/v1/analytics/orders/volume?include_cogs=true` | ✅ `by_day_with_cogs[]` | **WORKS** |
| `/v1/analytics/daily/finance` | ❌ Endpoint не существует | **MISSING** |
| `/v1/analytics/advertising` | ❌ Нет поля `daily` | **MISSING** |

---

## What Frontend Shows Now

```
Daily Breakdown (W07)
├── Orders:     ✅ Shows real data (from by_day_with_cogs)
├── Finance:    ⚠️ Shows zeros (empty array)
└── Advertising: ⚠️ Shows zeros (empty array)
```

---

## Requirements

### 1. Finance Daily Breakdown

**Option A: New Endpoint**
```http
GET /v1/analytics/daily/finance?from=2026-02-08&to=2026-02-14
```

**Response:**
```json
{
  "data": [
    {
      "date": "2026-02-08",
      "revenue_gross": 25000,
      "revenue_net": 18000,
      "cogs_total": 8000,
      "gross_profit": 10000,
      "margin_pct": 40.0
    },
    // ... more days
  ],
  "summary": {
    "total_revenue": 175000,
    "total_cogs": 58000,
    "avg_margin": 35.5
  }
}
```

**Option B: Extend finance-summary**
```http
GET /v1/analytics/weekly/finance-summary?week=2026-W07&include_daily=true
```

Add `daily_breakdown[]` to existing response.

---

### 2. Advertising Daily Breakdown

**Option A: Extend existing endpoint**
```http
GET /v1/analytics/advertising?from=2026-02-08&to=2026-02-14&include_daily=true
```

**Add to response:**
```json
{
  "items": [...],
  "summary": {...},
  "daily": [
    {
      "date": "2026-02-08",
      "spend": 1500.00,
      "views": 2500,
      "clicks": 150,
      "ctr": 6.0,
      "cpc": 10.0,
      "orders": 5,
      "revenue_attributed": 12000
    },
    // ... more days
  ]
}
```

**Option B: New endpoint**
```http
GET /v1/analytics/advertising/daily?from=2026-02-08&to=2026-02-14
```

---

## Data Sources

### Finance Daily
- **Source**: `wb_finance_raw` aggregated by date
- **Fields needed**:
  - `date`
  - `sales_gross`, `returns_gross`, `sale_gross`
  - `to_pay` (revenue_net)
  - `cogs` (from COGS table JOIN)
  - `margin`

### Advertising Daily
- **Source**: `adv_daily_stats` already has daily data!
- **Just need to expose it** in the API response

---

## Frontend Code Ready

Frontend уже имеет типы и обработку:

```typescript
// src/lib/api/daily-analytics/api.ts

// Finance - currently returns []
export async function getFinanceDailyData(_from: string, _to: string): Promise<FinanceDailyData[]> {
  // TODO: Call backend when endpoint exists
  return []
}

// Advertising - currently checks for response.daily which doesn't exist
export async function getAdvertisingDailyData(from: string, to: string): Promise<AdvertisingDailyData[]> {
  const response = await apiClient.get(`/v1/analytics/advertising?from=${from}&to=${to}`)
  return response.daily?.map(day => ({...})) ?? []  // daily is undefined!
}
```

---

## Priority

**MEDIUM** — Dashboard работает, но daily breakdown показывает неполные данные.

---

## Related

- Epic 62/63: Dashboard UI/UX
- Component: `DailyBreakdownSection.tsx`
- Hook: `useDailyMetrics.ts`
- Memory: "Daily Breakdown Architecture (Epic 61/62)"

---

## Summary Table

| Request | Problem | Solution | Effort |
|---------|---------|----------|--------|
| **#157.1** | No finance daily | New endpoint OR extend finance-summary | Medium |
| **#157.2** | No advertising daily | Add `daily` field to advertising endpoint | Low (data exists in adv_daily_stats) |
