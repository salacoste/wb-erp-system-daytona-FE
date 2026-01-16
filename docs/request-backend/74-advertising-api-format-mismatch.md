# Request #74: Advertising API Format Mismatch

**Date**: 2025-12-24
**Status**: 🟡 WORKAROUND APPLIED (Frontend Adapter)
**Priority**: Medium
**Related**: Request #71 (Advertising Analytics API - Epic 33)

---

## Проблема

Backend возвращает **другой формат** ответа, чем документировано в Request #71.

### Фактический backend response (2025-12-24)

```json
{
  "items": [...],           // ❌ Документация ожидает "data"
  "summary": {
    "totalSpend": 12283.24, // ❌ Документация ожидает "total_spend" (snake_case)
    "totalRevenue": 0,
    "totalProfit": 188313.48,
    "avgRoas": 0,           // ❌ Документация: "overall_roas"
    "avgRoi": 14.33,        // ❌ Документация: "overall_roi"
    "avgCtr": 5.8,
    "avgCpc": 16.94,
    "avgConversionRate": 10.76,
    "campaignCount": 0,     // ❌ Документация: "campaign_count"
    "activeCampaigns": 0    // ❌ Документация: "active_campaigns"
  },
  "query": {
    "from": "2025-12-10",
    "to": "2025-12-23",
    "viewBy": "sku"         // ❌ Документация ожидает "meta.view_by"
  },
  "pagination": {
    "total": 17,
    "limit": 100,
    "offset": 0
  },
  "cachedAt": "2025-12-24T00:58:07.485Z"
}
```

### Ожидаемый формат (Request #71)

```json
{
  "meta": {
    "cabinet_id": "uuid",
    "date_range": { "from": "...", "to": "..." },
    "view_by": "sku",
    "last_sync": "ISO datetime"
  },
  "summary": {
    "total_spend": 12283.24,        // snake_case
    "total_revenue": 0,
    "total_profit": 188313.48,
    "overall_roas": 0,              // not "avgRoas"
    "overall_roi": 14.33,           // not "avgRoi"
    "avg_ctr": 5.8,
    "avg_conversion_rate": 10.76,
    "campaign_count": 0,            // snake_case
    "active_campaigns": 0           // snake_case
  },
  "data": [...]                     // not "items"
}
```

---

## Несоответствия (детально)

### 1. Top-level structure

| Фактически | Ожидается | Статус |
|------------|-----------|--------|
| `items` | `data` | ❌ Не совпадает |
| `query` | `meta` | ❌ Разные структуры |
| `pagination` | Внутри `meta` | ❌ Отсутствует |
| `cachedAt` | `meta.last_sync` | ❌ Разные имена |

### 2. Summary fields naming

| Фактически (camelCase) | Ожидается (snake_case) |
|------------------------|------------------------|
| `totalSpend` | `total_spend` |
| `totalRevenue` | `total_revenue` |
| `totalProfit` | `total_profit` |
| `avgRoas` | `overall_roas` |
| `avgRoi` | `overall_roi` |
| `avgCtr` | `avg_ctr` |
| `avgConversionRate` | `avg_conversion_rate` |
| `campaignCount` | `campaign_count` |
| `activeCampaigns` | `active_campaigns` |

### 3. Items structure

| Фактически | Ожидается | Статус |
|------------|-----------|--------|
| `nmId` (number) | `sku_id` (string) | ❌ Разные типы и имена |
| `label` | `product_name` | ❌ Разные имена |
| `conversionRate` | `conversion_rate` | ❌ camelCase vs snake_case |
| `profitAfterAds` | `profit_after_ads` | ❌ camelCase vs snake_case |
| `efficiency.status` | `efficiency_status` | ❌ Вложенный vs плоский |

---

## Frontend Workaround (Применен 2025-12-24)

Создан **adapter** в `src/lib/api/advertising-analytics.ts`:

