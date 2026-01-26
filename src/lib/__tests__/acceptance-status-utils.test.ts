/**
 * Unit Tests for acceptance-status-utils
 * Story 44.43-FE: Acceptance Coefficient Status Badge
 * Epic 44: Price Calculator UI (Frontend)
 *
 * TDD Red Phase: Tests written BEFORE implementation
 * These tests will FAIL until acceptance-status-utils.ts is created
 *
 * Tests:
 * - getAcceptanceStatus for all coefficient values
 * - getAcceptanceStatusInfo returns correct labels, colors, icons
 * - formatCoefficient formatting
 * - percentageIncrease calculation
 * - Edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest'
import {
  getAcceptanceStatus,
  getAcceptanceStatusInfo,
  formatCoefficient,
  calculatePercentageIncrease,
  isAcceptanceAvailable,
  isFreeAcceptance,
  isElevatedAcceptance,
  ACCEPTANCE_STATUS_CONFIG,
  type AcceptanceStatus,
} from '../acceptance-status-utils'

// ============================================================================
// Test Data Constants (from Story 44.43-FE)
// ============================================================================

/**
 * All acceptance status types for comprehensive testing
 * From Story AC1: Badge variants based on coefficient value
 */
const ALL_STATUSES: AcceptanceStatus[] = [
  'unavailable',
  'free',
  'standard',
  'elevated',
  'high',
]

/**
 * Coefficient → Status mapping test cases
 * From Story Invariants & Edge Cases table
 */
const STATUS_TEST_CASES = [
  { coefficient: -1, expectedStatus: 'unavailable' },
  { coefficient: 0, expectedStatus: 'free' },
  { coefficient: 1, expectedStatus: 'standard' },
  { coefficient: 1.01, expectedStatus: 'elevated' },
  { coefficient: 1.25, expectedStatus: 'elevated' },
  { coefficient: 1.50, expectedStatus: 'elevated' },
  { coefficient: 1.51, expectedStatus: 'high' },
  { coefficient: 1.65, expectedStatus: 'high' },
  { coefficient: 2.0, expectedStatus: 'high' },
  { coefficient: 2.5, expectedStatus: 'high' },
] as const

/**
 * Format coefficient test cases
 * From Story Test Scenarios table
 */
const FORMAT_TEST_CASES = [
  { coefficient: -1, expected: 'Н/Д' },
  { coefficient: 0, expected: 'Бесплатно' },
  { coefficient: 1, expected: '×1.00' },
  { coefficient: 1.25, expected: '×1.25' },
  { coefficient: 1.65, expected: '×1.65' },
  { coefficient: 2.5, expected: '×2.50' },
] as const

/**
 * Percentage increase test cases
 * From Story Test Scenarios: Percentage - elevated/high
 */
const PERCENTAGE_TEST_CASES = [
  { coefficient: -1, expected: null },
  { coefficient: 0, expected: null },
  { coefficient: 1, expected: null },
  { coefficient: 1.25, expected: 25 },
  { coefficient: 1.5, expected: 50 },
  { coefficient: 1.65, expected: 65 },
  { coefficient: 2.0, expected: 100 },
] as const

// ============================================================================
// ACCEPTANCE_STATUS_CONFIG Tests
// ============================================================================

