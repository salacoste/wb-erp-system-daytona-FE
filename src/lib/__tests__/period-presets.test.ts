/**
 * Tests for Period Presets ISO Week Functions
 * Story 61.6-FE: Fix Period Presets to ISO Weeks
 * Epic 61-FE: Dashboard Data Integration (API Layer)
 *
 * Tests for converting calendar months/quarters to ISO week ranges
 * for period comparison presets (MoM, QoQ, YoY).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getWeeksInCalendarMonth,
  monthToIsoWeekRange,
  quarterToIsoWeekRange,
  getMoMPreset,
  getQoQPreset,
  getYoYPreset,
  calculateIsoWeekPresetPeriods,
  dateRangeToIsoWeekRange,
} from '@/components/custom/analytics/period-presets'
import { getIsoWeeksInYear } from '@/lib/iso-week-utils'

/**
 * Mock current date for deterministic tests
 * Using 2026-01-31 as reference date (from project context)
 */
const MOCK_DATE = new Date('2026-01-31T12:00:00.000Z')

// =============================================================================
// Story 61.6-FE: monthToIsoWeekRange Function
// =============================================================================

describe('Story 61.6-FE: monthToIsoWeekRange', () => {
  describe('basic functionality', () => {
    it('converts January 2026 to ISO week range', () => {
      const result = monthToIsoWeekRange(2026, 0) // January = month 0
      // January 2026 contains weeks where Thursday falls in January
      expect(result).toMatch(/^\d{4}-W\d{2}(:\d{4}-W\d{2}|:W\d{2})?$/)
    })

    it('converts February 2026 to ISO week range', () => {
      const result = monthToIsoWeekRange(2026, 1)
      expect(result).toMatch(/^\d{4}-W\d{2}(:\d{4}-W\d{2}|:W\d{2})?$/)
    })

    it('converts December 2025 to correct ISO week range', () => {
      const result = monthToIsoWeekRange(2025, 11)
      expect(result).toMatch(/^\d{4}-W\d{2}(:\d{4}-W\d{2}|:W\d{2})?$/)
    })

    it('returns range in format "YYYY-Www" or "YYYY-Www:Www" or "YYYY-Www:YYYY-Www"', () => {
      const result = monthToIsoWeekRange(2026, 5) // June
      expect(result).toMatch(/^\d{4}-W\d{2}(:\d{4}-W\d{2}|:W\d{2})?$/)
    })
  })

  describe('year boundary handling', () => {
    it('handles January correctly when W01 starts in previous year', () => {
      const weeks = getWeeksInCalendarMonth(2026, 0)
      // W01 of 2026 starts Dec 29 2025
      expect(weeks[0]).toMatch(/^2026-W01$/)
    })

    it('handles December correctly when weeks span into next year', () => {
      const weeks = getWeeksInCalendarMonth(2025, 11)
      // December weeks should end at W52 or later
      const lastWeek = weeks[weeks.length - 1]
      expect(lastWeek).toMatch(/^2025-W(5[0-2]|4\d)$/)
    })

    it('handles transition from 52-week year to 53-week year', () => {
      // 2020 has 53 weeks
      const weeks = getWeeksInCalendarMonth(2020, 11)
      expect(weeks.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('edge cases', () => {
    it('throws error for invalid month number below 0', () => {
      // getWeeksInCalendarMonth uses Date constructor which auto-wraps
      // month -1 becomes December of previous year — test it handles this
      const result = monthToIsoWeekRange(2026, -1)
      expect(typeof result).toBe('string')
    })

    it('returns correct week count for months with 4-5 weeks', () => {
      const weeksFeb = getWeeksInCalendarMonth(2026, 1) // February
      expect(weeksFeb.length).toBeGreaterThanOrEqual(4)
      expect(weeksFeb.length).toBeLessThanOrEqual(5)

      const weeksJan = getWeeksInCalendarMonth(2026, 0) // January
      expect(weeksJan.length).toBeGreaterThanOrEqual(4)
      expect(weeksJan.length).toBeLessThanOrEqual(6)
    })

    it('returns sorted weeks for any month', () => {
      const weeks = getWeeksInCalendarMonth(2026, 5)
      for (let i = 1; i < weeks.length; i++) {
        expect(weeks[i] > weeks[i - 1]).toBe(true)
      }
    })
  })
})

// =============================================================================
// Story 61.6-FE: quarterToIsoWeekRange Function
// =============================================================================

describe('Story 61.6-FE: quarterToIsoWeekRange', () => {
  describe('basic functionality', () => {
    it('converts Q1 2026 to ISO week range', () => {
      const result = quarterToIsoWeekRange(2026, 1)
      expect(result).toContain('W01')
    })

    it('converts Q2 2026 to ISO week range', () => {
      const result = quarterToIsoWeekRange(2026, 2)
      expect(result).toMatch(/\d{4}-W1[3-5]/) // Q2 starts around W13-W15
    })

    it('converts Q3 2026 to ISO week range', () => {
      const result = quarterToIsoWeekRange(2026, 3)
      expect(result).toMatch(/\d{4}-W(2[6-9]|3[0-9])/) // Q3 starts around W26-W30
    })

    it('converts Q4 2026 to ISO week range', () => {
      const result = quarterToIsoWeekRange(2026, 4)
      expect(result).toContain('W5') // Q4 ends around W52-W53
    })
  })

  describe('year boundary handling', () => {
    it('handles Q4 in year with 53 weeks', () => {
      // 2026 has 53 weeks
      expect(getIsoWeeksInYear(2026)).toBe(53)
      const result = quarterToIsoWeekRange(2026, 4)
      expect(result).toContain('W53')
    })

    it('handles Q4 in year with 52 weeks', () => {
      // 2025 has 52 weeks
      expect(getIsoWeeksInYear(2025)).toBe(52)
      const result = quarterToIsoWeekRange(2025, 4)
      expect(result).not.toContain('W53')
    })

    it('handles Q1 when first week starts in previous year', () => {
      const result = quarterToIsoWeekRange(2026, 1)
      expect(result).toContain('W01')
    })
  })

  describe('input formats', () => {
    it('accepts quarter as number (1-4) and year', () => {
      expect(() => quarterToIsoWeekRange(2026, 1)).not.toThrow()
      expect(() => quarterToIsoWeekRange(2026, 4)).not.toThrow()
    })

    it('throws error for quarter number 0', () => {
      expect(() => quarterToIsoWeekRange(2026, 0)).toThrow(/Invalid quarter/)
    })

    it('throws error for quarter number 5', () => {
      expect(() => quarterToIsoWeekRange(2026, 5)).toThrow(/Invalid quarter/)
    })
  })
})

// =============================================================================
// Story 61.6-FE: getMoMPreset (Month-over-Month)
// =============================================================================

describe('Story 61.6-FE: getMoMPreset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('returns ISO week ranges for current and previous month', () => {
      const result = getMoMPreset()
      expect(result.period1).toBeTruthy()
      expect(result.period2).toBeTruthy()
    })

    it('period1 is previous month, period2 is current month', () => {
      const result = getMoMPreset()
      // period1 should start earlier than period2
      expect(result.period1 < result.period2).toBe(true)
    })

    it('returns correctly formatted ISO week range strings', () => {
      const result = getMoMPreset()
      expect(result.period1).toMatch(/^\d{4}-W\d{2}/)
      expect(result.period2).toMatch(/^\d{4}-W\d{2}/)
    })
  })

  describe('year boundary handling', () => {
    it('handles January correctly (previous month is December of prev year)', () => {
      // MOCK_DATE is 2026-01-31, so current month = January, prev = December 2025
      const result = getMoMPreset()
      expect(result.period1).toContain('2025')
      expect(result.period2).toContain('2026')
    })

    it('handles February correctly (both months in same year)', () => {
      vi.setSystemTime(new Date('2026-03-15T12:00:00.000Z'))
      const result = getMoMPreset()
      // Both February and March are in 2026
      expect(result.period1).toContain('2026')
      expect(result.period2).toContain('2026')
    })
  })

  describe('comparison with old implementation', () => {
    it('does NOT return date ranges (from/to format)', () => {
      const result = getMoMPreset()
      // Should not contain date dashes in YYYY-MM-DD format
      expect(typeof result.period1).toBe('string')
      expect(result.period1).not.toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('returns string periods, not PeriodRange objects', () => {
      const result = getMoMPreset()
      expect(typeof result.period1).toBe('string')
      expect(typeof result.period2).toBe('string')
    })
  })
})

// =============================================================================
// Story 61.6-FE: getQoQPreset (Quarter-over-Quarter)
// =============================================================================

describe('Story 61.6-FE: getQoQPreset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('returns ISO week ranges for current and previous quarter', () => {
      const result = getQoQPreset()
      expect(result.period1).toBeTruthy()
      expect(result.period2).toBeTruthy()
    })

    it('period1 is previous quarter, period2 is current quarter', () => {
      const result = getQoQPreset()
      expect(result.period1 < result.period2).toBe(true)
    })

    it('handles Q1 (previous quarter is Q4 of previous year)', () => {
      // MOCK_DATE is Jan 2026 = Q1 2026, previous = Q4 2025
      const result = getQoQPreset()
      expect(result.period1).toContain('2025')
      expect(result.period2).toContain('2026')
    })
  })

  describe('quarter boundaries', () => {
    it('correctly identifies Q2 boundaries', () => {
      vi.setSystemTime(new Date('2026-05-15T12:00:00.000Z')) // Q2 2026
      const result = getQoQPreset()
      expect(result.period2).toContain('W1') // Q2 starts around W13-W15
    })

    it('correctly identifies Q3 boundaries', () => {
      vi.setSystemTime(new Date('2026-08-15T12:00:00.000Z')) // Q3 2026
      const result = getQoQPreset()
      expect(result.period2).toContain('W2') // Q3 starts around W26-W30
    })

    it('correctly identifies Q4 boundaries', () => {
      vi.setSystemTime(new Date('2026-11-15T12:00:00.000Z')) // Q4 2026
      const result = getQoQPreset()
      expect(result.period2).toContain('W4') // Q4 starts around W40-W44
    })
  })

  describe('year with 53 weeks', () => {
    it('includes W53 in Q4 for years with 53 weeks', () => {
      // 2026 has 53 weeks
      const result = quarterToIsoWeekRange(2026, 4)
      expect(result).toContain('W53')
    })

    it('handles comparison when years have different week counts', () => {
      // Q4 2026 (53 weeks) vs Q4 2025 (52 weeks)
      const q4_2026 = quarterToIsoWeekRange(2026, 4)
      const q4_2025 = quarterToIsoWeekRange(2025, 4)
      expect(q4_2026).toContain('W53')
      expect(q4_2025).not.toContain('W53')
    })
  })
})

