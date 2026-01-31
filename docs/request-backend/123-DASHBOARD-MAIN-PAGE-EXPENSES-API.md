# Dashboard Expenses API - Руководство для Frontend

**Версия**: 1.0 | **Дата**: 2026-01-31 | **Автор**: Product Manager

---

## Содержание

1. [Обзор](#обзор)
2. [Аутентификация](#аутентификация)
3. [Рекламные затраты (Advertising)](#1-рекламные-затраты-advertising)
4. [Логистика (Logistics)](#2-логистика-logistics)
5. [Хранение (Storage)](#3-хранение-storage)
6. [Агрегированные расходы](#4-агрегированные-расходы)
7. [Примеры запросов для дашборда](#5-примеры-запросов-для-дашборда)
8. [Рекомендации по реализации](#6-рекомендации-по-реализации)

---

## Обзор

Дашборд расходов отображает три категории затрат:

| Категория | Эндпоинт | Описание |
|-----------|----------|----------|
| **Рекламные затраты** | `/v1/analytics/advertising` | Расходы на рекламу, ROAS, органика |
| **Логистика** | `/v1/analytics/weekly/finance-summary` | Стоимость доставки и возвратов |
| **Хранение** | `/v1/analytics/storage/*` | Затраты на хранение на складах |

### Периоды данных

- **Последняя неделя**: 7 дней, группировка по дням
- **Последний месяц**: ~30 дней, группировка по дням/неделям

---

## Аутентификация

Все запросы требуют:

```http
Authorization: Bearer <JWT_TOKEN>
X-Cabinet-Id: <CABINET_UUID>
Content-Type: application/json
```

---

## 1. Рекламные затраты (Advertising)

### 1.1 Основной эндпоинт

```http
GET /v1/analytics/advertising
```

**Назначение**: Метрики эффективности рекламы с ROAS/ROI и разделением на органику/рекламу.

### Параметры запроса

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `from` | ✅ | - | Начало периода (YYYY-MM-DD) |
| `to` | ✅ | - | Конец периода (YYYY-MM-DD) |
| `view_by` | ❌ | `sku` | Группировка: `sku`, `campaign`, `brand`, `category` |
| `group_by` | ❌ | `sku` | Группировка по склейкам: `imtId` или `sku` |
| `sort_by` | ❌ | `spend` | Сортировка: `spend`, `revenue`, `roas`, `roi`, `orders` |
| `sort_order` | ❌ | `desc` | Направление: `asc`, `desc` |
| `efficiency_filter` | ❌ | `all` | Фильтр: `excellent`, `good`, `moderate`, `poor`, `loss` |
| `limit` | ❌ | 50 | Лимит записей (1-500) |
| `offset` | ❌ | 0 | Смещение для пагинации |

### Примеры запросов

```http
# Последняя неделя - по SKU
GET /v1/analytics/advertising?from=2026-01-24&to=2026-01-31

# Последний месяц - по кампаниям
GET /v1/analytics/advertising?from=2026-01-01&to=2026-01-31&view_by=campaign

# Только убыточные кампании
GET /v1/analytics/advertising?from=2026-01-01&to=2026-01-31&efficiency_filter=loss

# Сортировка по ROAS (лучшие первыми)
GET /v1/analytics/advertising?from=2026-01-01&to=2026-01-31&sort_by=roas&sort_order=desc
```

### Структура ответа

```json
{
  "items": [
    {
      "key": "sku:147205694",
      "label": "Кошелек женский кожаный",
      "nmId": 147205694,
      "views": 15000,
      "clicks": 450,
      "orders": 22,
      "spend": 8500.00,
      "ctr": 3.0,
      "cpc": 18.89,
      "conversionRate": 4.89,
      "revenue": 28600.00,
      "profit": 12400.00,
      "profitAfterAds": 3900.00,
      "roas": 3.36,
      "roi": 0.46,
      "totalSales": 35000.00,
      "organicSales": 6400.00,
      "organicContribution": 18.29,
      "efficiency": {
        "status": "good",
        "recommendation": null
      }
    }
  ],
  "summary": {
    "totalSpend": 125000.00,
    "totalRevenue": 450000.00,
    "totalProfit": 85000.00,
    "totalProfitAfterAds": 40000.00,
    "totalViews": 1500000,
    "totalClicks": 75000,
    "totalOrders": 3750,
    "avgRoas": 3.6,
    "avgRoi": 0.68,
    "avgCtr": 5.0,
    "avgCpc": 1.67
  },
  "query": {
    "from": "2026-01-24",
    "to": "2026-01-31",
    "viewBy": "sku"
  },
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  },
  "cachedAt": "2026-01-31T10:30:00.000Z"
}
```

### Ключевые метрики

| Метрика | Формула | Описание |
|---------|---------|----------|
| `spend` | - | Расходы на рекламу (₽) |
| `revenue` | - | Выручка от рекламных заказов (₽) |
| `roas` | `revenue / spend` | Return on Ad Spend |
| `roi` | `(profit - spend) / spend` | Return on Investment |
| `organicSales` | `totalSales - revenue` | Продажи без рекламы (₽) |
| `organicContribution` | `(organicSales / totalSales) × 100` | % органических продаж |
| `profitAfterAds` | `profit - spend` | Чистая прибыль после рекламы (₽) |

### Классификация эффективности

| Статус | Условие | Рекомендация |
|--------|---------|--------------|
| `excellent` | ROAS > 5, ROI > 1 | Масштабировать |
| `good` | ROAS 3-5, ROI 0.5-1 | Поддерживать |
| `moderate` | ROAS 2-3, ROI 0.2-0.5 | Оптимизировать таргетинг |
| `poor` | ROAS 1-2, ROI 0-0.2 | Пересмотреть ставки |
| `loss` | ROAS < 1, ROI < 0 | Остановить/реструктурировать |

### 1.2 Статус синхронизации рекламы

```http
GET /v1/analytics/advertising/sync-status
```

**Ответ:**

```json
{
  "lastSyncAt": "2026-01-31T04:05:00.000Z",
  "nextScheduledSync": "2026-02-01T04:00:00.000Z",
  "status": "completed",
  "campaignsSynced": 262,
  "dataAvailableFrom": "2025-12-01",
  "dataAvailableTo": "2026-01-30"
}
```

**Статусы синхронизации**: `idle`, `syncing`, `completed`, `partial_success`, `failed`

---

## 2. Логистика (Logistics)

### 2.1 Финансовая сводка (включает логистику)

```http
GET /v1/analytics/weekly/finance-summary
```

**Параметры:**

| Параметр | Обязательный | Описание |
|----------|--------------|----------|
| `week` | ✅ | ISO неделя (YYYY-Www), например `2026-W05` |

### Пример запроса

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W05
```

### Структура ответа (релевантные поля)

```json
{
  "summary_rus": {
    "week": "2026-W05",
    "logistics_cost": 34576.48,
    "storage_cost": 1763.35,
    "sale_gross": 292665.00,
    "payout_total": 131673.83
  },
  "summary_total": {
    "logistics_cost_total": 36500.00,
    "storage_cost_total": 1850.00
  }
}
```

### 2.2 Тренды (включая логистику)

```http
GET /v1/analytics/weekly/trends
```

**Параметры:**

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `from` | ✅ | - | Начало периода (YYYY-Www) |
| `to` | ✅ | - | Конец периода (YYYY-Www) |
| `metrics` | ❌ | all | Метрики через запятую |
| `include_summary` | ❌ | `true` | Включать сводку |

### Пример запроса для логистики

```http
GET /v1/analytics/weekly/trends?from=2026-W01&to=2026-W05&metrics=logistics_cost,storage_cost,payout_total
```

### Структура ответа

```json
{
  "period": { "from": "2026-W01", "to": "2026-W05" },
  "data": [
    { "week": "2026-W01", "logistics_cost": 15000.00, "storage_cost": 1200.00, "payout_total": 95000.00 },
    { "week": "2026-W02", "logistics_cost": 15500.00, "storage_cost": 1250.00, "payout_total": 98000.00 },
    { "week": "2026-W03", "logistics_cost": 16000.00, "storage_cost": 1300.00, "payout_total": 102000.00 },
    { "week": "2026-W04", "logistics_cost": 16200.00, "storage_cost": 1350.00, "payout_total": 103000.00 },
    { "week": "2026-W05", "logistics_cost": 16500.00, "storage_cost": 1400.00, "payout_total": 105000.00 }
  ],
  "summary": {
    "logistics_cost": { "min": 15000.00, "max": 16500.00, "avg": 15840.00, "trend": "+10.0%" },
    "storage_cost": { "min": 1200.00, "max": 1400.00, "avg": 1300.00, "trend": "+16.7%" },
    "payout_total": { "min": 95000.00, "max": 105000.00, "avg": 100600.00, "trend": "+10.5%" }
  }
}
```

### Доступные метрики

- `payout_total` - Итого к перечислению
- `sale_gross` - Продажи (нетто)
- `to_pay_goods` - К перечислению за товары
- `logistics_cost` - Логистика
- `storage_cost` - Хранение
- `paid_acceptance_cost` - Платная приемка
- `penalties_total` - Штрафы
- `wb_commission_adj` - Комиссия WB

---

## 3. Хранение (Storage)

### 3.1 Хранение по SKU

```http
GET /v1/analytics/storage/by-sku
```

**Параметры:**

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `weekStart` | ✅ | - | Начало периода (YYYY-Www) |
| `weekEnd` | ✅ | - | Конец периода (YYYY-Www) |
| `nm_id` | ❌ | all | Фильтр по артикулу |
| `brand` | ❌ | all | Фильтр по бренду |
| `warehouse` | ❌ | all | Фильтр по складу (URL-encoded) |
| `sort_by` | ❌ | `storage_cost` | Сортировка: `storage_cost`, `volume` |
| `sort_order` | ❌ | `desc` | Направление |
| `limit` | ❌ | 100 | Лимит записей |

### Пример запроса

```http
GET /v1/analytics/storage/by-sku?weekStart=2026-W01&weekEnd=2026-W05
```

### Структура ответа

```json
{
  "period": {
    "from": "2026-W01",
    "to": "2026-W05",
    "days_count": 35
  },
  "data": [
    {
      "nm_id": "12345678",
      "vendor_code": "SHIRT-001",
      "product_name": "Футболка хлопок",
      "brand": "MyBrand",
      "storage_cost_total": 4500.00,
      "storage_cost_avg_daily": 128.57,
      "volume_avg": 0.5,
      "warehouses": ["Коледино", "Казань"],
      "days_stored": 35
    }
  ],
  "summary": {
    "total_storage_cost": 125000.00,
    "products_count": 150,
    "avg_cost_per_product": 833.33
  },
  "pagination": {
    "total": 150,
    "cursor": null,
    "has_more": false
  }
}
```

### 3.2 Топ потребителей хранения

```http
GET /v1/analytics/storage/top-consumers
```

**Параметры:**

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `weekStart` | ✅ | - | Начало периода |
| `weekEnd` | ✅ | - | Конец периода |
| `limit` | ❌ | 10 | Кол-во записей (max 100) |
| `include_revenue` | ❌ | `false` | Включать выручку |

### Пример запроса

```http
GET /v1/analytics/storage/top-consumers?weekStart=2026-W01&weekEnd=2026-W05&limit=10&include_revenue=true
```

### Структура ответа

```json
{
  "period": { "from": "2026-W01", "to": "2026-W05" },
  "top_consumers": [
    {
      "rank": 1,
      "nm_id": "87654321",
      "vendor_code": "COAT-XL-001",
      "product_name": "Пальто зимнее XL",
      "storage_cost": 3500.00,
      "percent_of_total": 12.5,
      "volume": 2.5,
      "revenue_net": 15000.00,
      "storage_to_revenue_ratio": 23.3
    }
  ]
}
```

### 3.3 Тренды хранения

```http
GET /v1/analytics/storage/trends
```

**Параметры:**

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `weekStart` | ✅ | - | Начало периода |
| `weekEnd` | ✅ | - | Конец периода |
| `nm_id` | ❌ | null | Фильтр по артикулу (null = весь кабинет) |
| `metrics` | ❌ | all | `storage_cost`, `volume` |

### Пример запроса

```http
GET /v1/analytics/storage/trends?weekStart=2026-W01&weekEnd=2026-W05
```

### Структура ответа

```json
{
  "period": { "from": "2026-W01", "to": "2026-W05" },
  "nm_id": null,
  "data": [
    { "week": "2026-W01", "storage_cost": 5000.00, "volume": 10.5 },
    { "week": "2026-W02", "storage_cost": 5200.00, "volume": 10.8 },
    { "week": "2026-W03", "storage_cost": 5300.00, "volume": 11.0 },
    { "week": "2026-W04", "storage_cost": 5400.00, "volume": 11.2 },
    { "week": "2026-W05", "storage_cost": 5500.00, "volume": 11.5 }
  ],
  "summary": {
    "min": 5000.00,
    "max": 5500.00,
    "avg": 5280.00,
    "trend": "+10.0%"
  }
}
```

---

## 4. Агрегированные расходы

### 4.1 Cabinet Summary (все расходы в одном запросе)

```http
GET /v1/analytics/cabinet-summary
```

**Параметры:**

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `weeks` | ❌ | 4 | Количество недель (max 52) |
| `weekStart` | ❌ | - | ИЛИ явный диапазон |
| `weekEnd` | ❌ | - | ИЛИ явный диапазон |

### Пример запроса

```http
# Последние 4 недели
GET /v1/analytics/cabinet-summary

# Последние 12 недель
GET /v1/analytics/cabinet-summary?weeks=12

# Явный диапазон
GET /v1/analytics/cabinet-summary?weekStart=2026-W01&weekEnd=2026-W05
```

### Структура ответа (ключевые поля для расходов)

```json
{
  "summary": {
    "period": { "start": "2026-W01", "end": "2026-W05", "weeks_count": 5 },
    "totals": {
      "revenue_net": 1500000.00,
      "cogs_total": 600000.00,
      "gross_profit": 900000.00,
      "logistics_cost": 82000.00,
      "storage_cost": 6500.00,
      "penalties": 1200.00,
      "paid_acceptance_cost": 500.00,
      "total_expenses": 90200.00,
      "operating_profit": 809800.00,
      "operating_margin_pct": 53.99,
      "wb_services_cost": 51063.00,
      "wb_promotion_cost": 32073.00,
      "wb_jam_cost": 18990.00
    },
    "trends": {
      "revenue_trend": "up",
      "profit_trend": "up",
      "week_over_week_growth": 5.2
    }
  },
  "top_products": [...],
  "top_brands": [...],
  "meta": {
    "cabinet_id": "uuid",
    "generated_at": "2026-01-31T12:00:00Z"
  }
}
```

### 4.2 Unit Economics (структура расходов в %)

```http
GET /v1/analytics/unit-economics
```

**Параметры:**

| Параметр | Обязательный | По умолчанию | Описание |
|----------|--------------|--------------|----------|
| `week` | ✅ | - | ISO неделя (YYYY-Www) |
| `view_by` | ❌ | `sku` | `sku`, `brand`, `category`, `total` |
| `sort_by` | ❌ | `revenue` | Сортировка |
| `limit` | ❌ | 100 | Лимит (max 500) |

### Структура ответа

```json
{
  "data": [
    {
      "nm_id": "147205694",
      "revenue": 33899.00,
      "costs_pct": {
        "cogs": 152.83,
        "commission": 11.65,
        "logistics_delivery": 15.30,
        "logistics_return": 6.56,
        "storage": 0.5,
        "paid_acceptance": 0,
        "penalties": 0,
        "other_deductions": 2.01,
        "advertising": 0
      },
      "costs_rub": {
        "cogs": 51786.28,
        "commission": 3946.27,
        "logistics_delivery": 5185.77,
        "logistics_return": 2222.48,
        "storage": 169.50,
        "paid_acceptance": 0,
        "penalties": 0,
        "other_deductions": 679.93,
        "advertising": 0
      },
      "total_costs_pct": 188.34,
      "net_margin_pct": -88.34,
      "profitability_status": "loss"
    }
  ]
}
```

---

## 5. Примеры запросов для дашборда

### Сценарий: Дашборд расходов за последнюю неделю

```javascript
// 1. Рекламные затраты
const advertisingUrl = '/v1/analytics/advertising?from=2026-01-24&to=2026-01-31';

// 2. Логистика и хранение (сводка)
const financeSummaryUrl = '/v1/analytics/weekly/finance-summary?week=2026-W05';

// 3. Детализация хранения
const storageUrl = '/v1/analytics/storage/by-sku?weekStart=2026-W05&weekEnd=2026-W05';

// 4. Топ потребителей хранения
const topStorageUrl = '/v1/analytics/storage/top-consumers?weekStart=2026-W05&weekEnd=2026-W05&limit=5&include_revenue=true';
```

### Сценарий: Дашборд расходов за последний месяц

```javascript
// 1. Рекламные затраты за месяц
const advertisingUrl = '/v1/analytics/advertising?from=2026-01-01&to=2026-01-31&view_by=campaign';

// 2. Тренды логистики и хранения по неделям
const trendsUrl = '/v1/analytics/weekly/trends?from=2026-W01&to=2026-W05&metrics=logistics_cost,storage_cost';

// 3. Cabinet Summary за месяц
const summaryUrl = '/v1/analytics/cabinet-summary?weekStart=2026-W01&weekEnd=2026-W05';

// 4. Тренды хранения
const storageTrendsUrl = '/v1/analytics/storage/trends?weekStart=2026-W01&weekEnd=2026-W05';
```

### Сценарий: Сравнение периодов

```javascript
// Сравнение этой недели с прошлой
const comparisonUrl = '/v1/analytics/weekly/comparison?period1=2026-W05&period2=2026-W04';
```

---

## 6. Рекомендации по реализации

### 6.1 Кеширование

| Эндпоинт | TTL кеша | Примечание |
|----------|----------|------------|
| `/v1/analytics/advertising` | 30 мин | Redis cache на бэкенде |
| `/v1/analytics/weekly/*` | 5 мин | Рекомендуется кешировать на фронте |
| `/v1/analytics/storage/*` | 5 мин | Performance: <500ms |
| `/v1/analytics/cabinet-summary` | 5 мин | Агрегированные данные |

### 6.2 Формат дат

- **Рекламная аналитика**: `YYYY-MM-DD` (например, `2026-01-31`)
- **Недельная аналитика**: `YYYY-Www` (например, `2026-W05`)
- **Хранение**: `YYYY-Www` (например, `2026-W05`)

### 6.3 Обработка ошибок

```json
// 400 Bad Request
{
  "statusCode": 400,
  "message": "Invalid week format. Expected YYYY-Www",
  "error": "Bad Request"
}

// 401 Unauthorized
{
  "statusCode": 401,
  "message": "Unauthorized"
}

// 404 Not Found
{
  "statusCode": 404,
  "message": "No data found for specified period"
}
```

### 6.4 Агрегация для графиков

**Для графика "Расходы по дням" (последняя неделя):**

Используйте `/v1/analytics/advertising` с диапазоном дат - данные уже агрегированы по SKU/кампаниям. Для понедельной разбивки используйте `/v1/analytics/weekly/trends`.

**Для круговой диаграммы "Структура расходов":**

Используйте `/v1/analytics/unit-economics?week=2026-W05&view_by=total` - вернет % каждой категории расходов от выручки.

### 6.5 Переключение периодов

```javascript
// Helper для формирования URL
function getExpensesUrls(period) {
  const today = new Date();

  if (period === 'week') {
    const weekAgo = new Date(today - 7 * 24 * 60 * 60 * 1000);
    return {
      advertising: `/v1/analytics/advertising?from=${formatDate(weekAgo)}&to=${formatDate(today)}`,
      finance: `/v1/analytics/weekly/finance-summary?week=${getISOWeek(today)}`,
      storage: `/v1/analytics/storage/by-sku?weekStart=${getISOWeek(weekAgo)}&weekEnd=${getISOWeek(today)}`
    };
  }

  if (period === 'month') {
    const monthAgo = new Date(today - 30 * 24 * 60 * 60 * 1000);
    return {
      advertising: `/v1/analytics/advertising?from=${formatDate(monthAgo)}&to=${formatDate(today)}`,
      trends: `/v1/analytics/weekly/trends?from=${getISOWeek(monthAgo)}&to=${getISOWeek(today)}&metrics=logistics_cost,storage_cost`,
      storageTrends: `/v1/analytics/storage/trends?weekStart=${getISOWeek(monthAgo)}&weekEnd=${getISOWeek(today)}`
    };
  }
}
```

---

## Связанная документация

- [API-PATHS-REFERENCE.md](./API-PATHS-REFERENCE.md) - Полный справочник API
- [ADVERTISING-ANALYTICS-GUIDE.md](./ADVERTISING-ANALYTICS-GUIDE.md) - Детальная документация рекламной аналитики
- [BUSINESS-LOGIC-REFERENCE.md](./BUSINESS-LOGIC-REFERENCE.md) - Бизнес-логика и формулы

---

**Контакты**: При вопросах обращайтесь к backend-команде или PM.
