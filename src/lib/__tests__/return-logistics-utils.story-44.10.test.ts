/**
 * TDD Unit Tests for Return Logistics Utilities
 * Story 44.10-FE: Return Logistics Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD RED Phase - These tests define expected behavior from story specification.
 * Tests should FAIL until implementation matches story requirements.
 *
 * Business Logic (from Story 44.10):
 * - base_return = forward_logistics (same tariff per WB rules)
 * - effective_return = base_return × (100 - buyback_pct) / 100
 *
 * Example Calculation:
 * - Forward logistics: 72.50 ₽
 * - Buyback: 98% (typical WB value)
 * - Return rate: 100 - 98 = 2%
 * - Effective return: 72.50 × 0.02 = 1.45 ₽
 *
 * @see docs/stories/epic-44/story-44.10-fe-return-logistics-calculation.md
 */

import { describe, it, expect } from 'vitest'
import {
  calculateBaseReturnLogistics,
  calculateEffectiveReturn,
  calculateReturnLogistics,
  hasSignificantDifference,
  type ReturnLogisticsResult,
  type ReturnLogisticsBreakdown,
} from '../return-logistics-utils'

// ============================================================================
// Story 44.10: Test Data from Acceptance Criteria
// ============================================================================

/**
 * Test scenarios from Story 44.10 documentation
 *
 * | Forward (₽) | Buyback (%) | Base Return (₽) | Effective Return (₽) |
 * |-------------|-------------|-----------------|----------------------|
 * | 72.50       | 98          | 72.50           | 1.45                 |
 * | 72.50       | 100         | 72.50           | 0.00                 |
 * | 72.50       | 0           | 72.50           | 72.50                |
 * | 72.50       | 50          | 72.50           | 36.25                |
 * | 100.00      | 95          | 100.00          | 5.00                 |
 * | 0.00        | 98          | 0.00            | 0.00                 |
 */

// ============================================================================
// calculateBaseReturnLogistics Tests
// ============================================================================

describe('Story 44.10: calculateBaseReturnLogistics', () => {
  describe('AC1: Base return equals forward logistics', () => {
    it('should return same value as forward logistics', () => {
      // Per WB rules: base_return = forward_logistics
      expect(calculateBaseReturnLogistics(72.5)).toBe(72.5)
    })

    it('should return 0 for 0 forward logistics', () => {
      expect(calculateBaseReturnLogistics(0)).toBe(0)
    })

    it('should handle decimal values precisely', () => {
      expect(calculateBaseReturnLogistics(72.5)).toBe(72.5)
      expect(calculateBaseReturnLogistics(123.45)).toBe(123.45)
      expect(calculateBaseReturnLogistics(99.99)).toBe(99.99)
    })

    it('should handle large values', () => {
      expect(calculateBaseReturnLogistics(1000)).toBe(1000)
      expect(calculateBaseReturnLogistics(5000.75)).toBe(5000.75)
    })

    it('should treat negative values as 0 (invariant)', () => {
      // Story invariant: "Negative values → Validation prevents (min: 0)"
      expect(calculateBaseReturnLogistics(-50)).toBe(0)
      expect(calculateBaseReturnLogistics(-0.01)).toBe(0)
    })
  })
})

// ============================================================================
// calculateEffectiveReturn Tests
// ============================================================================

