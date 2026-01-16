# Request #49: Payout Total Formula Bug - Wrong Base Value

**Date**: 2025-12-07
**Priority**: Critical
**Status**: ✅ Resolved
**Epic**: Core Financial Calculations

## Problem

The `payout_total` calculation uses wrong base value, causing massive discrepancy with WB Dashboard.

### Example: W42 (Oct 13-19, 2025) - Основной отчёт

| Metric | WB Dashboard | Our DB | Difference |
|--------|-------------|--------|------------|
| ИТОГО К ОПЛАТЕ | 132,555.53₽ | 272,229.53₽ | **-139,674₽** |

## Root Cause Analysis

### WB Dashboard Formula (CORRECT)
```
payout_total = to_pay_goods - logistics - storage - other_adjustments
             = 268,943.77 - 45,381.57 - 2,589.67 - 88,417
             = 132,555.53₽ ✅
```

### Our Current Formula (WRONG)
```typescript
// src/aggregation/formulas/payout-total.formula.ts:61-71
payout_total = saleGross - totalCommissionRub - logisticsCost - storageCost - otherAdjustmentsNet

// With W42 data:
= 262,140.56 - 101,837.60 - 44,839.91 - 2,589.67 - 88,417
= 24,456.38₽ ❌ (doesn't even match DB!)
```

### Key Insight

**`to_pay_goods` ≠ `saleGross - totalCommissionRub`**

- `to_pay_goods` = 268,943.77₽ (sum of `net_for_pay` from raw data)
- `saleGross - totalCommissionRub` = 262,140.56 - 101,837.60 = 160,302.96₽

These are completely different values because:
- `to_pay_goods` is WB's calculated payout per transaction (includes various adjustments)
- `saleGross - totalCommissionRub` is our derived calculation from retail prices

## Data Verification (W42 Основной)

All these fields match WB Dashboard exactly:
- ✅ Продажа (saleGross): 262,140.56₽
- ✅ К перечислению за товар (toPayGoods): 268,943.77₽
- ✅ Стоимость хранения: 2,589.67₽
- ✅ Прочие удержания: 88,417₽
- ⚠️ Логистика: 44,839.91₽ vs WB 45,381.57₽ (diff +541.66₽, separate issue)

## Fix Required

### Update Formula

```typescript
// src/aggregation/formulas/payout-total.formula.ts
// Updated 2025-12-12 with Request #51 (wbCommissionAdj)

export function calculatePayoutTotal(input: PayoutTotalInput): number {
  // WB Dashboard formula: ИТОГО = К перечислению за товар - все удержания
  return (
    input.toPayGoods -          // Base: К перечислению за товар (net_for_pay based)
    input.logisticsCost -       // Логистика
    input.storageCost -         // Хранение
    input.paidAcceptanceCost -  // Платная приёмка
    input.penaltiesTotal -      // Штрафы
    input.otherAdjustmentsNet - // Прочие удержания
    input.wbCommissionAdj       // Request #51: Корректировка ВВ
  );
}
```

> **Note**: See Request #51 for the additional `wbCommissionAdj` fix.

### Recalculate Historical Data

After formula fix, need to recalculate all `WeeklyPayoutSummary` and `WeeklyPayoutTotal` records.

## Files to Update

1. `src/aggregation/formulas/payout-total.formula.ts` - Fix formula
2. `src/aggregation/formulas/payout-total.formula.spec.ts` - Update tests
3. `docs/WB-DASHBOARD-METRICS.md` - Update documentation
4. `CLAUDE.md` - Update formula documentation

## Verification Query

After fix, verify with:
```sql
SELECT
  week,
  report_type,
  to_pay_goods - logistics_cost - storage_cost - paid_acceptance_cost - penalties_total - other_adjustments_net AS calculated_payout,
  payout_total AS stored_payout
FROM weekly_payout_summary
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
ORDER BY week DESC;
```

## Related Issues

- Request #43: WB Dashboard Data Discrepancy (partial fix, wrong approach)
- Logistics discrepancy (+689.17₽) - separate issue, lower priority

## Acceptance Criteria

- [x] `payout_total` matches WB Dashboard within 0.1% for all weeks
- [x] Formula uses `toPayGoods` as base value
- [x] All historical data recalculated
- [x] Unit tests updated and passing
- [x] Documentation updated

## Follow-up: Request #51

Request #51 added `wbCommissionAdj` to the formula for 100% WB Dashboard match.
See: `frontend/docs/request-backend/51-wb-commission-adj-payout.md`
