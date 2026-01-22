# Story 44.36-FE: Bug Fix - API Field Mismatch (box_type, turnover_days)

## Overview

| Field | Value |
|-------|-------|
| **Story ID** | 44.36-FE |
| **Epic** | Epic 44 - Price Calculator UI |
| **Type** | Bugfix |
| **Priority** | P0 - Critical |
| **Story Points** | 2 SP |
| **Status** | Ready for Dev |

## Description

All Price Calculator API calls fail with 400 Bad Request because the frontend sends `box_type` and `turnover_days` fields that the backend API doesn't accept. These fields were added in Story 44.32 but the backend API contract was not updated to support them. This bug completely blocks the core Price Calculator functionality.

## Bug Report

### Reproduction Steps
1. Navigate to `/cogs/price-calculator`
2. Fill out the Price Calculator form with valid data:
   - Target margin: 20%
   - COGS: 1000
   - Forward logistics: 200
   - Reverse logistics: 150
   - Buyback: 95%
3. Click "Calculate" button

### Expected Behavior
- API call succeeds
- Price calculation results are displayed
- Cost breakdown shows recommended price

### Actual Behavior
- API call fails with 400 Bad Request
- Error message displayed to user
- No calculation results

### Error Details
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [
      {
        "field": "property",
        "issue": "box_type should not exist",
        "message": "property box_type should not exist"
      },
      {
        "field": "property",
        "issue": "turnover_days should not exist",
        "message": "property turnover_days should not exist"
      }
    ],
    "trace_id": "e16fafe7-24b2-412d-989b-dca36ba6c656",
    "timestamp": "2026-01-21T23:54:23.097Z",
    "path": "/v1/products/price-calculator"
  }
}
```

### Network Request Analysis
**Request sent by frontend:**
```json
{
  "target_margin_pct": 20,
  "cogs_rub": 1000,
  "logistics_forward_rub": 200,
  "logistics_reverse_rub": 150,
  "buyback_pct": 95,
  "advertising_pct": 5,
  "storage_rub": 50,
  "vat_pct": 20,
  "acquiring_pct": 2,
  "box_type": "box",         // <-- REJECTED BY BACKEND
  "turnover_days": 20        // <-- REJECTED BY BACKEND
}
```

### Severity Assessment
- **User Impact**: CRITICAL - No price calculations can be performed
- **Frequency**: 100% of all API calls fail
- **Workaround**: None - feature is completely broken

## Technical Analysis

### Root Cause
Story 44.32 added `box_type` and `turnover_days` fields to the frontend types and form, but these fields were not part of the agreed backend API contract. The backend DTO validation rejects unknown properties.

### Frontend/Backend Contract Mismatch

| Field | Frontend Type | Frontend Code | Backend Status |
|-------|---------------|---------------|----------------|
| `box_type` | `BoxType` ('box' \| 'pallet') | Sent in request | NOT ACCEPTED |
| `turnover_days` | `number` | Sent in request | NOT ACCEPTED |

### Affected Files

| File | Line(s) | Issue |
|------|---------|-------|
| `src/components/custom/price-calculator/priceCalculatorUtils.ts` | 80-82 | Includes `box_type` and `turnover_days` in API request |
| `src/types/price-calculator.ts` | 157, 172 | Defines `box_type` and `turnover_days` in `PriceCalculatorRequest` |

### Code Analysis

**priceCalculatorUtils.ts (lines 77-82):**
```typescript
// Story 44.32: Phase 1 HIGH priority fields
// Only send box_type and turnover_days for FBO
if (data.fulfillment_type === 'FBO') {
  baseRequest.box_type = data.box_type        // <-- PROBLEM
  baseRequest.turnover_days = data.turnover_days  // <-- PROBLEM
}
```

**price-calculator.ts (lines 153-172):**
```typescript
export interface PriceCalculatorRequest {
  // ... other fields ...

  /**
   * Story 44.32: Box type for FBO (default: 'box')
   * Only applies to FBO fulfillment
   */
  box_type?: BoxType                           // <-- PROBLEM

  // ... other fields ...

