# Story 44.30-FE: UX Polish & Accessibility Fixes

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Ready for Dev
**Priority**: P1 - HIGH
**Effort**: 3 SP
**Depends On**: Stories 44.21-44.25 (Visual Enhancement complete)
**Type**: UX Polish / Bugfix

---

## User Story

**As a** Wildberries seller using the Price Calculator,
**I want** an intuitive and accessible interface without usability issues,
**So that** I can efficiently calculate prices without friction or barriers.

**Non-goals**:
- Major redesign or layout changes
- New features or functionality
- Performance optimizations

---

## Background: UX Audit Results

A comprehensive UX audit of the Price Calculator identified 8 issues requiring attention.

### Critical Issues (Must Fix)

1. **Retry callback is empty** - Button "Повторить" does nothing after error
2. **Escape key conflict** - Esc closes form even when Popover/Dialog is open
3. **MarginSlider inappropriate for Buyback%** - Zone labels (Low/Medium/High) don't apply to buyback percentage

### Visual Hierarchy Issues (High Priority)

4. **Duplicate section colors** - WarehouseSection and PercentageCostsSection both use purple
5. **H1 size mismatch** - Uses 24px instead of design system's 32px
6. **Section headers too small** - `text-sm font-medium` should be `text-base font-semibold`

### Microinteraction Issues (Medium Priority)

7. **CoefficientCalendar missing active state** - Has hover scale but no press feedback
8. **Form error accessibility** - Some form errors lack proper ARIA announcements

---

## Acceptance Criteria

### AC1: Critical Fixes

- [ ] **Retry callback works**: Save last request parameters and call `mutate(lastRequest)` on retry
- [ ] **Escape key respects modals**: Check `!e.defaultPrevented` before triggering reset; skip if focus is in dialog/popover
- [ ] **Buyback slider has no margin zones**: Create `BuybackSlider` component without Low/Medium/High zones and labels

### AC2: Visual Hierarchy Fixes

- [ ] **Section colors are distinct**:
  - WarehouseSection: `bg-purple-50 border-l-purple-400` (keep)
  - PercentageCostsSection: `bg-emerald-50 border-l-emerald-400` (change)
  - FixedCostsSection: `bg-blue-50 border-l-blue-400` (keep)
- [ ] **H1 matches design system**: `text-3xl md:text-4xl` (32px on desktop)
- [ ] **Section headers enhanced**: `text-base font-semibold` minimum

### AC3: Microinteraction Fixes

- [ ] **Calendar cells have active state**: Add `active:scale-95` for press feedback
- [ ] **Form inputs have consistent focus lift**: Verify all inputs have `focus:shadow-md`

### AC4: Accessibility Fixes

- [ ] **Error messages announced**: All form field errors wrapped in `role="alert"`
- [ ] **ARIA live regions**: Error summary has `aria-live="assertive"`
- [ ] **Focus management**: After error, focus moves to first invalid field

---

## Technical Requirements

### Files to Modify

| File | Change | Lines Est. |
|------|--------|------------|
| `src/app/(dashboard)/cogs/price-calculator/page.tsx` | Retry callback, H1 size | ~15 |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | Escape key fix | ~10 |
| `src/components/custom/price-calculator/PercentageCostsFormSection.tsx` | Color change, use BuybackSlider | ~15 |
| `src/components/custom/price-calculator/WarehouseSection.tsx` | Header size | ~5 |
| `src/components/custom/price-calculator/FixedCostsSection.tsx` | Header size, error ARIA | ~10 |
| `src/components/custom/price-calculator/CoefficientCalendar.tsx` | Active state | ~5 |
| **NEW**: `src/components/custom/price-calculator/BuybackSlider.tsx` | Slider without zones | ~60 |

### Total Estimated: ~120 lines changed/added

---

## Implementation Details

### Fix 1: Retry Callback (page.tsx)

