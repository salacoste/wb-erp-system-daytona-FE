# Request #36: Epic 24 - Paid Storage Analytics API

**Date**: 2025-11-29
**Priority**: 📊 **NEW FEATURE DOCUMENTATION**
**Status**: ✅ **COMPLETE** - All 5 stories implemented
**Component**: Backend API - Analytics Module + Imports Module + Tasks Module + Products Module
**Epic**: [Epic 24: Paid Storage by Article](../../../docs/epics/epic-24-paid-storage-by-article.md)

---

## Executive Summary

Epic 24 добавляет **аналитику расходов на хранение по артикулам** — новую функциональность для анализа затрат на платное хранение товаров на складах Wildberries. Раньше система показывала только **агрегированные** расходы на хранение за неделю. Теперь продавцы могут видеть **по каждому товару** сколько стоит его хранение.

**Ключевые возможности**:
- 📊 Затраты на хранение **по каждому SKU**
- 📈 Топ-N товаров по стоимости хранения
- 📉 Тренды расходов на хранение по неделям
- ⏰ Автоматический импорт данных (еженедельно по вторникам)
- 📦 **Затраты на хранение в списке товаров** (Story 24.5) — `include_storage=true`

---

## API Endpoints

### 1. GET /v1/analytics/storage/by-sku

**Назначение**: Получить стоимость хранения, агрегированную по SKU за период.

**Авторизация**:
```http
Authorization: Bearer <jwt_token>
X-Cabinet-Id: <cabinet_uuid>
```

**Роли**: Manager, Owner, Analyst, Admin

**Query Parameters**:

| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `weekStart` | string | ✅ | Начало периода (ISO week: `YYYY-Www`) |
| `weekEnd` | string | ✅ | Конец периода (ISO week: `YYYY-Www`) |
| `nm_id` | string | ❌ | Фильтр по артикулу WB |
| `brand` | string | ❌ | Фильтр по бренду |
| `warehouse` | string | ❌ | Фильтр по складу |
| `sort_by` | string | ❌ | Сортировка: `storage_cost` (default), `volume`, `nm_id`, `days_stored` |
| `sort_order` | string | ❌ | Порядок: `asc`, `desc` (default) |
| `limit` | number | ❌ | Записей на страницу (default: 50, max: 200) |
| `cursor` | string | ❌ | Курсор пагинации |

**Пример запроса**:
```http
GET /v1/analytics/storage/by-sku?weekStart=2025-W44&weekEnd=2025-W47&sort_by=storage_cost&limit=20
Authorization: Bearer <token>
X-Cabinet-Id: abc123-def456
```

