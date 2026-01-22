/**
 * Unit tests for return logistics calculation utilities
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD RED Phase - These tests should FAIL until implementation is created
 *
 * Business Logic:
 * return_logistics = logistics_to_customer * (1 - buyback_rate / 100)
 *
 * Example:
 * - logistics_to_customer = 100₽
 * - buyback_rate = 90% (выкуп)
 * - return_rate = 10% (возврат = 100 - 90)
 * - return_logistics = 100 * 0.10 = 10₽
 */

import { describe, it, expect } from 'vitest'
import {
  calculateReturnLogistics,
  calculateReturnRate,
  getReturnLogisticsBreakdown,
  formatReturnLogisticsTooltip,
  isHighReturnRate,
  getReturnRateColor,
  type ReturnLogisticsParams,
  type ReturnLogisticsResult,
} from '../return-logistics-utils'

// ============================================================================
// Test Data
// ============================================================================

/** Standard test case: 90% buyback = 10% returns */
const standardParams: ReturnLogisticsParams = {
  logisticsToCustomer: 100, // 100₽ base logistics
  buybackRate: 90, // 90% выкуп rate
}

/** High buyback case: 98% buyback = 2% returns */
const highBuybackParams: ReturnLogisticsParams = {
  logisticsToCustomer: 200,
  buybackRate: 98,
}

/** Low buyback case: 50% buyback = 50% returns */
const lowBuybackParams: ReturnLogisticsParams = {
  logisticsToCustomer: 150,
  buybackRate: 50,
}

// ============================================================================
// calculateReturnLogistics Tests
// ============================================================================

describe('calculateReturnLogistics', () => {
  describe('Basic Calculation', () => {
    it('should calculate return logistics for standard 90% buyback rate', () => {
      // return_logistics = 100 * (1 - 90/100) = 100 * 0.10 = 10₽
      const result = calculateReturnLogistics(standardParams)

      expect(result.returnLogisticsCost).toBe(10)
      expect(result.returnRate).toBe(10)
    })

    it('should calculate return logistics for high 98% buyback rate', () => {
      // return_logistics = 200 * (1 - 98/100) = 200 * 0.02 = 4₽
      const result = calculateReturnLogistics(highBuybackParams)

      expect(result.returnLogisticsCost).toBe(4)
      expect(result.returnRate).toBe(2)
    })

    it('should calculate return logistics for low 50% buyback rate', () => {
      // return_logistics = 150 * (1 - 50/100) = 150 * 0.50 = 75₽
      const result = calculateReturnLogistics(lowBuybackParams)

      expect(result.returnLogisticsCost).toBe(75)
      expect(result.returnRate).toBe(50)
    })

    it('should include input values in result for transparency', () => {
      const result = calculateReturnLogistics(standardParams)

      expect(result.logisticsToCustomer).toBe(100)
      expect(result.buybackRate).toBe(90)
    })
  })

  describe('100% Buyback Edge Case', () => {
    it('should return 0 return logistics for 100% buyback rate', () => {
      // 100% buyback means 0% returns = 0₽ return logistics
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 100,
        buybackRate: 100,
      }
      const result = calculateReturnLogistics(params)

      expect(result.returnLogisticsCost).toBe(0)
      expect(result.returnRate).toBe(0)
    })
  })

  describe('0% Buyback Edge Case', () => {
    it('should return full logistics cost for 0% buyback rate', () => {
      // 0% buyback means 100% returns = full return logistics
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 100,
        buybackRate: 0,
      }
      const result = calculateReturnLogistics(params)

      expect(result.returnLogisticsCost).toBe(100)
      expect(result.returnRate).toBe(100)
    })
  })

  describe('Boundary Values', () => {
    it('should handle negative logistics cost (return 0)', () => {
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: -50,
        buybackRate: 90,
      }
      const result = calculateReturnLogistics(params)

      expect(result.returnLogisticsCost).toBe(0)
    })

    it('should clamp buyback rate to 0-100 range (> 100)', () => {
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 100,
        buybackRate: 150, // Invalid: > 100
      }
      const result = calculateReturnLogistics(params)

      // Should be clamped to 100% buyback = 0 returns
      expect(result.returnLogisticsCost).toBe(0)
      expect(result.returnRate).toBe(0)
    })

    it('should clamp buyback rate to 0-100 range (< 0)', () => {
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 100,
        buybackRate: -20, // Invalid: < 0
      }
      const result = calculateReturnLogistics(params)

      // Should be clamped to 0% buyback = 100 returns
      expect(result.returnLogisticsCost).toBe(100)
      expect(result.returnRate).toBe(100)
    })

    it('should handle zero logistics cost', () => {
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 0,
        buybackRate: 90,
      }
      const result = calculateReturnLogistics(params)

      expect(result.returnLogisticsCost).toBe(0)
    })
  })

  describe('Rounding', () => {
    it('should round return logistics to 2 decimal places', () => {
      // 100 * 0.07 = 7.00 (exact)
      // 123 * 0.07 = 8.61 (rounds to 2 decimals)
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 123,
        buybackRate: 93, // 7% return rate
      }
      const result = calculateReturnLogistics(params)

      // 123 * 0.07 = 8.61
      expect(result.returnLogisticsCost).toBeCloseTo(8.61, 2)
    })

    it('should handle fractional logistics costs', () => {
      const params: ReturnLogisticsParams = {
        logisticsToCustomer: 99.99,
        buybackRate: 85, // 15% return rate
      }
      const result = calculateReturnLogistics(params)

      // 99.99 * 0.15 = 14.9985 → rounds to 15.00
      expect(result.returnLogisticsCost).toBeCloseTo(15.0, 2)
    })
  })
})

