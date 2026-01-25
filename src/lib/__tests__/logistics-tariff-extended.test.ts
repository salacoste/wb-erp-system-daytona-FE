/**
 * Extended TDD Tests for Logistics Tariff Calculation
 * Story 44.8-FE: Logistics Tariff Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests for additional edge cases and volume tiers
 * These tests are designed to FAIL initially (TDD red phase)
 *
 * Tests cover:
 * - Volume tier boundaries (МГТ, КГТ, СГТ)
 * - Coefficient edge cases (high, very high, near-zero)
 * - Rounding precision
 * - Breakdown formatting
 * - Input validation edge cases
 */

import { describe, it, expect } from 'vitest'
import {
  calculateLogisticsTariff,
  DEFAULT_BOX_TARIFFS,
  parseTariffExpression,
  normalizeCoefficient,
  denormalizeCoefficient,
  calculateWithDefaultTariffs,
  type BoxDeliveryTariffs,
} from '../logistics-tariff'

// ============================================================================
// Volume Tier Tests (МГТ, КГТ, СГТ - Small, Medium, Large Goods)
// ============================================================================

describe('Volume Tier Calculations', () => {
  const standardTariffs: BoxDeliveryTariffs = {
    baseLiterRub: 48,
    additionalLiterRub: 5,
    coefficient: 1.0,
  }

  describe('МГТ (Small Goods Tier) - up to 5L', () => {
    it('calculates 0.001L (minimum positive volume)', () => {
      // Even tiny volumes should charge minimum 1L
      const result = calculateLogisticsTariff(0.001, standardTariffs)
      expect(result.totalCost).toBe(48.0)
      expect(result.volumeLiters).toBe(0.001)
    })

    it('calculates 0.5L (under 1L threshold)', () => {
      const result = calculateLogisticsTariff(0.5, standardTariffs)
      expect(result.totalCost).toBe(48.0) // Min 1L applies
    })

    it('calculates 0.999L (just under 1L)', () => {
      const result = calculateLogisticsTariff(0.999, standardTariffs)
      expect(result.totalCost).toBe(48.0) // Min 1L applies
    })

    it('calculates exactly 1L (boundary)', () => {
      const result = calculateLogisticsTariff(1.0, standardTariffs)
      expect(result.totalCost).toBe(48.0)
      expect(result.additionalLitersCost).toBe(0)
    })

    it('calculates 1.001L (just over 1L)', () => {
      // (48 + 0.001 * 5) * 1.0 = 48.005 → rounds to 48.01
      const result = calculateLogisticsTariff(1.001, standardTariffs)
      expect(result.totalCost).toBe(48.01)
    })

    it('calculates 5L (МГТ upper boundary)', () => {
      // (48 + 4 * 5) * 1.0 = 68
      const result = calculateLogisticsTariff(5.0, standardTariffs)
      expect(result.totalCost).toBe(68.0)
    })
  })

  describe('КГТ (Large Goods Tier) - 5L to 20L', () => {
    it('calculates 5.001L (just into КГТ)', () => {
      // (48 + 4.001 * 5) * 1.0 = 48 + 20.005 = 68.005 → 68.01
      const result = calculateLogisticsTariff(5.001, standardTariffs)
      expect(result.totalCost).toBe(68.01)
    })

    it('calculates 10L (mid КГТ)', () => {
      // (48 + 9 * 5) * 1.0 = 93
      const result = calculateLogisticsTariff(10.0, standardTariffs)
      expect(result.totalCost).toBe(93.0)
    })

    it('calculates 20L (КГТ upper boundary)', () => {
      // (48 + 19 * 5) * 1.0 = 143
      const result = calculateLogisticsTariff(20.0, standardTariffs)
      expect(result.totalCost).toBe(143.0)
    })
  })

  describe('СГТ (Super Large Goods Tier) - over 20L', () => {
    it('calculates 50L', () => {
      // (48 + 49 * 5) * 1.0 = 293
      const result = calculateLogisticsTariff(50.0, standardTariffs)
      expect(result.totalCost).toBe(293.0)
    })

    it('calculates 100L', () => {
      // (48 + 99 * 5) * 1.0 = 543
      const result = calculateLogisticsTariff(100.0, standardTariffs)
      expect(result.totalCost).toBe(543.0)
    })

    it('calculates 200L (very large goods)', () => {
      // (48 + 199 * 5) * 1.0 = 1043
      const result = calculateLogisticsTariff(200.0, standardTariffs)
      expect(result.totalCost).toBe(1043.0)
    })
  })
})

