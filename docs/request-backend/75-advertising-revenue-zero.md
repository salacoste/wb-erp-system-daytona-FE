# Request #75: Advertising Analytics - Revenue Always Zero

**Date**: 2025-12-24
**Status**: ✅ RESOLVED (2025-12-24)
**Priority**: Critical
**Related**: Request #71 (Advertising Analytics API)
**Fix Commit**: a9931cf

---

## Проблема

Backend возвращает **`revenue: 0`** для всех товаров и в summary, хотя есть затраты и прибыль.

### Фактический backend response (2025-12-24)

**Endpoint**: `GET /v1/analytics/advertising?from=2025-12-01&to=2025-12-23`

**Summary**:
```json
{
  "totalSpend": 10408.29,
  "totalRevenue": 0,          // ❌ Всегда 0!
  "totalProfit": 568200.63,
  "avgRoas": 0                // ❌ Всегда 0 (потому что revenue=0)
}
```

**Items** (примеры показывающие проблему):
```json
[
  {
    "nmId": 270937054,
    "spend": 3873.9,
    "revenue": 0,               // ❌ Должна быть выручка!
    "profit": 3730.65,
    "roas": 0,                  // ❌ roas = revenue / spend = 0
    "roi": -0.04,
    "efficiency": "loss"        // ❌ НЕПРАВИЛЬНО (должен быть excellent/good)
  },
  {
    "nmId": 147205694,
    "spend": 585.84,
    "revenue": 0,               // ❌ Должна быть выручка!
    "profit": 77843.61,         // ✅ Огромная прибыль!
    "roas": 0,                  // ❌ Должен быть ROAS > 100!
    "roi": 131.88,              // ✅ ROI = 13,188% !
    "efficiency": "loss"        // ❌ АБСУРД! Товар с ROI 131% классифицирован как убыток
  },
  {
    "nmId": 321678606,
    "spend": 436.03,
    "revenue": 0,               // ❌ Должна быть выручка!
    "profit": 61552.44,         // ✅ Огромная прибыль!
    "roas": 0,                  // ❌ Должен быть ROAS > 100!
    "roi": 140.17,              // ✅ ROI = 14,017% !
    "efficiency": "loss"        // ❌ АБСУРД! Товар с ROI 140% классифицирован как убыток
  }
]
```

**❗ Критическая проблема**: Backend классифицирует товары с **прибылью 77,844₽ (ROI 131.88%)** как **"Убыток"** потому что `roas = 0 < 1.0`.

---

## Ожидаемое поведение

### Формула revenue (из WB Seller Analytics)

Согласно документации WB и Request #71:

```
revenue = SUM(retail_price_with_discount) для заказов атрибутированных к рекламе
```

**Источник данных**: WB SDK Finances/Reports API → `retail_price_with_discount` field.

### Пример ожидаемых данных

Если есть:
- `spend = 3,874₽` (затраты на рекламу)
- `profit = 3,731₽` (прибыль до вычета рекламы)

То должна быть:
```
revenue ≈ spend + profit_after_ads
```

Если `profit_after_ads = profit - spend`, то:
```
profit_after_ads = 3,731 - 3,874 = -143₽ (убыток после рекламы)
revenue ≈ 3,874 + (-143) ≈ 3,731₽ (примерно равна profit)
```

**НО**: revenue должна рассчитываться из WB данных о заказах, атрибутированных к рекламе!

---

## Impact

### Frontend Impact
- ✅ **Frontend работает корректно** - отображает то, что возвращает backend (0₽)
- ❌ **Пользователь видит некорректные данные**:
  - Выручка: 0₽ (должна быть реальная выручка)
  - ROAS: 0.0x (должен быть реальный ROAS = revenue / spend)

