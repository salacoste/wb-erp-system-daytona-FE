/**
 * Tariffs Normalizer Tests
 * Tests for normalizeCommissionsResponse, normalizeWarehousesResponse,
 * normalizeAcceptanceCoefficientsResponse, normalizeTariffSettings
 * from tariffs-normalizer.ts
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeCommissionsResponse,
  normalizeWarehousesResponse,
  normalizeAcceptanceCoefficientsResponse,
  normalizeTariffSettings,
} from '../tariffs-normalizer'

// --- normalizeCommissionsResponse ---

describe('normalizeCommissionsResponse', () => {
  it('normalizes a fully-populated commissions response', () => {
    const raw = {
      commissions: [
        {
          parentID: 1,
          parentName: 'Electronics',
          subjectID: 10,
          subjectName: 'Phones',
          paidStorageKgvp: 5.5,
          kgvpMarketplace: 10,
          kgvpSupplier: 8,
          kgvpSupplierExpress: 12,
        },
      ],
      meta: { total: 1, cached: true, cache_ttl_seconds: 3600, fetched_at: '2026-01-01T00:00:00Z' },
    }
    const result = normalizeCommissionsResponse(raw)
    expect(result.commissions).toHaveLength(1)
    expect(result.commissions[0].subjectName).toBe('Phones')
    expect(result.commissions[0].paidStorageKgvp).toBe(5.5)
    expect(result.meta.cached).toBe(true)
  })

  it('handles snake_case commission fields', () => {
    const raw = {
      commissions: [
        {
          parent_id: 2,
          parent_name: 'Clothing',
          subject_id: 20,
          subject_name: 'T-Shirts',
          paid_storage_kgvp: 3,
          kgvp_marketplace: 7,
          kgvp_supplier: 5,
          kgvp_supplier_express: 9,
        },
      ],
    }
    const result = normalizeCommissionsResponse(raw)
    expect(result.commissions[0].parentID).toBe(2)
    expect(result.commissions[0].subjectID).toBe(20)
    expect(result.commissions[0].paidStorageKgvp).toBe(3)
  })

  it('defaults commissions to empty array when missing', () => {
    const result = normalizeCommissionsResponse({})
    expect(result.commissions).toEqual([])
  })

  it('defaults meta total to commissions length when meta missing', () => {
    const raw = { commissions: [{ subjectID: 1 }] }
    const result = normalizeCommissionsResponse(raw)
    expect(result.meta.total).toBe(1)
    expect(result.meta.cached).toBe(false)
  })

  it('returns safe defaults for null/undefined raw', () => {
    const result = normalizeCommissionsResponse(null)
    expect(result.commissions).toEqual([])
    expect(result.meta.total).toBe(0)
  })
})

// --- normalizeWarehousesResponse ---

describe('normalizeWarehousesResponse', () => {
  it('normalizes a fully-populated warehouses response', () => {
    const raw = {
      warehouses: [
        {
          id: 1,
          name: 'Moscow Warehouse',
          address: 'Moscow, Pushkina St',
          city: 'Moscow',
          federalDistrict: 'Central',
          cargoType: 1,
          deliveryType: 2,
          latitude: 55.75,
          longitude: 37.62,
        },
      ],
      updated_at: '2026-03-15T00:00:00Z',
    }
    const result = normalizeWarehousesResponse(raw)
    expect(result.warehouses).toHaveLength(1)
    expect(result.warehouses[0].name).toBe('Moscow Warehouse')
    expect(result.warehouses[0].address).toBe('Moscow, Pushkina St')
    expect(result.warehouses[0].latitude).toBe(55.75)
    expect(result.updated_at).toBe('2026-03-15T00:00:00Z')
  })

  it('sets optional fields to undefined when null', () => {
    const raw = {
      warehouses: [{ id: 1, name: 'WH', address: null, city: null }],
      updated_at: 't',
    }
    const result = normalizeWarehousesResponse(raw)
    expect(result.warehouses[0].address).toBeUndefined()
    expect(result.warehouses[0].city).toBeUndefined()
  })

  it('sets optional fields to undefined when missing', () => {
    const raw = { warehouses: [{ id: 1, name: 'WH' }], updated_at: 't' }
    const wh = normalizeWarehousesResponse(raw).warehouses[0]
    expect(wh.address).toBeUndefined()
    expect(wh.cargoType).toBeUndefined()
    expect(wh.latitude).toBeUndefined()
  })

  it('defaults warehouses to empty array when missing', () => {
    expect(normalizeWarehousesResponse({}).warehouses).toEqual([])
  })

  it('defaults updated_at to empty string when missing', () => {
    expect(normalizeWarehousesResponse({ warehouses: [] }).updated_at).toBe('')
  })
})

// --- normalizeAcceptanceCoefficientsResponse ---

describe('normalizeAcceptanceCoefficientsResponse', () => {
  it('normalizes a fully-populated acceptance coefficients response', () => {
    const raw = {
      coefficients: [
        {
          warehouseId: 100,
          warehouseName: 'WH-100',
          date: '2026-06-01',
          coefficient: 1.5,
          isAvailable: true,
          allowUnload: true,
          boxTypeId: 1,
          boxTypeName: 'Small',
          delivery: { coefficient: 1, baseLiterRub: 50, additionalLiterRub: 10 },
          storage: { coefficient: 1, baseLiterRub: 30, additionalLiterRub: 5 },
          isSortingCenter: false,
        },
      ],
      meta: { total: 1, available: 1, unavailable: 0, cache_ttl_seconds: 1800 },
    }
    const result = normalizeAcceptanceCoefficientsResponse(raw)
    expect(result.coefficients).toHaveLength(1)
    expect(result.coefficients[0].warehouseName).toBe('WH-100')
    expect(result.coefficients[0].coefficient).toBe(1.5)
    expect(result.coefficients[0].isAvailable).toBe(true)
    expect(result.coefficients[0].delivery.baseLiterRub).toBe(50)
    expect(result.meta.available).toBe(1)
  })

  it('handles snake_case fields', () => {
    const raw = {
      coefficients: [
        {
          warehouse_id: 200,
          warehouse_name: 'WH-200',
          is_available: false,
          allow_unload: false,
          box_type_id: 3,
          box_type_name: 'Large',
          is_sorting_center: true,
          delivery: {},
          storage: {},
        },
      ],
    }
    const result = normalizeAcceptanceCoefficientsResponse(raw)
    expect(result.coefficients[0].warehouseId).toBe(200)
    expect(result.coefficients[0].isAvailable).toBe(false)
    expect(result.coefficients[0].isSortingCenter).toBe(true)
  })

  it('defaults delivery/storage coefficients to 1 and rates to 0', () => {
    const raw = { coefficients: [{}] }
    const coeff = normalizeAcceptanceCoefficientsResponse(raw).coefficients[0]
    expect(coeff.delivery.coefficient).toBe(1)
    expect(coeff.delivery.baseLiterRub).toBe(0)
    expect(coeff.storage.coefficient).toBe(1)
    expect(coeff.storage.baseLiterRub).toBe(0)
  })

  it('defaults coefficients to empty array when missing', () => {
    expect(normalizeAcceptanceCoefficientsResponse({}).coefficients).toEqual([])
  })
})

// --- normalizeTariffSettings ---

describe('normalizeTariffSettings', () => {
  it('normalizes a fully-populated tariff settings response', () => {
    const raw = {
      default_commission_fbo_pct: 15,
      default_commission_fbs_pct: 10,
      acceptance_box_rate_per_liter: 2.5,
      acceptance_pallet_rate: 50,
      logistics_volume_tiers: [
        { min: 0, max: 100, rate: 5 },
        { min: 100, max: 500, rate: 3 },
      ],
      logistics_large_first_liter_rate: 10,
      logistics_large_additional_liter_rate: 4,
      return_logistics_fbo_rate: 50,
      return_logistics_fbs_rate: 60,
      storage_free_days: 14,
      fbs_uses_fbo_logistics_rates: false,
      effective_from: '2026-01-01',
    }
    const result = normalizeTariffSettings(raw)
    expect(result.default_commission_fbo_pct).toBe(15)
    expect(result.logistics_volume_tiers).toHaveLength(2)
    expect(result.logistics_volume_tiers[0].rate).toBe(5)
    expect(result.storage_free_days).toBe(14)
    expect(result.effective_from).toBe('2026-01-01')
  })

  it('handles camelCase field names', () => {
    const raw = {
      defaultCommissionFboPct: 20,
      defaultCommissionFbsPct: 12,
      acceptanceBoxRatePerLiter: 3,
      acceptancePalletRate: 60,
      logisticsVolumeTiers: [{ min: 0, max: 50, rate: 8 }],
      logisticsLargeFirstLiterRate: 15,
      logisticsLargeAdditionalLiterRate: 5,
      returnLogisticsFboRate: 55,
      returnLogisticsFbsRate: 65,
      storageFreeDays: 7,
      fbsUsesFboLogisticsRates: true,
      effectiveFrom: '2026-06-01',
    }
    const result = normalizeTariffSettings(raw)
    expect(result.default_commission_fbo_pct).toBe(20)
    expect(result.logistics_volume_tiers).toHaveLength(1)
    expect(result.fbs_uses_fbo_logistics_rates).toBe(true)
  })

  it('defaults all numeric fields to 0 when missing', () => {
    const result = normalizeTariffSettings({})
    expect(result.default_commission_fbo_pct).toBe(0)
    expect(result.acceptance_box_rate_per_liter).toBe(0)
    expect(result.storage_free_days).toBe(0)
  })

  it('defaults logistics_volume_tiers to empty array when missing', () => {
    expect(normalizeTariffSettings({}).logistics_volume_tiers).toEqual([])
  })

  it('defaults fbs_uses_fbo_logistics_rates to false', () => {
    expect(normalizeTariffSettings({}).fbs_uses_fbo_logistics_rates).toBe(false)
  })

  it('returns safe defaults for null/undefined raw', () => {
    const result = normalizeTariffSettings(null)
    expect(result.effective_from).toBe('')
    expect(result.logistics_volume_tiers).toEqual([])
  })
})