**Пример ответа**:
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
    },
    {
      "nm_id": "87654321",
      "vendor_code": "COAT-XL-001",
      "product_name": "Пальто зимнее XL",
      "brand": "MyBrand",
      "storage_cost_total": 3200.00,
      "storage_cost_avg_daily": 114.29,
      "volume_avg": 2.5,
      "warehouses": ["Подольск"],
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

**Поля ответа**:

| Поле | Тип | Описание |
|------|-----|----------|
| `period.from` | string | Начальная неделя |
| `period.to` | string | Конечная неделя |
| `period.days_count` | number | Количество дней в периоде |
| `data[].nm_id` | string | Артикул WB |
| `data[].vendor_code` | string \| null | Артикул продавца |
| `data[].product_name` | string \| null | Название товара |
| `data[].brand` | string \| null | Бренд |
| `data[].storage_cost_total` | number | Общая стоимость хранения за период (₽) |
| `data[].storage_cost_avg_daily` | number | Средняя стоимость хранения в день (₽) |
| `data[].volume_avg` | number \| null | Средний объём товара (литры) |
| `data[].warehouses` | string[] | Список складов |
| `data[].days_stored` | number | Количество дней хранения |
| `summary.total_storage_cost` | number | Общие расходы на хранение (₽) |
| `summary.products_count` | number | Количество SKU |
| `summary.avg_cost_per_product` | number | Средние расходы на один SKU (₽) |
| `pagination.total` | number | Общее количество записей |
| `pagination.cursor` | string \| null | Курсор для следующей страницы |
| `pagination.has_more` | boolean | Есть ли ещё страницы |

---

### 2. GET /v1/analytics/storage/top-consumers

**Назначение**: Получить топ-N товаров с наибольшими расходами на хранение.

**Query Parameters**:

| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `weekStart` | string | ✅ | Начало периода |
| `weekEnd` | string | ✅ | Конец периода |
| `limit` | number | ❌ | Количество (default: 10, max: 100) |
| `include_revenue` | boolean | ❌ | Включить данные о выручке для расчёта ratio |

**Пример запроса**:
```http
GET /v1/analytics/storage/top-consumers?weekStart=2025-W47&weekEnd=2025-W47&limit=5&include_revenue=true
Authorization: Bearer <token>
X-Cabinet-Id: abc123-def456
```

**Пример ответа**:
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
    },
    {
      "rank": 2,
      "nm_id": "11223344",
      "vendor_code": "SOFA-001",
      "product_name": "Диван угловой",
      "brand": "HomeComfort",
      "storage_cost": 2800.00,
      "percent_of_total": 10.0,
      "volume": 4.2,
      "revenue_net": 45000.00,
      "storage_to_revenue_ratio": 6.22
    }
  ],
  "total_storage_cost": 28000.00
}
```

**Поля ответа**:

| Поле | Тип | Описание |
|------|-----|----------|
| `top_consumers[].rank` | number | Позиция в рейтинге (1 = самый дорогой) |
| `top_consumers[].storage_cost` | number | Стоимость хранения за период (₽) |
| `top_consumers[].percent_of_total` | number | % от общих расходов на хранение |
| `top_consumers[].volume` | number \| null | Средний объём (л) |
| `top_consumers[].revenue_net` | number | Выручка за период (если `include_revenue=true`) |
| `top_consumers[].storage_to_revenue_ratio` | number \| null | Отношение хранение/выручка в % |
| `total_storage_cost` | number | Общие расходы на хранение (₽) |

**Use Cases**:
1. **Выявление "дорогих" SKU** — товары с высокими расходами на хранение
2. **Оптимизация складских запасов** — анализ `storage_to_revenue_ratio`
3. **Принятие решений по ассортименту** — какие товары "съедают" бюджет

---

### 3. GET /v1/analytics/storage/trends

**Назначение**: Получить тренды расходов на хранение по неделям.

**Query Parameters**:

| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `weekStart` | string | ✅ | Начало периода |
| `weekEnd` | string | ✅ | Конец периода |
| `nm_id` | string | ❌ | Конкретный SKU (без = все товары кабинета) |
| `metrics` | string | ❌ | Метрики: `storage_cost,volume` (default: все) |
| `include_summary` | boolean | ❌ | Включить статистику (default: true) |

**Пример запроса**:
```http
GET /v1/analytics/storage/trends?weekStart=2025-W40&weekEnd=2025-W47&nm_id=12345678
Authorization: Bearer <token>
X-Cabinet-Id: abc123-def456
```

**Пример ответа**:
```json
{
  "period": {
    "from": "2025-W40",
    "to": "2025-W47",
    "days_count": 56
  },
  "nm_id": "12345678",
  "data": [
    { "week": "2025-W40", "storage_cost": 500.00, "volume": 0.5 },
    { "week": "2025-W41", "storage_cost": 550.00, "volume": 0.5 },
    { "week": "2025-W42", "storage_cost": 480.00, "volume": 0.5 },
    { "week": "2025-W43", "storage_cost": 520.00, "volume": 0.5 },
    { "week": "2025-W44", "storage_cost": 600.00, "volume": 0.5 },
    { "week": "2025-W45", "storage_cost": 580.00, "volume": 0.5 },
    { "week": "2025-W46", "storage_cost": 620.00, "volume": 0.5 },
    { "week": "2025-W47", "storage_cost": 650.00, "volume": 0.5 }
  ],
  "summary": {
    "storage_cost": {
      "min": 480.00,
      "max": 650.00,
      "avg": 562.50,
      "trend": 30.0
    },
    "volume": {
      "min": 0.5,
      "max": 0.5,
      "avg": 0.5,
      "trend": 0.0
    }
  }
}
```

**Поля ответа**:

| Поле | Тип | Описание |
|------|-----|----------|
| `nm_id` | string \| null | SKU (null если запрос по всем товарам) |
| `data[].week` | string | ISO week |
| `data[].storage_cost` | number \| null | Стоимость хранения за неделю |
| `data[].volume` | number \| null | Средний объём |
| `summary.storage_cost.min` | number | Минимум за период |
| `summary.storage_cost.max` | number | Максимум за период |
| `summary.storage_cost.avg` | number | Среднее за период |
| `summary.storage_cost.trend` | number | Изменение в % (последняя неделя vs первая) |

---

## Storage Cost in Products API (Story 24.5)

### GET /v1/products?include_storage=true

**Назначение**: Получить список товаров с данными о затратах на хранение в одном запросе.

**Авторизация**:
```http
Authorization: Bearer <jwt_token>
X-Cabinet-Id: <cabinet_uuid>
```

**Роли**: Manager, Owner, Analyst, Admin

**Query Parameters**:

| Параметр | Тип | Обязат. | Описание |
|----------|-----|---------|----------|
| `include_storage` | boolean | ❌ | Включить данные о хранении (default: false) |
| `include_cogs` | boolean | ❌ | Включить данные о марже (можно комбинировать) |
| `limit` | number | ❌ | Записей на страницу (default: 25, max: 100) |
| `cursor` | string | ❌ | Курсор пагинации |

**Примеры запросов**:
```http
# Только данные о хранении (+50ms)
GET /v1/products?include_storage=true&limit=25