describe('Story 44.10: calculateEffectiveReturn', () => {
  describe('AC2: Calculate effective return with buyback', () => {
    it('should calculate 2% return for 98% buyback (typical WB scenario)', () => {
      // 72.50 × (100 - 98) / 100 = 72.50 × 0.02 = 1.45
      const result = calculateEffectiveReturn(72.5, 98)
      expect(result).toBe(1.45)
    })

    it('should return 0 for 100% buyback (all items kept)', () => {
      // 72.50 × (100 - 100) / 100 = 72.50 × 0 = 0
      const result = calculateEffectiveReturn(72.5, 100)
      expect(result).toBe(0)
    })

    it('should return full amount for 0% buyback (all items returned)', () => {
      // 72.50 × (100 - 0) / 100 = 72.50 × 1 = 72.50
      const result = calculateEffectiveReturn(72.5, 0)
      expect(result).toBe(72.5)
    })

    it('should return 50% for 50% buyback', () => {
      // 72.50 × (100 - 50) / 100 = 72.50 × 0.50 = 36.25
      const result = calculateEffectiveReturn(72.5, 50)
      expect(result).toBe(36.25)
    })

    it('should calculate 5% return for 95% buyback', () => {
      // 100.00 × (100 - 95) / 100 = 100.00 × 0.05 = 5.00
      const result = calculateEffectiveReturn(100, 95)
      expect(result).toBe(5)
    })

    it('should return 0 when base is 0', () => {
      // 0 × anything = 0
      const result = calculateEffectiveReturn(0, 98)
      expect(result).toBe(0)
    })

    it('should round to 2 decimal places', () => {
      // Test rounding: 123 × 0.07 = 8.61
      const result = calculateEffectiveReturn(123, 93) // 7% return
      expect(result).toBeCloseTo(8.61, 2)
    })

    it('should handle precise decimal calculations', () => {
      // 99.99 × 0.15 = 14.9985 → 15.00
      const result = calculateEffectiveReturn(99.99, 85) // 15% return
      expect(result).toBeCloseTo(15.0, 2)
    })
  })

  describe('Edge Cases & Invariants', () => {
    it('should clamp buyback to 0-100 range (> 100)', () => {
      // Buyback 150% → clamped to 100% → 0 effective return
      const result = calculateEffectiveReturn(72.5, 150)
      expect(result).toBe(0)
    })

    it('should clamp buyback to 0-100 range (< 0)', () => {
      // Buyback -20% → clamped to 0% → 100% return
      const result = calculateEffectiveReturn(72.5, -20)
      expect(result).toBe(72.5)
    })

    it('should handle negative base return as 0', () => {
      const result = calculateEffectiveReturn(-50, 98)
      expect(result).toBe(0)
    })
  })
})

// ============================================================================
// calculateReturnLogistics (Full Calculation) Tests
// ============================================================================

