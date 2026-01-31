/**
 * TDD Unit Tests for Theoretical Profit Calculation
 * Story 61.10-FE: Theoretical Profit Calculation
 * Epic 61-FE: Dashboard Data Integration
 *
 * GREEN Phase: Tests now using actual implementation.
 *
 * Business Formula:
 * Теор. прибыль = Выкупы - COGS - рекламные затраты - логистика - хранение
 *
 * KEY REQUIREMENTS:
 * - AC1: Create calculateTheoreticalProfit() function
 * - AC2: Accept all 5 inputs: sales (Выкупы), COGS, advertising, logistics, storage
 * - AC3: Return value and breakdown object
 * - AC4: Handle null/undefined values gracefully
 * - AC5: Return isComplete flag if all values present
 * - AC6: Return missingFields array with missing field names
 */

import { describe, it, expect } from 'vitest'
import {
  calculateTheoreticalProfit,
  calculateTheoreticalMarginPct,
  type TheoreticalProfitInput,
  type TheoreticalProfitResult,
} from '../theoretical-profit'

describe('calculateTheoreticalProfit', () => {
  // ==========================================================================
  // Happy Path Tests
  // ==========================================================================

  describe('happy path - all values present', () => {
    it('should calculate theoretical profit correctly with all values', () => {
      // Story 61.10-FE: Formula = Заказы - COGS - реклама - логистика - хранение
      const input: TheoreticalProfitInput = {
        salesAmount: 500000,
        cogs: 200000,
        advertisingSpend: 50000,
        logisticsCost: 30000,
        storageCost: 10000,
      }

      const result = calculateTheoreticalProfit(input)

      // 500000 - 200000 - 50000 - 30000 - 10000 = 210000
      expect(result.value).toBe(210000)
      expect(result.isComplete).toBe(true)
      expect(result.missingFields).toEqual([])
    })

    it('should return correct breakdown object', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 500000,
        cogs: 200000,
        advertisingSpend: 50000,
        logisticsCost: 30000,
        storageCost: 10000,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.breakdown).toEqual({
        sales: 500000,
        cogs: 200000,
        advertising: 50000,
        logistics: 30000,
        storage: 10000,
      })
    })

    it('should handle zero values correctly', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 0,
        advertisingSpend: 0,
        logisticsCost: 0,
        storageCost: 0,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.value).toBe(100000)
      expect(result.isComplete).toBe(true)
    })

    it('should handle large values correctly (typical monthly sales)', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 5_000_000, // 5M rubles
        cogs: 2_000_000,
        advertisingSpend: 500_000,
        logisticsCost: 300_000,
        storageCost: 100_000,
      }

      const result = calculateTheoreticalProfit(input)

      // 5M - 2M - 500K - 300K - 100K = 2.1M
      expect(result.value).toBe(2_100_000)
    })
  })

  // ==========================================================================
  // Negative Profit Tests
  // ==========================================================================

  describe('negative profit scenarios', () => {
    it('should return negative profit when costs exceed orders', () => {
      // Story 61.10-FE: Business case - unprofitable period
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 80000,
        advertisingSpend: 30000,
        logisticsCost: 10000,
        storageCost: 5000,
      }

      const result = calculateTheoreticalProfit(input)

      // 100000 - 80000 - 30000 - 10000 - 5000 = -25000
      expect(result.value).toBe(-25000)
      expect(result.isComplete).toBe(true)
    })

    it('should handle extremely negative profit (high advertising spend)', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 50000,
        cogs: 30000,
        advertisingSpend: 100000, // High ad spend exceeds orders
        logisticsCost: 5000,
        storageCost: 2000,
      }

      const result = calculateTheoreticalProfit(input)

      // 50000 - 30000 - 100000 - 5000 - 2000 = -87000
      expect(result.value).toBe(-87000)
    })
  })

  // ==========================================================================
  // Null/Undefined Handling Tests
  // ==========================================================================

  describe('null value handling (AC4)', () => {
    it('should handle null values gracefully and use 0 in calculation', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: null,
        advertisingSpend: 10000,
        logisticsCost: null,
        storageCost: 5000,
      }

      const result = calculateTheoreticalProfit(input)

      // 100000 - 0 - 10000 - 0 - 5000 = 85000
      expect(result.value).toBe(85000)
      expect(result.isComplete).toBe(false)
      expect(result.missingFields).toContain('cogs')
      expect(result.missingFields).toContain('logisticsCost')
      expect(result.missingFields).not.toContain('salesAmount')
      expect(result.missingFields).not.toContain('advertisingSpend')
      expect(result.missingFields).not.toContain('storageCost')
    })

    it('should handle all null values', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: null,
        cogs: null,
        advertisingSpend: null,
        logisticsCost: null,
        storageCost: null,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.value).toBe(0)
      expect(result.isComplete).toBe(false)
      expect(result.missingFields).toHaveLength(5)
      expect(result.missingFields).toContain('salesAmount')
      expect(result.missingFields).toContain('cogs')
      expect(result.missingFields).toContain('advertisingSpend')
      expect(result.missingFields).toContain('logisticsCost')
      expect(result.missingFields).toContain('storageCost')
    })

    it('should handle only salesAmount as null', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: null,
        cogs: 50000,
        advertisingSpend: 10000,
        logisticsCost: 5000,
        storageCost: 2000,
      }

      const result = calculateTheoreticalProfit(input)

      // 0 - 50000 - 10000 - 5000 - 2000 = -67000
      expect(result.value).toBe(-67000)
      expect(result.isComplete).toBe(false)
      expect(result.missingFields).toEqual(['salesAmount'])
    })

    it('should report correct missing fields in order', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: null,
        advertisingSpend: null,
        logisticsCost: 5000,
        storageCost: null,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.missingFields).toEqual(['cogs', 'advertisingSpend', 'storageCost'])
    })
  })

  // ==========================================================================
  // isComplete Flag Tests (AC5)
  // ==========================================================================

  describe('isComplete flag (AC5)', () => {
    it('should return isComplete=true when all values present', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 50000,
        advertisingSpend: 10000,
        logisticsCost: 5000,
        storageCost: 2000,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.isComplete).toBe(true)
    })

    it('should return isComplete=false when any value is null', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 50000,
        advertisingSpend: 10000,
        logisticsCost: null, // Single missing value
        storageCost: 2000,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.isComplete).toBe(false)
    })

    it('should return isComplete=true when values are 0 (zero is valid)', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 0, // Zero is a valid value, not missing
        advertisingSpend: 0,
        logisticsCost: 0,
        storageCost: 0,
      }

      const result = calculateTheoreticalProfit(input)

      expect(result.isComplete).toBe(true)
      expect(result.missingFields).toEqual([])
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle very small decimal values', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100.5,
        cogs: 40.25,
        advertisingSpend: 10.1,
        logisticsCost: 5.05,
        storageCost: 2.02,
      }

      const result = calculateTheoreticalProfit(input)

      // 100.50 - 40.25 - 10.10 - 5.05 - 2.02 = 43.08
      expect(result.value).toBeCloseTo(43.08, 2)
    })

    it('should handle exactly zero orders (new seller scenario)', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 0,
        cogs: 0,
        advertisingSpend: 1000, // Spent on ads before first sale
        logisticsCost: 0,
        storageCost: 500,
      }

      const result = calculateTheoreticalProfit(input)

      // 0 - 0 - 1000 - 0 - 500 = -1500
      expect(result.value).toBe(-1500)
      expect(result.isComplete).toBe(true)
    })

    it('should handle break-even scenario (profit = 0)', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 60000,
        advertisingSpend: 20000,
        logisticsCost: 15000,
        storageCost: 5000,
      }

      const result = calculateTheoreticalProfit(input)

      // 100000 - 60000 - 20000 - 15000 - 5000 = 0
      expect(result.value).toBe(0)
    })
  })

  // ==========================================================================
  // Type Safety Tests
  // ==========================================================================

  describe('type safety', () => {
    it('should return correct TheoreticalProfitResult structure', () => {
      const input: TheoreticalProfitInput = {
        salesAmount: 100000,
        cogs: 50000,
        advertisingSpend: 10000,
        logisticsCost: 5000,
        storageCost: 2000,
      }

      const result: TheoreticalProfitResult = calculateTheoreticalProfit(input)

      // Type checks (these will fail at compile time if structure is wrong)
      expect(typeof result.value).toBe('number')
      expect(typeof result.isComplete).toBe('boolean')
      expect(Array.isArray(result.missingFields)).toBe(true)
      expect(typeof result.breakdown.sales).toBe('number')
      expect(typeof result.breakdown.cogs).toBe('number')
      expect(typeof result.breakdown.advertising).toBe('number')
      expect(typeof result.breakdown.logistics).toBe('number')
      expect(typeof result.breakdown.storage).toBe('number')
    })
  })
})

