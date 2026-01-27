/**
 * TDD Tests for Story 44.36-FE: Bug Fix - API Field Mismatch (box_type, turnover_days)
 *
 * These tests verify that the toApiRequest function does NOT include
 * `box_type` and `turnover_days` fields in the API request, as these
 * fields are not supported by the backend API and cause 400 Bad Request.
 *
 * TDD RED PHASE: These tests WILL FAIL until the bug is fixed by removing
 * box_type and turnover_days from the toApiRequest function.
 *
 * Bug Root Cause (lines 77-82 in priceCalculatorUtils.ts):
 * ```typescript
 * if (data.fulfillment_type === 'FBO') {
 *   baseRequest.box_type = data.box_type        // REJECTED BY BACKEND
 *   baseRequest.turnover_days = data.turnover_days  // REJECTED BY BACKEND
 * }
 * ```
 *
 * Backend Error Response:
 * - "property box_type should not exist"
 * - "property turnover_days should not exist"
 *
 * @see docs/stories/epic-44/story-44.36-fe-bugfix-api-field-mismatch.md
 */

import { describe, it, expect } from 'vitest'
import { toApiRequest, toTwoLevelFormData, isFormEmpty } from '../priceCalculatorUtils'
import type { FormData } from '../usePriceCalculatorForm'
import { defaultFormValues } from '../usePriceCalculatorForm'

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a valid form data object for testing
 * All fields are populated with realistic values
 */
function createValidFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...defaultFormValues,
    cogs_rub: 1000,
    logistics_forward_rub: 200,
    logistics_reverse_rub: 150,
    target_margin_pct: 20,
    buyback_pct: 95,
    advertising_pct: 5,
    storage_rub: 50,
    vat_pct: 20,
    acquiring_pct: 2,
    ...overrides,
  }
}

/**
 * Create FBO-specific form data with box_type and turnover_days set
 */
function createFboFormData(overrides: Partial<FormData> = {}): FormData {
  return createValidFormData({
    fulfillment_type: 'FBO',
    box_type: 'pallet',
    turnover_days: 45,
    weight_exceeds_25kg: true,
    localization_index: 1.5,
    ...overrides,
  })
}

/**
 * Create FBS-specific form data
 */
function createFbsFormData(overrides: Partial<FormData> = {}): FormData {
  return createValidFormData({
    fulfillment_type: 'FBS',
    storage_rub: 0, // FBS has no storage
    ...overrides,
  })
}

// ============================================================================
// Story 44.36-FE: API Field Mismatch Tests
// ============================================================================

