/**
 * Unit Tests for acceptance-cost-utils
 * Story 44.XX-FE: Acceptance Cost Calculation
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Tests:
 * - calculateAcceptanceCost for all coefficient values (0, 1, >1, -1)
 * - Free acceptance (coefficient = 0) returns zero cost
 * - Unavailable acceptance (coefficient = -1) returns zero result
 * - Box and pallet calculation formulas
 * - Edge cases and boundary conditions
 *
 * Reference: docs/request-backend/95-epic-43-price-calculator-api.md
 */

import { describe, it, expect } from 'vitest'
import {
  calculateAcceptanceCost,
  calculateAcceptanceCostWithDefaults,
  formatPerUnitCost,
  DEFAULT_ACCEPTANCE_TARIFF,
  type AcceptanceTariff,
} from '../acceptance-cost-utils'

// ============================================================================
// Test Data Constants
// ============================================================================

const TEST_TARIFF: AcceptanceTariff = {
  boxRatePerLiter: 1.7,
  palletRate: 500,
}

// ============================================================================
// Coefficient Handling Tests - Core Bug Fix
// ============================================================================

describe('Coefficient handling in calculateAcceptanceCost', () => {
  describe('coefficient = 0 (free acceptance)', () => {
    it('should return totalCost = 0 for box with coefficient 0', () => {
      const result = calculateAcceptanceCost(2, 5.0, 0, 10, TEST_TARIFF)

      expect(result.totalCost).toBe(0)
      expect(result.perUnitCost).toBe(0)
    })

    it('should return totalCost = 0 for pallet with coefficient 0', () => {
      const result = calculateAcceptanceCost(5, 0, 0, 100, TEST_TARIFF)

      expect(result.totalCost).toBe(0)
      expect(result.perUnitCost).toBe(0)
    })

    it('should include coefficient 0 in formula for box', () => {
      const result = calculateAcceptanceCost(2, 5.0, 0, 10, TEST_TARIFF)

      // Formula should show: "5,00 л × 1,70 ₽/л × 0,00 = 0,00 ₽"
      expect(result.formula).toContain('0,00')
    })

    it('should include coefficient 0 in formula for pallet', () => {
      const result = calculateAcceptanceCost(5, 0, 0, 100, TEST_TARIFF)

      // Formula should show coefficient 0
      expect(result.formula).toContain('0,00')
    })
  })

  describe('coefficient = 1.0 (standard rate)', () => {
    it('should calculate standard rate for box (volume × rate × 1.0)', () => {
      const result = calculateAcceptanceCost(2, 5.0, 1.0, 10, TEST_TARIFF)

      // 5.0 × 1.7 × 1.0 = 8.50
      expect(result.totalCost).toBe(8.5)
      expect(result.perUnitCost).toBe(0.85)
    })

    it('should calculate standard rate for pallet (rate × 1.0)', () => {
      const result = calculateAcceptanceCost(5, 0, 1.0, 100, TEST_TARIFF)

      // 500 × 1.0 = 500
      expect(result.totalCost).toBe(500)
      expect(result.perUnitCost).toBe(5)
    })
  })

  describe('coefficient > 1 (surcharge)', () => {
    it('should apply surcharge multiplier for box', () => {
      const result = calculateAcceptanceCost(2, 5.0, 1.2, 10, TEST_TARIFF)

      // 5.0 × 1.7 × 1.2 = 10.20
      expect(result.totalCost).toBe(10.2)
      expect(result.perUnitCost).toBe(1.02)
    })

    it('should apply surcharge multiplier for pallet', () => {
      const result = calculateAcceptanceCost(5, 0, 1.5, 100, TEST_TARIFF)

      // 500 × 1.5 = 750
      expect(result.totalCost).toBe(750)
      expect(result.perUnitCost).toBe(7.5)
    })

    it('should handle high coefficient values (2.5)', () => {
      const result = calculateAcceptanceCost(2, 10.0, 2.5, 20, TEST_TARIFF)

      // 10.0 × 1.7 × 2.5 = 42.50
      expect(result.totalCost).toBe(42.5)
      expect(result.perUnitCost).toBe(2.13) // 42.5 / 20 = 2.125 → 2.13
    })
  })

  describe('coefficient = -1 (unavailable)', () => {
    it('should return zero result for box with coefficient -1', () => {
      const result = calculateAcceptanceCost(2, 5.0, -1, 10, TEST_TARIFF)

      expect(result.totalCost).toBe(0)
      expect(result.perUnitCost).toBe(0)
      expect(result.formula).toBe('—')
    })

    it('should return zero result for pallet with coefficient -1', () => {
      const result = calculateAcceptanceCost(5, 0, -1, 100, TEST_TARIFF)

      expect(result.totalCost).toBe(0)
      expect(result.perUnitCost).toBe(0)
      expect(result.formula).toBe('—')
    })
  })

  describe('invalid coefficient values (fallback to 1.0)', () => {
    it('should use 1.0 for negative coefficients other than -1', () => {
      const result = calculateAcceptanceCost(2, 5.0, -2, 10, TEST_TARIFF)

      // Should use coefficient 1.0: 5.0 × 1.7 × 1.0 = 8.50
      expect(result.totalCost).toBe(8.5)
    })

    it('should use 1.0 for very negative coefficients', () => {
      const result = calculateAcceptanceCost(2, 5.0, -0.5, 10, TEST_TARIFF)

      // Should use coefficient 1.0: 5.0 × 1.7 × 1.0 = 8.50
      expect(result.totalCost).toBe(8.5)
    })
  })
})