describe('Story 44.10: calculateReturnLogistics', () => {
  describe('AC3: Complete result with breakdown', () => {
    it('should calculate complete result for standard scenario', () => {
      const result = calculateReturnLogistics(72.5, 98)

      expect(result.baseReturn).toBe(72.5)
      expect(result.effectiveReturn).toBe(1.45)
      expect(result.buybackPct).toBe(98)
      expect(result.returnRatePct).toBe(2) // 100 - 98
    })

    it('should include buybackPct in result', () => {
      const result = calculateReturnLogistics(100, 95)
      expect(result.buybackPct).toBe(95)
    })

    it('should include returnRatePct in result (100 - buyback)', () => {
      const result = calculateReturnLogistics(100, 95)
      expect(result.returnRatePct).toBe(5)
    })

    it('should calculate correct values for 100% buyback', () => {
      const result = calculateReturnLogistics(72.5, 100)

      expect(result.baseReturn).toBe(72.5)
      expect(result.effectiveReturn).toBe(0)
      expect(result.buybackPct).toBe(100)
      expect(result.returnRatePct).toBe(0)
    })

    it('should calculate correct values for 0% buyback', () => {
      const result = calculateReturnLogistics(72.5, 0)

      expect(result.baseReturn).toBe(72.5)
      expect(result.effectiveReturn).toBe(72.5)
      expect(result.buybackPct).toBe(0)
      expect(result.returnRatePct).toBe(100)
    })

    it('should calculate correct values for 0 forward logistics', () => {
      const result = calculateReturnLogistics(0, 98)

      expect(result.baseReturn).toBe(0)
      expect(result.effectiveReturn).toBe(0)
    })
  })

  describe('AC3: Breakdown display formatting', () => {
    it('should format breakdown for display', () => {
      const result = calculateReturnLogistics(72.5, 98)

      // Breakdown should have formatted display strings
      expect(result.breakdown).toBeDefined()
      expect(result.breakdown.baseReturnDisplay).toBeDefined()
      expect(result.breakdown.buybackDisplay).toBeDefined()
      expect(result.breakdown.returnRateDisplay).toBeDefined()
      expect(result.breakdown.effectiveReturnDisplay).toBeDefined()
    })

    it('should format baseReturnDisplay as currency', () => {
      const result = calculateReturnLogistics(72.5, 98)
      // Should be formatted like "72,50 ₽" (Russian locale)
      expect(result.breakdown.baseReturnDisplay).toContain('72')
      expect(result.breakdown.baseReturnDisplay).toContain('₽')
    })

    it('should format buybackDisplay as percentage', () => {
      const result = calculateReturnLogistics(72.5, 98)
      // Should be formatted like "98%"
      expect(result.breakdown.buybackDisplay).toBe('98%')
    })

    it('should format returnRateDisplay as percentage', () => {
      const result = calculateReturnLogistics(72.5, 98)
      // Should be formatted like "2%"
      expect(result.breakdown.returnRateDisplay).toBe('2%')
    })

    it('should format effectiveReturnDisplay as currency', () => {
      const result = calculateReturnLogistics(72.5, 98)
      // Should be formatted like "1,45 ₽" (Russian locale)
      expect(result.breakdown.effectiveReturnDisplay).toContain('1')
      expect(result.breakdown.effectiveReturnDisplay).toContain('₽')
    })
  })

  describe('All test scenarios from story documentation', () => {
    it.each([
      { forward: 72.5, buyback: 98, expectedBase: 72.5, expectedEffective: 1.45 },
      { forward: 72.5, buyback: 100, expectedBase: 72.5, expectedEffective: 0 },
      { forward: 72.5, buyback: 0, expectedBase: 72.5, expectedEffective: 72.5 },
      { forward: 72.5, buyback: 50, expectedBase: 72.5, expectedEffective: 36.25 },
      { forward: 100, buyback: 95, expectedBase: 100, expectedEffective: 5 },
      { forward: 0, buyback: 98, expectedBase: 0, expectedEffective: 0 },
    ])(
      'forward=$forward, buyback=$buyback → base=$expectedBase, effective=$expectedEffective',
      ({ forward, buyback, expectedBase, expectedEffective }) => {
        const result = calculateReturnLogistics(forward, buyback)

        expect(result.baseReturn).toBe(expectedBase)
        expect(result.effectiveReturn).toBe(expectedEffective)
      }
    )
  })
})

// ============================================================================
// hasSignificantDifference Tests
// ============================================================================

describe('Story 44.10: hasSignificantDifference', () => {
  describe('AC4: Manual override warning threshold', () => {
    it('should return true when difference > 50%', () => {
      // Manual = 120, Calculated = 72.5
      // Difference = |120 - 72.5| / 72.5 = 47.5 / 72.5 = 65.5%
      expect(hasSignificantDifference(120, 72.5, 50)).toBe(true)
    })

    it('should return false when difference < 50%', () => {
      // Manual = 80, Calculated = 72.5
      // Difference = |80 - 72.5| / 72.5 = 7.5 / 72.5 = 10.3%
      expect(hasSignificantDifference(80, 72.5, 50)).toBe(false)
    })

    it('should return false when difference = 50% exactly', () => {
      // Manual = 108.75, Calculated = 72.5
      // Difference = |108.75 - 72.5| / 72.5 = 36.25 / 72.5 = 50%
      expect(hasSignificantDifference(108.75, 72.5, 50)).toBe(false)
    })

    it('should return true when difference > 50% (barely)', () => {
      // Manual = 109, Calculated = 72.5
      // Difference = |109 - 72.5| / 72.5 = 36.5 / 72.5 = 50.3%
      expect(hasSignificantDifference(109, 72.5, 50)).toBe(true)
    })

    it('should handle zero calculated value (manual > 0)', () => {
      // When calculated is 0, any manual value > 0 is significant
      expect(hasSignificantDifference(10, 0, 50)).toBe(true)
    })

    it('should return false when both values are 0', () => {
      expect(hasSignificantDifference(0, 0, 50)).toBe(false)
    })

    it('should handle manual value less than calculated', () => {
      // Manual = 30, Calculated = 72.5
      // Difference = |30 - 72.5| / 72.5 = 42.5 / 72.5 = 58.6%
      expect(hasSignificantDifference(30, 72.5, 50)).toBe(true)
    })

    it('should use default threshold of 50% when not specified', () => {
      // Manual = 120, Calculated = 72.5 → 65.5% difference
      expect(hasSignificantDifference(120, 72.5)).toBe(true)

      // Manual = 80, Calculated = 72.5 → 10.3% difference
      expect(hasSignificantDifference(80, 72.5)).toBe(false)
    })

    it('should support custom threshold', () => {
      // Manual = 80, Calculated = 72.5 → 10.3% difference
      // With 5% threshold, should be significant
      expect(hasSignificantDifference(80, 72.5, 5)).toBe(true)

      // With 15% threshold, should not be significant
      expect(hasSignificantDifference(80, 72.5, 15)).toBe(false)
    })
  })
})

