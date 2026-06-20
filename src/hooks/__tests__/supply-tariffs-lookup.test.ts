import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logger } from '@/lib/logger'
import {
  extractSupplyWarehouses,
  getTariffsByBoxTypeFromCoefficients,
  resetStorageFallbackLogDedupForTests,
} from '../supply-tariffs-lookup'
import type { AcceptanceCoefficient } from '@/types/tariffs'

const coeff = (warehouseId: number, baseLiterRub: number): AcceptanceCoefficient =>
  ({
    warehouseId,
    warehouseName: `Warehouse ${warehouseId}`,
    boxTypeId: 2,
    boxTypeName: 'Короба',
    date: '2026-06-12',
    coefficient: 1,
    delivery: { baseLiterRub: 46, additionalLiterRub: 14, coefficient: 1 },
    storage: { baseLiterRub, additionalLiterRub: 0.05, coefficient: 1 },
  }) as AcceptanceCoefficient

const coeffWithStatus = (
  warehouseId: number,
  boxTypeId: number,
  hasTariffRates: boolean,
  baseLiterRub: number
): AcceptanceCoefficient =>
  ({
    ...coeff(warehouseId, baseLiterRub),
    boxTypeId,
    hasTariffRates,
    tariffDataStatus: hasTariffRates ? 'complete' : 'missing_rates',
  }) as AcceptanceCoefficient

describe('extractSupplyWarehouses fallback warning policy', () => {
  beforeEach(() => {
    resetStorageFallbackLogDedupForTests()
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(logger, 'debug').mockImplementation(() => {})
  })

  it('emits one summarized debug message per extraction when many warehouses use fallback', () => {
    const warehouses = extractSupplyWarehouses([coeff(1, 0), coeff(2, 0), coeff(3, 0.08)])

    expect(warehouses).toHaveLength(3)
    expect(warehouses.filter(w => w.tariffs.usingStorageFallback)).toHaveLength(2)
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.debug).toHaveBeenCalledTimes(1)
    expect(logger.debug).toHaveBeenCalledWith(
      '[StorageTariffs] 2 warehouse(s) using fallback storage tariffs for this calculation',
      {
        sample: [
          { warehouseId: 1, warehouseName: 'Warehouse 1' },
          { warehouseId: 2, warehouseName: 'Warehouse 2' },
        ],
      }
    )
  })

  it('dedupes fallback summaries and keeps them out of warn-level console noise', () => {
    extractSupplyWarehouses([coeff(1, 0)])
    extractSupplyWarehouses([coeff(1, 0)])

    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.debug).toHaveBeenCalledTimes(1)
  })

  it('normalizes box-type storage tariffs with the same fallback policy', () => {
    const boxTypes = getTariffsByBoxTypeFromCoefficients([coeff(1, 0)], 1)

    expect(boxTypes[0]?.storage.baseLiterRub).toBe(0.11)
    expect(boxTypes[0]?.storage.additionalLiterRub).toBe(0.11)
    expect(boxTypes[0]?.storage.usingStorageFallback).toBe(true)
  })

  it('prefers usable tariff rows over all-zero backend missing-rate rows', () => {
    const warehouses = extractSupplyWarehouses([
      coeffWithStatus(1, 2, false, 0),
      coeffWithStatus(1, 5, true, 41.25),
    ])

    expect(warehouses).toHaveLength(1)
    expect(warehouses[0]?.tariffs.storageBaseLiterRub).toBe(41.25)
    expect(warehouses[0]?.tariffs.usingStorageFallback).toBe(false)
  })

  it('excludes backend-confirmed missing-rate warehouses from selectable rows', () => {
    const warehouses = extractSupplyWarehouses([coeffWithStatus(1, 2, false, 0)])

    expect(warehouses).toEqual([])
    expect(logger.warn).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })
})
