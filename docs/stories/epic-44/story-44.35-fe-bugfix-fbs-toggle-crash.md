# Story 44.35-FE: Bug Fix - FBO/FBS Toggle Crashes Application

## Overview

| Field | Value |
|-------|-------|
| **Story ID** | 44.35-FE |
| **Epic** | Epic 44 - Price Calculator UI |
| **Type** | Bugfix |
| **Priority** | P0 - Critical |
| **Story Points** | 3 SP |
| **Status** | Ready for Dev |

## Description

The Price Calculator application crashes when users click the FBS toggle button. This is caused by React hooks being called conditionally inside JSX, violating React's Rules of Hooks. When the fulfillment type changes from FBO to FBS, the conditional rendering causes a different number of hooks to be called between renders, leading to a React error.

## Bug Report

### Reproduction Steps
1. Navigate to `/cogs/price-calculator`
2. Wait for the page to fully load (form renders with FBO selected by default)
3. Click the "FBS" radio button

### Expected Behavior
- Fulfillment type switches to FBS
- FBO-only fields (BoxTypeSelector, TurnoverDaysInput) hide smoothly
- Form continues to work normally
- No errors in console

### Actual Behavior
- Application crashes immediately
- White screen or partial render
- React error in console about hooks

### Error Details
```
Error: Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
    at finishRenderingHooks
    at renderWithHooks
    at updateFunctionComponent
```

### Severity Assessment
- **User Impact**: CRITICAL - Users cannot switch between FBO and FBS modes
- **Frequency**: 100% reproducible
- **Workaround**: None - feature is completely broken

## Technical Analysis

### Root Cause
The `PriceCalculatorForm.tsx` component calls `useWatch` hooks conditionally inside JSX blocks. React hooks must be called unconditionally at the top level of a component, in the same order on every render.

**Violation Pattern (lines 185-199):**
```tsx
{fulfillmentType === 'FBO' && (
  <>
    <BoxTypeSelector
      value={useWatch({ control, name: 'box_type' })}  // HOOK INSIDE CONDITIONAL!
      // ...
    />
    <TurnoverDaysInput
      value={useWatch({ control, name: 'turnover_days' })}  // HOOK INSIDE CONDITIONAL!
      // ...
    />
  </>
)}
```

**Additional Violations (lines 201-212):**
```tsx
<WeightThresholdCheckbox
  checked={useWatch({ control, name: 'weight_exceeds_25kg' })}  // HOOK MIGHT BE CONDITIONALLY CALLED
  // ...
/>
<LocalizationIndexInput
  value={useWatch({ control, name: 'localization_index' })}  // HOOK MIGHT BE CONDITIONALLY CALLED
  // ...
/>
```

### Why This Fails
1. User loads page with FBO selected (default)
2. React calls hooks: `useWatch('box_type')`, `useWatch('turnover_days')`, `useWatch('weight_exceeds_25kg')`, `useWatch('localization_index')`
3. User clicks FBS
4. Conditional `{fulfillmentType === 'FBO' && ...}` evaluates to false
5. React renders without `useWatch('box_type')` and `useWatch('turnover_days')`
6. React detects different number of hooks → CRASH

### Affected Files

| File | Line(s) | Issue |
|------|---------|-------|
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | 188, 193 | `useWatch` called inside conditional JSX block |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | 202, 208 | `useWatch` called inline in component props |

### React Rules of Hooks Reference
From React documentation:
> Don't call Hooks inside loops, conditions, or nested functions. Instead, always use Hooks at the top level of your React function, before any early returns.

## Solution Approach

### Option A: Move useWatch to Component Top Level (Recommended)

Move all `useWatch` calls to the top of the component, alongside other watched values:

```tsx
export function PriceCalculatorForm({ /* props */ }) {
  // ... other hooks ...

  // Watch form values - ALL at top level
  const fulfillmentType = useWatch({ control, name: 'fulfillment_type' })
  const buybackValue = useWatch({ control, name: 'buyback_pct' }) ?? 95
  const lengthCm = useWatch({ control, name: 'length_cm' }) ?? 0
  const widthCm = useWatch({ control, name: 'width_cm' }) ?? 0
  const heightCm = useWatch({ control, name: 'height_cm' }) ?? 0

  // Story 44.35: Move these to top level to fix hooks violation
  const boxType = useWatch({ control, name: 'box_type' })
  const turnoverDays = useWatch({ control, name: 'turnover_days' })
  const weightExceeds25kg = useWatch({ control, name: 'weight_exceeds_25kg' })
  const localizationIndex = useWatch({ control, name: 'localization_index' })

  // ... rest of component ...

  return (
    // JSX now uses variables instead of inline hooks
    {fulfillmentType === 'FBO' && (
      <>
        <BoxTypeSelector
          value={boxType}  // Safe: variable, not hook
          // ...
        />
        <TurnoverDaysInput
          value={turnoverDays}  // Safe: variable, not hook
          // ...
        />
      </>
    )}
  )
}
```

