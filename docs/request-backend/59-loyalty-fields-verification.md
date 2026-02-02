# Request #59: Loyalty Fields Verification Against WB Dashboard

**Date**: 2025-12-14
**Priority**: 🟢 Low - Verification/Documentation
**Status**: ✅ **VERIFIED** - All loyalty fields match WB Dashboard exactly
**Component**: Backend API - Analytics Module
**Related**: Request #51 (payout formula), Request #57 (wb_sales_gross)

---

## Executive Summary

Проведена полная верификация полей лояльности (`loyalty_fee`, `loyalty_points_withheld`, `loyalty_compensation`) против WB Dashboard для W49 (01-07.12.2025). **Все значения совпадают на 100%**.

**Ключевой вывод**: Поля лояльности **НЕ участвуют** в формуле `payout_total` — они либо равны нулю, либо уже включены в другие агрегаты.

---

## Verification Results (W49)

### WB Dashboard Screenshots vs Backend Data

#### Отчёт "Основной"

| WB Dashboard поле | WB значение | Backend поле | Backend значение | Match |
|-------------------|-------------|--------------|------------------|-------|
| Продажа | 130,325.76₽ | `wb_sales_gross - wb_returns_gross` | 131,134.76 - 809 = 130,325.76₽ | ✅ |
| В т.ч. Компенсация скидки по программе лояльности | 336₽ | `loyalty_compensation` | 336.00₽ | ✅ |
| К перечислению за товар | 135,186.71₽ | `to_pay_goods` | 135,186.71₽ | ✅ |
| Стоимость логистики | 26,139.82₽ | `logistics_cost` | 26,139.82₽ | ✅ |
| Стоимость хранения | 1,923.34₽ | `storage_cost` | 1,923.34₽ | ✅ |
| Прочие удержания/выплаты | 51,063₽ | `other_adjustments_net` | 51,063.00₽ | ✅ |
| Корректировка ВВ | 2,153.28₽ | `wb_commission_adj` | 2,153.28₽ | ✅ |
| **Стоимость участия в программе лояльности** | **0** | `loyalty_fee` | **0.00₽** | ✅ |
| **Сумма удержанная за баллы лояльности** | **0** | `loyalty_points_withheld` | **0.00₽** | ✅ |
| **Итого к оплате** | **53,907.27₽** | `payout_total` | **53,907.27₽** | ✅ |

#### Отчёт "По выкупам"

| WB Dashboard поле | WB значение | Backend поле | Backend значение | Match |
|-------------------|-------------|--------------|------------------|-------|
| Продажа | 4,150.33₽ | `wb_sales_gross` | 4,150.33₽ | ✅ |
| В т.ч. Компенсация скидки по программе лояльности | 0 | `loyalty_compensation` | 0.00₽ | ✅ |
| К перечислению за товар | 3,466.25₽ | `to_pay_goods` | 3,466.25₽ | ✅ |
| Стоимость логистики | 432.16₽ | `logistics_cost` | 432.16₽ | ✅ |
| Стоимость участия в программе лояльности | 0 | `loyalty_fee` | 0.00₽ | ✅ |
| Сумма удержанная за баллы лояльности | 0 | `loyalty_points_withheld` | 0.00₽ | ✅ |
| **Итого к оплате** | **3,034.09₽** | `payout_total` | **3,034.09₽** | ✅ |

---

## Key Findings

### 1. "В том числе Компенсация..." — это ПОДМНОЖЕСТВО "Продажи"

WB Dashboard показывает:
```
Продажа: 130,325.76₽
В том числе Компенсация скидки по программе лояльности: 336₽
```

**Важно**: "В том числе" (including) означает, что `loyalty_compensation` **уже включена** в `gross` (и соответственно в `wb_sales_gross`). Это **НЕ** отдельное слагаемое формулы payout_total.

### 2. WB "Продажа" = NET (продажи минус возвраты)

```
WB "Продажа" = wb_sales_gross - wb_returns_gross
130,325.76 = 131,134.76 - 809.00 ✓
```

### 3. Loyalty поля в формуле payout_total

| Поле | Участие в формуле | Причина |
|------|-------------------|---------|
| `loyalty_fee` | ❌ НЕ вычитается | В данных = 0, если будет > 0 — требует анализа |
| `loyalty_points_withheld` | ❌ НЕ вычитается | В данных = 0, если будет > 0 — требует анализа |
| `loyalty_compensation` | ❌ НЕ добавляется | Уже включена в `gross` |

### 4. Текущая формула полностью корректна

