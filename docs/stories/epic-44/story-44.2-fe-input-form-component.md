# Story 44.2: Input Form Component for Price Calculator

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Draft
**Priority**: P0 - CRITICAL
**Effort**: 3 SP
**Depends On**: Story 44.1 ✅

---

## User Story

**As a** Seller,
**I want** an intuitive form to input all cost parameters,
**So that** I can calculate the recommended price for my product.

**Non-goals**:
- Results display (separate story)
- Page layout (separate story)

---

## Acceptance Criteria

### AC1: Required Input Fields
- [ ] Input field for Target Margin % (0-100, default 20)
- [ ] Input field for COGS in ₽ (≥0, required)
- [ ] Input field for Logistics Forward in ₽ (≥0, required)
- [ ] Input field for Logistics Reverse in ₽ (≥0, required)
- [ ] Input field for Buyback % (0-100, default 98)
- [ ] Input field for Advertising % (0-100, default 5)
- [ ] Input field for Storage in ₽ (≥0, default 0)

### AC2: Advanced Options Section (Collapsible)
- [ ] Collapsible section with VAT % (select: 0, 10, 20; default 20)
- [ ] Input field for Acquiring % (0-100, default 1.8)
- [ ] Input field for Commission % (0-100, default 10)
- [ ] Override options: manual Commission % OR Product ID (nm_id)

### AC3: Form Validation
- [ ] Client-side validation before API call
- [ ] Error messages for invalid inputs (negative values, out of range)
- [ ] Visual indication of required vs optional fields

### AC4: UX Enhancements
- [ ] Slider for Target Margin % with synced number input
- [ ] Slider for Buyback % with synced number input
- [ ] Slider for Advertising % with synced number input
- [ ] Helper tooltips explaining each field
- [ ] Currency formatting (₽) for money fields

### AC5: Form Actions
- [ ] "Calculate" button (primary, disabled when form invalid)
- [ ] "Reset" button (secondary, clears all fields to defaults)
- [ ] Keyboard support (Enter to calculate)

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend API**: `docs/request-backend/95-epic-43-price-calculator-api.md`
- **Story 44.1**: `docs/stories/epic-44/story-44.1-fe-types-api-client.md`

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorForm.tsx        # Main form component
            ├── MarginSlider.tsx               # Reusable slider + input combo
            ├── CurrencyInput.tsx              # Reusable ₽ input (or use existing)
            └── FieldTooltip.tsx               # Helper tooltip component
```

### Component Structure

```typescript
// src/components/custom/price-calculator/PriceCalculatorForm.tsx
interface PriceCalculatorFormProps {
  onSubmit: (data: PriceCalculatorRequest) => void;
  loading?: boolean;
  disabled?: boolean;
}

interface FormData {
  target_margin_pct: number;
  cogs_rub: number;
  logistics_forward_rub: number;
  logistics_reverse_rub: number;
  buyback_pct: number;
  advertising_pct: number;
  storage_rub: number;
  vat_pct: number;
  acquiring_pct: number;
  commission_pct: number;
  override_mode: 'none' | 'commission' | 'nm_id';
  override_commission_pct?: number;
  override_nm_id?: string;
}
```

### Field Tooltip Content

| Field | Tooltip Text |
|-------|--------------|
| Target Margin % | Desired profit margin as percentage of final price |
| COGS | Cost of goods sold - what you paid to produce/acquire the product |
| Logistics Forward | Shipping cost to WB warehouse (per unit) |
| Logistics Reverse | Return shipping cost (average, adjusted by buyback rate) |
| Buyback % | Percentage of products sold (not returned). Higher = lower effective return cost |
| Advertising | Planned ad spend as percentage of price |
| Storage | Warehousing cost per unit (may be 0 for fast-moving items) |
| VAT | Value Added Tax rate (0%, 10%, or 20% depending on product) |
| Acquiring | Payment processing fee (usually 1.8%) |
| Commission | WB commission rate (can be overridden or looked up by product ID) |

### Validation Rules

```typescript
const validation = {
  target_margin_pct: { min: 0, max: 100, required: true },
  cogs_rub: { min: 0, required: true },
  logistics_forward_rub: { min: 0, required: true },
  logistics_reverse_rub: { min: 0, required: true },
  buyback_pct: { min: 0, max: 100, required: true },
  advertising_pct: { min: 0, max: 100, required: true },
  storage_rub: { min: 0, required: false, default: 0 },
  vat_pct: { options: [0, 10, 20], default: 20 },
  acquiring_pct: { min: 0, max: 100, default: 1.8 },
  commission_pct: { min: 0, max: 100, default: 10 },
};
```

### Invariants & Edge Cases
- **Invariant**: All required fields must have valid values before submit
- **Edge case**: Total percentage rate ≥ 100% - show warning (backend will reject)
- **Edge case**: Commission override - only one mode (commission OR nm_id) at a time

---

## Observability

- **Logs**: Form validation errors
- **Analytics**: Track "Calculate" button clicks

---

## Security

- **Input Sanitization**: All number inputs parsed as float, validated
- **XSS**: No user-generated HTML in tooltips

---

## Accessibility (WCAG 2.1 AA)

- [ ] All inputs have associated labels
- [ ] Error messages announced to screen readers
- [ ] Form navigable via keyboard
- [ ] Color contrast ≥ 4.5:1
- [ ] Touch targets ≥ 44×44px

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | CREATE | Main form component |
| `src/components/custom/price-calculator/MarginSlider.tsx` | CREATE | Slider + input combo |
| `src/components/custom/price-calculator/FieldTooltip.tsx` | CREATE | Helper tooltips |

### Change Log
1. Created input form component for Price Calculator

---

## QA Results

**Reviewer**: TBD
**Date**: TBD
**Gate Decision**: ⏳ PENDING

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Required inputs | ⏳ |  |
| AC2 | Advanced options | ⏳ |  |
| AC3 | Form validation | ⏳ |  |
| AC4 | UX enhancements | ⏳ |  |
| AC5 | Form actions | ⏳ |  |

### Accessibility Check
| Check | Status |
|-------|--------|
| Keyboard navigation | ⏳ |
| Screen reader compatible | ⏳ |
| Color contrast | ⏳ |