```typescript
// ADAPTER: Backend returns different format (camelCase, "items" instead of "data")
// Adapt backend response to match frontend types
const response: AdvertisingAnalyticsResponse = {
  meta: {
    cabinet_id: backendResponse.query?.cabinetId || 'unknown',
    date_range: {
      from: backendResponse.query?.from || params.from,
      to: backendResponse.query?.to || params.to,
    },
    view_by: backendResponse.query?.viewBy || 'sku',
    last_sync: backendResponse.cachedAt || new Date().toISOString(),
  },
  summary: {
    total_spend: backendResponse.summary?.totalSpend ?? 0,
    total_revenue: backendResponse.summary?.totalRevenue ?? 0,
    total_profit: backendResponse.summary?.totalProfit ?? 0,
    overall_roas: backendResponse.summary?.avgRoas ?? 0,
    overall_roi: backendResponse.summary?.avgRoi ?? 0,
    avg_ctr: backendResponse.summary?.avgCtr ?? 0,
    avg_conversion_rate: backendResponse.summary?.avgConversionRate ?? 0,
    campaign_count: backendResponse.summary?.campaignCount ?? 0,
    active_campaigns: backendResponse.summary?.activeCampaigns ?? 0,
  },
  data: (backendResponse.items || []).map((item: any) => ({
    sku_id: item.nmId?.toString(),
    product_name: item.label,
    brand: item.brand,
    category: item.category,
    views: item.views ?? 0,
    clicks: item.clicks ?? 0,
    orders: item.orders ?? 0,
    spend: item.spend ?? 0,
    revenue: item.revenue ?? 0,
    profit: item.profit ?? 0,
    roas: item.roas ?? 0,
    roi: item.roi ?? 0,
    ctr: item.ctr ?? 0,
    cpc: item.cpc ?? 0,
    conversion_rate: item.conversionRate ?? 0,
    profit_after_ads: item.profitAfterAds ?? 0,
    efficiency_status: item.efficiency?.status || 'unknown',
  })),
}
```

**Результат**: ✅ Frontend теперь работает с реальным backend форматом.

---

## Рекомендации для Backend

### Вариант 1: Привести к документации (Request #71)

Изменить формат ответа `/v1/analytics/advertising` чтобы соответствовать Request #71:

1. **Переименовать top-level поля**:
   - `items` → `data`
   - `query` + `pagination` → объединить в `meta`
   - `cachedAt` → `meta.last_sync`

2. **Переименовать summary поля в snake_case**:
   - `totalSpend` → `total_spend`
   - `avgRoas` → `overall_roas`
   - `avgRoi` → `overall_roi`
   - `campaignCount` → `campaign_count`
   - `activeCampaigns` → `active_campaigns`

3. **Переименовать item поля в snake_case**:
   - `nmId` → `sku_id` (строка)
   - `label` → `product_name`
   - `conversionRate` → `conversion_rate`
   - `profitAfterAds` → `profit_after_ads`
   - `efficiency.status` → `efficiency_status` (плоская структура)

### Вариант 2: Обновить документацию (Request #71)

Если backend формат финальный, обновить Request #71 чтобы отразить реальный формат API.

---

## Влияние на Frontend

**Текущее состояние**: ✅ Frontend работает через adapter (workaround).

**Если backend изменит формат на документированный**:
- Удалить adapter из `src/lib/api/advertising-analytics.ts`
- Обновить типы (уже соответствуют Request #71)
- Тесты продолжат работать (мокируют документированный формат)

**Breaking Change Risk**: 🟡 Средний - только один endpoint.

---

## Test Request (curl)

```bash
TOKEN="your-jwt-token"
CABINET="your-cabinet-id"

curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-10&to=2025-12-23" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '.summary'
```

**Фактический ответ**:
```json
{
  "totalSpend": 12283.24,  // camelCase
  "totalRevenue": 0,
  ...
}
```

**Ожидаемый ответ (Request #71)**:
```json
{
  "total_spend": 12283.24,  // snake_case
  "total_revenue": 0,
  ...
}
```

---

## Связанные файлы

### Frontend
- `src/lib/api/advertising-analytics.ts` - Adapter функция (строки 115-173)
- `src/types/advertising-analytics.ts` - TypeScript типы (соответствуют Request #71)

### Backend
- `src/analytics/controllers/advertising-analytics.controller.ts` - Контроллер
- `src/analytics/dto/response/advertising-response.dto.ts` - Response DTO

---

*Создано: 2025-12-24*
*Frontend Workaround: APPLIED*
*Ожидает решения: Backend должен выбрать Вариант 1 или 2*
