# Руководство по интеграции: Маржа и Себестоимость (COGS)

> **Актуальность**: Ноябрь 2025 (Epic 20 + Request #15 + Story 2.7 + Story 6.1 + Story 6.3)
>
> Этот документ описывает **текущую реализацию** backend логики для работы с маржой и себестоимостью. Используйте его как единственный источник правды для frontend интеграции.

## 🆕 Последние обновления (Sprint 1, ноябрь 2025)

| Feature | Статус | Описание |
|---------|--------|----------|
| **Story 6.1** | ✅ Done | Date Range Analytics: `weekStart`/`weekEnd` параметры |
| **Story 6.3** | ✅ Done | ROI & Profit Metrics: `roi`, `profit_per_unit` в ответах |
| **Story 5.1** | ✅ Done | COGS History: `GET /v1/cogs/history` endpoint |

---

## Содержание

1. [Архитектура данных](#архитектура-данных)
2. [API Endpoints](#api-endpoints)
3. [🆕 Date Range Analytics (Story 6.1)](#-date-range-analytics-story-61)
4. [🆕 ROI & Profit Metrics (Story 6.3)](#-roi--profit-metrics-story-63)
5. [Сценарии ответов](#сценарии-ответов)
6. [Справочник `missing_data_reason`](#справочник-missing_data_reason)
7. [Логика расчёта недель](#логика-расчёта-недель)
8. [Особые случаи в данных](#особые-случаи-в-данных)
9. [Polling после назначения COGS](#polling-после-назначения-cogs)
10. [HTTP статусы и ошибки](#http-статусы-и-ошибки)
11. [Checklist для Frontend](#checklist-для-frontend)

---

## Архитектура данных

```
┌─────────────────────┐      ┌───────────────────────┐      ┌────────────────────────┐
│   wb_finance_raw    │ ───► │   weekly_margin_fact  │ ───► │    API Response        │
│   (сырые данные     │      │   (агрегация маржи    │      │    (current_margin_*)  │
│    из WB отчётов)   │      │    по неделям)        │      │                        │
└─────────────────────┘      └───────────────────────┘      └────────────────────────┘
         ▲                            ▲
         │                            │
    Импорт отчётов               Автоматический
    WB Finance API               пересчёт маржи
    (Excel или SDK)              после назначения COGS
```

### Ключевые таблицы

| Таблица | Назначение |
|---------|------------|
| `wb_finance_raw` | Сырые строки из WB отчётов (40+ полей) |
| `cogs` | Версионная себестоимость (`valid_from`, `valid_to`) |
| `weekly_margin_fact` | Агрегированная маржа по SKU/неделе |
| `weekly_payout_summary` | Недельные финансовые сводки |

### Формулы расчёта маржи

```
gross_profit = revenue_net_rub - cogs_rub
margin_percent = (gross_profit / |revenue_net_rub|) × 100%
```

Где:
- `revenue_net_rub` = SUM(net_for_pay) из `wb_finance_raw` за неделю
- `cogs_rub` = unit_cost_rub × qty (себестоимость × количество)

---

## API Endpoints

### 1. Получение списка товаров с маржой

```http
GET /v1/products?include_cogs=true&limit=50&cursor=...
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `include_cogs` | boolean | `true` для получения маржи (Request #15) |
| `limit` | number | Кол-во товаров (default: 50, max: 100) |
| `cursor` | string | Курсор пагинации |
| `search` | string | Поиск по артикулу/названию |

**Ответ:**
```json
{
  "data": [
    {
      "nm_id": "173589742",
      "sa_name": "Термобелье зимнее спортивное комплект",
      "brand": "О,ДЕНЬ",
      "category": "Термокомплекты",

      "has_cogs": true,
      "cogs": {
        "id": "3c465193-ef1e-470b-ae21-1e1055237590",
        "unit_cost_rub": "11",
        "valid_from": "2025-11-23T00:00:00.000Z",
        "valid_to": null,
        "source": "manual",
        "created_by": "630e7720-d105-42af-8991-5ca84bb576c4",
        "created_at": "2025-11-23T15:25:53.984Z"
      },

      "current_margin_pct": 92.32,
      "current_margin_period": "2025-W44",
      "current_margin_sales_qty": 5,
      "current_margin_revenue": 1431.59,
      "missing_data_reason": null
    }
  ],
  "pagination": {
    "count": 50,
    "has_more": true,
    "next_cursor": "eyJpZCI6IjE3MzU4OTc0NCJ9"
  }
}
```

---

### 2. Получение одного товара

```http
GET /v1/products/{nmId}
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Ответ:** Полный объект товара (см. выше) + дополнительные поля WB API (photos, dimensions, characteristics).

---

### 3. SKU-аналитика за конкретную неделю (+ Story 6.1, 6.3)

```http
# Одна неделя
GET /v1/analytics/weekly/by-sku?week=2025-W44&includeCogs=true&limit=1000
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}

# Date Range (Story 6.1) - агрегация за несколько недель
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true&limit=1000
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Параметры:**
| Параметр | Тип | Описание |
|----------|-----|----------|
| `week` | string | Одна неделя (формат YYYY-Www) |
| `weekStart` | string | 🆕 **Story 6.1**: Начало периода (формат YYYY-Www) |
| `weekEnd` | string | 🆕 **Story 6.1**: Конец периода (max 52 недели) |
| `includeCogs` | boolean | Включить данные о марже (default: false) |
| `limit` | number | Количество SKU (default: 100, max: 1000) |

**Важно:**
- После исправления (январь 2025) endpoint корректно агрегирует **ВСЕ** SKU, используя SQL `GROUP BY`
- При `weekStart`/`weekEnd` данные агрегируются: SUM для qty/revenue/cogs, weighted AVG для margin%

**Ответ (с Story 6.3 ROI полями):**
```json
{
  "data": [
    {
      "id": "173589742",
      "nm_id": "173589742",
      "sa_name": "ter-11",
      "sale_dt": "2025-10-28T12:21:18.000Z",
      "total_units": 5,
      "revenue_gross": 1448.00,
      "revenue_net": 1431.59,
      "logistics_cost": 176.50,
      "storage_cost": 0,
      "penalties": 0,
      "cogs": 110.00,
      "profit": 1321.59,
      "margin_pct": 92.32,
      "roi": 1201.45,
      "profit_per_unit": 264.32,
      "missing_cogs_flag": false
    }
  ],
  "pagination": {
    "count": 20,
    "has_more": false,
    "next_cursor": null
  }
}
```

---

### 4. Назначение себестоимости (одиночное)

```http
POST /v1/products/{nmId}/cogs
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json

{
  "unit_cost_rub": 11.00,
  "valid_from": "2025-11-23",
  "currency": "RUB",
  "notes": "Закупка партии #123"
}
```

**Поля запроса:**
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `unit_cost_rub` | number | ✅ | Себестоимость единицы (>0) |
| `valid_from` | string | ❌ | Дата начала действия (default: сегодня) |
| `currency` | string | ❌ | Валюта: RUB, USD, EUR, CNY (default: RUB) |
| `notes` | string | ❌ | Комментарий |

**Ответ 201 Created:**
```json
{
  "nm_id": "173589742",
  "sa_name": "Термобелье зимнее спортивное комплект",
  "has_cogs": true,
  "cogs": {
    "id": "3c465193-ef1e-470b-ae21-1e1055237590",
    "unit_cost_rub": "11",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "source": "manual"
  },
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "missing_data_reason": "CALCULATION_PENDING"
}
```

**Epic 20:** После создания COGS автоматически запускается фоновый пересчёт маржи (5-30 сек).

---

### 5. Массовое назначение себестоимости

```http
POST /v1/products/cogs/bulk
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json

{
  "items": [
    { "nm_id": "173589742", "unit_cost_rub": 11.00 },
    { "nm_id": "173589743", "unit_cost_rub": 25.50 },
    { "nm_id": "999999999", "unit_cost_rub": 100.00 }
  ],
  "valid_from": "2025-11-23"
}
```

**Ответ 202 Accepted:**
```json
{
  "accepted": 2,
  "failed": 1,
  "results": [
    { "nm_id": "173589742", "status": "created", "cogs_id": "uuid-1" },
    { "nm_id": "173589743", "status": "created", "cogs_id": "uuid-2" },
    { "nm_id": "999999999", "status": "failed", "error": "Product not found" }
  ],
  "margin_calculation_triggered": true
}
```

**Производительность:**
- До 1000 товаров за запрос
- Batch оптимизация: одна задача на пересчёт вместо N (Epic 20)
- Время пересчёта маржи: ~45-60 сек для 500 товаров

---

### 6. История продаж товара по неделям (Story 23.8)

```http
GET /v1/analytics/weekly/product-weeks?nm_id={nm_id}&weeks=13
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}
```

**Параметры:**
| Параметр | Тип | Обязательно | Описание |
|----------|-----|-------------|----------|
| `nm_id` | string | ✅ | Артикул товара |
| `weeks` | number | ❌ | Количество недель (1-52, default: 13) |

**Ответ 200 OK:**
```json
{
  "nm_id": "173589742",
  "sa_name": "Термобелье зимнее спортивное комплект",
  "weeks_with_sales": [
    {
      "week": "2025-W44",
      "week_start_date": "2025-10-28",
      "sales_qty": 5,
      "revenue_net": 1431.59,
      "has_margin": true,
      "margin_pct": 92.32
    },
    {
      "week": "2025-W43",
      "week_start_date": "2025-10-21",
      "sales_qty": 3,
      "revenue_net": 892.47,
      "has_margin": true,
      "margin_pct": 91.85
    },
    {
      "week": "2025-W42",
      "week_start_date": "2025-10-14",
      "sales_qty": 0,
      "revenue_net": 0,
      "has_margin": false,
      "margin_pct": null
    }
  ],
  "summary": {
    "total_weeks_analyzed": 13,
    "weeks_with_sales": 8,
    "weeks_with_margin": 6,
    "total_sales_qty": 42,
    "total_revenue_net": 12500.50
  }
}
```

**Use Cases (Frontend Level 2/3):**
- **Сценарий B** (NO_SALES_DATA): Показать историю продаж за другие недели
- **Margin Trend Chart**: Построить график динамики маржи
- **Product Summary**: Агрегированная статистика за период

**Производительность:**
- p95 < 200ms для 52 недель
- SQL с CTE-оптимизацией и JOIN на `weekly_margin_fact`

---

## 🆕 Date Range Analytics (Story 6.1)

**Статус:** ✅ Реализовано (ноябрь 2025)

Story 6.1 добавляет поддержку **multi-week aggregation** для аналитических endpoints. Вместо запроса одной недели теперь можно запросить диапазон и получить агрегированные данные.

### Поддерживаемые endpoints

| Endpoint | Параметры | Агрегация |
|----------|-----------|-----------|
| `/v1/analytics/weekly/by-sku` | `weekStart`, `weekEnd` | SUM(qty, revenue, cogs, profit), weighted AVG(margin) |
| `/v1/analytics/weekly/by-brand` | `weekStart`, `weekEnd` | SUM по бренду |
| `/v1/analytics/weekly/by-category` | `weekStart`, `weekEnd` | SUM по категории |

### Примеры запросов

```http
# Аналитика по SKU за 8 недель
GET /v1/analytics/weekly/by-sku?weekStart=2025-W40&weekEnd=2025-W47&includeCogs=true
Authorization: Bearer {jwt_token}
X-Cabinet-Id: {cabinet_id}

# Аналитика по брендам за квартал
GET /v1/analytics/weekly/by-brand?weekStart=2025-W35&weekEnd=2025-W47&includeCogs=true

# Аналитика по категориям за месяц
GET /v1/analytics/weekly/by-category?weekStart=2025-W44&weekEnd=2025-W47&includeCogs=true
```

### Логика агрегации

```
При multi-week запросе:
- total_units = SUM(total_units) по неделям
- revenue_net = SUM(revenue_net) по неделям
- cogs = SUM(cogs) по неделям
- profit = SUM(profit) по неделям
- margin_pct = SUM(profit) / SUM(revenue_net) × 100%  (weighted average)
```

### Валидация

| Правило | Ответ при нарушении |
|---------|---------------------|
| `weekEnd >= weekStart` | 400 VALIDATION_ERROR |
| Диапазон ≤ 52 недель | 400 VALIDATION_ERROR |
| Формат YYYY-Www | 400 INVALID_WEEK_FORMAT |

### Frontend использование

```typescript
// TypeScript интерфейс для date range запроса
interface DateRangeQuery {
  weekStart: string;  // "2025-W40"
  weekEnd: string;    // "2025-W47"
  includeCogs?: boolean;
  limit?: number;
}

// Пример fetch
const fetchDateRangeAnalytics = async (query: DateRangeQuery) => {
  const params = new URLSearchParams({
    weekStart: query.weekStart,
    weekEnd: query.weekEnd,
    includeCogs: String(query.includeCogs ?? true),
    limit: String(query.limit ?? 100)
  });

  const response = await fetch(`/v1/analytics/weekly/by-sku?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Cabinet-Id': cabinetId
    }
  });
  return response.json();
};
```

---

## 🆕 ROI & Profit Metrics (Story 6.3)

**Статус:** ✅ Реализовано (ноябрь 2025)

Story 6.3 добавляет **ROI** (Return on Investment) и **Profit per Unit** в аналитические ответы.

### Новые поля в ответах

| Поле | Тип | Формула | Описание |
|------|-----|---------|----------|
| `roi` | `number \| null` | `(profit / cogs) × 100%` | Возврат на инвестиции |
| `profit_per_unit` | `number \| null` | `profit / total_units` | Прибыль на единицу товара |

### Когда возвращается `null`

| Поле | null когда | Причина |
|------|-----------|---------|
| `roi` | `cogs = 0` или `cogs = null` | Деление на ноль |
| `profit_per_unit` | `total_units = 0` | Деление на ноль |

### Расширенный ответ (пример)

```json
{
  "data": [
    {
      "nm_id": "173589742",
      "sa_name": "ter-11",
      "total_units": 25,
      "revenue_gross": 7500.00,
      "revenue_net": 7250.00,
      "cogs": 550.00,
      "profit": 6700.00,
      "margin_pct": 92.41,

      "roi": 1218.18,
      "profit_per_unit": 268.00
    }
  ]
}
```

### Интерпретация ROI

| ROI | Значение |
|-----|----------|
| `roi > 100%` | Прибыль > себестоимости (хорошо) |
| `roi = 100%` | Прибыль = себестоимости (точка безубыточности) |
| `roi < 100%` | Прибыль < себестоимости (убыточно) |
| `roi = null` | COGS не назначен или = 0 |

### Форматирование для UI

```typescript
// Форматирование ROI
function formatROI(roi: number | null): string {
  if (roi === null) return '—';
  return `${roi.toFixed(2)}%`;
}

// Форматирование profit per unit
function formatProfitPerUnit(value: number | null): string {
  if (value === null) return '—';
  return `${value.toFixed(2)} ₽`;
}

// Цвет для ROI
function getROIColor(roi: number | null): string {
  if (roi === null) return 'gray';
  if (roi >= 150) return 'green';
  if (roi >= 100) return 'yellow';
  return 'red';
}
```

### Поддерживаемые endpoints

ROI и profit_per_unit доступны во всех аналитических endpoints:

| Endpoint | ROI | Profit per Unit |
|----------|-----|-----------------|
| `/v1/analytics/weekly/by-sku` | ✅ | ✅ |
| `/v1/analytics/weekly/by-brand` | ✅ | ✅ |
| `/v1/analytics/weekly/by-category` | ✅ | ✅ |
| `/v1/analytics/weekly/margin-trends` | ✅ | ✅ |

**Требование:** Установите `includeCogs=true` для получения этих полей.

---

## Сценарии ответов

### Сценарий A: ✅ Полный успех (COGS + продажи + маржа)

**Условия:** COGS назначена, есть продажи за последнюю завершённую неделю, маржа рассчитана.

```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "source": "manual"
  },
  "current_margin_pct": 92.32,
  "current_margin_period": "2025-W44",
  "current_margin_sales_qty": 5,
  "current_margin_revenue": 1431.59,
  "missing_data_reason": null
}
```

**Frontend:** Показать маржу `92.32%` с подписью "W44"

---

### Сценарий B: ⚠️ COGS есть, но нет продаж за последнюю неделю

**Условия:** COGS назначена, но за запрашиваемую неделю у товара нет строк с `qty=1`.

```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11",
    "valid_from": "2025-11-23T00:00:00.000Z"
  },
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "current_margin_sales_qty": 0,
  "current_margin_revenue": null,
  "missing_data_reason": "NO_SALES_DATA"
}
```

**Frontend:** "Нет продаж за W47" + предложить посмотреть другие недели

---

### Сценарий C: ❌ НЕТ COGS, есть продажи

**Условия:** Товар продавался, но себестоимость не назначена.

```json
{
  "nm_id": "173589742",
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "current_margin_sales_qty": 15,
  "current_margin_revenue": 4500.00,
  "missing_data_reason": "COGS_NOT_ASSIGNED"
}
```

**Frontend:** Показать "Назначьте себестоимость" (кнопка) + выручку `4500 ₽`

---

### Сценарий D: ❌ НЕТ COGS, НЕТ продаж

**Условия:** Новый товар без истории продаж.

```json
{
  "nm_id": "999999999",
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": null,
  "current_margin_period": null,
  "current_margin_sales_qty": 0,
  "current_margin_revenue": null,
  "missing_data_reason": "NO_SALES_DATA"
}
```

**Frontend:** "Нет данных о продажах"

---

### Сценарий E: ⏳ COGS только что назначена, маржа рассчитывается

**Условия:** Сразу после POST /cogs, worker ещё не успел пересчитать.

```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11",
    "valid_from": "2025-11-26T00:00:00.000Z"
  },
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "current_margin_sales_qty": 15,
  "current_margin_revenue": 4500.00,
  "missing_data_reason": "CALCULATION_PENDING"
}
```

**Frontend:** Показать "(расчёт маржи...)" + polling каждые 3 сек

---

## Справочник `missing_data_reason`

| Значение | Описание | Действие Frontend |
|----------|----------|-------------------|
| `null` | Маржа рассчитана успешно | Показать `current_margin_pct` |
| `"NO_SALES_DATA"` | Нет продаж за период | "Нет продаж за {period}" |
| `"COGS_NOT_ASSIGNED"` | COGS не назначена | "Назначьте себестоимость" |
| `"CALCULATION_PENDING"` | Расчёт в процессе | Spinner + polling |
| `"INCOMPLETE_WEEK"` | Неделя ещё не завершена | "Данные за {period} ещё не готовы" |

### Алгоритм определения `missing_data_reason`

```
┌─────────────────────────────────────────────────────────────────┐
│                    Алгоритм определения                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Получить lastCompletedWeek (W47 для среды W48)             │
│                                                                 │
│  2. Есть margin_fact для этой недели?                          │
│     ├─ ДА → margin_pct = значение, missing_data_reason = null  │
│     └─ НЕТ → проверить почему:                                 │
│                                                                 │
│  3. Есть ли продажи (wb_finance_raw) за эту неделю?            │
│     ├─ НЕТ → missing_data_reason = "NO_SALES_DATA"             │
│     └─ ДА → проверить COGS:                                    │
│                                                                 │
│  4. Есть ли COGS для товара (действующий на дату недели)?      │
│     ├─ НЕТ → missing_data_reason = "COGS_NOT_ASSIGNED"         │
│     └─ ДА → missing_data_reason = "CALCULATION_PENDING"        │
│             (маржа ещё не рассчитана)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Логика расчёта недель

### Какая неделя считается "последней завершённой"

Backend использует `IsoWeekService.getLastCompletedWeek(conservative: true)` для определения недели с гарантированными данными WB.

| День недели (Moscow) | Последняя завершённая неделя |
|---------------------|------------------------------|
| Понедельник         | W-2 (2 недели назад)         |
| Вторник до 12:00    | W-2                          |
| Вторник после 12:00 | W-1 (прошлая неделя)         |
| Среда - Воскресенье | W-1                          |

**Почему:** WB публикует данные за неделю во вторник ~10:00 MSK. Консервативный режим ждёт до 12:00.

**Пример (сегодня среда 26.11.2025, W48):**
- Последняя завершённая = W47 (17-23 ноября)
- Маржа показывается за W47

### Формат ISO недели

```
2025-W47
│    │
│    └─ Номер недели (01-53)
└────── Год
```

**Границы недели:**
- Начало: Понедельник 00:00:00 MSK
- Конец: Воскресенье 23:59:59 MSK

---

## Особые случаи в данных

### Строки с `qty=2` (транспортные возмещения)

```json
{
  "nm_id": "173589742",
  "qty": 2,
  "net_for_pay": 0,
  "doc_type": null
}
```

- **НЕ являются продажами** - информационные строки
- **НЕ создают** записи в `weekly_margin_fact`
- Если за неделю были только такие строки → `missing_data_reason: "NO_SALES_DATA"`

### Строки с `qty=0` (услуги)

Логистика, хранение, штрафы. Не влияют на маржу товара напрямую.

### Строки с `qty=1` (продажи/возвраты)

**Только эти строки учитываются при расчёте маржи:**
- `doc_type: "sale"` → положительная выручка
- `doc_type: "return"` → отрицательная выручка (сторно)

---

## Polling после назначения COGS

После `POST /v1/products/{nmId}/cogs` маржа пересчитывается **асинхронно** через BullMQ worker.

### Рекомендуемая стратегия polling

```javascript
const assignCogs = async (nmId, unitCost) => {
  // 1. Назначить COGS
  await api.post(`/products/${nmId}/cogs`, { unit_cost_rub: unitCost });

  // 2. Начать polling
  let attempts = 0;
  const maxAttempts = 10;
  const interval = 3000; // 3 секунды

  const poll = async () => {
    const product = await api.get(`/products/${nmId}`);

    // Маржа готова?
    if (product.current_margin_pct !== null) {
      return product;
    }

    // Продолжить polling
    if (++attempts < maxAttempts) {
      await sleep(interval);
      return poll();
    }

    // Таймаут - вернуть текущее состояние
    return product;
  };

  return poll();
};
```

### Тайминги

| Операция | Время пересчёта маржи |
|----------|----------------------|
| Один товар (текущая неделя) | 5-10 сек |
| Один товар (исторический COGS, 7 недель) | 20-30 сек |
| Bulk (500 товаров) | 45-60 сек |

---

## HTTP статусы и ошибки

### Успешные ответы

| Endpoint | Статус | Описание |
|----------|--------|----------|
| GET /products | 200 | Успех |
| GET /products/{id} | 200 | Товар найден |
| POST /products/{id}/cogs | 201 | COGS создана |
| POST /products/{id}/cogs | 200 | COGS обновлена (та же дата) |
| POST /products/cogs/bulk | 202 | Принято в обработку |
| GET /analytics/weekly/by-sku | 200 | Успех |

### Ошибки

| Статус | Код ошибки | Описание |
|--------|------------|----------|
| 400 | VALIDATION_ERROR | Ошибка валидации (unit_cost_rub <= 0) |
| 400 | INVALID_WEEK_FORMAT | Неверный формат недели |
| 401 | UNAUTHORIZED | Отсутствует/невалидный JWT |
| 403 | FORBIDDEN | Нет доступа к кабинету |
| 404 | PRODUCT_NOT_FOUND | Товар не найден в кабинете |
| 404 | NO_DATA_FOR_WEEK | Нет данных за неделю |

### Формат ошибки

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid COGS data",
    "details": [
      {
        "field": "unit_cost_rub",
        "issue": "must be positive number",
        "value": -5
      }
    ],
    "trace_id": "abc-123-xyz"
  }
}
```

---

## Checklist для Frontend

### Обязательно

- [ ] Отправлять `X-Cabinet-Id` во всех запросах
- [ ] Использовать `includeCogs=true` для получения маржи в списке
- [ ] Обрабатывать все значения `missing_data_reason`
- [ ] Показывать `current_margin_period` (за какую неделю маржа)
- [ ] Реализовать polling после назначения COGS (3 сек × 10 попыток)

### 🆕 Story 6.1 & 6.3 (Sprint 1)

- [ ] Поддержать выбор диапазона недель (`weekStart`/`weekEnd`)
- [ ] Отображать `roi` с цветовой индикацией (>150% зелёный, <100% красный)
- [ ] Отображать `profit_per_unit` с форматированием валюты
- [ ] Обрабатывать `null` для ROI/profit_per_unit (показывать "—")
- [ ] Валидировать диапазон: weekEnd >= weekStart, max 52 недели

### Рекомендуется

- [ ] Поддержать выбор недели для просмотра исторической маржи
- [ ] Показывать `current_margin_revenue` когда маржа недоступна
- [ ] Для bulk операций использовать `/cogs/bulk` (до 1000 товаров)
- [ ] Кэшировать список товаров на клиенте (invalidate после COGS assignment)
- [ ] Использовать Date Range для построения графиков трендов

### UI Состояния

| Состояние | UI Element |
|-----------|------------|
| Маржа есть | `92.32%` (зелёный badge) |
| Нет продаж | "Нет продаж за W47" (серый текст) |
| Нет COGS | "Назначить себестоимость" (кнопка) |
| Расчёт | Spinner + "(расчёт маржи...)" |
| Ошибка | "Ошибка загрузки" (красный) |

---

## Рекомендуемая структура UI

```
┌─────────────────────────────────────────────────────────────┐
│ Товар: Термобелье зимнее (173589742)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Себестоимость: 11.00 ₽  [Изменить]                        │
│  (действует с 23.11.2025)                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Маржа за W44: 92.32%                               │   │
│  │  Выручка: 1 431.59 ₽ | Прибыль: 1 321.59 ₽         │   │
│  │  Продажи: 5 шт                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ W47: Нет продаж (только транспортные операции)         │
│  [Посмотреть историю продаж]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Связанная документация

### 🆕 Sprint 1 Stories (ноябрь 2025)

- **Story 5.1**: [COGS History](../../../docs/stories/epic-5/story-5.1-view-cogs-history.md) - История версий COGS
- **Story 6.1**: [Date Range Analytics](../../../docs/stories/epic-6/story-6.1-date-range-analytics.md) - Multi-week запросы
- **Story 6.3**: [ROI & Profit Metrics](../../../docs/stories/epic-6/story-6.3-roi-profit-metrics.md) - ROI и profit_per_unit

### Epics

- **Epic 5**: [docs/stories/epic-5/](../../../docs/stories/epic-5/) - COGS History Management
- **Epic 6**: [docs/stories/epic-6/](../../../docs/stories/epic-6/) - Advanced Analytics
- **Epic 17**: [docs/stories/epic-17/](../../../docs/stories/epic-17/) - COGS & Margin Analytics
- **Epic 18**: [docs/stories/epic-18/](../../../docs/stories/epic-18/) - Products API Enhancement
- **Epic 19**: [docs/stories/epic-19/](../../../docs/stories/epic-19/) - WB Completed Weeks Only
- **Epic 20**: [docs/stories/epic-20/](../../../docs/stories/epic-20/) - Auto Margin Recalculation

### Other References

- **Request #15**: Products List Margin Enrichment (`includeCogs` parameter)
- **Products API Guide**: [docs/PRODUCTS-API-GUIDE.md](../../../docs/PRODUCTS-API-GUIDE.md)
- **API Paths Reference**: [docs/API-PATHS-REFERENCE.md](../../../docs/API-PATHS-REFERENCE.md)
- **Roadmap Doc #27**: [27-cogs-history-and-advanced-analytics-roadmap-backend.md](./27-cogs-history-and-advanced-analytics-roadmap-backend.md)

---

> **Последнее обновление**: 2025-11-26 (Sprint 1: Stories 5.1, 6.1, 6.3)
>
> При изменении логики backend обновите этот документ и укажите дату в шапке.

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-11-26
- **Summary**: Integration guide covering all COGS and margin API endpoints, data structures, and frontend integration patterns. Sprint 1 complete (Stories 5.1, 6.1, 6.3). Documents temporal COGS lookup, margin calculation flow, and all relevant API endpoints with TypeScript examples.
- **Remaining frontend action**: Use this guide as the comprehensive reference for COGS/margin integration across all analytics components.
