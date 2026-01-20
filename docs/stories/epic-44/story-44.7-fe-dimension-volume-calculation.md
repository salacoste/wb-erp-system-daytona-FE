# Story 44.7: Dimension-Based Volume Calculation

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Ready for Dev
**Priority**: P1 - IMPORTANT
**Effort**: 2 SP
**Depends On**: Story 44.2 ✅

---

## User Story

**As a** Seller,
**I want** to input product dimensions (length, width, height) and see the calculated volume,
**So that** I can quickly estimate logistics costs based on WB volume-based pricing.

**Non-goals**:
- Backend volume-based pricing API (separate backend story)
- Auto-fill dimensions from WB product catalog
- Automatic logistics cost calculation from volume (future enhancement)

---

## Acceptance Criteria

### AC1: Dimension Input Fields
- [ ] Input field for Length (Длина) in cm (≥0, step 0.1)
- [ ] Input field for Width (Ширина) in cm (≥0, step 0.1)
- [ ] Input field for Height (Высота) in cm (≥0, step 0.1)
- [ ] All fields optional (not required for calculation)
- [ ] Fields grouped under "Габариты товара" section

### AC2: Volume Calculation
- [ ] Auto-calculate volume in liters: `(L × W × H) / 1000`
- [ ] Display calculated volume with 2 decimal places
- [ ] Update volume in real-time as dimensions change
- [ ] Show "0,00 л" when any dimension is 0 or empty

### AC3: Volume Display
- [ ] Show calculated volume next to dimension inputs
- [ ] Format: "Объём: X,XX л" (Russian locale, comma decimal)
- [ ] Visual indicator for volume tiers (≤1L vs >1L) with color coding
- [ ] Tooltip explaining WB volume pricing tiers

### AC4: WB Pricing Reference
- [ ] Display informational tooltip with WB logistics pricing:
  - Products ≤1L: Tiered pricing (23-32 ₽/L based on volume range)
  - Products >1L: First liter 46₽ + 14₽ per additional liter
- [ ] Show estimated logistics cost range based on volume (informational only)

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.2**: `docs/stories/epic-44/story-44.2-fe-input-form-component.md`
- **WB Logistics Pricing**: https://seller.wildberries.ru/new-logistics-tariff
- **Existing Patterns**: `src/components/custom/price-calculator/PriceCalculatorForm.tsx`

### WB Logistics Pricing Reference (2024)

| Volume Range | Price per Liter |
|--------------|-----------------|
| 0.1 - 0.5 L  | 32 ₽/L          |
| 0.5 - 1.0 L  | 23 ₽/L          |
| > 1.0 L      | 46₽ (first L) + 14₽/additional L |

**Formula for >1L**: `logistics_cost = 46 + (volume_liters - 1) * 14`

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorForm.tsx     # UPDATE - Add dimensions section
            ├── DimensionInputs.tsx         # CREATE - Dimension input group
            └── VolumeDisplay.tsx           # CREATE - Volume display with pricing info
```

### Component Structure

```typescript
// src/components/custom/price-calculator/DimensionInputs.tsx
interface DimensionInputsProps {
  /** react-hook-form control object */
  control: Control<FormData>
  /** Disable all inputs */
  disabled?: boolean
  /** Calculated volume in liters */
  volumeLiters: number
}

interface DimensionFormData {
  length_cm: number
  width_cm: number
  height_cm: number
}
```

```typescript
// src/components/custom/price-calculator/VolumeDisplay.tsx
interface VolumeDisplayProps {
  /** Volume in liters */
  volumeLiters: number
  /** Show pricing info tooltip */
  showPricingInfo?: boolean
}
```

### FormData Extension

```typescript
// PriceCalculatorForm.tsx - Update FormData interface
interface FormData {
  // ... existing fields ...
  length_cm: number      // NEW
  width_cm: number       // NEW
  height_cm: number      // NEW
}

// Default values
const defaultValues: FormData = {
  // ... existing defaults ...
  length_cm: 0,
  width_cm: 0,
  height_cm: 0,
}
```

### Volume Calculation Helper

```typescript
// src/lib/price-calculator-utils.ts
/**
 * Calculate volume in liters from dimensions in cm
 * Formula: (L × W × H) / 1000
 */
