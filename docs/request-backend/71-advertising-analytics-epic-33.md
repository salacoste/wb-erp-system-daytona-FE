# Request #71: Advertising Analytics API (Epic 33)

**Date**: 2025-12-22 → **Updated**: 2025-12-24
**Status**: ✅ COMPLETE
**Epic**: Epic 33 - Advertising Analytics
**Backend PR**: All 8 stories merged
**SDK Version**: daytona-wildberries-typescript-sdk **v2.3.1+**

---

## ⚠️ Latest Update (2025-12-24): Critical Stats Sync Fix

**Problem Resolved**: Stats sync was failing with "nmId: undefined" errors in advertising_stats table.

**Root Causes Fixed**:
1. ✅ Missing ADV_SYNC queue routing in queue.service.ts
2. ✅ Wrong WB API parameters (v2 format instead of v3)
3. ✅ Optional chaining hiding API errors
4. ✅ Parser not handling nested response structure: `stats[].days[].apps[].nms[].nmId`

**Changes**:
- **SDK**: Upgraded from v2.3.0 to v2.3.1 (proper TypeScript types for nested responses)
- **WB API**: Fixed fullstats endpoint parameters `{ids, beginDate, endDate}` (batch up to 100 campaigns)
- **Queue**: Added ADV_SYNC queue injection and routing
- **Parser**: Updated for nested structure with nms[] array iteration
- **Rate Limits**: 3 req/min (20s interval) for fullstats endpoint

**Verification Results**:
- ✅ 54 stats records successfully synced
- ✅ 10 unique SKUs tracked
- ✅ Zero "nmId: undefined" errors

**Backend Commits**:
- `4c37521` - SDK upgrade and stats parser fix
- `180fd13` - Documentation updates
- `716ab52` - Test-API documentation updates

