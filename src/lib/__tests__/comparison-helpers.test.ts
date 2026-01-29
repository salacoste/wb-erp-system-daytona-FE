/**
 * Tests for Story 60.3-FE: Comparison Helper Functions
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Pure utility functions for calculating percentage changes, trends, and formatting.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

import { describe, it, expect } from 'vitest'
import { calculateComparison } from '../comparison-helpers'

// =============================================================================
// calculateComparison Function
// =============================================================================

describe('Story 60.3-FE: calculateComparison', () => {
  describe('positive change calculation', () => {
    it('calculates positive percentage correctly', () => {
      const result = calculateComparison(110, 100)
      expect(result?.percentageChange).toBeCloseTo(10, 2)
    })

    it('returns positive direction for increase', () => {
      const result = calculateComparison(110, 100)
      expect(result?.direction).toBe('positive')
    })

    it('formats positive percentage with plus sign', () => {
      const result = calculateComparison(110, 100)
      expect(result?.formattedPercentage).toMatch(/^\+/)
    })

    it('calculates absolute difference correctly', () => {
      const result = calculateComparison(110, 100)
      expect(result?.absoluteDifference).toBe(10)
    })

    it('formats positive absolute difference with plus sign', () => {
      const result = calculateComparison(110, 100)
      expect(result?.formattedDifference).toMatch(/^\+/)
    })
  })

  describe('negative change calculation', () => {
    it('calculates negative percentage correctly', () => {
      const result = calculateComparison(90, 100)
      expect(result?.percentageChange).toBeCloseTo(-10, 2)
    })

    it('returns negative direction for decrease', () => {
      const result = calculateComparison(90, 100)
      expect(result?.direction).toBe('negative')
    })

    it('formats negative percentage with minus sign', () => {
      const result = calculateComparison(90, 100)
      expect(result?.formattedPercentage).toMatch(/^-/)
    })

    it('calculates negative absolute difference correctly', () => {
      const result = calculateComparison(90, 100)
      expect(result?.absoluteDifference).toBe(-10)
    })
  })

  describe('neutral change calculation', () => {
    it('returns neutral for zero change', () => {
      const result = calculateComparison(100, 100)
      expect(result?.direction).toBe('neutral')
    })

    it('returns neutral for changes below threshold', () => {
      const result = calculateComparison(100.05, 100) // 0.05% < 0.1%
      expect(result?.direction).toBe('neutral')
    })

    it('returns neutral for small negative changes below threshold', () => {
      const result = calculateComparison(99.95, 100) // -0.05% > -0.1%
      expect(result?.direction).toBe('neutral')
    })

    it('returns positive for changes above threshold', () => {
      const result = calculateComparison(100.11, 100) // 0.11% > 0.1%
      expect(result?.direction).toBe('positive')
    })
  })

  describe('inverted comparison (expenses)', () => {
    it('returns positive direction for decrease when inverted', () => {
      const result = calculateComparison(90, 100, true)
      expect(result?.direction).toBe('positive') // Lower is better
    })

    it('returns negative direction for increase when inverted', () => {
      const result = calculateComparison(110, 100, true)
      expect(result?.direction).toBe('negative') // Higher is worse
    })

    it('still calculates correct percentage when inverted', () => {
      const result = calculateComparison(90, 100, true)
      expect(result?.percentageChange).toBeCloseTo(-10, 2)
      // Percentage is still -10%, but direction is positive (good)
    })

    it('returns neutral for no change when inverted', () => {
      const result = calculateComparison(100, 100, true)
      expect(result?.direction).toBe('neutral')
    })
  })

  describe('edge cases - zero previous value', () => {
    it('returns null when previous value is zero', () => {
      const result = calculateComparison(100, 0)
      expect(result).toBeNull()
    })

    it('returns null when previous value is null', () => {
      const result = calculateComparison(100, null)
      expect(result).toBeNull()
    })

    it('returns null when previous value is undefined', () => {
      const result = calculateComparison(100, undefined)
      expect(result).toBeNull()
    })
  })

  describe('edge cases - negative values', () => {
    it('handles negative current value', () => {
      const result = calculateComparison(-50, 100)
      expect(result?.percentageChange).toBeCloseTo(-150, 2)
    })

    it('handles negative previous value with absolute comparison', () => {
      const result = calculateComparison(100, -100)
      // Use Math.abs(previous) for denominator
      expect(result?.percentageChange).toBeCloseTo(200, 2)
    })

    it('handles both values negative', () => {
      const result = calculateComparison(-90, -100)
      // Going from -100 to -90 is an improvement (less negative)
      expect(result?.direction).toBe('positive')
    })
  })

  describe('large percentage changes', () => {
    it('handles percentage > 100%', () => {
      const result = calculateComparison(300, 100)
      expect(result?.percentageChange).toBeCloseTo(200, 2)
    })

    it('handles very large increases', () => {
      const result = calculateComparison(10000, 100)
      expect(result?.percentageChange).toBeCloseTo(9900, 2)
    })

    it('handles complete loss (-100%)', () => {
      const result = calculateComparison(0, 100)
      expect(result?.percentageChange).toBeCloseTo(-100, 2)
    })
  })

  describe('decimal precision', () => {
    it('maintains precision for small percentages', () => {
      const result = calculateComparison(100.5, 100)
      expect(result?.percentageChange).toBeCloseTo(0.5, 2)
    })

    it('rounds formatted percentage to one decimal', () => {
      const result = calculateComparison(100.567, 100)
      expect(result?.formattedPercentage).toMatch(/0,6/)
    })

    it('formats with Russian decimal separator (comma)', () => {
      const result = calculateComparison(110.5, 100)
      expect(result?.formattedPercentage).toContain(',')
    })
  })
})

// =============================================================================
// Result Shape Validation
// =============================================================================

describe('Story 60.3-FE: ComparisonResult shape', () => {
  describe('result structure', () => {
    it('returns object with all required properties', () => {
      const result = calculateComparison(110, 100)
      expect(result).toHaveProperty('percentageChange')
      expect(result).toHaveProperty('formattedPercentage')
      expect(result).toHaveProperty('absoluteDifference')
      expect(result).toHaveProperty('formattedDifference')
      expect(result).toHaveProperty('direction')
    })

    it('percentageChange is a number', () => {
      const result = calculateComparison(110, 100)
      expect(typeof result?.percentageChange).toBe('number')
    })

    it('formattedPercentage is a string', () => {
      const result = calculateComparison(110, 100)
      expect(typeof result?.formattedPercentage).toBe('string')
    })

    it('absoluteDifference is a number', () => {
      const result = calculateComparison(110, 100)
      expect(typeof result?.absoluteDifference).toBe('number')
    })

    it('formattedDifference is a string', () => {
      const result = calculateComparison(110, 100)
      expect(typeof result?.formattedDifference).toBe('string')
    })

    it('direction is one of TrendDirection values', () => {
      const result = calculateComparison(110, 100)
      expect(['positive', 'negative', 'neutral']).toContain(result?.direction)
    })
  })
})

// =============================================================================
// Format Examples (Russian Locale)
// =============================================================================

describe('Story 60.3-FE: Russian Formatting', () => {
  describe('percentage formatting', () => {
    it('formats +10% as "+10,0%"', () => {
      const result = calculateComparison(110, 100)
      expect(result?.formattedPercentage).toBe('+10,0%')
    })

    it('formats -5.2% as "-5,2%"', () => {
      const result = calculateComparison(94.8, 100)
      expect(result?.formattedPercentage).toBe('-5,2%')
    })

    it('formats 0% as "0,0%"', () => {
      const result = calculateComparison(100, 100)
      expect(result?.formattedPercentage).toBe('+0,0%')
    })
  })

  describe('currency difference formatting', () => {
    it('formats positive difference with currency symbol', () => {
      const result = calculateComparison(2000, 1000)
      expect(result?.formattedDifference).toContain('+')
      expect(result?.formattedDifference).toContain('₽')
    })

    it('formats negative difference with minus sign', () => {
      const result = calculateComparison(500, 1000)
      expect(result?.formattedDifference).toMatch(/^-/)
    })

    it('uses space as thousand separator', () => {
      const result = calculateComparison(1100000, 1000000)
      // Should contain space-separated thousands
      expect(result?.formattedDifference).toMatch(/100\s*000/)
    })
  })
})
