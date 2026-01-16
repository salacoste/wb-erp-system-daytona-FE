# Backend Response: Request #54 - Supply Planning API Endpoint

**Date**: 2025-12-09
**Updated**: 2025-12-12 (Request #54 Frontend Clarification - Implementation Complete)
**Status**: ✅ **COMPLETE**
**Epic**: [Epic 28 - Supply Planning Analytics](/docs/epics/epic-28-supply-planning-analytics.md)
**Priority**: 🟡 P1 - HIGH
**Completed**: 25 Story Points
**Stories**: [docs/stories/epic-28/](/docs/stories/epic-28/)

---

## ✅ Implementation Summary

Epic 28 is **FULLY IMPLEMENTED** and deployed. All 7 stories completed.

### What's Available

| Component | Status | Description |
|-----------|--------|-------------|
| Stock levels | ✅ **READY** | WB Stocks API integrated via SDK analytics module |
| Stock snapshots table | ✅ **READY** | `inventory_snapshots` table with daily data |
| In-transit shipments | ✅ **READY** | `in_transit_shipments` table |
| Sales velocity | ✅ **READY** | Calculated from `wb_finance_raw` (1-13 weeks) |
| Daily sync job | ✅ **READY** | Cron at 06:00 MSK for all cabinets |
| API endpoint | ✅ **READY** | `GET /v1/analytics/supply-planning` |
| Caching | ✅ **READY** | Redis 15min TTL |

---

## API Endpoint

```
GET /v1/analytics/supply-planning
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `velocity_weeks` | number | 4 | Weeks for velocity calculation (1-13) |
| `safety_stock_days` | number | 14 | Target safety stock days (7-60) |
| `view_by` | enum | "sku" | "sku" \| "brand" \| "category" |
| `show_only` | enum | "all" | "all" \| "stockout_risk" \| "reorder_needed" |
| `sort_by` | string | "days_until_stockout" | Sort field |
| `sort_order` | string | "asc" | "asc" \| "desc" |
| `limit` | number | 100 | Max results (1-500) |

### Response Structure

```json
{
  "meta": {
    "cabinet_id": "uuid-here",
    "velocity_weeks": 4,
    "safety_stock_days": 14,
    "stocks_updated_at": "2025-12-09T06:00:00Z",
    "generated_at": "2025-12-12T10:00:00Z"
  },
  "summary": {
    "total_skus": 120,
    "out_of_stock_count": 3,
    "stockout_critical": 5,
    "stockout_warning": 8,
    "stockout_low": 15,
    "healthy_stock": 89,
    "reorder_urgent": 8,
    "reorder_soon": 12,
    "total_in_transit_units": 500,
    "total_reorder_value": 125000
  },
  "data": [
    {
      "sku_id": "12345",
      "product_name": "Widget Pro",
      "category": "Electronics",
      "brand": "BrandX",

      "current_stock": 150,
      "in_transit": 50,
      "effective_stock": 200,

      "avg_daily_sales": 10.5,
      "velocity_trend": "stable",
      "days_until_stockout": 19,
      "stockout_date": "2025-12-31",

      "stockout_risk": "low",
      "safety_stock_units": 147,
      "reorder_quantity": 0,
      "reorder_status": "ok",
      "reorder_value": 0,

      "cogs_per_unit": 450,
      "has_cogs": true,

      "warehouses": [
        {"name": "Коледино", "stock": 100},
        {"name": "Электросталь", "stock": 50}
      ]
    }
  ]
}
```

---

## Risk Classification

| Risk | Days Until Stockout | Color | Condition |
|------|---------------------|-------|-----------|
| `out_of_stock` | N/A | Black | current_stock = 0 |
| `critical` | 0-7 days | Red | stock > 0, immediate action |
| `warning` | 7-14 days | Orange | Plan order this week |
| `low` | 14-30 days | Yellow | Monitor, order soon |
| `healthy` | >30 days | Green | Stock sufficient |

> **Request #54 Clarification (2025-12-12)**: Added `out_of_stock` status for zero inventory SKUs.

---

## Reorder Status

| Status | Condition |
|--------|-----------|
| `urgent` | days_until_stockout < 7 |
| `soon` | days_until_stockout < safety_stock_days |
| `ok` | days_until_stockout >= safety_stock_days |

---

## Velocity Trend

| Trend | Condition |
|-------|-----------|
| `growing` | change > +10% |
| `stable` | change ±10% |
| `declining` | change < -10% |
| `no_data` | No sales history |

---

## Request #54 Frontend Clarification (2025-12-12)

The following enhancements were implemented based on frontend clarification:

### New Fields Added

| Field | Location | Description |
|-------|----------|-------------|
| `out_of_stock_count` | summary | Count of SKUs with zero inventory |
| `cogs_per_unit` | data[] | COGS per unit (₽), null if no COGS |
| `has_cogs` | data[] | Boolean flag indicating COGS availability |

### New Status Value

| Status | Description |
|--------|-------------|
| `out_of_stock` | SKU has zero current stock (higher priority than `critical`) |

---

## Formula Reference

### Days Until Stockout

```
effective_stock = current_stock + in_transit
avg_daily_sales = SUM(units_sold) / (velocity_weeks × 7)
days_until_stockout = effective_stock / avg_daily_sales
```

### Reorder Quantity

```
safety_stock_units = avg_daily_sales × safety_stock_days
reorder_quantity = MAX(0, safety_stock_units - effective_stock)
```

### Reorder Value

```
reorder_value = reorder_quantity × cogs_per_unit
// null if no COGS available
```

---

## Completed Stories

| Story | Points | Description | Status |
|-------|--------|-------------|--------|
| 28.1 | 5 | WB Stocks API Integration | ✅ Done |
| 28.2 | 3 | Database Schema & Migration | ✅ Done |
| 28.3 | 3 | Daily Stocks Sync Job | ✅ Done |
| 28.4 | 3 | Sales Velocity Calculation | ✅ Done |
| 28.5 | 5 | Supply Planning Service | ✅ Done |
| 28.6 | 3 | API Controller & DTOs | ✅ Done |
| 28.7 | 3 | Testing & Documentation | ✅ Done |
| **Total** | **25** | | **100%** |

---

## Frontend Integration Notes

1. ✅ **API READY** - Endpoint fully functional
2. ✅ **Stock freshness** - Response includes `stocks_updated_at`
3. ✅ **COGS integration** - `cogs_per_unit`, `has_cogs`, `reorder_value` available
4. ✅ **Zero stock handling** - `out_of_stock` status and `out_of_stock_count`
5. ✅ **Caching** - Redis 15min TTL for performance

---

## Caching Strategy

- **Redis cache**: 15 minute TTL
- **Cache key**: `supply-planning:{cabinet_id}:{params_hash}`
- **Invalidation**: On stock sync completion

---

## References

- Request: `frontend/docs/request-backend/54-supply-planning-api-endpoint.md`
- Clarification: `frontend/docs/request-backend/54-supply-planning-api-endpoint-frontend-clarification.md`
- Epic: `docs/epics/epic-28-supply-planning-analytics.md`
- Stories: `docs/stories/epic-28/`
- Frontend Epic: `frontend/docs/stories/6.0.supply-planning-epic.md`
- WB SDK: `daytona-wildberries-typescript-sdk` (Analytics module)
