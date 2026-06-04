# 204 — SKU cashflow net profit "omits WB-services" — RESOLVED: NOT A DEFECT (false alarm)

**Status**: RESOLVED / WITHDRAWN (iter-145) — DEFECT 1 was a false alarm; net profit is correct. No backend change needed.
**Severity**: ~~HIGH~~ → none (DEFECT 1 dismissed). DEFECT 2 below is a minor display-reconciliation note only.
**Found**: iter-141 audit of `/analytics/sku` "Полный Cashflow"; **re-verified against backend SQL in iter-145**.

## ⚠️ RESOLUTION (iter-145): DEFECT 1 is NOT a defect — do NOT "fold wb_services into total"

The original claim (net profit overstated because `total` omits `wb_services_cost`) is **WRONG**. Verified against `cabinet-expenses.service.ts`:
- Line 79: `other_adjustments = SUM(ABS(corrections) + ABS(other_adjustments))` — the `other_adjustments` field **includes `ABS(corrections)`**.
- Lines 178-193: `wb_services_cost = SUM(ABS(corrections))` for `reason='Удержание'` WB-services rows — the **same `corrections`**.
- Therefore **`wb_services_cost ⊂ other_adjustments`**, and `total = storage + other_adjustments + …` (line 250) **already includes WB-services**. `netProfit = gross_profit_sku − total` is **correct** — no overstatement.

The iter-141 audit was misled by `total` not *literally listing* `wb_services_cost` as a separate term; it's a SUBSET of the `other_adjustments` term (both derive from `corrections`). The dashboard (iter-144) has the identical `wb_services_cost ⊂ other_adjustments_net` relationship — it merely *displays* promotion/jam as separate lines (subtracting them from an "other-adjustments-remaining" line to avoid double-DISPLAY). The sku-cashflow lumps them into the `other_adjustments` line — a **display-granularity** difference, NOT a correctness bug. **Folding `wb_services_cost` into `total` would DOUBLE-COUNT it.**

(Optional FE polish, not required: break promotion/jam out as their own lines in the sku-cashflow grid for parity with the dashboard, subtracting them from the displayed other-adjustments line — purely cosmetic, no net-profit change.)

## ~~Problem (DEFECT 1)~~ — withdrawn (see RESOLUTION above)

~~The "Полный Cashflow" card's ЧИСТАЯ ПРИБЫЛЬ and ИТОГО exclude WB-services…~~ — incorrect; WB-services are included via `other_adjustments`.

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
