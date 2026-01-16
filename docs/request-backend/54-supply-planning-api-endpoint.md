# Request #54: Supply Planning API Endpoint

**Date**: 2025-12-09
**Priority**: P0 - CRITICAL
**Epic**: Epic 6 - Supply Planning & Stockout Prevention
**Frontend Story**: `docs/stories/6.1.supply-planning-api-integration.md`
**Source PRD**: `../our_service_full_analytics/phase_one/PAGE_07_SUPPLY_PLANNING.md`
**Status**: ✅ **COMPLETE** (Backend Epic 28)

---

## Backend Implementation

**Backend Epic**: `docs/stories/epic-28/README.md`
**Backend Epic Doc**: `docs/epics/epic-28-supply-planning-analytics.md`
**Completed**: 2025-12-10
**Frontend Clarification**: `54-supply-planning-api-endpoint-frontend-clarification.md`

---

## Summary

Необходим новый API endpoint для получения данных планирования поставок: текущие остатки, скорость продаж, дней до стокаута, рекомендации по заказу.

---

## Business Context

**Problem**: Stockouts Kill Revenue
```
Average seller: 10-20% revenue loss from stockouts annually
Most don't even know which products will run out
Reactive problem (discover after it happens)
```

**Solution**: Predictive analytics endpoint that:
- Calculates order velocity (7-day rolling average)
- Predicts days until stockout
- Recommends reorder quantities
- Classifies risk status (critical/warning/monitor/safe)

---

## API Specification

### Endpoint

```
GET /v1/analytics/supply-planning
```

### Headers (Required)

| Header | Description |
|--------|-------------|
| `Authorization` | Bearer JWT token |
| `X-Cabinet-Id` | Cabinet UUID |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `planning_horizon` | number | No | 30 | Days to plan for: 7, 14, 30, 60 |
| `safety_buffer` | number | No | 25 | Safety buffer %: 15-50 |
| `status_filter` | enum | No | "all" | Filter: "critical" \| "warning" \| "monitor" \| "safe" \| "all" |
| `sort_by` | string | No | "days_until_stockout" | Sort field |
| `sort_order` | enum | No | "asc" | Sort order: "asc" \| "desc" |
| `limit` | number | No | 100 | Max results (max: 500) |

### Response Format

```json
{
  "meta": {
    "cabinet_id": "uuid-here",
    "planning_horizon": 30,
    "safety_buffer": 25,
    "generated_at": "2025-12-09T10:00:00Z",
    "stock_data_updated_at": "2025-12-09T09:45:00Z"
  },
  "summary": {
    "critical_count": 5,
    "warning_count": 12,
    "monitor_count": 20,
    "safe_count": 63,
    "total_sku_count": 100,
    "total_potential_loss_7d": 525000,
    "total_recommended_capital": 1250000
  },
  "data": [
    {
      "sku_id": "12345",
      "product_name": "Widget Pro",
      "category": "Electronics",
      "brand": "BrandX",

      "stock_qty": 15,
      "in_transit_qty": 0,
      "effective_stock": 15,

      "velocity_units_per_day": 8.2,
      "velocity_trend": "stable",
      "velocity_7d_total": 57,

      "days_until_stockout": 2,
      "stockout_date": "2025-12-11",
      "stockout_status": "critical",

      "recommended_reorder_qty": 293,
      "recommended_reorder_value": 131850,
      "reorder_reasoning": {
        "expected_demand": 246,
        "target_stock": 308,
        "current_effective": 15
      },

      "potential_loss_7d": 57400,
      "avg_selling_price": 1000,
      "cogs_per_unit": 450,
      "margin_pct": 25.0,

      "supplier": {
        "name": "МегаСнаб ООО",
        "contact": "+7 999 123-45-67",
        "last_order_date": "2025-11-15",
        "last_order_qty": 200,
        "avg_lead_time_days": 7
      }
    }
  ]
}
```

### Risk Status Classification

| Status | Days Until Stockout | Severity |
|--------|---------------------|----------|
| `critical` | 1-3 days | Immediate action needed |
| `warning` | 4-7 days | Order this week |
| `monitor` | 8-14 days | Plan ahead |
| `safe` | 15+ days | Stock sufficient |

```javascript
function getStockoutStatus(days_until_stockout) {
  if (days_until_stockout <= 3) return 'critical';
  if (days_until_stockout <= 7) return 'warning';
  if (days_until_stockout <= 14) return 'monitor';
  return 'safe';
}
```

---

## Core Formulas

### 1. Order Velocity (7-Day Rolling Average)

```javascript
function calculateOrderVelocity(sku_id, cabinet_id) {
  // Get last 7 days of sales
  const sales = await getSales({
    sku_id,
    cabinet_id,
    date_from: today() - 7,
    date_to: today(),
    exclude_cancelled: true,
    exclude_returned: true
  });

  const total_units = sales.reduce((sum, s) => sum + s.qty, 0);
  const velocity = total_units / 7;

  return {
    velocity_units_per_day: round(velocity, 1),
    velocity_7d_total: total_units
  };
}
```