describe('ACCEPTANCE_STATUS_CONFIG', () => {
  it('should have configuration for all acceptance statuses', () => {
    ALL_STATUSES.forEach((status) => {
      expect(ACCEPTANCE_STATUS_CONFIG[status]).toBeDefined()
      expect(ACCEPTANCE_STATUS_CONFIG[status].label).toBeTruthy()
      expect(ACCEPTANCE_STATUS_CONFIG[status].description).toBeTruthy()
      expect(ACCEPTANCE_STATUS_CONFIG[status].color).toBeTruthy()
      expect(ACCEPTANCE_STATUS_CONFIG[status].icon).toBeDefined()
    })
  })

  it('should have Russian labels for all statuses', () => {
    expect(ACCEPTANCE_STATUS_CONFIG.unavailable.label).toBe('Недоступно')
    expect(ACCEPTANCE_STATUS_CONFIG.free.label).toBe('Бесплатно')
    expect(ACCEPTANCE_STATUS_CONFIG.standard.label).toBe('Стандартно')
    // elevated and high use formatted coefficient as label (dynamic)
  })

  it('should have correct color mappings from Story AC1', () => {
    // AC1: Badge variants - destructive, success, default, warning, high
    expect(ACCEPTANCE_STATUS_CONFIG.unavailable.color).toBe('destructive')
    expect(ACCEPTANCE_STATUS_CONFIG.free.color).toBe('success')
    expect(ACCEPTANCE_STATUS_CONFIG.standard.color).toBe('default')
    expect(ACCEPTANCE_STATUS_CONFIG.elevated.color).toBe('warning')
    expect(ACCEPTANCE_STATUS_CONFIG.high.color).toBe('high')
  })

  it('should have correct icons from Story AC1', () => {
    // AC1: ⛔ for unavailable, ✅ for free, - for standard, ⚠️ for elevated, 🔴 for high
    expect(ACCEPTANCE_STATUS_CONFIG.unavailable.icon).toBe('⛔')
    expect(ACCEPTANCE_STATUS_CONFIG.free.icon).toBe('✅')
    expect(ACCEPTANCE_STATUS_CONFIG.standard.icon).toBe('')
    expect(ACCEPTANCE_STATUS_CONFIG.elevated.icon).toBe('⚠️')
    expect(ACCEPTANCE_STATUS_CONFIG.high.icon).toBe('🔴')
  })

  it('should have descriptions in Russian', () => {
    expect(ACCEPTANCE_STATUS_CONFIG.unavailable.description).toContain(
      'невозможна'
    )
    expect(ACCEPTANCE_STATUS_CONFIG.free.description).toContain('Бесплатная')
    expect(ACCEPTANCE_STATUS_CONFIG.standard.description).toContain(
      'Стандартная'
    )
    expect(ACCEPTANCE_STATUS_CONFIG.elevated.description).toContain('увеличена')
    expect(ACCEPTANCE_STATUS_CONFIG.high.description).toContain('Высокая')
  })
})

// ============================================================================
// getAcceptanceStatus Tests
// ============================================================================

describe('getAcceptanceStatus', () => {
  describe('Status mapping from coefficient', () => {
    it.each(STATUS_TEST_CASES)(
      'coefficient $coefficient should return status "$expectedStatus"',
      ({ coefficient, expectedStatus }) => {
        expect(getAcceptanceStatus(coefficient)).toBe(expectedStatus)
      }
    )
  })

  describe('Edge cases', () => {
    it('should treat undefined coefficient as unavailable', () => {
      expect(getAcceptanceStatus(undefined as unknown as number)).toBe(
        'unavailable'
      )
    })

    it('should treat null coefficient as unavailable', () => {
      expect(getAcceptanceStatus(null as unknown as number)).toBe('unavailable')
    })

    it('should treat NaN coefficient as unavailable', () => {
      expect(getAcceptanceStatus(NaN)).toBe('unavailable')
    })

    it('should handle very high coefficients as high status', () => {
      expect(getAcceptanceStatus(10)).toBe('high')
      expect(getAcceptanceStatus(100)).toBe('high')
    })

    it('should handle negative coefficients other than -1 as unavailable', () => {
      expect(getAcceptanceStatus(-2)).toBe('unavailable')
      expect(getAcceptanceStatus(-0.5)).toBe('unavailable')
    })
  })

  describe('Boundary conditions', () => {
    // Story AC5: Elevated is 1.01-1.50, High is >1.50
    it('should return elevated for coefficient exactly 1.01', () => {
      expect(getAcceptanceStatus(1.01)).toBe('elevated')
    })

    it('should return elevated for coefficient exactly 1.50', () => {
      expect(getAcceptanceStatus(1.5)).toBe('elevated')
    })

    it('should return high for coefficient 1.51', () => {
      expect(getAcceptanceStatus(1.51)).toBe('high')
    })

    it('should return standard for coefficient exactly 1.0', () => {
      expect(getAcceptanceStatus(1.0)).toBe('standard')
    })

    it('should return free for coefficient exactly 0', () => {
      expect(getAcceptanceStatus(0)).toBe('free')
    })
  })
})

// ============================================================================
// getAcceptanceStatusInfo Tests
// ============================================================================

