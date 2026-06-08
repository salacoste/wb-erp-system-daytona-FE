/**
 * Unit Tests for Coefficient Utilities (comprehensive)
 * Covers: normalizeCoefficient, denormalizeCoefficient, getCoefficientStatus,
 *         getCoefficientStatusConfig, normalizeCoefficients, calculateCoefficientImpact
 *
 * Note: coefficient-utils.story-44.9.test.ts exists but covers a subset;
 * this file provides comprehensive coverage of all pure functions.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeCoefficient,
  denormalizeCoefficient,
  getCoefficientStatus,
  getCoefficientStatusConfig,
  normalizeCoefficients,
  calculateCoefficientImpact,
} from '../coefficient-utils'

// =============================================================================
// normalizeCoefficient
// =============================================================================

describe('normalizeCoefficient', () => {
  it('normalizes 100 to 1.0', () => {
    expect(normalizeCoefficient(100)).toBe(1)
  })

  it('normalizes 125 to 1.25', () => {
    expect(normalizeCoefficient(125)).toBe(1.25)
  })

  it('normalizes 0 to 0', () => {
    expect(normalizeCoefficient(0)).toBe(0)
  })

  it('normalizes -100 to -1', () => {
    expect(normalizeCoefficient(-100)).toBe(-1)
  })

  it('normalizes 50 to 0.5', () => {
    expect(normalizeCoefficient(50)).toBe(0.5)
  })

  it('normalizes 200 to 2.0', () => {
    expect(normalizeCoefficient(200)).toBe(2)
  })
})

// =============================================================================
// denormalizeCoefficient
// =============================================================================

describe('denormalizeCoefficient', () => {
  it('denormalizes 1.0 to 100', () => {
    expect(denormalizeCoefficient(1.0)).toBe(100)
  })

  it('denormalizes 1.25 to 125', () => {
    expect(denormalizeCoefficient(1.25)).toBe(125)
  })

  it('denormalizes 0 to 0', () => {
    expect(denormalizeCoefficient(0)).toBe(0)
  })

  it('rounds fractional results', () => {
    // 1.333 * 100 = 133.3 -> 133
    expect(denormalizeCoefficient(1.333)).toBe(133)
  })

  it('denormalizes 2.0 to 200', () => {
    expect(denormalizeCoefficient(2.0)).toBe(200)
  })
})

// =============================================================================
// getCoefficientStatus
// =============================================================================

describe('getCoefficientStatus', () => {
  it('returns "unavailable" for negative coefficient', () => {
    expect(getCoefficientStatus(-1)).toBe('unavailable')
    expect(getCoefficientStatus(-5)).toBe('unavailable')
  })

  it('returns "base" for coefficient 0 (FREE)', () => {
    expect(getCoefficientStatus(0)).toBe('base')
  })

  it('returns "base" for coefficient 1.0', () => {
    expect(getCoefficientStatus(1.0)).toBe('base')
  })

  it('returns "base" for coefficient between 0 and 1', () => {
    expect(getCoefficientStatus(0.5)).toBe('base')
  })

  it('returns "elevated" for coefficient 1.01-1.5', () => {
    expect(getCoefficientStatus(1.01)).toBe('elevated')
    expect(getCoefficientStatus(1.25)).toBe('elevated')
    expect(getCoefficientStatus(1.5)).toBe('elevated')
  })

  it('returns "high" for coefficient 1.51-2.0', () => {
    expect(getCoefficientStatus(1.51)).toBe('high')
    expect(getCoefficientStatus(1.75)).toBe('high')
    expect(getCoefficientStatus(2.0)).toBe('high')
  })

  it('returns "peak" for coefficient > 2.0', () => {
    expect(getCoefficientStatus(2.01)).toBe('peak')
    expect(getCoefficientStatus(3.0)).toBe('peak')
  })
})

// =============================================================================
// getCoefficientStatusConfig
// =============================================================================

describe('getCoefficientStatusConfig', () => {
  it('returns config with status, label, and colors', () => {
    const config = getCoefficientStatusConfig(1.0)
    expect(config.status).toBe('base')
    expect(config.label).toBeTruthy()
    expect(config).toHaveProperty('color')
    expect(config).toHaveProperty('bgColor')
    expect(config).toHaveProperty('textColor')
  })

  it('returns elevated config for 1.25', () => {
    expect(getCoefficientStatusConfig(1.25).status).toBe('elevated')
  })

  it('returns unavailable config for -1', () => {
    expect(getCoefficientStatusConfig(-1).status).toBe('unavailable')
  })
})

// =============================================================================
// normalizeCoefficients
// =============================================================================

describe('normalizeCoefficients', () => {
  it('normalizes array of raw coefficients', () => {
    const raw = [
      { date: '2025-01-01', coefficient: 100 },
      { date: '2025-01-02', coefficient: 125 },
    ]
    const result = normalizeCoefficients(raw)
    expect(result).toHaveLength(2)
    expect(result[0].coefficient).toBe(1)
    expect(result[1].coefficient).toBe(1.25)
    expect(result[0].status).toBe('base')
    expect(result[1].status).toBe('elevated')
  })

  it('preserves date', () => {
    const raw = [{ date: '2025-06-15', coefficient: 100 }]
    const result = normalizeCoefficients(raw)
    expect(result[0].date).toBe('2025-06-15')
  })

  it('defaults isAvailable to true for coefficient >= 0', () => {
    const raw = [{ date: '2025-01-01', coefficient: 100 }]
    const result = normalizeCoefficients(raw)
    expect(result[0].isAvailable).toBe(true)
  })

  it('defaults isAvailable to false for coefficient < 0', () => {
    const raw = [{ date: '2025-01-01', coefficient: -100 }]
    const result = normalizeCoefficients(raw)
    expect(result[0].isAvailable).toBe(false)
  })

  it('uses provided isAvailable over default', () => {
    const raw = [{ date: '2025-01-01', coefficient: 100, isAvailable: false }]
    const result = normalizeCoefficients(raw)
    expect(result[0].isAvailable).toBe(false)
  })

  it('handles empty array', () => {
    expect(normalizeCoefficients([])).toEqual([])
  })
})

// =============================================================================
// calculateCoefficientImpact
// =============================================================================

describe('calculateCoefficientImpact', () => {
  it('returns zero impact for base coefficient', () => {
    const result = calculateCoefficientImpact(100, 1.0)
    expect(result.increase).toBe(0)
    expect(result.percentIncrease).toBe(0)
  })

  it('returns zero impact for zero base cost', () => {
    const result = calculateCoefficientImpact(0, 1.5)
    expect(result.increase).toBe(0)
    expect(result.percentIncrease).toBe(0)
  })

  it('returns zero impact for negative base cost', () => {
    const result = calculateCoefficientImpact(-10, 1.5)
    expect(result.increase).toBe(0)
  })

  it('calculates impact for elevated coefficient', () => {
    // base=100, coeff=1.25 => adjusted=125, increase=25, pct=25
    const result = calculateCoefficientImpact(100, 1.25)
    expect(result.increase).toBe(25)
    expect(result.percentIncrease).toBe(25)
  })

  it('calculates impact for high coefficient', () => {
    // base=50, coeff=2.0 => adjusted=100, increase=50, pct=100
    const result = calculateCoefficientImpact(50, 2.0)
    expect(result.increase).toBe(50)
    expect(result.percentIncrease).toBe(100)
  })

  it('formats increaseDisplay with currency', () => {
    const result = calculateCoefficientImpact(100, 1.5)
    expect(result.increaseDisplay).toContain('+')
    expect(result.increaseDisplay).toContain('₽')
  })

  it('formats percentDisplay with plus sign', () => {
    const result = calculateCoefficientImpact(100, 1.5)
    expect(result.percentDisplay).toContain('+')
    expect(result.percentDisplay).toContain('%')
  })
})
