# 204 — SKU cashflow net profit OVERSTATED: omits WB-services (Продвижение/Джем)

**Status**: PENDING — needs product/backend decision on the cashflow profit-completeness model
**Severity**: HIGH (net-profit headline overstated; can flip a loss to a green profit on ad-active cabinets)
**Found**: iter-141 audit of `/analytics/sku` "Полный Cashflow" card, verified against backend source.
**Endpoint**: the cabinet-level-expenses source feeding `CabinetLevelExpenses` (cabinet-expenses.service.ts)

## Problem (DEFECT 1)

The "Полный Cashflow" card's **ЧИСТАЯ ПРИБЫЛЬ** and **ИТОГО общекабинетные расходы** exclude WB-services deductions (WB.Продвижение + Джем + прочие сервисы WB), so net profit is **overstated** by that amount — often the single largest deduction for advertising-active sellers.

### Verified against backend source

- `cabinet-expenses.service.ts:250` — `total = storage + other_adjustments + wb_commission_adj + penalties + paid_acceptance + logistics` — **6 lines, excludes `wb_services_cost`**.
- `wb_services_cost` / `wb_promotion_cost` / `wb_jam_cost` are returned **separately** (DTO), computed from a separate `reason='Удержание'` query (service lines ~160-193) — so they are **NOT inside `to_pay_goods`**.
- `gross_profit_sku = to_pay_goods − cogs_total` (line 269) — therefore also excludes WB-services.
- FE `netProfit = gross_profit_sku − total` (`SkuCashflowSection.tsx:60`) → **excludes WB-services twice over**.
- The FE type `CabinetLevelExpenses` (`margin-analytics-query-keys.ts`) **does not even include `wb_services_cost`** — the FE cannot display it today.

### Concrete wrong-output
`gross_profit_sku = 200 000`, `total = 50 000`, `wb_services_cost = 40 000` (promotion):
- Card shows **ЧИСТАЯ ПРИБЫЛЬ = 150 000 ₽ (green)**.
- True payout-level profit = **110 000 ₽**. A 36% overstatement; a loss-making cabinet can render green.

### Inconsistency
The dashboard expense breakdown (`useExpenses-utils.ts`) **does** include WB.Продвижение/Джем lines — so the SKU-cashflow card and the dashboard disagree on what "expenses / net profit" means. The omission is an oversight, not an intentional model.

## DEFECT 2 (MEDIUM, related reconciliation)

The waterfall shows Эквайринг as a standalone deduction row, but acquiring is **already inside** `to_pay_goods` (FE type comment: "already included in net_for_pay deduction"; backend DTO: "Already deducted from revenue_net"). Since `gross_profit_sku` is sourced from `to_pay_goods` (not recomputed from the visible rows), the displayed rows (gross − commission − acquiring − cogs) do **not** arithmetically sum to the bold "Валовая прибыль по SKU". Decorative-subtraction rows that don't reconcile mislead manual reconciliation.

## Requested decision

1. **Does "ЧИСТАЯ ПРИБЫЛЬ" on this card include WB promotion/jam spend?** (Almost certainly yes — it's a real payout deduction, and it matches the dashboard model.) If yes:
   - **Option A (backend)**: fold `wb_services_cost` into `cabinet-expenses.total`.
   - **Option B (FE)**: add `wb_services_cost` to the `CabinetLevelExpenses` type + the `CashflowExpenseGrid` rows + recompute the displayed ИТОГО/netProfit from the sum of all rendered rows (so grid↔total↔net are provably consistent). Confirmed safe (no double-count): WB-services are NOT in `to_pay_goods`.
2. For DEFECT 2: either drive the waterfall arithmetically from the same `to_pay_goods` the subtotal uses, or label commission/acquiring as "(справочно, уже в net)" visibility rows rather than deductions.

## Why FE didn't fix unilaterally

Changing a financial net-profit headline + the `total` semantics is a model-level decision with double-count risk across the backend contract and the dashboard model — it needs product/backend confirmation, not a unilateral FE flip. (DEFECT 4 — fabricated % on a no-sales period — and DEFECT 3 — dot-locale percents — are FE-only and handled separately; DEFECT 4 fixed in iter-141.)
