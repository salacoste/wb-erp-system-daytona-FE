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

// Story 164.3-FE: per-row fallback warns are suppressed on the aggregate path
// and collapsed into ONE logger.warn diagnostic via TariffFallbackDiagnostics.
// The sample carries non-sensitive reason codes (NOT warehouse ids/names), and
// identical snapshots are deduped across renders. Calculation RESULTS are
// byte-identical to before; only the warning emit pattern changed (AC#5).
describe('extractSupplyWarehouses fallback warning policy', () => {
  beforeEach(() => {
    resetStorageFallbackLogDedupForTests()
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(logger, 'debug').mockImplementation(() => {})
  })

  it('emits exactly ONE aggregate warn when many warehouses use the same fallback', () => {
    const warehouses = extractSupplyWarehouses([coeff(1, 0), coeff(2, 0), coeff(3, 0.08)])

    // Calculation results unchanged.
    expect(warehouses).toHaveLength(3)
    expect(warehouses.filter(w => w.tariffs.usingStorageFallback)).toHaveLength(2)
    // AC#2: ONE aggregate diagnostic, not N per-row warns.
    expect(logger.warn).toHaveBeenCalledTimes(1)
    expect(logger.warn).toHaveBeenCalledWith(
      '[StorageTariffs] 2 warehouse(s) using fallback storage tariffs for this calculation',
      { reasons: ['base-zero', 'base-zero'] }
    )
    // The aggregate moved off logger.debug (was debug-level noise; now warn-level diagnostic).
    expect(logger.debug).not.toHaveBeenCalled()
  })

  it('dedupes identical fallback snapshots across repeated renders (no re-emit)', () => {
    extractSupplyWarehouses([coeff(1, 0)])
    extractSupplyWarehouses([coeff(1, 0)])

    // AC#3: identical snapshot signature -> only the first emit fires.
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('re-emits when the fallback snapshot materially changes', () => {
    extractSupplyWarehouses([coeff(1, 0)])
    // Now TWO warehouses fall back -> count differs -> materially new snapshot.
    extractSupplyWarehouses([coeff(1, 0), coeff(2, 0)])

    expect(logger.warn).toHaveBeenCalledTimes(2)
  })

  it('normalizes box-type storage tariffs with the same fallback policy', () => {
    // getTariffsByBoxTypeFromCoefficients is a DIRECT caller (not the aggregate
    // supply lookup), so it keeps per-call warn-suppression and does NOT route
    // through the diagnostics accumulator (AC#4).
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
