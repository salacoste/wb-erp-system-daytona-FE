/**
 * Storage Cost Calculation Tests with Box Type Support
 * Story 44.42-FE: Box Type Selection Support
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: These tests should FAIL initially until implementation.
 *
 * CRITICAL: Tests the different storage formulas:
 * - Standard (Boxes, Supersafe): (base + (V-1) * additional) * coef
 * - Fixed (Pallets): base * coef (volume-independent!)
 *
 * @see docs/stories/epic-44/story-44.42-fe-box-type-support.md
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDailyStorageCost,
  type StorageTariff,
} from '../storage-cost-utils'
import type { BoxTypeId } from '../box-type-utils'

// ============================================================================
// Test Data (from story specification - exact values!)
// ============================================================================

/**
 * Standard test tariff matching story specification
 * Used for formula verification
 */
const standardTariff: StorageTariff = {
  basePerDayRub: 10, // base = 10
  perLiterPerDayRub: 5, // additional = 5
  coefficient: 1.5, // coef = 1.5
}

/**
 * Pallets tariff from story documentation
 * CRITICAL: additionalLiterRub = 0 for Pallets!
 */
const palletsTariff: StorageTariff = {
  basePerDayRub: 41.25, // base = 41.25
  perLiterPerDayRub: 0, // additional = 0 (PALLETS SPECIFIC!)
  coefficient: 1.65, // coef = 1.65
}

/**
 * Real-world tariff example from backend documentation
 */
const realWorldTariff: StorageTariff = {
  basePerDayRub: 0.07,
  perLiterPerDayRub: 0.05,
  coefficient: 1.0,
}

// ============================================================================
// Standard Formula Tests (Boxes, Supersafe)
// ============================================================================

describe('calculateDailyStorageCost - Standard Formula', () => {
  describe('Boxes (boxTypeId: 2)', () => {
    const boxTypeId: BoxTypeId = 2

    it('should calculate correctly for volume = 1L', () => {
      // Formula: (base + (V-1) * additional) * coef
      // (10 + (1-1) * 5) * 1.5 = (10 + 0) * 1.5 = 15.00
      const result = calculateDailyStorageCost(1, standardTariff, boxTypeId)
      expect(result).toBeCloseTo(15.0, 2)
    })

    it('should calculate correctly for volume = 3L (story test case)', () => {
      // Story specification: vol=3, base=10, add=5, coef=1.5
      // Expected: (10 + 2*5) * 1.5 = (10 + 10) * 1.5 = 30.00
      const result = calculateDailyStorageCost(3, standardTariff, boxTypeId)
      expect(result).toBeCloseTo(30.0, 2)
    })

    it('should calculate correctly for volume = 5L', () => {
      // (10 + (5-1) * 5) * 1.5 = (10 + 20) * 1.5 = 45.00
      const result = calculateDailyStorageCost(5, standardTariff, boxTypeId)
      expect(result).toBeCloseTo(45.0, 2)
    })

    it('should calculate correctly for volume = 10L', () => {
      // (10 + (10-1) * 5) * 1.5 = (10 + 45) * 1.5 = 82.50
      const result = calculateDailyStorageCost(10, standardTariff, boxTypeId)
      expect(result).toBeCloseTo(82.5, 2)
    })

    it('should scale linearly with volume', () => {
      const result1L = calculateDailyStorageCost(1, standardTariff, boxTypeId)
      const result5L = calculateDailyStorageCost(5, standardTariff, boxTypeId)
      const result10L = calculateDailyStorageCost(10, standardTariff, boxTypeId)

      // Cost should increase with volume for standard formula
      expect(result5L).toBeGreaterThan(result1L)
      expect(result10L).toBeGreaterThan(result5L)
    })

    it('should return 0 for volume <= 0', () => {
      expect(calculateDailyStorageCost(0, standardTariff, boxTypeId)).toBe(0)
      expect(calculateDailyStorageCost(-1, standardTariff, boxTypeId)).toBe(0)
    })

    it('should handle fractional volumes', () => {
      // vol=2.5: (10 + 1.5 * 5) * 1.5 = (10 + 7.5) * 1.5 = 26.25
      const result = calculateDailyStorageCost(2.5, standardTariff, boxTypeId)
      expect(result).toBeCloseTo(26.25, 2)
    })
  })

  describe('Supersafe (boxTypeId: 6)', () => {
    const boxTypeId: BoxTypeId = 6

    it('should use standard formula same as Boxes', () => {
      // Supersafe uses standard formula, same as Boxes
      const resultBoxes = calculateDailyStorageCost(3, standardTariff, 2)
      const resultSupersafe = calculateDailyStorageCost(3, standardTariff, 6)

      // Same tariff + same volume should give same result
      expect(resultSupersafe).toBeCloseTo(resultBoxes, 2)
    })

    it('should calculate correctly for volume = 3L', () => {
      // (10 + 2*5) * 1.5 = 30.00
      const result = calculateDailyStorageCost(3, standardTariff, boxTypeId)
      expect(result).toBeCloseTo(30.0, 2)
    })

    it('should scale with volume (not fixed)', () => {
      const result1L = calculateDailyStorageCost(1, standardTariff, boxTypeId)
      const result10L = calculateDailyStorageCost(10, standardTariff, boxTypeId)

      expect(result10L).toBeGreaterThan(result1L)
    })
  })

  describe('Default behavior (no boxTypeId)', () => {
    it('should default to standard formula when boxTypeId not provided', () => {
      // Without boxTypeId, should use standard formula (Boxes behavior)
      const resultWithoutType = calculateDailyStorageCost(3, standardTariff)
      const resultWithBoxes = calculateDailyStorageCost(3, standardTariff, 2)

      expect(resultWithoutType).toBeCloseTo(resultWithBoxes, 2)
    })
  })
})

