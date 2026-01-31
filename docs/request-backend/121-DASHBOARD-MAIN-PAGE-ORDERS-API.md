# DASHBOARD-ORDERS-API.md

Документация API для фронтенд-команды: Дашборд "Заказы" и "COGS по заказам"

---

## Оглавление

1. [Обзор](#1-обзор)
2. [Аутентификация](#2-аутентификация)
3. [API Заказов (Orders FBS)](#3-api-заказов-orders-fbs)
4. [API Аналитики заказов](#4-api-аналитики-заказов)
5. [API COGS (Себестоимость)](#5-api-cogs-себестоимость)
6. [Фильтрация по периодам](#6-фильтрация-по-периодам)
7. [Примеры запросов](#7-примеры-запросов)

---

## 1. Обзор

### Бизнес-контекст

Дашборд должен отображать:
- **Заказы (Orders)** — данные о заказах FBS с разбивкой по дням
- **COGS по заказам** — себестоимость товаров в заказах
- **Периоды**: последняя неделя (по дням), последний месяц (по дням)

### Базовый URL

```
http://localhost:3000 (development)
https://api.your-domain.com (production)
```

---

## 2. Аутентификация

### Обязательные заголовки

```http
Authorization: Bearer <access_token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json
```

| Заголовок | Описание |
|-----------|----------|
| `Authorization` | JWT токен, полученный при логине |
| `X-Cabinet-Id` | UUID кабинета продавца (multi-tenancy) |

---

## 3. API Заказов (Orders FBS)

### 3.1 Список заказов

```http
GET /v1/orders
```

**Query параметры:**

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `from` | string | Нет | - | Начальная дата (ISO 8601: `2026-01-01`) |
| `to` | string | Нет | - | Конечная дата (ISO 8601: `2026-01-07`) |
| `supplier_status` | enum | Нет | - | `new`, `confirm`, `complete`, `cancel` |
| `wb_status` | enum | Нет | - | `waiting`, `sorted`, `sold`, `canceled` |
| `nm_id` | number | Нет | - | Фильтр по артикулу WB |
| `sort_by` | enum | Нет | `created_at` | `created_at`, `status_updated_at`, `price`, `sale_price` |
| `sort_order` | enum | Нет | `desc` | `asc`, `desc` |
| `limit` | number | Нет | 100 | Макс. 1000 |
| `offset` | number | Нет | 0 | Смещение для пагинации |

**Пример запроса (последняя неделя):**

```http
GET /v1/orders?from=2026-01-24&to=2026-01-31&limit=100
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**

```json
{
  "items": [
    {
      "orderId": "1234567890",
      "orderUid": "order-uid-abc123",
      "nmId": 12345678,
      "vendorCode": "SKU-ABC-001",
      "productName": "Название товара",
      "price": 1500.00,
      "salePrice": 1200.00,
      "supplierStatus": "new",
      "wbStatus": "waiting",
      "warehouseId": 507,
      "deliveryType": "fbs",
      "isB2B": false,
      "cargoType": "MGT",
      "createdAt": "2026-01-04T10:30:00.000Z",
      "statusUpdatedAt": "2026-01-04T11:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0
  },
  "query": {
    "from": "2026-01-24",
    "to": "2026-01-31"
  }
}
```

**Поля ответа:**

| Поле | Тип | Описание |
|------|-----|----------|
| `orderId` | string | ID заказа WB |
| `orderUid` | string | UID для группировки заказов |
| `nmId` | number | Артикул WB (SKU) |
| `vendorCode` | string | Артикул поставщика |
| `productName` | string/null | Название товара |
| `price` | number | Оригинальная цена (RUB) |
| `salePrice` | number | Цена продажи после скидки (RUB) |
| `supplierStatus` | enum | Статус поставщика: `new`, `confirm`, `complete`, `cancel` |
| `wbStatus` | enum | Статус WB: `waiting`, `sorted`, `sold`, `canceled` |
| `warehouseId` | number | ID склада WB |
| `deliveryType` | string | Тип доставки (fbs) |
| `isB2B` | boolean | B2B заказ |
| `createdAt` | string | Дата создания (ISO 8601) |
| `statusUpdatedAt` | string | Дата обновления статуса (ISO 8601) |

---

### 3.2 Детали заказа

```http
GET /v1/orders/:orderId
```

**Ответ:**

```json
{
  "orderId": "1234567890",
  "orderUid": "order-uid-abc123",
  "nmId": 12345678,
  "vendorCode": "SKU-ABC-001",
  "productName": "Название товара",
  "price": 1500.00,
  "salePrice": 1200.00,
  "supplierStatus": "confirm",
  "wbStatus": "sorted",
  "warehouseId": 507,
  "deliveryType": "fbs",
  "isB2B": false,
  "cargoType": "MGT",
  "chrtId": 987654321,
  "address": {
    "fullAddress": "г. Москва, ул. Примерная, д. 1",
    "longitude": 37.6176,
    "latitude": 55.7558
  },
  "createdAt": "2026-01-04T10:30:00.000Z",
  "statusUpdatedAt": "2026-01-04T12:00:00.000Z",
  "statusHistory": [
    {
      "supplierStatus": "new",
      "wbStatus": "waiting",
      "changedAt": "2026-01-04T10:30:00.000Z"
    },
    {
      "supplierStatus": "confirm",
      "wbStatus": "sorted",
      "changedAt": "2026-01-04T12:00:00.000Z"
    }
  ],
  "processingTimeSeconds": 5400,
  "syncedAt": "2026-01-04T12:05:00.000Z"
}
```

---

## 4. API Аналитики заказов

### 4.1 Объём заказов (Volume) — для графика по дням

```http
GET /v1/analytics/orders/volume
```

**Query параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `from` | string | Да | Начальная дата (YYYY-MM-DD) |
| `to` | string | Да | Конечная дата (YYYY-MM-DD) |

**Пример (последняя неделя):**

```http
GET /v1/analytics/orders/volume?from=2026-01-24&to=2026-01-31
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**

```json
{
  "hourlyTrend": [
    { "hour": 14, "count": 25 },
    { "hour": 15, "count": 22 }
  ],
  "dailyTrend": [
    { "date": "2026-01-24", "count": 150 },
    { "date": "2026-01-25", "count": 142 },
    { "date": "2026-01-26", "count": 180 }
  ],
  "peakHours": [14, 15, 13],
  "cancellationRate": 3.5,
  "b2bPercentage": 12.0,
  "totalOrders": 500,
  "statusBreakdown": [
    { "status": "complete", "count": 400, "percentage": 80.0 },
    { "status": "cancel", "count": 18, "percentage": 3.6 },
    { "status": "confirm", "count": 50, "percentage": 10.0 },
    { "status": "new", "count": 32, "percentage": 6.4 }
  ],
  "period": {
    "from": "2026-01-24",
    "to": "2026-01-31"
  }
}
```

**Кэширование:** 5 минут

---

### 4.2 Исторические тренды (до 365 дней)

```http
GET /v1/analytics/orders/trends
```

**Query параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `from` | string | Да | Начальная дата (YYYY-MM-DD) |
| `to` | string | Да | Конечная дата (YYYY-MM-DD) |
| `aggregation` | enum | Нет | `day`, `week`, `month` (по умолчанию: `day`) |

**Пример (последний месяц по дням):**

```http
GET /v1/analytics/orders/trends?from=2026-01-01&to=2026-01-31&aggregation=day
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**

```json
{
  "aggregation": "day",
  "trends": [
    {
      "date": "2026-01-01",
      "ordersCount": 150,
      "revenue": 45000.00,
      "cancellations": 5,
      "cancellationRate": 3.33,
      "avgOrderValue": 300.00,
      "returnsCount": 2
    },
    {
      "date": "2026-01-02",
      "ordersCount": 165,
      "revenue": 49500.00,
      "cancellations": 4,
      "cancellationRate": 2.42,
      "avgOrderValue": 300.00,
      "returnsCount": 3
    }
  ],
  "summary": {
    "totalOrders": 7500,
    "totalRevenue": 2250000.00,
    "avgDailyOrders": 241.9,
    "cancellationRate": 3.2,
    "returnRate": 1.5
  },
  "period": {
    "from": "2026-01-01",
    "to": "2026-01-31"
  }
}
```

---

### 4.3 Сравнение периодов

```http
GET /v1/analytics/orders/compare
```

**Query параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `period1_from` | string | Да | Начало первого периода |
| `period1_to` | string | Да | Конец первого периода |
| `period2_from` | string | Да | Начало второго периода |
| `period2_to` | string | Да | Конец второго периода |

**Пример (эта неделя vs прошлая):**

```http
GET /v1/analytics/orders/compare?period1_from=2026-01-24&period1_to=2026-01-31&period2_from=2026-01-17&period2_to=2026-01-23
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**

```json
{
  "period1": {
    "from": "2026-01-24",
    "to": "2026-01-31",
    "ordersCount": 2800,
    "revenue": 868000.00,
    "cancellationRate": 3.1,
    "avgOrderValue": 310.00
  },
  "period2": {
    "from": "2026-01-17",
    "to": "2026-01-23",
    "ordersCount": 2500,
    "revenue": 750000.00,
    "cancellationRate": 3.5,
    "avgOrderValue": 300.00
  },
  "comparison": {
    "ordersChange": 300,
    "ordersChangePercent": 12.0,
    "revenueChange": 118000.00,
    "revenueChangePercent": 15.7,
    "cancellationRateChange": -0.4,
    "avgOrderValueChange": 10.00
  }
}
```

---

### 4.4 Сезонные паттерны

```http
GET /v1/analytics/orders/seasonal
```

**Query параметры:**

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `months` | number | 12 | Количество месяцев для анализа |
| `view` | enum | `monthly` | `monthly`, `weekday` |

**Ответ:**

```json
{
  "patterns": {
    "monthly": [
      { "month": "January", "avgOrders": 2500, "avgRevenue": 750000.00 },
      { "month": "December", "avgOrders": 4500, "avgRevenue": 1350000.00 }
    ],
    "weekday": [
      { "dayOfWeek": "Monday", "avgOrders": 150, "peakHour": 14 },
      { "dayOfWeek": "Saturday", "avgOrders": 280, "peakHour": 11 }
    ]
  },
  "insights": {
    "peakMonth": "December",
    "lowMonth": "February",
    "peakDay": "Saturday"
  }
}
```

---

## 5. API COGS (Себестоимость)

### 5.1 Получить COGS для SKU

```http
GET /v1/cogs
```

**Query параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `nm_id` | string | Да | Артикул WB |
| `valid_at` | string | Нет | Дата (YYYY-MM-DD), по умолчанию сегодня |

**Пример:**

```http
GET /v1/cogs?nm_id=147205694&valid_at=2026-01-25
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

---

### 5.2 История COGS для товара

```http
GET /v1/cogs/history
```

**Query параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `nm_id` | string | Да | Артикул WB |
| `limit` | number | Нет | Лимит записей (по умолчанию 50) |
| `include_deleted` | boolean | Нет | Включить удалённые записи |

**Ответ:**

```json
{
  "data": [
    {
      "id": "uuid-1234",
      "nm_id": "147205694",
      "sa_name": "Название товара",
      "unit_cost": 1500.00,
      "currency": "RUB",
      "valid_from": "2026-01-01",
      "valid_to": null,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "affected_weeks": ["2026-W01", "2026-W02", "2026-W03", "2026-W04"]
    }
  ],
  "meta": {
    "nm_id": "147205694",
    "product_name": "Название товара",
    "current_cogs": 1500.00,
    "total_versions": 3
  },
  "pagination": {
    "has_more": false,
    "next_cursor": null,
    "count": 3
  }
}
```

---

### 5.3 Аналитика по SKU с COGS

Для получения заказов с себестоимостью используйте еженедельную аналитику:

```http
GET /v1/analytics/weekly/by-sku?week=2026-W04&includeCogs=true
```

**Ответ (с includeCogs=true):**

```json
{
  "data": [
    {
      "nm_id": "147205694",
      "sa_name": "ll-20-bl",
      "brand": "Dianora",
      "category": "Кошельки",
      "total_units": 51,
      "revenue_gross": 14074.60,
      "revenue_net": 14074.60,
      "logistics_cost": 5999.63,
      "storage_cost": 156.78,
      "storage_data_source": "paid_storage_api",
      "penalties": 0.00,
      "cogs": 4488.00,
      "missing_cogs_flag": false,
      "profit": 9586.60,
      "margin_pct": 68.11,
      "markup_percent": 213.63,
      "roi": 213.63,
      "profit_per_unit": 188.95,
      "net_profit": 2037.12,
      "net_margin_pct": 14.47,
      "operating_profit": 2037.12,
      "operating_margin_pct": 14.47,
      "total_expenses": 6156.41,
      "has_revenue": true
    }
  ],
  "pagination": { "total": 50, "limit": 100, "offset": 0 }
}
```

**Ключевые поля COGS:**

| Поле | Тип | Описание |
|------|-----|----------|
| `cogs` | number | Себестоимость (RUB) |
| `missing_cogs_flag` | boolean | `true` если COGS не назначен |
| `profit` | number | Валовая прибыль = revenue - cogs |
| `margin_pct` | number | Валовая маржа (%) |
| `net_profit` | number | Чистая прибыль = revenue - cogs - logistics - storage - penalties |
| `net_margin_pct` | number | Чистая маржа (%) |

---

## 6. Фильтрация по периодам

### Последняя неделя (по дням)

```javascript
// Вычисление дат
const today = new Date();
const weekAgo = new Date(today);
weekAgo.setDate(today.getDate() - 7);

const from = weekAgo.toISOString().split('T')[0]; // "2026-01-24"
const to = today.toISOString().split('T')[0];     // "2026-01-31"

// Запрос заказов
GET /v1/orders?from=${from}&to=${to}

// Запрос аналитики по дням
GET /v1/analytics/orders/volume?from=${from}&to=${to}
GET /v1/analytics/orders/trends?from=${from}&to=${to}&aggregation=day
```

### Последний месяц (по дням)

```javascript
const today = new Date();
const monthAgo = new Date(today);
monthAgo.setMonth(today.getMonth() - 1);

const from = monthAgo.toISOString().split('T')[0]; // "2025-12-31"
const to = today.toISOString().split('T')[0];      // "2026-01-31"

// Запрос
GET /v1/analytics/orders/trends?from=${from}&to=${to}&aggregation=day
```

### Переключение периодов

| Период | from | to | aggregation |
|--------|------|-------|-------------|
| Неделя | today - 7 days | today | `day` |
| Месяц | today - 30 days | today | `day` |
| Квартал | today - 90 days | today | `week` |
| Год | today - 365 days | today | `month` |

---

## 7. Примеры запросов

### Полный пример: Дашборд заказов за неделю

```javascript
// 1. Получить список заказов
const ordersResponse = await fetch('/v1/orders?from=2026-01-24&to=2026-01-31&limit=100', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId
  }
});
const orders = await ordersResponse.json();

// 2. Получить аналитику объёма (для графика)
const volumeResponse = await fetch('/v1/analytics/orders/volume?from=2026-01-24&to=2026-01-31', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId
  }
});
const volume = await volumeResponse.json();

// 3. Получить тренды по дням
const trendsResponse = await fetch('/v1/analytics/orders/trends?from=2026-01-24&to=2026-01-31&aggregation=day', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId
  }
});
const trends = await trendsResponse.json();

// Данные для графика по дням
const chartData = volume.dailyTrend.map(d => ({
  date: d.date,
  orders: d.count
}));

// Итоговые метрики
const summary = {
  totalOrders: volume.totalOrders,
  cancellationRate: volume.cancellationRate,
  b2bPercentage: volume.b2bPercentage,
  statusBreakdown: volume.statusBreakdown
};
```

### Полный пример: COGS по заказам

```javascript
// Получить SKU аналитику с COGS за текущую неделю
const week = '2026-W04'; // ISO неделя
const skuResponse = await fetch(`/v1/analytics/weekly/by-sku?week=${week}&includeCogs=true&limit=100`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Cabinet-Id': cabinetId
  }
});
const skuData = await skuResponse.json();

