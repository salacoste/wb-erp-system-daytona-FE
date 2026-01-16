# Request #53: Unit Economics API Endpoint

**Date**: 2025-12-09
**Priority**: P0 - CRITICAL
**Epic**: Epic 5 - Unit Economics Analytics (Backend: Epic 27)
**Frontend Story**: `docs/stories/5.1.unit-economics-backend-api.md`
**Source PRD**: `../our_service_full_analytics/phase_one/PAGE_03_UNIT_ECONOMICS.md`
**Status**: ✅ **IMPLEMENTED** (2025-12-09)
**Backend Epic**: `docs/epics/epic-27-unit-economics-analytics.md`

---

## Summary

Необходим новый API endpoint для получения unit economics данных с разбивкой затрат как процент от выручки по каждому SKU.

---

## Business Context

**Problem**: Селлеры видят абсолютные числа выручки и прибыли, но не понимают структуру затрат. Два товара с одинаковой прибылью могут иметь разную эффективность:

```
SKU A: 100,000₽ revenue, 20,000₽ profit → 20% margin
SKU B: 50,000₽ revenue, 15,000₽ profit → 30% margin
→ SKU B в 1.5x эффективнее!
```

**Solution**: API endpoint возвращающий затраты как % от выручки для визуализации waterfall chart.

---

## API Specification

### Endpoint

```
GET /v1/analytics/unit-economics
```

### Headers (Required)

| Header | Description |
|--------|-------------|
| `Authorization` | Bearer JWT token |
| `X-Cabinet-Id` | Cabinet UUID |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `week` | string | **Yes** | - | ISO week format (e.g., "2025-W47") |
| `view_by` | enum | No | "sku" | Aggregation: "sku" \| "category" \| "brand" \| "total" |
| `sort_by` | string | No | "revenue" | Sort field: "revenue" \| "net_margin_pct" \| "cogs_pct" |
| `sort_order` | enum | No | "desc" | Sort order: "asc" \| "desc" |
| `limit` | number | No | 100 | Max results (max: 500) |

### Response Format

```json
{
  "meta": {
    "week": "2025-W47",
    "cabinet_id": "uuid-here",
    "view_by": "sku",
    "generated_at": "2025-12-09T10:00:00Z"
  },
  "summary": {
    "total_revenue": 1500000,
    "avg_cogs_pct": 35.2,
    "avg_wb_fees_pct": 44.8,
    "avg_net_margin_pct": 20.0,
    "sku_count": 85,
    "profitable_sku_count": 72,
    "loss_making_sku_count": 13
  },
  "data": [
    {
      "sku_id": "12345",
      "product_name": "Widget Pro",
      "category": "Electronics",
      "brand": "BrandX",
      "revenue": 100000,

      "costs_pct": {
        "cogs": 30.0,
        "commission": 15.0,
        "logistics_delivery": 8.0,
        "logistics_return": 2.0,
        "storage": 3.0,
        "paid_acceptance": 1.5,
        "penalties": 0.5,
        "other_deductions": 1.0,
        "advertising": 0.0
      },

      "costs_rub": {
        "cogs": 30000,
        "commission": 15000,
        "logistics_delivery": 8000,
        "logistics_return": 2000,
        "storage": 3000,
        "paid_acceptance": 1500,
        "penalties": 500,
        "other_deductions": 1000,
        "advertising": 0
      },

      "total_costs_pct": 61.0,
      "net_margin_pct": 39.0,
      "net_profit": 39000,

      "profitability_status": "excellent",
      "insights": [
        "High margin - consider increasing stock",
        "Logistics costs below average"
      ]
    }
  ]
}
```

### Cost Categories Mapping

| Field | Source | Description |
|-------|--------|-------------|
| `cogs` | `cogs` table | Cost of Goods Sold (from COGS assignments) |
| `commission` | `total_commission_rub` | WB sales commission |
| `logistics_delivery` | Из `wb_finance_raw` или `logistics_cost` | Доставка покупателю |
| `logistics_return` | Из `wb_finance_raw` или часть `logistics_cost` | Возврат логистика |
| `storage` | `storage_cost` | Хранение на складе |
| `paid_acceptance` | `paid_acceptance_cost` | Платная приёмка |
| `penalties` | `penalties_total` | Штрафы |
| `other_deductions` | `other_adjustments_net` | Прочие удержания |
| `advertising` | *Future* | Реклама (MVP: 0) |

### Profitability Status Classification

