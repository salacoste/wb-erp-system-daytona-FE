# Story 44.38-FE: Units Per Package - Acceptance Cost Division

## Overview

| Field | Value |
|-------|-------|
| **Story ID** | 44.38-FE |
| **Epic** | Epic 44 - Price Calculator UI |
| **Type** | Enhancement |
| **Priority** | P1 - High |
| **Story Points** | 3 SP |
| **Status** | ✅ Complete |
| **Completed** | 2026-01-23 |
| **Depends On** | Story 44.32 (BoxTypeSelector) |

## User Story

**As a** Wildberries seller using the price calculator,
**I want** to specify how many product units are in each box or pallet,
**So that** the acceptance cost is correctly calculated per unit instead of per package.

## Problem Description

### Business Problem

When a user selects "Короб" (box) or "Монопаллета" (pallet) as the package type, the system currently calculates the acceptance cost for ONE package. However, in real business scenarios:

- A **box typically contains 5-50 units** of product
- A **pallet typically contains 50-500+ units** of product

**Current incorrect behavior:**
```
Короб costs 100₽ → Shows 100₽ per product unit (WRONG)
```

**Expected correct behavior:**
```
Короб costs 100₽, contains 10 units → 100₽ / 10 = 10₽ per product unit (CORRECT)
```

This calculation error significantly overstates the acceptance cost per unit, leading to incorrect margin calculations and potentially wrong pricing decisions.

### Impact Assessment

| Metric | Current | Expected |
|--------|---------|----------|
| Acceptance cost accuracy | 0% (per-package shown as per-unit) | 100% (true per-unit cost) |
| Margin calculation error | 5-50% overstated costs | Accurate |
| User decision impact | Wrong pricing decisions | Correct pricing decisions |

### Real-World Example

| Scenario | Box Cost | Units | Current Display | Correct Display |
|----------|----------|-------|-----------------|-----------------|
| Small items | 100₽ | 20 units | 100₽/unit | 5₽/unit |
| Medium items | 150₽ | 10 units | 150₽/unit | 15₽/unit |
| Pallet | 500₽ | 100 units | 500₽/unit | 5₽/unit |

## Technical Analysis

### Current Code State

**BoxTypeSelector.tsx** (lines 25-36):
```typescript
const BOX_TYPE_CONFIG = {
  box: {
    label: 'Короб',
    description: 'Стандартная доставка в коробе',
    apiId: 2,
  },
  pallet: {
    label: 'Монопаллета',
    description: 'Крупногабаритные товары на паллете',
    apiId: 5,
  },
} as const
```

**usePriceCalculatorForm.ts** (lines 52-59):
```typescript
export interface FormData {
  // ... other fields ...
  box_type: BoxType
  // NO units_per_package field exists
}
```

### Gap Analysis

| Component | Current State | Required Change |
|-----------|---------------|-----------------|
| `FormData` interface | No `units_per_package` | Add field with validation |
| `BoxTypeSelector` | No units input | Add or create companion component |
| `priceCalculatorUtils.ts` | No division logic | Add per-unit calculation |
| `PriceCalculatorResults` | Shows total acceptance | Show per-unit acceptance |
| Type definitions | No `units_per_package` type | Add to `price-calculator.ts` |

## Acceptance Criteria

- [x] **AC1: New Input Field Appears**
  - New input field "Количество штук в упаковке" appears below box type selector
  - Field only visible when FBO fulfillment type is selected
  - Field label includes tooltip explaining purpose

- [x] **AC2: Input Validation**
  - Minimum value: 1
  - Maximum value: 1000
  - Integer only (no decimals)
  - Default value: 1
  - Error message shown for invalid values

- [x] **AC3: Acceptance Cost Division**
  - Acceptance cost in results is divided by units per package
  - Formula: `acceptance_per_unit = acceptance_total / units_per_package`
  - Division only applies when `units_per_package > 1`

- [x] **AC4: Results Display Update**
  - Results show "Стоимость приёмки за единицу: X ₽"
  - When units > 1, show both: "Стоимость приёмки за упаковку: Y ₽ (Z шт. = X ₽/шт.)"
  - Tooltip explains the per-unit calculation

- [x] **AC5: Tooltip Explanation**
  - BoxTypeSelector tooltip updated to mention units per package
  - New field tooltip: "Укажите сколько штук товара помещается в одну упаковку (короб или паллету). Стоимость приёмки будет разделена на это количество."

- [x] **AC6: Field Reset Behavior**
  - Field resets to default (1) when switching between box/pallet types
  - Field resets to default (1) when switching from FBO to FBS
  - Field preserves value during same box type edits

## Technical Tasks

### Task 1: Add Type Definition
**File:** `src/types/price-calculator.ts`
**Effort:** 0.5 SP