  /**
   * Story 44.32: Turnover days in storage (FBO only, default: 20)
   * Total storage = storage_per_day × turnover_days
   */
  turnover_days?: number                       // <-- PROBLEM
}
```

## Solution Approach

### Option A: Remove Fields from API Request (Recommended)

Remove `box_type` and `turnover_days` from the API request until the backend implements support. Keep the fields in the form for UI purposes (future-proofing), but don't send them to the API.

**Changes to `priceCalculatorUtils.ts`:**
```typescript
export function toApiRequest(data: FormData): PriceCalculatorRequest {
  const baseRequest: PriceCalculatorRequest = {
    target_margin_pct: data.target_margin_pct,
    cogs_rub: data.cogs_rub,
    logistics_forward_rub: data.logistics_forward_rub,
    logistics_reverse_rub: data.logistics_reverse_rub,
    buyback_pct: data.buyback_pct,
    advertising_pct: data.advertising_pct,
    storage_rub: data.fulfillment_type === 'FBS' ? 0 : data.storage_rub,
    vat_pct: data.vat_pct,
    acquiring_pct: data.acquiring_pct,
    ...(data.commission_pct !== undefined && { commission_pct: data.commission_pct }),
    ...(data.nm_id !== undefined && { overrides: { nm_id: String(data.nm_id) } }),
  }

  // Story 44.27: Warehouse & Coefficients (these are supported by backend)
  if (data.warehouse_id !== null) {
    baseRequest.warehouse_id = data.warehouse_id
  }
  if (data.logistics_coefficient !== 1.0) {
    baseRequest.logistics_coefficient = data.logistics_coefficient
  }
  if (data.fulfillment_type === 'FBO' && data.storage_coefficient !== 1.0) {
    baseRequest.storage_coefficient = data.storage_coefficient
  }
  if (data.delivery_date !== null) {
    baseRequest.delivery_date = data.delivery_date
  }

  // Story 44.36: REMOVED box_type and turnover_days
  // These fields are not supported by backend API (Epic 43)
  // Keep in form for frontend calculations, but don't send to API
  // TODO: Add these back when backend Epic 45/46 implements support

  // Send weight_exceeds_25kg for both FBO and FBS (if supported)
  if (data.weight_exceeds_25kg) {
    baseRequest.weight_exceeds_25kg = true
  }

  // Send localization_index for both FBO and FBS (if supported)
  if (data.localization_index !== 1.0) {
    baseRequest.localization_index = data.localization_index
  }

  return baseRequest
}
```

### Option B: Request Backend API Update

Create a backend request to add `box_type` and `turnover_days` to the `/v1/products/price-calculator` endpoint. This is the proper long-term solution but requires backend changes.

**Backend request document already exists:** `docs/request-backend/95-epic-43-price-calculator-api.md`

### Option C: Remove Fields Entirely

Remove `box_type` and `turnover_days` from both types and UI components. This is too aggressive as these fields may be useful for frontend calculations even if not sent to API.

### Recommended Solution

**Option A (Immediate)** + **Option B (Follow-up)**

1. **Immediate fix**: Remove `box_type` and `turnover_days` from API request
2. **Follow-up**: Create backend request for Phase 2 to support these fields
3. **Keep UI components**: BoxTypeSelector and TurnoverDaysInput remain for frontend use

This allows:
- Immediate unblocking of Price Calculator functionality
- Preserving user-facing features for later backend integration
- Clean upgrade path when backend adds support

## Acceptance Criteria

- [ ] **AC1: API Call Succeeds**
  - Fill out Price Calculator form with valid data
  - Click "Calculate"
  - API call returns 200 OK
  - Calculation results are displayed

- [ ] **AC2: No Invalid Fields Sent**
  - Open Network tab in DevTools
  - Submit Price Calculator form
  - Verify request payload does NOT contain `box_type`
  - Verify request payload does NOT contain `turnover_days`

- [ ] **AC3: UI Components Still Work**
  - BoxTypeSelector is still visible and interactive for FBO
  - TurnoverDaysInput is still visible and interactive for FBO
  - Values are stored in form state

- [ ] **AC4: FBO Calculations Work**
  - Set fulfillment type to FBO
  - Fill all fields including box_type and turnover_days
  - Submit calculation
  - Results are displayed (storage calculated with frontend logic)

- [ ] **AC5: FBS Calculations Work**
  - Set fulfillment type to FBS
  - Fill required fields
  - Submit calculation
  - Results are displayed

- [ ] **AC6: Other Optional Fields Still Sent**
  - Verify `warehouse_id` is still sent when set
  - Verify `logistics_coefficient` is still sent when != 1.0
  - Verify `storage_coefficient` is still sent when != 1.0 (FBO only)
  - Verify `delivery_date` is still sent when set

## Test Plan

### Manual Testing

#### Test Case 1: Basic API Call
1. Navigate to `/cogs/price-calculator`
2. Enter:
   - Target margin: 20%
   - COGS: 1000
   - Forward logistics: 200
   - Reverse logistics: 150
   - Buyback: 95%
3. Click "Calculate"
4. **Verify**: Results are displayed (no 400 error)

#### Test Case 2: Network Request Verification
1. Open DevTools Network tab
2. Submit Price Calculator form
3. Click on the `/v1/products/price-calculator` request
4. View Request Payload
5. **Verify**: `box_type` is NOT in payload
6. **Verify**: `turnover_days` is NOT in payload
7. **Verify**: Other fields (cogs_rub, logistics, etc.) ARE in payload

#### Test Case 3: FBO with All Fields
1. Set fulfillment type to FBO
2. Select box type: "Monopallet"
3. Set turnover days: 45
4. Fill other required fields
5. Click "Calculate"
6. **Verify**: Calculation succeeds
7. **Verify**: Network request does not contain box_type/turnover_days

#### Test Case 4: Warehouse Fields Still Work
1. Set warehouse from dropdown
2. Verify coefficient fields populate
3. Submit calculation
4. **Verify**: Network request contains `warehouse_id`
5. **Verify**: Network request contains coefficients if != 1.0

### Automated Testing

- [ ] **Unit Test**: `priceCalculatorUtils.test.ts`
  ```typescript
  describe('toApiRequest', () => {
    it('should NOT include box_type in API request', () => {
      const formData = {
        ...defaultFormValues,
        fulfillment_type: 'FBO',
        box_type: 'pallet',
        cogs_rub: 1000,
      }

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('box_type')
    })

    it('should NOT include turnover_days in API request', () => {
      const formData = {
        ...defaultFormValues,
        fulfillment_type: 'FBO',
        turnover_days: 45,
        cogs_rub: 1000,
      }

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('turnover_days')
    })

    it('should still include warehouse_id when set', () => {
      const formData = {
        ...defaultFormValues,
        warehouse_id: 123,
        cogs_rub: 1000,
      }

      const request = toApiRequest(formData)

      expect(request.warehouse_id).toBe(123)
    })

    it('should still include logistics_coefficient when != 1.0', () => {
      const formData = {
        ...defaultFormValues,
        logistics_coefficient: 1.5,
        cogs_rub: 1000,
      }

      const request = toApiRequest(formData)

      expect(request.logistics_coefficient).toBe(1.5)
    })
  })
  ```

- [ ] **Integration Test**: `usePriceCalculator.test.ts`
  ```typescript
  it('should successfully call API without invalid fields', async () => {
    // Mock successful response
    server.use(
      rest.post('/v1/products/price-calculator', (req, res, ctx) => {
        const body = req.body
        // Verify no invalid fields
        expect(body).not.toHaveProperty('box_type')
        expect(body).not.toHaveProperty('turnover_days')
        return res(ctx.json(mockResponse))
      })
    )

    const { result } = renderHook(() => usePriceCalculator())

    await act(async () => {
      result.current.calculate(formData)
    })

    expect(result.current.data).toBeDefined()
  })
  ```

- [ ] **E2E Test**: `e2e/price-calculator.spec.ts`
  ```typescript
  test('Price calculation API call succeeds', async ({ page }) => {
    await page.goto('/cogs/price-calculator')

    // Fill form
    await page.getByLabel('Target margin').fill('20')
    await page.getByLabel('COGS').fill('1000')
    // ... fill other fields

    // Intercept API call
    const [request] = await Promise.all([
      page.waitForRequest('**/v1/products/price-calculator'),
      page.getByRole('button', { name: /Calculate/i }).click(),
    ])

    // Verify request body
    const body = request.postDataJSON()
    expect(body).not.toHaveProperty('box_type')
    expect(body).not.toHaveProperty('turnover_days')

    // Verify success
    await expect(page.getByTestId('price-calculator-results')).toBeVisible()
  })
  ```

## Technical Tasks

### Task 1: Remove Fields from API Request
**File:** `src/components/custom/price-calculator/priceCalculatorUtils.ts`
**Effort:** 0.5 SP

1. Remove lines 79-82 (box_type and turnover_days assignment)
2. Add TODO comment for future backend support
3. Keep weight_exceeds_25kg and localization_index (verify backend support)

**Before:**
```typescript
// Story 44.32: Phase 1 HIGH priority fields
// Only send box_type and turnover_days for FBO
if (data.fulfillment_type === 'FBO') {
  baseRequest.box_type = data.box_type
  baseRequest.turnover_days = data.turnover_days
}
```

**After:**
```typescript
// Story 44.36: REMOVED box_type and turnover_days from API request
// These fields are not yet supported by backend API (Epic 43)
// Keep in form state for frontend calculations only
// TODO: Re-enable when backend implements support (Epic 45/46)
// if (data.fulfillment_type === 'FBO') {
//   baseRequest.box_type = data.box_type
//   baseRequest.turnover_days = data.turnover_days
// }
```

### Task 2: Update Type Comments
**File:** `src/types/price-calculator.ts`
**Effort:** 0.5 SP

1. Update JSDoc comments for `box_type` and `turnover_days` to indicate frontend-only
2. Add `@internal` or `@frontend-only` annotation

**Example:**
```typescript
/**
 * Story 44.32: Box type for FBO (default: 'box')
 * Only applies to FBO fulfillment
 *
 * @frontend-only Currently NOT sent to API (backend doesn't support)
 * @todo Re-enable when backend Epic 45/46 implements support
 */