### Option B: Create Wrapper Components with Own Hooks

Create child components that encapsulate the `useWatch` calls:

```tsx
// FBOFields.tsx
function FBOFields({ control, disabled, setValue, storageRub }) {
  const boxType = useWatch({ control, name: 'box_type' })
  const turnoverDays = useWatch({ control, name: 'turnover_days' })

  return (
    <>
      <BoxTypeSelector value={boxType} ... />
      <TurnoverDaysInput value={turnoverDays} ... />
    </>
  )
}

// In parent - only renders when FBO, hooks always run inside child
{fulfillmentType === 'FBO' && (
  <FBOFields control={control} disabled={disabled} setValue={setValue} storageRub={storageRub} />
)}
```

### Recommended Solution
**Option A** is recommended because:
1. Simpler implementation - no new files
2. Consistent with existing pattern in the file (lines 74-79)
3. Better performance - single component re-render
4. Clearer code - all watched values visible at top

## Acceptance Criteria

- [ ] **AC1: FBO to FBS Transition**
  - Load Price Calculator page (FBO is default)
  - Click "FBS" button
  - FBO-only fields disappear smoothly
  - No crash, no console errors
  - Form remains functional

- [ ] **AC2: FBS to FBO Transition**
  - Set fulfillment type to FBS
  - Click "FBO" button
  - FBO-only fields appear
  - No crash, no console errors
  - All fields work correctly

- [ ] **AC3: Rapid Toggling**
  - Rapidly toggle between FBO and FBS multiple times
  - No crashes or errors
  - UI responds correctly each time

- [ ] **AC4: Form Submission After Toggle**
  - Toggle from FBO to FBS
  - Fill out required fields
  - Click "Calculate"
  - Calculation completes successfully

- [ ] **AC5: Field Values Preserved**
  - Enter values in FBO-specific fields (box_type, turnover_days)
  - Toggle to FBS and back to FBO
  - Previous values are still present

- [ ] **AC6: No Regression**
  - All existing Price Calculator tests pass
  - No new TypeScript errors
  - No ESLint warnings about hooks

## Test Plan

### Manual Testing

#### Test Case 1: Basic Toggle
1. Navigate to `/cogs/price-calculator`
2. Verify FBO is selected (default)
3. Click "FBS" button
4. **Verify**: No crash, FBS is now selected
5. **Verify**: BoxTypeSelector and TurnoverDaysInput are hidden
6. Click "FBO" button
7. **Verify**: No crash, FBO is now selected
8. **Verify**: BoxTypeSelector and TurnoverDaysInput are visible

#### Test Case 2: Full Form Flow
1. Select FBO
2. Enter COGS: 1000
3. Select warehouse
4. Enter dimensions
5. Set turnover days: 30
6. Toggle to FBS
7. Verify form is still valid
8. Click Calculate
9. **Verify**: No crash, calculation proceeds

#### Test Case 3: Console Verification
1. Open browser DevTools Console
2. Toggle FBO/FBS multiple times
3. **Verify**: No React errors about hooks
4. **Verify**: No warnings about hooks

### Automated Testing