# Маржа И хранение (~350ms total)
GET /v1/products?include_cogs=true&include_storage=true&limit=25

Authorization: Bearer <token>
X-Cabinet-Id: abc123-def456
```

**Пример ответа**:
```json
{
  "products": [
    {
      "nm_id": "12345678",
      "sa_name": "Куртка зимняя",
      "brand": "WinterStyle",
      "has_cogs": true,
      "cogs": 1500.00,
      "current_margin_pct": 45.5,
      "storage_cost_daily_avg": 12.50,
      "storage_cost_weekly": 87.50,
      "storage_period": "2025-W47"
    },
    {
      "nm_id": "67890123",
      "sa_name": "Брюки классические",
      "brand": "StylePro",
      "has_cogs": false,
      "cogs": null,
      "storage_cost_daily_avg": null,
      "storage_cost_weekly": null,
      "storage_period": null
    }
  ],
  "pagination": {
    "total": 150,
    "cursor": "eyJvZmZzZXQiOjI1fQ==",
    "has_more": true
  }
}
```

**Storage Fields** (когда `include_storage=true`):

| Поле | Тип | Описание |
|------|-----|----------|
| `storage_cost_daily_avg` | number \| null | Среднедневная стоимость хранения (₽/день) |
| `storage_cost_weekly` | number \| null | Общая стоимость за последнюю завершённую неделю (₽) |
| `storage_period` | string \| null | ISO-неделя для данных о хранении (напр. "2025-W47") |

**Null значения**:
- Возвращает `null` если нет данных о хранении для товара за период
- Грациозная деградация — если запрос к `paid_storage_daily` упадёт, поля будут `null`, но остальной ответ вернётся

**Performance**:
- `include_storage=true` только: +50ms (batch query)
- `include_cogs=true` + `include_storage=true`: ~350ms total

**Рекомендация для Frontend**:
Используйте `include_storage=true` для отображения затрат на хранение в таблице товаров. Комбинируйте с `include_cogs=true` для полной картины прибыльности.

**TypeScript Type**:
```typescript
// Расширение ProductListItem
interface ProductWithStorage {
  nm_id: string;
  sa_name: string;
  brand: string | null;
  // ... other fields

