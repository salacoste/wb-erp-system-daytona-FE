# Dashboard WB deductions naming validation — 2026-06-19

## Decision

Dashboard commission copy now uses the canonical finance-summary label `Комиссия WB (из оборота)` and keeps the existing formula unchanged.

## Verified W24 semantics

For week `2026-W24`, the dashboard commission card remains:

```text
73 196,83 (Номинальная комиссия)
+ 18 182,01 (Эквайринг)
+      0,00 (Корректировка ВВ)
+      0,00 (Комиссия лояльности)
+    226,60 (Штрафы)
= 91 605,44 ₽
```

`wb_commission_adj` is labeled `Корректировка ВВ`, matching backend semantics for `commission_other` with `reason='Удержание'`. It is not treated as confirmed `Скидка МП`; reserve `Скидка МП` for a future product-backed story that wires a verified marketplace-discount field.

## Boundary

`wb_services_cost_total = 47 220 ₽` is intentionally outside the commission card total. Dashboard services are shown under the canonical taxonomy `Прочие удержания (WB сервисы)`, with WB promotion displayed separately in the advertising/promotion surface to avoid double-counting.

The commission card and popover prop surfaces do not accept `wbServicesCost`; this keeps the no-double-counting boundary structural rather than convention-based. The dashboard-path regression test locks the W24-style commission total while services render separately.

## Canonical vocabulary source

Keep dashboard labels aligned with:

- `src/components/custom/financial-summary/metric-explanations.ts`
- `src/components/custom/financial-summary/ExpenseTableRows.tsx`