### User Experience
- ❌ **Невозможно оценить эффективность рекламы** без данных о выручке
- ❌ **ROAS всегда 0.0x** - главный метрик рекламной аналитики не работает
- ❌ **Карточка "Общий ROAS" красная** (показывает 0.0x вместо реального значения)
- ❌ **ВСЕ товары показаны как "Убыток" (loss)** - даже те у которых ROI = 131.88% и 140.17%!
  - Причина: `efficiency_status = 'loss'` потому что `roas = 0 < 1.0`
  - Товары с огромной прибылью (77,844₽ и 61,552₽) помечены как убыточные

### Business Impact
- 🚨 **КРИТИЧНО**: Основная функциональность рекламной аналитики не работает
- 🚨 **Блокирует Epic 33** (Advertising Analytics)
- 🚨 **Пользователь не может принимать решения** о рекламных кампаниях

---

## Возможные причины

### 1. WB API не возвращает данные о выручке
- Проверить response от WB SDK `getAdvFullstats()` (Promotion module)
- Возможно нужно использовать другой endpoint или параметры

### 2. Неправильный маппинг полей
- Backend может искать не то поле в WB response
- WB могла переименовать поле (как было с `Платная приёмка` → `Обработка товара` 22.12.2024)

### 3. Отсутствует логика агрегации revenue
- Revenue может быть в детализации (raw data), но не агрегируется в analytics endpoint
- Нужна отдельная query для расчёта revenue из orders/sales data

### 4. Период данных
- WB может не возвращать revenue для старых периодов
- Проверить dataAvailableFrom / dataAvailableTo в sync-status

---

## Рекомендуемые действия

### Шаг 1: Диагностика WB API
```typescript
// Проверить что возвращает WB SDK
const stats = await sdk.promotion.getAdvFullstats({
  from: '2025-12-01',
  to: '2025-12-23',
});

console.log('WB response sample:', {
  views: stats[0].views,
  clicks: stats[0].clicks,
  orders: stats[0].orders,
  sum: stats[0].sum,  // Это revenue?
  // ... другие поля
});
```

### Шаг 2: Проверить маппинг в backend
Файл: `src/analytics/services/advertising-analytics.service.ts`
```typescript
// Где происходит маппинг revenue?
revenue: item.sum || 0,  // Правильное ли поле?
```

### Шаг 3: Проверить агрегацию в summary
```typescript
// Где считается totalRevenue?
totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0)
```

### Шаг 4: Временное решение (если WB не даёт revenue)
Если WB API не возвращает revenue напрямую, можно **расчитать из других метрик**:

**Вариант А**: Из заказов
```sql
SELECT SUM(retail_price_with_discount) as revenue
FROM wb_finance_raw
WHERE campaign_id IN (...)
  AND sale_dt BETWEEN '2025-12-01' AND '2025-12-23'
  AND doc_type = 'Продажа'
```

**Вариант Б**: Из формулы
```typescript
// Если известен profit и margin
revenue = spend * (1 + profit / spend)

// Для примера:
// spend = 3,874₽, profit = 3,731₽
// revenue = 3,874 * (1 + 3,731 / 3,874) = 3,874 * 1.96 ≈ 7,605₽
```

---

## Вопросы для backend

1. **Откуда берётся revenue в текущей реализации?**
   - Какое поле WB SDK используется?
   - Какой endpoint WB API вызывается?

2. **Проверялись ли данные от WB API вручную?**
   - Возвращает ли WB API ненулевые значения для revenue/sum?
   - Может быть проблема с периодом данных?

3. **Есть ли revenue в сырых данных?**
   - В таблице `wb_finance_raw` или в advertising-specific таблице?
   - Может ли frontend временно использовать другой источник?

4. **Какая формула должна использоваться для revenue?**
   - `SUM(retail_price_with_discount)` из заказов?
   - Поле `sum` из WB Promotion API?
   - Или другая логика?

---

## Timeline Expectation

**Критичность**: 🔴 BLOCKING - без revenue невозможно использовать рекламную аналитику

**Ожидаемый срок**: 2025-12-24 (сегодня, если возможно)

**Frontend готов**: ✅ Все компоненты работают, frontend просто отображает backend данные

**Блокирует**: Story 33.9-FE (Release QA), Epic 33 completion

---

## Test Cases для проверки fix

