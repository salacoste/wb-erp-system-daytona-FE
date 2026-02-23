# Request #155: НДС (VAT) Integration in Tax Accounting

**Date**: 2026-02-22
**Status**: ✅ Resolved (2026-02-23)
**Priority**: P1
**Related**: Backend Epic 72 (Tax Accounting), Frontend Epic 66-FE
**Requested By**: Frontend Team

---

## Problem

Backend Epic 72 implements income tax calculations (USN 6%, USN 15%, manual rate) but does **not** support НДС (VAT / Налог на добавленную стоимость) as a separate tax component.

For sellers on ОСН (Общая система налогообложения) or sellers with revenue exceeding 60M RUB on УСН, НДС is a separate obligation that applies **on top of** income tax. It directly affects the final net profit calculation.

Current tax system options: `usn6`, `usn15`, `manual` — none of these model НДС correctly because:
1. НДС applies to the **sale price**, not profit
2. НДС is calculated separately from income tax
3. НДС has specific legally-mandated rates (0%, 5%, 20%, 22%)
4. НДС interacts with input VAT (входящий НДС) from COGS — sellers can deduct input VAT

---

## Business Context

### Who Needs НДС

| Scenario | НДС Required | Common Rates |
|----------|-------------|--------------|
| ИП на УСН (revenue < 60M) | No | — |
| ИП на УСН (revenue > 60M, from 2025) | Yes | 5% or 20% |
| ООО на ОСН | Yes | 20% (standard), 0% (export) |
| ИП на ОСН | Yes | 20% |
| Самозанятый | No | — |

### НДС Rates (Russian Tax Code)

| Rate | Usage |
|------|-------|
| 0% | Export sales, certain categories |
| 5% | УСН sellers exceeding revenue threshold (simplified НДС from 2025) |
| 20% | Standard rate (ОСН) |
| 22% | New rate effective 2025 for certain categories |

### Tax Interaction Model

```
Seller Revenue (with НДС)
├── НДС component = Revenue × (VAT_rate / (100 + VAT_rate))
│   └── НДС payable = Output НДС − Input НДС (from COGS)
├── Revenue without НДС = Revenue − НДС component
│   └── Income Tax base (for USN/ОСН calculations)
└── Net Profit = Revenue − All expenses − Income Tax − НДС payable
```

**Critical**: НДС reduces the effective revenue BEFORE income tax calculation. The order matters:
1. Extract НДС from gross revenue
2. Calculate income tax on revenue-without-НДС
3. Net profit = revenue − expenses − income_tax − nds_payable

---

## Proposed Backend Changes

### 1. Cabinet Model Extension

Add VAT fields to Cabinet:

```prisma
model Cabinet {
  // ... existing fields ...
  taxSystem    String?   // existing: 'usn6' | 'usn15' | 'manual' | null
  taxRate      Decimal?  // existing: custom rate
  vatPayer     Boolean   @default(false)     // NEW: is the seller an НДС payer?
  vatRate      Decimal?  // NEW: 0, 5, 20, or 22 (null if vatPayer = false)
}
```

### 2. API Changes

**PUT /v1/cabinets/:id** — extend with VAT fields:
```json
{
  "taxSystem": "usn6",
  "taxRate": null,
  "vatPayer": true,
  "vatRate": 20
}
```

Validation:
- `vatPayer: false` → `vatRate` auto-cleared to null
- `vatPayer: true` → `vatRate` required, must be one of: 0, 5, 20, 22
- `vatPayer: true` AND `taxSystem: null` → allowed (VAT without income tax settings)

### 3. Finance Summary Tax Extension

Extend the `tax` object in `summary_total`:

```typescript
interface TaxMetrics {
  // Existing fields (from Epic 72)
  tax_amount: number | null
  tax_base: number | null
  effective_tax_rate: number | null
  tax_system: string | null
  is_minimum_rule: boolean
  net_profit_after_tax: number | null

  // NEW: VAT fields
  vat_payer: boolean
  vat_rate: number | null           // Applied VAT rate (0, 5, 20, 22)
  vat_output: number | null         // Output НДС (from sales)
  vat_input: number | null          // Input НДС (from COGS, if available)
  vat_payable: number | null        // vat_output - vat_input (what seller owes)
  revenue_excl_vat: number | null   // Revenue minus НДС component
  net_profit_after_all_tax: number | null  // After income tax AND НДС
}
```