  // Storage fields (Story 24.5)
  storage_cost_daily_avg: number | null;
  storage_cost_weekly: number | null;
  storage_period: string | null;
}
```

---

## SDK Workflow (КРИТИЧНО - обновлено 2025-12-15)

> ⚠️ **ВАЖНО**: Paid Storage API работает **асинхронно** через task-based workflow!

### 3-Step Task-Based Workflow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ 1. paidStorage()    │────▶│ 2. getTasksStatu3() │────▶│ 3. getTasksDownload3│
│    создание задачи  │     │    поллинг статуса  │     │    скачивание данных│
│    → возвращает     │     │    каждые 5 сек     │     │    → JSON массив    │
│      taskId         │     │    до status='done' │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Реализация в бэкенде

**Файл**: `src/imports/services/paid-storage-import.service.ts`, метод `fetchPaidStorageData()`

```typescript
// Step 1: Создать задание
const taskResponse = await sdk.reports.paidStorage({ dateFrom, dateTo });
const taskId = taskResponse.data?.taskId;

// Step 2: Поллинг статуса (макс 2 мин, каждые 5 сек)
while (status !== 'done' && !timeout) {
  await wait(5000);
  const statusResponse = await sdk.reports.getTasksStatu3(taskId);
  status = statusResponse.data?.status;
}

// Step 3: Скачать данные
const data = await sdk.reports.getTasksDownload3(taskId);
```

### Возможные статусы задачи

| Статус | Описание | Действие |
|--------|----------|----------|
| `done` | Задача выполнена | Скачать данные |
| `canceled` | Задача отменена | Ошибка |
| `purged` | Данные удалены | Ошибка |
| (другие) | В обработке | Продолжить поллинг |

📖 **Подробный гайд**: [`docs/STORAGE-API-GUIDE.md`](../../../docs/STORAGE-API-GUIDE.md)
📖 **Документация импорта**: [`51-paid-storage-import-methods.md`](./51-paid-storage-import-methods.md)

---

## Manual Import API

### POST /v1/imports/paid-storage

**Назначение**: Запустить ручной импорт данных о платном хранении.

**Авторизация**:
```http
Authorization: Bearer <jwt_token>
X-Cabinet-Id: <cabinet_uuid>
```

**Роли**: Manager, Owner, Admin

**Request Body**:
```json
{
  "dateFrom": "2025-11-18",
  "dateTo": "2025-11-24"
}
```

**Ограничения**:
- Максимальный диапазон: **8 дней** (ограничение WB API)
- Для периодов >8 дней: автоматическое разбиение на chunks с **65s задержкой** между запросами
- Формат дат: `YYYY-MM-DD`
- **Rate limit**: 1 req/min для создания report task (SDK compliance, 2025-12-14)

**Пример ответа (202 Accepted)**:
```json
{
  "import_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "processing",
  "date_range": {
    "from": "2025-11-18",
    "to": "2025-11-24"
  },
  "estimated_time_sec": 60,
  "message": "Import started. Use GET /v1/imports/{import_id} to check status."
}
```

### GET /v1/imports/{import_id}

**Назначение**: Проверить статус импорта.

**Пример ответа**:
```json
{
  "import_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "date_range": {
    "from": "2025-11-18",
    "to": "2025-11-24"
  },
  "rows_imported": 3500,
  "message": "Import completed successfully."
}
```

**Статусы импорта**:
| Статус | Описание |
|--------|----------|
| `pending` | Задача в очереди |
| `processing` | Импорт выполняется |
| `completed` | Успешно завершён |
| `failed` | Ошибка (см. `error` поле) |

---

## Automatic Scheduler

### Автоматический импорт

**Расписание**: Каждый **вторник в 08:00 MSK**

**Почему вторник?**:
- WB обновляет данные о хранении в понедельник
- Вторник 08:00 — безопасный момент когда данные уже готовы

**Импортируемый период**: Предыдущая ISO-неделя (Пн-Вс)

### Schedules API

**GET /v1/schedules** — просмотр расписаний
```http
GET /v1/schedules?task_type=paid_storage_import
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

