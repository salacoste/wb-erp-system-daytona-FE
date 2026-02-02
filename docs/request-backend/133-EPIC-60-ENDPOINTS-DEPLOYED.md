# Epic 60 Endpoints - Deployed and Working

**Date**: 2026-02-01
**Status**: ✅ RESOLVED
**Issue**: Frontend reported 404 NOT_FOUND errors

---

## Resolution

**Причина**: Frontend тестировал endpoints ДО деплоя бэкенда.

**Текущий статус**: Все 11 endpoints Epic 60 задеплоены и работают.

---

## Verification

```bash
# Check endpoints in Swagger
curl "http://localhost:3000/api-json" | jq '.paths | keys | .[] | select(contains("fbo") or contains("fulfillment"))'

# Result: 11 endpoints registered
"/v1/analytics/fulfillment/summary"
"/v1/analytics/fulfillment/sync-status"
"/v1/analytics/fulfillment/trends"
"/v1/orders/fbo"
"/v1/orders/fbo/aggregate"
"/v1/orders/fbo/backfill"
"/v1/orders/fbo/sync"
"/v1/orders/fbo/sync-status"
"/v1/orders/fbo/{orderId}"
"/v1/sales/fbo"
"/v1/sales/fbo/aggregate"
```

---

## Available Endpoints

### Fulfillment Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/analytics/fulfillment/summary` | FBO/FBS/Total metrics summary |
| GET | `/v1/analytics/fulfillment/trends` | Daily breakdown by fulfillment type |
| GET | `/v1/analytics/fulfillment/sync-status` | Sync status with timestamps |

### FBO Orders

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/orders/fbo` | List FBO orders (paginated) |
| GET | `/v1/orders/fbo/:orderId` | Single order details |
| GET | `/v1/orders/fbo/aggregate` | Aggregated statistics |
| GET | `/v1/orders/fbo/sync-status` | FBO sync status |
| POST | `/v1/orders/fbo/sync` | Manual sync trigger |
| POST | `/v1/orders/fbo/backfill` | Historical backfill |

### FBO Sales

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/sales/fbo` | List FBO sales (paginated) |
| GET | `/v1/sales/fbo/aggregate` | Aggregated sales statistics |

---

## Authentication Required

All endpoints require:
- `Authorization: Bearer {JWT_TOKEN}`
- `X-Cabinet-Id: {cabinet_id}`

Example:
```bash
curl -X GET "http://localhost:3000/v1/analytics/fulfillment/summary?from=2026-01-19&to=2026-01-25" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "X-Cabinet-Id: cm123..."
```

---

## Query Parameters

### Date Filtering
| Param | Format | Example | Description |
|-------|--------|---------|-------------|
| `from` | ISO date | `2026-01-19` | Start date (inclusive) |
| `to` | ISO date | `2026-01-25` | End date (inclusive) |

### Pagination
| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `offset` | number | 0 | - | Skip N records |
| `limit` | number | 100 | 1000 | Records per page |

---

## Response Format

> **Note**: Response format aligned with doc 131-EPIC-60-FBO-FBS-API-COMPLETE-GUIDE.md

### Summary Response (`/v1/analytics/fulfillment/summary`)
```json
{
  "summary": {
    "fbo": {
      "ordersCount": 150,
      "ordersRevenue": 500000,
      "salesCount": 140,
      "salesRevenue": 480000,
      "forPayTotal": 450000,
      "returnsCount": 8,
      "returnsRevenue": 30000,
      "returnRate": 5.3,
      "avgOrderValue": 3333
    },
    "fbs": {
      "ordersCount": 85,
      "ordersRevenue": 205000,
      "salesCount": 80,
      "salesRevenue": 195000,
      "forPayTotal": 180000,
      "returnsCount": 4,
      "returnsRevenue": 12000,
      "returnRate": 4.7,
      "avgOrderValue": 2412
    },
    "total": {
      "ordersCount": 235,
      "ordersRevenue": 705000,
      "fboShare": 63.8,
      "fbsShare": 36.2
    }
  },
  "period": {
    "from": "2026-01-19",
    "to": "2026-01-25"
  }
}
```

---

## Swagger UI

Full API documentation: http://localhost:3000/api

Filter by tag: `fulfillment-analytics`, `orders-fbo`, `sales-fbo`

---

## Related Documentation

- [Epic 60 Specification](../../docs/epics/epic-60-fbo-fbs-analytics.md)
- [FBO/FBS Data Guide](../../docs/FBO-FBS-DATA-GUIDE.md)
- [API Integration Guide](130-DASHBOARD-FBO-ORDERS-API.md)
