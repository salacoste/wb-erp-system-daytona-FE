# Story 44.37-FE: Bug Fix - API Field Mismatch (Warehouse & Additional Fields)

## Overview

| Field | Value |
|-------|-------|
| **Story ID** | 44.37-FE |
| **Epic** | Epic 44 - Price Calculator UI |
| **Type** | Bugfix |
| **Priority** | P0 - Critical |
| **Story Points** | 2 SP |
| **Status** | Ready for Dev |
| **Related Stories** | 44.27, 44.32, 44.36 |

## Description

The Price Calculator frontend sends 6 additional fields to the backend API that are not supported by the current API contract (Epic 43). These fields were added in Stories 44.27 (Warehouse Integration) and 44.32 (Missing Fields) for enhanced UI functionality, but the backend has not yet implemented support for them.

When these fields are included in the API request, the backend returns a 400 Bad Request error, preventing users from calculating prices.

**This story removes 6 fields from the API request:**
- `warehouse_id` - Numeric warehouse identifier
- `logistics_coefficient` - Warehouse logistics multiplier
- `storage_coefficient` - Warehouse storage multiplier
- `delivery_date` - ISO date string for delivery date
- `weight_exceeds_25kg` - Boolean flag for heavy items
- `localization_index` - Regional delivery coefficient (КТР)

**Note:** Story 44.36 handles the removal of `box_type` and `turnover_days`. Together with this story, all 8 invalid fields will be removed.

## Bug Report

### Reproduction Steps

1. Open Price Calculator at `/cogs/price-calculator`
2. Select a warehouse from the dropdown
3. Fill in required fields (COGS, margin, dimensions, etc.)
4. Click "Рассчитать цену" (Calculate Price)

### Expected Behavior

API call succeeds and returns calculated prices with recommended price and cost breakdown.

### Actual Behavior

API returns 400 Bad Request with validation errors listing unsupported fields.

### Error Details

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [
      {"field": "property", "issue": "warehouse_id should not exist"},
      {"field": "property", "issue": "logistics_coefficient should not exist"},
      {"field": "property", "issue": "delivery_date should not exist"},
      {"field": "property", "issue": "box_type should not exist"},
      {"field": "property", "issue": "turnover_days should not exist"}
    ],
    "path": "/v1/products/price-calculator",
    "timestamp": "2026-01-22T00:07:23.420Z"
  }
}
```

## Technical Analysis

### Root Cause

Stories 44.27 (Warehouse Integration) and 44.32 (Missing Price Calc Fields) added new UI fields for enhanced frontend functionality. These fields provide value in the UI for display and future frontend-only calculations, but they are not yet supported by the backend API contract defined in Epic 43.

The `toApiRequest()` function in `priceCalculatorUtils.ts` conditionally includes these fields in the API payload when they have non-default values, causing the backend validation to fail.

### Affected Files

| File | Lines | Issue |
|------|-------|-------|
| `src/components/custom/price-calculator/priceCalculatorUtils.ts` | 64-75 | Warehouse fields sent to API |
| `src/components/custom/price-calculator/priceCalculatorUtils.ts` | 85-92 | Weight/localization fields sent to API |
| `src/types/price-calculator.ts` | 176-191 | Type definitions for unsupported fields |

### Fields to Remove from API Request

| Field | Type | Origin Story | Condition in Code |
|-------|------|--------------|-------------------|
| `warehouse_id` | number | 44.27 | `!== null` |
| `logistics_coefficient` | number | 44.27 | `!== 1.0` |
| `storage_coefficient` | number | 44.27 | FBO && `!== 1.0` |
| `delivery_date` | string | 44.27 | `!== null` |
| `weight_exceeds_25kg` | boolean | 44.32 | `=== true` |
| `localization_index` | number | 44.32 | `!== 1.0` |

## Solution Approach

### Recommended Solution

Remove ALL 6 unsupported fields from the `toApiRequest()` function. The UI components for these fields will remain functional for frontend display and future use, but the fields will not be sent to the backend API.

### Code Changes Required

**File**: `src/components/custom/price-calculator/priceCalculatorUtils.ts`

```typescript
// REMOVE lines 64-75 (warehouse fields):
// ...(data.warehouse_id !== null && { warehouse_id: data.warehouse_id }),
// ...(data.logistics_coefficient !== 1.0 && { logistics_coefficient: data.logistics_coefficient }),
// ...(data.fulfillment_type === 'fbo' && data.storage_coefficient !== 1.0 && { storage_coefficient: data.storage_coefficient }),
// ...(data.delivery_date !== null && { delivery_date: data.delivery_date }),