// ============================================================================
// Fixed Formula Tests (Pallets) - CRITICAL STORY REQUIREMENT
// ============================================================================

describe('calculateDailyStorageCost - Fixed Formula (Pallets)', () => {
  const boxTypeId: BoxTypeId = 5

  it('should calculate correctly for volume = 1L (story test case)', () => {
    // Story specification: vol=1, boxType=5, base=41.25, add=0, coef=1.65
    // Expected: 41.25 * 1.65 = 68.0625 ≈ 68.06
    const result = calculateDailyStorageCost(1, palletsTariff, boxTypeId)
    expect(result).toBeCloseTo(68.06, 2)
  })

  it('should calculate SAME for volume = 3L (CRITICAL: volume-independent!)', () => {
    // Story specification: vol=3, boxType=5, base=41.25, add=0, coef=1.65
    // Expected: 41.25 * 1.65 = 68.06 (SAME as 1L!)
    const result = calculateDailyStorageCost(3, palletsTariff, boxTypeId)
    expect(result).toBeCloseTo(68.06, 2)
  })

  it('should calculate SAME for volume = 10L (CRITICAL: volume-independent!)', () => {
    // Story specification: vol=10, boxType=5, base=41.25, add=0, coef=1.65
    // Expected: 41.25 * 1.65 = 68.06 (SAME as 1L and 3L!)
    const result = calculateDailyStorageCost(10, palletsTariff, boxTypeId)
    expect(result).toBeCloseTo(68.06, 2)
  })

  it('should IGNORE volume for Pallets storage calculation', () => {
    // CRITICAL TEST: All volumes should produce identical storage cost
    const result1L = calculateDailyStorageCost(1, palletsTariff, boxTypeId)
    const result3L = calculateDailyStorageCost(3, palletsTariff, boxTypeId)
    const result10L = calculateDailyStorageCost(10, palletsTariff, boxTypeId)
    const result100L = calculateDailyStorageCost(100, palletsTariff, boxTypeId)

    // All should be equal (within rounding tolerance)
    expect(result1L).toBeCloseTo(result3L, 2)
    expect(result3L).toBeCloseTo(result10L, 2)
    expect(result10L).toBeCloseTo(result100L, 2)
  })

  it('should use formula: base * coefficient (ignoring additionalLiterRub)', () => {
    // Formula for Pallets: baseLiterRub * coefficient
    // NOT: (base + (V-1) * additional) * coefficient
    const expectedCost = palletsTariff.basePerDayRub * palletsTariff.coefficient
    const result = calculateDailyStorageCost(50, palletsTariff, boxTypeId)

    expect(result).toBeCloseTo(expectedCost, 2)
  })

  it('should return 0 for volume <= 0', () => {
    expect(calculateDailyStorageCost(0, palletsTariff, boxTypeId)).toBe(0)
    expect(calculateDailyStorageCost(-5, palletsTariff, boxTypeId)).toBe(0)
  })

  it('should handle fractional volumes (still fixed rate)', () => {
    // Even fractional volumes should give same fixed rate
    const result2_5L = calculateDailyStorageCost(2.5, palletsTariff, boxTypeId)
    const result7_8L = calculateDailyStorageCost(7.8, palletsTariff, boxTypeId)

    expect(result2_5L).toBeCloseTo(68.06, 2)
    expect(result7_8L).toBeCloseTo(68.06, 2)
  })
})