// ============================================================================
// Box Calculation Tests
// ============================================================================

describe('Box calculation formula', () => {
  it('should calculate: volume × boxRatePerLiter × coefficient', () => {
    const result = calculateAcceptanceCost(2, 10.0, 1.0, 50, TEST_TARIFF)

    // 10.0 × 1.7 × 1.0 = 17.00
    expect(result.totalCost).toBe(17)
    expect(result.perUnitCost).toBe(0.34) // 17 / 50 = 0.34
  })

  it('should return zero result for zero volume', () => {
    const result = calculateAcceptanceCost(2, 0, 1.0, 10, TEST_TARIFF)

    expect(result.totalCost).toBe(0)
    expect(result.perUnitCost).toBe(0)
    expect(result.formula).toBe('—')
  })

  it('should return zero result for negative volume', () => {
    const result = calculateAcceptanceCost(2, -5.0, 1.0, 10, TEST_TARIFF)

    expect(result.totalCost).toBe(0)
    expect(result.perUnitCost).toBe(0)
    expect(result.formula).toBe('—')
  })

  it('should format box formula correctly', () => {
    const result = calculateAcceptanceCost(2, 5.0, 1.2, 10, TEST_TARIFF)

    // Formula: "5,00 л × 1,70 ₽/л × 1,20 = 10,20 ₽"
    expect(result.formula).toMatch(/5,00 л/)
    expect(result.formula).toMatch(/1,70 ₽\/л/)
    expect(result.formula).toMatch(/1,20/)
  })
})

// ============================================================================
// Pallet Calculation Tests
// ============================================================================

describe('Pallet calculation formula', () => {
  it('should calculate: palletRate × coefficient', () => {
    const result = calculateAcceptanceCost(5, 0, 1.0, 100, TEST_TARIFF)

    // 500 × 1.0 = 500
    expect(result.totalCost).toBe(500)
    expect(result.perUnitCost).toBe(5) // 500 / 100 = 5
  })

  it('should ignore volumeLiters parameter for pallet', () => {
    const result1 = calculateAcceptanceCost(5, 0, 1.0, 100, TEST_TARIFF)
    const result2 = calculateAcceptanceCost(5, 999, 1.0, 100, TEST_TARIFF)

    expect(result1.totalCost).toBe(result2.totalCost)
  })

  it('should format pallet formula correctly', () => {
    const result = calculateAcceptanceCost(5, 0, 1.5, 100, TEST_TARIFF)

    // Formula: "500,00 ₽ × 1,50 = 750,00 ₽"
    expect(result.formula).toMatch(/500,00 ₽/)
    expect(result.formula).toMatch(/1,50/)
  })
})

// ============================================================================
// Per-Unit Cost Calculation Tests
// ============================================================================

describe('Per-unit cost calculation', () => {
  it('should calculate perUnitCost = totalCost / unitsPerPackage', () => {
    const result = calculateAcceptanceCost(2, 10.0, 1.0, 50, TEST_TARIFF)

    // totalCost = 17.00, perUnitCost = 17 / 50 = 0.34
    expect(result.perUnitCost).toBe(0.34)
  })

  it('should handle unitsPerPackage = 1', () => {
    const result = calculateAcceptanceCost(2, 5.0, 1.0, 1, TEST_TARIFF)

    // totalCost = 8.50, perUnitCost = 8.50 / 1 = 8.50
    expect(result.totalCost).toBe(result.perUnitCost)
  })

  it('should handle unitsPerPackage = 0 (use totalCost)', () => {
    const result = calculateAcceptanceCost(2, 5.0, 1.0, 0, TEST_TARIFF)

    // Division by zero protection: perUnitCost = totalCost
    expect(result.perUnitCost).toBe(result.totalCost)
  })

  it('should round perUnitCost to 2 decimal places', () => {
    const result = calculateAcceptanceCost(2, 10.0, 1.0, 3, TEST_TARIFF)

    // totalCost = 17.00, perUnitCost = 17 / 3 = 5.666... → 5.67
    expect(result.perUnitCost).toBe(5.67)
  })
})

// ============================================================================
// Rounding Tests
// ============================================================================