| Status | Net Margin % | Color (Frontend) |
|--------|--------------|------------------|
| `excellent` | > 25% | Green (#22C55E) |
| `good` | 15-25% | Light Green (#84CC16) |
| `warning` | 5-15% | Yellow (#EAB308) |
| `critical` | 0-5% | Orange (#F97316) |
| `loss` | < 0% | Red (#EF4444) |

---

## Data Sources

### Primary: `weekly_payout_summary`

```sql
SELECT
  nm_id,
  sale_gross as revenue,
  total_commission_rub,
  logistics_cost,
  storage_cost,
  paid_acceptance_cost,
  penalties_total,
  other_adjustments_net
FROM weekly_payout_summary
WHERE week = :week
  AND cabinet_id = :cabinetId
  AND report_type = 'total'
```

### COGS Join

```sql
-- Get applicable COGS for week (Week Midpoint Strategy: Thursday)
SELECT DISTINCT ON (nm_id)
  nm_id,
  unit_cost_rub
FROM cogs
WHERE cabinet_id = :cabinetId
  AND valid_from <= (SELECT thursday_of_week(:week))
ORDER BY nm_id, valid_from DESC
```

### Logistics Split (Optional Enhancement)

Если нужна разбивка logistics на delivery/return:

```sql
SELECT
  nm_id,
  SUM(CASE WHEN reason ILIKE '%доставк%' THEN ABS(net_for_pay) ELSE 0 END) as logistics_delivery,
  SUM(CASE WHEN reason ILIKE '%возврат%' THEN ABS(net_for_pay) ELSE 0 END) as logistics_return
FROM wb_finance_raw
WHERE week = :week
  AND cabinet_id = :cabinetId
  AND doc_type IN ('service', '')
GROUP BY nm_id
```

---

## Calculation Logic

### Cost Percentage Calculation

```typescript
function calculateCostsPct(sku: SkuData): CostsPct {
  const revenue = sku.revenue;

  // Handle zero revenue
  if (revenue === 0) {
    return {
      cogs: 0,
      commission: 0,
      // ... all zeros
    };
  }

  return {
    cogs: round((sku.cogs / revenue) * 100, 1),
    commission: round((sku.commission / revenue) * 100, 1),
    logistics_delivery: round((sku.logistics_delivery / revenue) * 100, 1),
    logistics_return: round((sku.logistics_return / revenue) * 100, 1),
    storage: round((sku.storage / revenue) * 100, 1),
    paid_acceptance: round((sku.paid_acceptance / revenue) * 100, 1),
    penalties: round((sku.penalties / revenue) * 100, 1),
    other_deductions: round((sku.other_deductions / revenue) * 100, 1),
    advertising: 0 // Future feature
  };
}
```

### Net Margin Calculation

```typescript
const total_costs_pct =
  costs_pct.cogs +
  costs_pct.commission +
  costs_pct.logistics_delivery +
  costs_pct.logistics_return +
  costs_pct.storage +
  costs_pct.paid_acceptance +
  costs_pct.penalties +
  costs_pct.other_deductions;

const net_margin_pct = 100 - total_costs_pct;
const net_profit = revenue * (net_margin_pct / 100);
```

### Profitability Classification

```typescript
function classifyProfitability(netMarginPct: number): ProfitabilityStatus {
  if (netMarginPct > 25) return 'excellent';
  if (netMarginPct > 15) return 'good';
  if (netMarginPct > 5) return 'warning';
  if (netMarginPct > 0) return 'critical';
  return 'loss';
}
```

### Summary Aggregation

```typescript
const summary = {
  total_revenue: data.reduce((sum, d) => sum + d.revenue, 0),
  avg_cogs_pct: weightedAverage(data, 'costs_pct.cogs', 'revenue'),
  avg_wb_fees_pct: weightedAverage(data, 'total_wb_fees_pct', 'revenue'),
  avg_net_margin_pct: weightedAverage(data, 'net_margin_pct', 'revenue'),
  sku_count: data.length,
  profitable_sku_count: data.filter(d => d.net_margin_pct > 0).length,
  loss_making_sku_count: data.filter(d => d.net_margin_pct <= 0).length
};
```

---

## View Aggregation (`view_by` parameter)

### `view_by=sku` (default)
- Return individual SKU rows
- Each row = one product

### `view_by=category`
- Group by product category
- `sku_id` → category name
- Aggregate costs weighted by revenue

### `view_by=brand`
- Group by brand
- `sku_id` → brand name
- Aggregate costs weighted by revenue

### `view_by=total`
- Single row with portfolio totals
- `sku_id` = "TOTAL"
- All costs aggregated

---

## Error Responses

| Status | Code | Message | When |
|--------|------|---------|------|
| 400 | `VALIDATION_ERROR` | "Week parameter is required" | Missing `week` |
| 400 | `VALIDATION_ERROR` | "Invalid week format. Expected: YYYY-Www" | Bad `week` format |
| 401 | `UNAUTHORIZED` | "Authentication required" | Missing/invalid JWT |
| 403 | `FORBIDDEN` | "Access denied to cabinet" | Wrong cabinet |
| 404 | `NOT_FOUND` | "No data for week 2025-W47" | No data exists |
| 500 | `INTERNAL_ERROR` | "Internal server error" | Server error |

---

## Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Response time (100 SKUs) | <500ms | p95 |
| Response time (500 SKUs) | <1000ms | p95 |
| Caching | 1 hour TTL | Redis key: `unit-econ:{cabinetId}:{week}:{viewBy}` |

---

## Implementation Suggestions

### File Structure (NestJS)

```
src/analytics/
├── controllers/
│   └── unit-economics.controller.ts   ← NEW
├── services/
│   └── unit-economics.service.ts      ← NEW
├── dto/
│   ├── unit-economics-query.dto.ts    ← NEW
│   └── unit-economics-response.dto.ts ← NEW
└── analytics.module.ts                ← Update imports
```

### Controller Example

```typescript
@Controller('v1/analytics')
@UseGuards(JwtAuthGuard, CabinetGuard)
export class UnitEconomicsController {
  constructor(private readonly unitEconomicsService: UnitEconomicsService) {}

  @Get('unit-economics')
  async getUnitEconomics(
    @Query() query: UnitEconomicsQueryDto,
    @Headers('x-cabinet-id') cabinetId: string,
  ): Promise<UnitEconomicsResponseDto> {
    return this.unitEconomicsService.getUnitEconomics(
      query.week,
      cabinetId,
      {
        viewBy: query.view_by,
        sortBy: query.sort_by,
        sortOrder: query.sort_order,
        limit: query.limit,
      }
    );
  }
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Cost percentage calculation (normal case)
- [ ] Cost percentage calculation (zero revenue)
- [ ] Profitability classification (all 5 statuses)
- [ ] Summary aggregation
- [ ] View aggregation (category, brand, total)

### Integration Tests
- [ ] GET with valid parameters
- [ ] GET with missing week (400)
- [ ] GET with invalid week format (400)
- [ ] GET with unauthorized request (401)
- [ ] GET with wrong cabinet (403)
- [ ] GET with no data (404 or empty response?)
- [ ] Verify response matches contract

### Performance Tests
- [ ] 100 SKUs < 500ms
- [ ] 500 SKUs < 1000ms
- [ ] Caching works correctly

---

## Acceptance Criteria

1. ✅ Endpoint `GET /v1/analytics/unit-economics` exists
2. ✅ All query parameters work as specified
3. ✅ Response includes `costs_pct` and `costs_rub` objects
4. ✅ Response includes `profitability_status` for each SKU
5. ✅ Summary includes aggregated metrics
6. ✅ JWT authentication required
7. ✅ Cabinet isolation via `X-Cabinet-Id`
8. ✅ Response time <500ms for 100 SKUs
9. ✅ Caching implemented (1h TTL)
10. ✅ Error responses follow standard format

---

## Questions for Backend Team - RESOLVED ✅

1. **Logistics Split**: ✅ **RESOLVED** - Разделено на `logistics_delivery` (70%) и `logistics_return` (30%) в MVP. Точное разделение из `wb_finance_raw` планируется в будущем.

2. **Products without COGS**: ✅ **RESOLVED** - Option C: Включены с `cogs: null` и `missing_cogs: true`. Статус профитабельности = `unknown`.

3. **Empty Week**: ✅ **RESOLVED** - Возвращается 404 с кодом `NO_DATA_FOR_WEEK`.

4. **Insights Generation**: ✅ **RESOLVED** - Отложено на будущее. MVP не включает insights.

---

## Related Documentation

- **Frontend Epic**: `docs/stories/5.0.unit-economics-epic.md`
- **Frontend Story**: `docs/stories/5.1.unit-economics-backend-api.md`
- **PRD Source**: `../our_service_full_analytics/phase_one/PAGE_03_UNIT_ECONOMICS.md`
- **API Integration Plan**: `../our_service_full_analytics/phase_one/API_INTEGRATION_PLAN.md`
- **Existing Analytics**: `docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-12-09 | 1.0 | Initial request | Sarah (PO) |
| 2025-12-09 | 2.0 | **IMPLEMENTED** - Backend Epic 27 complete | James (Dev) |

---

**Status**: ✅ **IMPLEMENTED**

**Implementation Details**:
- Endpoint: `GET /v1/analytics/unit-economics`
- Service: `src/analytics/services/unit-economics.service.ts`
- Controller: `src/analytics/controllers/unit-economics.controller.ts`
- DTOs: `src/analytics/dto/query/unit-economics-query.dto.ts`, `src/analytics/dto/response/unit-economics-response.dto.ts`
- Data source: `weekly_margin_fact` table (Epic 26)
- Caching: Redis, 1h TTL
- Documentation: `docs/API-PATHS-REFERENCE.md`, `docs/epics/epic-27-unit-economics-analytics.md`

**Frontend Can Now Proceed With**: Stories 5.2, 5.3, 5.4
