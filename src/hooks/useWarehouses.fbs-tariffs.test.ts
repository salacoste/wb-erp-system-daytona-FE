/**
 * useWarehouses — transformToWarehouse tariff-mapping tests
 * price-calc DEFECT-2 (iter-57): FBS "Маркетплейс" warehouses carry a real FBO
 * delivery rate of 0; the transform must PRESERVE that 0 (block-presence guard),
 * never substitute TARIFF_DEFAULTS (46₽/14₽) which inflated the recommended price.
 *
 * Pure-function-over-hook-mocking: transformToWarehouse is exported for direct testing.
 */
import { describe, it, expect } from 'vitest'
import { transformToWarehouse } from './useWarehouses'
import type { WarehouseWithTariffs } from '@/types/warehouse'

function makeWarehouse(
  overrides: Partial<WarehouseWithTariffs['tariffs']> = {},
  base: Partial<WarehouseWithTariffs> = {}
): WarehouseWithTariffs {
  return {
    id: 1107175926,
    name: 'Маркетплейс: Центральный федеральный округ',
    tariffs: {
      fbo: { delivery_base_rub: 0, delivery_liter_rub: 0, logistics_coefficient: 1 },
      fbs: { delivery_base_rub: 75, delivery_liter_rub: 23, logistics_coefficient: 1.65 },
      storage: { base_per_day_rub: 0.11, liter_per_day_rub: 0.11, coefficient: 1 },
      ...overrides,
    },
    ...base,
  }
}

describe('transformToWarehouse — FBS real-zero preservation (DEFECT-2)', () => {
  it('preserves a real FBO delivery rate of 0 for FBS "Маркетплейс" warehouses (NOT 46/14 defaults)', () => {
    const result = transformToWarehouse(makeWarehouse())
    // The bug: `|| TARIFF_DEFAULTS` turned 0 into 46/14 → +102₽/unit bogus logistics.
    expect(result.tariffs.deliveryBaseLiterRub).toBe(0)
    expect(result.tariffs.deliveryPerLiterRub).toBe(0)
    // Storage for Маркетплейс is a real 0.11 — preserved verbatim.
    expect(result.tariffs.storageBaseLiterRub).toBe(0.11)
  })

  it('reads ONLY the FBO block, ignoring the (non-zero) FBS block', () => {
    const result = transformToWarehouse(makeWarehouse())
    // FBS rates (75/23) must never leak into the FBO calculator.
    expect(result.tariffs.deliveryBaseLiterRub).not.toBe(75)
    expect(result.tariffs.deliveryPerLiterRub).not.toBe(23)
  })

  it('preserves real non-zero FBO rates for a normal FBO warehouse', () => {
    const fbo = transformToWarehouse(
      makeWarehouse(
        { fbo: { delivery_base_rub: 48, delivery_liter_rub: 11, logistics_coefficient: 1.45 } },
        { id: 507, name: 'Коледино' }
      )
    )
    expect(fbo.tariffs.deliveryBaseLiterRub).toBe(48)
    expect(fbo.tariffs.deliveryPerLiterRub).toBe(11)
    expect(fbo.tariffs.logisticsCoefficient).toBe(1.45)
  })

  it('falls back to TARIFF_DEFAULTS only when the whole FBO block is ABSENT', () => {
    const noFbo = transformToWarehouse(
      makeWarehouse({ fbo: undefined }, { id: 999, name: 'No-FBO warehouse' })
    )
    expect(noFbo.tariffs.deliveryBaseLiterRub).toBe(46)
    expect(noFbo.tariffs.deliveryPerLiterRub).toBe(14)
    expect(noFbo.tariffs.logisticsCoefficient).toBe(1.0)
  })

  it('falls back to storage defaults only when the storage block is ABSENT', () => {
    const noStorage = transformToWarehouse(makeWarehouse({ storage: undefined }))
    expect(noStorage.tariffs.storageBaseLiterRub).toBe(0.07)
    expect(noStorage.tariffs.storagePerLiterRub).toBe(0.05)
    expect(noStorage.tariffs.storageCoefficient).toBe(1.0)
  })
})