describe('Story 44.36-FE: API Field Mismatch Bug Fix', () => {
  // --------------------------------------------------------------------------
  // AC1: API request does NOT contain box_type field
  // --------------------------------------------------------------------------
  describe('AC1: box_type field exclusion', () => {
    it('should NOT include box_type in API request for FBO', () => {
      const formData = createFboFormData({ box_type: 'pallet' })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('box_type')
    })

    it('should NOT include box_type in API request for FBS', () => {
      const formData = createFbsFormData()

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('box_type')
    })

    it('should NOT include box_type with default value "box"', () => {
      const formData = createFboFormData({ box_type: 'box' })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('box_type')
    })

    it('should NOT include box_type regardless of fulfillment type', () => {
      const fboRequest = toApiRequest(createFboFormData())
      const fbsRequest = toApiRequest(createFbsFormData())

      expect(fboRequest).not.toHaveProperty('box_type')
      expect(fbsRequest).not.toHaveProperty('box_type')
    })
  })

  // --------------------------------------------------------------------------
  // AC2: API request does NOT contain turnover_days field
  // --------------------------------------------------------------------------
  describe('AC2: turnover_days field exclusion', () => {
    it('should NOT include turnover_days in API request for FBO', () => {
      const formData = createFboFormData({ turnover_days: 45 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('turnover_days')
    })

    it('should NOT include turnover_days in API request for FBS', () => {
      const formData = createFbsFormData()

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('turnover_days')
    })

    it('should NOT include turnover_days with default value 20', () => {
      const formData = createFboFormData({ turnover_days: 20 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('turnover_days')
    })

    it('should NOT include turnover_days with custom values', () => {
      const testValues = [0, 7, 14, 30, 60, 90, 180]

      for (const days of testValues) {
        const formData = createFboFormData({ turnover_days: days })
        const request = toApiRequest(formData)

        expect(request).not.toHaveProperty('turnover_days')
      }
    })
  })

  // --------------------------------------------------------------------------
  // AC3: Price calculation API call returns 200 success
  // (This is an integration test - we verify the request structure is correct)
  // --------------------------------------------------------------------------
  describe('AC3: Valid API Request Structure', () => {
    it('should produce a valid API request without rejected fields', () => {
      const formData = createFboFormData({
        box_type: 'pallet',
        turnover_days: 45,
      })

      const request = toApiRequest(formData)

      // Should NOT have rejected fields
      expect(request).not.toHaveProperty('box_type')
      expect(request).not.toHaveProperty('turnover_days')

      // Should have all required fields
      expect(request).toHaveProperty('target_margin_pct')
      expect(request).toHaveProperty('cogs_rub')
      expect(request).toHaveProperty('logistics_forward_rub')
      expect(request).toHaveProperty('logistics_reverse_rub')
      expect(request).toHaveProperty('buyback_pct')
      expect(request).toHaveProperty('advertising_pct')
      expect(request).toHaveProperty('storage_rub')
    })

    it('should produce request matching backend DTO schema', () => {
      const formData = createValidFormData()
      const request = toApiRequest(formData)

      // Allowed fields per backend API (Epic 43)
      const allowedFields = [
        'target_margin_pct',
        'cogs_rub',
        'logistics_forward_rub',
        'logistics_reverse_rub',
        'buyback_pct',
        'advertising_pct',
        'storage_rub',
        'vat_pct',
        'acquiring_pct',
        'commission_pct',
        'warehouse_id',
        'logistics_coefficient',
        'storage_coefficient',
        'delivery_date',
        'weight_exceeds_25kg',
        'localization_index',
        'overrides',
      ]

      // Rejected fields per backend API
      const rejectedFields = ['box_type', 'turnover_days', 'fulfillment_type']

      // Check no rejected fields
      for (const field of rejectedFields) {
        expect(request).not.toHaveProperty(field)
      }

      // All fields in request should be allowed
      for (const key of Object.keys(request)) {
        expect(allowedFields).toContain(key)
      }
    })
  })

  // --------------------------------------------------------------------------
  // AC4: All required fields are still present in the request
  // --------------------------------------------------------------------------
  describe('AC4: Required Fields Preserved', () => {
    it('should include target_margin_pct in request', () => {
      const formData = createValidFormData({ target_margin_pct: 25 })
      const request = toApiRequest(formData)

      expect(request.target_margin_pct).toBe(25)
    })

    it('should include cogs_rub in request', () => {
      const formData = createValidFormData({ cogs_rub: 1500 })
      const request = toApiRequest(formData)

      expect(request.cogs_rub).toBe(1500)
    })

    it('should include logistics fields in request', () => {
      const formData = createValidFormData({
        logistics_forward_rub: 300,
        logistics_reverse_rub: 200,
      })
      const request = toApiRequest(formData)

      expect(request.logistics_forward_rub).toBe(300)
      expect(request.logistics_reverse_rub).toBe(200)
    })

    it('should include buyback_pct in request', () => {
      const formData = createValidFormData({ buyback_pct: 98 })
      const request = toApiRequest(formData)

      expect(request.buyback_pct).toBe(98)
    })

    it('should include advertising_pct in request', () => {
      const formData = createValidFormData({ advertising_pct: 8 })
      const request = toApiRequest(formData)

      expect(request.advertising_pct).toBe(8)
    })

    it('should include storage_rub for FBO', () => {
      const formData = createFboFormData({ storage_rub: 100 })
      const request = toApiRequest(formData)

      expect(request.storage_rub).toBe(100)
    })

    it('should set storage_rub to 0 for FBS', () => {
      const formData = createFbsFormData({ storage_rub: 100 })
      const request = toApiRequest(formData)

      expect(request.storage_rub).toBe(0)
    })

    it('should include vat_pct in request', () => {
      const formData = createValidFormData({ vat_pct: 20 })
      const request = toApiRequest(formData)

      expect(request.vat_pct).toBe(20)
    })

    it('should include acquiring_pct in request', () => {
      const formData = createValidFormData({ acquiring_pct: 2.5 })
      const request = toApiRequest(formData)

      expect(request.acquiring_pct).toBe(2.5)
    })
  })

  // --------------------------------------------------------------------------
  // AC5: UI fields for box_type and turnover_days still work (frontend only)
  // (Verified by checking form data structure, not API request)
  // --------------------------------------------------------------------------
  describe('AC5: Frontend-Only Fields Still Work', () => {
    it('should have box_type in FormData type', () => {
      const formData = createFboFormData({ box_type: 'pallet' })

      // Form data should still have box_type for UI
      expect(formData.box_type).toBe('pallet')
    })

    it('should have turnover_days in FormData type', () => {
      const formData = createFboFormData({ turnover_days: 30 })

      // Form data should still have turnover_days for UI
      expect(formData.turnover_days).toBe(30)
    })

    it('should preserve box_type and turnover_days in form state', () => {
      const formData = createFboFormData({
        box_type: 'pallet',
        turnover_days: 60,
      })

      // Fields exist in form data
      expect(formData).toHaveProperty('box_type', 'pallet')
      expect(formData).toHaveProperty('turnover_days', 60)

      // But NOT sent to API
      const request = toApiRequest(formData)
      expect(request).not.toHaveProperty('box_type')
      expect(request).not.toHaveProperty('turnover_days')
    })
  })

  // --------------------------------------------------------------------------
  // AC6: Supported Optional Fields Still Sent
  // --------------------------------------------------------------------------
  describe('AC6: Supported Optional Fields Still Sent', () => {
    // Story 44.37: warehouse_id, logistics_coefficient, storage_coefficient,
    // delivery_date, weight_exceeds_25kg, localization_index were ALL removed
    // from API request as backend does not support them yet.
    // Only commission_pct and overrides are currently supported.

    it('should NOT include warehouse_id (backend not supported)', () => {
      const formData = createValidFormData({ warehouse_id: 123 })
      const request = toApiRequest(formData)

      // Story 44.37: Backend does not support warehouse_id yet
      expect(request).not.toHaveProperty('warehouse_id')
    })

    it('should NOT include logistics_coefficient (backend not supported)', () => {
      const formData = createValidFormData({ logistics_coefficient: 1.5 })
      const request = toApiRequest(formData)

      // Story 44.37: Backend does not support logistics_coefficient yet
      expect(request).not.toHaveProperty('logistics_coefficient')
    })

    it('should NOT include storage_coefficient for FBO (backend not supported)', () => {
      const formData = createFboFormData({ storage_coefficient: 1.3 })
      const request = toApiRequest(formData)

      // Story 44.37: Backend does not support storage_coefficient yet
      expect(request).not.toHaveProperty('storage_coefficient')
    })

    it('should NOT include storage_coefficient for FBS', () => {
      const formData = createFbsFormData({ storage_coefficient: 1.3 })
      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('storage_coefficient')
    })

    it('should NOT include delivery_date (backend not supported)', () => {
      const formData = createValidFormData({ delivery_date: '2026-01-25' })
      const request = toApiRequest(formData)

      // Story 44.37: Backend does not support delivery_date yet
      expect(request).not.toHaveProperty('delivery_date')
    })

    it('should NOT include weight_exceeds_25kg (backend not supported)', () => {
      const formData = createValidFormData({ weight_exceeds_25kg: true })
      const request = toApiRequest(formData)

      // Story 44.37: Backend does not support weight_exceeds_25kg yet
      expect(request).not.toHaveProperty('weight_exceeds_25kg')
    })

    it('should NOT include localization_index (backend not supported)', () => {
      const formData = createValidFormData({ localization_index: 1.8 })
      const request = toApiRequest(formData)

      // Story 44.37: Backend does not support localization_index yet
      expect(request).not.toHaveProperty('localization_index')
    })

    it('should include commission_pct when defined', () => {
      const formData = createValidFormData({ commission_pct: 8.5 })
      const request = toApiRequest(formData)

      expect(request.commission_pct).toBe(8.5)
    })

    it('should include overrides with nm_id when defined', () => {
      const formData = createValidFormData({ nm_id: '147205694' })
      const request = toApiRequest(formData)

      expect(request.overrides).toBeDefined()
      expect(request.overrides?.nm_id).toBe('147205694')
    })
  })
})

// ============================================================================
// Utility Function Tests (Non-Regression)
// ============================================================================

describe('priceCalculatorUtils: Non-Regression Tests', () => {
  describe('isFormEmpty', () => {
    it('should return true for default form values', () => {
      const emptyForm: FormData = {
        ...defaultFormValues,
        target_margin_pct: 0,
        cogs_rub: 0,
        logistics_forward_rub: 0,
        logistics_reverse_rub: 0,
        buyback_pct: 0,
        advertising_pct: 0,
        storage_rub: 0,
      }

      expect(isFormEmpty(emptyForm)).toBe(true)
    })

    it('should return false when any field has value', () => {
      const formWithValue = createValidFormData({ cogs_rub: 100 })

      expect(isFormEmpty(formWithValue)).toBe(false)
    })
  })

  describe('toTwoLevelFormData', () => {
    it('should convert FormData to TwoLevelPricingFormData', () => {
      const formData = createFboFormData({
        cogs_rub: 1000,
        drr_pct: 5,
        spp_pct: 10,
      })

      const result = toTwoLevelFormData(formData)

      expect(result.fulfillment_type).toBe('FBO')
      expect(result.cogs_rub).toBe(1000)
      expect(result.drr_pct).toBe(5)
      expect(result.spp_pct).toBe(10)
    })

    it('should set storage_rub to 0 for FBS', () => {
      const formData = createFbsFormData({ storage_rub: 100 })

      const result = toTwoLevelFormData(formData)

      expect(result.storage_rub).toBe(0)
    })
  })
})

// ============================================================================
// Complete Request Snapshot Test
// ============================================================================

describe('API Request Snapshot', () => {
  it('should produce expected request structure without rejected fields', () => {
    const formData: FormData = {
      fulfillment_type: 'FBO',
      category_id: 123,
      target_margin_pct: 20,
      cogs_rub: 1000,
      logistics_forward_rub: 200,
      logistics_reverse_rub: 150,
      buyback_pct: 95,
      advertising_pct: 5,
      drr_pct: 5,
      spp_pct: 10,
      tax_rate_pct: 6,
      tax_type: 'income',
      is_vat_payer: true, // Story 44.XX: VAT payer status
      storage_rub: 50,
      vat_pct: 20,
      acquiring_pct: 2,
      commission_pct: 8,
      nm_id: '147205694',
      length_cm: 30,
      width_cm: 20,
      height_cm: 10,
      warehouse_id: 456,
      warehouse_name: 'Коледино',
      logistics_coefficient: 1.2,
      storage_coefficient: 1.1,
      delivery_date: '2026-01-25',
      box_type: 'pallet', // Should NOT be in API request
      weight_exceeds_25kg: true,
      localization_index: 1.5,
      turnover_days: 45, // Should NOT be in API request
      units_per_package: 10, // Story 44.38: Should NOT be in API request
      acceptance_cost: 5.5, // Story 44.XX: Should NOT be in API request
      packaging_rub: 100, // Story 44.50: Should NOT be in API request
      logistics_to_mp_rub: 500, // Story 44.50: Should NOT be in API request
    }

    const request = toApiRequest(formData)

    // Story 44.36/44.37: Verify ALL unsupported fields are NOT present
    // These fields are kept in form state for UI but not sent to backend
    expect(request).not.toHaveProperty('box_type')
    expect(request).not.toHaveProperty('turnover_days')
    expect(request).not.toHaveProperty('fulfillment_type')
    expect(request).not.toHaveProperty('warehouse_id')
    expect(request).not.toHaveProperty('logistics_coefficient')
    expect(request).not.toHaveProperty('storage_coefficient')
    expect(request).not.toHaveProperty('delivery_date')
    expect(request).not.toHaveProperty('weight_exceeds_25kg')
    expect(request).not.toHaveProperty('localization_index')
    expect(request).not.toHaveProperty('units_per_package') // Story 44.38
    expect(request).not.toHaveProperty('packaging_rub') // Story 44.50
    expect(request).not.toHaveProperty('logistics_to_mp_rub') // Story 44.50

    // Verify only supported fields are sent to backend
    expect(request).toEqual({
      target_margin_pct: 20,
      cogs_rub: 1000,
      logistics_forward_rub: 200,
      logistics_reverse_rub: 150,
      buyback_pct: 95,
      advertising_pct: 5,
      storage_rub: 50,
      vat_pct: 20,
      acquiring_pct: 2,
      commission_pct: 8,
      overrides: { nm_id: '147205694' },
    })
  })
})
