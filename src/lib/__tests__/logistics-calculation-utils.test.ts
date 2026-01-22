/**
 * Logistics Calculation Utilities Tests
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 *
 * Unit tests for logistics forward cost calculation
 */

import { describe, it, expect } from 'vitest'
import {
  calculateLogisticsForward,
  calculateLogisticsCost,
  getLogisticsBreakdown,
  formatLogisticsBreakdown,
  DEFAULT_LOGISTICS_TARIFF,
  type LogisticsTariff,
} from '../logistics-calculation-utils'

describe('calculateLogisticsForward', () => {
  it('returns 0 for volume <= 0', () => {
    expect(calculateLogisticsForward(0, 46, 14, 1.0)).toBe(0)
    expect(calculateLogisticsForward(-1, 46, 14, 1.0)).toBe(0)
  })

  it('calculates cost for 1 liter (base only)', () => {
    const result = calculateLogisticsForward(1, 46, 14, 1.0)
    expect(result).toBe(46) // base only, no additional liters
  })

  it('calculates cost for 3 liters with coefficient 1.0', () => {
    // 46 + (3-1) * 14 = 46 + 28 = 74
    const result = calculateLogisticsForward(3, 46, 14, 1.0)
    expect(result).toBe(74)
  })

  it('calculates cost for 3 liters with coefficient 1.5', () => {
    // (46 + 28) * 1.5 = 74 * 1.5 = 111
    const result = calculateLogisticsForward(3, 46, 14, 1.5)
    expect(result).toBe(111)
  })

  it('calculates cost for fractional volume (0.5L)', () => {
    // Volume < 1, so no additional liters: just base
    const result = calculateLogisticsForward(0.5, 46, 14, 1.0)
    expect(result).toBe(46)
  })

  it('calculates cost for fractional volume (2.5L)', () => {
    // 46 + (2.5-1) * 14 = 46 + 1.5 * 14 = 46 + 21 = 67
    const result = calculateLogisticsForward(2.5, 46, 14, 1.0)
    expect(result).toBe(67)
  })

  it('uses default coefficient of 1.0 when not provided', () => {
    const result = calculateLogisticsForward(3, 46, 14)
    expect(result).toBe(74) // same as coefficient 1.0
  })
})

describe('calculateLogisticsCost', () => {
  const testTariff: LogisticsTariff = {
    baseRub: 46,
    perLiterRub: 14,
    coefficient: 1.0,
  }

  it('returns full calculation result', () => {
    const result = calculateLogisticsCost(3, testTariff)

    expect(result.totalCost).toBe(74)
    expect(result.baseCost).toBe(74)
    expect(result.volumeLiters).toBe(3)
    expect(result.additionalLiters).toBe(2)
    expect(result.tariff).toEqual(testTariff)
  })

  it('applies coefficient correctly', () => {
    const tariffWithCoeff: LogisticsTariff = { ...testTariff, coefficient: 1.5 }
    const result = calculateLogisticsCost(3, tariffWithCoeff)

    expect(result.baseCost).toBe(74)
    expect(result.totalCost).toBe(111) // 74 * 1.5
  })

  it('uses default tariff when not provided', () => {
    const result = calculateLogisticsCost(1)
    expect(result.tariff).toEqual(DEFAULT_LOGISTICS_TARIFF)
    expect(result.totalCost).toBe(DEFAULT_LOGISTICS_TARIFF.baseRub)
  })

  it('handles zero volume', () => {
    const result = calculateLogisticsCost(0, testTariff)
    expect(result.totalCost).toBe(0)
    expect(result.additionalLiters).toBe(0)
  })
})

describe('getLogisticsBreakdown', () => {
  it('returns prompt message for zero volume', () => {
    const result = getLogisticsBreakdown(0, 46, 14, 1.0)
    expect(result).toBe('Введите объём для расчёта логистики')
  })

  it('returns breakdown for simple case (1 liter)', () => {
    const result = getLogisticsBreakdown(1, 46, 14, 1.0)

    expect(result).toContain('Объём: 1.00 л')
    expect(result).toContain('Базовый тариф:')
    expect(result).toContain('Итого:')
    // No additional liters line for 1 liter
    expect(result).not.toContain('Доп. литры')
  })

  it('includes additional liters for multi-liter volume', () => {
    const result = getLogisticsBreakdown(3, 46, 14, 1.0)

    expect(result).toContain('Объём: 3.00 л')
    expect(result).toContain('Доп. литры: 2.00')
  })

  it('includes coefficient when not 1.0', () => {
    const result = getLogisticsBreakdown(3, 46, 14, 1.5)
    expect(result).toContain('Коэффициент: ×1.50')
  })

  it('excludes coefficient line when 1.0', () => {
    const result = getLogisticsBreakdown(3, 46, 14, 1.0)
    expect(result).not.toContain('Коэффициент')
  })
})

describe('formatLogisticsBreakdown', () => {
  it('returns array of breakdown lines', () => {
    const result = calculateLogisticsCost(3, {
      baseRub: 46,
      perLiterRub: 14,
      coefficient: 1.5,
    })
    const lines = formatLogisticsBreakdown(result)

    expect(Array.isArray(lines)).toBe(true)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.some((line) => line.includes('Базовый тариф'))).toBe(true)
    expect(lines.some((line) => line.includes('Доп. литры'))).toBe(true)
    expect(lines.some((line) => line.includes('Коэффициент'))).toBe(true)
    expect(lines.some((line) => line.includes('Итого'))).toBe(true)
  })

  it('excludes additional liters line when volume <= 1', () => {
    const result = calculateLogisticsCost(1, DEFAULT_LOGISTICS_TARIFF)
    const lines = formatLogisticsBreakdown(result)

    expect(lines.some((line) => line.includes('Доп. литры'))).toBe(false)
  })

  it('excludes coefficient line when 1.0', () => {
    const result = calculateLogisticsCost(3, DEFAULT_LOGISTICS_TARIFF)
    const lines = formatLogisticsBreakdown(result)

    expect(lines.some((line) => line.includes('Коэффициент'))).toBe(false)
  })
})
