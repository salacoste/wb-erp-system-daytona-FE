# Story 66.6-FE: Net Profit After Tax Display

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 7 SP
**Priority**: P1
**Status**: ✅ Complete
**Dependencies**: Story 66.4-FE (finance summary tax integration)

---

## Description

Create new "Чистая прибыль" card showing net profit after ALL taxes (income tax + НДС). Calculate after-tax margin. Show P&L waterfall breakdown with tax as a line item. Handle both VAT and non-VAT scenarios with appropriate final metric.

---

## Acceptance Criteria

### AC1: NetProfitCard Component
- [ ] New `NetProfitCard.tsx` created
- [ ] Primary metric: final net profit as currency (₽)
- [ ] Uses `net_profit_after_all_tax` when НДС configured
- [ ] Uses `net_profit_after_tax` when only income tax configured
- [ ] Fallback to `payout_total` when no tax configured, with "(до налога)" suffix

### AC2: After-Tax Margin
- [ ] Calculate: `(net_profit / revenue) × 100`
- [ ] Revenue = `revenue_excl_vat` when НДС configured, else `sale_gross_total`
- [ ] Show as secondary metric with % sign
- [ ] Color-coded: green (>10%), yellow (0-10%), red (<0%)

### AC3: Period Comparison
- [ ] Compare net profit with previous period
- [ ] Delta badge (inverted: lower profit = red)
- [ ] Previous period = null → no badge

### AC4: P&L Waterfall (Profit Breakdown)
- [ ] Update `ProfitBreakdownPopover` with full P&L chain:
  ```
  Выручка (brutto)        +1,450,000 ₽
  − НДС от продаж           −241,667 ₽  (only when vatPayer)
  = Выручка без НДС        1,208,333 ₽  (only when vatPayer)
  − Себестоимость (COGS)     −500,000 ₽
  = Валовая прибыль           708,333 ₽
  − Расходы WB               −350,000 ₽
  = Операционная прибыль      358,333 ₽
  − Налог на доход             −72,500 ₽
  − НДС к уплате              −41,667 ₽  (only when vatPayer)
  = Чистая прибыль            244,166 ₽
  ```
- [ ] Rows with zero/null values hidden
- [ ] НДС rows only shown when `vat_payer === true`

### AC5: Card Integration
- [ ] Added to `DashboardMetricsGrid`
- [ ] Position: after TaxCard
- [ ] Responsive grid layout (same pattern as existing cards)

---

## Technical Implementation

### Files to Create
- `src/components/custom/dashboard/NetProfitCard.tsx`

### Files to Modify
- `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — Add NetProfitCard
- `src/components/custom/dashboard/ProfitBreakdownPopover.tsx` — Add tax + НДС rows

### Logic for Choosing Final Profit Metric

```typescript
function getNetProfit(tax: TaxMetrics | null, payoutTotal: number): {
  value: number
  label: string
  isPreTax: boolean
} {
  if (!tax) {
    return { value: payoutTotal, label: 'К перечислению', isPreTax: true }
  }
  if (tax.vat_payer && tax.net_profit_after_all_tax != null) {
    return { value: tax.net_profit_after_all_tax, label: 'Чистая прибыль', isPreTax: false }
  }
  if (tax.net_profit_after_tax != null) {
    return { value: tax.net_profit_after_tax, label: 'Чистая прибыль', isPreTax: false }
  }
  return { value: payoutTotal, label: 'К перечислению', isPreTax: true }
}
```

---

## Testing

- [ ] Shows net_profit_after_all_tax when НДС configured
- [ ] Shows net_profit_after_tax when only income tax
- [ ] Falls back to payout_total with "(до налога)" suffix
- [ ] P&L waterfall shows correct rows for each scenario
- [ ] After-tax margin calculated correctly
- [ ] Period comparison delta renders

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation |
| 2026-02-23 | Claude | Added VAT-aware profit selection, НДС rows in P&L waterfall, +2 SP (5→7) |
