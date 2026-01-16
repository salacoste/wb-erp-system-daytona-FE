# Request #37: Epic 24 Storage Analytics Endpoints - RESOLVED

**Date**: 2025-11-29
**Priority**: ~~CRITICAL~~ → Resolved
**Status**: ✅ **RESOLVED** - Backend circular dependency fixed
**Component**: Backend API - Analytics Module
**Epic**: [Epic 24: Paid Storage by Article](../../../docs/epics/epic-24-paid-storage-by-article.md)

---

## Problem

Frontend страница `/analytics/storage` возвращает **404 ошибку** при попытке загрузить данные.

**Error Response**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Cannot GET /v1/analytics/storage/by-sku",
    "details": [],
    "trace_id": "f4656f85-c5f1-4161-82b4-dae2d69fcb69",
    "timestamp": "2025-11-29T17:36:59.496Z",
    "path": "/v1/analytics/storage/by-sku"
  }
}
```

**Verification**:
```bash
curl -s http://localhost:3000/v1/analytics/storage/by-sku
# Returns: 404 NOT_FOUND
```

---

## Expected vs Actual

| Aspect | Expected | Actual |
|--------|----------|--------|
| **Documentation** | Epic 24 marked as "COMPLETE" | Endpoints don't exist |
| **Endpoint** | `GET /v1/analytics/storage/by-sku` | 404 NOT_FOUND |
| **Frontend** | Shows storage analytics | Broken page |

---

## Missing Endpoints (Story 24.3)

According to `36-epic-24-paid-storage-analytics-api.md`, these endpoints should exist:

### 1. GET /v1/analytics/storage/by-sku

**Query Parameters**:
| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `weekStart` | string | ✅ | Начало периода (ISO week: `YYYY-Www`) |
| `weekEnd` | string | ✅ | Конец периода (ISO week: `YYYY-Www`) |
| `nm_id` | string | ❌ | Фильтр по артикулу WB |
| `brand` | string | ❌ | Фильтр по бренду |
| `warehouse` | string | ❌ | Фильтр по складу |
| `sort_by` | string | ❌ | Сортировка: `storage_cost` (default), `volume`, `nm_id` |
| `sort_order` | string | ❌ | Порядок: `asc`, `desc` (default) |
| `limit` | number | ❌ | Записей на страницу (default: 50, max: 200) |
| `cursor` | string | ❌ | Курсор пагинации |

**Expected Response**:
```json
{
  "period": {
    "from": "2025-W44",
    "to": "2025-W47",
    "days_count": 28
  },
  "data": [
    {
      "nm_id": "12345678",
      "vendor_code": "SHIRT-001",
      "product_name": "Футболка хлопок",
      "brand": "MyBrand",
      "storage_cost_total": 4500.00,
      "storage_cost_avg_daily": 160.71,
      "volume_avg": 0.5,
      "warehouses": ["Коледино", "Казань"],
      "days_stored": 28
    }
  ],
  "summary": {
    "total_storage_cost": 125000.00,
    "products_count": 150,
    "avg_cost_per_product": 833.33
  },
  "pagination": {
    "total": 150,
    "cursor": "eyJvZmZzZXQiOjIwfQ==",
    "has_more": true
  }
}
```

### 2. GET /v1/analytics/storage/top-consumers

**Query Parameters**:
| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `weekStart` | string | ✅ | Начало периода |
| `weekEnd` | string | ✅ | Конец периода |
| `limit` | number | ❌ | Количество (default: 10, max: 100) |
| `include_revenue` | boolean | ❌ | Включить данные о выручке |

**Expected Response**:
```json
{
  "period": {
    "from": "2025-W47",
    "to": "2025-W47",
    "days_count": 7
  },
  "top_consumers": [
    {
      "rank": 1,
      "nm_id": "87654321",
      "vendor_code": "COAT-XL-001",
      "product_name": "Пальто зимнее XL",
      "brand": "WinterStyle",
      "storage_cost": 3500.00,
      "percent_of_total": 12.5,
      "volume": 2.5,
      "revenue_net": 15000.00,
      "storage_to_revenue_ratio": 23.33
    }
  ],
  "total_storage_cost": 28000.00
}
```

### 3. GET /v1/analytics/storage/trends

**Query Parameters**:
| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `weekStart` | string | ✅ | Начало периода |
| `weekEnd` | string | ✅ | Конец периода |
| `nm_id` | string | ❌ | Конкретный SKU |
| `metrics` | string | ❌ | Метрики: `storage_cost,volume` |
| `include_summary` | boolean | ❌ | Включить статистику |

**Expected Response**:
```json
{
  "period": {
    "from": "2025-W40",
    "to": "2025-W47",
    "days_count": 56
  },
  "nm_id": null,
  "data": [
    { "week": "2025-W40", "storage_cost": 15000.00, "volume": null },
    { "week": "2025-W41", "storage_cost": 15500.00, "volume": null }
  ],
  "summary": {
    "storage_cost": {
      "min": 15000.00,
      "max": 18000.00,
      "avg": 16250.00,
      "trend": 20.0
    }
  }
}
```

---

## Frontend Impact

**Affected Pages**:
- `/analytics/storage` - Main storage analytics page (BROKEN)

**Frontend Components Ready**:
- `src/app/(dashboard)/analytics/storage/page.tsx`
- `src/lib/api/storage-analytics.ts`
- `src/types/storage-analytics.ts`
- `src/hooks/useStorageAnalytics.ts`

**Error Shown to Users**:
```
Cannot GET /v1/analytics/storage/by-sku?week_start=2025-W44&week_end=2025-W47&limit=20
```

---

## Required Action

### Option A: Implement Endpoints (Recommended)

Implement Story 24.3 endpoints as documented in `36-epic-24-paid-storage-analytics-api.md`:

1. Create `StorageAnalyticsController` with routes:
   - `GET /v1/analytics/storage/by-sku`
   - `GET /v1/analytics/storage/top-consumers`
   - `GET /v1/analytics/storage/trends`

2. Create `StorageAnalyticsService` with methods:
   - `getStorageBySku(params)`
   - `getTopConsumers(params)`
   - `getTrends(params)`

3. Use existing `paid_storage_daily` table (Story 24.1)

### Option B: Temporary - Hide Storage Page

If backend implementation is delayed, frontend can hide the Storage navigation item:

```typescript
// src/components/custom/Sidebar.tsx
// Comment out or remove Storage link until backend ready
```

---

## Parameter Naming Convention

**Important**: Frontend currently sends **snake_case** params, documentation shows **camelCase**:

| Frontend Sends | Docs Expect |
|----------------|-------------|
| `week_start` | `weekStart` |
| `week_end` | `weekEnd` |

**Recommendation**: Backend should accept **both** formats or frontend will need update.

---

## Database Dependencies

Story 24.1 (Database Schema) should have created:
- Table: `paid_storage_daily`
- Indexes for efficient queries

**Verification needed**:
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'paid_storage_daily'
);
```

---

## Acceptance Criteria

- [ ] `GET /v1/analytics/storage/by-sku` returns 200 with data
- [ ] `GET /v1/analytics/storage/top-consumers` returns 200 with data
- [ ] `GET /v1/analytics/storage/trends` returns 200 with data
- [ ] Frontend `/analytics/storage` page loads without errors
- [ ] Pagination works correctly
- [ ] Filters (nm_id, brand, warehouse) work
- [ ] Sorting works (storage_cost, volume)

---

## Related Documentation

- **API Spec**: `docs/request-backend/36-epic-24-paid-storage-analytics-api.md`
- **Epic**: `docs/epics/epic-24-paid-storage-by-article.md`
- **Story 24.3**: `docs/stories/epic-24/story-24.3-api-endpoints.md`

---

## Timeline

**Urgency**: HIGH - Frontend page is completely broken

**Estimated Effort**:
- Backend endpoints: 4-6 hours
- Testing: 2 hours

---

**Status**: Waiting for backend implementation