После исправления, проверить:

```bash
# 1. Items должны иметь revenue
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '.items[0] | {nmId, spend, revenue, roas}'

# Expected:
# {
#   "nmId": 270937054,
#   "spend": 3873.9,
#   "revenue": 7605.5,  // ✅ НЕ НОЛЬ!
#   "roas": 1.96         // ✅ revenue / spend
# }

# 2. Summary должен иметь totalRevenue
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '.summary | {totalSpend, totalRevenue, avgRoas}'

# Expected:
# {
#   "totalSpend": 10408.29,
#   "totalRevenue": 25123.45,  // ✅ НЕ НОЛЬ!
#   "avgRoas": 2.41             // ✅ totalRevenue / totalSpend
# }

# 3. ROAS должен быть > 0 для profitable campaigns
curl -s "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-23&efficiency_filter=excellent" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Cabinet-Id: ${CABINET}" | jq '.items[] | {nmId, roas, revenue}'

# Expected: roas >= 5.0 для excellent status
```

---

## Связанные файлы

### Backend (предполагаемые)
- `src/analytics/controllers/advertising-analytics.controller.ts`
- `src/analytics/services/advertising-analytics.service.ts`
- `src/wildberries/services/promotion.service.ts` (WB SDK integration)

### Frontend (работает корректно)
- `src/lib/api/advertising-analytics.ts` - ✅ Adapter мапит revenue правильно
- `src/types/advertising-analytics.ts` - ✅ Типы корректные
- `src/app/(dashboard)/analytics/advertising/components/PerformanceMetricsTable.tsx` - ✅ Отображает revenue

---

## ✅ Решение (2025-12-24)

### Root Cause
Backend incorrectly queried `wb_finance_raw` table (general sales data NOT attributed to ads) instead of using the `orderSum` field from WB Promotion API response which contains actual revenue from ad-attributed orders.

**Файл**: `src/analytics/services/advertising-analytics.service.ts`

**Проблемный код** (line 703):
```typescript
// ❌ WRONG - queried wb_finance_raw (not ad-attributed)
const revenue = revenueMap.get(stat.nmId) || 0;
```

**Исправленный код**:
```typescript
// ✅ CORRECT - use orderSum from WB API stats (ad-attributed revenue)
const revenue = stat.orderSum;
```

### Изменения
1. **Line 703-706**: Changed revenue to use `stat.orderSum` directly from WB API response
2. **Line 247-251**: Removed unnecessary `getRevenueByNmId()` database query (optimization)
3. **Line 686-692**: Removed `revenueMap` parameter from `mergeData()` function signature

### Verification Results
✅ Database verification confirms revenue data is correctly populated:
```
Sample records with revenue:
┌────────────┬──────────┬────────┐
│ nm_id      │ revenue  │ spend  │
├────────────┼──────────┼────────┤
│ 193775258  │ 7975.00₽ │ 932.91₽│ → ROAS: 8.55x ✅
│ 270958590  │ 5433.00₽ │ 0.00₽  │ → ROAS: 0.00x ✅
│ 255211393  │ 4848.00₽ │ 136.14₽│ → ROAS: 35.61x ✅
└────────────┴──────────┴────────┘
Avg ROAS: 9.38x
```

### Impact
- ✅ Revenue now correctly populated from WB API `orderSum` field
- ✅ ROAS calculated correctly (revenue / spend)
- ✅ Efficiency status correct (items with high ROI no longer shown as "loss")
- ✅ Performance improved (removed unnecessary database query)

### Deployment
1. Backend fix deployed: commit `a9931cf`
2. Server restarted: 2025-12-24 04:19:27
3. Verification script confirms revenue > 0 for all items

**Статус**: 🟢 ПОЛНОСТЬЮ ИСПРАВЛЕНО

---

*Создано: 2025-12-24*
*Исправлено: 2025-12-24*
*Frontend Status: ✅ READY*
*Backend Status: ✅ FIXED (revenue from WB API orderSum)*
*Критичность: ✅ RESOLVED*
