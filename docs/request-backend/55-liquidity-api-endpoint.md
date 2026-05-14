# Request #55: Liquidity Analysis API Endpoint

**Date**: 2025-12-09
**Priority**: P0 - CRITICAL
**Epic**: Epic 7 - Liquidity Analysis
**Frontend Story**: `docs/stories/7.1.liquidity-api-integration.md`
**Source PRD**: `../our_service_full_analytics/phase_one/PAGE_08_LIQUIDITY.md`
**Status**: ✅ IMPLEMENTED

---

## Summary

Необходим новый API endpoint для анализа ликвидности товаров: расчёт оборачиваемости, классификация по ликвидности, замороженный капитал, рекомендации по ликвидации.

---

## Business Context

**Problem**: Frozen Capital Kills Growth
```
Typical seller: 10-15% of inventory is "dead stock" (>90 day turnover)
100,000₽ frozen could earn 20-30% elsewhere annually
Most sellers don't even know which products are illiquid
```

**Solution**: Liquidity analytics endpoint that:
- Calculates turnover days per SKU
- Classifies into 4 tiers (Highly Liquid / Medium / Low / Illiquid)
- Tracks total frozen capital
- Provides liquidation recommendations with ROI math

---

## API Specification

### Endpoint

```
GET /v1/analytics/liquidity
```

### Headers (Required)

| Header | Description |
|--------|-------------|
| `Authorization` | Bearer JWT token |
| `X-Cabinet-Id` | Cabinet UUID |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `category_filter` | enum | No | "all" | Filter: "highly_liquid" \| "medium_liquid" \| "low_liquid" \| "illiquid" \| "all" |
| `sort_by` | string | No | "turnover_days" | Sort field |
| `sort_order` | enum | No | "desc" | Sort order: "asc" \| "desc" |
| `limit` | number | No | 100 | Max results (max: 500) |
| `include_liquidation_scenarios` | boolean | No | true | Include 3 liquidation scenarios per illiquid SKU |

### Response Format

```json
{
  "meta": {
    "cabinet_id": "uuid-here",
    "analysis_period_days": 30,
    "generated_at": "2025-12-09T10:00:00Z",
    "stock_data_updated_at": "2025-12-09T09:45:00Z"
  },
  "summary": {
    "total_inventory_value": 1000000,
    "total_sku_count": 85,
    "frozen_capital": 27000,
    "frozen_capital_pct": 2.7,
    "avg_turnover_days": 38,
    "distribution": {
      "highly_liquid": {
        "count": 48,
        "value": 652000,
        "pct": 65.2,
        "avg_turnover_days": 22
      },
      "medium_liquid": {
        "count": 22,
        "value": 243000,
        "pct": 24.3,
        "avg_turnover_days": 45
      },
      "low_liquid": {
        "count": 10,
        "value": 78000,
        "pct": 7.8,
        "avg_turnover_days": 73
      },
      "illiquid": {
        "count": 5,
        "value": 27000,
        "pct": 2.7,
        "avg_turnover_days": 145
      }
    },
    "benchmarks": {
      "your_avg_turnover": 38,
      "target_avg_turnover": 45,
      "industry_avg_turnover": 52,
      "highly_liquid_pct": 65.2,
      "target_highly_liquid_pct": 50,
      "illiquid_pct": 2.7,
      "target_illiquid_pct": 5,
      "overall_status": "excellent"
    }
  },
  "data": [
    {
      "sku_id": "22222",
      "product_name": "Device Old",
      "category": "Electronics",
      "brand": "BrandX",

      "current_stock_qty": 60,
      "avg_stock_qty_30d": 58,
      "stock_value": 18000,

      "units_sold_30d": 12,
      "velocity_per_day": 0.4,

      "turnover_days": 145,
      "liquidity_category": "illiquid",

      "current_price": 900,
      "cogs_per_unit": 300,

      "recommendation": "Liquidate with discount",
      "action_type": "LIQUIDATE",

      "liquidation_scenarios": [
        {
          "target_days": 30,
          "required_velocity": 2.0,
          "velocity_multiplier": 5.0,
          "suggested_discount_pct": 40,
          "new_price": 540,
          "expected_revenue": 32400,
          "expected_profit": 14400,
          "is_profitable": true
        },
        {
          "target_days": 60,
          "required_velocity": 1.0,
          "velocity_multiplier": 2.5,
          "suggested_discount_pct": 25,
          "new_price": 675,
          "expected_revenue": 40500,
          "expected_profit": 22500,
          "is_profitable": true
        },
        {
          "target_days": 90,
          "required_velocity": 0.67,
          "velocity_multiplier": 1.67,
          "suggested_discount_pct": 15,
          "new_price": 765,
          "expected_revenue": 45900,
          "expected_profit": 27900,
          "is_profitable": true
        }
      ]
    },
    {
      "sku_id": "12345",
      "product_name": "Widget Pro",
      "category": "Electronics",
      "brand": "BrandY",

      "current_stock_qty": 120,
      "avg_stock_qty_30d": 115,
      "stock_value": 54000,

      "units_sold_30d": 165,
      "velocity_per_day": 5.5,

      "turnover_days": 22,
      "liquidity_category": "highly_liquid",

      "current_price": 1000,
      "cogs_per_unit": 450,

      "recommendation": "Scale up - invest more",
      "action_type": "MAXIMIZE",

      "liquidation_scenarios": null
    }
  ]
}
```