```typescript
/**
 * Story 44.38: Units per package for acceptance cost division
 * @min 1
 * @max 1000
 * @default 1
 */
export interface UnitsPerPackageConfig {
  /** Number of product units in one box/pallet */
  units_per_package: number
}
```

### Task 2: Update FormData Interface
**File:** `src/components/custom/price-calculator/usePriceCalculatorForm.ts`
**Effort:** 0.5 SP

Add to `FormData` interface:
```typescript
/** Story 44.38: Units per package for FBO acceptance cost division (default: 1) */
units_per_package: number
```

Add to `defaultFormValues`:
```typescript
/** Story 44.38: Units per package default (single unit) */
units_per_package: 1,
```

### Task 3: Create UnitsPerPackageInput Component
**File:** `src/components/custom/price-calculator/UnitsPerPackageInput.tsx`
**Effort:** 1.0 SP

New component with:
- Number input with label "Количество штук в упаковке"
- Min/max/step validation (1-1000, step 1)
- Tooltip explaining purpose
- Error state for invalid values
- Disabled state when FBS selected

```typescript
export interface UnitsPerPackageInputProps {
  value: number
  onValueChange: (value: number) => void
  disabled?: boolean
  error?: string
}

export function UnitsPerPackageInput({
  value,
  onValueChange,
  disabled = false,
  error,
}: UnitsPerPackageInputProps) {
  // Implementation
}
```

### Task 4: Update BoxTypeSelector Integration
**File:** `src/components/custom/price-calculator/BoxTypeSelector.tsx`
**Effort:** 0.25 SP

Option A: Add units input directly to BoxTypeSelector
Option B: Keep as separate component, integrate in parent form

**Recommended:** Option B - Keep separation of concerns

Update tooltip text:
```typescript
<FieldTooltip content="Тип доставки влияет на стоимость приёмки: Короб (~1.70 ₽/л) или Монопаллета (~500 ₽ фикс). Укажите количество единиц товара в упаковке ниже." />
```

### Task 5: Update Calculation Logic
**File:** `src/components/custom/price-calculator/priceCalculatorUtils.ts`
**Effort:** 0.5 SP

Add helper function:
```typescript
/**
 * Story 44.38: Calculate per-unit acceptance cost
 * @param acceptanceTotal - Total acceptance cost for the package
 * @param unitsPerPackage - Number of units in the package
 * @returns Per-unit acceptance cost
 */
export function calculateAcceptancePerUnit(
  acceptanceTotal: number,
  unitsPerPackage: number
): number {
  if (unitsPerPackage <= 0) return acceptanceTotal
  return acceptanceTotal / unitsPerPackage
}
```

### Task 6: Update Results Display
**File:** `src/components/custom/price-calculator/PriceCalculatorResults.tsx`
**Effort:** 0.25 SP

Update acceptance cost display:
```typescript
// When units_per_package > 1
<div>
  <span>Стоимость приёмки за упаковку: {formatCurrency(acceptanceTotal)}</span>
  <span>({unitsPerPackage} шт. = {formatCurrency(acceptancePerUnit)}/шт.)</span>
</div>
```

### Task 7: Add Unit Tests
**File:** `src/components/custom/price-calculator/__tests__/priceCalculatorUtils.test.ts`
**Effort:** 0.25 SP

