# Story 66.1-FE: Types & API Layer (Tax + VAT)

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 4 SP
**Priority**: P0
**Status**: ✅ Complete
**Dependencies**: None (foundation story)

---

## Description

Create TypeScript types for tax settings, VAT settings, and tax metrics. Update `Cabinet` interface with tax/VAT fields. Create `TaxMetrics` interface for finance-summary tax data. Create cabinet API module for reading and updating tax settings.

---

## Acceptance Criteria

### AC1: Tax System Types
- [ ] `TaxSystem` type: `'usn6' | 'usn15' | 'manual'`
- [ ] `TAX_SYSTEM_LABELS` constant with Russian labels
- [ ] `TAX_SYSTEM_OPTIONS` array for form selectors

### AC2: VAT Types
- [ ] `VAT_RATES` constant: `[0, 5, 20, 22] as const`
- [ ] `VatRate` type derived from `VAT_RATES`
- [ ] `VAT_RATE_LABELS` constant with Russian descriptions

### AC3: Cabinet Interface Updated
- [ ] `taxSystem: TaxSystem | null` field added
- [ ] `taxRate: number | null` field added
- [ ] `vatPayer: boolean` field added (default: false)
- [ ] `vatRate: number | null` field added

### AC4: TaxMetrics Interface
- [ ] All income tax fields: `tax_amount`, `tax_base`, `effective_tax_rate`, `tax_system`, `is_minimum_rule`, `net_profit_after_tax`
- [ ] All VAT fields: `vat_payer`, `vat_rate`, `vat_output`, `vat_payable`, `revenue_excl_vat`, `net_profit_after_all_tax`
- [ ] All nullable number fields typed as `number | null`
- [ ] `is_minimum_rule` typed as `boolean`

### AC5: FinanceSummary Type Updated
- [ ] `tax?: TaxMetrics | null` field added to `FinanceSummary` interface

### AC6: Cabinet API Module
- [ ] `src/lib/api/cabinet.ts` created
- [ ] `getCabinetTaxSettings(cabinetId: string)` → returns Cabinet
- [ ] `updateCabinetTaxSettings(cabinetId: string, data: UpdateCabinetTaxRequest)` → returns Cabinet
- [ ] Uses existing `apiClient` with auto-auth

### AC7: Request/Response Types
- [ ] `UpdateCabinetTaxRequest` interface with JSDoc:
  ```typescript
  {
    taxSystem?: TaxSystem | null
    taxRate?: number | null
    vatPayer?: boolean
    vatRate?: number | null
  }
  ```

---

## Technical Implementation

### Files to Create
- `src/lib/api/cabinet.ts` — API functions

### Files to Modify
- `src/types/cabinet.ts` — Add TaxSystem, VAT types, update Cabinet interface
- `src/types/finance-summary.ts` — Add TaxMetrics, update FinanceSummary

### API Endpoints Used
- `GET /v1/cabinets/:id` → read tax + VAT settings
- `PUT /v1/cabinets/:id` → update tax + VAT settings

### Backend Validation Rules (for frontend awareness)
- `taxSystem: 'manual'` → `taxRate` required (0-100)
- `taxSystem: 'usn6' | 'usn15'` → `taxRate` auto-cleared to null
- `vatPayer: true` → `vatRate` required (0, 5, 20, 22)
- `vatPayer: false` → `vatRate` auto-cleared to null

---

## Testing

- [ ] Types compile with `npm run type-check` (0 errors)
- [ ] API functions return correct response shape
- [ ] Constants match backend enum values

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation |
| 2026-02-23 | Claude | Added VAT types (vatPayer, vatRate, VAT_RATES), TaxMetrics VAT fields, +1 SP |