```typescript
// Current (broken)
const { mutate, isPending, data, error } = usePriceCalculator(...)

// Add state to track last request
const [lastRequest, setLastRequest] = useState<PriceCalculatorRequest | null>(null)

const handleCalculate = useCallback((requestData: PriceCalculatorRequest) => {
  setLastRequest(requestData) // Save for retry
  setIsCalculating(true)
  mutate(requestData)
}, [mutate])

// Fixed retry handler
<ErrorMessage
  error={error}
  onRetry={() => {
    if (lastRequest) {
      setIsCalculating(true)
      mutate(lastRequest)
    }
  }}
/>
```

### Fix 2: Escape Key Conflict (PriceCalculatorForm.tsx)

```typescript
// Current (lines 119-125)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !disabled) onReset()
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [disabled, onReset])

// Fixed - check if event was already handled by modal
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if already handled (e.g., by Dialog/Popover)
    if (e.defaultPrevented) return

    // Skip if focus is inside a dialog, popover, or modal
    const activeElement = document.activeElement
    const isInModal = activeElement?.closest('[role="dialog"], [data-radix-popover-content], [data-radix-dropdown-content]')

    if (e.key === 'Escape' && !disabled && !isInModal) {
      onReset()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [disabled, onReset])
```

### Fix 3: BuybackSlider Component (NEW)

Create a simplified slider without margin zones for buyback percentage:

```typescript
// src/components/custom/price-calculator/BuybackSlider.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Controller, type FieldValues, type Control, type Path } from 'react-hook-form'

/**
 * Simple slider for buyback percentage without margin zone indicators
 * Zone labels (Low/Medium/High) don't apply to buyback where 95-100% is normal
 *
 * Story 44.30-FE: UX Polish
 */
export interface BuybackSliderProps<T extends FieldValues = FieldValues> {
  name: Path<T>
  control: Control<T>
  min: number
  max: number
  step: number
  unit: string
  error?: string
}

export function BuybackSlider<T extends FieldValues = FieldValues>({
  name,
  control,
  min,
  max,
  step,
  unit,
  error,
}: BuybackSliderProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = Number(field.value) || 0

        return (
          <div className="space-y-3">
            {/* Simple slider without zone overlay */}
            <Slider
              min={min}
              max={max}
              step={step}
              value={[value]}
              onValueChange={(values) => field.onChange(values[0])}
              className="w-full"
            />

            {/* Value input */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                  const num = parseFloat(e.target.value)
                  field.onChange(isNaN(num) ? 0 : num)
                }}
                className="w-20 text-right"
              />
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}
```

### Fix 4: Section Colors (PercentageCostsFormSection.tsx)

```typescript
// Current (line 54)
<div className="bg-purple-50 rounded-lg p-4 border-l-4 border-l-purple-400">

// Fixed - use emerald to distinguish from WarehouseSection
<div className="bg-emerald-50 rounded-lg p-4 border-l-4 border-l-emerald-400">

// Also update icon color (line 56)
<Percent className="h-4 w-4 text-emerald-600" aria-hidden="true" />

// And heading color (line 57)
<h3 className="text-base font-semibold text-emerald-900">Процентные расходы (%)</h3>
```

### Fix 5: H1 Size (page.tsx)

```typescript
// Current (line 78)
<h1 className="text-2xl font-bold mb-6">Калькулятор цены</h1>

// Fixed - 32px on desktop per design system
<h1 className="text-3xl md:text-4xl font-bold mb-6">Калькулятор цены</h1>
```

### Fix 6: Section Headers (WarehouseSection.tsx, FixedCostsSection.tsx)

```typescript
// Current
<h3 className="text-sm font-medium text-purple-900">Склад и хранение</h3>

// Fixed
<h3 className="text-base font-semibold text-purple-900">Склад и хранение</h3>
```

### Fix 7: Calendar Active State (CoefficientCalendar.tsx)

```typescript
// Current (line 143)
canClick && 'cursor-pointer hover:opacity-80 hover:scale-105',

// Fixed - add active state for tactile feedback
canClick && 'cursor-pointer hover:opacity-80 hover:scale-105 active:scale-95 transition-transform duration-150',
```

### Fix 8: Form Error ARIA (FixedCostsSection.tsx, etc.)

