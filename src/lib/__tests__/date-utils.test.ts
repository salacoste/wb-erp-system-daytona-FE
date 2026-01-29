/**
 * Unit Tests for Date Utility Functions
 * Story 60.6-FE: Sync Advertising Widget with Global Period
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests for weekToDateRange and monthToDateRange helper functions.
 *
 * @see docs/stories/epic-60/story-60.6-fe-sync-advertising-widget.md
 */

import { describe, it, expect } from 'vitest'
import {
  weekToDateRange,
  monthToDateRange,
  isValidWeekFormat,
  isValidMonthFormat,
} from '../date-utils'

// =============================================================================
// weekToDateRange Function Tests (AC3)
// =============================================================================

describe('Story 60.6-FE: weekToDateRange', () => {
  describe('basic functionality', () => {
    it('should convert 2026-W05 to correct date range', () => {
      const result = weekToDateRange('2026-W05')
      expect(result.from).toBe('2026-01-26') // Monday
      expect(result.to).toBe('2026-02-01') // Sunday
    })

    it('should handle week 1 correctly (may start in previous year)', () => {
      const result = weekToDateRange('2026-W01')
      expect(result.from).toBe('2025-12-29') // Week 1 of 2026 starts in 2025
      expect(result.to).toBe('2026-01-04')
    })

    it('should handle week 52 correctly', () => {
      const result = weekToDateRange('2025-W52')
      expect(result.from).toBe('2025-12-22')
      expect(result.to).toBe('2025-12-28')
    })

    it('should handle week 53 when year has 53 weeks', () => {
      // 2020 had 53 weeks
      const result = weekToDateRange('2020-W53')
      expect(result.from).toBe('2020-12-28')
      expect(result.to).toBe('2021-01-03')
    })

    it('should return dates in YYYY-MM-DD format', () => {
      const result = weekToDateRange('2026-W10')
      expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should handle single-digit week numbers', () => {
      const result = weekToDateRange('2026-W03')
      expect(result.from).toBe('2026-01-12')
      expect(result.to).toBe('2026-01-18')
    })
  })

  describe('week boundaries', () => {
    it('should return Monday as start date', () => {
      const result = weekToDateRange('2026-W05')
      const startDate = new Date(result.from)
      expect(startDate.getDay()).toBe(1) // Monday
    })

    it('should return Sunday as end date', () => {
      const result = weekToDateRange('2026-W05')
      const endDate = new Date(result.to)
      expect(endDate.getDay()).toBe(0) // Sunday
    })

    it('should span exactly 7 days', () => {
      const result = weekToDateRange('2026-W05')
      const startDate = new Date(result.from)
      const endDate = new Date(result.to)
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      expect(daysDiff).toBe(6) // Monday to Sunday = 6 day difference
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid format', () => {
      expect(() => weekToDateRange('invalid')).toThrow('Invalid week format')
      expect(() => weekToDateRange('2026-05')).toThrow('Invalid week format')
      expect(() => weekToDateRange('2026W05')).toThrow('Invalid week format')
    })

    it('should throw error for week 0', () => {
      expect(() => weekToDateRange('2026-W00')).toThrow('Invalid week number')
    })

    it('should throw error for week 54', () => {
      expect(() => weekToDateRange('2026-W54')).toThrow('Invalid week number')
    })
  })
})

// =============================================================================
// monthToDateRange Function Tests
// =============================================================================

describe('Story 60.6-FE: monthToDateRange', () => {
  describe('basic functionality', () => {
    it('should convert 2026-01 to correct date range', () => {
      const result = monthToDateRange('2026-01')
      expect(result.from).toBe('2026-01-01')
      expect(result.to).toBe('2026-01-31')
    })

    it('should handle February correctly (non-leap year)', () => {
      const result = monthToDateRange('2026-02')
      expect(result.from).toBe('2026-02-01')
      expect(result.to).toBe('2026-02-28') // 2026 is not a leap year
    })

    it('should handle February correctly (leap year)', () => {
      const result = monthToDateRange('2024-02')
      expect(result.from).toBe('2024-02-01')
      expect(result.to).toBe('2024-02-29') // 2024 is a leap year
    })

    it('should handle month with 30 days', () => {
      const result = monthToDateRange('2026-04')
      expect(result.from).toBe('2026-04-01')
      expect(result.to).toBe('2026-04-30')
    })

    it('should handle December (year boundary)', () => {
      const result = monthToDateRange('2026-12')
      expect(result.from).toBe('2026-12-01')
      expect(result.to).toBe('2026-12-31')
    })

    it('should return dates in YYYY-MM-DD format', () => {
      const result = monthToDateRange('2026-06')
      expect(result.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('all months coverage', () => {
    const months = [
      { month: '2026-01', days: 31 },
      { month: '2026-02', days: 28 },
      { month: '2026-03', days: 31 },
      { month: '2026-04', days: 30 },
      { month: '2026-05', days: 31 },
      { month: '2026-06', days: 30 },
      { month: '2026-07', days: 31 },
      { month: '2026-08', days: 31 },
      { month: '2026-09', days: 30 },
      { month: '2026-10', days: 31 },
      { month: '2026-11', days: 30 },
      { month: '2026-12', days: 31 },
    ]

    months.forEach(({ month, days }) => {
      it(`should return correct last day for ${month} (${days} days)`, () => {
        const result = monthToDateRange(month)
        expect(result.to).toBe(`${month}-${days.toString().padStart(2, '0')}`)
      })
    })
  })

  describe('error handling', () => {
    it('should throw error for invalid format', () => {
      expect(() => monthToDateRange('invalid')).toThrow('Invalid month format')
      expect(() => monthToDateRange('2026-1')).toThrow('Invalid month format')
      expect(() => monthToDateRange('202601')).toThrow('Invalid month format')
    })

    it('should throw error for month 0', () => {
      expect(() => monthToDateRange('2026-00')).toThrow('Invalid month number')
    })

    it('should throw error for month 13', () => {
      expect(() => monthToDateRange('2026-13')).toThrow('Invalid month number')
    })
  })
})

// =============================================================================
// Validation Function Tests
// =============================================================================

describe('Story 60.6-FE: isValidWeekFormat', () => {
  it('should return true for valid week format', () => {
    expect(isValidWeekFormat('2026-W05')).toBe(true)
    expect(isValidWeekFormat('2026-W01')).toBe(true)
    expect(isValidWeekFormat('2026-W52')).toBe(true)
  })

  it('should return false for invalid week format', () => {
    expect(isValidWeekFormat('invalid')).toBe(false)
    expect(isValidWeekFormat('2026-05')).toBe(false)
    expect(isValidWeekFormat('2026W05')).toBe(false)
    expect(isValidWeekFormat('2026-W5')).toBe(false)
  })
})

describe('Story 60.6-FE: isValidMonthFormat', () => {
  it('should return true for valid month format', () => {
    expect(isValidMonthFormat('2026-01')).toBe(true)
    expect(isValidMonthFormat('2026-12')).toBe(true)
  })

  it('should return false for invalid month format', () => {
    expect(isValidMonthFormat('invalid')).toBe(false)
    expect(isValidMonthFormat('2026-1')).toBe(false)
    expect(isValidMonthFormat('202601')).toBe(false)
  })
})