**Ответ**:
```json
{
  "schedules": [
    {
      "id": "schedule-uuid",
      "cabinet_id": "cabinet-uuid",
      "task_type": "paid_storage_import",
      "cron_expression": "0 8 * * 2",
      "timezone": "Europe/Moscow",
      "is_enabled": true,
      "last_run_at": "2025-11-26T05:00:00Z",
      "next_run_at": "2025-12-03T05:00:00Z"
    }
  ]
}
```

**PUT /v1/schedules/:id** — изменить расписание
```json
{
  "cron_expression": "0 6 * * *",
  "is_enabled": true
}
```

**POST /v1/schedules/:id/trigger** — ручной запуск
```http
POST /v1/schedules/{schedule_id}/trigger
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet_uuid>
```

---

## Frontend Integration Guide

### 1. Страница "Аналитика хранения"

**Рекомендуемые компоненты**:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Аналитика расходов на хранение                       │
├─────────────────────────────────────────────────────────┤
│ [Week Picker: W44 - W47] [Фильтр по бренду ▼]           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   Общие расходы: 125,000 ₽   |  SKU: 150               │
│   Среднее на SKU: 833 ₽      |  Период: 28 дней        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 📈 Тренд расходов на хранение                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │         ___                                         │ │
│ │    ____/   \___                                     │ │
│ │___/            \____                                │ │
│ │ W44  W45  W46  W47                                  │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 🏆 Топ-5 по расходам на хранение                        │
│ ┌─────┬────────────┬─────────┬──────────┬─────────────┐ │
│ │ #   │ Товар      │ Хранение│ % общих  │ Хран/Выр %  │ │
│ ├─────┼────────────┼─────────┼──────────┼─────────────┤ │
│ │ 1   │ Пальто XL  │ 3,500 ₽ │ 12.5%    │ 23.3%       │ │
│ │ 2   │ Диван      │ 2,800 ₽ │ 10.0%    │ 6.2%        │ │
│ └─────┴────────────┴─────────┴──────────┴─────────────┘ │
├─────────────────────────────────────────────────────────┤
│ 📋 Все SKU                              [Экспорт CSV]   │
│ ┌─────────────┬─────────┬────────┬────────┬──────────┐ │
│ │ SKU         │Хранение │ Сред/д │ Объём  │ Склады   │ │
│ ├─────────────┼─────────┼────────┼────────┼──────────┤ │
│ │ SHIRT-001   │ 4,500 ₽ │ 161 ₽  │ 0.5 л  │ 2 склада │ │
│ │ COAT-XL-001 │ 3,200 ₽ │ 114 ₽  │ 2.5 л  │ 1 склад  │ │
│ └─────────────┴─────────┴────────┴────────┴──────────┘ │
│                            [← Пред] [1] [2] [3] [След →]│
└─────────────────────────────────────────────────────────┘
```

### 2. Интеграция с существующими компонентами

**Добавить в карточку товара** (используя `include_storage=true`):
```
┌─────────────────────────────────────────┐
│ Товар: Футболка хлопок (12345678)       │
├─────────────────────────────────────────┤
│ Маржа: 45.5% (W47)                      │
│ COGS: 121 ₽                             │
│ 📦 Хранение: 12.50 ₽/день (87.50 ₽/W47)│ ← Story 24.5
└─────────────────────────────────────────┘
```

**Добавить в таблицу товаров** (колонка "Хранение"):
```
┌──────────┬───────────────┬────────┬───────────────┐
│ Артикул  │ Название      │ Маржа  │ 📦 Хранение   │ ← Story 24.5
├──────────┼───────────────┼────────┼───────────────┤
│ 12345678 │ Футболка      │ 45.5%  │ 12.50 ₽/день  │
│ 67890123 │ Брюки         │ 32.0%  │ —             │ (нет данных)
└──────────┴───────────────┴────────┴───────────────┘
```

### 3. TypeScript Types

```typescript
// types/storage-analytics.ts

