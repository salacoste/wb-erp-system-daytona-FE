/**
 * Unit Tests for Acceptance Status Configuration
 * Covers: formatCoefficient, calculatePercentageIncrease, isAcceptanceAvailable,
 *         isFreeAcceptance, isElevatedAcceptance, ACCEPTANCE_STATUS_CONFIG
 */

import { describe, it, expect } from 'vitest'
import {
  ACCEPTANCE_STATUS_CONFIG,
  formatCoefficient,
  calculatePercentageIncrease,
  isAcceptanceAvailable,
  isFreeAcceptance,
  isElevatedAcceptance,
} from '../acceptance-status-config'

// =============================================================================
// ACCEPTANCE_STATUS_CONFIG
// =============================================================================

describe('ACCEPTANCE_STATUS_CONFIG', () => {
  it('has config for all 5 statuses', () => {
    const statuses = ['unavailable', 'free', 'standard', 'elevated', 'high']
    statuses.forEach(status => {
      expect(
        ACCEPTANCE_STATUS_CONFIG[status as keyof typeof ACCEPTANCE_STATUS_CONFIG]
      ).toBeDefined()
    })
  })

  it('each config has label, description, color, and icon', () => {
    Object.values(ACCEPTANCE_STATUS_CONFIG).forEach(config => {
      expect(config.label).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.color).toBeTruthy()
      expect(typeof config.icon).toBe('string')
    })
  })
})

// =============================================================================
// formatCoefficient
// =============================================================================

describe('formatCoefficient', () => {
  it('returns "Н/Д" for NaN', () => {
    expect(formatCoefficient(Number.NaN)).toBe('Н/Д')
  })

  it('returns "Н/Д" for -1 (unavailable)', () => {
    expect(formatCoefficient(-1)).toBe('Н/Д')
  })

  it('returns "Бесплатно" for 0 (free)', () => {
    expect(formatCoefficient(0)).toBe('Бесплатно')
  })

  it('formats standard coefficient 1 as multiplier', () => {
    const result = formatCoefficient(1)
    expect(result).toContain('×')
    expect(result).toContain('1')
  })

  it('formats elevated coefficient with decimal', () => {
    const result = formatCoefficient(1.65)
    expect(result).toContain('×')
    expect(result).toContain('1,65')
  })

  it('formats high coefficient', () => {
    const result = formatCoefficient(2.5)
    expect(result).toContain('×')
    expect(result).toContain('2,5')
  })
})

// =============================================================================
// calculatePercentageIncrease
// =============================================================================

describe('calculatePercentageIncrease', () => {
  it('returns null for coefficient <= 1', () => {
    expect(calculatePercentageIncrease(1)).toBeNull()
  })

  it('returns null for coefficient = 0', () => {
    expect(calculatePercentageIncrease(0)).toBeNull()
  })

  it('returns null for negative coefficient', () => {
    expect(calculatePercentageIncrease(-1)).toBeNull()
  })

  it('calculates 25% increase for 1.25', () => {
    expect(calculatePercentageIncrease(1.25)).toBe(25)
  })

  it('calculates 65% increase for 1.65', () => {
    expect(calculatePercentageIncrease(1.65)).toBe(65)
  })

  it('calculates 100% increase for 2.0', () => {
    expect(calculatePercentageIncrease(2.0)).toBe(100)
  })

  it('rounds fractional results', () => {
    // (1.333 - 1) * 100 = 33.3 -> rounds to 33
    expect(calculatePercentageIncrease(1.333)).toBe(33)
  })
})

// =============================================================================
// isAcceptanceAvailable
// =============================================================================

describe('isAcceptanceAvailable', () => {
  it('returns true for coefficient 0', () => {
    expect(isAcceptanceAvailable(0)).toBe(true)
  })

  it('returns true for coefficient 1', () => {
    expect(isAcceptanceAvailable(1)).toBe(true)
  })

  it('returns true for positive coefficient', () => {
    expect(isAcceptanceAvailable(1.5)).toBe(true)
  })

  it('returns false for coefficient -1', () => {
    expect(isAcceptanceAvailable(-1)).toBe(false)
  })

  it('returns false for NaN', () => {
    expect(isAcceptanceAvailable(Number.NaN)).toBe(false)
  })

  it('returns false for negative coefficient', () => {
    expect(isAcceptanceAvailable(-5)).toBe(false)
  })
})

// =============================================================================
// isFreeAcceptance
// =============================================================================

describe('isFreeAcceptance', () => {
  it('returns true for coefficient 0', () => {
    expect(isFreeAcceptance(0)).toBe(true)
  })

  it('returns false for coefficient 1', () => {
    expect(isFreeAcceptance(1)).toBe(false)
  })

  it('returns false for negative coefficient', () => {
    expect(isFreeAcceptance(-1)).toBe(false)
  })
})

// =============================================================================
// isElevatedAcceptance
// =============================================================================

describe('isElevatedAcceptance', () => {
  it('returns false for coefficient 1', () => {
    expect(isElevatedAcceptance(1)).toBe(false)
  })

  it('returns false for coefficient 0', () => {
    expect(isElevatedAcceptance(0)).toBe(false)
  })

  it('returns true for coefficient > 1', () => {
    expect(isElevatedAcceptance(1.01)).toBe(true)
  })

  it('returns true for high coefficient', () => {
    expect(isElevatedAcceptance(2.0)).toBe(true)
  })

  it('returns false for negative coefficient', () => {
    expect(isElevatedAcceptance(-1)).toBe(false)
  })
})
