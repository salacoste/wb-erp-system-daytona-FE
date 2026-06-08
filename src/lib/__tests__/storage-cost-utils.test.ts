/**
 * Unit Tests for Storage Cost Utilities (non-boxtype functions)
 * Covers: calculateTotalStorageCost, calculateStorageCost, getStorageWarningLevel,
 *         DEFAULT_STORAGE_TARIFF, StorageTariff type
 *
 * Note: calculateDailyStorageCost with box types is tested in storage-cost-utils.boxtype.test.ts
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTotalStorageCost,
  calculateStorageCost,
  getStorageWarningLevel,
  DEFAULT_STORAGE_TARIFF,
  type StorageTariff,
} from '../storage-cost-utils'

// =============================================================================
// DEFAULT_STORAGE_TARIFF
// =============================================================================

describe('DEFAULT_STORAGE_TARIFF', () => {
  it('has correct base rate', () => {
    expect(DEFAULT_STORAGE_TARIFF.basePerDayRub).toBe(0.07)
  })

  it('has correct per-liter rate', () => {
    expect(DEFAULT_STORAGE_TARIFF.perLiterPerDayRub).toBe(0.05)
  })

  it('has coefficient of 1.0', () => {
    expect(DEFAULT_STORAGE_TARIFF.coefficient).toBe(1.0)
  })
})

// =============================================================================
// calculateTotalStorageCost
// =============================================================================

describe('calculateTotalStorageCost', () => {
  const tariff: StorageTariff = {
    basePerDayRub: 0.1,
    perLiterPerDayRub: 0.05,
    coefficient: 1.0,
  }

  it('returns 0 for zero volume', () => {
    expect(calculateTotalStorageCost(0, 30, tariff)).toBe(0)
  })

  it('returns 0 for negative volume', () => {
    expect(calculateTotalStorageCost(-5, 30, tariff)).toBe(0)
  })

  it('calculates total cost for 1 liter over 30 days', () => {
    // daily = (0.10 + 0 * 0.05) * 1.0 = 0.10
    // total = 0.10 * 30 = 3.0
    expect(calculateTotalStorageCost(1, 30, tariff)).toBeCloseTo(3.0, 4)
  })

  it('calculates total cost for 5 liters over 10 days', () => {
    // daily = (0.10 + 4 * 0.05) * 1.0 = 0.30
    // total = 0.30 * 10 = 3.0
    expect(calculateTotalStorageCost(5, 10, tariff)).toBeCloseTo(3.0, 4)
  })

  it('returns 0 for 0 days', () => {
    expect(calculateTotalStorageCost(5, 0, tariff)).toBe(0)
  })

  it('returns 0 for negative days', () => {
    expect(calculateTotalStorageCost(5, -10, tariff)).toBe(0)
  })

  it('applies coefficient correctly', () => {
    const highCoeffTariff: StorageTariff = {
      basePerDayRub: 0.1,
      perLiterPerDayRub: 0.05,
      coefficient: 2.0,
    }
    // daily = (0.10 + 0 * 0.05) * 2.0 = 0.20
    // total = 0.20 * 10 = 2.0
    expect(calculateTotalStorageCost(1, 10, highCoeffTariff)).toBeCloseTo(2.0, 4)
  })
})

// =============================================================================
// calculateStorageCost (full result)
// =============================================================================

describe('calculateStorageCost', () => {
  it('returns complete result object', () => {
    const result = calculateStorageCost(3, 10)
    expect(result).toHaveProperty('dailyCost')
    expect(result).toHaveProperty('totalCost')
    expect(result).toHaveProperty('days', 10)
    expect(result).toHaveProperty('volumeLiters', 3)
    expect(result).toHaveProperty('tariff')
  })

  it('uses DEFAULT_STORAGE_TARIFF when no tariff provided', () => {
    const result = calculateStorageCost(1, 1)
    expect(result.tariff).toEqual(DEFAULT_STORAGE_TARIFF)
  })

  it('uses custom tariff when provided', () => {
    const customTariff: StorageTariff = {
      basePerDayRub: 0.2,
      perLiterPerDayRub: 0.1,
      coefficient: 1.5,
    }
    const result = calculateStorageCost(1, 1, customTariff)
    expect(result.tariff).toEqual(customTariff)
  })

  it('dailyCost * days equals totalCost', () => {
    const result = calculateStorageCost(5, 30)
    expect(result.dailyCost * result.days).toBeCloseTo(result.totalCost, 4)
  })

  it('returns 0 costs for zero volume', () => {
    const result = calculateStorageCost(0, 30)
    expect(result.dailyCost).toBe(0)
    expect(result.totalCost).toBe(0)
  })
})

// =============================================================================
// getStorageWarningLevel
// =============================================================================

describe('getStorageWarningLevel', () => {
  it('returns "none" for 0 days', () => {
    expect(getStorageWarningLevel(0)).toBe('none')
  })

  it('returns "none" for 30 days (boundary)', () => {
    expect(getStorageWarningLevel(30)).toBe('none')
  })

  it('returns "warning" for 31 days', () => {
    expect(getStorageWarningLevel(31)).toBe('warning')
  })

  it('returns "warning" for 60 days (boundary)', () => {
    expect(getStorageWarningLevel(60)).toBe('warning')
  })

  it('returns "critical" for 61 days', () => {
    expect(getStorageWarningLevel(61)).toBe('critical')
  })

  it('returns "critical" for 90 days', () => {
    expect(getStorageWarningLevel(90)).toBe('critical')
  })

  it('returns "none" for negative days', () => {
    expect(getStorageWarningLevel(-5)).toBe('none')
  })

  it('returns "none" for 1 day', () => {
    expect(getStorageWarningLevel(1)).toBe('none')
  })

  it('returns "warning" for 45 days', () => {
    expect(getStorageWarningLevel(45)).toBe('warning')
  })
})