export function calculateVolumeLiters(
  lengthCm: number,
  widthCm: number,
  heightCm: number
): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
    return 0
  }
  return (lengthCm * widthCm * heightCm) / 1000
}

/**
 * Get WB logistics tier based on volume
 */
export function getVolumeTier(volumeLiters: number): 'small' | 'medium' | 'large' {
  if (volumeLiters <= 0.5) return 'small'
  if (volumeLiters <= 1.0) return 'medium'
  return 'large'
}

/**
 * Estimate WB logistics cost based on volume (informational only)
 * Note: Actual prices may vary by warehouse and time
 */
export function estimateLogisticsCost(volumeLiters: number): { min: number; max: number } {
  if (volumeLiters <= 0) return { min: 0, max: 0 }

  if (volumeLiters <= 0.5) {
    // 32 ₽/L tier
    return { min: volumeLiters * 32, max: volumeLiters * 32 }
  }

  if (volumeLiters <= 1.0) {
    // 23 ₽/L tier
    return { min: volumeLiters * 23, max: volumeLiters * 32 }
  }

  // >1L tier: 46₽ first liter + 14₽ per additional
  const cost = 46 + (volumeLiters - 1) * 14
  return { min: cost, max: cost }
}
```

### Validation Rules

```typescript
const dimensionValidation = {
  length_cm: {
    min: 0,
    max: 300,  // Max 3 meters
    step: 0.1,
    required: false
  },
  width_cm: {
    min: 0,
    max: 300,
    step: 0.1,
    required: false
  },
  height_cm: {
    min: 0,
    max: 300,
    step: 0.1,
    required: false
  },
}
```

### UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ Габариты товара                              [?] tooltip│
├─────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │
│ │ Длина (см)  │ │ Ширина (см) │ │ Высота (см) │         │
│ │   [10.0]    │ │   [15.0]    │ │   [20.0]    │         │
│ └─────────────┘ └─────────────┘ └─────────────┘         │
│                                                         │
│ Объём: 3,00 л  [🟡 >1L]  ~≈ 74 ₽ логистика             │
└─────────────────────────────────────────────────────────┘
```

### Invariants & Edge Cases

- **Invariant**: Volume always ≥ 0 (no negative dimensions allowed)
- **Invariant**: Volume = 0 when any dimension is 0 or empty
- **Edge case**: Very large dimensions (>300 cm) - show warning but allow
- **Edge case**: Decimal precision - round to 2 decimal places for display
- **Edge case**: User clears dimension field - treat as 0, not NaN

---

## Observability

- **Analytics**: Track dimension input usage frequency
- **Metrics**: Average volume values entered
- **Logs**: No server-side logging (client-only calculation)

---

## Security

- **Input Sanitization**: All dimension inputs parsed as float, validated ≥0
- **No Backend Call**: Volume calculation is purely client-side
- **XSS**: No user-generated content in volume display

---

## Accessibility (WCAG 2.1 AA)

- [ ] All dimension inputs have associated labels
- [ ] Volume display announced to screen readers on change (aria-live="polite")
- [ ] Tooltip content accessible via keyboard (Tab to info icon)
- [ ] Color contrast ≥ 4.5:1 for volume tier indicators
- [ ] Touch targets ≥ 44×44px for input fields
- [ ] Input group has fieldset + legend for screen readers

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/custom/price-calculator/DimensionInputs.tsx` | CREATE | Dimension input group with 3 fields |
| `src/components/custom/price-calculator/VolumeDisplay.tsx` | CREATE | Volume display with tier indicator |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | Add dimensions section |
| `src/lib/price-calculator-utils.ts` | CREATE | Volume calculation helpers |

### Change Log
_(To be filled by Dev Agent during implementation)_

### Implementation Notes
_(To be filled by Dev Agent during implementation)_

### Review Follow-ups
_(To be filled by AI Code Review)_

---

## QA Results

_(To be filled after implementation)_

**Reviewer**:
**Date**:
**Gate Decision**:

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Dimension input fields | ⏳ | |
| AC2 | Volume calculation | ⏳ | |
| AC3 | Volume display | ⏳ | |
| AC4 | WB pricing reference | ⏳ | |

### Accessibility Check
| Check | Status | Evidence |
|-------|--------|----------|
| Labels for all inputs | ⏳ | |
| aria-live on volume | ⏳ | |
| Keyboard navigation | ⏳ | |
| Color contrast | ⏳ | |
