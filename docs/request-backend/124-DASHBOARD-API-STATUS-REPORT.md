# Отчёт по статусу Backend API для Dashboard

**Дата**: 2026-01-31
**Автор**: Product Manager
**Для**: Frontend-команда

---

## Резюме

| Карточка Dashboard | Статус API | Рекомендуемый эндпоинт |
|-------------------|------------|------------------------|
| **Выкупы (Sales)** | ✅ EXISTS | `/v1/analytics/weekly/finance-summary` |
| **COGS выкупов (Sales COGS)** | ✅ EXISTS | `/v1/analytics/cabinet-summary` |
| **Логистика** | ✅ EXISTS | `/v1/analytics/weekly/finance-summary` |
| **Хранение** | ✅ EXISTS | `/v1/analytics/storage/by-sku` |

---

## 1. Выкупы (Sales) - "Backend Sales API не реализован"

### Статус: ✅ API СУЩЕСТВУЕТ

**Проблема**: Frontend ищет `/v1/analytics/sales/volume` - такой эндпоинт **НЕ СУЩЕСТВУЕТ**.

**Решение**: Используйте существующий `/v1/analytics/weekly/finance-summary`

### Рекомендуемый эндпоинт

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W05
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Поля для карточки "Выкупы"

| Метрика на UI | Поле в ответе | Пояснение |
|---------------|---------------|-----------|
| Выкупы (сумма) | `summary_rus.wb_sales_gross` | Сумма продаж как на WB Dashboard "Продажа" |
| Возвраты | `summary_rus.wb_returns_gross` | Сумма возвратов как на WB Dashboard "Возврат" |
| Нетто | `summary_rus.sale_gross` | Продажи минус возвраты |
| Количество | Нужна логика* | см. ниже |

### Пример ответа

```json
{
  "summary_rus": {
    "week": "2026-W05",
    "wb_sales_gross": 131134.76,
    "wb_returns_gross": 809.00,
    "sale_gross": 292665.00,
    "sales_gross": 295808.00,
    "returns_gross": 3143.00
  },
  "summary_total": {
    "wb_sales_gross_total": 135285.09,
    "wb_returns_gross_total": 809.00
  }
}
```

### Важные различия

| Поле | Значение | Что это |
|------|----------|---------|
| `sales_gross` | Цена для покупателя | retail_price_with_discount |
| `wb_sales_gross` | Выручка продавца | После вычета комиссии WB |

**Для соответствия WB Dashboard используйте `wb_sales_gross`!**

### Альтернатива для графика по дням

Если нужны данные по неделям для графика:

```http
GET /v1/analytics/weekly/trends?from=2026-W01&to=2026-W05&metrics=wb_sales_gross,wb_returns_gross
```

---

## 2. COGS выкупов (Sales COGS) - "Backend Sales COGS API не реализован"

### Статус: ✅ API СУЩЕСТВУЕТ

**Решение**: Используйте `/v1/analytics/cabinet-summary`

### Рекомендуемый эндпоинт

```http
GET /v1/analytics/cabinet-summary?weeks=4
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Поля для карточки "COGS выкупов"

| Метрика на UI | Поле в ответе | Пояснение |
|---------------|---------------|-----------|
| COGS Total | `summary.totals.cogs_total` | Общая себестоимость |
| Coverage % | `summary.products.coverage_pct` | % товаров с заполненным COGS |
| Gross Profit | `summary.totals.profit` | Валовая прибыль (revenue - cogs) |
| Margin % | `summary.totals.margin_pct` | Маржинальность |

### Пример ответа

```json
{
  "summary": {
    "period": {
      "start": "2026-W02",
      "end": "2026-W05",
      "weeks_count": 4
    },
    "totals": {
      "revenue_net": 1500000.00,
      "cogs_total": 600000.00,
      "profit": 900000.00,
      "margin_pct": 60.00,
      "qty": 2500,
      "profit_per_unit": 360.00,
      "roi": 150.00
    },
    "products": {
      "total": 120,
      "with_cogs": 95,
      "without_cogs": 25,
      "coverage_pct": 79.17
    }
  }
}
```

### Детализация по SKU с COGS

Для таблицы с детализацией:

```http
GET /v1/analytics/weekly/by-sku?week=2026-W05&includeCogs=true
```

---

## 3. Логистика - "Loading"

### Статус: ✅ API СУЩЕСТВУЕТ

**Возможная проблема**: Frontend не отправляет запрос или неверные параметры.

### Рекомендуемый эндпоинт

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W05
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Поля для карточки "Логистика"

| Метрика на UI | Поле в ответе |
|---------------|---------------|
| Стоимость логистики | `summary_rus.logistics_cost` |
| Логистика всего | `summary_total.logistics_cost_total` |

### Для графика трендов

```http
GET /v1/analytics/weekly/trends?from=2026-W01&to=2026-W05&metrics=logistics_cost
```

### Пример ответа (trends)

```json
{
  "data": [
    { "week": "2026-W01", "logistics_cost": 15000.00 },
    { "week": "2026-W02", "logistics_cost": 15500.00 },
    { "week": "2026-W03", "logistics_cost": 16000.00 }
  ],
  "summary": {
    "logistics_cost": {
      "min": 15000.00,
      "max": 16000.00,
      "avg": 15500.00,
      "trend": "+6.7%"
    }
  }
}
```

---

## 4. Хранение (Storage) - "Loading"

### Статус: ✅ API СУЩЕСТВУЕТ

**Возможная проблема**: Frontend не вызывает правильный эндпоинт.

### Рекомендуемые эндпоинты

#### Агрегированные данные

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W05
```

