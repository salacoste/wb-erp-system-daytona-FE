# Backend Response: Request #53 - Unit Economics API Endpoint

**Date**: 2025-12-09
**Status**: ✅ **IMPLEMENTED**
**Epic**: [Epic 27 - Unit Economics Analytics](/docs/epics/epic-27-unit-economics-analytics.md)
**Priority**: 🔴 P0 - CRITICAL (Completed)

---

## Implementation Summary

API endpoint для unit economics **полностью реализован и готов к использованию**.

### Completed Stories

| Story | Points | Description | Status |
|-------|--------|-------------|--------|
| 27.1 | 5 | Database & Service Layer | ✅ Complete |
| 27.2 | 3 | API Controller & DTOs | ✅ Complete |
| 27.3 | 2 | Caching (Redis, 1h TTL) | ✅ Complete |
| 27.4 | 3 | Documentation | ✅ Complete |
| **Total** | **13** | | ✅ |

---

## API Endpoint

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
| `sort_by` | string | No | "revenue" | Sort: "revenue" \| "net_margin_pct" \| "cogs_pct" |
| `sort_order` | enum | No | "desc" | "asc" \| "desc" |
| `limit` | number | No | 100 | Max results (max: 500) |

---

## Response Format

```json
{
  "meta": {
    "week": "2025-W47",
    "cabinet_id": "uuid-here",
    "view_by": "sku",
    "generated_at": "2025-12-09T10:00:00Z"
  },
  "summary": {
    "total_revenue": 305778.32,
    "avg_cogs_pct": 0,
    "avg_wb_fees_pct": 56.86,
    "avg_net_margin_pct": 43.14,
    "sku_count": 85,
    "profitable_sku_count": 72,
    "loss_making_sku_count": 13
  },
  "data": [
    {
      "sku_id": "147205694",
      "product_name": "Кошелек женский кожаный...",
      "category": "Кошельки",
      "brand": "Dianora",
      "revenue": 45000.00,

      "costs_pct": {
        "cogs": 25.5,
        "commission": 31.3,
        "logistics_delivery": 8.4,
        "logistics_return": 3.6,
        "storage": 0.6,
        "paid_acceptance": 0,
        "penalties": 0,
        "other_deductions": 10.8,
        "advertising": 0
      },

      "costs_rub": {
        "cogs": 11475.00,
        "commission": 14085.00,
        "logistics_delivery": 3780.00,
        "logistics_return": 1620.00,
        "storage": 270.00,
        "paid_acceptance": 0,
        "penalties": 0,
        "other_deductions": 4860.00,
        "advertising": 0
      },

      "total_costs_pct": 80.2,
      "net_margin_pct": 19.8,
      "net_profit": 8910.00,

      "profitability_status": "good",
      "missing_cogs": false
    }
  ]
}
```

---

## Profitability Status Classification

