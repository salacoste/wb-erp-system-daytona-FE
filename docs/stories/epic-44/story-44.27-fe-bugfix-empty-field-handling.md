# Story 44.27-FE: Bug Fix - Empty Field Handling in Price Calculator

## Story

**As a** seller using the Price Calculator,
**I want** empty numeric fields to automatically default to zero,
**So that** the calculation works correctly without errors when I clear a field.

## Status

| Field | Value |
|-------|-------|
| Status | Ready for Dev |
| Priority | High (Critical Bug) |
| Estimate | 2 SP |
| Sprint | Current |
| Type | Bug Fix |

## Problem Description

### Bug Report
When a user clears a numeric input field in the Price Calculator form (e.g., COGS, logistics costs, dimensions) and clicks "Calculate", the system breaks. Empty fields should automatically default to zero.

### Current Behavior
1. User enters value in numeric field (e.g., COGS = 500)
2. User selects all text and deletes it (field becomes empty string "")
3. Field shows empty/blank instead of 0
4. User clicks "Рассчитать" (Calculate)
5. **System crashes or produces NaN/undefined values**

### Expected Behavior
1. User clears a numeric field
2. Field automatically displays "0" (or 0 after blur)
3. Form submission works correctly with 0 value
4. Calculation proceeds normally

## Root Cause Analysis

### Problem Source
The `valueAsNumber: true` option in `react-hook-form` register returns `NaN` when input value is an empty string.

**Affected Components:**

1. **FixedCostsSection.tsx** (lines 67-71, 93-97, 119-123, 146-149)
   - `cogs_rub` - uses `valueAsNumber: true`, no empty handling
   - `logistics_forward_rub` - uses `valueAsNumber: true`, no empty handling
   - `logistics_reverse_rub` - uses `valueAsNumber: true`, no empty handling
   - `storage_rub` - uses `valueAsNumber: true`, no empty handling

2. **DimensionInputSection.tsx** (lines 100-105, 124-129, 148-153)
   - `length_cm` - uses `valueAsNumber: true`, no empty handling
   - `width_cm` - uses `valueAsNumber: true`, no empty handling
   - `height_cm` - uses `valueAsNumber: true`, no empty handling

3. **MarginSlider.tsx** (lines 137-139)
   - Already handles empty: `const num = parseFloat(e.target.value); field.onChange(isNaN(num) ? 0 : num)`
   - **OK - no fix needed**

4. **DrrSlider.tsx** (lines 106-113)
   - Already handles empty: `else if (e.target.value === '') { onChange(0) }`
   - **OK - no fix needed**

5. **SppInput.tsx** (lines 56-62)
   - Already handles empty: `else if (e.target.value === '') { onChange(0) }`
   - **OK - no fix needed**

6. **TaxConfigurationSection.tsx** (lines 61-68)
   - Already handles empty: `else if (e.target.value === '') { onTaxRateChange(0) }`
   - **OK - no fix needed**

### Technical Details

When using `register()` with `valueAsNumber: true`:
```typescript
{...register(cogsField, {
  valueAsNumber: true,  // Returns NaN for empty string!
  required: 'Себестоимость обязательна',
  min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
})}
```

The empty string "" becomes `NaN`, which:
- Fails validation silently in some cases
- Propagates to calculations
- Causes `isFormEmpty()` to return false incorrectly
- Results in NaN in final results

## Solution Approach

### Option A: Custom onChange Handler (Recommended)
Add `setValueAs` transform to convert empty/NaN to 0:

```typescript
{...register(cogsField, {
  valueAsNumber: true,
  setValueAs: (value) => {
    const num = parseFloat(value)
    return isNaN(num) ? 0 : num
  },
  required: 'Себестоимость обязательна',
  min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
})}
```

### Option B: Create Utility Function
Create a reusable helper for numeric field registration:

```typescript
// src/lib/form-utils.ts
export function numericFieldOptions(options?: RegisterOptions) {
  return {
    valueAsNumber: true,
    setValueAs: (value: string) => {
      const num = parseFloat(value)
      return isNaN(num) ? 0 : num
    },
    ...options,
  }
}

// Usage
{...register(cogsField, numericFieldOptions({
  required: 'Себестоимость обязательна',
  min: { value: 0, message: 'Не может быть отрицательной' },
}))}
```

### Option C: Input Wrapper Component
Create a NumericInput component that handles empty values:

```typescript
// components/custom/price-calculator/NumericInput.tsx
export function NumericInput({
  name,
  register,
  ...props
}: NumericInputProps) {
  return (
    <Input
      type="number"
      {...props}
      {...register(name, {
        valueAsNumber: true,
        setValueAs: (v) => parseFloat(v) || 0,
      })}
    />
  )
}
```

**Recommended: Option B** - Creates reusable utility, minimal code changes, consistent behavior.

## Acceptance Criteria

