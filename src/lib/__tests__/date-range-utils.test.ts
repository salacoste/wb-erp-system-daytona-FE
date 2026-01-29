/**
 * Unit Tests for date-range-utils
 * Story 51.3-FE: Extended Date Range Picker Component
 * Epic 51: FBS Historical Analytics UI (365 Days)
 *
 * TDD Tests for utility functions:
 * - getSmartAggregation() - returns correct aggregation level
 * - getAggregationLabel() - returns Russian labels
 * - formatDateRu() - formats date to DD.MM.YYYY
 * - formatDateRangeRu() - formats date range with dash separator
 * - pluralizeDays() - Russian pluralization for "день/дня/дней"
 * - isRangeValid() - validates date range against max days
 * - getPresetRange() - returns correct date range for preset
 * - calculateDaysDiff() - calculates days between dates
 *
 * @see docs/stories/epic-51/story-51.3-fe-extended-date-range-picker.md
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getSmartAggregation,
  getAggregationLabel,
  formatDateRu,
  formatDateRangeRu,
  pluralizeDays,
  isRangeValid,
  getPresetRange,
  calculateDaysDiff,
} from '../date-range-utils'
import {
  aggregationTestCases,
  pluralizationTestCases,
  dateFormattingTestCases,
  dateRangeFormattingTestCases,
  MOCK_TODAY,
  mockRange30Days,
  mockRange90Days,
  mockRange180Days,
  mockRange365Days,
  mockRangeExceeds365Days,
  mockRangeInverted,
} from '@/test/fixtures/date-range'
import type { AggregationLevel } from '@/types/date-range'

// ============================================================================
// getSmartAggregation Tests (~10 tests)
// ============================================================================

describe('getSmartAggregation', () => {
  it('should return "day" for 1 day', () => {
    expect(getSmartAggregation(1)).toBe('day')
  })

  it('should return "day" for 30 days', () => {
    expect(getSmartAggregation(30)).toBe('day')
  })

  it('should return "day" for exactly 90 days (boundary)', () => {
    expect(getSmartAggregation(90)).toBe('day')
  })

  it('should return "week" for 91 days (first week boundary)', () => {
    expect(getSmartAggregation(91)).toBe('week')
  })

  it('should return "week" for 120 days', () => {
    expect(getSmartAggregation(120)).toBe('week')
  })

  it('should return "week" for exactly 180 days (boundary)', () => {
    expect(getSmartAggregation(180)).toBe('week')
  })

  it('should return "month" for 181 days (first month boundary)', () => {
    expect(getSmartAggregation(181)).toBe('month')
  })

  it('should return "month" for 270 days', () => {
    expect(getSmartAggregation(270)).toBe('month')
  })

  it('should return "month" for 365 days (max range)', () => {
    expect(getSmartAggregation(365)).toBe('month')
  })

  it('should handle all aggregation test cases from fixtures', () => {
    aggregationTestCases.forEach(({ days, expected }) => {
      expect(getSmartAggregation(days)).toBe(expected)
    })
  })
})

// ============================================================================
// getAggregationLabel Tests (~5 tests)
// ============================================================================

describe('getAggregationLabel', () => {
  it('should return "Ежедневно" for day aggregation', () => {
    expect(getAggregationLabel('day')).toBe('Ежедневно')
  })

  it('should return "Еженедельно" for week aggregation', () => {
    expect(getAggregationLabel('week')).toBe('Еженедельно')
  })

  it('should return "Ежемесячно" for month aggregation', () => {
    expect(getAggregationLabel('month')).toBe('Ежемесячно')
  })

  it('should return labels in Russian for all aggregation levels', () => {
    const levels: AggregationLevel[] = ['day', 'week', 'month']
    levels.forEach(level => {
      const label = getAggregationLabel(level)
      expect(label).toBeTruthy()
      // All labels should end with "о" (Russian adverb ending)
      expect(label).toMatch(/о$/)
    })
  })

  it('should have consistent labels with aggregation test cases', () => {
    aggregationTestCases.forEach(({ expected, label }) => {
      expect(getAggregationLabel(expected)).toBe(label)
    })
  })
})

// ============================================================================
// formatDateRu Tests (~8 tests)
// ============================================================================

describe('formatDateRu', () => {
  it('should format date as DD.MM.YYYY', () => {
    const date = new Date('2025-01-29')
    expect(formatDateRu(date)).toBe('29.01.2025')
  })

  it('should pad single-digit day with zero', () => {
    const date = new Date('2025-01-05')
    expect(formatDateRu(date)).toBe('05.01.2025')
  })

  it('should pad single-digit month with zero', () => {
    const date = new Date('2025-03-15')
    expect(formatDateRu(date)).toBe('15.03.2025')
  })

  it('should handle December correctly', () => {
    const date = new Date('2025-12-31')
    expect(formatDateRu(date)).toBe('31.12.2025')
  })

  it('should handle leap year date (Feb 29)', () => {
    const date = new Date('2024-02-29')
    expect(formatDateRu(date)).toBe('29.02.2024')
  })

  it('should handle first day of year', () => {
    const date = new Date('2025-01-01')
    expect(formatDateRu(date)).toBe('01.01.2025')
  })

  it('should handle all date formatting test cases from fixtures', () => {
    dateFormattingTestCases.forEach(({ date, expected }) => {
      expect(formatDateRu(date)).toBe(expected)
    })
  })

  it('should use Russian locale (not affected by system locale)', () => {
    const date = new Date('2025-06-15')
    const formatted = formatDateRu(date)
    // Verify DD.MM.YYYY format (not MM/DD/YYYY or other)
    expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
    expect(formatted).toBe('15.06.2025')
  })
})

// ============================================================================
// formatDateRangeRu Tests (~5 tests)
// ============================================================================

describe('formatDateRangeRu', () => {
  it('should format range with em-dash separator', () => {
    const from = new Date('2025-01-01')
    const to = new Date('2025-03-31')
    expect(formatDateRangeRu(from, to)).toBe('01.01.2025 — 31.03.2025')
  })

  it('should handle same day range', () => {
    const date = new Date('2025-01-15')
    expect(formatDateRangeRu(date, date)).toBe('15.01.2025 — 15.01.2025')
  })

  it('should handle year boundary range', () => {
    const from = new Date('2024-12-15')
    const to = new Date('2025-01-15')
    expect(formatDateRangeRu(from, to)).toBe('15.12.2024 — 15.01.2025')
  })

  it('should handle all date range formatting test cases from fixtures', () => {
    dateRangeFormattingTestCases.forEach(({ from, to, expected }) => {
      expect(formatDateRangeRu(from, to)).toBe(expected)
    })
  })

  it('should use em-dash (—) not hyphen (-)', () => {
    const from = new Date('2025-01-01')
    const to = new Date('2025-01-31')
    const result = formatDateRangeRu(from, to)
    expect(result).toContain('—')
    expect(result).not.toMatch(/\d-\d/) // No hyphen between dates
  })
})

// ============================================================================
// pluralizeDays Tests (~12 tests)
// ============================================================================

describe('pluralizeDays', () => {
  describe('singular form "день"', () => {
    it('should return "день" for 1', () => {
      expect(pluralizeDays(1)).toBe('день')
    })

    it('should return "день" for 21', () => {
      expect(pluralizeDays(21)).toBe('день')
    })

    it('should return "день" for 31', () => {
      expect(pluralizeDays(31)).toBe('день')
    })

    it('should return "день" for 101', () => {
      expect(pluralizeDays(101)).toBe('день')
    })
  })

  describe('genitive singular "дня" (2-4)', () => {
    it('should return "дня" for 2', () => {
      expect(pluralizeDays(2)).toBe('дня')
    })

    it('should return "дня" for 3', () => {
      expect(pluralizeDays(3)).toBe('дня')
    })

    it('should return "дня" for 4', () => {
      expect(pluralizeDays(4)).toBe('дня')
    })

    it('should return "дня" for 22, 23, 24', () => {
      expect(pluralizeDays(22)).toBe('дня')
      expect(pluralizeDays(23)).toBe('дня')
      expect(pluralizeDays(24)).toBe('дня')
    })
  })

  describe('genitive plural "дней" (5-20, 25-30)', () => {
    it('should return "дней" for 5-10', () => {
      for (let i = 5; i <= 10; i++) {
        expect(pluralizeDays(i)).toBe('дней')
      }
    })

    it('should return "дней" for 11-19 (special case)', () => {
      for (let i = 11; i <= 19; i++) {
        expect(pluralizeDays(i)).toBe('дней')
      }
    })

    it('should return "дней" for 20', () => {
      expect(pluralizeDays(20)).toBe('дней')
    })

    it('should return "дней" for 25-30', () => {
      for (let i = 25; i <= 30; i++) {
        expect(pluralizeDays(i)).toBe('дней')
      }
    })
  })

  describe('edge cases', () => {
    it('should return "дней" for 100', () => {
      expect(pluralizeDays(100)).toBe('дней')
    })

    it('should return "дней" for 111-119 (special 11-19 rule)', () => {
      for (let i = 111; i <= 119; i++) {
        expect(pluralizeDays(i)).toBe('дней')
      }
    })

    it('should return "дней" for 365', () => {
      expect(pluralizeDays(365)).toBe('дней')
    })

    it('should handle all pluralization test cases from fixtures', () => {
      pluralizationTestCases.forEach(({ count, expected }) => {
        expect(pluralizeDays(count)).toBe(expected)
      })
    })
  })
})

// ============================================================================
// isRangeValid Tests (~8 tests)
// ============================================================================

describe('isRangeValid', () => {
  describe('valid ranges', () => {
    it('should return true for range within 365 days (default maxDays)', () => {
      expect(isRangeValid(mockRange30Days.from, mockRange30Days.to)).toBe(true)
    })

    it('should return true for exactly 365 days', () => {
      expect(isRangeValid(mockRange365Days.from, mockRange365Days.to)).toBe(true)
    })

    it('should return true for single day range', () => {
      const sameDay = new Date('2025-01-15')
      expect(isRangeValid(sameDay, sameDay)).toBe(true)
    })

    it('should return true for 90 days', () => {
      expect(isRangeValid(mockRange90Days.from, mockRange90Days.to)).toBe(true)
    })
  })

  describe('invalid ranges', () => {
    it('should return false for range exceeding 365 days', () => {
      expect(isRangeValid(mockRangeExceeds365Days.from, mockRangeExceeds365Days.to)).toBe(false)
    })

    it('should return false for inverted range (from > to)', () => {
      expect(isRangeValid(mockRangeInverted.from, mockRangeInverted.to)).toBe(false)
    })

    it('should return false for future dates', () => {
      const futureDate = new Date('2026-01-01')
      const today = new Date()
      expect(isRangeValid(today, futureDate)).toBe(false)
    })
  })

  describe('custom maxDays', () => {
    it('should respect custom maxDays parameter', () => {
      // 90 days range should fail with maxDays=30
      expect(isRangeValid(mockRange90Days.from, mockRange90Days.to, 30)).toBe(false)
      // 30 days range should pass with maxDays=30
      expect(isRangeValid(mockRange30Days.from, mockRange30Days.to, 30)).toBe(true)
    })
  })
})

// ============================================================================
// getPresetRange Tests (~6 tests)
// ============================================================================

describe('getPresetRange', () => {
  beforeEach(() => {
    // Mock current date for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_TODAY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return range for 30 days preset', () => {
    const range = getPresetRange(30)
    expect(calculateDaysDiff(range.from, range.to)).toBe(30)
    expect(range.to.toDateString()).toBe(MOCK_TODAY.toDateString())
  })

  it('should return range for 90 days preset', () => {
    const range = getPresetRange(90)
    expect(calculateDaysDiff(range.from, range.to)).toBe(90)
    expect(range.to.toDateString()).toBe(MOCK_TODAY.toDateString())
  })

  it('should return range for 180 days preset', () => {
    const range = getPresetRange(180)
    expect(calculateDaysDiff(range.from, range.to)).toBe(180)
  })

  it('should return range for 365 days preset', () => {
    const range = getPresetRange(365)
    expect(calculateDaysDiff(range.from, range.to)).toBe(365)
  })

  it('should end on current date (today)', () => {
    const range = getPresetRange(30)
    const today = new Date()
    expect(range.to.toDateString()).toBe(today.toDateString())
  })

  it('should handle custom preset days', () => {
    const range = getPresetRange(7)
    expect(calculateDaysDiff(range.from, range.to)).toBe(7)
  })
})

// ============================================================================
// calculateDaysDiff Tests (~7 tests)
// ============================================================================

describe('calculateDaysDiff', () => {
  it('should return 1 for same day', () => {
    const date = new Date('2025-01-15')
    expect(calculateDaysDiff(date, date)).toBe(1)
  })

  it('should return correct days for 30-day range', () => {
    expect(calculateDaysDiff(mockRange30Days.from, mockRange30Days.to)).toBe(30)
  })

  it('should return correct days for 90-day range', () => {
    expect(calculateDaysDiff(mockRange90Days.from, mockRange90Days.to)).toBe(90)
  })

  it('should return correct days for 180-day range', () => {
    expect(calculateDaysDiff(mockRange180Days.from, mockRange180Days.to)).toBe(180)
  })

  it('should return correct days for 365-day range', () => {
    expect(calculateDaysDiff(mockRange365Days.from, mockRange365Days.to)).toBe(365)
  })

  it('should handle year boundary crossing', () => {
    const from = new Date('2024-12-15')
    const to = new Date('2025-01-15')
    // Dec 15 - Jan 15 = 32 days (inclusive)
    expect(calculateDaysDiff(from, to)).toBe(32)
  })

  it('should handle leap year correctly', () => {
    const from = new Date('2024-02-28')
    const to = new Date('2024-03-01')
    // Feb 28, Feb 29, Mar 1 = 3 days
    expect(calculateDaysDiff(from, to)).toBe(3)
  })
})
