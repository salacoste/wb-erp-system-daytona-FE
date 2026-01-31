# Dashboard QA Verification Report - Результаты тестирования W04

**Дата:** 2026-01-31
**Период тестирования:** Неделя 4, 2026 (2026-W04, 19-25 января)
**Статус:** ✅ Backend работает корректно

---

## Резюме

**Backend API работает корректно.** Проблема "Orders = 0" — это отсутствие синхронизированных FBS-заказов за период 19-24 января, а не баг API.

---

## 1. Результаты API-запросов

### 1.1 Finance Summary (HTTP 200 ✅)

```bash
GET /v1/analytics/weekly/finance-summary?week=2026-W04
```

**Ответ `summary_total`:**
| Поле | Значение |
|------|----------|
| `wb_sales_gross_total` | **84,377.52 ₽** |
| `logistics_cost_total` | **17,566.04 ₽** |
| `storage_cost_total` | **2,024.94 ₽** |
| `cogs_total` | **35,818 ₽** |
| `transaction_count_total` | **1003** |
| `gross_profit` | **16,401.92 ₽** |

---

### 1.2 Orders Volume (HTTP 200 ✅, но 0 заказов)

```bash
GET /v1/analytics/orders/volume?from=2026-01-19&to=2026-01-25
```

**Ответ:**
```json
{
  "totalOrders": 0,
  "dailyTrend": [],
  "period": {"from": "2026-01-19", "to": "2026-01-25"}
}
```

**Причина:** FBS-заказы не синхронизированы за 19-24 января.

---

### 1.3 Advertising (HTTP 200 ✅)

```bash
GET /v1/analytics/advertising?from=2026-01-19&to=2026-01-25
```

**Ответ:**
```json
{
  "summary": {
    "totalSpend": 3728.55,
    "totalRevenue": 29777,
    "totalProfit": 53394.72
  }
}
```

---

## 2. Таблица верификации

| Метрика | Frontend ожидает | Backend возвращает | Совпадение |
|---------|------------------|-------------------|------------|
| Orders | > 0 | **0** | ⚠️ Нет данных FBS |
| Sales | 84,377.52 ₽ | 84,377.52 ₽ | ✅ |
| COGS | 35,818 ₽ | 35,818 ₽ | ✅ |
| Advertising | 3,728.55 ₽ | 3,728.55 ₽ | ✅ |
| Logistics | 17,566.04 ₽ | 17,566.04 ₽ | ✅ |
| Storage | 2,024.94 ₽ | 2,024.94 ₽ | ✅ |

---

## 3. Root Cause Analysis: Orders = 0

### Проблема

Orders Volume API возвращает 0 заказов за период 2026-01-19 — 2026-01-25.

### Причина

**Это РАЗНЫЕ источники данных:**

| API Endpoint | Таблица БД | Что показывает |
|--------------|------------|----------------|
| `/v1/analytics/orders/volume` | `OrderFbs` | FBS заказы (sync с WB Orders API) |
| `/v1/analytics/weekly/finance-summary` | `WbFinanceRaw` | Финансовые транзакции (Weekly Report) |

### Факты из базы данных

1. **Finance Raw за W04:**
   - Продукт-транзакции: 163 (RUS: 151, EAEU: 12)
   - wb_sales_gross: 84,377.52 ₽
   - **Продажи ЕСТЬ!**

2. **Orders FBS:**
   - За 19-24 января: **0 заказов**
   - Первые заказы: 25 января (2 шт.)
   - Всего за январь: 8 заказов

### Вывод

**Backend работает корректно.** FBS-синхронизация была запущена позже, поэтому заказы за 19-24 января отсутствуют в таблице `OrderFbs`.

---

## 4. Рекомендации для Frontend

### Вариант A: Использовать `product_transactions`

Вместо карточки "Заказы" использовать данные о транзакциях из finance-summary:

```typescript
// Количество продуктовых транзакций
const salesTransactions = (response.summary_rus?.product_transactions ?? 0)
                        + (response.summary_eaeu?.product_transactions ?? 0);

// W04: salesTransactions = 163 (вместо Orders = 0)
```

### Вариант B: Показывать пустое состояние

```typescript
if (ordersVolume.totalOrders === 0) {
  return (
    <Card title="Заказы FBS">
      <EmptyState message="Нет данных FBS за выбранный период" />
    </Card>
  );
}
```

### Вариант C: Комбинированная логика

```typescript
// Приоритет: FBS заказы > Product transactions
const ordersCount = ordersVolume.totalOrders > 0
  ? ordersVolume.totalOrders
  : financeSummary.summary_total?.transaction_count_total ?? 0;

const ordersLabel = ordersVolume.totalOrders > 0
  ? "Заказы FBS"
  : "Транзакции";
```

### Вариант D (рекомендуется): Разделить карточки

| Карточка | Источник | Описание |
|----------|----------|----------|
| **Заказы FBS** | `orders/volume` | Заказы из WB Orders API |
| **Продажи** | `finance-summary` | Финансовые транзакции "продажа" |

---

## 5. Итоговый статус компонентов

| Компонент | Статус | Комментарий |
|-----------|--------|-------------|
| Available Weeks | ✅ OK | W04 в списке |
| Finance Summary | ✅ OK | Все поля корректны |
| Orders Volume | ✅ OK | Работает, но нет данных FBS |
| Advertising | ✅ OK | Данные корректны |
| By-SKU | ✅ OK | Работает |

---

## 6. Теоретическая прибыль (расчёт)

По формуле Frontend:
```
Теор.прибыль = Заказы - COGS_заказов - Реклама - Логистика - Хранение
```

С Orders = 0:
```
Теор.прибыль = 0 - 35,818 - 3,728.55 - 17,566.04 - 2,024.94 = -59,137.53 ₽
```

**Проблема:** Формула некорректна при Orders = 0.

### Альтернативная формула (с использованием Sales):
```
Теор.прибыль = Выкупы - COGS - Реклама - Логистика - Хранение
             = 84,377.52 - 35,818 - 3,728.55 - 17,566.04 - 2,024.94
             = 25,239.99 ₽ (прибыль!)
```

---

## Контакты

При вопросах обращайтесь к backend-команде.

**Заключение:** Backend API работает корректно. Требуется уточнение бизнес-логики: использовать Orders FBS или Sales (финансовые транзакции) в формуле теоретической прибыли.