box_type?: BoxType
```

### Task 3: Add Unit Tests
**File:** `src/components/custom/price-calculator/__tests__/priceCalculatorUtils.test.ts`
**Effort:** 0.5 SP

1. Add tests verifying box_type not in request
2. Add tests verifying turnover_days not in request
3. Add tests verifying other fields still work

### Task 4: Update E2E Tests
**File:** `e2e/price-calculator.spec.ts`
**Effort:** 0.5 SP

1. Add test that verifies API success
2. Add request body validation

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/custom/price-calculator/priceCalculatorUtils.ts` | Remove box_type/turnover_days from toApiRequest |
| `src/types/price-calculator.ts` | Update JSDoc comments for frontend-only fields |
| `src/components/custom/price-calculator/__tests__/priceCalculatorUtils.test.ts` | Add tests for excluded fields |
| `e2e/price-calculator.spec.ts` | Add API success test |

## Definition of Done

- [ ] API calls succeed (no 400 errors)
- [ ] `box_type` and `turnover_days` are not sent to API
- [ ] UI components still work (values stored in form state)
- [ ] Other optional fields (warehouse_id, coefficients) still sent
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] No regression in existing functionality
- [ ] TypeScript strict mode passes
- [ ] Comments updated to reflect frontend-only status

## Related Stories