### Historical Trends Endpoint

```
GET /v1/analytics/liquidity/trends
```

**Query Parameters**:
- `period` (optional, default: 90) - Days of history

**Response**:
```json
{
  "meta": {
    "cabinet_id": "uuid-here",
    "period_days": 90,
    "generated_at": "2025-12-09T10:00:00Z"
  },
  "trends": [
    {
      "date": "2025-09-11",
      "distribution": {
        "highly_liquid_pct": 58,
        "medium_liquid_pct": 26,
        "low_liquid_pct": 9,
        "illiquid_pct": 7
      },
      "frozen_capital": 70000,
      "avg_turnover_days": 48
    },
    {
      "date": "2025-12-09",
      "distribution": {
        "highly_liquid_pct": 65.2,
        "medium_liquid_pct": 24.3,
        "low_liquid_pct": 7.8,
        "illiquid_pct": 2.7
      },
      "frozen_capital": 27000,
      "avg_turnover_days": 38
    }
  ],
  "insights": [
    {
      "type": "improvement",
      "message": "Illiquid % decreased from 7% → 2.7% (great progress!)"
    },
    {
      "type": "improvement",
      "message": "Highly liquid % increased from 58% → 65.2%"
    }
  ]
}
```

---

## Core Formulas

### 1. Turnover Days Calculation

```javascript
function calculateTurnoverDays(sku_id, cabinet_id) {
  const period_days = 30;

  // Get average stock level over period
  const stock_snapshots = await getStockSnapshots({
    sku_id,
    cabinet_id,
    date_from: today() - period_days,
    date_to: today()
  });
  const avg_stock_qty = average(stock_snapshots.map(s => s.qty));

  // Get units sold in period
  const units_sold = await getTotalSales({
    sku_id,
    cabinet_id,
    date_from: today() - period_days,
    date_to: today()
  });

  if (units_sold === 0) {
    return {
      turnover_days: 999, // Infinite (no sales)
      avg_stock_qty,
      units_sold: 0,
      warning: 'No sales in last 30 days'
    };
  }

  const turnover_days = (avg_stock_qty * period_days) / units_sold;

  return {
    turnover_days: Math.round(turnover_days),
    avg_stock_qty,
    units_sold,
    velocity_per_day: units_sold / period_days
  };
}

// Example:
// Avg stock: 120 units, Units sold: 165 in 30 days
// Turnover = (120 × 30) / 165 = 21.8 ≈ 22 days
```

### 2. Liquidity Classification

```javascript
function classifyLiquidity(turnover_days) {
  if (turnover_days <= 30) {
    return {
      category: 'highly_liquid',
      label: '🟢 Highly Liquid',
      description: 'Fast mover - invest more',
      target_share: '> 50%',
      action_type: 'MAXIMIZE'
    };
  } else if (turnover_days <= 60) {
    return {
      category: 'medium_liquid',
      label: '🟡 Medium Liquid',
      description: 'Acceptable turnover',
      target_share: '30-40%',
      action_type: 'MAINTAIN'
    };
  } else if (turnover_days <= 90) {
    return {
      category: 'low_liquid',
      label: '🟠 Low Liquid',
      description: 'Slow mover - reduce',
      target_share: '< 15%',
      action_type: 'REDUCE'
    };
  } else {
    return {
      category: 'illiquid',
      label: '🔴 Illiquid',
      description: 'Dead stock - liquidate!',
      target_share: '< 5%',
      action_type: 'LIQUIDATE'
    };
  }
}
```

### 3. Frozen Capital Calculation

```javascript
function calculateFrozenCapital(cabinet_id) {
  const all_skus = await getAllSKUsWithLiquidity(cabinet_id);

  let frozen_capital = 0;
  let total_inventory_value = 0;

  all_skus.forEach(sku => {
    const stock_value = sku.current_stock * sku.cogs_per_unit;
    total_inventory_value += stock_value;

    // Illiquid = frozen capital
    if (sku.turnover_days > 90) {
      frozen_capital += stock_value;
    }
  });

  return {
    frozen_capital,
    frozen_capital_pct: (frozen_capital / total_inventory_value) * 100,
    total_inventory_value,
    target: '< 5%',
    status: (frozen_capital / total_inventory_value) < 0.05 ? 'good' : 'warning'
  };
}
```

