# Request #63: Operating Profit Formula Clarification

**Date**: 2025-12-17
**Status**: Resolved
**Requested by**: Frontend Team

---

## Question

При расчёте "Прибыль" на фронтенде используется формула:
```
Прибыль = revenue_net − cogs − logistics_cost_rub − storage_cost_rub
```

Однако значение `operating_profit_rub` из API отличается от нашего расчёта.

**Пример (SKU 147205694, W49)**:
| Метрика | Значение |
|---------|----------|
| revenue_net | 14,074.60 ₽ |
| cogs | 4,488.00 ₽ |
| logistics_cost_rub | 5,999.63 ₽ |
| storage_cost_rub | 0 ₽ |
| Наш расчёт (frontend) | 3,586.97 ₽ |
| operating_profit_rub (API) | 2,193.90 ₽ |
| **Разница** | ~1,393 ₽ |

**Вопросы**:
1. Какая полная формула расчёта `operating_profit_rub`?
2. Какие дополнительные расходы включены помимо COGS, логистики и хранения?
3. Можно ли получить детализацию расходов per SKU?

---

## Answer

### 1. Полная формула `operating_profit_rub`

```
operating_profit_rub = gross_profit_rub − total_expenses_rub

где:
  gross_profit_rub = revenue_net_rub − cogs_rub

  total_expenses_rub = logistics_cost_rub
                     + storage_cost_rub
                     + paid_acceptance_cost_rub
                     + penalties_rub
                     + acquiring_fee_rub
                     + loyalty_fee_rub
                     + commission_rub
                     + |other_adjustments_rub|
                     − loyalty_compensation_rub  ← уменьшает расходы
```

### 2. Все типы расходов per SKU

| Поле API | Описание | Источник WB |
|----------|----------|-------------|
| `logistics_cost_rub` | Доставка + возврат + транспорт | logistics_delivery + logistics_return + transport_reimbursement |
| `storage_cost_rub` | Хранение | storage |
| `paid_acceptance_cost_rub` | Платная приёмка | paid_acceptance |
| `penalties_rub` | Штрафы | penalties |
| `acquiring_fee_rub` | Эквайринг | acquiring_fee |
| `loyalty_fee_rub` | Программа лояльности (списание) | loyalty_fee + loyalty_points_withheld |
| `loyalty_compensation_rub` | Компенсация лояльности (▼ расходы) | loyalty_compensation |
| `commission_rub` | Комиссии WB | commission_sales + commission_other |
| `other_adjustments_rub` | Прочие корректировки | corrections + other_adjustments |
| **`total_expenses_rub`** | **Сумма всех расходов** | Расчётное поле |

### 3. Детализация для примера SKU 147205694

```
revenue_net_rub       = 14,074.60 ₽
cogs_rub              =  4,488.00 ₽
gross_profit_rub      =  9,586.60 ₽  (revenue - cogs)

Операционные расходы:
  logistics_cost_rub      =  5,999.63 ₽
  storage_cost_rub        =      0.00 ₽
  paid_acceptance_rub     =      0.00 ₽
  penalties_rub           =      0.00 ₽
  acquiring_fee_rub       =    407.87 ₽
  loyalty_fee_rub         =      0.00 ₽
  loyalty_compensation    =   -175.00 ₽  (уменьшает расходы)
  commission_rub          =  1,160.20 ₽
  other_adjustments_rub   =      0.00 ₽
  ─────────────────────────────────────
  total_expenses_rub      =  7,392.70 ₽

operating_profit_rub  =  9,586.60 - 7,392.70 = 2,193.90 ₽ ✅
```

---

## API Fields Available

Все поля расходов **уже доступны** в endpoint `/v1/analytics/weekly/by-sku`:

```typescript
interface SkuAnalytics {
  // Revenue & COGS
  revenue_net_rub: number;
  cogs_rub: number;
  gross_profit_rub: number;

  // Expense breakdown (all fields available)
  logistics_cost_rub: number;
  storage_cost_rub: number;
  paid_acceptance_cost_rub: number;
  penalties_rub: number;
  acquiring_fee_rub: number;
  loyalty_fee_rub: number;
  loyalty_compensation_rub: number;
  commission_rub: number;
  other_adjustments_rub: number;

  // Totals
  total_expenses_rub: number;
  operating_profit_rub: number;
  operating_margin_percent: number;
}
```

---

## Frontend Recommendation

### DO: Use API values directly

```typescript
// Correct - use pre-calculated values from API
const profit = sku.operating_profit_rub;
const expenses = sku.total_expenses_rub;
```

### DON'T: Recalculate on frontend

```typescript
// Incorrect - incomplete formula
const profit = revenue - cogs - logistics - storage;
// Missing: acquiring, commission, loyalty, penalties, etc.
```

### Show expense breakdown in UI

```typescript
const expenseBreakdown = [
  { label: 'Логистика', value: sku.logistics_cost_rub },
  { label: 'Хранение', value: sku.storage_cost_rub },
  { label: 'Комиссия WB', value: sku.commission_rub },
  { label: 'Эквайринг', value: sku.acquiring_fee_rub },
  { label: 'Платная приёмка', value: sku.paid_acceptance_cost_rub },
  { label: 'Штрафы', value: sku.penalties_rub },
  { label: 'Программа лояльности', value: sku.loyalty_fee_rub },
  { label: 'Компенсация лояльности', value: -sku.loyalty_compensation_rub }, // negative = reduces costs
  { label: 'Прочие корректировки', value: sku.other_adjustments_rub },
];
```

---

## Data Fix Applied

**Issue**: `total_expenses_rub` in DB contained only logistics (old data before Epic 26).

**Fix applied**: 2025-12-17
- Updated 93 rows in `weekly_margin_fact` for W49
- Recalculated `total_expenses_rub` and `operating_profit_rub` using full formula

**Verification**:
```sql
-- Before fix
total_expenses_rub = 5,999.63  -- only logistics

-- After fix
total_expenses_rub = 7,392.70  -- full formula ✅
```

---

## Related Documentation

- `docs/epics/epic-26-per-sku-operating-profit.md` - Operating profit calculation
- `src/analytics/services/margin-calculation.service.ts:441-449` - Formula implementation
- Request #47: Epic 26 Operating Profit & Expense Tracking

---

## Summary

| Question | Answer |
|----------|--------|
| Полная формула? | `operating_profit = gross_profit - total_expenses` |
| Какие расходы включены? | 9 типов: логистика, хранение, приёмка, штрафы, эквайринг, лояльность, комиссии, прочие |
| Детализация per SKU доступна? | Да, все поля уже в API `/v1/analytics/weekly/by-sku` |
| Рекомендация для frontend? | Использовать `operating_profit_rub` напрямую из API |