export interface StoragePeriod {
  from: string;  // ISO week (e.g., "2025-W44")
  to: string;
  days_count: number;
}

export interface StorageBySkuItem {
  nm_id: string;
  vendor_code: string | null;
  product_name: string | null;
  brand: string | null;
  storage_cost_total: number;
  storage_cost_avg_daily: number;
  volume_avg: number | null;
  warehouses: string[];
  days_stored: number;
}

export interface StorageSummary {
  total_storage_cost: number;
  products_count: number;
  avg_cost_per_product: number;
}

export interface StorageBySkuResponse {
  period: StoragePeriod;
  data: StorageBySkuItem[];
  summary: StorageSummary;
  pagination: {
    total: number;
    cursor: string | null;
    has_more: boolean;
  };
}

export interface TopConsumerItem {
  rank: number;
  nm_id: string;
  vendor_code: string | null;
  product_name: string | null;
  brand: string | null;
  storage_cost: number;
  percent_of_total: number;
  volume: number | null;
  revenue_net?: number;
  storage_to_revenue_ratio?: number | null;
}

export interface TopConsumersResponse {
  period: StoragePeriod;
  top_consumers: TopConsumerItem[];
  total_storage_cost: number;
}

export interface StorageTrendPoint {
  week: string;
  storage_cost?: number | null;
  volume?: number | null;
}

export interface MetricSummary {
  min: number;
  max: number;
  avg: number;
  trend: number;  // % change
}

export interface StorageTrendsResponse {
  period: StoragePeriod;
  nm_id: string | null;
  data: StorageTrendPoint[];
  summary?: {
    storage_cost?: MetricSummary;
    volume?: MetricSummary;
  };
}
```

### 4. React Hooks Example

```typescript
// hooks/useStorageAnalytics.ts

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useStorageBySku(weekStart: string, weekEnd: string, options?: {
  nm_id?: string;
  brand?: string;
  sort_by?: 'storage_cost' | 'volume' | 'nm_id' | 'days_stored';
  limit?: number;
}) {
  return useQuery({
    queryKey: ['storage-by-sku', weekStart, weekEnd, options],
    queryFn: () => api.get<StorageBySkuResponse>('/v1/analytics/storage/by-sku', {
      params: { weekStart, weekEnd, ...options }
    }),
  });
}

export function useStorageTopConsumers(weekStart: string, weekEnd: string, options?: {
  limit?: number;
  include_revenue?: boolean;
}) {
  return useQuery({
    queryKey: ['storage-top-consumers', weekStart, weekEnd, options],
    queryFn: () => api.get<TopConsumersResponse>('/v1/analytics/storage/top-consumers', {
      params: { weekStart, weekEnd, ...options }
    }),
  });
}

export function useStorageTrends(weekStart: string, weekEnd: string, options?: {
  nm_id?: string;
  include_summary?: boolean;
}) {
  return useQuery({
    queryKey: ['storage-trends', weekStart, weekEnd, options],
    queryFn: () => api.get<StorageTrendsResponse>('/v1/analytics/storage/trends', {
      params: { weekStart, weekEnd, ...options }
    }),
  });
}
```

---

## Validation Rules

### Week Range Validation

| Правило | Значение |
|---------|----------|
| `weekStart` ≤ `weekEnd` | Обязательно |
| Макс. диапазон | 52 недели |
| Формат | `YYYY-Www` (ISO 8601) |

### Error Responses

| HTTP | Код | Описание |
|------|-----|----------|
| 400 | `VALIDATION_ERROR` | Неверные параметры запроса |
| 401 | `UNAUTHORIZED` | Отсутствует/невалидный JWT |
| 403 | `FORBIDDEN` | Нет доступа к кабинету |
| 404 | `NOT_FOUND` | Нет данных за период |

**Пример ошибки**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid week range",
    "details": [
      { "field": "weekStart", "issue": "must be before weekEnd" }
    ]
  }
}
```

---