```typescript
// Current error display
{errors.cogs_rub && (
  <p className="text-sm text-destructive">
    {(errors.cogs_rub as { message?: string })?.message}
  </p>
)}

// Fixed - add role="alert" for screen reader announcement
{errors.cogs_rub && (
  <p className="text-sm text-destructive" role="alert">
    {(errors.cogs_rub as { message?: string })?.message}
  </p>
)}
```

---

## Design Specifications

### Section Color Palette (After Fix)

| Section | Background | Border | Icon/Text |
|---------|------------|--------|-----------|
| Warehouse & Storage | `bg-purple-50` | `border-l-purple-400` | `text-purple-600/900` |
| Fixed Costs | `bg-blue-50` | `border-l-blue-400` | `text-blue-600/900` |
| Percentage Costs | `bg-emerald-50` | `border-l-emerald-400` | `text-emerald-600/900` |
| Target Margin | (uses MarginSlider zones) | - | - |
| Tax Configuration | (neutral) | - | - |

### Typography Fixes

| Element | Before | After |
|---------|--------|-------|
| Page H1 | `text-2xl` (24px) | `text-3xl md:text-4xl` (30-36px) |
| Section H3 | `text-sm font-medium` | `text-base font-semibold` |

---

## Testing Checklist

### Functional Tests

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Submit invalid data, click "Повторить" | Last request is retried |
| 2 | Open calendar popover, press Escape | Popover closes, form stays open |
| 3 | No popover open, press Escape | Reset confirmation appears |
| 4 | Adjust buyback slider | No zone labels or color changes |
| 5 | View all sections | Each has distinct color |

### Accessibility Tests

| # | Test | Expected Result |
|---|------|-----------------|
| 6 | Screen reader on form error | Error announced immediately |
| 7 | Tab through form with errors | Focus moves to invalid fields |
| 8 | Calendar with keyboard | Active state visible on Enter press |

### Visual Regression Tests

- [ ] Section colors distinct and accessible
- [ ] H1 size matches design system (32px)
- [ ] Section headers properly sized
- [ ] Calendar cells have press feedback

---

## Dependencies

- **None** - This story fixes existing functionality
- **Prerequisite**: Stories 44.21-44.25 complete (visual enhancements)

---

## Out of Scope

- Card elevation (Story 44.21 - already complete)
- Hero price styling (Story 44.22 - already complete)
- Form card styling (Story 44.23 - already complete)
- Enhanced slider zones for target margin (Story 44.24 - already complete)
- Loading states (Story 44.25 - already complete)
- New features or calculations
- Performance optimizations

---

## Accessibility Considerations

- All error messages have `role="alert"` for screen reader announcement
- Focus management after form submission errors
- Escape key behavior respects modal hierarchy
- Calendar cells have visible focus and active states
- Color alone is not used to convey information (labels accompany colors)

---

## Dev Agent Record

### File List

| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/app/(dashboard)/cogs/price-calculator/page.tsx` | UPDATE | ~15 | Retry callback, H1 size |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | ~10 | Escape key modal check |
| `src/components/custom/price-calculator/PercentageCostsFormSection.tsx` | UPDATE | ~15 | Emerald colors, use BuybackSlider |
| `src/components/custom/price-calculator/BuybackSlider.tsx` | CREATE | ~60 | Slider without zones |
| `src/components/custom/price-calculator/WarehouseSection.tsx` | UPDATE | ~5 | Header size |
| `src/components/custom/price-calculator/FixedCostsSection.tsx` | UPDATE | ~10 | Header size, error ARIA |
| `src/components/custom/price-calculator/CoefficientCalendar.tsx` | UPDATE | ~5 | Active state |

### Change Log
_(To be filled by Dev Agent during implementation)_

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC4)
- [ ] Retry button successfully retries last calculation
- [ ] Escape key respects modal/popover state
- [ ] Buyback slider has no margin zones
- [ ] Section colors are visually distinct
- [ ] H1 size matches design system
- [ ] Section headers are properly sized
- [ ] Calendar cells have active:scale-95
- [ ] Form errors have role="alert"
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] Accessibility maintained (WCAG 2.1 AA)
- [ ] Code review completed
- [ ] QA Gate passed

---

**Created**: 2026-01-21
**Last Updated**: 2026-01-21
**Author**: UX Audit → Story Conversion
