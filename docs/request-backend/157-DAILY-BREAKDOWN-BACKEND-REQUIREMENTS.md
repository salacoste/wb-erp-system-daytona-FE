# Request #157: Daily Breakdown Endpoints for Dashboard

## Problem Summary

Dashboard показывает секцию "Daily Breakdown" (ежедневная детализация), но бэкенд не предоставляет данные для ежедневной разбивки по финансам и рекламе.

---

## Current State

| Endpoint | Daily Breakdown | Status |
|----------|-----------------|--------|
| `/v1/analytics/orders/volume?include_cogs=true` | ✅ `by_day_with_cogs[]` | **WORKS** |
| `/v1/analytics/orders/trends?aggregation=day` | ✅ `trends[]` with revenue, ordersCount | **WORKS** |
| `/v1/analytics/daily/finance` | ❌ Endpoint не существует | **MISSING** |
| `/v1/analytics/advertising?include_daily=true` | ✅ `daily[]` with spend per day | **✅ RESOLVED (2026-02-28)** |

---

## What Frontend Shows Now

```
Daily Breakdown (W08, validated 2026-02-28)
├── Orders:      ✅ Shows real data (from orders/trends?aggregation=day)
├── Orders COGS: ✅ Shows real data (from orders/volume?include_cogs=true)
├── Advertising:  ✅ Shows real data (from advertising?include_daily=true)
├── Finance:     ⚠️ Shows zeros (backend not supported yet)
├── Logistics:   ✅ Shows real data
├── Storage:     ✅ Shows real data
└── Theor Profit: ✅ Calculated from other series
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

// Advertising - ✅ WORKS with include_daily=true (resolved 2026-02-28)
export async function getAdvertisingDailyData(from: string, to: string): Promise<AdvertisingDailyData[]> {
  const response = await apiClient.get(`/v1/analytics/advertising?from=${from}&to=${to}&include_daily=true`)
  return response.daily?.map(day => ({...})) ?? []  // ✅ daily[] now returned by backend
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

| Request | Problem | Solution | Effort | Status |
|---------|---------|----------|--------|--------|
| **#157.1** | No finance daily | New endpoint OR extend finance-summary | Medium | ❌ OPEN |
| **#157.2** | No advertising daily | Add `daily` field to advertising endpoint | Low | ✅ RESOLVED (2026-02-28) |

## Validation Evidence (2026-02-28)

**Advertising Daily** (`include_daily=true`):
- API: `GET /v1/analytics/advertising?from=2026-02-16&to=2026-02-22&include_daily=true` → HTTP 200
- Response: `daily[]` with 7 entries (Mon-Sun), all fields present (date, spend)
- Frontend chart: purple Реклама line shows non-zero data for all 7 days
- Table view: daily spend ranges from -707₽ to -1,543₽ (total -7,745₽ for W08)

**Frontend Integration** (2026-02-28):
- No code changes needed — `getAdvertisingDailyData()` already calls with `include_daily=true`
- `AdvertisingResponse.daily` type already defined in `src/lib/api/daily-analytics/types.ts`
- Aggregation pipeline in `src/lib/daily/aggregation.ts` maps `total_spend` to `DailyMetrics.advertising`
