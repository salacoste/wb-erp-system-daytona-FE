/**
 * TDD Tests for Story 44.37-FE: Bug Fix - API Field Mismatch (Warehouse & Additional Fields)
 *
 * These tests verify that the toApiRequest function does NOT include
 * 6 unsupported fields in the API request:
 * - warehouse_id
 * - logistics_coefficient
 * - storage_coefficient
 * - delivery_date
 * - weight_exceeds_25kg
 * - localization_index
 *
 * TDD RED PHASE: These tests WILL FAIL until the bug is fixed by removing
 * these fields from the toApiRequest function (lines 64-92).
 *
 * @see docs/stories/epic-44/story-44.37-fe-bugfix-api-warehouse-fields.md
 */

import { describe, it, expect } from 'vitest'
import { toApiRequest } from '../priceCalculatorUtils'
import type { FormData } from '../usePriceCalculatorForm'
import { defaultFormValues } from '../usePriceCalculatorForm'

// ============================================================================
// Test Fixtures
// ============================================================================

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
    ...overrides,
  }
}

function createFboFormData(overrides: Partial<FormData> = {}): FormData {
  return createValidFormData({
    fulfillment_type: 'FBO',
    ...overrides,
  })
}

function createFbsFormData(overrides: Partial<FormData> = {}): FormData {
  return createValidFormData({
    fulfillment_type: 'FBS',
    storage_rub: 0,
    ...overrides,
  })
}

// ============================================================================
// Story 44.37-FE: API Field Mismatch - Warehouse & Additional Fields
// ============================================================================

