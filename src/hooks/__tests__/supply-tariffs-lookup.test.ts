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
    // getTariffsByBoxTypeFromCoefficients (box-type view) EXPLICITLY SUPPRESSES
    // the per-call fallback warn via `{ warn: false }` (an opt-out of the
    // default per-call warn). It also does NOT route through the aggregate
    // diagnostics accumulator, so it emits NO fallback diagnostic at all —
    // neither per-row nor aggregate. AC#4's "retain by default" applies to
    // callers that do NOT opt out (`{ warn: false }` omitted); this caller
    // opted out (pre-existing, out of scope for the warning-dedup story).
    const boxTypes = getTariffsByBoxTypeFromCoefficients([coeff(1, 0)], 1)

    expect(boxTypes[0]?.storage.baseLiterRub).toBe(0.11)
    expect(boxTypes[0]?.storage.additionalLiterRub).toBe(0.11)
    expect(boxTypes[0]?.storage.usingStorageFallback).toBe(true)
  })

  it('box-type path does NOT emit logger.warn on fallback (explicit { warn: false } suppression, AC#4)', () => {
    // LOCK the actual behavior: getTariffsByBoxTypeFromCoefficients passes
    // `{ warn: false }` to extractStorageTariffs, so a baseLiterRub=0 fallback
    // triggers the fallback VALUES (0.11/0.11) but emits NO logger.warn. This
    // proves the explicit suppression — it would FAIL if someone removed the
    // `{ warn: false }` from the box-type call (the per-row warn would fire).
    // Reset the aggregate singleton first to ensure no stale diagnostic leaks.
    resetStorageFallbackLogDedupForTests()
    ;(logger.warn as ReturnType<typeof vi.fn>).mockClear()

    // Two DISTINCT box types for warehouse 1, both with baseLiterRub=0 so both
    // trigger the storage fallback. (Same warehouseId so the box-type grouping
    // keeps both rows; distinct boxTypeId so they are not deduped into one.)
    const boxTypes = getTariffsByBoxTypeFromCoefficients(
      [
        { ...coeff(1, 0), boxTypeId: 2 },
        { ...coeff(1, 0), boxTypeId: 5 },
      ],
      1
    )

    // Fallback VALUES are applied (both rows hit baseLiterRub=0 fallback)...
    expect(boxTypes).toHaveLength(2)
    expect(boxTypes.every(bt => bt.storage.usingStorageFallback === true)).toBe(true)
    expect(boxTypes.every(bt => bt.storage.baseLiterRub === 0.11)).toBe(true)
    // ...but NO logger.warn fires — explicit suppression, no aggregate emit.
    expect(logger.warn).not.toHaveBeenCalled()
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
