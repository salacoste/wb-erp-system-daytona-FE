/**
 * Unit tests for logistics-tariff.ts
 * Story 44.8-FE: Logistics Tariff Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests cover:
 * - Volume-based tariff calculation (WB formula)
 * - Edge cases (zero volume, min volume, large volume)
 * - Coefficient normalization
 * - Tariff expression parsing
 * - Default tariffs fallback
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
// Test Data (from Story 44.8 specification)
// ============================================================================

const standardTariffs: BoxDeliveryTariffs = {
  baseLiterRub: 48,
  additionalLiterRub: 5,
  coefficient: 1.0,
}

const koledino125: BoxDeliveryTariffs = {
  baseLiterRub: 48,
  additionalLiterRub: 5,
  coefficient: 1.25,
}

const highCoefficientTariffs: BoxDeliveryTariffs = {
  baseLiterRub: 48,
  additionalLiterRub: 5,
  coefficient: 1.5,
}

// ============================================================================
// calculateLogisticsTariff Tests
// ============================================================================

describe('calculateLogisticsTariff', () => {
  describe('basic calculations from Story 44.8 specification', () => {
    it('calculates 1L volume correctly (base rate only)', () => {
      // Volume 1.0, Base 48, Per-L 5, Coef 1.0 → Expected: 48.00 ₽
      const result = calculateLogisticsTariff(1.0, standardTariffs)
      expect(result.totalCost).toBe(48.0)
      expect(result.baseCost).toBe(48)
      expect(result.additionalLitersCost).toBe(0)
    })

    it('calculates 2L volume correctly', () => {
      // Volume 2.0, Base 48, Per-L 5, Coef 1.0 → Expected: 53.00 ₽
      const result = calculateLogisticsTariff(2.0, standardTariffs)
      expect(result.totalCost).toBe(53.0)
      expect(result.baseCost).toBe(48)
      expect(result.additionalLitersCost).toBe(5)
    })

    it('calculates 3L volume correctly', () => {
      // Volume 3.0, Base 48, Per-L 5, Coef 1.0 → Expected: 58.00 ₽
      const result = calculateLogisticsTariff(3.0, standardTariffs)
      expect(result.totalCost).toBe(58.0)
      expect(result.additionalLitersCost).toBe(10)
    })

    it('calculates 3L with 1.25 coefficient correctly', () => {
      // Volume 3.0, Base 48, Per-L 5, Coef 1.25 → Expected: 72.50 ₽
      const result = calculateLogisticsTariff(3.0, koledino125)
      expect(result.totalCost).toBe(72.5)
    })

    it('calculates 5L volume correctly', () => {
      // Volume 5.0, Base 48, Per-L 5, Coef 1.0 → Expected: 68.00 ₽
      const result = calculateLogisticsTariff(5.0, standardTariffs)
      expect(result.totalCost).toBe(68.0)
    })

    it('calculates 10L with 1.5 coefficient correctly', () => {
      // Volume 10.0, Base 48, Per-L 5, Coef 1.5 → Expected: 117.00 ₽
      // Formula: (48 + 9*5) * 1.5 = 93 * 1.5 = 139.5
      // Wait, spec says 117.00 - let me verify
      // (48 + (10-1)*5) * 1.5 = (48 + 45) * 1.5 = 93 * 1.5 = 139.5
      // Spec might have error, testing actual formula
      const result = calculateLogisticsTariff(10.0, highCoefficientTariffs)
      expect(result.totalCost).toBe(139.5)
    })
  })

  describe('edge cases', () => {
    it('returns zero result for zero volume', () => {
      const result = calculateLogisticsTariff(0, standardTariffs)
      expect(result.totalCost).toBe(0)
      expect(result.volumeLiters).toBe(0)
      expect(result.source).toBe('default')
    })

    it('returns zero result for negative volume', () => {
      const result = calculateLogisticsTariff(-5, standardTariffs)
      expect(result.totalCost).toBe(0)
    })

    it('uses minimum 1L for volume less than 1L', () => {
      // Volume 0.5L should still pay base rate (minimum 1L)
      const result = calculateLogisticsTariff(0.5, standardTariffs)
      expect(result.totalCost).toBe(48.0)
      expect(result.volumeLiters).toBe(0.5)
    })

    it('handles coefficient of 0 by using 1.0', () => {
      const zeroCoefTariffs: BoxDeliveryTariffs = {
        baseLiterRub: 48,
        additionalLiterRub: 5,
        coefficient: 0,
      }
      const result = calculateLogisticsTariff(3.0, zeroCoefTariffs)
      expect(result.coefficient).toBe(1.0)
      expect(result.totalCost).toBe(58.0)
    })

    it('handles large volumes correctly', () => {
      // 100L: (48 + 99*5) * 1.0 = 543
      const result = calculateLogisticsTariff(100, standardTariffs)
      expect(result.totalCost).toBe(543.0)
    })

    it('rounds to 2 decimal places', () => {
      const oddTariffs: BoxDeliveryTariffs = {
        baseLiterRub: 47,
        additionalLiterRub: 7,
        coefficient: 1.333,
      }
      // (47 + 2*7) * 1.333 = 61 * 1.333 = 81.313
      const result = calculateLogisticsTariff(3, oddTariffs)
      expect(result.totalCost).toBe(81.31)
    })
  })

  describe('breakdown generation', () => {
    it('generates correct volume display', () => {
      const result = calculateLogisticsTariff(3.5, standardTariffs)
      expect(result.breakdown.volumeDisplay).toBe('3,50 л')
    })

    it('generates correct base rate display', () => {
      const result = calculateLogisticsTariff(3.0, standardTariffs)
      expect(result.breakdown.baseRateDisplay).toBe('48 ₽ (первый литр)')
    })

    it('generates correct additional display for multi-liter', () => {
      const result = calculateLogisticsTariff(3.0, standardTariffs)
      expect(result.breakdown.additionalDisplay).toBe('2.0 л × 5 ₽ = 10.00 ₽')
    })

    it('generates correct additional display for 1L (no additional)', () => {
      const result = calculateLogisticsTariff(1.0, standardTariffs)
      expect(result.breakdown.additionalDisplay).toBe('Нет доп. литров')
    })

    it('generates correct coefficient display', () => {
      const result = calculateLogisticsTariff(3.0, koledino125)
      expect(result.breakdown.coefficientDisplay).toBe('×1.25')
    })
  })
})

// ============================================================================
// DEFAULT_BOX_TARIFFS Tests (AC5)
// ============================================================================

describe('DEFAULT_BOX_TARIFFS', () => {
  it('has correct default base liter rate (48₽)', () => {
    expect(DEFAULT_BOX_TARIFFS.baseLiterRub).toBe(48)
  })

  it('has correct default additional liter rate (5₽)', () => {
    expect(DEFAULT_BOX_TARIFFS.additionalLiterRub).toBe(5)
  })

  it('has correct default coefficient (1.0)', () => {
    expect(DEFAULT_BOX_TARIFFS.coefficient).toBe(1.0)
  })
})

// ============================================================================
// calculateWithDefaultTariffs Tests
// ============================================================================

describe('calculateWithDefaultTariffs', () => {
  it('calculates using default tariffs', () => {
    // 3L with defaults: (48 + 2*5) * 1.0 = 58
    const result = calculateWithDefaultTariffs(3.0)
    expect(result.totalCost).toBe(58.0)
    expect(result.source).toBe('default')
  })
})

// ============================================================================
// parseTariffExpression Tests
// ============================================================================

describe('parseTariffExpression', () => {
  it('parses base tariff expression (48*1)', () => {
    expect(parseTariffExpression('48*1')).toBe(48)
  })

  it('parses liter tariff expression (5*x)', () => {
    expect(parseTariffExpression('5*x')).toBe(5)
  })

  it('returns 0 for invalid expression', () => {
    expect(parseTariffExpression('invalid')).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(parseTariffExpression('')).toBe(0)
  })
})

// ============================================================================
// normalizeCoefficient Tests
// ============================================================================

describe('normalizeCoefficient', () => {
  it('normalizes 100 to 1.0', () => {
    expect(normalizeCoefficient(100)).toBe(1.0)
  })

  it('normalizes 125 to 1.25', () => {
    expect(normalizeCoefficient(125)).toBe(1.25)
  })

  it('normalizes 150 to 1.5', () => {
    expect(normalizeCoefficient(150)).toBe(1.5)
  })

  it('normalizes 50 to 0.5', () => {
    expect(normalizeCoefficient(50)).toBe(0.5)
  })
})

// ============================================================================
// denormalizeCoefficient Tests
// ============================================================================

describe('denormalizeCoefficient', () => {
  it('denormalizes 1.0 to 100', () => {
    expect(denormalizeCoefficient(1.0)).toBe(100)
  })

  it('denormalizes 1.25 to 125', () => {
    expect(denormalizeCoefficient(1.25)).toBe(125)
  })

  it('denormalizes 1.5 to 150', () => {
    expect(denormalizeCoefficient(1.5)).toBe(150)
  })

  it('handles rounding correctly', () => {
    expect(denormalizeCoefficient(1.333)).toBe(133)
  })
})