// ============================================================================
// Comparison Tests (Box Type Affects Storage)
// ============================================================================

describe('Box Type Impact on Storage Cost', () => {
  it('should show different costs for same volume with different box types', () => {
    // Same tariff, same volume, different box types
    const standardTypeTariff: StorageTariff = {
      basePerDayRub: 41.25,
      perLiterPerDayRub: 12.5, // Non-zero for Boxes/Supersafe
      coefficient: 1.65,
    }

    const resultBoxes = calculateDailyStorageCost(10, standardTypeTariff, 2)
    const resultPallets = calculateDailyStorageCost(10, palletsTariff, 5)

    // Boxes with volume=10: (41.25 + 9 * 12.5) * 1.65 = (41.25 + 112.5) * 1.65 = 253.69
    // Pallets with volume=10: 41.25 * 1.65 = 68.06

    expect(resultBoxes).not.toBeCloseTo(resultPallets, 2)
    expect(resultBoxes).toBeGreaterThan(resultPallets) // Boxes more expensive at high volume
  })

  it('should demonstrate Pallets advantage at high volumes', () => {
    // Same base tariff structure
    const tariff: StorageTariff = {
      basePerDayRub: 41.25,
      perLiterPerDayRub: 12.5,
      coefficient: 1.65,
    }

    const resultBoxes1L = calculateDailyStorageCost(1, tariff, 2)
    const resultBoxes10L = calculateDailyStorageCost(10, tariff, 2)
    const resultPallets1L = calculateDailyStorageCost(1, palletsTariff, 5)
    const resultPallets10L = calculateDailyStorageCost(10, palletsTariff, 5)

    // Boxes cost increases with volume
    expect(resultBoxes10L).toBeGreaterThan(resultBoxes1L)

    // Pallets cost stays same regardless of volume
    expect(resultPallets10L).toBeCloseTo(resultPallets1L, 2)

    // At 10L, Pallets should be cheaper than Boxes
    expect(resultPallets10L).toBeLessThan(resultBoxes10L)
  })
})

// ============================================================================
// Real-World Scenario Tests
// ============================================================================

