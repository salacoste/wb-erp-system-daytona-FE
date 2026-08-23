/**
 * Tests for returns-comparison-utils
 * Story 127.5-FE: WoW comparison delta calculations
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePreviousPeriod,
  calculateReturnsDelta,
  formatDelta,
  getDeltaColor,
  isInvertedMetric,
} from '../returns-comparison-utils'

describe('returns-comparison-utils', () => {
  describe('calculatePreviousPeriod', () => {
    it('shifts a 7-day range back by 7 days', () => {
      const result = calculatePreviousPeriod('2026-05-10', '2026-05-16')
      expect(result).toEqual({ prevFrom: '2026-05-03', prevTo: '2026-05-09' })
    })

    it('shifts a 30-day range back by 30 days', () => {
      const result = calculatePreviousPeriod('2026-06-01', '2026-06-30')
      expect(result).toEqual({ prevFrom: '2026-05-02', prevTo: '2026-05-31' })
    })

    it('handles single-day range', () => {
      const result = calculatePreviousPeriod('2026-05-15', '2026-05-15')
      expect(result).toEqual({ prevFrom: '2026-05-14', prevTo: '2026-05-14' })
    })

    it('handles year boundary', () => {
      const result = calculatePreviousPeriod('2026-01-03', '2026-01-09')
      expect(result).toEqual({ prevFrom: '2025-12-27', prevTo: '2026-01-02' })
    })
  })

  describe('calculateReturnsDelta', () => {
    it('returns null when current is null', () => {
      expect(calculateReturnsDelta(null, 10)).toBeNull()
    })

    it('returns null when previous is null', () => {
      expect(calculateReturnsDelta(10, null)).toBeNull()
    })

    it('returns neutral when previous is zero', () => {
      expect(calculateReturnsDelta(5, 0)).toEqual({ percent: 0, direction: 'neutral' })
    })

    it('returns up direction for increase', () => {
      const result = calculateReturnsDelta(150, 100)
      expect(result?.direction).toBe('up')
      expect(result?.percent).toBe(50)
    })

    it('returns down direction for decrease', () => {
      const result = calculateReturnsDelta(80, 100)
      expect(result?.direction).toBe('down')
      expect(result?.percent).toBe(-20)
    })

    it('returns neutral when values are equal', () => {
      expect(calculateReturnsDelta(100, 100)).toEqual({ percent: 0, direction: 'neutral' })
    })
  })

  describe('formatDelta', () => {
    it('formats up direction with ▲', () => {
      const result = formatDelta({ percent: 25.5, direction: 'up' })
      expect(result).toContain('▲')
      expect(result).toContain('25,5')
    })

    it('formats down direction with ▼', () => {
      const result = formatDelta({ percent: -10.3, direction: 'down' })
      expect(result).toContain('▼')
      expect(result).toContain('10,3')
    })

    it('formats neutral with —', () => {
      const result = formatDelta({ percent: 0, direction: 'neutral' })
      expect(result).toContain('—')
    })
  })

  describe('getDeltaColor', () => {
    it('returns muted for neutral', () => {
      expect(getDeltaColor('neutral', false)).toBe('text-muted-foreground')
    })

    it('returns positive token for up (non-inverted)', () => {
      // Story 169.11: financial tokens replace palette classes
      expect(getDeltaColor('up', false)).toBe('text-financial-positive')
    })

    it('returns negative token for down (non-inverted)', () => {
      expect(getDeltaColor('down', false)).toBe('text-financial-negative')
    })

    it('flips tokens for inverted metrics', () => {
      expect(getDeltaColor('up', true)).toBe('text-financial-negative')
      expect(getDeltaColor('down', true)).toBe('text-financial-positive')
    })
  })

  describe('isInvertedMetric', () => {
    it('totalReturns is inverted (more returns = bad)', () => {
      expect(isInvertedMetric('totalReturns')).toBe(true)
    })

    it('overallReturnRate is inverted (higher rate = bad)', () => {
      expect(isInvertedMetric('overallReturnRate')).toBe(true)
    })

    it('classificationCoverage is NOT inverted (higher = better)', () => {
      expect(isInvertedMetric('classificationCoverage')).toBe(false)
    })
  })
})
