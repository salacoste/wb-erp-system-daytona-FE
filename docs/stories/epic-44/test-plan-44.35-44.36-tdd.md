# TDD Test Plan: Stories 44.35-FE and 44.36-FE

## Overview

This document summarizes the TDD (Test-Driven Development) tests written for the Epic 44 bugfix stories before implementation.

| Story | Bug Description | Test File | Tests | Status |
|-------|----------------|-----------|-------|--------|
| 44.35-FE | FBO/FBS Toggle Crashes Application | `PriceCalculatorForm.fbs-toggle.test.tsx` | 15 | RED (14 failing) |
| 44.36-FE | API Field Mismatch (box_type, turnover_days) | `priceCalculatorUtils.api-fields.test.ts` | 42 | RED (10 failing) |

**TDD Phase**: RED (tests written before implementation, expected to fail)

---

## Story 44.35-FE: FBO/FBS Toggle Crash

### Bug Summary
The Price Calculator crashes when users click the FBS toggle button due to React hooks being called conditionally inside JSX, violating React's Rules of Hooks.

### Root Cause
```tsx
// PriceCalculatorForm.tsx lines 185-199
{fulfillmentType === 'FBO' && (
  <>
    <BoxTypeSelector
      value={useWatch({ control, name: 'box_type' })}  // HOOK INSIDE CONDITIONAL!
      ...
    />
    <TurnoverDaysInput
      value={useWatch({ control, name: 'turnover_days' })}  // HOOK INSIDE CONDITIONAL!
      ...
    />
  </>
)}
```

### Test File Location
`src/components/custom/price-calculator/__tests__/PriceCalculatorForm.fbs-toggle.test.tsx`

### Test Coverage by Acceptance Criteria

| AC | Description | Tests | Status |
|----|-------------|-------|--------|
| AC1 | FBO to FBS Transition | 3 tests | FAILING |
| AC2 | FBS to FBO Transition | 2 tests | FAILING |
| AC3 | Rapid Toggling | 2 tests | FAILING |
| AC4 | Form Submission After Toggle | 2 tests | FAILING |
| AC5 | Field Values Preserved | 2 tests | FAILING |
| AC6 | No Regression | 2 tests | FAILING |
| Edge Cases | Component remount, disabled prop | 2 tests | 1 PASSING, 1 FAILING |

### Key Test Cases

1. **AC1: should not crash when toggling from FBO to FBS**
   - Renders form with FBO (default)
   - Clicks FBS radio button
   - Verifies form is still present (no crash)

2. **AC1: should not produce React hooks errors in console**
   - Captures console.error calls
   - Toggles fulfillment type
   - Verifies no hooks-related errors

3. **AC3: should handle rapid toggling without crashing**
   - Toggles FBO/FBS 5 times rapidly
   - Verifies form remains functional

4. **AC5: should preserve other form values when toggling**
   - Verifies WeightThresholdCheckbox and LocalizationIndexInput
   - Remain visible and functional across toggles

### Expected Fix
Move all `useWatch` hooks to the top level of the component:
```tsx
// At top level
const boxType = useWatch({ control, name: 'box_type' })
const turnoverDays = useWatch({ control, name: 'turnover_days' })

// In JSX - use variables instead of hooks
{fulfillmentType === 'FBO' && (
  <BoxTypeSelector value={boxType} ... />
)}
```

---

## Story 44.36-FE: API Field Mismatch

### Bug Summary
All Price Calculator API calls fail with 400 Bad Request because the frontend sends `box_type` and `turnover_days` fields that the backend API doesn't accept.

### Root Cause
```typescript
// priceCalculatorUtils.ts lines 77-82
if (data.fulfillment_type === 'FBO') {
  baseRequest.box_type = data.box_type        // REJECTED BY BACKEND
  baseRequest.turnover_days = data.turnover_days  // REJECTED BY BACKEND
}
```

### Backend Error Response
```json
{
  "error": {
    "details": [
      { "field": "property", "message": "property box_type should not exist" },
      { "field": "property", "message": "property turnover_days should not exist" }
    ]
  }
}
```

### Test File Location
`src/components/custom/price-calculator/__tests__/priceCalculatorUtils.api-fields.test.ts`

### Test Coverage by Acceptance Criteria