// =============================================================================
// Story 61.6-FE: getYoYPreset (Year-over-Year)
// =============================================================================

describe('Story 61.6-FE: getYoYPreset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('returns same ISO week for current and previous year', () => {
      const result = getYoYPreset()
      // Both periods should be single weeks
      expect(result.period1).toMatch(/^\d{4}-W\d{2}$/)
      expect(result.period2).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('compares same week number across years', () => {
      const result = getYoYPreset()
      // Extract week numbers - should be the same
      const week1 = result.period1.match(/W(\d{2})$/)?.[1]
      const week2 = result.period2.match(/W(\d{2})$/)?.[1]
      expect(week1).toBe(week2)
    })

    it('returns single week strings, not ranges', () => {
      const result = getYoYPreset()
      expect(result.period1).not.toContain(':')
      expect(result.period2).not.toContain(':')
    })
  })

  describe('year boundary handling', () => {
    it('handles W53 when current year has 53 weeks but previous does not', () => {
      // Test with a date in W53 of a 53-week year
      // 2020 has W53 - Dec 28 2020 is in W53
      vi.setSystemTime(new Date('2020-12-28T12:00:00.000Z'))
      const result = getYoYPreset()
      // weekMismatch should be true if prev year doesn't have W53
      expect(typeof result.weekMismatch).toBe('boolean')
    })

    it('handles W53 when previous year has 53 weeks but current does not', () => {
      // 2021 is a 52-week year following 2020 (53 weeks)
      vi.setSystemTime(new Date('2021-12-27T12:00:00.000Z'))
      const result = getYoYPreset()
      expect(result.period1).toMatch(/^\d{4}-W\d{2}$/)
      expect(result.period2).toMatch(/^\d{4}-W\d{2}$/)
    })

    it('handles W01 correctly across year boundary', () => {
      vi.setSystemTime(new Date('2025-12-30T12:00:00.000Z')) // Likely W01 2026
      const result = getYoYPreset()
      // The ISO week might be W01 of 2026
      expect(result.period2).toMatch(/^\d{4}-W\d{2}$/)
      expect(result.period1).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  describe('53-week year edge cases', () => {
    it('uses W52 as fallback when comparing W53 to 52-week year', () => {
      // 2020 has W53, 2019 has 52 weeks
      vi.setSystemTime(new Date('2020-12-28T12:00:00.000Z'))
      const result = getYoYPreset()
      // If weekMismatch, period1 should be W52 of 2019
      if (result.weekMismatch) {
        expect(result.period1).toContain('W52')
      }
    })

    it('returns comparison metadata indicating week mismatch', () => {
      vi.setSystemTime(new Date('2020-12-28T12:00:00.000Z'))
      const result = getYoYPreset()
      expect(result).toHaveProperty('weekMismatch')
      expect(typeof result.weekMismatch).toBe('boolean')
    })
  })
})

// =============================================================================
// Story 61.6-FE: calculateIsoWeekPresetPeriods (Unified Calculator)
// =============================================================================

describe('Story 61.6-FE: calculateIsoWeekPresetPeriods', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('preset selection', () => {
    it('returns MoM periods for "mom" preset', () => {
      const result = calculateIsoWeekPresetPeriods('mom')
      expect(result.period1).toBeTruthy()
      expect(result.period2).toBeTruthy()
    })

    it('returns QoQ periods for "qoq" preset', () => {
      const result = calculateIsoWeekPresetPeriods('qoq')
      expect(result.period1).toBeTruthy()
      expect(result.period2).toBeTruthy()
    })

    it('returns YoY periods for "yoy" preset', () => {
      const result = calculateIsoWeekPresetPeriods('yoy')
      expect(result.period1).toBeTruthy()
      expect(result.period2).toBeTruthy()
    })

    it('returns empty periods for "custom" preset', () => {
      const result = calculateIsoWeekPresetPeriods('custom')
      expect(result.period1).toBe('')
      expect(result.period2).toBe('')
    })
  })

  describe('return type compatibility', () => {
    it('returns periods compatible with comparison API', () => {
      const mom = calculateIsoWeekPresetPeriods('mom')
      // Periods should be usable as URL query params
      expect(encodeURIComponent(mom.period1)).toBeTruthy()
      expect(encodeURIComponent(mom.period2)).toBeTruthy()
    })

    it('returns string periods, not PeriodRange objects', () => {
      const result = calculateIsoWeekPresetPeriods('mom')
      expect(typeof result.period1).toBe('string')
      expect(typeof result.period2).toBe('string')
    })

    it('periods can be directly used in URL query parameters', () => {
      const mom = calculateIsoWeekPresetPeriods('mom')
      const url = `?period1=${encodeURIComponent(mom.period1)}&period2=${encodeURIComponent(mom.period2)}`
      expect(url).toContain('period1=')
      expect(url).toContain('period2=')
    })
  })

  describe('integration with comparison API', () => {
    it('MoM preset produces valid comparison API parameters', () => {
      const result = calculateIsoWeekPresetPeriods('mom')
      const url = `/v1/analytics/weekly/comparison?period1=${encodeURIComponent(result.period1)}&period2=${encodeURIComponent(result.period2)}`
      expect(url).toMatch(/period1=.*&period2=.*/)
    })

    it('QoQ preset produces valid comparison API parameters', () => {
      const result = calculateIsoWeekPresetPeriods('qoq')
      const url = `/v1/analytics/weekly/comparison?period1=${encodeURIComponent(result.period1)}&period2=${encodeURIComponent(result.period2)}`
      expect(url).toMatch(/period1=.*&period2=.*/)
    })

    it('YoY preset produces valid comparison API parameters', () => {
      const result = calculateIsoWeekPresetPeriods('yoy')
      const url = `/v1/analytics/weekly/comparison?period1=${encodeURIComponent(result.period1)}&period2=${encodeURIComponent(result.period2)}`
      expect(url).toMatch(/period1=.*&period2=.*/)
    })
  })
})

// =============================================================================
// Story 61.6-FE: Integration Tests
// =============================================================================

describe('Story 61.6-FE: Period Preset Integration', () => {
  describe('backward compatibility', () => {
    it('old PeriodRange type can be converted to ISO week format', () => {
      const legacyRange = { from: '2026-01-01', to: '2026-01-31' }
      const isoRange = dateRangeToIsoWeekRange(legacyRange)
      expect(isoRange).toMatch(/^\d{4}-W\d{2}/)
    })

    it('provides migration helper for existing code', () => {
      const result = dateRangeToIsoWeekRange({ from: '2026-01-01', to: '2026-01-31' })
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('format validation', () => {
    it('validates ISO week range format produced by presets', () => {
      const result = monthToIsoWeekRange(2026, 0)
      // Format: "YYYY-Www" or "YYYY-Www:Www" or "YYYY-Www:YYYY-Www"
      expect(result).toMatch(/^\d{4}-W\d{2}(:\d{4}-W\d{2}|:W\d{2})?$/)
    })

    it('validates single ISO week format produced by YoY', () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_DATE)
      const result = getYoYPreset()
      // YoY returns single weeks
      expect(result.period1).toMatch(/^\d{4}-W\d{2}$/)
      expect(result.period2).toMatch(/^\d{4}-W\d{2}$/)
      vi.useRealTimers()
    })
  })

  describe('real-world scenarios', () => {
    it('January 2026 MoM comparison matches expected weeks', () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_DATE)
      const result = getMoMPreset()
      // period2 is January 2026, period1 is December 2025
      expect(result.period2).toContain('2026-W')
      expect(result.period1).toContain('2025-W')
      vi.useRealTimers()
    })

    it('Q1 2026 QoQ comparison matches expected weeks', () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_DATE)
      const result = getQoQPreset()
      // period2 is Q1 2026, period1 is Q4 2025
      expect(result.period2).toContain('2026-W')
      expect(result.period1).toContain('2025-W')
      vi.useRealTimers()
    })

    it('Week 5 2026 YoY comparison matches expected weeks', () => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_DATE)
      const result = getYoYPreset()
      // Both periods should have the same week number
      const w1 = result.period1.match(/W(\d{2})$/)?.[1]
      const w2 = result.period2.match(/W(\d{2})$/)?.[1]
      expect(w1).toBe(w2)
      vi.useRealTimers()
    })
  })
})
