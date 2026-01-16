# Frontend Clarification: Request #54 - Supply Planning API

**Date**: 2025-12-12
**In Response To**: `54-supply-planning-api-endpoint-backend-response.md`
**Status**: Clarification for Backend Team
**Frontend Epic**: `docs/stories/6.0.supply-planning-epic.md`

---

## Summary

Ответы на вопросы backend команды и уточнения по формату данных для фронтенд интеграции.

---

## Answers to Backend Questions

### 1. Stock Data Source

**Question**: WB API `/stocks` real-time или daily snapshot?

**Frontend Answer**: **Daily snapshot preferred** для MVP

**Reasoning**:
- Real-time не критичен для планирования поставок (данные меняются медленно)
- Snapshot проще и надёжнее (не зависит от WB API availability)
- Достаточно обновлять 1 раз в день (06:00 MSK)
- Response time будет стабильнее

**Acceptable**: Если WB API stocks уже интегрирован для других целей - можно использовать с кешированием 15-30 мин.

---

### 2. In-Transit Table

**Question**: Создавать `in_transit_shipments` или future feature?

**Frontend Answer**: **MVP: Skip in-transit** (set `in_transit_qty = 0`)

**Reasoning**:
- Усложняет MVP без критической ценности
- Пользователи могут вручную учитывать в Excel
- Phase 2: Добавить когда будет WB Supplies API интеграция

**MVP Response Format** (без in-transit):
```json
{
  "stock_qty": 15,
  "in_transit_qty": 0,
  "effective_stock": 15
}
```

---

### 3. Sales Data Source

**Question**: `wb_finance_raw` или отдельный `orders_fact`?

**Frontend Answer**: **Use `wb_finance_raw`**

**Required Query**:
```sql
SELECT
  nm_id,
  SUM(CASE WHEN doc_type = 'Продажа' THEN 1 ELSE 0 END) as sales_qty,
  SUM(CASE WHEN doc_type = 'Возврат' THEN 1 ELSE 0 END) as returns_qty,
  SUM(CASE WHEN doc_type = 'Продажа' THEN 1 ELSE -1 END) as net_qty
FROM wb_finance_raw
WHERE cabinet_id = :cabinetId
  AND sale_dt >= CURRENT_DATE - INTERVAL '7 days'
  AND doc_type IN ('Продажа', 'Возврат')
GROUP BY nm_id;
```

**Note**: Velocity should be based on NET sales (sales - returns).

---

### 4. Velocity Period

**Question**: 7 дней или параметр `velocity_period`?

**Frontend Answer**: **Параметр `velocity_weeks`** (как в Request)

**Values**:
| Parameter | Default | Options |
|-----------|---------|---------|
| `velocity_weeks` | 4 | 1, 2, 4, 8 |

**Frontend UI**: Dropdown selector "Период расчёта скорости: 1/2/4/8 недель"

**Why weeks not days**:
- Проще для пользователя
- Убирает weekday variations (выходные vs будни)
- 4 недели = стандарт для планирования

---

### 5. Zero Stock SKUs

**Question**: Включать товары с нулевым остатком?

**Frontend Answer**: **Include with status `out_of_stock`**

**Reasoning**:
- Пользователи хотят видеть "что уже закончилось"
- Важно для отчётности и принятия решений
- Легко фильтровать на фронте если не нужно

**Add New Status**:
```javascript
function getStockoutStatus(days_until_stockout, stock_qty) {
  if (stock_qty === 0) return 'out_of_stock';  // NEW
  if (days_until_stockout <= 3) return 'critical';
  if (days_until_stockout <= 7) return 'warning';
  if (days_until_stockout <= 14) return 'monitor';
  return 'safe';
}
```

---

## Minimal Viable Response Format

Для ускорения разработки, вот **минимальный** формат который нужен фронтенду:

### Simplified Response (MVP)