```typescript
describe('calculateAcceptancePerUnit', () => {
  it('divides acceptance cost by units', () => {
    expect(calculateAcceptancePerUnit(100, 10)).toBe(10)
    expect(calculateAcceptancePerUnit(500, 50)).toBe(10)
  })

  it('returns original cost when units is 1', () => {
    expect(calculateAcceptancePerUnit(100, 1)).toBe(100)
  })

  it('handles edge cases', () => {
    expect(calculateAcceptancePerUnit(100, 0)).toBe(100) // Fallback
    expect(calculateAcceptancePerUnit(100, -1)).toBe(100) // Fallback
  })
})
```

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/types/price-calculator.ts` | Add `units_per_package` type | P0 |
| `src/components/custom/price-calculator/usePriceCalculatorForm.ts` | Add field to FormData | P0 |
| `src/components/custom/price-calculator/UnitsPerPackageInput.tsx` | Create new component | P0 |
| `src/components/custom/price-calculator/priceCalculatorUtils.ts` | Add division logic | P0 |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | Integrate new input | P0 |
| `src/components/custom/price-calculator/PriceCalculatorResults.tsx` | Update display | P1 |
| `src/components/custom/price-calculator/BoxTypeSelector.tsx` | Update tooltip | P2 |
| `src/components/custom/price-calculator/__tests__/priceCalculatorUtils.test.ts` | Add tests | P1 |

## Test Plan

### Unit Tests

#### Test Case 1: Division Logic
```typescript
describe('calculateAcceptancePerUnit', () => {
  test.each([
    { total: 100, units: 10, expected: 10 },
    { total: 500, units: 50, expected: 10 },
    { total: 1000, units: 100, expected: 10 },
    { total: 150, units: 1, expected: 150 },
  ])('calculates $total / $units = $expected', ({ total, units, expected }) => {
    expect(calculateAcceptancePerUnit(total, units)).toBe(expected)
  })
})
```

#### Test Case 2: Validation
```typescript
describe('UnitsPerPackageInput validation', () => {
  it('rejects values below 1', () => {
    // Test validation error
  })

  it('rejects values above 1000', () => {
    // Test validation error
  })

  it('rejects decimal values', () => {
    // Test validation error
  })
})
```

### Integration Tests

#### Test Case 3: Form Integration
```typescript
it('includes units_per_package in form state', () => {
  // Render form
  // Change units value
  // Verify form state updated
})
```

#### Test Case 4: Results Display
```typescript
it('shows per-unit cost when units > 1', () => {
  // Render results with acceptance_total=100, units=10
  // Verify shows "10 ₽/шт."
})
```

### Manual Testing

#### Test Case 5: User Flow
1. Navigate to `/cogs/price-calculator`
2. Select FBO fulfillment type
3. Select "Короб" box type
4. Enter units per package: 10
5. Fill other fields and calculate
6. **Verify**: Acceptance cost shows per-unit value

#### Test Case 6: Box Type Switch
1. Set units to 20 for "Короб"
2. Switch to "Монопаллета"
3. **Verify**: Units reset to 1

#### Test Case 7: Fulfillment Switch
1. Set FBO with units = 15
2. Switch to FBS
3. **Verify**: Units input hidden or disabled
4. Switch back to FBO
5. **Verify**: Units reset to default (1)

## UI/UX Specifications

### Component Layout

```
┌─────────────────────────────────────────────┐
│ Тип упаковки                            [?] │
├─────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐   │
│ │ ○ Короб          │ │ ○ Монопаллета    │   │
│ │   Стандартная... │ │   Крупногабар... │   │
│ └──────────────────┘ └──────────────────┘   │
├─────────────────────────────────────────────┤
│ Количество штук в упаковке              [?] │
│ ┌─────────────────────────────────────────┐ │
│ │ [    1    ] [+] [-]                     │ │
│ └─────────────────────────────────────────┘ │
│ Укажите сколько единиц товара в упаковке    │
└─────────────────────────────────────────────┘
```

### Tooltip Content

**Field tooltip:**
> Укажите сколько штук товара помещается в одну упаковку (короб или паллету). Стоимость приёмки будет разделена на это количество для расчёта себестоимости одной единицы.

### Error States

| Condition | Error Message |
|-----------|---------------|
| Value < 1 | "Минимум 1 единица" |
| Value > 1000 | "Максимум 1000 единиц" |
| Non-integer | "Только целые числа" |
| Empty | "Обязательное поле" |

## Out of Scope

- Backend API changes (pending Epic 45/46)
- Actual API request modification (field stored frontend-only for now)
- Automatic unit detection from product catalog
- Historical units per package tracking

## Observability

### Logging

```typescript
// Log when units per package is used
console.debug('[PriceCalculator] Units per package applied', {
  units_per_package: value,
  acceptance_total: totalCost,
  acceptance_per_unit: perUnitCost,
})
```

### Analytics (Future)

- Track average units per package by box type
- Track frequency of units > 1 usage

## Definition of Done

- [x] Type definition added to `price-calculator.ts`
- [x] FormData interface updated with `units_per_package`
- [x] UnitsPerPackageInput component created
- [x] Component integrated into PriceCalculatorForm
- [x] Division logic added to priceCalculatorUtils
- [x] Results display updated with per-unit cost
- [x] Tooltips added/updated
- [x] Unit tests written and passing
- [x] Manual testing completed
- [x] TypeScript strict mode passes
- [x] No ESLint errors
- [x] Code reviewed

## Related Stories

- **Story 44.32-FE**: Missing Price Calculator Fields (introduced BoxTypeSelector)
- **Story 44.36-FE**: API Field Mismatch (box_type not sent to API)
- **Story 44.2-FE**: Input Form Component (original form implementation)
- **Story 44.3-FE**: Results Display Component (original results implementation)

## References

- BoxTypeSelector: `src/components/custom/price-calculator/BoxTypeSelector.tsx`
- Form Hook: `src/components/custom/price-calculator/usePriceCalculatorForm.ts`
- Utils: `src/components/custom/price-calculator/priceCalculatorUtils.ts`
- Types: `src/types/price-calculator.ts`
- Epic README: `docs/stories/epic-44/README.md`

---

**Created:** 2026-01-22
**Author:** PM Agent
**Review Status:** Ready for Dev Review
