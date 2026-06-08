# Request #210: Buyout Analytics Daily Granularity

## Problem
The buyout analytics page (`/analytics/buyout`) currently only shows aggregated period-level data. There is no daily time-series breakdown for buyout rates, preventing users from identifying trends and anomalies over time.

## Current State
- `GET /v1/analytics/buyout/by-sku` — returns per-SKU aggregated data for the entire `from`-`to` range
- `GET /v1/analytics/buyout/summary` — returns cabinet-level summary for the `from`-`to` range
- No `groupBy`, `include_daily`, or `aggregation` parameter exists

## Requested Enhancement
Add daily granularity to the buyout analytics endpoints, similar to how advertising analytics supports `include_daily: boolean`.

### Option A: Add `include_daily` parameter to existing endpoints
```
GET /v1/analytics/buyout/by-sku?from=...&to=...&include_daily=true
```
Response adds a `daily` array:
```json
{
  "data": [...],
  "daily": [
    { "date": "2026-06-01", "buyoutRate": 0.82, "returnRate": 0.05, "ordersCount": 150 },
    { "date": "2026-06-02", "buyoutRate": 0.79, "returnRate": 0.06, "ordersCount": 142 }
  ]
}
```

### Option B: New dedicated endpoint
```
GET /v1/analytics/buyout/daily?from=...&to=...
```

### Fields needed per day
- `date` (YYYY-MM-DD)
- `buyoutRate` (0-1 float)
- `returnRate` (0-1 float)
- `ordersCount` (integer)

## Impact
- Enables daily trend chart on buyout analytics page
- Allows users to spot buyout rate drops and correlate with external events

## Status: DELIVERED (2026-06-09)

Implemented as `GET /v1/analytics/buyout/daily` (Option B — dedicated endpoint).
Service: `BuyoutDailyService` in `src/analytics/services/`.
Returns daily buyout rate, return rate, and orders count per day for the requested date range.

## Priority
P2 (Feature Enhancement)