// Агрегация COGS
const cogsMetrics = {
  totalCogs: skuData.data.reduce((sum, sku) => sum + (sku.cogs || 0), 0),
  totalProfit: skuData.data.reduce((sum, sku) => sum + (sku.profit || 0), 0),
  avgMargin: skuData.data.reduce((sum, sku) => sum + (sku.margin_pct || 0), 0) / skuData.data.length,
  skusWithoutCogs: skuData.data.filter(sku => sku.missing_cogs_flag).length
};
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 400 | Неверные параметры запроса |
| 401 | Не авторизован (невалидный/отсутствующий токен) |
| 403 | Доступ запрещён (неверный cabinet_id) |
| 404 | Ресурс не найден |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

---

## Лимиты и кэширование

| Эндпоинт | Лимит результатов | TTL кэша |
|----------|-------------------|----------|
| `/v1/orders` | 1000 | 5 мин |
| `/v1/analytics/orders/velocity` | - | 5 мин |
| `/v1/analytics/orders/sla` | - | 1 мин |
| `/v1/analytics/orders/volume` | - | 5 мин |
| `/v1/analytics/orders/trends` | 365 дней | 1 час |
| `/v1/analytics/weekly/by-sku` | 500 | 30 мин |

---

## Связанные файлы тестирования

- `test-api/14-orders.http` — Полные тесты Orders API
- `test-api/07-cogs.http` — Тесты COGS API
- `test-api/05-analytics-basic.http` — Базовая аналитика
- `test-api/06-analytics-advanced.http` — Расширенная аналитика

---

*Документ создан: 2026-01-31*
*Версия API: v1*
