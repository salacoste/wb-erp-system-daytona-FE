# Story 66.4-FE: Finance Summary Tax Integration

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 4 SP
**Priority**: P0
**Status**: ✅ Complete
**Dependencies**: Story 66.1-FE (types)

---

## Description

Update finance-summary data pipeline to preserve and pass through backend tax metrics (including VAT fields). Add aggregation function for multi-week tax data. Ensure tax is ONLY extracted from `summary_total.tax`.

---

## Acceptance Criteria

### AC1: Tax Data Pass-Through
- [ ] `tax` field from `summary_total` is preserved in hook response
- [ ] `summary_rus.tax` and `summary_eaeu.tax` are ALWAYS ignored (null)
- [ ] Tax data accessible via `financeSummary.tax`

### AC2: Multi-Week Tax Aggregation
- [ ] `aggregateTaxMetrics(weeks: TaxMetrics[])` function created
- [ ] Income tax fields aggregated:
  - `tax_amount` — SUM across weeks
  - `tax_base` — SUM across weeks
  - `effective_tax_rate` — from first week (rate doesn't change mid-period)
  - `tax_system` — from first week
  - `is_minimum_rule` — TRUE if ANY week has minimum rule
  - `net_profit_after_tax` — SUM across weeks
- [ ] VAT fields aggregated:
  - `vat_output` — SUM across weeks
  - `vat_payable` — SUM across weeks
  - `revenue_excl_vat` — SUM across weeks
  - `net_profit_after_all_tax` — SUM across weeks
  - `vat_payer` — from first week
  - `vat_rate` — from first week

### AC3: Integration with Aggregation Pipeline
- [ ] `aggregateFinanceSummaries()` in `hooks-v1/financial/aggregation.ts` updated
- [ ] Tax aggregation called when multiple weeks have tax data
- [ ] Weeks with `tax === null` excluded from tax aggregation
- [ ] If ALL weeks have `tax === null` → aggregated tax is null

### AC4: Single Week Pass-Through
- [ ] Single-week requests pass tax object as-is (no aggregation)

---

## Technical Implementation

### Files to Modify
- `src/hooks-v1/financial/aggregation.ts` — Add tax aggregation logic

### Aggregation Rules

```typescript
function aggregateTaxMetrics(taxMetrics: TaxMetrics[]): TaxMetrics {
  const first = taxMetrics[0]
  return {
    tax_amount: sum(taxMetrics, 'tax_amount'),
    tax_base: sum(taxMetrics, 'tax_base'),
    effective_tax_rate: first.effective_tax_rate,
    tax_system: first.tax_system,
    is_minimum_rule: taxMetrics.some(t => t.is_minimum_rule),
    net_profit_after_tax: sum(taxMetrics, 'net_profit_after_tax'),
    vat_payer: first.vat_payer,
    vat_rate: first.vat_rate,
    vat_output: sum(taxMetrics, 'vat_output'),
    vat_payable: sum(taxMetrics, 'vat_payable'),
    revenue_excl_vat: sum(taxMetrics, 'revenue_excl_vat'),
    net_profit_after_all_tax: sum(taxMetrics, 'net_profit_after_all_tax'),
  }
}
```

---

## Testing

- [ ] Single week: tax passes through unchanged
- [ ] Multi-week: numeric fields summed correctly
- [ ] Multi-week: rate/system from first week
- [ ] Multi-week: is_minimum_rule = true if any week has it
- [ ] All weeks null → aggregated tax is null
- [ ] Mixed weeks (some null, some data) → only non-null weeks aggregated

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation (income tax only) |
| 2026-02-23 | Claude | Added VAT field aggregation, +1 SP (3→4) |
