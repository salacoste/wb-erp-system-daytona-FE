# Руководство по интеграции Frontend: Маржа и Себестоимость

**Версия:** 1.0
**Дата:** 2025-11-26
**Источник:** Backend Team Documentation

---

## Архитектура данных

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  wb_finance_raw │ ───► │ weekly_margin_   │ ───► │ API Response       │
│  (сырые данные) │      │ fact (агрегация) │      │ (current_margin_*) │
└─────────────────┘      └──────────────────┘      └────────────────────┘
        ▲                        ▲
        │                        │
   Импорт отчётов          Пересчёт маржи
   WB Finance API          после назначения COGS
```

---

## API Endpoints

### 1. Получение списка товаров с маржой

```http
GET /v1/products?include_cogs=true&limit=50&cursor=...
Header: X-Cabinet-Id: {cabinet_id}
```

**Ответ:**
```json
{
  "data": [
    {
      "nm_id": "173589742",
      "sa_name": "Термобелье зимнее...",
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
  ],
  "pagination": { "has_more": true, "next_cursor": "..." }
}
```

### 2. Получение одного товара

```http
GET /v1/products/{nmId}
Header: X-Cabinet-Id: {cabinet_id}
```

### 3. SKU-аналитика за конкретную неделю

```http
GET /v1/analytics/weekly/by-sku?week=2025-W44&include_cogs=true&limit=1000
Header: X-Cabinet-Id: {cabinet_id}
```

**Ответ:**
```json
{
  "data": [
    {
      "nm_id": "173589742",
      "sa_name": "ter-11",
      "total_units": 5,
      "revenue_gross": 1448,
      "revenue_net": 1431.59,
      "logistics_cost": 176.5,
      "cogs": 110,
      "profit": 1321.59,
      "margin_pct": 92.32,
      "missing_cogs_flag": false
    }
  ],
  "pagination": { "count": 20, "has_more": false }
}
```

### 4. Назначение себестоимости (одиночное)

```http
POST /v1/products/{nmId}/cogs
Header: X-Cabinet-Id: {cabinet_id}
Content-Type: application/json

{
  "unit_cost_rub": 11.00,
  "valid_from": "2025-11-23",
  "currency": "RUB",
  "notes": "Закупка партии #123"
}
```

**Ответ 201 Created:**
```json
{
  "id": "uuid",
  "nm_id": "173589742",
  "unit_cost_rub": "11",
  "valid_from": "2025-11-23T00:00:00.000Z",
  "margin_calculation_triggered": true
}
```

### 5. Массовое назначение себестоимости

```http
POST /v1/products/cogs/bulk
Header: X-Cabinet-Id: {cabinet_id}

{
  "items": [
    { "nm_id": "173589742", "unit_cost_rub": 11.00 },
    { "nm_id": "173589743", "unit_cost_rub": 25.50 }
  ],
  "valid_from": "2025-11-23"
}
```

**Ответ 202 Accepted:**
```json
{
  "accepted": 2,
  "failed": 0,
  "margin_calculation_triggered": true
}
```

---

## Сценарии отображения маржи

### Сценарий 1: Есть COGS + Есть продажи + Маржа рассчитана

```json
{
  "has_cogs": true,
  "current_margin_pct": 92.32,
  "current_margin_period": "2025-W44",
  "current_margin_revenue": 1431.59,
  "missing_data_reason": null
}
```

**UI:** Показать маржу `92.32%` с подписью "W44"

---

### Сценарий 2: Есть COGS + НЕТ продаж за последнюю неделю

```json
{
  "has_cogs": true,
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "current_margin_revenue": null,
  "missing_data_reason": "NO_SALES_DATA"
}
```

**UI:** "Нет продаж за W47" + опционально: ссылка "Посмотреть за другие недели"

**Как найти маржу за предыдущие недели:**
```http
GET /v1/analytics/weekly/by-sku?week=2025-W44&include_cogs=true
```

---

### Сценарий 3: НЕТ COGS + Есть продажи

```json
{
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "current_margin_revenue": 5000.00,
  "missing_data_reason": "COGS_NOT_ASSIGNED"
}
```

**UI:** "Назначьте себестоимость" (кнопка) + показать выручку 5000 ₽

---

### Сценарий 4: НЕТ COGS + НЕТ продаж

```json
{
  "has_cogs": false,
  "current_margin_pct": null,
  "current_margin_period": null,
  "current_margin_revenue": null,
  "missing_data_reason": "NO_SALES_DATA"
}
```

**UI:** "Нет данных о продажах"

---

### Сценарий 5: COGS назначена, маржа рассчитывается

После `POST /v1/products/{nmId}/cogs` маржа пересчитывается асинхронно (5-30 сек).

**Polling стратегия:**
```typescript
const assignCogs = async (nmId, unitCost) => {
  await api.post(`/products/${nmId}/cogs`, { unit_cost_rub: unitCost });

  let attempts = 0;
  const maxAttempts = 10;

  const poll = async () => {
    const product = await api.get(`/products/${nmId}`);

    if (product.current_margin_pct !== null) {
      return product; // Маржа готова!
    }

    if (++attempts < maxAttempts) {
      await sleep(3000); // 3 сек между попытками
      return poll();
    }

    return product; // Таймаут
  };

  return poll();
};
```

**UI во время polling:** "(расчёт маржи...)" или spinner

---

### Сценарий 6: COGS с будущей даты (после midpoint недели)

**Условия:** COGS `valid_from` после четверга (midpoint) последней завершённой недели.

```json
{
  "has_cogs": true,
  "cogs": {
    "valid_from": "2025-11-23T00:00:00.000Z"
  },
  "current_margin_pct": null,
  "current_margin_period": "2025-W47",
  "missing_data_reason": null
}
```

**UI:** "(COGS с будущей даты)" - маржа будет рассчитана для следующей недели.

**Важно:** Backend использует **midpoint недели (четверг)** для COGS lookup:
- Если `valid_from ≤ Thursday` → COGS применяется к этой неделе
- Если `valid_from > Thursday` → COGS применяется к следующей неделе

См. `src/lib/margin-helpers.ts:isCogsAfterLastCompletedWeek()`

---

## Логика определения missing_data_reason

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

## Временная логика недель (Important!)

### Какая неделя считается "последней завершённой"

| День недели (Moscow) | Последняя завершённая неделя |
|----------------------|------------------------------|
| Понедельник          | W-2 (2 недели назад)         |
| Вторник до 12:00     | W-2                          |
| Вторник после 12:00  | W-1 (прошлая неделя)         |
| Среда - Воскресенье  | W-1                          |

**Почему:** WB публикует данные за неделю во вторник ~10:00 MSK. Консервативный режим ждёт до 12:00.

**Пример (сегодня среда 26.11.2025, W48):**
- Последняя завершённая = W47 (17-23 ноября)
- Маржа показывается за W47
- Midpoint W47 = четверг 21 ноября

### COGS Temporal Lookup (Midpoint Strategy)

Backend использует **midpoint недели (четверг)** для определения, какой COGS применять:

```typescript
// Week W47: Mon 18.11 - Sun 24.11
// Midpoint: Thu 21.11

// COGS valid_from: 2025-11-20 (Wed) → applies to W47 ✓
// COGS valid_from: 2025-11-23 (Sat) → does NOT apply to W47 ✗
```

**Frontend функция:** `isCogsAfterLastCompletedWeek(validFrom)` в `margin-helpers.ts`

---

## Особые случаи в данных

### Строки с qty=2 (транспортные возмещения)

```json
{
  "nm_id": "173589742",
  "qty": 2,
  "net_for_pay": 0,
  "doc_type": null
}
```

Эти строки **НЕ создают margin_fact**. Если за неделю были только такие строки → `NO_SALES_DATA`.

### Строки с qty=0 (услуги)

Логистика, хранение, штрафы. **Не влияют** на маржу товара.

### Строки с qty=1 (продажи/возвраты)

**Только эти строки** учитываются при расчёте маржи.

---

## Таблица значений missing_data_reason

| Значение              | Описание                 | Действие Frontend                  |
|-----------------------|--------------------------|------------------------------------|
| `null`                | Маржа рассчитана успешно | Показать `current_margin_pct`      |
| `"NO_SALES_DATA"`     | Нет продаж за период     | "Нет продаж за {period}"           |
| `"COGS_NOT_ASSIGNED"` | COGS не назначена        | "Назначьте себестоимость"          |
| `"CALCULATION_PENDING"` | Расчёт в процессе      | Spinner + polling                  |
| `"INCOMPLETE_WEEK"`   | Неделя ещё не завершена  | "Данные за {period} ещё не готовы" |

---

## Таблица HTTP статусов

| Endpoint                     | Статус | Описание                        |
|------------------------------|--------|---------------------------------|
| GET /products                | 200    | Успех                           |
| GET /products/{id}           | 200    | Товар найден                    |
| GET /products/{id}           | 404    | Товар не найден                 |
| POST /products/{id}/cogs     | 201    | COGS создана                    |
| POST /products/{id}/cogs     | 400    | Ошибка валидации                |
| POST /products/{id}/cogs     | 404    | Товар не найден                 |
| POST /products/{id}/cogs     | 409    | COGS уже существует на эту дату |
| POST /products/cogs/bulk     | 202    | Принято в обработку             |
| GET /analytics/weekly/by-sku | 200    | Успех                           |
| GET /analytics/weekly/by-sku | 400    | Неверный формат недели          |

---

## Справочник API ответов по сценариям

### Endpoint: GET /v1/products/{nmId}

#### ✅ Сценарий A: Полный успех (COGS + продажи + маржа)

```json
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
```

**Frontend:** Показать маржу `92.32%` за W44

---

#### ⚠️ Сценарий B: COGS есть, но нет продаж за последнюю неделю

```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11",
    "valid_from": "2025-11-23T00:00:00.000Z",
    "source": "manual"
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

#### ❌ Сценарий C: НЕТ COGS, есть продажи

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

**Frontend:** Показать "Назначьте себестоимость" + выручку 4500 ₽

---

#### ❌ Сценарий D: НЕТ COGS, НЕТ продаж

```json
{
  "nm_id": "999999999",
  "sa_name": "Новый товар",
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

#### ⏳ Сценарий E: COGS только что назначена, маржа рассчитывается

```json
{
  "nm_id": "173589742",
  "has_cogs": true,
  "cogs": {
    "unit_cost_rub": "11",
    "valid_from": "2025-11-26T00:00:00.000Z",
    "source": "manual"
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

### Endpoint: GET /v1/products?include_cogs=true

**Пример смешанного ответа (разные товары):**

```json
{
  "data": [
    {
      "nm_id": "173589742",
      "sa_name": "Термобелье",
      "has_cogs": true,
      "current_margin_pct": 92.32,
      "current_margin_period": "2025-W44",
      "missing_data_reason": null
    },
    {
      "nm_id": "173589743",
      "sa_name": "Куртка зимняя",
      "has_cogs": true,
      "current_margin_pct": null,
      "current_margin_period": "2025-W47",
      "missing_data_reason": "NO_SALES_DATA"
    },
    {
      "nm_id": "173589744",
      "sa_name": "Шапка",
      "has_cogs": false,
      "current_margin_pct": null,
      "current_margin_period": "2025-W47",
      "missing_data_reason": "COGS_NOT_ASSIGNED"
    }
  ],
  "pagination": {
    "count": 3,
    "has_more": true,
    "next_cursor": "eyJpZCI6IjE3MzU4OTc0NCJ9"
  }
}
```

---

### Endpoint: POST /v1/products/{nmId}/cogs

**Успех (201 Created):**

```json
// Request
{
  "unit_cost_rub": 11.00,
  "valid_from": "2025-11-23",
  "notes": "Закупка партии #123"
}

// Response
{
  "id": "3c465193-ef1e-470b-ae21-1e1055237590",
  "nm_id": "173589742",
  "unit_cost_rub": "11",
  "valid_from": "2025-11-23T00:00:00.000Z",
  "valid_to": null,
  "source": "manual",
  "created_by": "630e7720-d105-42af-8991-5ca84bb576c4",
  "created_at": "2025-11-26T01:30:00.000Z",
  "margin_calculation_triggered": true
}
```

**Ошибка валидации (400 Bad Request):**

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
    ]
  }
}
```

**Товар не найден (404 Not Found):**

```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with nm_id 999999999 not found in cabinet",
    "details": [
      {
        "field": "nm_id",
        "issue": "not_found",
        "value": "999999999"
      }
    ]
  }
}
```

---

### Endpoint: POST /v1/products/cogs/bulk

**Успех (202 Accepted):**

```json
// Request
{
  "items": [
    { "nm_id": "173589742", "unit_cost_rub": 11.00 },
    { "nm_id": "173589743", "unit_cost_rub": 25.50 },
    { "nm_id": "999999999", "unit_cost_rub": 100.00 }
  ],
  "valid_from": "2025-11-23"
}