// ==========================================================================
// calculateTheoreticalMarginPct Tests
// ==========================================================================

describe('calculateTheoreticalMarginPct', () => {
  it('should calculate margin percentage correctly', () => {
    // Story 61.10-FE: Margin % = (profit / orders) * 100
    // profit = 210000, orders = 500000
    // margin = (210000 / 500000) * 100 = 42%
    expect(calculateTheoreticalMarginPct(210000, 500000)).toBe(42)
  })

  it('should return null when orders is 0 (avoid division by zero)', () => {
    expect(calculateTheoreticalMarginPct(1000, 0)).toBeNull()
  })

  it('should handle negative profit correctly', () => {
    // profit = -25000, orders = 100000
    // margin = (-25000 / 100000) * 100 = -25%
    expect(calculateTheoreticalMarginPct(-25000, 100000)).toBe(-25)
  })

  it('should handle 100% margin (zero costs)', () => {
    // profit = 100000, orders = 100000
    // margin = 100%
    expect(calculateTheoreticalMarginPct(100000, 100000)).toBe(100)
  })

  it('should handle very small margins', () => {
    // profit = 1000, orders = 1000000
    // margin = 0.1%
    expect(calculateTheoreticalMarginPct(1000, 1000000)).toBeCloseTo(0.1, 2)
  })

  it('should handle high margins correctly', () => {
    // profit = 90000, orders = 100000
    // margin = 90%
    expect(calculateTheoreticalMarginPct(90000, 100000)).toBe(90)
  })

  it('should handle zero profit', () => {
    // profit = 0, orders = 100000
    // margin = 0%
    expect(calculateTheoreticalMarginPct(0, 100000)).toBe(0)
  })
})