describe('Real-World Scenarios', () => {
  it('should handle typical e-commerce product (3L box)', () => {
    // Typical small product in box
    const result = calculateDailyStorageCost(3, realWorldTariff, 2)

    // (0.07 + 2 * 0.05) * 1.0 = 0.17 per day
    expect(result).toBeCloseTo(0.17, 4)
  })

  it('should handle large wholesale product (Pallets)', () => {
    // Large pallet delivery - volume doesn't matter
    const palletTariffRealWorld: StorageTariff = {
      basePerDayRub: 5.5,
      perLiterPerDayRub: 0,
      coefficient: 1.2,
    }

    const resultSmall = calculateDailyStorageCost(50, palletTariffRealWorld, 5)
    const resultLarge = calculateDailyStorageCost(500, palletTariffRealWorld, 5)

    // Both should be: 5.5 * 1.2 = 6.6
    expect(resultSmall).toBeCloseTo(6.6, 2)
    expect(resultLarge).toBeCloseTo(6.6, 2)
  })

  it('should match story test table values exactly', () => {
    // From story test table:
    // | Storage - Boxes, 3L | vol=3, boxType=2, base=10, add=5, coef=1.5 | 30.00 |
    expect(calculateDailyStorageCost(3, standardTariff, 2)).toBeCloseTo(30.0, 2)

    // | Storage - Pallets, 1L | vol=1, boxType=5, base=41.25, add=0, coef=1.65 | 68.06 |
    expect(calculateDailyStorageCost(1, palletsTariff, 5)).toBeCloseTo(68.06, 2)

    // | Storage - Pallets, 3L | vol=3, boxType=5, base=41.25, add=0, coef=1.65 | 68.06 (same!) |
    expect(calculateDailyStorageCost(3, palletsTariff, 5)).toBeCloseTo(68.06, 2)

    // | Storage - Pallets, 10L | vol=10, boxType=5, base=41.25, add=0, coef=1.65 | 68.06 (same!) |
    expect(calculateDailyStorageCost(10, palletsTariff, 5)).toBeCloseTo(68.06, 2)
  })
})

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  it('should handle coefficient = 0', () => {
    const zeroCoefTariff: StorageTariff = {
      basePerDayRub: 10,
      perLiterPerDayRub: 5,
      coefficient: 0,
    }

    expect(calculateDailyStorageCost(3, zeroCoefTariff, 2)).toBe(0)
    expect(calculateDailyStorageCost(3, zeroCoefTariff, 5)).toBe(0)
  })

  it('should handle very large volumes', () => {
    const result = calculateDailyStorageCost(1000, standardTariff, 2)
    // (10 + 999 * 5) * 1.5 = (10 + 4995) * 1.5 = 7507.50
    expect(result).toBeCloseTo(7507.5, 2)

    // Pallets still fixed
    const resultPallets = calculateDailyStorageCost(1000, palletsTariff, 5)
    expect(resultPallets).toBeCloseTo(68.06, 2)
  })

  it('should handle very small fractional volumes (< 1L)', () => {
    // Volume 0.5L: formula uses max(0, V-1), so (base + 0) * coef
    const result = calculateDailyStorageCost(0.5, standardTariff, 2)
    // (10 + max(0, -0.5) * 5) * 1.5 = (10 + 0) * 1.5 = 15.00
    expect(result).toBeCloseTo(15.0, 2)
  })

  it('should handle high precision tariffs', () => {
    const precisionTariff: StorageTariff = {
      basePerDayRub: 0.0733,
      perLiterPerDayRub: 0.0512,
      coefficient: 1.234,
    }

    const result = calculateDailyStorageCost(3, precisionTariff, 2)
    // (0.0733 + 2 * 0.0512) * 1.234 = (0.0733 + 0.1024) * 1.234 ≈ 0.2168
    // Note: slight rounding difference due to 4 decimal place rounding
    expect(result).toBeCloseTo(0.2168, 4)
  })

  it('should handle tariff with all zeros', () => {
    const zeroTariff: StorageTariff = {
      basePerDayRub: 0,
      perLiterPerDayRub: 0,
      coefficient: 0,
    }

    expect(calculateDailyStorageCost(10, zeroTariff, 2)).toBe(0)
    expect(calculateDailyStorageCost(10, zeroTariff, 5)).toBe(0)
  })
})

// ============================================================================
// Function Signature Tests
// ============================================================================

describe('Function Signature', () => {
  it('should accept boxTypeId as optional third parameter', () => {
    // Without boxTypeId (defaults to standard/Boxes)
    const result1 = calculateDailyStorageCost(3, standardTariff)
    expect(typeof result1).toBe('number')

    // With boxTypeId
    const result2 = calculateDailyStorageCost(3, standardTariff, 2)
    expect(typeof result2).toBe('number')
  })

  it('should default to Boxes (standard formula) when boxTypeId not provided', () => {
    const resultDefault = calculateDailyStorageCost(3, standardTariff)
    const resultBoxes = calculateDailyStorageCost(3, standardTariff, 2)

    expect(resultDefault).toBeCloseTo(resultBoxes, 4)
  })

  it('should return number type', () => {
    const result = calculateDailyStorageCost(3, standardTariff, 2)
    expect(typeof result).toBe('number')
    expect(Number.isFinite(result)).toBe(true)
  })
})

// ============================================================================
// Regression Prevention Tests
// ============================================================================

describe('Regression Prevention', () => {
  it('should not break existing storage calculations (backward compatibility)', () => {
    // Original function signature without boxTypeId
    const originalResult = calculateDailyStorageCost(3, standardTariff)

    // Should still work and produce valid result
    expect(originalResult).toBeGreaterThan(0)
    expect(originalResult).toBeCloseTo(30.0, 2) // Expected based on formula
  })

  it('should maintain precision for small daily rates', () => {
    // WB rates are very small - ensure no precision loss
    const result = calculateDailyStorageCost(10, realWorldTariff, 2)
    // (0.07 + 9 * 0.05) * 1.0 = 0.52

    expect(result).toBeCloseTo(0.52, 4)
  })
})