### 2. Days Until Stockout

```javascript
function calculateDaysUntilStockout(sku_id, cabinet_id) {
  const stock_qty = getCurrentStock(sku_id); // From WB API or inventory_snapshot
  const in_transit_qty = getInTransitQty(sku_id, cabinet_id); // From in_transit_shipments
  const velocity = calculateOrderVelocity(sku_id, cabinet_id);

  const effective_stock = stock_qty + in_transit_qty;

  if (velocity.velocity_units_per_day <= 0) {
    return 999; // No sales = infinite days (but also a problem!)
  }

  const days = Math.floor(effective_stock / velocity.velocity_units_per_day);

  return {
    days_until_stockout: days,
    stockout_date: addDays(today(), days),
    stock_qty,
    in_transit_qty,
    effective_stock
  };
}
```

### 3. Recommended Reorder Quantity

```javascript
function calculateReorderQty(sku_id, cabinet_id, planning_horizon, safety_buffer_pct) {
  const velocity = calculateOrderVelocity(sku_id, cabinet_id);
  const stock_qty = getCurrentStock(sku_id);
  const in_transit_qty = getInTransitQty(sku_id, cabinet_id);

  // Expected demand over planning horizon
  const expected_demand = velocity.velocity_units_per_day * planning_horizon;

  // Target stock with safety buffer
  const target_stock = expected_demand * (1 + safety_buffer_pct / 100);

  // What to order = target - what you have
  const effective_stock = stock_qty + in_transit_qty;
  const reorder_qty = Math.max(0, Math.ceil(target_stock - effective_stock));

  // Reorder value
  const cogs = getCogs(sku_id, cabinet_id);
  const reorder_value = reorder_qty * (cogs?.unit_cost_rub || 0);

  return {
    recommended_reorder_qty: reorder_qty,
    recommended_reorder_value: reorder_value,
    reorder_reasoning: {
      expected_demand: round(expected_demand, 0),
      target_stock: round(target_stock, 0),
      current_effective: effective_stock
    }
  };
}
```

### 4. Potential Revenue Loss

```javascript
function calculatePotentialLoss(sku_id, cabinet_id, days_out_of_stock = 7) {
  const velocity = calculateOrderVelocity(sku_id, cabinet_id);
  const avg_price = getAvgSellingPrice(sku_id, cabinet_id); // From recent sales

  const lost_units = velocity.velocity_units_per_day * days_out_of_stock;
  const lost_revenue = lost_units * avg_price;

  return {
    potential_loss_7d: round(lost_revenue, 0),
    avg_selling_price: avg_price
  };
}
```

### 5. Velocity Trend Detection

```javascript
function detectVelocityTrend(sku_id, cabinet_id) {
  const velocity_7d = calculateOrderVelocity(sku_id, cabinet_id, 7);
  const velocity_30d = calculateOrderVelocity(sku_id, cabinet_id, 30);

  if (velocity_30d.velocity_units_per_day === 0) {
    return 'no_data';
  }

  const change_pct = ((velocity_7d.velocity_units_per_day - velocity_30d.velocity_units_per_day)
                      / velocity_30d.velocity_units_per_day) * 100;

  if (change_pct > 30) return 'accelerating';
  if (change_pct < -30) return 'declining';
  return 'stable';
}
```

---

## Data Sources

### Current Stock (Required)

**Option A**: WB API Integration (Preferred)
```typescript
// Call WB API for real-time stock
const stocks = await wbApi.getStocks(cabinetId);
// Returns: [{ nmId, quantity, inWayToClient, inWayFromClient }]
```

**Option B**: Daily Snapshot
```sql
SELECT sku_id, stock_qty
FROM inventory_snapshot
WHERE cabinet_id = :cabinetId
  AND snapshot_date = CURRENT_DATE;
```

### Sales Data (For Velocity)

```sql
-- Get last 7 days sales
SELECT
  nm_id as sku_id,
  SUM(qty) as total_units,
  COUNT(*) as order_count
FROM wb_finance_raw
WHERE cabinet_id = :cabinetId
  AND sale_dt >= CURRENT_DATE - INTERVAL '7 days'
  AND doc_type = 'Продажа'
GROUP BY nm_id;
```

### In-Transit Shipments (Optional)

**New Table Required**:
```sql
CREATE TABLE in_transit_shipments (
  id SERIAL PRIMARY KEY,
  cabinet_id UUID NOT NULL,
  sku_id VARCHAR(50) NOT NULL,
  qty INT NOT NULL,
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(100),
  order_date DATE NOT NULL,
  expected_arrival_date DATE,
  actual_arrival_date DATE,
  status VARCHAR(50) DEFAULT 'in_transit', -- in_transit, arrived, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cabinet FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
);

CREATE INDEX idx_in_transit_sku ON in_transit_shipments(sku_id, cabinet_id, status);
CREATE INDEX idx_in_transit_arrival ON in_transit_shipments(expected_arrival_date);
```