## Performance Targets

| Операция | Target p95 |
|----------|------------|
| `/by-sku` (8 weeks) | < 500ms |
| `/by-sku` (52 weeks) | < 1s |
| `/top-consumers` | < 300ms |
| `/trends` | < 400ms |

---

## Data Source

**Источник**: WB API Paid Storage Report (`/api/v1/paid_storage`)

**Особенности**:
- Данные доступны **на следующий день** после хранения
- Максимальный запрос: **8 дней** за раз
- **Rate limit**: 65s задержка между chunk-запросами для периодов >8 дней (2025-12-14)

**Формат данных**: **JSON** (не Excel как указано ранее!)

> ⚠️ **ВАЖНО**: WB SDK `downloadPaidStorageReport()` возвращает JSON массив, а не Excel файл.
> См. `39-epic-24-storage-import-json-fix.md` для деталей.

**Поля из WB API** (JSON формат):
- `date` — дата (YYYY-MM-DD)
- `nmId` — артикул WB (number)
- `vendorCode` — артикул продавца
- `warehouseName` — название склада
- `warehousePrice` — стоимость хранения (₽)
- `volume` — объём товара (л)
- `brand` — бренд
- `subject` — предмет/категория
- `techSize` — размер
- `barcode` — штрихкод
- `calcType` — тип расчёта

---

## Related Documentation

- **Epic**: [`docs/epics/epic-24-paid-storage-by-article.md`](../../../docs/epics/epic-24-paid-storage-by-article.md)
- **Story 24.1** (Schema): [`docs/stories/epic-24/story-24.1-database-schema.md`](../../../docs/stories/epic-24/story-24.1-database-schema.md)
- **Story 24.2** (Import): [`docs/stories/epic-24/story-24.2-import-service.md`](../../../docs/stories/epic-24/story-24.2-import-service.md)
- **Story 24.3** (API): [`docs/stories/epic-24/story-24.3-api-endpoints.md`](../../../docs/stories/epic-24/story-24.3-api-endpoints.md)
- **Story 24.4** (Scheduler): [`docs/stories/epic-24/story-24.4-auto-scheduler.md`](../../../docs/stories/epic-24/story-24.4-auto-scheduler.md)
- **Story 24.5** (Products API): [`docs/stories/epic-24/story-24.5-storage-in-products-api.md`](../../../docs/stories/epic-24/story-24.5-storage-in-products-api.md)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-29 | Backend Team | Epic 24 complete - All 5 stories implemented |
| 2025-11-29 | Backend Team | SEC-001 fix - SQL injection protection added |
| 2025-11-29 | Backend Team | Story 24.5 - Storage cost in Products API (`include_storage=true`) |
| 2025-12-14 | Backend Team | Rate limit protection - 65s delay between chunks for >8 day imports |
| 2025-12-04 | Backend Team | **CRITICAL FIX**: WB API returns JSON, not Excel - parser updated |
| 2025-12-15 | Backend Team | **SDK Workflow Docs**: Added 3-step task-based workflow documentation |
| 2025-12-15 | Backend Team | Added W46 comparison results (0.67% match) - see #39 |

---

**Epic Status**: ✅ **COMPLETE** (2025-11-29)
- ✅ Story 24.1: Database Schema (12 unit tests)
- ✅ Story 24.2: Import Service (12 unit tests)
- ✅ Story 24.3: API Endpoints (13 unit tests)
- ✅ Story 24.4: Auto Scheduler (6 unit tests)
- ✅ Story 24.5: Storage in Products API

**Total Tests**: 43+ unit tests
**QA Status**: All stories passed QA review

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-11-29
- **Summary**: Epic 24 (Paid Storage Analytics) is complete with all 5 stories implemented and QA-approved. Includes database schema, import service (WB SDK + Excel), API endpoints for storage breakdown by SKU, auto-scheduler for daily sync, and storage data integration into the Products API. 43+ unit tests passing.
- **Remaining frontend action**: Integrate paid storage analytics endpoints into the storage dashboard components.
