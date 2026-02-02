# Request #51: WB Commission Adjustment in Payout Formula

**Date**: 2025-12-12
**Status**: Completed
**Priority**: High
**Related**: Request #43, Request #49

---

## Problem Statement

При сравнении данных backend с WB Dashboard за неделю W49 (1-7 Dec 2025) обнаружено расхождение:

| Источник | Итого к оплате |
|----------|----------------|
| WB Dashboard | 56,941.36₽ |
| Наш backend | 59,094.64₽ |
| **Разница** | **2,153.28₽** |

Разница точно соответствует полю "Корректировка Вознаграждения ВВ" в WB Dashboard.

---

## Root Cause Analysis

### WB Dashboard показывает ДВА отдельных поля удержаний:

1. **"Прочие удержания/выплаты"**: 51,063.00₽
   - Наше поле: `corrections` / `other_adjustments_net`
   - ✅ Корректно вычиталось

2. **"Корректировка Вознаграждения ВВ"**: 2,153.28₽
   - Наше поле: `commission_other` → `wb_commission_adj`
   - ❌ НЕ вычиталось из payout_total

### Источник данных в wb_finance_raw

```sql
-- "Корректировка ВВ" = commission_other ТОЛЬКО с reason='Удержание'
-- Другие значения commission_other (Продажа, Возврат, Возмещение) НЕ вычитаются
SELECT
  reason,
  SUM(commission_other) as sum
FROM wb_finance_raw
WHERE report_id = 'api-2025-W49-all'
  AND report_type = 'основной'
  AND commission_other != 0
GROUP BY reason;

-- Результат:
-- reason                | sum
-- ----------------------|----------
-- Продажа               | 3,316.90  ← НЕ вычитается
-- Удержание             | 2,153.28  ← ЭТО "Корректировка ВВ"
-- Возмещение за выдачу  | 145.03    ← НЕ вычитается
-- Возврат               | 22.63     ← НЕ вычитается
```

### Важно: Фильтрация по reason

WB Dashboard показывает "Корректировка ВВ" только для строк с `reason='Удержание'`.
Остальные значения `commission_other` не входят в это поле.

---

## Детальный анализ commission_other

### Все типы записей в поле commission_other

Поле `commission_other` содержит **4 разных типа** записей с разным бизнес-смыслом:

| reason | doc_type | Сумма (всего) | gross | net_for_pay | Вычитаем? |
|--------|----------|---------------|-------|-------------|-----------|
| **Продажа** | sale | 67,064₽ | 2.17M₽ | 2.27M₽ | ❌ НЕТ |
| **Возврат** | return | 1,080₽ | 37K₽ | 35K₽ | ❌ НЕТ |
| **Возмещение за ПВЗ** | sale | 36,967₽ | 0₽ | 0₽ | ❌ НЕТ |
| **Удержание** | service | 4,008₽ | 0₽ | 0₽ | ✅ **ДА** |

### Почему НЕ вычитаем Продажа/Возврат

```
Пример продажи:
- retail_price_with_discount = 1,000₽ (покупатель платит)
- gross = 700₽ (продавец получает)
- commission_other = 300₽ (комиссия WB)
- total_commission_rub = retail_price - gross = 300₽

→ Комиссия УЖЕ учтена в total_commission_rub
→ Вычитать commission_other = ДВОЙНОЙ УЧЁТ!
```

### Почему НЕ вычитаем Возмещение за ПВЗ

**ВАЖНО**: "Возмещение за выдачу и возврат товаров на ПВЗ" - это РАСХОД продавца (комиссия WB за услуги ПВЗ), но это **ИНФОРМАЦИОННЫЕ строки**!

```
Структура строки "Возмещение за ПВЗ":
- gross = 0 (ВСЕГДА!)
- net_for_pay = 0 (ВСЕГДА!)
- retail_price = 0 (ВСЕГДА!)
- commission_other = 3.71₽ (ppvz_reward - вознаграждение WB за ПВЗ)

Пример: Для одной выдачи на ПВЗ
├── Строка Продажи: retail=568₽, gross=411₽, implicit_commission=157₽
└── Строка ПВЗ: retail=0, gross=0, commission_other=3.71₽ (часть комиссии)

→ commission_other показывает СКОЛЬКО из комиссии WB приходится на ПВЗ
→ Это НЕ отдельный платёж, а ИНФОРМАЦИОННАЯ разбивка!
→ Комиссия за ПВЗ УЖЕ ВКЛЮЧЕНА в (retail_price - gross) при продаже
→ Вычитать отдельно = ДВОЙНОЙ УЧЁТ!
```

**Доказательство**: gross=0, net_for_pay=0 для всех 65 строк W47 "Возмещение за ПВЗ".

### Почему ВЫЧИТАЕМ Удержание

```
- commission_other = 4,008₽
- gross = 0, net_for_pay = 0
- doc_type = 'service', reason = 'Удержание'

→ Это РЕАЛЬНОЕ удержание WB
→ Соответствует WB Dashboard "Корректировка ВВ"
→ ЕДИНСТВЕННАЯ категория для вычитания
```

### Последствия неправильной фильтрации