📖 **Troubleshooting Guide**: [ADVERTISING-ANALYTICS-GUIDE.md](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md#problem-stats-sync-failing-with-nmid-undefined-fixed-2025-12-24)

---

## Обзор

Полная интеграция рекламной аналитики Wildberries с расчётом ROAS/ROI, управлением кампаниями и автоматической синхронизацией данных.

## API Endpoints

---

## Backend Team Response
**Status**: RESOLVED — this document IS the backend response. See the parent request file for the original frontend ask.

### 1. Advertising Performance Metrics

```http
GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-21
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Query Parameters**:

| Параметр | Тип | Обязат. | По умолч. | Описание |
|----------|-----|---------|-----------|----------|
| `from` | string | ✅ | - | Дата начала (YYYY-MM-DD) |
| `to` | string | ✅ | - | Дата окончания (YYYY-MM-DD) |
| `view_by` | enum | ❌ | `sku` | Агрегация: `sku`, `campaign`, `brand`, `category` |
| `efficiency_filter` | enum | ❌ | `all` | Фильтр: `all`, `excellent`, `good`, `moderate`, `poor`, `loss`, `unknown` |
| `campaign_ids` | string | ❌ | - | Фильтр по ID кампаний (через запятую) |
| `sku_ids` | string | ❌ | - | Фильтр по ID товаров (через запятую) |
| `sort_by` | string | ❌ | `spend` | Сортировка: `spend`, `roas`, `roi`, `conversions` |
| `sort_order` | enum | ❌ | `desc` | Порядок: `asc`, `desc` |
| `limit` | number | ❌ | 100 | Лимит (1-500) |
| `offset` | number | ❌ | 0 | Смещение |

**Response**:

```typescript
interface AdvertisingAnalyticsResponse {
  meta: {
    cabinet_id: string;
    date_range: { from: string; to: string };
    view_by: 'sku' | 'campaign' | 'brand' | 'category';
    last_sync: string;  // ISO datetime
  };
  summary: {
    total_spend: number;        // Общие затраты ₽
    total_revenue: number;      // Общая выручка ₽
    total_profit: number;       // Общая прибыль ₽
    overall_roas: number;       // Общий ROAS
    overall_roi: number;        // Общий ROI
    avg_ctr: number;            // Средний CTR %
    avg_conversion_rate: number; // Средняя конверсия %
    campaign_count: number;     // Всего кампаний
    active_campaigns: number;   // Активных кампаний
  };
  data: AdvertisingItem[];
}

interface AdvertisingItem {
  // Идентификаторы (зависят от view_by)
  sku_id?: string;
  campaign_id?: number;
  brand?: string;
  category?: string;

  // Общие поля
  product_name?: string;

  // Метрики
  views: number;            // Показы
  clicks: number;           // Клики
  orders: number;           // Заказы
  spend: number;            // Затраты ₽
  revenue: number;          // Выручка ₽
  profit: number;           // Прибыль ₽

  // Расчётные метрики
  roas: number;             // revenue / spend
  roi: number;              // (profit - spend) / spend
  ctr: number;              // (clicks / views) × 100
  cpc: number;              // spend / clicks
  conversion_rate: number;  // (orders / clicks) × 100
  profit_after_ads: number; // profit - spend

  // Классификация
  efficiency_status: EfficiencyStatus;
}

type EfficiencyStatus =
  | 'excellent'  // ROAS ≥ 5.0, ROI ≥ 1.0
  | 'good'       // ROAS 3.0-5.0, ROI 0.5-1.0
  | 'moderate'   // ROAS 2.0-3.0, ROI 0.2-0.5
  | 'poor'       // ROAS 1.0-2.0, ROI 0-0.2
  | 'loss'       // ROAS < 1.0, ROI < 0
  | 'unknown';   // Нет данных о прибыли
```

### 2. Campaign List

```http
GET /v1/analytics/advertising/campaigns
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Query Parameters**:

| Параметр | Тип | По умолч. | Описание |
|----------|-----|-----------|----------|
| `status` | string | all | Фильтр по статусам (через запятую): `9` (active), `11` (paused) |
| `type` | number | all | Фильтр по типу: `8` (auto), `9` (unified/auction) |
| `search` | string | - | Поиск по названию |
| `limit` | number | 100 | Лимит |
| `offset` | number | 0 | Смещение |

**Response**:

```typescript
interface CampaignsResponse {
  meta: {
    cabinet_id: string;
    total_count: number;
    active_count: number;
  };
  data: Campaign[];
}

interface Campaign {
  campaign_id: number;
  name: string;
  type: number;           // 4-9
  type_name: string;      // "Аукцион", "Авто" и т.д.
  status: number;         // 4, 7, 8, 9, 11
  status_name: string;    // "Активна", "На паузе" и т.д.
  created_at: string;
  start_time: string;
  end_time: string | null;
  daily_budget: number;
  nm_ids: string[];       // Привязанные товары
  sku_count: number;
}
```

**WB Campaign Statuses**:

| Код | Название | Описание |
|-----|----------|----------|
| 4 | ready_for_start | Готова к запуску |
| 7 | ended | Завершена |
| 8 | declined | Отклонена |
| 9 | active | Активна |
| 11 | paused | На паузе |

**WB Campaign Types**:

| Код | Название | Описание |
|-----|----------|----------|
| 4 | carousel | Карусель |
| 5 | card | Карточка товара |
| 6 | catalog | Каталог |
| 7 | search | Поиск |
| 8 | auto | Автоматическая |
| 9 | unified | Аукцион (unified) |

### 3. Sync Status

```http
GET /v1/analytics/advertising/sync-status
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Response**:

```typescript
interface SyncStatusResponse {
  cabinet_id: string;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'error' | 'partial';
  next_scheduled_sync: string;
  campaigns_synced: number;
  stats_records_synced: number;
  cost_records_synced: number;
  sync_duration_seconds: number;
  error_count_last_24h: number;
  health_status: HealthStatus;
}

type HealthStatus =
  | 'healthy'    // Синхронизация работает нормально
  | 'degraded'   // Есть ошибки, но синхронизация работает
  | 'unhealthy'  // Синхронизация не работает
  | 'stale';     // Нет синхронизации > 26 часов
```

---

## Формулы метрик

| Метрика | Формула | Пример |
|---------|---------|--------|
| **ROAS** | `revenue / spend` | 3.6 = 360₽ дохода на 100₽ затрат |
| **ROI** | `(profit - spend) / spend` | 0.46 = 46% возврата инвестиций |
| **CTR** | `(clicks / views) × 100` | 3.0% = 3 клика на 100 показов |
| **CPC** | `spend / clicks` | 18.89₽ за клик |
| **Conversion Rate** | `(orders / clicks) × 100` | 4.89% = 4.89 заказов на 100 кликов |
| **Profit After Ads** | `profit - spend` | Чистая прибыль после рекламы |

---

## Классификация эффективности

| Статус | ROAS | ROI | Цвет | Рекомендация |
|--------|------|-----|------|--------------|
| `excellent` | ≥ 5.0 | ≥ 1.0 | 🟢 Green | Масштабировать бюджет |
| `good` | 3.0 - 5.0 | 0.5 - 1.0 | 🟢 Light Green | Поддерживать |
| `moderate` | 2.0 - 3.0 | 0.2 - 0.5 | 🟡 Yellow | Оптимизировать |
| `poor` | 1.0 - 2.0 | 0 - 0.2 | 🟠 Orange | Пересмотреть стратегию |
| `loss` | < 1.0 | < 0 | 🔴 Red | Остановить или изменить |
| `unknown` | N/A | N/A | ⚪ Gray | Нет данных о прибыли |

---

## Примеры использования

### Dashboard Widget - Топ рекламируемые товары

```typescript
const { data } = await api.get('/v1/analytics/advertising', {
  params: {
    from: '2025-12-01',
    to: '2025-12-21',
    view_by: 'sku',
    sort_by: 'spend',
    sort_order: 'desc',
    limit: 10
  },
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId
  }
});