// ============================================================================
// calculateReturnRate Tests
// ============================================================================

describe('calculateReturnRate', () => {
  it('should calculate return rate from buyback rate', () => {
    expect(calculateReturnRate(90)).toBe(10)
    expect(calculateReturnRate(98)).toBe(2)
    expect(calculateReturnRate(50)).toBe(50)
  })

  it('should return 0 for 100% buyback', () => {
    expect(calculateReturnRate(100)).toBe(0)
  })

  it('should return 100 for 0% buyback', () => {
    expect(calculateReturnRate(0)).toBe(100)
  })

  it('should clamp result to valid range', () => {
    expect(calculateReturnRate(150)).toBe(0) // Clamped to max buyback
    expect(calculateReturnRate(-20)).toBe(100) // Clamped to min buyback
  })
})

// ============================================================================
// getReturnLogisticsBreakdown Tests
// ============================================================================

describe('getReturnLogisticsBreakdown', () => {
  it('should return breakdown object with all values', () => {
    const result = getReturnLogisticsBreakdown(100, 90)

    expect(result).toHaveProperty('logisticsToCustomer', 100)
    expect(result).toHaveProperty('buybackRate', 90)
    expect(result).toHaveProperty('returnRate', 10)
    expect(result).toHaveProperty('returnLogisticsCost', 10)
    expect(result).toHaveProperty('formula')
  })

  it('should include formula string for tooltip display', () => {
    const result = getReturnLogisticsBreakdown(100, 90)

    expect(result.formula).toContain('100')
    expect(result.formula).toContain('10%')
    expect(result.formula).toContain('10')
  })

  it('should handle zero values', () => {
    const result = getReturnLogisticsBreakdown(0, 100)

    expect(result.returnLogisticsCost).toBe(0)
    expect(result.returnRate).toBe(0)
  })
})

// ============================================================================
// formatReturnLogisticsTooltip Tests
// ============================================================================

describe('formatReturnLogisticsTooltip', () => {
  it('should format tooltip text in Russian', () => {
    const tooltip = formatReturnLogisticsTooltip(100, 90, 10)

    expect(tooltip).toContain('Логистика к клиенту')
    expect(tooltip).toContain('100')
    expect(tooltip).toContain('90%')
    expect(tooltip).toContain('10%')
    expect(tooltip).toContain('10')
  })

  it('should include formula explanation', () => {
    const tooltip = formatReturnLogisticsTooltip(200, 98, 4)

    expect(tooltip).toContain('Процент выкупа')
    expect(tooltip).toContain('Процент возврата')
    expect(tooltip).toContain('Логистика возврата')
  })

  it('should format currency with ₽ symbol', () => {
    const tooltip = formatReturnLogisticsTooltip(150, 80, 30)

    expect(tooltip).toContain('₽')
  })
})

// ============================================================================
// isHighReturnRate Tests
// ============================================================================

describe('isHighReturnRate', () => {
  it('should return true for return rate > 15%', () => {
    expect(isHighReturnRate(20)).toBe(true)
    expect(isHighReturnRate(30)).toBe(true)
    expect(isHighReturnRate(50)).toBe(true)
  })

  it('should return false for return rate <= 15%', () => {
    expect(isHighReturnRate(15)).toBe(false)
    expect(isHighReturnRate(10)).toBe(false)
    expect(isHighReturnRate(5)).toBe(false)
  })

  it('should return false for 0% return rate', () => {
    expect(isHighReturnRate(0)).toBe(false)
  })
})

// ============================================================================
// getReturnRateColor Tests
// ============================================================================

describe('getReturnRateColor', () => {
  it('should return green for low return rate (< 5%)', () => {
    expect(getReturnRateColor(2)).toBe('text-green-600')
    expect(getReturnRateColor(4)).toBe('text-green-600')
  })

  it('should return yellow for medium return rate (5-15%)', () => {
    expect(getReturnRateColor(5)).toBe('text-yellow-600')
    expect(getReturnRateColor(10)).toBe('text-yellow-600')
    expect(getReturnRateColor(15)).toBe('text-yellow-600')
  })

  it('should return red for high return rate (> 15%)', () => {
    expect(getReturnRateColor(16)).toBe('text-red-600')
    expect(getReturnRateColor(25)).toBe('text-red-600')
    expect(getReturnRateColor(50)).toBe('text-red-600')
  })

  it('should return green for 0% return rate', () => {
    expect(getReturnRateColor(0)).toBe('text-green-600')
  })
})

// ============================================================================
// Type Export Tests
// ============================================================================

describe('Type Exports', () => {
  it('should export ReturnLogisticsParams type', () => {
    const params: ReturnLogisticsParams = {
      logisticsToCustomer: 100,
      buybackRate: 90,
    }
    expect(params).toBeDefined()
  })

  it('should export ReturnLogisticsResult type', () => {
    const result: ReturnLogisticsResult = {
      logisticsToCustomer: 100,
      buybackRate: 90,
      returnRate: 10,
      returnLogisticsCost: 10,
    }
    expect(result).toBeDefined()
  })
})