- Story 44.32-FE: Missing Price Calculator Fields (introduced these fields)
- Story 44.2-FE: Input Form Component (original form implementation)

## Backend Request

### Future Work Required
When backend support is needed, create request document:

**File:** `docs/request-backend/101-price-calculator-additional-fields.md`

**Content:**
```markdown
# Request: Add box_type and turnover_days to Price Calculator API

## Current State
- Frontend has UI for box_type (box/pallet) and turnover_days
- Backend rejects these fields with validation error

## Requested Changes
Add support for:
1. `box_type: 'box' | 'pallet'` - Affects logistics calculation
2. `turnover_days: number` - Multiplier for daily storage cost

## Business Logic
- box_type 'pallet' has ~500₽ fixed acceptance vs ~1.70₽/liter for 'box'
- turnover_days: total_storage = storage_per_day × turnover_days

## Priority
Medium - Frontend has workaround (fields used for frontend calculations only)
```

## Notes

### Why Not Remove UI Components?
The BoxTypeSelector and TurnoverDaysInput provide value for:
1. User awareness of cost factors
2. Future backend integration
3. Frontend-side calculations for two-level pricing

### Graceful Degradation
By removing fields from API but keeping in UI:
- Users see complete cost picture
- Frontend calculations can use values
- Easy to re-enable when backend supports

### Weight and Localization Fields
The fix KEEPS `weight_exceeds_25kg` and `localization_index` in the request. Verify with backend if these are supported. If they also cause 400 errors, remove them too.

## References

- Backend API spec: `docs/request-backend/95-epic-43-price-calculator-api.md`
- Story 44.32: `docs/stories/epic-44/story-44.32-fe-missing-price-calc-fields.md`
- API client: `src/lib/api/price-calculator.ts`