// ============================================================================
// Type Export Tests
// ============================================================================

describe('Story 44.10: Type Exports', () => {
  it('should export ReturnLogisticsResult type with required fields', () => {
    // Type check: ensure interface has expected structure
    const result: ReturnLogisticsResult = {
      baseReturn: 72.5,
      effectiveReturn: 1.45,
      buybackPct: 98,
      returnRatePct: 2,
      breakdown: {
        baseReturnDisplay: '72,50 ₽',
        buybackDisplay: '98%',
        returnRateDisplay: '2%',
        effectiveReturnDisplay: '1,45 ₽',
      },
    }

    expect(result.baseReturn).toBe(72.5)
    expect(result.effectiveReturn).toBe(1.45)
    expect(result.buybackPct).toBe(98)
    expect(result.returnRatePct).toBe(2)
    expect(result.breakdown).toBeDefined()
  })

  it('should export ReturnLogisticsBreakdown type with display fields', () => {
    const breakdown: ReturnLogisticsBreakdown = {
      baseReturnDisplay: '72,50 ₽',
      buybackDisplay: '98%',
      returnRateDisplay: '2%',
      effectiveReturnDisplay: '1,45 ₽',
    }

    expect(breakdown.baseReturnDisplay).toBeDefined()
    expect(breakdown.buybackDisplay).toBeDefined()
    expect(breakdown.returnRateDisplay).toBeDefined()
    expect(breakdown.effectiveReturnDisplay).toBeDefined()
  })
})

// ============================================================================
// Integration Tests - End-to-End Scenarios
// ============================================================================

describe('Story 44.10: Integration Scenarios', () => {
  it('should handle typical WB seller scenario (98% buyback)', () => {
    // Typical WB seller: 72.50 ₽ forward, 98% buyback
    const result = calculateReturnLogistics(72.5, 98)

    // Base return = forward (same tariff)
    expect(result.baseReturn).toBe(72.5)

    // Effective return = 2% of base
    expect(result.effectiveReturn).toBe(1.45)

    // Return rate = 2%
    expect(result.returnRatePct).toBe(2)

    // Breakdown formatted for display
    expect(result.breakdown.returnRateDisplay).toBe('2%')
  })

  it('should handle premium seller scenario (high buyback)', () => {
    // Premium seller: 100 ₽ forward, 99% buyback (low returns)
    const result = calculateReturnLogistics(100, 99)

    expect(result.baseReturn).toBe(100)
    expect(result.effectiveReturn).toBe(1) // 1% of 100
    expect(result.returnRatePct).toBe(1)
  })

  it('should handle problematic category scenario (low buyback)', () => {
    // Problematic category: 50 ₽ forward, 70% buyback (high returns)
    const result = calculateReturnLogistics(50, 70)

    expect(result.baseReturn).toBe(50)
    expect(result.effectiveReturn).toBe(15) // 30% of 50
    expect(result.returnRatePct).toBe(30)
  })

  it('should calculate manual override warning correctly', () => {
    const calculated = calculateReturnLogistics(72.5, 98)

    // Manual value of 50 ₽ (vs base 72.5 ₽) = 31% difference
    expect(hasSignificantDifference(50, calculated.baseReturn, 50)).toBe(false)

    // Manual value of 150 ₽ (vs base 72.5 ₽) = 106% difference
    expect(hasSignificantDifference(150, calculated.baseReturn, 50)).toBe(true)
  })
})