### 4. Liquidation Discount Calculator

```javascript
function calculateLiquidationScenario(sku, target_days) {
  const current_velocity = sku.velocity_per_day; // e.g., 0.4 units/day
  const required_velocity = sku.current_stock / target_days; // e.g., 60/30 = 2 units/day
  const velocity_multiplier = required_velocity / current_velocity; // 2/0.4 = 5x

  // Simplified elasticity: velocity_multiplier → discount %
  let suggested_discount_pct;
  if (velocity_multiplier <= 1.5) suggested_discount_pct = 15;
  else if (velocity_multiplier <= 2.5) suggested_discount_pct = 25;
  else if (velocity_multiplier <= 4) suggested_discount_pct = 35;
  else suggested_discount_pct = 40; // Cap at 40%

  const new_price = sku.current_price * (1 - suggested_discount_pct / 100);
  const expected_revenue = sku.current_stock * new_price;
  const total_cogs = sku.current_stock * sku.cogs_per_unit;
  const expected_profit = expected_revenue - total_cogs;

  return {
    target_days,
    required_velocity,
    velocity_multiplier,
    suggested_discount_pct,
    new_price,
    expected_revenue,
    expected_profit,
    break_even_price: sku.cogs_per_unit,
    is_profitable: new_price > sku.cogs_per_unit
  };
}
```

---

## Data Sources

### Stock Snapshots (Required)

```sql
-- Daily stock snapshots needed
SELECT
  sku_id,
  cabinet_id,
  snapshot_date,
  stock_qty
FROM inventory_snapshot
WHERE cabinet_id = :cabinetId
  AND snapshot_date >= CURRENT_DATE - INTERVAL '30 days';
```

**Note**: If `inventory_snapshot` table doesn't exist, need to:
- Option A: Use WB API `/stocks` for current stock only (less accurate)
- Option B: Create daily snapshot job to populate table

### Sales Data

```sql
SELECT
  nm_id as sku_id,
  SUM(qty) as units_sold_30d
FROM wb_finance_raw
WHERE cabinet_id = :cabinetId
  AND sale_dt >= CURRENT_DATE - INTERVAL '30 days'
  AND doc_type = 'Продажа'
GROUP BY nm_id;
```

### COGS Data

```sql
SELECT
  nm_id as sku_id,
  unit_cost_rub as cogs_per_unit
FROM cogs
WHERE cabinet_id = :cabinetId
  -- Use Week Midpoint Strategy for temporal COGS
  AND valid_from <= :lookupDate
ORDER BY valid_from DESC
LIMIT 1;
```

---

## Materialized View (Recommended)

```sql
CREATE MATERIALIZED VIEW liquidity_analysis_view AS
WITH stock_avg AS (
  SELECT
    sku_id,
    cabinet_id,
    AVG(stock_qty) as avg_stock_qty_30d,
    MAX(CASE WHEN snapshot_date = CURRENT_DATE THEN stock_qty END) as current_stock_qty
  FROM inventory_snapshot
  WHERE snapshot_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY sku_id, cabinet_id
),
sales_30d AS (
  SELECT
    nm_id as sku_id,
    cabinet_id,
    SUM(qty) as units_sold_30d
  FROM wb_finance_raw
  WHERE sale_dt >= CURRENT_DATE - INTERVAL '30 days'
    AND doc_type = 'Продажа'
  GROUP BY nm_id, cabinet_id
)
SELECT
  sa.sku_id,
  sa.cabinet_id,
  sa.avg_stock_qty_30d,
  sa.current_stock_qty,
  COALESCE(s.units_sold_30d, 0) as units_sold_30d,
  COALESCE(s.units_sold_30d, 0) / 30.0 as velocity_per_day,

  -- Turnover days
  CASE
    WHEN COALESCE(s.units_sold_30d, 0) > 0
    THEN ROUND((sa.avg_stock_qty_30d * 30.0) / s.units_sold_30d)
    ELSE 999
  END as turnover_days,

  -- Stock value
  sa.current_stock_qty * c.unit_cost_rub as stock_value,

  -- Liquidity category
  CASE
    WHEN (sa.avg_stock_qty_30d * 30.0) / NULLIF(s.units_sold_30d, 0) <= 30 THEN 'highly_liquid'
    WHEN (sa.avg_stock_qty_30d * 30.0) / NULLIF(s.units_sold_30d, 0) <= 60 THEN 'medium_liquid'
    WHEN (sa.avg_stock_qty_30d * 30.0) / NULLIF(s.units_sold_30d, 0) <= 90 THEN 'low_liquid'
    ELSE 'illiquid'
  END as liquidity_category,

  c.unit_cost_rub as cogs_per_unit,
  p.product_name,
  p.category,
  p.brand

FROM stock_avg sa
LEFT JOIN sales_30d s ON sa.sku_id = s.sku_id AND sa.cabinet_id = s.cabinet_id
JOIN cogs c ON sa.sku_id = c.nm_id AND sa.cabinet_id = c.cabinet_id
JOIN products p ON sa.sku_id = p.sku_id
WHERE sa.current_stock_qty > 0;

-- Refresh daily
CREATE INDEX idx_liquidity_category ON liquidity_analysis_view(liquidity_category);
CREATE INDEX idx_turnover_days ON liquidity_analysis_view(turnover_days DESC);
CREATE INDEX idx_stock_value ON liquidity_analysis_view(stock_value DESC);
```