// Response
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

## Checklist для Frontend

- [ ] Использовать `include_cogs=true` для получения маржи
- [ ] Обрабатывать `missing_data_reason` для UI-сообщений
- [ ] Показывать `current_margin_period` (за какую неделю маржа)
- [ ] Реализовать polling после назначения COGS (3 сек × 10 попыток)
- [ ] Поддержать выбор недели для просмотра исторической маржи
- [ ] Отправлять `X-Cabinet-Id` во всех запросах
- [ ] Для bulk операций использовать `/cogs/bulk` (до 1000 товаров)
- [ ] Использовать `isCogsAfterLastCompletedWeek()` для определения "(COGS с будущей даты)"

---

## Связанные файлы

**Frontend:**
- `src/lib/margin-helpers.ts` - Helper функции (getLastCompletedWeek, isCogsAfterLastCompletedWeek)
- `src/hooks/useMarginPollingWithQuery.ts` - Polling hook
- `src/hooks/useSingleCogsAssignmentWithPolling.ts` - COGS + polling
- `src/components/custom/ProductList.tsx` - Отображение товаров с маржой
- `src/components/custom/MarginDisplay.tsx` - Компонент отображения маржи

**Backend (reference):**
- `src/products/products.service.ts` - getMarginDataForProducts()
- `src/analytics/services/margin-calculation.service.ts` - lookupCogs() with midpoint
- `src/cogs/services/cogs.service.ts` - findCogsAtDate()

---

**Last Updated:** 2025-11-26