```json
{
  "meta": {
    "cabinet_id": "uuid",
    "velocity_weeks": 4,
    "planning_horizon_days": 30,
    "safety_buffer_pct": 25,
    "generated_at": "2025-12-12T10:00:00Z",
    "stock_data_date": "2025-12-12"
  },
  "summary": {
    "total_sku_count": 85,
    "out_of_stock_count": 3,
    "critical_count": 5,
    "warning_count": 12,
    "monitor_count": 20,
    "safe_count": 45,
    "total_stock_value": 1250000,
    "at_risk_stock_value": 325000
  },
  "data": [
    {
      "sku_id": "12345",
      "product_name": "Widget Pro",
      "brand": "BrandX",
      "category": "Electronics",

      "stock_qty": 15,
      "effective_stock": 15,

      "velocity_per_day": 8.2,
      "velocity_total": 230,

      "days_until_stockout": 2,
      "stockout_date": "2025-12-14",
      "stockout_status": "critical",

      "recommended_qty": 293,
      "recommended_value": 131850,

      "cogs_per_unit": 450,
      "has_cogs": true
    }
  ]
}
```

### Fields Explanation

| Field | Source | Required | Notes |
|-------|--------|----------|-------|
| `sku_id` | `nm_id` | Yes | WB article |
| `product_name` | Product cache | Yes | From WB products |
| `brand` | Product cache | Yes | |
| `category` | Product cache | No | Nice to have |
| `stock_qty` | WB Stocks API/snapshot | **CRITICAL** | Main blocker |
| `effective_stock` | stock_qty + in_transit | Yes | MVP: same as stock_qty |
| `velocity_per_day` | Calculated | Yes | net_qty / (velocity_weeks * 7) |
| `velocity_total` | Calculated | Yes | Sum of net_qty |
| `days_until_stockout` | Calculated | Yes | effective_stock / velocity_per_day |
| `stockout_date` | Calculated | Yes | today + days_until_stockout |
| `stockout_status` | Calculated | Yes | critical/warning/monitor/safe/out_of_stock |
| `recommended_qty` | Calculated | Yes | Formula from Request #54 |
| `recommended_value` | recommended_qty * cogs | Yes | |
| `cogs_per_unit` | COGS table | Yes | Null if not assigned |
| `has_cogs` | Boolean | Yes | For filtering |

---

## What Frontend Can Build NOW (with Mocks)

While backend develops infrastructure, frontend will build:

### Story 6.1: Types & Hooks
```typescript
// Types matching above response
interface SupplyPlanningResponse { ... }
interface SupplyPlanningItem { ... }

// Hook with MSW mock
const { data, isLoading } = useSupplyPlanning({
  velocity_weeks: 4,
  planning_horizon_days: 30,
  safety_buffer_pct: 25,
});
```

### Story 6.2: Page Structure
- Risk distribution chart (donut: critical/warning/monitor/safe)
- Summary cards (total SKUs, at risk value, etc.)
- Filter controls

### Story 6.3: Stockout Table
- Sortable columns (days_until_stockout, stock_qty, velocity)
- Status badges with colors
- Recommended order amounts

### Story 6.4: Integration Testing
- MSW handlers for all scenarios
- E2E tests ready for real API

---

## Phased Delivery Suggestion

### Phase 1 (MVP) - 2 weeks
| Feature | Included |
|---------|----------|
| Stock data | Daily snapshot from WB API |
| Velocity | 7-day calculation from wb_finance_raw |
| In-transit | Hardcoded 0 |
| Supplier info | Excluded |
| Recommendations | Basic formula |

### Phase 2 (Enhanced) - +2 weeks
| Feature | Included |
|---------|----------|
| In-transit | Manual entry table |
| Lead time | Per-SKU settings |
| Supplier info | Contacts table |
| Export | CSV/Excel |

### Phase 3 (Advanced) - +2 weeks
| Feature | Included |
|---------|----------|
| WB Supplies API | Auto in-transit from WB |
| Velocity trends | Accelerating/declining |
| Seasonality | Adjustment factors |
| Notifications | Email alerts |

---

## Critical Path for Frontend

```
Backend delivers:               Frontend unblocks:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stock snapshot table     →     Story 6.3 (real data)
Velocity calculation     →     Risk status accuracy
Basic /supply-planning   →     Full integration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Minimum to unblock frontend**:
1. `inventory_snapshot` table with daily WB stocks sync
2. Velocity calculation from `wb_finance_raw`
3. Basic endpoint returning above MVP format

---

## Contact

Questions? Ping frontend team in #wb-repricer-dev

---

## Change Log

| Date | Description |
|------|-------------|
| 2025-12-12 | Initial clarification document |