```typescript
// src/aggregation/formulas/payout-total.formula.ts
payout_total = toPayGoods           // К перечислению за товар
             - logisticsCost        // Логистика
             - storageCost          // Хранение
             - paidAcceptanceCost   // Платная приёмка
             - penaltiesTotal       // Штрафы
             - otherAdjustmentsNet  // Прочие удержания
             - wbCommissionAdj      // Корректировка ВВ
```

**Loyalty поля НЕ требуют изменения формулы.**

---

## Historical Data Analysis

Проверка всех недель с ненулевыми loyalty полями:

```sql
SELECT week, report_type, loyalty_fee, loyalty_points_withheld, loyalty_compensation
FROM weekly_payout_summary
WHERE loyalty_fee != 0 OR loyalty_points_withheld != 0 OR loyalty_compensation != 0
ORDER BY week DESC;
```

| Week | Report | loyalty_fee | loyalty_points_withheld | loyalty_compensation |
|------|--------|-------------|-------------------------|----------------------|
| 2025-W49 | основной | 0.00₽ | 0.00₽ | 336.00₽ |
| 2025-W47 | основной | 0.00₽ | 0.00₽ | 77.13₽ |
| 2025-W46 | основной | 0.00₽ | 0.00₽ | 11.00₽ |
| 2025-W45 | основной | 0.00₽ | 0.00₽ | 25.04₽ |
| 2025-W43 | основной | 0.00₽ | 0.00₽ | 0.44₽ |
| 2025-W42 | основной | 0.00₽ | 0.00₽ | 10.00₽ |
| 2025-W37 | основной | 0.00₽ | 0.00₽ | 15.04₽ |

**Результат**: За все 13 недель данных:
- `loyalty_fee` = 0 (всегда)
- `loyalty_points_withheld` = 0 (всегда)
- `loyalty_compensation` > 0 в 7 неделях (включена в gross)

---

## Code Reference

### PayoutTotalInput Interface

```typescript
// src/aggregation/formulas/payout-total.formula.ts:25-32
export interface PayoutTotalInput {
  // ... expense categories used in formula ...

  // Informational fields (tracked for analytics but NOT used in payout formula)
  loyaltyFee: number;              // Стоимость участия в программе лояльности
  loyaltyPointsWithheld: number;   // Сумма удержанная за баллы
  loyaltyCompensation: number;     // Компенсация скидки (already in gross)
}
```

### SQL Aggregation

```sql
-- src/aggregation/weekly-payout-aggregator.service.ts
SUM(ABS(loyalty_fee)) as loyalty_fee,
SUM(ABS(loyalty_points_withheld)) as loyalty_points_withheld,
SUM(loyalty_compensation) as loyalty_compensation
```

---

## Recommendations

### For Frontend

1. **Не добавлять** loyalty_compensation в расчёт payout
2. **Отображать** "В т.ч. Компенсация лояльности" как информационное поле под "Продажа" (как в WB Dashboard)
3. **Мониторить** loyalty_fee и loyalty_points_withheld — если появятся ненулевые значения, требуется анализ

### For Backend

1. **Нет изменений** — текущая формула корректна
2. **Документация обновлена** — loyalty поля явно помечены как "informational"
3. **Мониторинг** — если WB начнёт использовать loyalty_fee/points_withheld, формулу нужно будет пересмотреть

---

## Related Documentation

- `docs/WB-DASHBOARD-METRICS.md` — основная документация метрик
- `frontend/docs/request-backend/136-wb-commission-adj-payout.md` — формула payout_total
- `frontend/docs/request-backend/57-wb-dashboard-exact-match-fields.md` — wb_sales_gross/wb_returns_gross
- `src/aggregation/formulas/payout-total.formula.ts` — реализация формулы

---

## Verification Evidence

### WB Dashboard Screenshots

**Основной (W49)**:
- Продажа: 130,325.76₽
- В т.ч. Компенсация: 336₽
- Стоимость участия в лояльности: 0
- Сумма за баллы лояльности: 0
- Итого: 53,907.27₽

**По выкупам (W49)**:
- Продажа: 4,150.33₽
- В т.ч. Компенсация: 0
- Стоимость участия в лояльности: 0
- Сумма за баллы лояльности: 0
- Итого: 3,034.09₽

### Backend Query Result

```sql
SELECT week, report_type, loyalty_fee, loyalty_points_withheld, loyalty_compensation, payout_total
FROM weekly_payout_summary WHERE week = '2025-W49';

-- Results:
-- основной:    loyalty_fee=0, loyalty_points_withheld=0, loyalty_compensation=336, payout_total=53907.27 ✓
-- по выкупам:  loyalty_fee=0, loyalty_points_withheld=0, loyalty_compensation=0,   payout_total=3034.09  ✓
```

---

**Conclusion**: ✅ **100% match with WB Dashboard**. Loyalty fields are correctly handled as informational-only and do not require formula changes.