| AC | Description | Tests | Status |
|----|-------------|-------|--------|
| AC1 | box_type field exclusion | 4 tests | FAILING |
| AC2 | turnover_days field exclusion | 4 tests | FAILING |
| AC3 | Valid API Request Structure | 2 tests | FAILING |
| AC4 | Required Fields Preserved | 9 tests | PASSING |
| AC5 | Frontend-Only Fields Still Work | 3 tests | 2 PASSING, 1 FAILING |
| AC6 | Other Optional Fields Still Sent | 14 tests | PASSING |
| Non-Regression | isFormEmpty, toTwoLevelFormData | 4 tests | PASSING |
| Snapshot | Complete request structure | 1 test | FAILING |

### Key Test Cases

1. **AC1: should NOT include box_type in API request for FBO**
   ```typescript
   const formData = createFboFormData({ box_type: 'pallet' })
   const request = toApiRequest(formData)
   expect(request).not.toHaveProperty('box_type')
   ```

2. **AC2: should NOT include turnover_days in API request for FBO**
   ```typescript
   const formData = createFboFormData({ turnover_days: 45 })
   const request = toApiRequest(formData)
   expect(request).not.toHaveProperty('turnover_days')
   ```

3. **AC4: should include all required fields**
   - Tests for: target_margin_pct, cogs_rub, logistics fields, buyback_pct, storage_rub, vat_pct, acquiring_pct

4. **AC6: should include other optional fields when set**
   - warehouse_id, logistics_coefficient, storage_coefficient, delivery_date, weight_exceeds_25kg, localization_index

### Expected Fix
Remove `box_type` and `turnover_days` from `toApiRequest()`:
```typescript
// Story 44.36: REMOVED box_type and turnover_days from API request
// These fields are not supported by backend API (Epic 43)
// Keep in form state for frontend calculations only
// if (data.fulfillment_type === 'FBO') {
//   baseRequest.box_type = data.box_type
//   baseRequest.turnover_days = data.turnover_days
// }
```

---

## Test Execution Commands

### Run All Bugfix Tests
```bash
npm test -- --run src/components/custom/price-calculator/__tests__/PriceCalculatorForm.fbs-toggle.test.tsx src/components/custom/price-calculator/__tests__/priceCalculatorUtils.api-fields.test.ts
```

### Run Story 44.35-FE Tests Only
```bash
npm test -- --run src/components/custom/price-calculator/__tests__/PriceCalculatorForm.fbs-toggle.test.tsx
```

### Run Story 44.36-FE Tests Only
```bash
npm test -- --run src/components/custom/price-calculator/__tests__/priceCalculatorUtils.api-fields.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage --run src/components/custom/price-calculator/__tests__/PriceCalculatorForm.fbs-toggle.test.tsx src/components/custom/price-calculator/__tests__/priceCalculatorUtils.api-fields.test.ts
```

---

## TDD Workflow

### Current Phase: RED
- Tests are written and failing
- Bugs are confirmed by test failures
- Ready for implementation (GREEN phase)

### Next Phase: GREEN
1. Fix Story 44.35-FE: Move useWatch hooks to top level
2. Fix Story 44.36-FE: Remove box_type/turnover_days from toApiRequest
3. Run tests - all should pass

### Final Phase: REFACTOR
1. Review code for any cleanup opportunities
2. Ensure no regressions in existing tests
3. Update documentation

---

## Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `PriceCalculatorForm.fbs-toggle.test.tsx` | FBO/FBS toggle crash tests | ~490 |
| `priceCalculatorUtils.api-fields.test.ts` | API field mismatch tests | ~500 |
| `test-plan-44.35-44.36-tdd.md` | This documentation | ~200 |

---

## Definition of Done (Tests)

- [x] Tests written before implementation (TDD)
- [x] Tests cover all acceptance criteria
- [x] Tests are well-organized by AC
- [x] Tests have clear descriptions
- [x] Tests include positive and negative cases
- [x] Tests compile without errors
- [x] Tests fail as expected (bugs confirmed)
- [x] Test coverage documented
- [ ] Tests pass after implementation (GREEN phase)

---

## References

- Story 44.35-FE: `docs/stories/epic-44/story-44.35-fe-bugfix-fbs-toggle-crash.md`
- Story 44.36-FE: `docs/stories/epic-44/story-44.36-fe-bugfix-api-field-mismatch.md`
- React Rules of Hooks: https://react.dev/warnings/invalid-hook-call-warning
- react-hook-form useWatch: https://react-hook-form.com/docs/usewatch