// ==========================================================================
// Integration Tests (function composition)
// ==========================================================================

describe('integration: calculateTheoreticalProfit + calculateTheoreticalMarginPct', () => {
  it('should work together for complete profit analysis', () => {
    const input: TheoreticalProfitInput = {
      salesAmount: 500000,
      cogs: 200000,
      advertisingSpend: 50000,
      logisticsCost: 30000,
      storageCost: 10000,
    }

    const profitResult = calculateTheoreticalProfit(input)
    const marginPct = calculateTheoreticalMarginPct(
      profitResult.value,
      profitResult.breakdown.sales
    )

    expect(profitResult.value).toBe(210000)
    expect(marginPct).toBe(42)
  })

  it('should handle incomplete data gracefully', () => {
    const input: TheoreticalProfitInput = {
      salesAmount: 100000,
      cogs: null,
      advertisingSpend: 10000,
      logisticsCost: null,
      storageCost: 5000,
    }

    const profitResult = calculateTheoreticalProfit(input)
    const marginPct = calculateTheoreticalMarginPct(
      profitResult.value,
      profitResult.breakdown.sales
    )

    // Profit calculated with 0s for missing values
    expect(profitResult.value).toBe(85000)
    expect(profitResult.isComplete).toBe(false)
    // Margin can still be calculated
    expect(marginPct).toBe(85)
  })
})
