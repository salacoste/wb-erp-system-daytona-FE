# Request #211: Returns Analytics Daily Granularity

## Problem
The returns analytics page (`/analytics/returns`) currently only shows aggregated period-level data. There is no daily time-series breakdown for return counts/rates, preventing users from identifying return spikes and trends.

## Current State
- `GET /v1/analytics/returns/reasons` — aggregated return reasons for the date range
- `GET /v1/analytics/returns/reasons/by-sku` — per-SKU return breakdown
- No `groupBy`, `include_daily`, or `aggregation` parameter exists

## Requested Enhancement
Add daily granularity to the returns analytics endpoints, similar to advertising's `include_daily`.

### Option A: Add `include_daily` parameter
```
GET /v1/analytics/returns/reasons?from=...&to=...&include_daily=true
```
Response adds a `daily` array:
```json
{
  "data": [...],
  "daily": [
    { "date": "2026-06-01", "totalReturns": 45, "returnRate": 0.03, "cancellations": 20, "refusals": 15, "defects": 10 },
    { "date": "2026-06-02", "totalReturns": 38, "returnRate": 0.025, "cancellations": 18, "refusals": 12, "defects": 8 }
  ]
}
```

### Option B: New dedicated endpoint
```
GET /v1/analytics/returns/daily?from=...&to=...
```

### Fields needed per day
- `date` (YYYY-MM-DD)
- `totalReturns` (integer)
- `returnRate` (0-1 float)
- `cancellations` (integer) — cancelled before shipment
- `refusals` (integer) — refused at pickup
- `defects` (integer) — returned due to defect

## Impact
- Enables daily trend chart on returns analytics page
- Allows users to spot return spikes and correlate with specific events

## Status: DELIVERED (2026-06-09)

Implemented as `GET /v1/analytics/returns/daily` (Option B — dedicated endpoint).
Service: `ReturnsDailyService` in `src/analytics/services/`.
Returns daily total returns, return rate, cancellations, refusals, and defects per day for the requested date range.

## Priority
P2 (Feature Enhancement)
