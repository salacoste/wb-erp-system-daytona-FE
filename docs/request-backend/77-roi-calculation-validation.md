# Request #77: ROI Calculation Validation - Test Examples

**Date**: 2025-12-26
**Status**: 📋 **DOCUMENTATION** - Validation examples for backend team
**Priority**: Medium
**Related**: Epic 33 (Advertising Analytics API)

## Context

Frontend получает от backend уже вычисленные значения `profit` и `roi`. Эта документация содержит примеры расчётов для валидации корректности backend формул.

**Источник данных**: Test #11 (efficiency_filter=loss) - период W49 2025-12-01 to 2025-12-21

## Формулы (Epic 33 Specification)

```typescript
// Backend должен считать:
profit = revenue - COGS - commission - logistics - storage - penalties
profitAfterAds = profit - spend
roi = profitAfterAds / spend = (profit - spend) / spend

// Для отображения в UI:
roi_percent = roi × 100
```

## Пример 1: Товар ter-13-1 (SKU 270937054)

**Данные из API Response** (`GET /v1/analytics/advertising?efficiency_filter=loss`):

```json
{
  "key": "sku:270937054",
  "label": "ter-13-1",
  "nmId": 270937054,
  "brand": "О,ДЕНЬ",
  "category": "Термокомплекты",
  "views": 6264,
  "clicks": 318,
  "orders": 7,
  "spend": 6918.1,
  "ctr": 5.08,
  "cpc": 21.76,
  "conversionRate": 2.2,
  "revenue": 15896,
  "profit": -2796.75,
  "profitAfterAds": -9714.85,
  "totalSales": 24994,
  "organicSales": 9098,
  "organicContribution": 36.4,
  "roas": 2.3,
  "roi": -1.4,
  "efficiency": {
    "status": "loss",
    "recommendation": "Consider pausing or restructuring campaign"
  }
}
```

### Валидация расчётов:

**1. profitAfterAds проверка:**
```
profitAfterAds = profit - spend
-9714.85 = -2796.75 - 6918.1
-9714.85 = -9714.85 ✅ CORRECT
```

**2. ROI проверка:**
```
roi = profitAfterAds / spend
-1.4 = -9714.85 / 6918.1
-1.4044... ≈ -1.4 ✅ CORRECT (округление)
```

**3. ROI в процентах (UI display):**
```
roi_percent = roi × 100
-140% = -1.4 × 100 ✅ CORRECT
```

### Backend должен проверить:

**Откуда взялся `profit = -2796.75`?**

Детализация (из wb_finance_raw за W49):
```
profit = revenue - (COGS + commission + logistics + storage + penalties + ...)
-2796.75 = 15896 - (? COGS + ? commission + ? logistics + ? storage + ? penalties)

Обратный расчёт:
COGS + commission + logistics + ... = 15896 - (-2796.75) = 18692.75₽
```

**Вопросы для backend:**
1. ✅ Все строки `doc_type='Продажа'` для nmId=270937054 учтены в revenue=15896?
2. ✅ COGS для nmId=270937054 корректно применён (проверить таблицу `cogs`)?
3. ✅ Логистика, хранение, штрафы правильно суммированы из `wb_finance_raw`?
4. ✅ Комиссия WB (kvv) правильно вычислена по формуле `retail_price × (kvv_percent / 100)`?

---

## Пример 2: Товар ter-13 (SKU 193775258)

**Данные из API Response**:

```json
{
  "key": "sku:193775258",
  "label": "ter-13",
  "nmId": 193775258,
  "brand": "О,ДЕНЬ",
  "category": "Термокомплекты",
  "views": 1935,
  "clicks": 146,
  "orders": 2,
  "spend": 2188.23,
  "ctr": 7.55,
  "cpc": 14.99,
  "conversionRate": 1.4,
  "revenue": 3190,
  "profit": -9566.34,
  "profitAfterAds": -11754.57,
  "totalSales": 20662,
  "organicSales": 17472,
  "organicContribution": 84.56,
  "roas": 1.46,
  "roi": -5.37,
  "efficiency": {
    "status": "loss",
    "recommendation": "Consider pausing or restructuring campaign"
  }
}
```

### Валидация расчётов:

