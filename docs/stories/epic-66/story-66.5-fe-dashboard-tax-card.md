# Story 66.5-FE: Dashboard Tax Card (Backend Data)

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 6 SP
**Priority**: P0
**Status**: ✅ Complete
**Dependencies**: Story 66.4-FE (finance summary tax integration)

---

## Description

Refactor existing `TaxCard` component to consume backend-calculated tax data instead of local calculations. Remove local `calculateTax()` calls. Display backend tax + VAT metrics. Remove tax system dropdown (now in `/settings/tax`).

---

## Acceptance Criteria

### AC1: New Props Interface
- [ ] Accept `TaxMetrics | null` instead of raw financial data
- [ ] Accept `previousTaxMetrics: TaxMetrics | null` for comparison
- [ ] Accept `isLoading: boolean`
- [ ] Remove all expense-related props (logistics, storage, etc.)
- [ ] Remove `onTaxSystemChange` callback

### AC2: Tax Display (When Configured)
- [ ] Show `tax_amount` as currency (₽)
- [ ] Show `effective_tax_rate` as percentage
- [ ] Show `tax_system` label (УСН 6%, УСН 15%, Пользовательская)
- [ ] Show tax as % of revenue: `(tax_amount / tax_base) × 100` for USN6/manual

### AC3: Minimum Rule Badge
- [ ] When `is_minimum_rule === true` → show badge "Мин. 1%"
- [ ] Tooltip: "Применено правило минимального налога 1% от выручки (УСН 15%)"

### AC4: НДС Indicator
- [ ] When `vat_payer === true` → show badge "НДС {vat_rate}%"
- [ ] Tooltip with НДС details:
  - НДС от продаж: `vat_output` (₽)
  - НДС к уплате: `vat_payable` (₽)
  - Выручка без НДС: `revenue_excl_vat` (₽)

### AC5: Not Configured State
- [ ] When `tax === null` → show "Настройте систему"
- [ ] CTA link to `/settings/tax`
- [ ] Muted styling for unconfigured state

### AC6: Period Comparison
- [ ] Compare `tax_amount` with `previousTaxMetrics.tax_amount`
- [ ] Inverted badge: higher tax = red, lower tax = green
- [ ] When previous is null → no comparison badge

### AC7: Remove Local Calculations
- [ ] No imports from `tax-calculations.ts`
- [ ] No local `calculateTax()` calls
- [ ] Add deprecation comment to `tax-calculations.ts`

---

## Technical Implementation

### Files to Modify
- `src/components/custom/dashboard/TaxCard.tsx` — Full refactor
- `src/components/custom/dashboard/DashboardMetricsGrid.tsx` — Pass tax data
- `src/lib/tax-calculations.ts` — Add @deprecated JSDoc

### Current → New Props Mapping

```typescript
// BEFORE (Epic 65)
interface TaxCardProps {
  taxSystem: TaxSystem | null
  saleGrossTotal: number | null
  previousTaxAmount: number | null
  logistics, storage, acceptance, penalties, other_adj, cogs, advertising
  manualTaxAmount?: number
  onTaxSystemChange?: (system: TaxSystem) => void
}

// AFTER (Epic 66)
interface TaxCardProps {
  taxMetrics: TaxMetrics | null
  previousTaxMetrics: TaxMetrics | null
  isLoading: boolean
}
```

---

## Testing

- [ ] TaxCard renders backend tax data correctly
- [ ] Minimum rule badge shows/hides appropriately
- [ ] НДС badge shows when vat_payer = true
- [ ] Not-configured state shows CTA
- [ ] Period comparison works (inverted)
- [ ] No references to local calculateTax()

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation |
| 2026-02-23 | Claude | Added НДС badge + tooltip (AC4), +1 SP (5→6) |