| Неделя | SUM(ВСЁ) | SUM(Удержание) | Разница (ошибка) |
|--------|----------|----------------|------------------|
| W49 | 5,637₽ | 2,153₽ | **-3,484₽** |
| W48 | 4,115₽ | 0₽ | **-4,115₽** |
| W47 | 5,678₽ | 0₽ | **-5,678₽** |
| W42 | 12,814₽ | 0₽ | **-12,814₽** |

**Если суммировать ВСЁ**: payout занижен на 3-12K₽ каждую неделю!

---

## Solution

### Updated Payout Formula

**Файл**: `src/aggregation/formulas/payout-total.formula.ts`

```typescript
/**
 * FORMULA (Request #49 + Request #51 - Updated 2025-12-12):
 *
 * payout_total = toPayGoods - logistics - storage - acceptance - penalties
 *              - otherAdjustments - wbCommissionAdj
 *
 * WB Dashboard fields:
 * - toPayGoods           = WB "К перечислению за товар" = SUM(net_for_pay)
 * - logisticsCost        = WB "Стоимость логистики" = delivery + return
 * - storageCost          = WB "Стоимость хранения"
 * - paidAcceptanceCost   = WB "Стоимость платной приёмки"
 * - penaltiesTotal       = WB "Общая сумма штрафов"
 * - otherAdjustmentsNet  = WB "Прочие удержания/выплаты" = corrections field
 * - wbCommissionAdj      = WB "Корректировка Вознаграждения ВВ" = commission_other (NEW)
 */
export function calculatePayoutTotal(input: PayoutTotalInput): number {
  return (
    input.toPayGoods -
    input.logisticsCost -
    input.storageCost -
    input.paidAcceptanceCost -
    input.penaltiesTotal -
    input.otherAdjustmentsNet -
    input.wbCommissionAdj  // Request #51: Added
  );
}
```

---

## Verification (W49 - Основной)

### Before Fix
```
payout_total = 135,186.71 - 26,139.82 - 1,923.34 - 0 - 0 - 51,063.00
             = 56,060.55₽  (наш расчёт без wbCommissionAdj)
```

### After Fix
```
payout_total = 135,186.71 - 26,139.82 - 1,923.34 - 0 - 0 - 51,063.00 - 2,153.28
             = 53,907.27₽  ✅ EXACT MATCH с WB Dashboard
```

### Full Week 49 Breakdown

| Report Type | WB Dashboard | Backend (Fixed) |
|-------------|--------------|-----------------|
| Основной | 53,907.27₽ | 53,907.27₽ ✅ |
| По выкупам | 3,034.09₽ | 3,034.09₽ ✅ |
| **Total** | **56,941.36₽** | **56,941.36₽** ✅ |

---

## WB Dashboard Field Mapping

| WB Dashboard Field | DB Column | Formula Variable |
|--------------------|-----------|------------------|
| К перечислению за товар | `to_pay_goods` | toPayGoods |
| Стоимость логистики | `logistics_cost` | logisticsCost |
| Стоимость хранения | `storage_cost` | storageCost |
| Стоимость платной приёмки | `paid_acceptance_cost` | paidAcceptanceCost |
| Общая сумма штрафов | `penalties_total` | penaltiesTotal |
| Прочие удержания/выплаты | `other_adjustments_net` | otherAdjustmentsNet |
| Корректировка Вознаграждения ВВ | `wb_commission_adj` | wbCommissionAdj |
| **Итого к перечислению** | `payout_total` | (calculated) |

---

## Files Changed

1. **`src/aggregation/formulas/payout-total.formula.ts`**
   - Added `wbCommissionAdj` to `PayoutTotalInput` interface
   - Updated `calculatePayoutTotal()` to subtract `wbCommissionAdj`
   - Updated documentation and examples

2. **`src/aggregation/weekly-payout-aggregator.service.ts`** (line 302-304)
   - Changed SQL aggregation to filter `wb_commission_adj` by `reason='Удержание'`:
   ```sql
   -- OLD: SUM(ABS(commission_other)) as wb_commission_adj
   -- NEW:
   SUM(CASE WHEN reason = 'Удержание' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj
   ```

3. **`docs/technical-debt/commission-separation.md`**
   - Referenced for understanding commission field structure

---

## Important Notes

1. **`wbCommissionAdj` vs `commission_other`**:
   - `commission_other` в raw data содержит несколько типов
   - `wbCommissionAdj` в агрегате = только `commission_other` с `reason='Удержание'`
   - Агрегация уже корректно считает это поле

2. **Не путать с `total_commission_rub`**:
   - `total_commission_rub` = неявная комиссия WB (retail - gross)
   - `wbCommissionAdj` = явная корректировка комиссии (отдельное поле)

3. **Результат может быть отрицательным**:
   - Если удержания превышают доход, seller должен WB

---

## Related Documentation

- Request #43: WB Dashboard Data Discrepancy (initial alignment)
- Request #49: Payout Total Formula Bug (toPayGoods base fix)
- `docs/WB-DASHBOARD-METRICS.md`: Full metrics reference
- `docs/technical-debt/commission-separation.md`: Commission field analysis