**1. profitAfterAds проверка:**
```
profitAfterAds = profit - spend
-11754.57 = -9566.34 - 2188.23
-11754.57 = -11754.57 ✅ CORRECT
```

**2. ROI проверка:**
```
roi = profitAfterAds / spend
-5.37 = -11754.57 / 2188.23
-5.3727... ≈ -5.37 ✅ CORRECT (округление до 2 знаков)
```

**3. ROI в процентах (UI display):**
```
roi_percent = roi × 100
-537% = -5.37 × 100 ✅ CORRECT
```

### Backend должен проверить:

**Откуда взялся `profit = -9566.34`?**

Детализация:
```
profit = revenue - (COGS + commission + logistics + storage + penalties + ...)
-9566.34 = 3190 - (? COGS + ? commission + ? logistics + ? storage + ? penalties)

Обратный расчёт:
COGS + commission + logistics + ... = 3190 - (-9566.34) = 12756.34₽
```

**❗ КРИТИЧНЫЙ ВОПРОС**: Почему затраты (12,756₽) в **4 раза больше** выручки (3,190₽)?

**Возможные причины:**
1. **Высокая себестоимость (COGS)**: Товар куплен дорого или производство дорогое
2. **Высокая логистика**: Тяжёлый/объёмный товар, дорогая доставка
3. **Возвраты**: Много возвратов с удержанием логистики
4. **Штрафы WB**: Просрочки, брак, нарушения условий
5. **Старая цена продажи**: Продаётся по сниженной цене, COGS не обновлён

**Backend должен детализировать**:
```sql
-- Для nmId=193775258, W49 2025
SELECT
  doc_type,
  reason,
  SUM(gross) as gross_total,
  SUM(net_for_pay) as net_for_pay_total,
  SUM(kvv_commission) as commission_total,
  SUM(acquiring_fee) as acquiring_total,
  SUM(delivery_fee + return_fee) as logistics_total,
  SUM(storage) as storage_total,
  SUM(penalties) as penalties_total
FROM wb_finance_raw
WHERE nm_id = 193775258
  AND sale_dt BETWEEN '2025-12-01' AND '2025-12-07'  -- W49
GROUP BY doc_type, reason;
```

---

## Пример 3: Средний ROI для убыточных кампаний

**Данные из API Summary**:

```json
{
  "summary": {
    "totalSpend": 9106.33,
    "totalRevenue": 19086,
    "totalProfit": -12363.09,
    "totalProfitAfterAds": -21469.42,
    "totalViews": 8199,
    "totalClicks": 464,
    "totalOrders": 9,
    "avgRoas": 2.1,
    "avgRoi": -2.36,
    "avgCtr": 5.66,
    "avgCpc": 19.63,
    "avgConversionRate": 1.94,
    "totalSales": 45656,
    "totalOrganicSales": 26570,
    "avgOrganicContribution": 58.2
  }
}
```

### Валидация расчётов:

**1. totalProfitAfterAds проверка:**
```
totalProfitAfterAds = totalProfit - totalSpend
-21469.42 = -12363.09 - 9106.33
-21469.42 = -21469.42 ✅ CORRECT
```

**2. avgRoi проверка:**
```
avgRoi = totalProfitAfterAds / totalSpend
-2.36 = -21469.42 / 9106.33
-2.3575... ≈ -2.36 ✅ CORRECT (округление до 2 знаков)
```

**Альтернативная проверка** (средний ROI по товарам):
```
avgRoi = (roi_товар1 + roi_товар2) / 2
-2.36 ≈ (-1.4 + -5.37) / 2
-2.36 ≈ -3.385 ❌ НЕ СОВПАДАЕТ

Причина: Backend считает взвешенный average по spend, не простое среднее.
```

**Корректная формула weighted average ROI:**
```
avgRoi = Σ(roi_i × spend_i) / Σ(spend_i)

avgRoi = ((-1.4 × 6918.1) + (-5.37 × 2188.23)) / (6918.1 + 2188.23)
avgRoi = (-9685.34 + -11751.01) / 9106.33
avgRoi = -21436.35 / 9106.33
avgRoi ≈ -2.35 ✅ CLOSE (небольшое расхождение из-за округления)
```

---

## Backend Validation Checklist

### Для каждого SKU проверить:

