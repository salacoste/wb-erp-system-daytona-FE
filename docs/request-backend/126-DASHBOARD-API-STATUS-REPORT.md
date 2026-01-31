# Dashboard API Status Report - Отчёт о проблемах

**Дата:** 2026-01-31
**Статус:** ТРЕБУЮТСЯ ИСПРАВЛЕНИЯ НА FRONTEND

---

## Проблема

Frontend-команда сообщает о проблемах с карточками дашборда:

| Карточка | Статус на UI | Причина по мнению Frontend |
|----------|--------------|---------------------------|
| Выкупы | Placeholder | "Backend Sales API не реализован" |
| COGS выкупов | Placeholder | "Backend Sales COGS не реализован" |
| Логистика | Загрузка | "Данные загружаются" |
| Хранение | Загрузка | "Данные загружаются" |

---

## Результат анализа Backend

### ✅ ВСЕ API УЖЕ РЕАЛИЗОВАНЫ!

Проблема на стороне Frontend — вызываются несуществующие эндпоинты.

---

## Детальный разбор по карточкам

### 1. Выкупы (Sales)

**Проблема:** Frontend ищет `/v1/analytics/sales/volume` — этого эндпоинта НЕ СУЩЕСТВУЕТ.

**Решение:** Использовать `/v1/analytics/weekly/finance-summary`

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W05
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**
```json
{
  "summary_rus": {
    "wb_sales_gross": 131134.76,    // ← Выкупы (выручка продавца)
    "wb_returns_gross": 809.00,      // ← Возвраты
    "sales_gross": 295808.00,        // ← Retail price (НЕ для WB Dashboard!)
    ...
  }
}
```

**ВАЖНО:** Для соответствия WB Dashboard используйте `wb_sales_gross`, а не `sales_gross`!

---

### 2. COGS выкупов

**Проблема:** Frontend не знает правильный эндпоинт.

**Решение:** Использовать `/v1/analytics/cabinet-summary`

```http
GET /v1/analytics/cabinet-summary?weeks=1
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**
```json
{
  "summary": {
    "totals": {
      "cogs_total": 180000.00,       // ← Общий COGS
      "gross_profit": 303500.00,      // ← Валовая прибыль
      "operating_profit": 114750.00   // ← Операционная прибыль
    },
    "products": {
      "total": 120,
      "with_cogs": 95,
      "without_cogs": 25,
      "coverage_pct": 79.17          // ← % покрытия COGS
    }
  }
}
```

---

### 3. Логистика

**Проблема:** Вероятно неверные параметры или отсутствуют заголовки.

**Решение:** Данные в `/v1/analytics/weekly/finance-summary`

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W05
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**
```json
{
  "summary_rus": {
    "logistics_cost": 34576.48,      // ← Логистика
    ...
  }
}
```

---

### 4. Хранение

**Проблема:** Вероятно не вызывается правильный эндпоинт.

**Решение:** Использовать `/v1/analytics/storage/by-sku`

```http
GET /v1/analytics/storage/by-sku?weekStart=2026-W05&weekEnd=2026-W05
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

**Ответ:**
```json
{
  "summary": {
    "total_storage_cost": 125000.00,  // ← Общее хранение
    "products_count": 150,
    "avg_cost_per_product": 833.33
  },
  "data": [
    {
      "nm_id": "12345678",
      "storage_cost_total": 4500.00,
      ...
    }
  ]
}
```

**Альтернатива:** Поле `storage_cost` из `finance-summary`:
```json
{
  "summary_rus": {
    "storage_cost": 1763.35          // ← Хранение (из еженедельного отчёта)
  }
}
```

---

## Чек-лист исправлений для Frontend

- [ ] Исправить путь `/v1/analytics/sales/volume` → `/v1/analytics/weekly/finance-summary`
- [ ] Добавить вызов `/v1/analytics/cabinet-summary` для COGS
- [ ] Проверить наличие заголовков `Authorization` и `X-Cabinet-Id`
- [ ] Для хранения добавить вызов `/v1/analytics/storage/by-sku`
- [ ] Использовать `wb_sales_gross` вместо `sales_gross` для соответствия WB Dashboard
- [ ] Проверить формат недели: `YYYY-Www` (например, `2026-W05`)

---

## Связанная документация

| Документ | Содержание |
|----------|------------|
| [122-DASHBOARD-MAIN-PAGE-SALES-API.md](./122-DASHBOARD-MAIN-PAGE-SALES-API.md) | Полная документация Sales API |
| [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) | Логистика, Хранение, Реклама |
| [125-DASHBOARD-MAIN-PAGE-GUIDE.md](./125-DASHBOARD-MAIN-PAGE-GUIDE.md) | Сводное руководство |

---

## Контакты

При вопросах обращайтесь к backend-команде.

**Статус Backend:** ✅ Все API реализованы и работают
**Требуется от Frontend:** Исправить пути эндпоинтов и заголовки
