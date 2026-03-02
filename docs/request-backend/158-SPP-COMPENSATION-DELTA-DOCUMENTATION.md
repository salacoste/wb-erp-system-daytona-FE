# #158 — SPP Compensation Delta: to_pay_goods vs (sale_gross − total_commission_rub)

**Type**: Documentation (NOT a bug)
**Priority**: Low (informational)
**Date**: 2026-02-28
**Status**: Resolved — fully explained

---

## Summary

During dashboard validation for W08, a 9 652,33 ₽ delta was discovered between two ways of calculating "К перечислению за товар":

```
Method 1: sale_gross − total_commission_rub = 119 638,80 ₽  (SUM of gross)
Method 2: to_pay_goods (from API)           = 129 291,13 ₽  (SUM of net_for_pay)
Delta:                                        9 652,33 ₽
```

This is **NOT a bug**. The delta comes from WB's SPP (скидка постоянного покупателя) compensation mechanism.

---

## Root Cause

### WB Raw Transaction Fields

Each row in `wb_finance_raw` has two different "seller revenue" values:

| WB API Field | DB Column | Backend Aggregation | Meaning |
|---|---|---|---|
| `retail_amount` | `gross` | `total_commission_rub = retail_price_with_discount − gross` | Product value after SPP discount |
| `ppvz_for_pay` | `net_for_pay` | `to_pay_goods = SUM(net_for_pay)` | **Actual amount WB pays** seller |

### Why net_for_pay > gross

WB partially compensates sellers for SPP discounts. For loyal buyers (SPP ~46%), WB:
1. Shows buyer the discounted price
2. Pays the seller MORE than the post-SPP price
3. Absorbs part of the SPP discount as a marketplace cost

Example from W08 data:
```
Product: Protape Изоленты (nm_id 412096139)
retail_price_with_discount: 387,00 ₽
spp_discount_percent:       45,99%
gross (retail_amount):      209,00 ₽  ← after SPP
net_for_pay (ppvz_for_pay): 288,30 ₽  ← what seller gets
SPP compensation:            79,30 ₽  ← WB subsidizes this
```

### Aggregation Math

```sql
-- From weekly-payout-aggregator.service.ts:

-- total_commission_rub = SUM(retail_price_with_discount - gross) [sales - returns]
--   = 69 675,21 ₽

-- sale_gross = SUM(retail_price_with_discount) [sales - returns]
--   = 189 314,01 ₽

-- to_pay_goods = SUM(net_for_pay) [sales - returns]
--   = 129 291,13 ₽

-- Therefore:
-- sale_gross - total_commission_rub = SUM(gross) = 119 638,80 ₽
-- to_pay_goods = SUM(net_for_pay)               = 129 291,13 ₽
-- Delta = SUM(net_for_pay - gross)               =   9 652,33 ₽
```

---

## Breakdown by Report Type

| Report Type | Delta (net_for_pay − gross) | Transactions | Notes |
|---|---|---|---|
| Основной | +11 063,34 ₽ | 251 | WB compensates SPP → seller gets more |
| По выкупам | −1 411,01 ₽ | 15 | Buyouts: WB deducts extra → seller gets less |
| **Total** | **+9 652,33 ₽** | 266 | Net positive for seller |

---

## Impact on Frontend

### P&L Page ("Итого удержания WB")

The P&L page shows `"Итого удержания WB" = sale_gross − payout_total = 113 364 ₽`.

Individual deduction lines sum to 123 016 ₽. The 9 652 ₽ difference is this SPP compensation — it reduces effective deductions because WB pays more than `gross`.

**No frontend changes needed.** The P&L correctly shows the actual total deduction as `sale_gross − payout_total`, not as a sum of lines. This is documented in `PnLWaterfall.tsx` comments.

### Dashboard Cards

All dashboard cards use the correct API fields and display accurate values. No double-counting.

---

## Verification SQL

```sql
-- Run against wb_finance_raw to verify for any week:
SELECT report_type,
  ROUND(SUM(CASE WHEN doc_type='sale' THEN (net_for_pay - gross)::numeric
                 WHEN doc_type='return' THEN -(net_for_pay - gross)::numeric
                 ELSE 0 END), 2) as spp_compensation_delta,
  COUNT(CASE WHEN doc_type IN ('sale','return') THEN 1 END) as transactions
FROM wb_finance_raw
WHERE cabinet_id = :cabinet_id
  AND sale_dt >= :week_start AND sale_dt < :week_end
GROUP BY report_type;
```

---

## Related Fields in WeeklyPayoutSummary

| Field | W08 Value | Notes |
|---|---|---|
| `transport_reimbursement_neutral` | 3 408,10 ₽ | Tracked but not displayed separately in P&L |
| `seller_delivery_revenue` | 0,00 ₽ | Would contribute to delta if present |
| `corrections_amount` | 22 137,00 ₽ | WB.Продвижение (mapped to `other_adjustments_net`) |

---

## Recommendation

**No code changes required.** This document serves as reference for:
1. QA team — understanding why P&L "Итого" ≠ sum of lines
2. Support team — explaining SPP compensation to sellers
3. Future developers — understanding `gross` vs `net_for_pay` semantics

Consider adding a tooltip on the P&L "Итого удержания WB" explaining:
> "Итого удержания WB рассчитывается как разница между реализацией и выплатой (sale_gross − payout_total). Отличается от суммы отдельных строк на величину компенсации СПП."

---

## Cross-References

- `docs/DASHBOARD-ANALYTICS-VALIDATION-W08.md` — Full validation report
- `docs/DATA-SOURCES-REFERENCE.md` — Data source documentation
- `src/aggregation/weekly-payout-aggregator.service.ts:328-385` — Aggregation formulas
- `docs/request-backend/43-wb-dashboard-data-discrepancy.md` — Original WB dashboard alignment
- `docs/request-backend/57-wb-dashboard-exact-match-fields.md` — Field mapping reference