describe('getAcceptanceStatusInfo', () => {
  describe('Returns complete status info', () => {
    it('should return all required fields for unavailable status', () => {
      const info = getAcceptanceStatusInfo(-1)

      expect(info.status).toBe('unavailable')
      expect(info.coefficient).toBe(-1)
      expect(info.label).toBe('Недоступно')
      expect(info.description).toBeTruthy()
      expect(info.color).toBe('destructive')
      expect(info.icon).toBe('⛔')
      expect(info.percentageIncrease).toBeNull()
    })

    it('should return all required fields for free status', () => {
      const info = getAcceptanceStatusInfo(0)

      expect(info.status).toBe('free')
      expect(info.coefficient).toBe(0)
      expect(info.label).toBe('Бесплатно')
      expect(info.description).toContain('Бесплатная')
      expect(info.color).toBe('success')
      expect(info.icon).toBe('✅')
      expect(info.percentageIncrease).toBeNull()
    })

    it('should return all required fields for standard status', () => {
      const info = getAcceptanceStatusInfo(1)

      expect(info.status).toBe('standard')
      expect(info.coefficient).toBe(1)
      expect(info.label).toBe('Стандартно')
      expect(info.description).toContain('Стандартная')
      expect(info.color).toBe('default')
      expect(info.icon).toBe('')
      expect(info.percentageIncrease).toBeNull()
    })

    it('should return all required fields for elevated status', () => {
      const info = getAcceptanceStatusInfo(1.25)

      expect(info.status).toBe('elevated')
      expect(info.coefficient).toBe(1.25)
      expect(info.label).toBe('×1.25')
      expect(info.description).toContain('увеличена')
      expect(info.description).toContain('25%')
      expect(info.color).toBe('warning')
      expect(info.icon).toBe('⚠️')
      expect(info.percentageIncrease).toBe(25)
    })

    it('should return all required fields for high status', () => {
      const info = getAcceptanceStatusInfo(1.65)

      expect(info.status).toBe('high')
      expect(info.coefficient).toBe(1.65)
      expect(info.label).toBe('×1.65')
      expect(info.description).toContain('Высокая')
      expect(info.description).toContain('65%')
      expect(info.color).toBe('high')
      expect(info.icon).toBe('🔴')
      expect(info.percentageIncrease).toBe(65)
    })
  })

  describe('Dynamic label generation', () => {
    it('should format elevated coefficient label as ×{value}', () => {
      expect(getAcceptanceStatusInfo(1.25).label).toBe('×1.25')
      expect(getAcceptanceStatusInfo(1.33).label).toBe('×1.33')
      expect(getAcceptanceStatusInfo(1.5).label).toBe('×1.50')
    })

    it('should format high coefficient label as ×{value}', () => {
      expect(getAcceptanceStatusInfo(1.65).label).toBe('×1.65')
      expect(getAcceptanceStatusInfo(2.0).label).toBe('×2.00')
      expect(getAcceptanceStatusInfo(2.5).label).toBe('×2.50')
    })
  })

  describe('Percentage increase in description', () => {
    it('should include correct percentage in elevated description', () => {
      const info = getAcceptanceStatusInfo(1.25)
      expect(info.description).toMatch(/25%/)
    })

    it('should include correct percentage in high description', () => {
      const info = getAcceptanceStatusInfo(1.65)
      expect(info.description).toMatch(/65%/)
    })

    it('should round percentage to nearest integer', () => {
      const info = getAcceptanceStatusInfo(1.333)
      expect(info.percentageIncrease).toBe(33)
    })
  })
})

// ============================================================================
// formatCoefficient Tests
// ============================================================================

describe('formatCoefficient', () => {
  describe('Format coefficient for display', () => {
    it.each(FORMAT_TEST_CASES)(
      'coefficient $coefficient should format as "$expected"',
      ({ coefficient, expected }) => {
        expect(formatCoefficient(coefficient)).toBe(expected)
      }
    )
  })

  describe('Edge cases', () => {
    it('should handle undefined as "Н/Д"', () => {
      expect(formatCoefficient(undefined as unknown as number)).toBe('Н/Д')
    })

    it('should handle null as "Н/Д"', () => {
      expect(formatCoefficient(null as unknown as number)).toBe('Н/Д')
    })

    it('should handle NaN as "Н/Д"', () => {
      expect(formatCoefficient(NaN)).toBe('Н/Д')
    })
  })

  describe('Decimal precision', () => {
    it('should always show 2 decimal places for multipliers', () => {
      expect(formatCoefficient(1.1)).toBe('×1.10')
      expect(formatCoefficient(2)).toBe('×2.00')
      expect(formatCoefficient(1.999)).toBe('×2.00')
    })

    it('should round to 2 decimal places', () => {
      expect(formatCoefficient(1.666)).toBe('×1.67')
      expect(formatCoefficient(1.334)).toBe('×1.33')
    })
  })
})

