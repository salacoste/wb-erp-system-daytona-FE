# Dashboard Debug Report - Отладка карточек

**Дата:** 2026-01-31
**Статус:** Требуется проверка Frontend

---

## Текущий статус

| Карточка | Статус | Значение |
|----------|--------|----------|
| Заказы | 🔄 Загрузка | — |
| Выкупы | 🔄 Загрузка | wb_sales_gross не пришёл |
| COGS выкупов | ✅ Работает | 35 818 ₽ |
| Логистика | 🔄 Загрузка | — |
| Хранение | 🔄 Загрузка | — |
| Теор. прибыль | ⚠️ Недостаточно данных | — |

---

## Результат анализа Backend

### ✅ ВСЕ ПОЛЯ СУЩЕСТВУЮТ В API!

Поля `wb_sales_gross`, `logistics_cost`, `storage_cost` **есть в DTO** и корректно возвращаются API.

---

## Важно: Структура ответа

```javascript
// Ответ /v1/analytics/weekly/finance-summary?week=2025-W47

{
  "summary_rus": {                        // ← ДАННЫЕ ВНУТРИ summary_rus!
    "week": "2025-W47",
    "report_type": "основной",

    // Карточка "Выкупы"
    "wb_sales_gross": 131134.76,          // ← WB Dashboard "Продажа"
    "wb_returns_gross": 809.00,           // ← WB Dashboard "Возврат"

    // Карточка "Логистика"
    "logistics_cost": 34576.48,           // ← Стоимость доставки

    // Карточка "Хранение"
    "storage_cost": 1763.35,              // ← Хранение на складах

    // Карточка "COGS"
    "cogs_total": 85000.00,               // ← Себестоимость
    "cogs_coverage_pct": 92.5,            // ← % покрытия

    // Другие поля
    "sale_gross": 292665.00,              // ← NET (sales - returns)
    "sales_gross": 295808.00,             // ← Только продажи (retail price)
    "returns_gross": 3143.00,             // ← Только возвраты
    "payout_total": 131673.83,            // ← К перечислению
    "to_pay_goods": 200752.66,
    "total_commission_rub": 91856.34,
    ...
  },

  "summary_eaeu": {
    // Аналогичная структура для ЕАЭС
  },

  "summary_total": {
    "week": "2025-W47",
    "wb_sales_gross_total": 135285.09,    // ← Сумма RUS + EAEU
    "logistics_cost_total": 36500.00,
    "storage_cost_total": 1850.00,
    "cogs_total": 85000.00
  },

  "meta": {
    "week": "2025-W47",
    "cabinet_id": "uuid",
    "generated_at": "2025-12-06T14:30:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

---

## Проверка на Frontend

### ❌ Типичная ошибка:

```typescript
// НЕПРАВИЛЬНО - поля на верхнем уровне НЕТ!
const sales = response.wb_sales_gross;           // undefined!
const logistics = response.logistics_cost;       // undefined!
```

### ✅ Правильный код:

```typescript
// ПРАВИЛЬНО - данные внутри summary_rus
const data = response.summary_rus;

const sales = data?.wb_sales_gross ?? 0;         // 131134.76
const logistics = data?.logistics_cost ?? 0;     // 34576.48
const storage = data?.storage_cost ?? 0;         // 1763.35
const cogs = data?.cogs_total ?? 0;              // 85000.00

// Или для total (RUS + EAEU):
const totalSales = response.summary_total?.wb_sales_gross_total ?? 0;
```

---

## Почему поля могут быть 0 или null

| Причина | Поле | Решение |
|---------|------|---------|
| Нет продаж за неделю | `wb_sales_gross = 0` | Нормально, показать 0 |
| Нет логистики | `logistics_cost = 0` | Нормально, показать 0 |
| Paid Storage не синхронизирован | `storage_cost = 0` | Нужна синхронизация |
| COGS не назначена | `cogs_total = null` | Показать "—" или CTA |
| Неделя не существует | 404 ошибка | Проверить available-weeks |

---

## Orders Volume API

### Эндпоинт СУЩЕСТВУЕТ!

```http
GET /v1/analytics/orders/volume?from=2026-01-24&to=2026-01-31
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
```

### Параметры:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `from` | string | ✅ | Начало периода (YYYY-MM-DD) |
| `to` | string | ✅ | Конец периода (YYYY-MM-DD) |

**Max range:** 90 дней

### Ответ:

```json
{
  "hourlyTrend": [
    { "hour": 14, "count": 25 },
    { "hour": 15, "count": 22 }
  ],
  "dailyTrend": [
    { "date": "2026-01-24", "count": 150 },
    { "date": "2026-01-25", "count": 142 }
  ],
  "peakHours": [14, 15, 13],
  "cancellationRate": 3.5,
  "b2bPercentage": 12.0,
  "totalOrders": 500,
  "statusBreakdown": [
    { "status": "complete", "count": 400, "percentage": 80.0 }
  ],
  "period": {
    "from": "2026-01-24",
    "to": "2026-01-31"
  }
}
```

---

## Чек-лист отладки

### 1. Проверить доступные недели

```bash
curl -X GET "http://localhost:3000/v1/analytics/weekly/available-weeks" \
  -H "Authorization: Bearer {token}" \
  -H "X-Cabinet-Id: {cabinetId}"
```

Если выбранной недели нет в списке → данных нет, показать placeholder.

### 2. Проверить ответ finance-summary

```bash
curl -X GET "http://localhost:3000/v1/analytics/weekly/finance-summary?week=2025-W47" \
  -H "Authorization: Bearer {token}" \
  -H "X-Cabinet-Id: {cabinetId}"
```

Убедиться, что:
- Ответ 200 (не 404)
- `summary_rus` содержит данные
- Поля не undefined

### 3. Проверить код Frontend

```typescript
// Убедиться что читаем из правильного места:
console.log('Full response:', response);
console.log('summary_rus:', response.summary_rus);
console.log('wb_sales_gross:', response.summary_rus?.wb_sales_gross);
```

---

## Action Items для Frontend

1. [ ] Изменить путь чтения данных: `response.summary_rus.{field}`
2. [ ] Добавить fallback для null/undefined: `?? 0`
3. [ ] Для Orders использовать `/v1/analytics/orders/volume`
4. [ ] Добавить логирование для отладки

---

## Связанная документация

| Документ | Содержание |
|----------|------------|
| [122-DASHBOARD-MAIN-PAGE-SALES-API.md](./122-DASHBOARD-MAIN-PAGE-SALES-API.md) | Полная документация Sales API |
| [125-DASHBOARD-MAIN-PAGE-GUIDE.md](./125-DASHBOARD-MAIN-PAGE-GUIDE.md) | Сводное руководство |
| [126-DASHBOARD-API-STATUS-REPORT.md](./126-DASHBOARD-API-STATUS-REPORT.md) | Предыдущий отчёт |

---

**Backend Status:** ✅ Все API реализованы, поля существуют
**Вероятная проблема:** Неверный путь к данным в коде Frontend
