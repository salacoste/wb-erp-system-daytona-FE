# DASHBOARD-SALES-API.md

**Документ для Frontend-команды: API для дашборда продаж (выкупов)**

**Версия**: 1.0
**Дата**: 2026-01-31
**Автор**: Product Manager
**Статус**: Ready for Implementation

---

## Содержание

1. [Бизнес-контекст](#1-бизнес-контекст)
2. [Ключевые термины](#2-ключевые-термины)
3. [API Endpoints для дашборда](#3-api-endpoints-для-дашборда)
4. [Примеры запросов](#4-примеры-запросов)
5. [JSON Schema ответов](#5-json-schema-ответов)
6. [Формулы расчётов](#6-формулы-расчётов)
7. [Рекомендации по реализации](#7-рекомендации-по-реализации)

---

## 1. Бизнес-контекст

### Что показывает дашборд

| Метрика | Описание | Источник данных |
|---------|----------|-----------------|
| **Выкупы (Продажи)** | Фактические продажи с разбивкой по дням | `wb_sales_gross` |
| **COGS по выкупам** | Себестоимость проданных товаров | `cogs_total` |
| **К перечислению** | Итоговая сумма от WB | `payout_total` |

### Периоды отображения

- **Последняя неделя**: по дням (7 точек)
- **Последний месяц**: по дням (28-31 точка)
- **Переключение периодов**: через параметры `from`/`to` или `weekStart`/`weekEnd`

---

## 2. Ключевые термины

### Выкупы vs Заказы (КРИТИЧНО!)

| Термин | Что это | API поле | Когда фиксируется |
|--------|---------|----------|-------------------|
| **Заказы (Orders)** | Товар заказан покупателем | `orders_fbs` | При создании заказа |
| **Выкупы (Sales)** | Товар фактически выкуплен | `wb_sales_gross` | При получении покупателем |
| **Возвраты (Returns)** | Товар возвращён | `wb_returns_gross` | При оформлении возврата |

**ВАЖНО**: Для финансовой аналитики используются ВЫКУПЫ (`sales`), а не заказы!

### Соответствие WB Dashboard

| WB Dashboard | Наше поле | SQL формула |
|--------------|-----------|-------------|
| "Продажа" | `wb_sales_gross` | `SUM(gross) WHERE doc_type='sale'` |
| "Возврат" | `wb_returns_gross` | `SUM(gross) WHERE doc_type='return'` |
| "Комиссия WB" | `total_commission_rub` | `retail_price - gross` |
| "Итого" | `payout_total` | Формула ниже |

### Разница sales_gross vs wb_sales_gross

| Поле | Значение | Что означает |
|------|----------|--------------|
| `sales_gross` | 197,083₽ | Цена для покупателя (retail_price_with_discount) |
| `wb_sales_gross` | 131,134₽ | Выручка продавца после комиссии WB |
| Разница | 65,949₽ | = `total_commission_rub` (комиссия WB) |

**Для WB Dashboard используйте `wb_sales_gross`!**

---

## 3. API Endpoints для дашборда

### 3.1. Finance Summary (Основные KPI)

```http
GET /v1/analytics/weekly/finance-summary?week=2025-W47
```

**Назначение**: Агрегированные финансовые показатели за неделю

**Headers**:
```
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `week` | string | Да | ISO неделя: `2025-W47` |

---

### 3.2. Trends (Временные ряды по дням)

```http
GET /v1/analytics/weekly/trends?from=2025-W44&to=2025-W47
```

**Назначение**: Данные для графиков с разбивкой по неделям

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `from` | string | Да | Начальная неделя: `2025-W44` |
| `to` | string | Да | Конечная неделя: `2025-W47` |
| `metrics` | string | Нет | Фильтр метрик: `payout_total,sale_gross,logistics_cost` |
| `report_type` | string | Нет | `rus`, `eaeu`, `total` (default: total) |
| `include_summary` | boolean | Нет | Включить сводку (default: true) |

---

### 3.3. Cabinet Summary (Общий дашборд)

```http
GET /v1/analytics/cabinet-summary?weeks=4
```

**Назначение**: KPI кабинета за период с трендами

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `weeks` | number | Нет* | Последние N недель (default: 4, max: 52) |
| `weekStart` | string | Нет* | Начало диапазона: `2025-W40` |
| `weekEnd` | string | Нет* | Конец диапазона: `2025-W47` |

*Используйте либо `weeks`, либо `weekStart`+`weekEnd`

---

### 3.4. By SKU (Детализация по товарам)

```http
GET /v1/analytics/weekly/by-sku?week=2025-W47&includeCogs=true
```

**Назначение**: Финансовые показатели по каждому SKU

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `week` | string | Да* | Одна неделя: `2025-W47` |
| `weekStart` | string | Нет* | Начало диапазона |
| `weekEnd` | string | Нет* | Конец диапазона |
| `includeCogs` | boolean | Нет | Включить COGS и маржу (default: false) |
| `limit` | number | Нет | Лимит (default: 100, max: 500) |
| `report_type` | string | Нет | Фильтр по типу отчёта |

---

### 3.5. SKU Financials (Полная финансовая карточка SKU)

```http
GET /v1/analytics/sku-financials?week=2025-W50
```

**Назначение**: Полная финансовая разбивка по SKU (Epic 31)

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `week` | string | Да | ISO неделя: `2025-W50` |
| `nm_ids` | string | Нет | Фильтр по SKU: `148190182,148190095` |
| `sort_by` | string | Нет | Сортировка: `operating_profit`, `storage_cost`, `revenue` |
| `sort_order` | string | Нет | `asc` или `desc` (default: desc) |
| `include_visibility` | boolean | Нет | Включить комиссию/эквайринг (default: true) |
| `limit` | number | Нет | Лимит (default: 50, max: 500) |
| `offset` | number | Нет | Смещение для пагинации |

---

### 3.6. Period Comparison (Сравнение периодов)

```http
GET /v1/analytics/weekly/comparison?period1=2025-W46&period2=2025-W45
```

**Назначение**: Сравнение двух периодов (WoW, MoM, YoY)

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `period1` | string | Да | Первый период: `2025-W46` или `2025-W40:W47` |
| `period2` | string | Да | Второй период: `2025-W45` или `2025-W32:W39` |
| `groupBy` | string | Нет | Группировка: `sku`, `brand`, `category` |
| `includeCogs` | boolean | Нет | Включить COGS (default: true) |
| `limit` | number | Нет | Лимит при группировке |

---

## 4. Примеры запросов

### 4.1. Последняя неделя (по дням)

```http
GET /v1/analytics/weekly/trends?from=2025-W04&to=2025-W04
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

### 4.2. Последний месяц (4 недели)

```http
GET /v1/analytics/cabinet-summary?weeks=4
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

### 4.3. Продажи по SKU с COGS

```http
GET /v1/analytics/weekly/by-sku?weekStart=2025-W01&weekEnd=2025-W04&includeCogs=true&limit=50
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

### 4.4. Сравнение неделя к неделе

```http
GET /v1/analytics/weekly/comparison?period1=2025-W04&period2=2025-W03&groupBy=brand
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

---

## 5. JSON Schema ответов

### 5.1. Finance Summary Response

```json
{
  "summary_rus": {
    "week": "2025-W47",
    "report_type": "основной",

    "sale_gross": 292665.00,
    "sales_gross": 295808.00,
    "returns_gross": 3143.00,

    "wb_sales_gross": 131134.76,
    "wb_returns_gross": 809.00,

    "total_commission_rub": 91856.34,
    "to_pay_goods": 200752.66,
    "logistics_cost": 34576.48,
    "storage_cost": 1763.35,
    "other_adjustments_net": 32883.00,
    "payout_total": 131673.83,

    "wb_services_cost": 51063.00,
    "wb_promotion_cost": 32073.00,
    "wb_jam_cost": 18990.00,
    "wb_other_services_cost": 0.00,

    "cogs_total": 85000.00,
    "cogs_coverage_pct": 92.5,
    "products_with_cogs": 74,
    "products_total": 80,
    "gross_profit": null
  },
  "summary_eaeu": { },
  "summary_total": {
    "week": "2025-W47",
    "sale_gross_total": 305778.32,
    "payout_total": 138621.15,
    "wb_sales_gross_total": 135285.09,
    "wb_returns_gross_total": 809.00
  },
  "meta": {
    "week": "2025-W47",
    "cabinet_id": "uuid",
    "generated_at": "2025-12-06T14:30:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

### 5.2. By SKU Response (includeCogs=true)

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
      "commission": 1500.00,
      "acquiring_fee": 180.37,
      "advertising_cost": null,

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
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 5.3. SKU Financials Response (Epic 31)

```json
{
  "meta": {
    "week": "2025-W50",
    "cabinetId": 1,
    "generatedAt": "2025-12-18T10:00:00Z"
  },
  "data": [
    {
      "nmId": 270958752,
      "productName": "Widget Pro",
      "category": "Electronics",
      "brand": "BrandX",

      "revenue": {
        "gross": 5000.00,
        "net": 3500.00
      },

      "costs": {
        "cogs": 1200.00,
        "logistics": 500.00,
        "storage": 45.50,
        "penalties": 0.00,
        "paidAcceptance": 0.00
      },

      "visibility": {
        "commission": 750.00,
        "acquiring": 50.00
      },

      "profit": {
        "gross": 2300.00,
        "operating": 1754.50,
        "operatingMarginPct": 50.13
      },

      "profitabilityStatus": "excellent",
      "missingCogs": false
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### 5.4. Cabinet Summary Response

```json
{
  "summary": {
    "period": {
      "start": "2025-W45",
      "end": "2025-W48",
      "weeks_count": 4
    },
    "totals": {
      "sales_gross": 850000.00,
      "returns_gross": 15000.00,
      "sale_gross": 835000.00,

      "wb_sales_gross": 131134.76,
      "wb_returns_gross": 809.00,

      "total_commission_rub": 250000.00,
      "logistics_cost": 85000.00,
      "storage_cost": 12000.00,
      "payout_total": 483500.00,

      "wb_services_cost": 51063.00,
      "wb_services_breakdown": {
        "promotion": 32073.00,
        "jam": 18990.00,
        "other": 0.00
      },

      "revenue_net": 483500.00,
      "cogs_total": 180000.00,
      "profit": 303500.00,
      "margin_pct": 62.77,
      "qty": 2500,
      "profit_per_unit": 121.40,
      "roi": 168.61,

      "operating_profit": 114750.00,
      "operating_margin_pct": 23.73
    },
    "products": {
      "total": 120,
      "with_cogs": 95,
      "without_cogs": 25,
      "coverage_pct": 79.17
    },
    "trends": {
      "revenue_trend": "up",
      "profit_trend": "up",
      "margin_trend": "stable",
      "week_over_week_growth": 5.2
    }
  },
  "top_products": [],
  "top_brands": [],
  "meta": {
    "cabinet_id": "uuid",
    "cabinet_name": "My Shop",
    "generated_at": "2025-12-10T10:00:00Z"
  }
}
```

---

## 6. Формулы расчётов

### 6.1. Payout Total (К перечислению)

```
payout_total = to_pay_goods
             - logistics_cost
             - storage_cost
             - paid_acceptance_cost
             - penalties_total
             - other_adjustments_net
             - wb_commission_adj
```

### 6.2. Gross Profit (Валовая прибыль)

```
profit = revenue_net - cogs
margin_pct = (profit / revenue_net) × 100
```

### 6.3. Operating Profit (Операционная прибыль)

```
operating_profit = gross_profit - logistics - storage - penalties - paid_acceptance
operating_margin_pct = (operating_profit / revenue_net) × 100
```

### 6.4. ROI (Return on Investment)

```
roi = (profit / cogs) × 100
profit_per_unit = profit / total_units
```

### 6.5. Profitability Status

| Статус | Operating Margin % | Цвет |
|--------|-------------------|------|
| `excellent` | > 25% | Green (#22C55E) |
| `good` | 15-25% | Light Green (#84CC16) |
| `warning` | 5-15% | Yellow (#EAB308) |
| `critical` | 0-5% | Orange (#F97316) |
| `loss` | < 0% | Red (#EF4444) |
| `unknown` | N/A (нет COGS) | Gray (#9CA3AF) |

---

## 7. Рекомендации по реализации

### 7.1. Для дашборда "Выкупы по дням"

**Рекомендуемый endpoint**: `/v1/analytics/weekly/trends`

```typescript
// Последняя неделя
const lastWeek = await fetch(
  `/v1/analytics/weekly/trends?from=2025-W04&to=2025-W04&metrics=wb_sales_gross,wb_returns_gross,payout_total`
);

// Последний месяц (4 недели)
const lastMonth = await fetch(
  `/v1/analytics/weekly/trends?from=2025-W01&to=2025-W04`
);
```

### 7.2. Для блока "COGS по выкупам"

**Рекомендуемый endpoint**: `/v1/analytics/cabinet-summary`

```typescript
const summary = await fetch(`/v1/analytics/cabinet-summary?weeks=4`);

// Использование
const cogsTotal = summary.totals.cogs_total;
const cogsCoverage = summary.products.coverage_pct;
const grossProfit = summary.totals.profit;
```

### 7.3. Переключение периодов

```typescript
type Period = 'week' | 'month';

function getAnalytics(period: Period) {
  if (period === 'week') {
    return fetch(`/v1/analytics/weekly/trends?from=${currentWeek}&to=${currentWeek}`);
  } else {
    return fetch(`/v1/analytics/cabinet-summary?weeks=4`);
  }
}
```

### 7.4. Отображение как на WB Dashboard

```typescript
// Правильно - используем wb_sales_gross
const wbSales = data.summary_rus.wb_sales_gross;      // 131,134.76₽
const wbReturns = data.summary_rus.wb_returns_gross;  // 809.00₽
const wbNet = wbSales - wbReturns;                    // 130,325.76₽

// Неправильно - sales_gross это retail price, не WB Dashboard значение
// const wbSales = data.summary_rus.sales_gross;  // 197,083₽ - НЕ СОВПАДЁТ с WB!
```

### 7.5. Кэширование

| Endpoint | Cache TTL | Invalidation Events |
|----------|-----------|---------------------|
| `/finance-summary` | 30 min | import.completed |
| `/trends` | 30 min | import.completed |
| `/cabinet-summary` | 30 min | import.completed, cogs.updated |
| `/by-sku` | 30 min | import.completed, cogs.updated |
| `/sku-financials` | 30 min | import.completed, cogs.updated, storage.imported |

### 7.6. Обработка ошибок

| HTTP Code | Причина | Действие |
|-----------|---------|----------|
| 400 | Неверный формат параметров | Показать сообщение пользователю |
| 401 | Невалидный токен | Redirect на login |
| 403 | Нет доступа к кабинету | Показать ошибку доступа |
| 404 | Данные не найдены | Показать "Нет данных за период" |
| 500 | Ошибка сервера | Retry + показать техническую ошибку |

---

## Связанные документы

- [API-PATHS-REFERENCE.md](../API-PATHS-REFERENCE.md) - Полный справочник API
- [WB-DASHBOARD-METRICS.md](../WB-DASHBOARD-METRICS.md) - Соответствие метрикам WB
- [BUSINESS-LOGIC-REFERENCE.md](../BUSINESS-LOGIC-REFERENCE.md) - Бизнес-логика расчётов

---

**Версия документа**: 1.0
**Последнее обновление**: 2026-01-31