---

## Error Responses

| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | `VALIDATION_ERROR` | "Invalid category_filter" | Bad parameter |
| 401 | `UNAUTHORIZED` | "Authentication required" | Missing/invalid JWT |
| 403 | `FORBIDDEN` | "Access denied to cabinet" | Wrong cabinet |
| 404 | `NOT_FOUND` | "No inventory data available" | No stock snapshots |
| 500 | `INTERNAL_ERROR` | "Internal server error" | Server error |
| 503 | `SERVICE_UNAVAILABLE` | "Stock data temporarily unavailable" | Data refresh in progress |

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Response time (100 SKUs) | <500ms | p95 |
| Response time (500 SKUs) | <1200ms | p95 |
| Trends endpoint | <300ms | p95 |
| Materialized view refresh | <30s | Daily at midnight |

---

## Implementation Suggestions

### File Structure (NestJS)

```
src/analytics/
├── controllers/
│   └── liquidity.controller.ts        ← NEW
├── services/
│   └── liquidity.service.ts           ← NEW
├── dto/
│   ├── liquidity-query.dto.ts         ← NEW
│   └── liquidity-response.dto.ts      ← NEW
└── analytics.module.ts                ← Update imports
```

---

## Questions for Backend Team

1. **Stock Snapshots**: Есть ли таблица `inventory_snapshot` с ежедневными снимками остатков?
   - Если нет, нужно создать cron job для снятия снимков
   - Или использовать только текущий остаток (менее точно)

2. **COGS Coverage**: Какой % SKU имеют назначенный COGS?
   - Для SKU без COGS: показывать только qty-метрики без stock_value?

3. **Performance**: Использовать materialized view или вычислять на лету?
   - При >1000 SKUs materialized view обязателен

4. **Current Price**: Откуда брать текущую цену для расчёта liquidation scenarios?
   - WB API `/prices`?
   - Таблица `pricing`?

---

## Acceptance Criteria

1. ✅ Endpoint `GET /v1/analytics/liquidity` exists
2. ✅ All query parameters work as specified
3. ✅ Response includes `summary` with distribution and benchmarks
4. ✅ Response includes `data` array with SKU-level details
5. ✅ `liquidity_category` correctly classified (4 tiers)
6. ✅ `turnover_days` calculated correctly
7. ✅ `frozen_capital` calculated for illiquid SKUs
8. ✅ `liquidation_scenarios` included for illiquid SKUs
9. ✅ JWT authentication required
10. ✅ Cabinet isolation via `X-Cabinet-Id`
11. ✅ Response time <500ms for 100 SKUs
12. ✅ Trends endpoint returns 90-day history

---

## Related Documentation

- **Frontend Epic**: `docs/stories/7.0.liquidity-analysis-epic.md`
- **Frontend Story**: `docs/stories/7.1.liquidity-api-integration.md`
- **PRD Source**: `../our_service_full_analytics/phase_one/PAGE_08_LIQUIDITY.md`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-09 | 1.0 | Initial request | Sarah (PO) |

---

**Status**: ✅ **IMPLEMENTED**

**Frontend Blocked On**: N/A - Endpoint implemented

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-12-12
- **Summary**: Liquidity analysis endpoint (`GET /v1/analytics/liquidity`) implemented as part of Epic 29. Returns liquidity categories (highly_liquid/medium_liquid/low_liquid/illiquid), turnover days, frozen capital, and liquidation scenarios per SKU. Includes summary distribution and trends endpoint. Performance target <500ms for 100 SKUs met. See the companion `-backend-response.md` for full details.
- **Remaining frontend action**: Implement Stories 7.1, 7.2 for liquidity analysis UI.