### AC1: COGS Field Empty Handling
- [ ] Clear COGS field by selecting all and deleting
- [ ] Field shows "0" or empty placeholder
- [ ] Click "Рассчитать"
- [ ] No errors, calculation works with COGS = 0
- [ ] Warning may appear (COGS=0 is unusual but valid)

### AC2: Logistics Fields Empty Handling
- [ ] Clear logistics_forward_rub field
- [ ] Clear logistics_reverse_rub field
- [ ] Clear storage_rub field (FBO mode)
- [ ] Each field defaults to 0 on clear
- [ ] Calculation works correctly

### AC3: Dimension Fields Empty Handling
- [ ] Clear length_cm, width_cm, height_cm fields
- [ ] Each field defaults to 0 on clear
- [ ] Volume recalculates to 0
- [ ] No cargo type badge shown (as expected with 0 dimensions)

### AC4: Edge Cases
- [ ] Clear all numeric fields simultaneously
- [ ] Form submits with all zeros (shows appropriate warning/results)
- [ ] Tab through cleared fields (blur triggers 0 default)
- [ ] Keyboard: Backspace to clear field works correctly

### AC5: Regression Testing
- [ ] MarginSlider still works (already handles empty)
- [ ] DrrSlider still works (already handles empty)
- [ ] SppInput still works (already handles empty)
- [ ] TaxConfigurationSection still works (already handles empty)
- [ ] All existing calculations produce same results with explicit values

## Technical Tasks

### Task 1: Create Form Utility Function
**File:** `src/lib/form-utils.ts` (new file)
**Effort:** 0.5 SP

```typescript
import type { RegisterOptions } from 'react-hook-form'

/**
 * Create register options for numeric fields that handle empty values
 * Converts empty string or NaN to 0
 */
export function numericFieldOptions<T extends Record<string, unknown>>(
  options?: Omit<RegisterOptions<T>, 'valueAsNumber' | 'setValueAs'>
): RegisterOptions<T> {
  return {
    valueAsNumber: true,
    setValueAs: (value: string | number) => {
      if (value === '' || value === null || value === undefined) return 0
      const num = typeof value === 'number' ? value : parseFloat(value)
      return isNaN(num) ? 0 : num
    },
    ...options,
  } as RegisterOptions<T>
}
```

### Task 2: Update FixedCostsSection
**File:** `src/components/custom/price-calculator/FixedCostsSection.tsx`
**Effort:** 0.5 SP

Update 4 fields to use `numericFieldOptions`:
- `cogs_rub`
- `logistics_forward_rub`
- `logistics_reverse_rub`
- `storage_rub`

### Task 3: Update DimensionInputSection
**File:** `src/components/custom/price-calculator/DimensionInputSection.tsx`
**Effort:** 0.5 SP

Update 3 fields to use `numericFieldOptions`:
- `length_cm`
- `width_cm`
- `height_cm`

### Task 4: Add Unit Tests
**File:** `src/lib/__tests__/form-utils.test.ts`
**Effort:** 0.5 SP

Test cases:
- Empty string returns 0
- NaN input returns 0
- Valid number returns number
- Negative number returns negative (validation handles min)
- Zero returns 0
- Decimal values preserved

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/form-utils.ts` | New file - numericFieldOptions utility |
| `src/components/custom/price-calculator/FixedCostsSection.tsx` | Import utility, update 4 register calls |
| `src/components/custom/price-calculator/DimensionInputSection.tsx` | Import utility, update 3 register calls |
| `src/lib/__tests__/form-utils.test.ts` | New file - unit tests |

## Definition of Done

- [ ] All numeric fields in Price Calculator handle empty values correctly
- [ ] Empty fields default to 0 (no NaN in form state)
- [ ] Calculations work correctly with cleared fields
- [ ] Unit tests for `numericFieldOptions` utility pass
- [ ] Manual testing: clear each field, verify behavior
- [ ] No regression in existing functionality
- [ ] Code follows project conventions (under 200 lines per file)
- [ ] TypeScript strict mode passes

## Related Stories

- Story 44.2-FE: Input Form Component (original implementation)
- Story 44.7-FE: Dimension-Based Volume Calculation
- Story 44.15-FE: Fulfillment Type Selection

## Notes

### Why Not Use `required` Validation?
Some fields (like storage_rub, dimensions) are optional and can legitimately be 0. The `required` validation would block submission, but we want to allow empty-as-zero behavior.

### Why `setValueAs` Over `onBlur`?
Using `setValueAs` ensures the value is transformed immediately when reading form state, not just on blur. This prevents any intermediate NaN state in calculations or useWatch hooks.

### Components Already Fixed
The following components already handle empty values correctly and should NOT be modified:
- `MarginSlider.tsx` - uses `parseFloat` with NaN check
- `DrrSlider.tsx` - checks for empty string
- `SppInput.tsx` - checks for empty string
- `TaxConfigurationSection.tsx` - checks for empty string