describe('Story 44.37-FE: API Field Mismatch Bug Fix', () => {
  // --------------------------------------------------------------------------
  // AC1: API request does NOT contain warehouse_id field
  // --------------------------------------------------------------------------
  describe('AC1: warehouse_id field exclusion', () => {
    it('should NOT include warehouse_id even when warehouse is selected', () => {
      const formData = createValidFormData({ warehouse_id: 507 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('warehouse_id')
    })

    it('should NOT include warehouse_id with various warehouse IDs', () => {
      const warehouseIds = [1, 100, 507, 999, 12345]

      for (const id of warehouseIds) {
        const formData = createValidFormData({ warehouse_id: id })
        const request = toApiRequest(formData)

        expect(request).not.toHaveProperty('warehouse_id')
      }
    })

    it('should NOT include warehouse_id for FBO fulfillment', () => {
      const formData = createFboFormData({ warehouse_id: 507 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('warehouse_id')
    })

    it('should NOT include warehouse_id for FBS fulfillment', () => {
      const formData = createFbsFormData({ warehouse_id: 507 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('warehouse_id')
    })
  })

  // --------------------------------------------------------------------------
  // AC2: API request does NOT contain logistics_coefficient field
  // --------------------------------------------------------------------------
  describe('AC2: logistics_coefficient field exclusion', () => {
    it('should NOT include logistics_coefficient even when not 1.0', () => {
      const formData = createValidFormData({ logistics_coefficient: 1.5 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('logistics_coefficient')
    })

    it('should NOT include logistics_coefficient with various values', () => {
      const coefficients = [0.5, 0.8, 1.2, 1.5, 2.0, 3.0]

      for (const coef of coefficients) {
        const formData = createValidFormData({ logistics_coefficient: coef })
        const request = toApiRequest(formData)

        expect(request).not.toHaveProperty('logistics_coefficient')
      }
    })

    it('should NOT include logistics_coefficient when == 1.0 (default)', () => {
      const formData = createValidFormData({ logistics_coefficient: 1.0 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('logistics_coefficient')
    })
  })

  // --------------------------------------------------------------------------
  // AC3: API request does NOT contain storage_coefficient field
  // --------------------------------------------------------------------------
  describe('AC3: storage_coefficient field exclusion', () => {
    it('should NOT include storage_coefficient for FBO even when not 1.0', () => {
      const formData = createFboFormData({ storage_coefficient: 1.3 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('storage_coefficient')
    })

    it('should NOT include storage_coefficient for FBS', () => {
      const formData = createFbsFormData({ storage_coefficient: 1.3 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('storage_coefficient')
    })

    it('should NOT include storage_coefficient with various values', () => {
      const coefficients = [0.5, 0.8, 1.2, 1.5, 2.0]

      for (const coef of coefficients) {
        const formData = createFboFormData({ storage_coefficient: coef })
        const request = toApiRequest(formData)

        expect(request).not.toHaveProperty('storage_coefficient')
      }
    })

    it('should NOT include storage_coefficient when == 1.0 (default)', () => {
      const formData = createFboFormData({ storage_coefficient: 1.0 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('storage_coefficient')
    })
  })

  // --------------------------------------------------------------------------
  // AC4: API request does NOT contain delivery_date field
  // --------------------------------------------------------------------------
  describe('AC4: delivery_date field exclusion', () => {
    it('should NOT include delivery_date even when date is selected', () => {
      const formData = createValidFormData({ delivery_date: '2026-01-25' })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('delivery_date')
    })

    it('should NOT include delivery_date with various dates', () => {
      const dates = ['2026-01-01', '2026-06-15', '2026-12-31', '2027-01-01']

      for (const date of dates) {
        const formData = createValidFormData({ delivery_date: date })
        const request = toApiRequest(formData)

        expect(request).not.toHaveProperty('delivery_date')
      }
    })

    it('should NOT include delivery_date when null (default)', () => {
      const formData = createValidFormData({ delivery_date: null })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('delivery_date')
    })
  })

  // --------------------------------------------------------------------------
  // AC5: API request does NOT contain weight_exceeds_25kg field
  // --------------------------------------------------------------------------
  describe('AC5: weight_exceeds_25kg field exclusion', () => {
    it('should NOT include weight_exceeds_25kg even when true', () => {
      const formData = createValidFormData({ weight_exceeds_25kg: true })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('weight_exceeds_25kg')
    })

    it('should NOT include weight_exceeds_25kg when false (default)', () => {
      const formData = createValidFormData({ weight_exceeds_25kg: false })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('weight_exceeds_25kg')
    })

    it('should NOT include weight_exceeds_25kg for FBO', () => {
      const formData = createFboFormData({ weight_exceeds_25kg: true })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('weight_exceeds_25kg')
    })

    it('should NOT include weight_exceeds_25kg for FBS', () => {
      const formData = createFbsFormData({ weight_exceeds_25kg: true })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('weight_exceeds_25kg')
    })
  })

  // --------------------------------------------------------------------------
  // AC6: API request does NOT contain localization_index field
  // --------------------------------------------------------------------------
  describe('AC6: localization_index field exclusion', () => {
    it('should NOT include localization_index even when not 1.0', () => {
      const formData = createValidFormData({ localization_index: 1.5 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('localization_index')
    })

    it('should NOT include localization_index with various values', () => {
      const indexes = [0.8, 1.2, 1.5, 1.8, 2.0]

      for (const idx of indexes) {
        const formData = createValidFormData({ localization_index: idx })
        const request = toApiRequest(formData)

        expect(request).not.toHaveProperty('localization_index')
      }
    })

    it('should NOT include localization_index when == 1.0 (default)', () => {
      const formData = createValidFormData({ localization_index: 1.0 })

      const request = toApiRequest(formData)

      expect(request).not.toHaveProperty('localization_index')
    })
  })

  // --------------------------------------------------------------------------
  // AC7: Required fields still present in API request
  // --------------------------------------------------------------------------
  describe('AC7: Required fields preserved', () => {
    it('should still include all required API fields', () => {
      const formData = createValidFormData({
        warehouse_id: 507,
        logistics_coefficient: 1.5,
        storage_coefficient: 1.3,
        delivery_date: '2026-01-25',
        weight_exceeds_25kg: true,
        localization_index: 1.8,
      })

      const request = toApiRequest(formData)

      // Required fields MUST be present
      expect(request).toHaveProperty('target_margin_pct')
      expect(request).toHaveProperty('cogs_rub')
      expect(request).toHaveProperty('logistics_forward_rub')
      expect(request).toHaveProperty('logistics_reverse_rub')
      expect(request).toHaveProperty('buyback_pct')
      expect(request).toHaveProperty('advertising_pct')
      expect(request).toHaveProperty('storage_rub')
      expect(request).toHaveProperty('vat_pct')
      expect(request).toHaveProperty('acquiring_pct')
    })

    it('should produce request with only allowed fields', () => {
      const formData = createFboFormData({
        warehouse_id: 507,
        logistics_coefficient: 1.5,
        storage_coefficient: 1.3,
        delivery_date: '2026-01-25',
        weight_exceeds_25kg: true,
        localization_index: 1.8,
      })

      const request = toApiRequest(formData)

      // All 6 fields from Story 44.37 should NOT be in request
      const story37Fields = [
        'warehouse_id',
        'logistics_coefficient',
        'storage_coefficient',
        'delivery_date',
        'weight_exceeds_25kg',
        'localization_index',
      ]

      for (const field of story37Fields) {
        expect(request).not.toHaveProperty(field)
      }
    })
  })

  // --------------------------------------------------------------------------
  // AC8: UI fields still work (form data preserved)
  // --------------------------------------------------------------------------
  describe('AC8: Frontend-only fields still work in form', () => {
    it('should preserve warehouse_id in form data for UI display', () => {
      const formData = createValidFormData({ warehouse_id: 507 })

      expect(formData.warehouse_id).toBe(507)

      // But NOT sent to API
      const request = toApiRequest(formData)
      expect(request).not.toHaveProperty('warehouse_id')
    })

    it('should preserve logistics_coefficient in form data', () => {
      const formData = createValidFormData({ logistics_coefficient: 1.5 })

      expect(formData.logistics_coefficient).toBe(1.5)

      const request = toApiRequest(formData)
      expect(request).not.toHaveProperty('logistics_coefficient')
    })

    it('should preserve all 6 fields in form data but not in API', () => {
      const formData = createValidFormData({
        warehouse_id: 507,
        logistics_coefficient: 1.5,
        storage_coefficient: 1.3,
        delivery_date: '2026-01-25',
        weight_exceeds_25kg: true,
        localization_index: 1.8,
      })

      // All fields present in form
      expect(formData.warehouse_id).toBe(507)
      expect(formData.logistics_coefficient).toBe(1.5)
      expect(formData.storage_coefficient).toBe(1.3)
      expect(formData.delivery_date).toBe('2026-01-25')
      expect(formData.weight_exceeds_25kg).toBe(true)
      expect(formData.localization_index).toBe(1.8)

      // None in API request
      const request = toApiRequest(formData)
      expect(request).not.toHaveProperty('warehouse_id')
      expect(request).not.toHaveProperty('logistics_coefficient')
      expect(request).not.toHaveProperty('storage_coefficient')
      expect(request).not.toHaveProperty('delivery_date')
      expect(request).not.toHaveProperty('weight_exceeds_25kg')
      expect(request).not.toHaveProperty('localization_index')
    })
  })

  // --------------------------------------------------------------------------
  // Combined with Story 44.36: All 8 invalid fields excluded
  // --------------------------------------------------------------------------
  describe('Combined: All 8 invalid fields excluded (Stories 44.36 + 44.37)', () => {
    it('should exclude all 8 fields that backend rejects', () => {
      const formData: FormData = {
        ...defaultFormValues,
        cogs_rub: 1000,
        logistics_forward_rub: 200,
        logistics_reverse_rub: 150,
        target_margin_pct: 20,
        buyback_pct: 95,
        advertising_pct: 5,
        storage_rub: 50,
        // Story 44.36 fields
        box_type: 5,
        turnover_days: 45,
        // Story 44.37 fields
        warehouse_id: 507,
        logistics_coefficient: 1.5,
        storage_coefficient: 1.3,
        delivery_date: '2026-01-25',
        weight_exceeds_25kg: true,
        localization_index: 1.8,
      }

      const request = toApiRequest(formData)

      // All 8 fields should NOT be present
      const rejectedFields = [
        // Story 44.36
        'box_type',
        'turnover_days',
        // Story 44.37
        'warehouse_id',
        'logistics_coefficient',
        'storage_coefficient',
        'delivery_date',
        'weight_exceeds_25kg',
        'localization_index',
      ]

      for (const field of rejectedFields) {
        expect(request).not.toHaveProperty(field)
      }

      // Also should NOT include fulfillment_type
      expect(request).not.toHaveProperty('fulfillment_type')
    })
  })
})
