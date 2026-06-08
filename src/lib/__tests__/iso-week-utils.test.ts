/**
 * Unit tests for iso-week-utils (compatibility re-export layer)
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 *
 * Tests the re-export barrel works correctly by exercising key functions
 * that delegate to the modular iso-week structure.
 */

import { describe, it, expect } from 'vitest'
import {
  getCurrentIsoWeek,
  parseIsoWeek,
  getPreviousIsoWeek,
  getNextIsoWeek,
  isValidIsoWeekFormat,
  compareIsoWeeks,
  isoWeekToDateRange,
  getWeekStartDate,
  getWeekEndDate,
  getWeekMidpoint,
  buildPeriodRange,
  generateWeekSequence,
} from '../iso-week-utils'

// ============================================================================
// Re-export integrity — smoke tests
// ============================================================================

describe('iso-week-utils re-exports', () => {
  describe('getCurrentIsoWeek', () => {
    it('returns a valid ISO week string', () => {
      const week = getCurrentIsoWeek()
      expect(isValidIsoWeekFormat(week)).toBe(true)
    })
  })

  describe('parseIsoWeek', () => {
    it('parses a valid ISO week string to a Date', () => {
      const result = parseIsoWeek('2025-W46')
      expect(result).toBeInstanceOf(Date)
    })

    it('throws for invalid format', () => {
      expect(() => parseIsoWeek('invalid')).toThrow('Invalid ISO week format')
    })

    it('throws for empty string', () => {
      expect(() => parseIsoWeek('')).toThrow('Invalid ISO week format')
    })
  })

  describe('getPreviousIsoWeek', () => {
    it('returns the previous week', () => {
      expect(getPreviousIsoWeek('2025-W02')).toBe('2025-W01')
    })

    it('crosses year boundary from W01 to previous year', () => {
      const result = getPreviousIsoWeek('2026-W01')
      expect(result).toMatch(/^2025-W5[0-3]$/)
    })
  })

  describe('getNextIsoWeek', () => {
    it('returns the next week', () => {
      expect(getNextIsoWeek('2025-W01')).toBe('2025-W02')
    })

    it('crosses year boundary from W52 to next year', () => {
      const result = getNextIsoWeek('2025-W52')
      expect(result).toMatch(/^2026-W01$/)
    })
  })

  describe('isValidIsoWeekFormat', () => {
    it('accepts valid ISO week', () => {
      expect(isValidIsoWeekFormat('2025-W01')).toBe(true)
    })

    it('rejects invalid format', () => {
      expect(isValidIsoWeekFormat('2025-W00')).toBe(false)
    })

    it('rejects non-week string', () => {
      expect(isValidIsoWeekFormat('not-a-week')).toBe(false)
    })
  })

  describe('compareIsoWeeks', () => {
    it('returns 0 for equal weeks', () => {
      expect(compareIsoWeeks('2025-W10', '2025-W10')).toBe(0)
    })

    it('returns negative when first is earlier', () => {
      expect(compareIsoWeeks('2025-W10', '2025-W11')).toBeLessThan(0)
    })

    it('returns positive when first is later', () => {
      expect(compareIsoWeeks('2025-W11', '2025-W10')).toBeGreaterThan(0)
    })
  })

  describe('isoWeekToDateRange', () => {
    it('returns from/to date strings for a week', () => {
      const range = isoWeekToDateRange('2025-W01')
      expect(typeof range.from).toBe('string')
      expect(typeof range.to).toBe('string')
    })

    it('to date is after from date', () => {
      const range = isoWeekToDateRange('2025-W10')
      expect(new Date(range.to) > new Date(range.from)).toBe(true)
    })
  })

  describe('getWeekStartDate', () => {
    it('returns a Date for Monday of the week', () => {
      const start = getWeekStartDate('2025-W01')
      expect(start).toBeInstanceOf(Date)
    })
  })

  describe('getWeekEndDate', () => {
    it('returns a Date after start date', () => {
      const start = getWeekStartDate('2025-W10')
      const end = getWeekEndDate('2025-W10')
      expect(end > start).toBe(true)
    })
  })

  describe('getWeekMidpoint', () => {
    it('returns a Date between start and end', () => {
      const start = getWeekStartDate('2025-W10')
      const mid = getWeekMidpoint('2025-W10')
      const end = getWeekEndDate('2025-W10')
      expect(mid >= start).toBe(true)
      expect(mid <= end).toBe(true)
    })
  })

  describe('buildPeriodRange (array -> range string)', () => {
    it('builds a range string from consecutive weeks', () => {
      const range = buildPeriodRange(['2025-W01', '2025-W02', '2025-W03', '2025-W04'])
      // Same year → short format: 2025-W01:W04
      expect(range).toBe('2025-W01:W04')
    })

    it('returns single week when array has one element', () => {
      const range = buildPeriodRange(['2025-W10'])
      expect(range).toBe('2025-W10')
    })

    it('returns empty string for empty array', () => {
      const range = buildPeriodRange([])
      expect(range).toBe('')
    })
  })

  describe('generateWeekSequence', () => {
    it('generates a sequence of weeks', () => {
      const seq = generateWeekSequence('2025-W01', '2025-W04')
      expect(seq.length).toBe(4)
      expect(seq[0]).toBe('2025-W01')
      expect(seq[3]).toBe('2025-W04')
    })

    it('returns single week when start equals end', () => {
      const seq = generateWeekSequence('2025-W10', '2025-W10')
      expect(seq).toEqual(['2025-W10'])
    })
  })
})