| Status | Net Margin % | Color (Frontend) | Description |
|--------|--------------|------------------|-------------|
| `excellent` | > 25% | Green (#22C55E) | Отличная маржинальность |
| `good` | 15-25% | Light Green (#84CC16) | Хорошая маржинальность |
| `warning` | 5-15% | Yellow (#EAB308) | Требует внимания |
| `critical` | 0-5% | Orange (#F97316) | Критически низкая |
| `loss` | < 0% | Red (#EF4444) | Убыточный товар |
| `unknown` | N/A | Gray (#9CA3AF) | COGS не назначен |

---

## Cost Fields Mapping

| Field | Source | Description |
|-------|--------|-------------|
| `cogs` | `weekly_margin_fact.cogs_rub` | Себестоимость (требует назначения COGS) |
| `commission` | `total_commission_rub` | Комиссия WB |
| `logistics_delivery` | 70% от `logistics_cost_rub` | Доставка (оценка) |
| `logistics_return` | 30% от `logistics_cost_rub` | Возврат (оценка) |
| `storage` | `storage_cost_rub` | Хранение |
| `paid_acceptance` | `paid_acceptance_cost_rub` | Платная приёмка |
| `penalties` | `penalties_rub` | Штрафы |
| `other_deductions` | `other_adjustments_rub` | Прочие удержания |
| `advertising` | - | Реклама (будущая функция, сейчас 0) |

---

## View Aggregation (`view_by`)

### `view_by=sku` (default)
- Отдельная строка для каждого SKU
- Используется для детального анализа товаров

### `view_by=brand`
- Группировка по брендам
- Взвешенное среднее затрат по revenue
- `sku_id` содержит название бренда

### `view_by=category`
- Группировка по категориям
- Взвешенное среднее затрат по revenue
- `sku_id` содержит название категории

### `view_by=total`
- Одна строка с итогами по всему портфелю
- `sku_id` = "TOTAL"

---

## Products Without COGS

Товары без назначенной себестоимости включаются в ответ со следующими полями:

```json
{
  "sku_id": "12345",
  "costs_pct": {
    "cogs": null,
    ...
  },
  "costs_rub": {
    "cogs": null,
    ...
  },
  "missing_cogs": true,
  "profitability_status": "unknown"
}
```

---

## Error Responses

| Status | Code | Message |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | "Week parameter is required" |
| 400 | `VALIDATION_ERROR` | "Invalid week format. Expected: YYYY-Www" |
| 401 | `UNAUTHORIZED` | "Authentication required" |
| 403 | `FORBIDDEN` | "Access denied to cabinet" |
| 404 | `NO_DATA_FOR_WEEK` | "No data for week 2025-W47" |

---

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Response time (100 SKUs) | <500ms | ✅ ~50-100ms (cached) |
| Response time (500 SKUs) | <1000ms | ✅ <500ms |
| Caching | 1h TTL | ✅ Redis implemented |

**Cache Key Format**: `unit-economics:{cabinetId}:{week}:{viewBy}:{sortBy}:{sortOrder}:{limit}`

---

## Usage Examples

### cURL

```bash
# Basic request (by SKU)
curl -X GET "http://localhost:3000/v1/analytics/unit-economics?week=2025-W47" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"

# By brand with custom sorting
curl -X GET "http://localhost:3000/v1/analytics/unit-economics?week=2025-W47&view_by=brand&sort_by=net_margin_pct&sort_order=asc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"

# Find lowest margin products
curl -X GET "http://localhost:3000/v1/analytics/unit-economics?week=2025-W47&sort_by=net_margin_pct&sort_order=asc&limit=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"
```

### TypeScript/Fetch

```typescript
const response = await fetch(
  `${API_URL}/v1/analytics/unit-economics?week=2025-W47&view_by=sku&limit=100`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Cabinet-Id': cabinetId,
    },
  }
);

const data = await response.json();

// Use data for waterfall chart
const chartData = data.data.map(item => ({
  name: item.product_name,
  revenue: item.revenue,
  cogs: item.costs_pct.cogs,
  commission: item.costs_pct.commission,
  logistics: item.costs_pct.logistics_delivery + item.costs_pct.logistics_return,
  netMargin: item.net_margin_pct,
  status: item.profitability_status,
}));
```

---

## REST Client Testing

Файл: `test-api/06-analytics-advanced.http`

```http
### Unit Economics - By SKU (default)
GET {{baseUrl}}/v1/analytics/unit-economics?week=2025-W47
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

### Unit Economics - By Brand
GET {{baseUrl}}/v1/analytics/unit-economics?week=2025-W47&view_by=brand
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

### Unit Economics - Lowest Margin First
GET {{baseUrl}}/v1/analytics/unit-economics?week=2025-W47&sort_by=net_margin_pct&sort_order=asc&limit=20
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

---

## Implementation Files

| File | Description |
|------|-------------|
| `src/analytics/controllers/unit-economics.controller.ts` | API Controller |
| `src/analytics/services/unit-economics.service.ts` | Business Logic + Caching |
| `src/analytics/dto/query/unit-economics-query.dto.ts` | Query DTO |
| `src/analytics/dto/response/unit-economics-response.dto.ts` | Response DTO |

---

## Frontend Integration

**Frontend Can Now Proceed With**:
- Story 5.2: Unit Economics Page Structure
- Story 5.3: Cost Breakdown Visualization (Waterfall Chart)
- Story 5.4: Integration Testing

---

## Resolved Questions

| Question | Resolution |
|----------|------------|
| Logistics split? | MVP: 70/30 estimate. Phase 2: Extract from raw data |
| Products without COGS? | Included with `missing_cogs: true`, status = `unknown` |
| Empty week? | Returns 404 with `NO_DATA_FOR_WEEK` |
| Insights generation? | Deferred to future release |

---

## References

- **Request**: `frontend/docs/request-backend/53-unit-economics-api-endpoint.md`
- **Backend Epic**: `docs/epics/epic-27-unit-economics-analytics.md`
- **API Reference**: `docs/API-PATHS-REFERENCE.md`
- **REST Client Tests**: `test-api/06-analytics-advanced.http`