### 4. Calculation Logic

```typescript
// Step 1: Extract НДС from gross revenue
const vatOutput = (salesGrossTotal * vatRate) / (100 + vatRate)
const revenueExclVat = salesGrossTotal - vatOutput

// Step 2: Input НДС from COGS (if seller tracks it)
const vatInput = cogsTotal ? (cogsTotal * vatRate) / (100 + vatRate) : 0
const vatPayable = vatOutput - vatInput

// Step 3: Income tax calculation (uses revenue_excl_vat as base for USN6)
// For USN6: tax = revenueExclVat * 0.06
// For USN15: expenses include vatPayable, then standard calculation

// Step 4: Net profit
const netProfitAfterAllTax = payoutTotal - incomeTax - vatPayable
```

---

## Frontend Integration Plan

Once backend implements this, the frontend (Epic 66-FE) would need:

1. **Story 66.3 update**: Add НДС toggle + rate selector to Tax Settings page
2. **Story 66.4 update**: Map new VAT fields from finance-summary
3. **Story 66.5 update**: Show НДС info in TaxCard (separate line or tooltip)
4. **Story 66.6 update**: Net profit card uses `net_profit_after_all_tax`
5. **New story**: НДС breakdown popover showing output/input/payable

**UI mockup for settings**:
```
Система налогообложения
  ○ Не настроена
  ○ УСН 6% (по доходам)
  ○ УСН 15% (по прибыли)
  ○ Пользовательская ставка → [__] %

Плательщик НДС
  [ ] Да, мой кабинет является плательщиком НДС

  [Only when checkbox is checked]
  Ставка НДС
    ○ 0%  (экспорт)
    ○ 5%  (УСН при превышении порога)
    ○ 20% (стандартная)
    ○ 22% (отдельные категории)
```

---

## Impact Assessment

| Area | Impact | Effort |
|------|--------|--------|
| Cabinet model | Add 2 fields | Low |
| Tax calculation service | New VAT logic + interaction with income tax | Medium |
| Finance-summary aggregation | Extend tax object with 6 new fields | Medium |
| Frontend settings | Add toggle + rate selector | Low |
| Frontend dashboard | Update profit displays | Low |
| Migration | Add columns, backfill existing cabinets as vatPayer=false | Low |

**Estimated Backend Effort**: 3-5 SP (extend existing Epic 72 infrastructure)

---

## Questions for Backend Team

1. **Input НДС from COGS**: Do we have enough data to calculate input VAT? COGS are stored as total amounts — do we know if they include VAT?
2. **WB Report НДС column**: Does the Wildberries weekly report include a separate НДС column? If so, we could use actual НДС values instead of calculating.
3. **Rate change handling**: If a seller changes their VAT rate mid-period, should we apply the new rate to all weeks or only going forward?
4. **Quarterly НДС reporting**: НДС is typically reported quarterly in Russia. Should we aggregate quarterly totals for reporting purposes?

---

## Resolution

**Status**: ✅ Resolved

Backend implemented in full (Task-50: НДС/VAT Integration):
- Migration `20260222_task50_vat_integration` — added `vat_payer`, `vat_rate` to cabinets; `vat_output`, `vat_payable`, `revenue_excl_vat`, `net_profit_after_all_tax` to `weekly_payout_total` and `weekly_financial_facts`
- `CabinetResponseDto` — exposes `vatPayer` + `vatRate` (serialized as number)
- `UpdateCabinetDto` — accepts `vatPayer: boolean` + `vatRate: number`
- `TaxMetricsDto` — includes `vat_output`, `vat_payable`, `revenue_excl_vat`, `net_profit_after_all_tax`
- `WeeklyPayoutTotalDto` — VAT fields in both nested `tax` object and top-level
- 119/119 backend tests passing

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | Frontend Team (BMad Master) | Initial request created |
| 2026-02-23 | Frontend Team (Claude) | Verified backend implementation, migrations applied, all tests passing |