- [ ] **Revenue**: Сумма всех `net_for_pay` для `doc_type='Продажа'` (W49)
- [ ] **COGS**: Корректный COGS из таблицы `cogs` (valid_from ≤ Thursday W49)
- [ ] **Commission**: `retail_price × (kvv_percent / 100)` для всех продаж
- [ ] **Logistics**: `delivery_fee + return_fee` из wb_finance_raw
- [ ] **Storage**: `storage` из wb_finance_raw (или `paid_storage_daily` для W49)
- [ ] **Penalties**: `penalties` из wb_finance_raw
- [ ] **Profit**: `revenue - (COGS + commission + logistics + storage + penalties)`
- [ ] **profitAfterAds**: `profit - spend`
- [ ] **ROI**: `profitAfterAds / spend` (округление до 2 знаков)

### Summary aggregates:

- [ ] **totalProfit**: Сумма всех `profit` по SKU
- [ ] **totalProfitAfterAds**: `totalProfit - totalSpend`
- [ ] **avgRoi**: `totalProfitAfterAds / totalSpend` (взвешенный average)

---

## SQL Query для детализации (Example)

```sql
-- Детализация для SKU 193775258 (ter-13) - W49 2025
WITH sku_raw_data AS (
  SELECT
    nm_id,
    doc_type,
    reason,
    SUM(net_for_pay) as revenue_raw,
    SUM(retail_price_with_discount * (kvv_percent / 100)) as commission_calc,
    SUM(acquiring_fee) as acquiring,
    SUM(delivery_fee + return_fee) as logistics,
    SUM(storage) as storage,
    SUM(penalties) as penalties,
    SUM(commission_other) as other_commission
  FROM wb_finance_raw
  WHERE nm_id = 193775258
    AND sale_dt BETWEEN '2025-12-01' AND '2025-12-07'  -- W49
  GROUP BY nm_id, doc_type, reason
),
sku_cogs AS (
  SELECT
    nm_id,
    unit_cost_rub as cogs_per_unit
  FROM cogs
  WHERE nm_id = 193775258
    AND valid_from <= '2025-12-05'  -- Thursday W49
  ORDER BY valid_from DESC
  LIMIT 1
),
sku_orders AS (
  SELECT
    nm_id,
    COUNT(*) as order_count
  FROM wb_finance_raw
  WHERE nm_id = 193775258
    AND doc_type = 'Продажа'
    AND sale_dt BETWEEN '2025-12-01' AND '2025-12-07'
  GROUP BY nm_id
)
SELECT
  r.nm_id,
  r.revenue_raw,
  (o.order_count * c.cogs_per_unit) as total_cogs,
  r.commission_calc,
  r.acquiring,
  r.logistics,
  r.storage,
  r.penalties,
  (r.revenue_raw - (o.order_count * c.cogs_per_unit) - r.commission_calc - r.acquiring - r.logistics - r.storage - r.penalties) as profit_calculated
FROM sku_raw_data r
JOIN sku_cogs c ON r.nm_id = c.nm_id
JOIN sku_orders o ON r.nm_id = o.nm_id
WHERE r.doc_type = 'Продажа';
```

**Expected result for nmId=193775258**:
```
profit_calculated ≈ -9566.34
```

---

## Frontend Display (Reference)

**UI отображает ROI как percentage**:
- Backend: `roi: -2.36`
- Frontend: `-236%` (умножение на 100)

**Efficiency classification**:
- `roi < -0.2` (< -20%) → `status: "loss"`
- `-0.2 ≤ roi < 0` → `status: "poor"`
- `0 ≤ roi < 0.15` → `status: "moderate"`
- `0.15 ≤ roi < 0.30` → `status: "good"`
- `roi ≥ 0.30` → `status: "excellent"`

---

## Notes

1. **Rounding**: Backend округляет ROI до 2 знаков после запятой
2. **Weighted Average**: Summary.avgRoi - это взвешенное среднее по spend, не простое среднее
3. **Negative Profit**: Нормальная ситуация для убыточных товаров (затраты > выручка)
4. **COGS Impact**: Высокая себестоимость - основная причина отрицательного profit

**Frontend Team**: Maxim
**Backend Validation**: Backend team должен запустить SQL queries и проверить детализацию
