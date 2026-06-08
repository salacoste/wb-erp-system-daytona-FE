/**
 * Unit Tests for Logistics Utilities
 * Covers: determineCargoType, canAutoFillForwardLogistics, calculateEffectiveReverseLogistics
 */

import { describe, it, expect } from 'vitest'
import {
  determineCargoType,
  canAutoFillForwardLogistics,
  calculateEffectiveReverseLogistics,
} from '../logistics-utils'

// =============================================================================
// determineCargoType
// =============================================================================

describe('determineCargoType', () => {
  it('returns MGT for all dimensions <= 60cm', () => {
    expect(determineCargoType(30, 40, 50)).toBe('MGT')
  })

  it('returns MGT when max dimension is exactly 60cm', () => {
    expect(determineCargoType(60, 10, 10)).toBe('MGT')
  })

  it('returns SGT when max dimension is 61cm', () => {
    expect(determineCargoType(61, 10, 10)).toBe('SGT')
  })

  it('returns SGT for dimensions between 61-120cm', () => {
    expect(determineCargoType(30, 90, 20)).toBe('SGT')
  })

  it('returns SGT when max dimension is exactly 120cm', () => {
    expect(determineCargoType(120, 10, 10)).toBe('SGT')
  })

  it('returns KGT when max dimension is 121cm', () => {
    expect(determineCargoType(121, 10, 10)).toBe('KGT')
  })

  it('returns KGT for large oversized parcels', () => {
    expect(determineCargoType(200, 150, 100)).toBe('KGT')
  })

  it('uses maximum dimension regardless of position', () => {
    expect(determineCargoType(10, 65, 10)).toBe('SGT')
    expect(determineCargoType(10, 10, 65)).toBe('SGT')
  })

  it('returns MGT for all zeros', () => {
    expect(determineCargoType(0, 0, 0)).toBe('MGT')
  })

  it('returns MGT for very small dimensions', () => {
    expect(determineCargoType(1, 1, 1)).toBe('MGT')
  })
})

// =============================================================================
// canAutoFillForwardLogistics
// =============================================================================

describe('canAutoFillForwardLogistics', () => {
  it('returns false when warehouse is missing', () => {
    const result = canAutoFillForwardLogistics({
      dimensions: { lengthCm: 30, widthCm: 40, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(false)
    expect(result.reason).toBeDefined()
  })

  it('returns false when warehouse is empty string', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: '  ',
      dimensions: { lengthCm: 30, widthCm: 40, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(false)
  })

  it('returns false when neither volume nor dimensions provided', () => {
    const result = canAutoFillForwardLogistics({ warehouseName: 'Склад' })
    expect(result.canAutoFill).toBe(false)
  })

  it('returns false when volume is 0', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Склад',
      volumeLiters: 0,
    })
    expect(result.canAutoFill).toBe(false)
  })

  it('returns false when dimensions have zero values', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Склад',
      dimensions: { lengthCm: 30, widthCm: 0, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(false)
  })

  it('returns true with warehouse and volume', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Коледино',
      volumeLiters: 5,
    })
    expect(result.canAutoFill).toBe(true)
  })

  it('returns true with warehouse and MGT dimensions', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Коледино',
      dimensions: { lengthCm: 30, widthCm: 40, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(true)
    expect(result.cargoType).toBe('MGT')
  })

  it('returns true with warehouse and SGT dimensions', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Коледино',
      dimensions: { lengthCm: 80, widthCm: 40, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(true)
    expect(result.cargoType).toBe('SGT')
  })

  it('returns false for KGT dimensions (oversized)', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Коледино',
      dimensions: { lengthCm: 130, widthCm: 40, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(false)
    expect(result.cargoType).toBe('KGT')
    expect(result.reason).toContain('KGT')
  })

  it('prefers dimensions over volume when both provided', () => {
    const result = canAutoFillForwardLogistics({
      warehouseName: 'Склад',
      volumeLiters: 5,
      dimensions: { lengthCm: 30, widthCm: 40, heightCm: 50 },
    })
    expect(result.canAutoFill).toBe(true)
    expect(result.cargoType).toBe('MGT')
  })
})

// =============================================================================
// calculateEffectiveReverseLogistics
// =============================================================================

describe('calculateEffectiveReverseLogistics', () => {
  it('returns 0 for zero reverse logistics cost', () => {
    expect(calculateEffectiveReverseLogistics(0, 98)).toBe(0)
  })

  it('returns 0 for negative reverse logistics cost', () => {
    expect(calculateEffectiveReverseLogistics(-10, 50)).toBe(0)
  })

  it('calculates effective cost with 98% buyback', () => {
    // 72.50 * (1 - 0.98) = 72.50 * 0.02 = 1.45
    expect(calculateEffectiveReverseLogistics(72.5, 98)).toBeCloseTo(1.45, 2)
  })

  it('returns full cost when buyback is 0%', () => {
    expect(calculateEffectiveReverseLogistics(100, 0)).toBe(100)
  })

  it('returns 0 when buyback is 100%', () => {
    expect(calculateEffectiveReverseLogistics(100, 100)).toBe(0)
  })

  it('clamps buyback > 100% to 100%', () => {
    expect(calculateEffectiveReverseLogistics(100, 150)).toBe(0)
  })

  it('clamps negative buyback to 0%', () => {
    expect(calculateEffectiveReverseLogistics(100, -10)).toBe(100)
  })

  it('calculates partial buyback correctly', () => {
    // 50 * (1 - 0.5) = 25
    expect(calculateEffectiveReverseLogistics(50, 50)).toBe(25)
  })

  it('handles small reverse logistics cost', () => {
    expect(calculateEffectiveReverseLogistics(0.01, 50)).toBeCloseTo(0.005, 4)
  })
})