describe('Rounding to 2 decimal places', () => {
  it('should round totalCost to 2 decimal places', () => {
    // 5.0 × 1.7 × 1.333 = 11.3305 → 11.33
    const result = calculateAcceptanceCost(2, 5.0, 1.333, 10, TEST_TARIFF)

    expect(result.totalCost).toBe(11.33)
  })

  it('should round up when third decimal >= 5', () => {
    // 5.0 × 1.7 × 1.335 = 11.3475 → 11.35
    const result = calculateAcceptanceCost(2, 5.0, 1.335, 10, TEST_TARIFF)

    expect(result.totalCost).toBe(11.35)
  })
})

// ============================================================================
// calculateAcceptanceCostWithDefaults Tests
// ============================================================================

describe('calculateAcceptanceCostWithDefaults', () => {
  it('should use DEFAULT_ACCEPTANCE_TARIFF', () => {
    const result = calculateAcceptanceCostWithDefaults(2, 5.0, 1.0, 10)

    // 5.0 × 1.7 × 1.0 = 8.50
    expect(result.totalCost).toBe(8.5)
  })

  it('should match DEFAULT_ACCEPTANCE_TARIFF values', () => {
    expect(DEFAULT_ACCEPTANCE_TARIFF.boxRatePerLiter).toBe(1.7)
    expect(DEFAULT_ACCEPTANCE_TARIFF.palletRate).toBe(500)
  })

  it('should handle coefficient 0 with defaults', () => {
    const result = calculateAcceptanceCostWithDefaults(2, 5.0, 0, 10)

    expect(result.totalCost).toBe(0)
    expect(result.perUnitCost).toBe(0)
  })
})

// ============================================================================
// formatPerUnitCost Tests
// ============================================================================

describe('formatPerUnitCost', () => {
  it('should format cost with units label', () => {
    const formatted = formatPerUnitCost(1.5, 10)

    // formatCurrency may use "1,5" or "1,50" depending on implementation
    expect(formatted).toMatch(/1,5/)
    expect(formatted).toMatch(/₽\/шт/)
  })

  it('should return dash for zero unitsPerPackage', () => {
    const formatted = formatPerUnitCost(1.5, 0)

    expect(formatted).toBe('—')
  })

  it('should return dash for negative unitsPerPackage', () => {
    const formatted = formatPerUnitCost(1.5, -5)

    expect(formatted).toBe('—')
  })
})

// ============================================================================
// Edge Cases and Boundary Conditions
// ============================================================================

describe('Edge cases', () => {
  it('should handle very small volume values', () => {
    const result = calculateAcceptanceCost(2, 0.01, 1.0, 1, TEST_TARIFF)

    // 0.01 × 1.7 × 1.0 = 0.017 → 0.02
    expect(result.totalCost).toBe(0.02)
  })

  it('should handle very large volume values', () => {
    const result = calculateAcceptanceCost(2, 1000, 1.0, 100, TEST_TARIFF)

    // 1000 × 1.7 × 1.0 = 1700
    expect(result.totalCost).toBe(1700)
  })

  it('should handle very high coefficient', () => {
    const result = calculateAcceptanceCost(2, 5.0, 10.0, 10, TEST_TARIFF)

    // 5.0 × 1.7 × 10.0 = 85.00
    expect(result.totalCost).toBe(85)
  })

  it('should handle fractional coefficient between 0 and 1', () => {
    const result = calculateAcceptanceCost(2, 10.0, 0.5, 10, TEST_TARIFF)

    // 10.0 × 1.7 × 0.5 = 8.50
    expect(result.totalCost).toBe(8.5)
  })
})

// ============================================================================
// Integration Test: Full Workflow
// ============================================================================

describe('Full workflow integration', () => {
  it('should correctly calculate acceptance cost for typical box scenario', () => {
    // Typical case: 5L box, standard rate, 10 units
    const result = calculateAcceptanceCost(2, 5.0, 1.0, 10, {
      boxRatePerLiter: 1.7,
      palletRate: 500,
    })

    expect(result.totalCost).toBe(8.5)
    expect(result.perUnitCost).toBe(0.85)
    expect(result.formula).toContain('5,00 л')
  })

  it('should correctly calculate acceptance cost for free acceptance scenario', () => {
    // Free acceptance: coefficient = 0
    const result = calculateAcceptanceCost(2, 5.0, 0, 10, TEST_TARIFF)

    expect(result.totalCost).toBe(0)
    expect(result.perUnitCost).toBe(0)
    // Formula should still show the calculation with 0 coefficient
    expect(result.formula).toContain('0,00')
  })

  it('should correctly handle unavailable acceptance scenario', () => {
    // Unavailable: coefficient = -1
    const result = calculateAcceptanceCost(2, 5.0, -1, 10, TEST_TARIFF)

    expect(result.totalCost).toBe(0)
    expect(result.perUnitCost).toBe(0)
    expect(result.formula).toBe('—')
  })
})