// ============================================================================
// calculatePercentageIncrease Tests
// ============================================================================

describe('calculatePercentageIncrease', () => {
  describe('Calculate percentage from coefficient', () => {
    it.each(PERCENTAGE_TEST_CASES)(
      'coefficient $coefficient should return $expected',
      ({ coefficient, expected }) => {
        expect(calculatePercentageIncrease(coefficient)).toBe(expected)
      }
    )
  })

  describe('Formula verification', () => {
    // Story AC5: Calculate percentage: (coefficient - 1) * 100
    it('should calculate using (coefficient - 1) * 100 formula', () => {
      expect(calculatePercentageIncrease(1.5)).toBe(50)
      expect(calculatePercentageIncrease(2.0)).toBe(100)
      expect(calculatePercentageIncrease(1.1)).toBe(10)
    })
  })

  describe('Rounding', () => {
    it('should round to nearest integer', () => {
      expect(calculatePercentageIncrease(1.666)).toBe(67)
      expect(calculatePercentageIncrease(1.334)).toBe(33)
      expect(calculatePercentageIncrease(1.125)).toBe(13)
    })
  })

  describe('Edge cases', () => {
    it('should return null for coefficient <= 1', () => {
      expect(calculatePercentageIncrease(1)).toBeNull()
      expect(calculatePercentageIncrease(0)).toBeNull()
      expect(calculatePercentageIncrease(-1)).toBeNull()
      expect(calculatePercentageIncrease(0.5)).toBeNull()
    })
  })
})

// ============================================================================
// Helper Function Tests
// ============================================================================

describe('isAcceptanceAvailable', () => {
  it('should return false for coefficient -1', () => {
    expect(isAcceptanceAvailable(-1)).toBe(false)
  })

  it('should return true for coefficient >= 0', () => {
    expect(isAcceptanceAvailable(0)).toBe(true)
    expect(isAcceptanceAvailable(1)).toBe(true)
    expect(isAcceptanceAvailable(1.65)).toBe(true)
  })

  it('should return false for undefined/null/NaN', () => {
    expect(isAcceptanceAvailable(undefined as unknown as number)).toBe(false)
    expect(isAcceptanceAvailable(null as unknown as number)).toBe(false)
    expect(isAcceptanceAvailable(NaN)).toBe(false)
  })
})

describe('isFreeAcceptance', () => {
  it('should return true only for coefficient 0', () => {
    expect(isFreeAcceptance(0)).toBe(true)
  })

  it('should return false for all other coefficients', () => {
    expect(isFreeAcceptance(-1)).toBe(false)
    expect(isFreeAcceptance(1)).toBe(false)
    expect(isFreeAcceptance(1.65)).toBe(false)
    expect(isFreeAcceptance(0.1)).toBe(false)
  })
})

describe('isElevatedAcceptance', () => {
  it('should return true for coefficient > 1', () => {
    expect(isElevatedAcceptance(1.01)).toBe(true)
    expect(isElevatedAcceptance(1.25)).toBe(true)
    expect(isElevatedAcceptance(1.65)).toBe(true)
    expect(isElevatedAcceptance(2.5)).toBe(true)
  })

  it('should return false for coefficient <= 1', () => {
    expect(isElevatedAcceptance(1)).toBe(false)
    expect(isElevatedAcceptance(0)).toBe(false)
    expect(isElevatedAcceptance(-1)).toBe(false)
  })
})

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('should return valid AcceptanceStatus type', () => {
    const validStatuses: AcceptanceStatus[] = [
      'unavailable',
      'free',
      'standard',
      'elevated',
      'high',
    ]
    const status = getAcceptanceStatus(1.5)
    expect(validStatuses).toContain(status)
  })

  it('getAcceptanceStatusInfo should return AcceptanceStatusInfo type', () => {
    const info = getAcceptanceStatusInfo(1.65)

    // Verify all required fields exist with correct types
    expect(typeof info.status).toBe('string')
    expect(typeof info.coefficient).toBe('number')
    expect(typeof info.label).toBe('string')
    expect(typeof info.description).toBe('string')
    expect(typeof info.color).toBe('string')
    expect(typeof info.icon).toBe('string')
    expect(
      info.percentageIncrease === null ||
        typeof info.percentageIncrease === 'number'
    ).toBe(true)
  })
})