- [ ] **Unit Test**: `PriceCalculatorForm.test.tsx`
  ```tsx
  it('should not crash when toggling from FBO to FBS', async () => {
    render(<PriceCalculatorForm onSubmit={mockSubmit} />)

    // Initial state: FBO selected
    expect(screen.getByRole('radio', { name: /FBO/i })).toBeChecked()

    // Click FBS
    await userEvent.click(screen.getByRole('radio', { name: /FBS/i }))

    // Should not crash - FBS now selected
    expect(screen.getByRole('radio', { name: /FBS/i })).toBeChecked()
  })

  it('should not crash when toggling from FBS to FBO', async () => {
    render(<PriceCalculatorForm onSubmit={mockSubmit} />)

    // Toggle to FBS first
    await userEvent.click(screen.getByRole('radio', { name: /FBS/i }))

    // Toggle back to FBO
    await userEvent.click(screen.getByRole('radio', { name: /FBO/i }))

    // Should not crash - FBO now selected
    expect(screen.getByRole('radio', { name: /FBO/i })).toBeChecked()
  })

  it('should handle rapid toggling without crashing', async () => {
    render(<PriceCalculatorForm onSubmit={mockSubmit} />)

    // Rapidly toggle multiple times
    for (let i = 0; i < 5; i++) {
      await userEvent.click(screen.getByRole('radio', { name: /FBS/i }))
      await userEvent.click(screen.getByRole('radio', { name: /FBO/i }))
    }

    // Should not crash
    expect(screen.getByTestId('price-calculator-form')).toBeInTheDocument()
  })
  ```

- [ ] **E2E Test**: `e2e/price-calculator.spec.ts`
  ```ts
  test('FBO/FBS toggle does not crash', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    // Toggle to FBS
    await page.getByRole('radio', { name: /FBS/i }).click()
    await expect(page.getByRole('radio', { name: /FBS/i })).toBeChecked()

    // No crash - page still functional
    await expect(page.getByTestId('price-calculator-form')).toBeVisible()

    // Toggle back to FBO
    await page.getByRole('radio', { name: /FBO/i }).click()
    await expect(page.getByRole('radio', { name: /FBO/i })).toBeChecked()
  })
  ```

## Technical Tasks

### Task 1: Move useWatch Hooks to Top Level
**File:** `src/components/custom/price-calculator/PriceCalculatorForm.tsx`
**Effort:** 1.5 SP

1. Add new useWatch calls at component top level (around line 74):
   ```tsx
   const boxType = useWatch({ control, name: 'box_type' })
   const turnoverDays = useWatch({ control, name: 'turnover_days' })
   const weightExceeds25kg = useWatch({ control, name: 'weight_exceeds_25kg' })
   const localizationIndex = useWatch({ control, name: 'localization_index' })
   ```

2. Replace inline useWatch in JSX with variables:
   - Line 188: `useWatch({ control, name: 'box_type' })` → `boxType`
   - Line 193: `useWatch({ control, name: 'turnover_days' })` → `turnoverDays`
   - Line 202: `useWatch({ control, name: 'weight_exceeds_25kg' })` → `weightExceeds25kg`
   - Line 208: `useWatch({ control, name: 'localization_index' })` → `localizationIndex`

### Task 2: Add Unit Tests
**File:** `src/components/custom/price-calculator/__tests__/PriceCalculatorForm.test.tsx`
**Effort:** 1 SP

1. Add test cases for FBO/FBS toggle scenarios
2. Add test for rapid toggling
3. Verify no React errors in test output

### Task 3: Update E2E Tests
**File:** `e2e/price-calculator.spec.ts`
**Effort:** 0.5 SP

1. Add E2E test for toggle behavior
2. Verify page stability after toggle

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | Move useWatch hooks to top level |
| `src/components/custom/price-calculator/__tests__/PriceCalculatorForm.test.tsx` | Add toggle tests |
| `e2e/price-calculator.spec.ts` | Add E2E toggle test |

## Definition of Done

- [ ] FBO/FBS toggle works without crashing
- [ ] All useWatch hooks called at component top level
- [ ] No React "hooks called conditionally" errors
- [ ] Unit tests for toggle scenarios pass
- [ ] E2E tests for toggle scenarios pass
- [ ] No regression in existing functionality
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings

## Related Stories

- Story 44.15-FE: Fulfillment Type Selection (introduced FBO/FBS toggle)
- Story 44.32-FE: Missing Price Calculator Fields (added conditional fields)

## Notes

### Why This Wasn't Caught Earlier
The bug was introduced in Story 44.32 when FBO-only fields were added. The conditional rendering pattern looked correct in isolation but violated React's Rules of Hooks.

### Prevention
Consider adding ESLint rule `react-hooks/rules-of-hooks` if not already enabled. This catches hooks-in-conditionals at lint time.

### Alternative Patterns for Future
If more complex conditional form sections are needed, consider:
1. Wrapper components that encapsulate their own hooks
2. Custom form context that provides all watched values
3. Using `useFormContext` in child components

## References

- [React Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [react-hook-form useWatch](https://react-hook-form.com/docs/usewatch)