**Query**:
```sql
SELECT sku_id, SUM(qty) as in_transit_qty
FROM in_transit_shipments
WHERE cabinet_id = :cabinetId
  AND status = 'in_transit'
GROUP BY sku_id;
```

---

## Error Responses

| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | `VALIDATION_ERROR` | "Invalid planning_horizon. Allowed: 7, 14, 30, 60" | Bad parameter |
| 401 | `UNAUTHORIZED` | "Authentication required" | Missing/invalid JWT |
| 403 | `FORBIDDEN` | "Access denied to cabinet" | Wrong cabinet |
| 404 | `NOT_FOUND` | "No stock data available" | No inventory data |
| 500 | `INTERNAL_ERROR` | "Internal server error" | Server error |
| 503 | `SERVICE_UNAVAILABLE` | "Stock data temporarily unavailable" | WB API down |

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Response time (100 SKUs) | <800ms | p95 |
| Response time (500 SKUs) | <1500ms | p95 |
| Caching | 15 min TTL | Redis key: `supply-plan:{cabinetId}:{horizon}:{buffer}` |

---

## Implementation Suggestions

### File Structure (NestJS)

```
src/analytics/
├── controllers/
│   └── supply-planning.controller.ts   ← NEW
├── services/
│   └── supply-planning.service.ts      ← NEW
├── dto/
│   ├── supply-planning-query.dto.ts    ← NEW
│   └── supply-planning-response.dto.ts ← NEW
└── analytics.module.ts                 ← Update imports
```

### Service Implementation

```typescript
@Injectable()
export class SupplyPlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wbStocksService: WbStocksService,
    private readonly redis: RedisService,
  ) {}

  async getSupplyPlanning(
    cabinetId: string,
    options: SupplyPlanningOptions
  ): Promise<SupplyPlanningResponse> {
    // 1. Get current stock (WB API or snapshot)
    const stocks = await this.getStocks(cabinetId);

    // 2. Get in-transit quantities
    const inTransit = await this.getInTransitQty(cabinetId);

    // 3. Calculate velocity for each SKU
    const velocities = await this.calculateVelocities(cabinetId);

    // 4. Calculate days until stockout
    // 5. Calculate reorder recommendations
    // 6. Classify by status
    // 7. Aggregate summary

    return { meta, summary, data };
  }
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Velocity calculation (normal, zero sales, high sales)
- [ ] Days until stockout (positive, zero stock, no velocity)
- [ ] Reorder quantity (with/without in-transit)
- [ ] Risk status classification (all 4 statuses)
- [ ] Potential loss calculation

### Integration Tests
- [ ] GET with valid parameters
- [ ] GET with different planning_horizon values
- [ ] GET with status_filter
- [ ] Error handling (401, 403, 404)
- [ ] Sorting and pagination

### Edge Cases
- [ ] SKU with zero sales (velocity = 0)
- [ ] SKU with no stock but in-transit
- [ ] SKU with negative stock (WB data issue)
- [ ] New SKU with <7 days history
- [ ] SKU without COGS assigned

---

## Acceptance Criteria

1. ✅ Endpoint `GET /v1/analytics/supply-planning` exists
2. ✅ All query parameters work as specified
3. ✅ Response includes `summary` with counts and totals
4. ✅ Response includes `data` array with SKU-level details
5. ✅ `stockout_status` correctly classified (critical/warning/monitor/safe)
6. ✅ `recommended_reorder_qty` calculated correctly
7. ✅ JWT authentication required
8. ✅ Cabinet isolation via `X-Cabinet-Id`
9. ✅ Response time <800ms for 100 SKUs
10. ✅ Error responses follow standard format

---

## Questions for Backend Team

1. **Stock Data Source**: Интегрировать WB API `/stocks` или использовать daily snapshot?
   - Real-time vs cached (performance trade-off)

2. **In-Transit Table**: Создавать новую таблицу `in_transit_shipments` или это future feature?
   - MVP: Can set `in_transit_qty = 0` for all

3. **Sales Data**: Использовать `wb_finance_raw` или нужен отдельный `orders_fact`?
   - `wb_finance_raw` имеет `qty` для расчёта velocity?

4. **Velocity Period**: 7 дней достаточно или добавить параметр `velocity_period`?

5. **No Stock SKUs**: Включать товары с нулевым остатком?
   - Option A: Exclude (focus on active inventory)
   - Option B: Include with status "out_of_stock"

---

## Related Documentation

- **Frontend Epic**: `docs/stories/6.0.supply-planning-epic.md`
- **Frontend Story**: `docs/stories/6.1.supply-planning-api-integration.md`
- **PRD Source**: `../our_service_full_analytics/phase_one/PAGE_07_SUPPLY_PLANNING.md`
- **API Integration Plan**: `../our_service_full_analytics/phase_one/API_INTEGRATION_PLAN.md`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-09 | 1.0 | Initial request | Sarah (PO) |

---

**Status**: 🟡 **Pending Backend Implementation**

**Frontend Blocked On**: This endpoint required for Stories 6.2, 6.3, 6.4