**Поле**: `summary_rus.storage_cost`

#### Детализация по SKU

```http
GET /v1/analytics/storage/by-sku?weekStart=2026-W01&weekEnd=2026-W05
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Пример ответа (storage/by-sku)

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
      "warehouses": ["Коледино", "Казань"]
    }
  ],
  "summary": {
    "total_storage_cost": 125000.00,
    "products_count": 150
  }
}
```

#### Топ потребителей хранения

```http
GET /v1/analytics/storage/top-consumers?weekStart=2026-W05&weekEnd=2026-W05&limit=10&include_revenue=true
```

#### Тренды хранения

```http
GET /v1/analytics/storage/trends?weekStart=2026-W01&weekEnd=2026-W05
```

---

## Чек-лист для Frontend

### Общие требования

1. **Headers**: Каждый запрос должен содержать:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   X-Cabinet-Id: <CABINET_UUID>
   ```

2. **Формат недели**: `YYYY-Www` (например, `2026-W05`)

3. **Кэширование**: Рекомендуем TTL 5 минут для аналитики

### Проверьте в коде

| Проверка | Что смотреть |
|----------|--------------|
| Header X-Cabinet-Id | Передаётся ли UUID кабинета? |
| Authorization | Валидный ли токен? |
| Формат недели | Используется `2026-W05`, а не `2026-05`? |
| Обработка ошибок | Есть ли fallback при 401/403/500? |
| Loading state | Корректно ли отображается loading? |

---

## Полная таблица соответствий

| UI Карточка | Эндпоинт | Поля |
|-------------|----------|------|
| Выкупы | `/finance-summary` | `wb_sales_gross`, `wb_returns_gross` |
| COGS выкупов | `/cabinet-summary` | `cogs_total`, `coverage_pct`, `profit` |
| Логистика | `/finance-summary` | `logistics_cost` |
| Хранение | `/storage/by-sku` | `storage_cost_total` |
| Тренды | `/trends` | `logistics_cost`, `storage_cost`, etc. |

---

## Полная документация

| Документ | Содержание |
|----------|------------|
| [122-DASHBOARD-MAIN-PAGE-SALES-API.md](./122-DASHBOARD-MAIN-PAGE-SALES-API.md) | Полная документация Sales API |
| [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) | Полная документация Expenses API |
| [../../API-PATHS-REFERENCE.md](../../docs/API-PATHS-REFERENCE.md) | Справочник всех эндпоинтов |

---

## Вывод

**НЕ НУЖНО создавать новые эндпоинты на бэкенде!**

Все необходимые данные доступны через существующие API:
- `/v1/analytics/weekly/finance-summary` - основные KPI
- `/v1/analytics/cabinet-summary` - COGS и агрегаты
- `/v1/analytics/storage/by-sku` - детализация хранения
- `/v1/analytics/weekly/trends` - временные ряды

**Проблема на стороне Frontend**: неверные пути эндпоинтов или отсутствие вызовов.

---

**Контакты**: При вопросах - PM или backend-команда.
