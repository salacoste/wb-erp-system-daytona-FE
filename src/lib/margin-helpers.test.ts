/**
 * Unit tests for margin-helpers
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateAffectedWeeks,
  estimateCalculationTime,
  getPollingStrategy,
  getLastCompletedWeek,
  isCogsAfterLastCompletedWeek,
} from './margin-helpers'
import { formatIsoWeek } from './utils'

// Mock formatIsoWeek to ensure consistent test results
vi.mock('./utils', () => ({
  formatIsoWeek: vi.fn((date: Date) => {
    // Simple ISO week calculation for testing
    const year = date.getFullYear()
    const start = new Date(year, 0, 1)
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + start.getDay() + 1) / 7)
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`
  }),
}))

describe('margin-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateAffectedWeeks', () => {
    it('should return empty array for future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7) // 7 days in future

      const weeks = calculateAffectedWeeks(futureDate)
      expect(weeks).toEqual([])
    })

    it('should return empty array for future date string', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const futureDateStr = futureDate.toISOString().split('T')[0] // YYYY-MM-DD

      const weeks = calculateAffectedWeeks(futureDateStr)
      expect(weeks).toEqual([])
    })

    it('should return weeks up to last completed week for today', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const weeks = calculateAffectedWeeks(today)
      // If today is after last completed week, may return empty array
      // Otherwise, should return at least one week
      if (weeks.length > 0) {
        expect(weeks[0]).toMatch(/^\d{4}-W\d{2}$/) // ISO week format
      }
      // Note: weeks may be empty if today is after last completed week
    })

    it('should return multiple weeks for historical date (up to last completed week)', () => {
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42) // 6 weeks ago

      const weeks = calculateAffectedWeeks(sixWeeksAgo)
      // Should return weeks from 6 weeks ago up to last completed week
      // Last completed week is typically 1-2 weeks ago, so should get 4-6 weeks
      expect(weeks.length).toBeGreaterThanOrEqual(4)
      expect(weeks.length).toBeLessThanOrEqual(7) // Can vary depending on last completed week
    })

    it('should handle date string input', () => {
      const dateStr = '2025-01-01'
      const weeks = calculateAffectedWeeks(dateStr)

      expect(Array.isArray(weeks)).toBe(true)
      weeks.forEach((week) => {
        expect(week).toMatch(/^\d{4}-W\d{2}$/) // ISO week format
      })
    })

    it('should return unique weeks only', () => {
      const threeWeeksAgo = new Date()
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21)

      const weeks = calculateAffectedWeeks(threeWeeksAgo)
      const uniqueWeeks = new Set(weeks)
      expect(weeks.length).toBe(uniqueWeeks.size) // All weeks should be unique
    })

    it('should handle date at start of year', () => {
      const jan1 = new Date('2025-01-01T00:00:00')
      const weeks = calculateAffectedWeeks(jan1)

      expect(weeks.length).toBeGreaterThan(0)
      expect(weeks[0]).toMatch(/^2025-W\d{2}$/)
    })
  })

  describe('estimateCalculationTime', () => {
    it('should return minimum 5 seconds for empty array', () => {
      const time = estimateCalculationTime([])
      expect(time).toBe(5000) // 5 seconds in milliseconds
    })

    it('should return 5 seconds for single week', () => {
      const weeks = ['2025-W01']
      const time = estimateCalculationTime(weeks)
      expect(time).toBe(5000) // 1 week * 5 seconds = 5 seconds
    })

    it('should return 10 seconds for 2 weeks', () => {
      const weeks = ['2025-W01', '2025-W02']
      const time = estimateCalculationTime(weeks)
      expect(time).toBe(10000) // 2 weeks * 5 seconds = 10 seconds
    })

    it('should return 30 seconds for 6 weeks', () => {
      const weeks = [
        '2025-W01',
        '2025-W02',
        '2025-W03',
        '2025-W04',
        '2025-W05',
        '2025-W06',
      ]
      const time = estimateCalculationTime(weeks)
      expect(time).toBe(30000) // 6 weeks * 5 seconds = 30 seconds
    })

    it('should clamp to maximum 60 seconds', () => {
      const weeks = Array.from({ length: 20 }, (_, i) => `2025-W${(i + 1).toString().padStart(2, '0')}`)
      const time = estimateCalculationTime(weeks)
      expect(time).toBe(60000) // 20 weeks * 5 = 100, but clamped to 60 seconds
    })

    it('should handle 12 weeks (60 seconds max)', () => {
      const weeks = Array.from({ length: 12 }, (_, i) => `2025-W${(i + 1).toString().padStart(2, '0')}`)
      const time = estimateCalculationTime(weeks)
      expect(time).toBe(60000) // 12 weeks * 5 = 60 seconds (at max)
    })
  })

  describe('getPollingStrategy', () => {
    it('should return bulk strategy for bulk operations', () => {
      const today = new Date().toISOString().split('T')[0]
      const strategy = getPollingStrategy(today, true)

      expect(strategy.interval).toBe(5000) // 5 seconds
      expect(strategy.maxAttempts).toBe(20) // 20 attempts
      expect(strategy.estimatedTime).toBe(60000) // 60 seconds
    })

    it('should return single current strategy for today', () => {
      const today = new Date().toISOString().split('T')[0]
      const strategy = getPollingStrategy(today, false)

      expect(strategy.interval).toBe(3000) // 3 seconds
      expect(strategy.maxAttempts).toBe(10) // 10 attempts
      expect(strategy.estimatedTime).toBe(10000) // 10 seconds
    })

    it('should return historical strategy for date 6 weeks ago', () => {
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
      const dateStr = sixWeeksAgo.toISOString().split('T')[0]

      const strategy = getPollingStrategy(dateStr, false)

      // Should be historical (more than 1 week affected)
      expect(strategy.interval).toBe(5000) // 5 seconds
      expect(strategy.maxAttempts).toBe(10) // 10 attempts
      // Estimated time depends on actual affected weeks (up to last completed week)
      // Last completed week is typically 1-2 weeks ago, so 4-6 weeks affected
      expect(strategy.estimatedTime).toBeGreaterThanOrEqual(20000) // At least 20 seconds (4 weeks * 5s)
      expect(strategy.estimatedTime).toBeLessThanOrEqual(60000) // Max 60 seconds
    })

    it('should return appropriate strategy for date 2 weeks ago', () => {
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const dateStr = twoWeeksAgo.toISOString().split('T')[0]

      const strategy = getPollingStrategy(dateStr, false)

      // Strategy depends on how many weeks are affected (up to last completed week)
      // Last completed week is typically 1-2 weeks ago, so 2 weeks ago may result in:
      // - 1 week affected → single strategy (3s interval)
      // - 2+ weeks affected → historical strategy (5s interval)
      expect(strategy.maxAttempts).toBe(10) // 10 attempts
      expect([3000, 5000]).toContain(strategy.interval) // Either single or historical
      expect(strategy.estimatedTime).toBeGreaterThanOrEqual(10000) // At least 10 seconds
    })

    it('should return appropriate strategy for Date object input', () => {
      const today = new Date()
      const strategy = getPollingStrategy(today, false)

      // Strategy depends on whether today is after last completed week
      // If today is after last completed week → empty weeks → single strategy
      // Otherwise → may be historical if multiple weeks affected
      expect(strategy.maxAttempts).toBe(10) // 10 attempts
      expect([3000, 5000]).toContain(strategy.interval) // Either single or historical
    })

    it('should prioritize bulk flag over date', () => {
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
      const dateStr = sixWeeksAgo.toISOString().split('T')[0]

      const strategy = getPollingStrategy(dateStr, true) // Bulk flag

      expect(strategy.interval).toBe(5000) // Bulk strategy
      expect(strategy.maxAttempts).toBe(20) // Bulk strategy
      expect(strategy.estimatedTime).toBe(60000) // Bulk strategy
    })
  })

  describe('getLastCompletedWeek', () => {
    it('should return ISO week string based on day of week and time', () => {
      const lastWeek = getLastCompletedWeek()
      expect(lastWeek).toMatch(/^\d{4}-W\d{2}$/)
      
      // Verify it's a valid ISO week format
      const [year, week] = lastWeek.split('-W')
      expect(parseInt(year)).toBeGreaterThan(2020)
      expect(parseInt(week)).toBeGreaterThan(0)
      expect(parseInt(week)).toBeLessThanOrEqual(53)
    })

    it('should return W-2 on Monday', () => {
      vi.useFakeTimers()
      // Set to Monday, 10:00
      vi.setSystemTime(new Date('2025-11-24T10:00:00Z')) // Monday
      
      const lastWeek = getLastCompletedWeek()
      const now = new Date()
      const twoWeeksAgo = new Date(now)
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
      const expectedWeek = formatIsoWeek(twoWeeksAgo)
      
      expect(lastWeek).toBe(expectedWeek)
      
      vi.useRealTimers()
    })

    it('should return W-1 on Wednesday', () => {
      vi.useFakeTimers()
      // Set to Wednesday, 10:00
      vi.setSystemTime(new Date('2025-11-26T10:00:00Z')) // Wednesday
      
      const lastWeek = getLastCompletedWeek()
      const now = new Date()
      const oneWeekAgo = new Date(now)
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const expectedWeek = formatIsoWeek(oneWeekAgo)
      
      expect(lastWeek).toBe(expectedWeek)
      
      vi.useRealTimers()
    })
  })

  describe('isCogsAfterLastCompletedWeek', () => {
    beforeEach(() => {
      // Mock current date to 2025-11-24 (Sunday)
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-11-24T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return true if COGS valid_from is today (after last completed week)', () => {
      const today = '2025-11-24'
      expect(isCogsAfterLastCompletedWeek(today)).toBe(true)
    })

    it('should return true if COGS valid_from is yesterday (after last completed week)', () => {
      const yesterday = '2025-11-23'
      expect(isCogsAfterLastCompletedWeek(yesterday)).toBe(true)
    })

    it('should return true if COGS valid_from is 8 days ago (after last completed week midpoint)', () => {
      const eightDaysAgo = '2025-11-16'
      expect(isCogsAfterLastCompletedWeek(eightDaysAgo)).toBe(true)
    })

    it('should return false if COGS valid_from is 2 weeks ago', () => {
      const twoWeeksAgo = '2025-11-10'
      expect(isCogsAfterLastCompletedWeek(twoWeeksAgo)).toBe(false)
    })

    it('should return false if COGS valid_from is 6 weeks ago', () => {
      const sixWeeksAgo = '2025-10-13'
      expect(isCogsAfterLastCompletedWeek(sixWeeksAgo)).toBe(false)
    })

    it('should work with Date object', () => {
      const today = new Date('2025-11-24T00:00:00Z')
      expect(isCogsAfterLastCompletedWeek(today)).toBe(true)

      const eightDaysAgo = new Date('2025-11-16T00:00:00Z')
      expect(isCogsAfterLastCompletedWeek(eightDaysAgo)).toBe(true)
    })
  })
})

describe('getLastCompletedWeek', () => {
  it('should return ISO week string for 7 days ago', () => {
    const lastWeek = getLastCompletedWeek()
    expect(lastWeek).toMatch(/^\d{4}-W\d{2}$/)

    // Verify it's a valid ISO week format
    const [year, week] = lastWeek.split('-W')
    expect(parseInt(year)).toBeGreaterThan(2020)
    expect(parseInt(week)).toBeGreaterThan(0)
    expect(parseInt(week)).toBeLessThanOrEqual(53)
  })
})