// REMOVE lines 85-92 (additional fields):
// ...(data.weight_exceeds_25kg && { weight_exceeds_25kg: true }),
// ...(data.localization_index !== 1.0 && { localization_index: data.localization_index }),

// Add comment explaining why:
// Story 44.37: These fields are used for frontend display only.
// Backend API (Epic 43) does not yet support these fields.
// TODO: Re-enable when backend implements support (see docs/request-backend/100-epic-44-open-issues-consolidated.md)
```

### What to Keep

- UI components for all these fields (warehouse selector, delivery date picker, weight checkbox, localization index input)
- Form state management for these fields in `usePriceCalculatorForm.ts`
- Frontend-only display that shows selected values
- Type definitions in `price-calculator.ts` (mark as optional if needed)

## Acceptance Criteria

- [ ] **AC1**: API request does NOT contain `warehouse_id` field
- [ ] **AC2**: API request does NOT contain `logistics_coefficient` field
- [ ] **AC3**: API request does NOT contain `storage_coefficient` field
- [ ] **AC4**: API request does NOT contain `delivery_date` field
- [ ] **AC5**: API request does NOT contain `weight_exceeds_25kg` field
- [ ] **AC6**: API request does NOT contain `localization_index` field
- [ ] **AC7**: Price calculation API call returns 200 success (with Stories 44.36 + 44.37 combined)
- [ ] **AC8**: All UI components for these fields still function correctly (display, input, selection)
- [ ] **AC9**: No TypeScript errors after changes
- [ ] **AC10**: Existing unit tests pass
- [ ] **AC11**: Explanatory comment added in code documenting why fields are excluded

## Test Plan

### Manual Testing

1. Open Price Calculator at `/cogs/price-calculator`
2. Select a warehouse from the dropdown (e.g., "Коледино")
3. Set delivery date using date picker
4. Check "Вес превышает 25 кг" checkbox
5. Set КТР (localization index) to a non-default value (e.g., 1.2)
6. Fill in all other required fields:
   - COGS: 500
   - Target margin: 30%
   - Dimensions: 20x15x10 cm, 0.5 kg
7. Click "Рассчитать цену" button
8. **Verify**: No 400 error occurs, calculation succeeds
9. **Verify**: Recommended price is displayed
10. **Verify**: UI components still display the selected warehouse, date, weight flag, and КТР values

### Network Tab Verification

1. Open Chrome DevTools > Network tab
2. Perform a calculation with warehouse selected
3. Click on the API request to `/v1/products/price-calculator`
4. Inspect the Request Payload
5. **Verify** the following fields are NOT present:
   - `warehouse_id`
   - `logistics_coefficient`
   - `storage_coefficient`
   - `delivery_date`
   - `weight_exceeds_25kg`
   - `localization_index`

### Automated Testing

- [ ] Unit test: `toApiRequest()` excludes `warehouse_id` when warehouse is selected
- [ ] Unit test: `toApiRequest()` excludes `logistics_coefficient` when non-default
- [ ] Unit test: `toApiRequest()` excludes `storage_coefficient` when FBO with non-default
- [ ] Unit test: `toApiRequest()` excludes `delivery_date` when date is selected
- [ ] Unit test: `toApiRequest()` excludes `weight_exceeds_25kg` when checkbox is checked
- [ ] Unit test: `toApiRequest()` excludes `localization_index` when non-default value set
- [ ] Integration test: API call succeeds after selecting warehouse and filling form

### E2E Testing

- [ ] E2E test: Complete form with warehouse selection, verify success toast appears
- [ ] E2E test: Verify no console errors about invalid fields

## Dependencies

- **Story 44.36**: Must be implemented together (removes `box_type` and `turnover_days`)
- **Combined Effect**: Stories 44.36 + 44.37 together remove all 8 invalid fields

## Technical Tasks

1. [ ] Remove `warehouse_id` conditional from `toApiRequest()` (line ~64-66)
2. [ ] Remove `logistics_coefficient` conditional from `toApiRequest()` (line ~67-69)
3. [ ] Remove `storage_coefficient` conditional from `toApiRequest()` (line ~70-72)
4. [ ] Remove `delivery_date` conditional from `toApiRequest()` (line ~73-75)
5. [ ] Remove `weight_exceeds_25kg` conditional from `toApiRequest()` (line ~85-87)
6. [ ] Remove `localization_index` conditional from `toApiRequest()` (line ~89-92)
7. [ ] Add explanatory comment documenting why fields are excluded
8. [ ] Add/update unit tests for `toApiRequest()` to verify field exclusion
9. [ ] Verify all UI components still render and accept input correctly
10. [ ] Run `npm run lint` and fix any issues
11. [ ] Run `npm run type-check` and fix any TypeScript errors
12. [ ] Run `npm test` and verify all tests pass
13. [ ] Manual verification in browser with Network tab inspection

## Implementation Notes

### Field Origin Mapping

| Field | Added In | UI Component | Keep UI? |
|-------|----------|--------------|----------|
| `warehouse_id` | Story 44.27 | `WarehouseSelect.tsx` | Yes |
| `logistics_coefficient` | Story 44.27 | `LogisticsCoefficientsSection.tsx` | Yes |
| `storage_coefficient` | Story 44.27 | `LogisticsCoefficientsSection.tsx` | Yes |
| `delivery_date` | Story 44.27 | `DeliveryDatePicker.tsx` | Yes |
| `weight_exceeds_25kg` | Story 44.32 | `WeightThresholdCheckbox.tsx` | Yes |
| `localization_index` | Story 44.32 | `LocalizationIndexInput.tsx` | Yes |

### Future Backend Support

When the backend implements support for these fields (Epic 43 extension or new Epic), the following steps will be required:

1. Re-enable field sending in `toApiRequest()` function
2. Ensure field names match the backend API contract exactly
3. **Note**: `warehouse_id` may need to become `warehouse_name` (string) based on backend implementation
4. Update type definitions if backend uses different field names
5. Add appropriate validation for new fields

### Relationship to Other Stories

| Story | Fields Removed | Status |
|-------|----------------|--------|
| 44.36 | `box_type`, `turnover_days` | Ready for Dev |
| 44.37 | `warehouse_id`, `logistics_coefficient`, `storage_coefficient`, `delivery_date`, `weight_exceeds_25kg`, `localization_index` | Ready for Dev |
| **Total** | **8 fields** | Both must be implemented together |

## Definition of Done

- [ ] All acceptance criteria (AC1-AC11) met
- [ ] All unit tests pass (`npm test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code reviewed and approved
- [ ] Manual testing completed with Network tab verification
- [ ] Merged to main branch

## References

- **Epic 44 Documentation**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.27**: `docs/stories/epic-44/story-44.27-fe-warehouse-integration.md`
- **Story 44.32**: `docs/stories/epic-44/story-44.32-fe-missing-price-calc-fields.md`
- **Story 44.36**: `docs/stories/epic-44/story-44.36-fe-bugfix-api-field-mismatch.md`
- **Backend Request**: `docs/request-backend/100-epic-44-open-issues-consolidated.md`
- **API Contract**: `test-api/15-price-calculator.http`