// ============================================================================
// Coefficient Edge Cases
// ============================================================================

describe('Coefficient Edge Cases', () => {
  const baseTariffs = {
    baseLiterRub: 48,
    additionalLiterRub: 5,
    coefficient: 1.0, // Will be overridden
  }

  it('handles coefficient = 0 (treats as 1.0)', () => {
    const tariffs = { ...baseTariffs, coefficient: 0 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 1.0 = 58
    expect(result.coefficient).toBe(1.0)
    expect(result.totalCost).toBe(58.0)
  })

  it('handles coefficient = -1 (treats as 1.0)', () => {
    const tariffs = { ...baseTariffs, coefficient: -1 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    expect(result.coefficient).toBe(1.0)
    expect(result.totalCost).toBe(58.0)
  })

  it('handles coefficient = 0.5 (discount)', () => {
    const tariffs = { ...baseTariffs, coefficient: 0.5 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 0.5 = 29
    expect(result.totalCost).toBe(29.0)
  })

  it('handles coefficient = 0.75 (slight discount)', () => {
    const tariffs = { ...baseTariffs, coefficient: 0.75 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 0.75 = 43.5
    expect(result.totalCost).toBe(43.5)
  })

  it('handles coefficient = 1.25 (typical elevated)', () => {
    const tariffs = { ...baseTariffs, coefficient: 1.25 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 1.25 = 72.5
    expect(result.totalCost).toBe(72.5)
  })

  it('handles coefficient = 2.0 (double rate)', () => {
    const tariffs = { ...baseTariffs, coefficient: 2.0 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 2.0 = 116
    expect(result.totalCost).toBe(116.0)
  })

  it('handles coefficient = 3.0 (triple rate - high season)', () => {
    const tariffs = { ...baseTariffs, coefficient: 3.0 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 3.0 = 174
    expect(result.totalCost).toBe(174.0)
  })

  it('handles coefficient = 5.0 (extreme - should trigger warning)', () => {
    const tariffs = { ...baseTariffs, coefficient: 5.0 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 5.0 = 290
    expect(result.totalCost).toBe(290.0)
    // Note: Component should show warning for coefficient > 5.0
  })

  it('handles coefficient = 10.0 (max reasonable)', () => {
    const tariffs = { ...baseTariffs, coefficient: 10.0 }
    const result = calculateLogisticsTariff(3.0, tariffs)
    // (48 + 2 * 5) * 10.0 = 580
    expect(result.totalCost).toBe(580.0)
  })
})

// ============================================================================
// Rounding Precision Tests
// ============================================================================

describe('Rounding Precision', () => {
  it('rounds down correctly (banker\'s rounding not used)', () => {
    const tariffs: BoxDeliveryTariffs = {
      baseLiterRub: 47,
      additionalLiterRub: 7,
      coefficient: 1.111,
    }
    // (47 + 2 * 7) * 1.111 = 61 * 1.111 = 67.771
    const result = calculateLogisticsTariff(3, tariffs)
    expect(result.totalCost).toBe(67.77)
  })

  it('rounds up correctly at .005', () => {
    const tariffs: BoxDeliveryTariffs = {
      baseLiterRub: 100,
      additionalLiterRub: 0,
      coefficient: 1.005,
    }
    // 100 * 1.005 = 100.5 → 100.50
    const result = calculateLogisticsTariff(1, tariffs)
    expect(result.totalCost).toBe(100.50)
  })

  it('handles very small decimal differences', () => {
    const tariffs: BoxDeliveryTariffs = {
      baseLiterRub: 33,
      additionalLiterRub: 3,
      coefficient: 1.333,
    }
    // (33 + 2 * 3) * 1.333 = 39 * 1.333 = 51.987
    const result = calculateLogisticsTariff(3, tariffs)
    expect(result.totalCost).toBe(51.99)
  })

  it('preserves precision for additionalLitersCost', () => {
    const tariffs: BoxDeliveryTariffs = {
      baseLiterRub: 48,
      additionalLiterRub: 5.5, // Non-integer rate
      coefficient: 1.0,
    }
    // 2.5 additional liters * 5.5 = 13.75
    const result = calculateLogisticsTariff(3.5, tariffs)
    expect(result.additionalLitersCost).toBe(13.75)
  })
})

// ============================================================================
// Breakdown Formatting Tests
// ============================================================================

describe('Breakdown Formatting', () => {
  const standardTariffs: BoxDeliveryTariffs = {
    baseLiterRub: 48,
    additionalLiterRub: 5,
    coefficient: 1.0,
  }

  describe('Volume Display', () => {
    it('formats 0.5L correctly', () => {
      const result = calculateLogisticsTariff(0.5, standardTariffs)
      expect(result.breakdown.volumeDisplay).toBe('0,50 л')
    })

    it('formats 1.0L correctly', () => {
      const result = calculateLogisticsTariff(1.0, standardTariffs)
      expect(result.breakdown.volumeDisplay).toBe('1,00 л')
    })

    it('formats 3.14159L correctly (rounds to 2 decimals)', () => {
      const result = calculateLogisticsTariff(3.14159, standardTariffs)
      expect(result.breakdown.volumeDisplay).toBe('3,14 л')
    })

    it('formats 100L correctly', () => {
      const result = calculateLogisticsTariff(100, standardTariffs)
      expect(result.breakdown.volumeDisplay).toBe('100,00 л')
    })
  })

  describe('Base Rate Display', () => {
    it('shows base rate with description', () => {
      const result = calculateLogisticsTariff(3, standardTariffs)
      expect(result.breakdown.baseRateDisplay).toBe('48 ₽ (первый литр)')
    })

    it('handles different base rates', () => {
      const tariffs = { ...standardTariffs, baseLiterRub: 100 }
      const result = calculateLogisticsTariff(3, tariffs)
      expect(result.breakdown.baseRateDisplay).toBe('100 ₽ (первый литр)')
    })
  })

  describe('Additional Liters Display', () => {
    it('shows "Нет доп. литров" for 1L', () => {
      const result = calculateLogisticsTariff(1.0, standardTariffs)
      expect(result.breakdown.additionalDisplay).toBe('Нет доп. литров')
    })

    it('shows "Нет доп. литров" for sub-1L volumes', () => {
      const result = calculateLogisticsTariff(0.5, standardTariffs)
      expect(result.breakdown.additionalDisplay).toBe('Нет доп. литров')
    })

    it('formats additional liters calculation for 3L', () => {
      const result = calculateLogisticsTariff(3.0, standardTariffs)
      // Should show: "2.0 л × 5 ₽ = 10.00 ₽"
      expect(result.breakdown.additionalDisplay).toMatch(/2.*л.*×.*5.*₽.*=.*10.*₽/)
    })

    it('handles fractional additional liters', () => {
      const result = calculateLogisticsTariff(2.5, standardTariffs)
      // 1.5 additional liters × 5 = 7.5
      expect(result.breakdown.additionalDisplay).toMatch(/1\.5.*л.*×.*5.*₽.*=.*7\.50.*₽/)
    })
  })

  describe('Coefficient Display', () => {
    it('shows ×1.00 for coefficient 1.0', () => {
      const result = calculateLogisticsTariff(3, standardTariffs)
      expect(result.breakdown.coefficientDisplay).toBe('×1.00')
    })

    it('shows ×1.25 for coefficient 1.25', () => {
      const tariffs = { ...standardTariffs, coefficient: 1.25 }
      const result = calculateLogisticsTariff(3, tariffs)
      expect(result.breakdown.coefficientDisplay).toBe('×1.25')
    })

    it('shows ×0.50 for coefficient 0.5', () => {
      const tariffs = { ...standardTariffs, coefficient: 0.5 }
      const result = calculateLogisticsTariff(3, tariffs)
      expect(result.breakdown.coefficientDisplay).toBe('×0.50')
    })
  })

  describe('Total Display', () => {
    it('formats total with currency symbol', () => {
      const result = calculateLogisticsTariff(3, standardTariffs)
      // Should contain "58" and "₽"
      expect(result.breakdown.totalDisplay).toMatch(/58.*₽/)
    })

    it('formats large totals with thousands separator', () => {
      const result = calculateLogisticsTariff(200, standardTariffs)
      // (48 + 199 * 5) * 1.0 = 1043
      expect(result.breakdown.totalDisplay).toMatch(/1.*043.*₽/)
    })
  })
})

// ============================================================================
// Zero Result Tests
// ============================================================================

describe('Zero Result Edge Cases', () => {
  const standardTariffs: BoxDeliveryTariffs = {
    baseLiterRub: 48,
    additionalLiterRub: 5,
    coefficient: 1.0,
  }

  it('returns zero result for volume = 0', () => {
    const result = calculateLogisticsTariff(0, standardTariffs)
    expect(result.totalCost).toBe(0)
    expect(result.baseCost).toBe(0)
    expect(result.additionalLitersCost).toBe(0)
    expect(result.volumeLiters).toBe(0)
    expect(result.source).toBe('default')
  })

  it('returns zero result for negative volume', () => {
    const result = calculateLogisticsTariff(-5, standardTariffs)
    expect(result.totalCost).toBe(0)
    expect(result.source).toBe('default')
  })

  it('returns zero result for -0.001 volume', () => {
    const result = calculateLogisticsTariff(-0.001, standardTariffs)
    expect(result.totalCost).toBe(0)
  })

  it('has correct breakdown for zero volume', () => {
    const result = calculateLogisticsTariff(0, standardTariffs)
    expect(result.breakdown.volumeDisplay).toBe('0,00 л')
    expect(result.breakdown.baseRateDisplay).toBe('—')
    expect(result.breakdown.additionalDisplay).toBe('—')
    expect(result.breakdown.coefficientDisplay).toBe('—')
    expect(result.breakdown.totalDisplay).toBe('0,00 ₽')
  })
})

// ============================================================================
// Tariff Expression Parsing Extended Tests
// ============================================================================

describe('parseTariffExpression Extended', () => {
  it('parses "1*1" expression', () => {
    expect(parseTariffExpression('1*1')).toBe(1)
  })

  it('parses "100*1" expression', () => {
    expect(parseTariffExpression('100*1')).toBe(100)
  })

  it('parses "0*1" expression', () => {
    expect(parseTariffExpression('0*1')).toBe(0)
  })

  it('parses "15*x" expression (per-liter)', () => {
    expect(parseTariffExpression('15*x')).toBe(15)
  })

  it('returns 0 for malformed expression "abc*1"', () => {
    expect(parseTariffExpression('abc*1')).toBe(0)
  })

  it('returns 0 for expression without asterisk', () => {
    expect(parseTariffExpression('48')).toBe(0)
  })

  it('returns 0 for null-like inputs', () => {
    expect(parseTariffExpression('')).toBe(0)
  })
})

// ============================================================================
// Coefficient Normalization Extended Tests
// ============================================================================

describe('normalizeCoefficient Extended', () => {
  it('normalizes 0 to 0', () => {
    expect(normalizeCoefficient(0)).toBe(0)
  })

  it('normalizes -100 to -1.0 (edge case)', () => {
    // Note: negative coefficients are invalid but function should handle
    expect(normalizeCoefficient(-100)).toBe(-1.0)
  })

  it('normalizes 1 to 0.01', () => {
    expect(normalizeCoefficient(1)).toBe(0.01)
  })

  it('normalizes 500 to 5.0 (high coefficient)', () => {
    expect(normalizeCoefficient(500)).toBe(5.0)
  })

  it('normalizes 1000 to 10.0 (extreme)', () => {
    expect(normalizeCoefficient(1000)).toBe(10.0)
  })

  it('handles decimal input 125.5 → 1.255', () => {
    expect(normalizeCoefficient(125.5)).toBe(1.255)
  })
})

describe('denormalizeCoefficient Extended', () => {
  it('denormalizes 0 to 0', () => {
    expect(denormalizeCoefficient(0)).toBe(0)
  })

  it('denormalizes 0.01 to 1', () => {
    expect(denormalizeCoefficient(0.01)).toBe(1)
  })

  it('denormalizes 5.0 to 500', () => {
    expect(denormalizeCoefficient(5.0)).toBe(500)
  })

  it('denormalizes 10.0 to 1000', () => {
    expect(denormalizeCoefficient(10.0)).toBe(1000)
  })

  it('rounds 1.2345 to 123 (not 123.45)', () => {
    expect(denormalizeCoefficient(1.2345)).toBe(123)
  })
})

// ============================================================================
// calculateWithDefaultTariffs Extended Tests
// ============================================================================

describe('calculateWithDefaultTariffs Extended', () => {
  // Story 44.XX: Updated to match correct API values (46/14 instead of 48/5)
  it('uses default tariffs (46/14/1.0) correctly for 1L', () => {
    const result = calculateWithDefaultTariffs(1.0)
    expect(result.totalCost).toBe(46.0)
  })

  it('uses default tariffs for 5L', () => {
    // (46 + 4 * 14) * 1.0 = 102
    const result = calculateWithDefaultTariffs(5.0)
    expect(result.totalCost).toBe(102.0)
  })

  it('uses default tariffs for 10L', () => {
    // (46 + 9 * 14) * 1.0 = 172
    const result = calculateWithDefaultTariffs(10.0)
    expect(result.totalCost).toBe(172.0)
  })

  it('always returns source as "default"', () => {
    const result = calculateWithDefaultTariffs(3.0)
    expect(result.source).toBe('default')
  })

  it('returns zero for zero volume', () => {
    const result = calculateWithDefaultTariffs(0)
    expect(result.totalCost).toBe(0)
    expect(result.source).toBe('default')
  })
})

// ============================================================================
// DEFAULT_BOX_TARIFFS Validation Tests
// ============================================================================

describe('DEFAULT_BOX_TARIFFS Values', () => {
  // Story 44.XX: Updated to match correct API values (46/14 instead of 48/5)
  it('baseLiterRub is 46 (matches WB API)', () => {
    expect(DEFAULT_BOX_TARIFFS.baseLiterRub).toBe(46)
  })

  it('additionalLiterRub is 14 (matches WB API)', () => {
    expect(DEFAULT_BOX_TARIFFS.additionalLiterRub).toBe(14)
  })

  it('coefficient is 1.0 (per AC5)', () => {
    expect(DEFAULT_BOX_TARIFFS.coefficient).toBe(1.0)
  })

  it('has all required fields', () => {
    expect(DEFAULT_BOX_TARIFFS).toHaveProperty('baseLiterRub')
    expect(DEFAULT_BOX_TARIFFS).toHaveProperty('additionalLiterRub')
    expect(DEFAULT_BOX_TARIFFS).toHaveProperty('coefficient')
  })
})
