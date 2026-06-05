/**
 * Tariffs Box Normalizer Tests
 * Covers: null input, missing fields, empty arrays for both normalizers.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeBoxTariffsResponse,
  normalizeWarehousesWithTariffsResponse,
} from '../tariffs-box-normalizer'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRawWarehouse(overrides: Record<string, unknown> = {}) {
  return {
    id: 507,
    name: 'Коледино',
    federal_district: 'Москва',
    tariffs: {
      fbo: { delivery_base_rub: 48, delivery_liter_rub: 5, logistics_coefficient: 1.6 },
      fbs: { delivery_base_rub: 30, delivery_liter_rub: 3, logistics_coefficient: 1.2 },
      storage: { base_per_day_rub: 1, liter_per_day_rub: 0.5, coefficient: 1.45 },
    },
    ...overrides,
  }
}

function makeRawResponse(overrides: Record<string, unknown> = {}) {
  return {
    warehouses: [makeRawWarehouse()],
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// normalizeBoxTariffsResponse
// ---------------------------------------------------------------------------

describe('normalizeBoxTariffsResponse', () => {
  it('happy path: normalizes warehouses to BoxTariffItem[]', () => {
    const result = normalizeBoxTariffsResponse(makeRawResponse(), '2025-01-15')
    expect(result.tariffs).toHaveLength(1)
    const t = result.tariffs[0]
    expect(t.warehouseName).toBe('Коледино')
    expect(t.geoName).toBe('Москва')
    expect(t.logistics.coefficient).toBe(1.6)
    expect(t.logistics.baseLiterRub).toBe(48)
    expect(t.storage.coefficient).toBe(1.45)
    expect(t.storage.baseLiterRub).toBe(1)
    expect(result.meta?.date).toBe('2025-01-15')
  })

  it('null input returns empty tariffs with default meta', () => {
    const result = normalizeBoxTariffsResponse(null)
    expect(result.tariffs).toEqual([])
    expect(result.meta?.cached).toBe(true)
  })

  it('missing warehouses returns empty array', () => {
    const result = normalizeBoxTariffsResponse({})
    expect(result.tariffs).toEqual([])
  })

  it('missing tariffs defaults to coefficients of 1.0', () => {
    const raw = makeRawResponse({
      warehouses: [makeRawWarehouse({ tariffs: {} })],
    })
    const result = normalizeBoxTariffsResponse(raw)
    const t = result.tariffs[0]
    expect(t.logistics.coefficient).toBe(1.0)
    expect(t.storage.coefficient).toBe(1.0)
  })

  it('null logistics_coefficient defaults to 1.0', () => {
    const raw = makeRawResponse({
      warehouses: [
        makeRawWarehouse({
          tariffs: {
            fbo: { delivery_base_rub: 48, delivery_liter_rub: 5, logistics_coefficient: null },
            storage: { base_per_day_rub: 1, liter_per_day_rub: 0.5, coefficient: null },
          },
        }),
      ],
    })
    const result = normalizeBoxTariffsResponse(raw)
    expect(result.tariffs[0].logistics.coefficient).toBe(1.0)
    expect(result.tariffs[0].storage.coefficient).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// normalizeWarehousesWithTariffsResponse
// ---------------------------------------------------------------------------

describe('normalizeWarehousesWithTariffsResponse', () => {
  it('happy path: normalizes to WarehousesWithTariffsResponse', () => {
    const result = normalizeWarehousesWithTariffsResponse(makeRawResponse())
    expect(result.warehouses).toHaveLength(1)
    const w = result.warehouses[0]
    expect(w.id).toBe(507)
    expect(w.name).toBe('Коледино')
    expect(w.federal_district).toBe('Москва')
    expect(w.tariffs.fbo?.delivery_base_rub).toBe(48)
    expect(w.tariffs.storage?.coefficient).toBe(1.45)
    expect(result.updated_at).toBe('2025-01-01T00:00:00Z')
  })

  it('null input returns empty warehouses', () => {
    const result = normalizeWarehousesWithTariffsResponse(null)
    expect(result.warehouses).toEqual([])
    expect(result.updated_at).toBeUndefined()
  })

  it('missing warehouses returns empty array', () => {
    const result = normalizeWarehousesWithTariffsResponse({})
    expect(result.warehouses).toEqual([])
  })

  it('missing warehouse fields default safely', () => {
    const result = normalizeWarehousesWithTariffsResponse({ warehouses: [{}] })
    const w = result.warehouses[0]
    expect(w.id).toBe(0)
    expect(w.name).toBe('')
    expect(w.city).toBeUndefined()
  })

  it('multiple warehouses normalize correctly', () => {
    const raw = {
      warehouses: [
        makeRawWarehouse({ id: 507, name: 'Коледино' }),
        makeRawWarehouse({ id: 117501, name: 'Подольск' }),
      ],
    }
    const result = normalizeWarehousesWithTariffsResponse(raw)
    expect(result.warehouses).toHaveLength(2)
    expect(result.warehouses[0].name).toBe('Коледино')
    expect(result.warehouses[1].name).toBe('Подольск')
  })
})