// Показать summary
console.log(`Общие затраты: ${data.summary.total_spend}₽`);
console.log(`ROAS: ${data.summary.overall_roas}`);
console.log(`Активных кампаний: ${data.summary.active_campaigns}`);
```

### Отчёт оптимизации - убыточные кампании

```typescript
const { data } = await api.get('/v1/analytics/advertising', {
  params: {
    from: '2025-12-01',
    to: '2025-12-21',
    efficiency_filter: 'loss',
    sort_by: 'roi',
    sort_order: 'asc'
  }
});

// Список убыточных
data.data.forEach(item => {
  console.log(`${item.sku_id}: ROI ${item.roi}, потери ${-item.profit_after_ads}₽`);
});
```

### Сравнение по брендам

```typescript
const { data } = await api.get('/v1/analytics/advertising', {
  params: {
    from: '2025-12-01',
    to: '2025-12-21',
    view_by: 'brand',
    sort_by: 'roas',
    sort_order: 'desc'
  }
});
```

---

## Синхронизация данных

- **Расписание**: Ежедневно в 06:00 MSK
- **Источник**: WB Promotion API
- **Данные**: Кампании, статистика (views/clicks/orders), затраты

### Health Status индикатор

```typescript
function getSyncHealthColor(status: HealthStatus): string {
  switch (status) {
    case 'healthy': return 'green';
    case 'degraded': return 'yellow';
    case 'unhealthy': return 'red';
    case 'stale': return 'orange';
  }
}
```

---

## Обработка ошибок

| Код | Ситуация | Действие |
|-----|----------|----------|
| 400 | Невалидные параметры | Показать ошибку валидации |
| 401 | Нет авторизации | Редирект на логин |
| 403 | Нет доступа к кабинету | Показать ошибку доступа |
| 404 | Нет данных | Показать "Нет данных за период" |
| 500 | Ошибка сервера | Показать "Попробуйте позже" |

---

## Документация

### Backend

- **Test API (подробные примеры)**: [`test-api/07-advertising-analytics.http`](/test-api/07-advertising-analytics.http)
- **API Reference**: [`docs/API-PATHS-REFERENCE.md`](/docs/API-PATHS-REFERENCE.md#advertising-analytics-epic-33)
- **Epic Documentation**: [`docs/epics/epic-33-advertising-analytics.md`](/docs/epics/epic-33-advertising-analytics.md)
- **Completed Epics Reference**: [`docs/COMPLETED-EPICS-REFERENCE.md`](/docs/COMPLETED-EPICS-REFERENCE.md#epic-33)

### Stories

| Story | Описание | Статус |
|-------|----------|--------|
| 33.1 | Database Schema | ✅ |
| 33.2 | WB Promotion SDK Integration | ✅ |
| 33.3 | BullMQ Sync Job | ✅ |
| 33.4 | Campaign Service | ✅ |
| 33.5 | ROAS/ROI Analytics Service | ✅ |
| 33.6 | REST API Controller | ✅ |
| 33.7 | Materialized Views & Performance | ✅ |
| 33.8 | Testing & Observability | ✅ |

---

## Связанные запросы

- **Request #53**: Unit Economics API — используется для расчёта profit
- **Request #60**: Per-SKU Operational Costs — базовые expense данные
- **Epic 24**: Paid Storage — storage costs integration

---

## TODO для Frontend

- [ ] Создать страницу `/analytics/advertising`
- [ ] Добавить виджет на Dashboard с summary метриками
- [ ] Реализовать таблицу с сортировкой и фильтрацией
- [ ] Добавить цветовую индикацию efficiency_status
- [ ] Показывать health_status синхронизации
- [ ] Добавить графики ROAS/ROI по дням (если нужно)

---

## WB API v3 Integration & SDK v2.3.1 Technical Details

### Nested Response Structure

**WB API v3** изменил структуру ответа fullstats endpoint на nested формат:

```typescript
// stats[].days[].apps[].nms[] - SKU breakdown
interface WBFullstatsResponse {
  stats: Array<{
    advertId: number;
    days: Array<{
      date: string;  // YYYY-MM-DD
      apps: Array<{
        appType: number;
        nms: Array<{         // ← Nested SKU array
          nmId: number;      // ← Previously undefined
          views: number;
          clicks: number;
          ctr: number;
          cpc: number;
          orders: number;
          sum_price: number;  // ordersSumRub
          sum: number;        // spend
        }>;
      }>;
    }>;
  }>;
}
```

### Backend Parser Implementation

```typescript
// src/imports/services/adv-sync.service.ts
if (day.apps && Array.isArray(day.apps)) {
  for (const app of day.apps) {
    const nms = app.nms as Record<string, unknown>[] | undefined;
    if (nms && Array.isArray(nms)) {
      for (const nm of nms) {
        const nmId = nm.nmId as number | undefined;
        if (nmId) {
          records.push({
            advertId,
            date,
            nmId,           // ✅ Now correctly extracted
            views: (nm.views as number) || 0,
            clicks: (nm.clicks as number) || 0,
            // ... other metrics
          });
        }
      }
    }
  }
}
```

### Rate Limits & Batch Processing

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Endpoint** | GET /adv/v3/fullstats | WB Promotion API v3 |
| **Rate Limit** | 3 req/min | 20s interval between requests |
| **Batch Size** | Up to 100 campaign IDs | Comma-separated in `ids` param |
| **Date Format** | YYYY-MM-DD | `beginDate`, `endDate` params |

**Example Request**:
```http
GET /adv/v3/fullstats?ids=12345,67890,11111&beginDate=2025-12-01&endDate=2025-12-21
Authorization: Bearer <wb-token>
```

### Frontend Impact

**No Breaking Changes** - API response format unchanged (camelCase fields as before).

**Improved Reliability**:
- Stats sync now succeeds for all campaigns
- No missing nmId values in response
- Accurate SKU-level attribution for ROAS/ROI calculations

**Sync Schedule**: Daily 06:00 MSK with automatic retry on failure.

---

## Data Availability (Updated 2026-01-30)

### Actual Data Range

The advertising analytics API contains data from **2025-12-01 to 2026-01-28**.

### Querying Outside Available Range

When querying with `from`/`to` parameters that don't overlap with this range:
- The API correctly returns empty results
- `items: []` and `summary: { totalSpend: 0, ... }`
- This is expected behavior - no data exists for requested period

### Example

**Request**: `GET /v1/analytics/advertising?from=2025-11-18&to=2025-11-24`
**Result**: Empty (2025-11-18 to 2025-11-24 is BEFORE data starts)

**Solution**: Use dates within the available range (2025-12-01 to 2026-01-28).

### Frontend Integration

**Empty State Handling**:
1. Check if requested date range overlaps with available data
2. Display empty state component when no overlap
3. Show available date range to user
4. Provide smart date picker with unavailable dates disabled

**Component Reference**:
- `AdvertisingEmptyState` - Empty state component
- Smart date picker - Calendar with unavailable dates disabled

**Documentation**: [Request #115](./115-advertising-date-filter-empty-state-behavior.md) - Complete empty state guide

---

## Related Documentation

### Backend (Updated 2025-12-24)

- **[ADVERTISING-ANALYTICS-GUIDE.md](../../../docs/ADVERTISING-ANALYTICS-GUIDE.md)** - Complete guide with troubleshooting
- **[CHANGELOG.md](../../../docs/CHANGELOG.md)** - SDK 2.3.1 upgrade entry
- **[architecture/06-external-apis.md](../../../docs/architecture/06-external-apis.md)** - WB API v3 details
- **[test-api/07-advertising-analytics.http](../../../test-api/07-advertising-analytics.http)** - API testing examples

### Stories

| Story | Описание | Статус |
|-------|----------|--------|
| 33.1 | Database Schema | ✅ |
| 33.2 | **WB Promotion SDK Integration** | ✅ **Fixed 2025-12-24** |
| 33.3 | BullMQ Sync Job | ✅ |
| 33.4 | Campaign Service | ✅ |
| 33.5 | ROAS/ROI Analytics Service | ✅ |
| 33.6 | REST API Controller | ✅ |
| 33.7 | Materialized Views & Performance | ✅ |
| 33.8 | Testing & Observability | ✅ |

---

*Дата создания: 2025-12-22*
*Последнее обновление: 2026-01-30*
*SDK Version: daytona-wildberries-typescript-sdk v2.3.1+*

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2026-01-30
- **Summary**: Epic 33 (Advertising Analytics) is complete with all 8 stories implemented. Provides campaign-level analytics with spend, revenue, ROAS/ROI metrics, and materialized views for performance. SDK upgraded to v2.3.1+ (now v3.10.0). Data available from 2025-12-01 onward. Empty state handling documented in Request #115.
- **Remaining frontend action**: Integrate advertising analytics with smart date picker showing available date ranges. Handle empty state for periods outside available data.
