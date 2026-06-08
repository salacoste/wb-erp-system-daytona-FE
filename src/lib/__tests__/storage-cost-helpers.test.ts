/**
 * Unit tests for storage-cost-helpers
 * Story 44.14-FE: Storage Cost Calculation
 */

import { describe, it, expect } from 'vitest'
import {
  formatStorageBreakdown,
  calculateBillableDays,
  calculateStorageCostWith60DaysFree,
  calculateVolumeWithMinimum,
} from '../storage-cost-helpers'
import type { StorageCostResult } from '../storage-cost-utils'

// ============================================================================
// calculateBillableDays
// ============================================================================

describe('calculateBillableDays', () => {
  it('returns 0 for days within free period (<=60)', () => {
    expect(calculateBillableDays(60)).toBe(0)
  })

  it('returns 0 for day 1', () => {
    expect(calculateBillableDays(1)).toBe(0)
  })

  it('returns 0 for day 0', () => {
    expect(calculateBillableDays(0)).toBe(0)
  })

  it('returns 0 for NaN', () => {
    expect(calculateBillableDays(NaN)).toBe(0)
  })

  it('returns correct billable days after free period', () => {
    expect(calculateBillableDays(90)).toBe(30)
  })

  it('returns 1 for day 61', () => {
    expect(calculateBillableDays(61)).toBe(1)
  })

  it('handles large turnover', () => {
    expect(calculateBillableDays(365)).toBe(305)
  })

  it('preserves Infinity', () => {
    expect(calculateBillableDays(Infinity)).toBe(Infinity)
  })

  it('handles negative days', () => {
    expect(calculateBillableDays(-10)).toBe(0)
  })
})

// ============================================================================
// calculateStorageCostWith60DaysFree
// ============================================================================

describe('calculateStorageCostWith60DaysFree', () => {
  it('returns 0 when within free period', () => {
    expect(calculateStorageCostWith60DaysFree(5.0, 30)).toBe(0)
  })

  it('returns 0 when exactly at free period boundary', () => {
    expect(calculateStorageCostWith60DaysFree(5.0, 60)).toBe(0)
  })

  it('calculates cost for billable days', () => {
    // 90 days - 60 free = 30 billable * 5.0 = 150
    expect(calculateStorageCostWith60DaysFree(5.0, 90)).toBe(150)
  })

  it('returns 0 for negative daily cost', () => {
    expect(calculateStorageCostWith60DaysFree(-1.0, 90)).toBe(0)
  })

  it('returns 0 for zero daily cost', () => {
    expect(calculateStorageCostWith60DaysFree(0, 90)).toBe(0)
  })

  it('handles fractional daily cost', () => {
    // 61 days - 60 = 1 billable * 0.5 = 0.5
    expect(calculateStorageCostWith60DaysFree(0.5, 61)).toBeCloseTo(0.5)
  })

  it('handles NaN turnover', () => {
    expect(calculateStorageCostWith60DaysFree(5.0, NaN)).toBe(0)
  })
})

// ============================================================================
// calculateVolumeWithMinimum
// ============================================================================

describe('calculateVolumeWithMinimum', () => {
  it('calculates volume from dimensions', () => {
    // 10 * 10 * 10 = 1000 cm3 = 1 liter
    expect(calculateVolumeWithMinimum(10, 10, 10)).toBe(1)
  })

  it('enforces minimum of 1 liter for small items', () => {
    // 1 * 1 * 1 = 1 cm3 = 0.001 liters → min 1
    expect(calculateVolumeWithMinimum(1, 1, 1)).toBe(1)
  })

  it('calculates larger volumes correctly', () => {
    // 20 * 15 * 10 = 3000 cm3 = 3 liters
    expect(calculateVolumeWithMinimum(20, 15, 10)).toBe(3)
  })

  it('handles zero dimensions', () => {
    expect(calculateVolumeWithMinimum(0, 10, 10)).toBe(1) // min 1
  })

  it('handles all zero dimensions', () => {
    expect(calculateVolumeWithMinimum(0, 0, 0)).toBe(1)
  })

  it('calculates exactly 1 liter correctly', () => {
    // 10 * 10 * 10 = 1000 / 1000 = 1
    expect(calculateVolumeWithMinimum(10, 10, 10)).toBe(1)
  })

  it('calculates volume above 1 liter', () => {
    // 20 * 20 * 20 = 8000 / 1000 = 8
    expect(calculateVolumeWithMinimum(20, 20, 20)).toBe(8)
  })
})

// ============================================================================
// formatStorageBreakdown
// ============================================================================

describe('formatStorageBreakdown', () => {
  const makeResult = (overrides: Partial<StorageCostResult> = {}): StorageCostResult => ({
    dailyCost: 10.5,
    totalCost: 315.0,
    days: 30,
    volumeLiters: 2.5,
    tariff: {
      basePerDayRub: 5.0,
      perLiterPerDayRub: 3.0,
      coefficient: 1.0,
    },
    ...overrides,
  })

  it('includes base rate line', () => {
    const lines = formatStorageBreakdown(makeResult())
    expect(lines[0]).toContain('5.00')
    expect(lines[0]).toContain('1 л')
  })

  it('includes additional liters when volume > 1', () => {
    const lines = formatStorageBreakdown(makeResult({ volumeLiters: 3.0 }))
    const addLine = lines.find(l => l.includes('Доп. литры'))
    expect(addLine).toBeDefined()
    expect(addLine!).toContain('2.0 л')
  })

  it('omits additional liters when volume is exactly 1', () => {
    const lines = formatStorageBreakdown(makeResult({ volumeLiters: 1.0, dailyCost: 5.0 }))
    const addLine = lines.find(l => l.includes('Доп. литры'))
    expect(addLine).toBeUndefined()
  })

  it('includes coefficient line when coefficient != 1', () => {
    const lines = formatStorageBreakdown(
      makeResult({ tariff: { basePerDayRub: 5, perLiterPerDayRub: 3, coefficient: 1.5 } })
    )
    const coeffLine = lines.find(l => l.includes('Коэффициент'))
    expect(coeffLine).toBeDefined()
  })

  it('omits coefficient line when coefficient is 1', () => {
    const lines = formatStorageBreakdown(makeResult())
    const coeffLine = lines.find(l => l.includes('Коэффициент'))
    expect(coeffLine).toBeUndefined()
  })

  it('includes daily total', () => {
    const lines = formatStorageBreakdown(makeResult())
    const dailyLine = lines.find(l => l.includes('Итого/день'))
    expect(dailyLine).toBeDefined()
  })

  it('includes period total with days count', () => {
    const lines = formatStorageBreakdown(makeResult({ days: 30, totalCost: 315 }))
    const periodLine = lines.find(l => l.includes('30 дней'))
    expect(periodLine).toBeDefined()
  })
})
