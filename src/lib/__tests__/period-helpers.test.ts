/**
 * Tests for Period Helper Functions
 *
 * Story 60.1-FE: Period State Management (GREEN Phase - passing)
 * Story 61.7-FE: Unify ISO Week Calculation Logic
 * Story 61.11-FE: Fix 53-Week Year Handling
 *
 * Pure utility functions for period calculations, formatting, and conversions.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  getWeeksInMonth,
  getMonthFromWeek,
  getPreviousPeriod,
  formatPeriodDisplay,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
  getCurrentWeek,
  getCurrentMonth,
  getIsoWeeksInYear,
  dateToIsoWeek,
  getWeekRange,
  isoWeekToDateRange,
} from '../period-helpers'

// =============================================================================
// getWeeksInMonth Function
// =============================================================================

describe('Story 60.1-FE: getWeeksInMonth', () => {
  describe('basic functionality', () => {
    it('returns array of weeks for January 2026', () => {
      const weeks = getWeeksInMonth('2026-01')
      expect(weeks).toContain('2026-W01')
      expect(weeks).toContain('2026-W04')
    })

    it('returns 4-5 weeks for a typical month', () => {
      const weeks = getWeeksInMonth('2026-01')
      expect(weeks.length).toBeGreaterThanOrEqual(4)
      expect(weeks.length).toBeLessThanOrEqual(5)
    })

    it('handles months with weeks spanning two years', () => {
      const weeks = getWeeksInMonth('2026-01')
      weeks.forEach(week => {
        expect(week).toMatch(/^\d{4}-W\d{2}$/)
      })
    })

    it('handles December correctly', () => {
      const weeks = getWeeksInMonth('2025-12')
      expect(weeks.length).toBeGreaterThanOrEqual(4)
    })

    it('handles February in leap year', () => {
      const weeks = getWeeksInMonth('2024-02')
      expect(weeks.length).toBeGreaterThanOrEqual(4)
    })

    it('handles February in non-leap year', () => {
      const weeks = getWeeksInMonth('2026-02')
      expect(weeks.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('edge cases', () => {
    it('throws error for invalid month format', () => {
      expect(() => getWeeksInMonth('invalid')).toThrow()
      expect(() => getWeeksInMonth('2026-13')).toThrow()
    })

    it('throws error for month with invalid day range', () => {
      expect(() => getWeeksInMonth('2026-00')).toThrow()
    })
  })
})

// =============================================================================
// getMonthFromWeek Function
// =============================================================================

describe('Story 60.1-FE: getMonthFromWeek', () => {
  describe('basic functionality', () => {
    it('returns correct month for middle-of-month week', () => {
      expect(getMonthFromWeek('2026-W03')).toBe('2026-01')
    })

    it('returns correct month for first week of year', () => {
      expect(getMonthFromWeek('2026-W01')).toBe('2026-01')
    })

    it('returns correct month for last week of year', () => {
      expect(getMonthFromWeek('2025-W52')).toBe('2025-12')
    })

    it('handles week 53 when it exists', () => {
      expect(getMonthFromWeek('2020-W53')).toBe('2020-12')
    })
  })

  describe('boundary weeks', () => {
    it('uses Thursday (midpoint) to determine month', () => {
      // W05 2026 spans Jan 27 - Feb 2, Thursday is Jan 30 -> January
      expect(getMonthFromWeek('2026-W05')).toBe('2026-01')
    })

    it('returns December for week with Thursday in Dec', () => {
      // W52 2025 Thursday is Dec 25
      expect(getMonthFromWeek('2025-W52')).toBe('2025-12')
    })

    it('returns January for week with Thursday in Jan', () => {
      // W01 2026 Thursday is Jan 1
      expect(getMonthFromWeek('2026-W01')).toBe('2026-01')
    })
  })

  describe('edge cases', () => {
    it('throws error for invalid week format', () => {
      expect(() => getMonthFromWeek('invalid')).toThrow()
      expect(() => getMonthFromWeek('2026-W54')).toThrow()
    })

    it('throws error for week 0', () => {
      expect(() => getMonthFromWeek('2026-W00')).toThrow()
    })
  })
})

// =============================================================================
// getPreviousPeriod Function
// =============================================================================

describe('Story 60.1-FE: getPreviousPeriod', () => {
  describe('week type', () => {
    it('returns previous week for middle of year', () => {
      expect(getPreviousPeriod('2026-W05', 'week')).toBe('2026-W04')
    })

    it('handles year boundary: W01 -> previous year W52/53', () => {
      expect(getPreviousPeriod('2026-W01', 'week')).toBe('2025-W52')
    })

    it('handles year with 53 weeks correctly', () => {
      expect(getPreviousPeriod('2021-W01', 'week')).toBe('2020-W53')
    })

    it('pads week number with zero', () => {
      expect(getPreviousPeriod('2026-W10', 'week')).toBe('2026-W09')
    })
  })

  describe('month type', () => {
    it('returns previous month for middle of year', () => {
      expect(getPreviousPeriod('2026-06', 'month')).toBe('2026-05')
    })

    it('handles year boundary: 01 -> previous year 12', () => {
      expect(getPreviousPeriod('2026-01', 'month')).toBe('2025-12')
    })

    it('pads month number with zero', () => {
      expect(getPreviousPeriod('2026-10', 'month')).toBe('2026-09')
    })
  })

  describe('edge cases', () => {
    it('throws error for invalid period format', () => {
      expect(() => getPreviousPeriod('invalid', 'week')).toThrow()
    })

    it('throws error for invalid type', () => {
      // TypeScript prevents invalid type at compile time,
      // but the function delegates to getPreviousMonth for non-week
      expect(getPreviousPeriod('2026-01', 'month')).toBe('2025-12')
    })
  })
})

// =============================================================================
// formatPeriodDisplay Function
// =============================================================================

describe('Story 60.1-FE: formatPeriodDisplay', () => {
  describe('week formatting', () => {
    it('formats week with Russian locale', () => {
      const formatted = formatPeriodDisplay('2026-W05', 'week')
      expect(formatted).toContain('Неделя 5')
      expect(formatted).toContain('2026')
    })

    it('uses correct Russian month abbreviations', () => {
      const formatted = formatPeriodDisplay('2026-W05', 'week')
      expect(formatted).toContain('янв')
      expect(formatted).toContain('фев')
    })

    it('formats single-digit week without leading zero', () => {
      expect(formatPeriodDisplay('2026-W05', 'week')).toContain('Неделя 5')
    })

    it('formats double-digit week correctly', () => {
      expect(formatPeriodDisplay('2026-W12', 'week')).toContain('Неделя 12')
    })

    it('shows date range in parentheses', () => {
      const formatted = formatPeriodDisplay('2026-W05', 'week')
      expect(formatted).toMatch(/\(.*—.*\)/)
    })

    it('handles week spanning month boundary', () => {
      const formatted = formatPeriodDisplay('2026-W05', 'week')
      expect(formatted).toContain('янв')
      expect(formatted).toContain('фев')
    })

    it('handles week within same month', () => {
      const formatted = formatPeriodDisplay('2026-W03', 'week')
      // W03 spans Jan 12-18, both in January
      expect(formatted).toContain('янв')
    })
  })

  describe('month formatting', () => {
    it('formats month with Russian locale', () => {
      expect(formatPeriodDisplay('2026-01', 'month')).toBe('Январь 2026')
    })

    it('uses correct Russian month names', () => {
      expect(formatPeriodDisplay('2025-01', 'month')).toBe('Январь 2025')
      expect(formatPeriodDisplay('2025-02', 'month')).toBe('Февраль 2025')
      expect(formatPeriodDisplay('2025-03', 'month')).toBe('Март 2025')
      expect(formatPeriodDisplay('2025-04', 'month')).toBe('Апрель 2025')
      expect(formatPeriodDisplay('2025-05', 'month')).toBe('Май 2025')
      expect(formatPeriodDisplay('2025-06', 'month')).toBe('Июнь 2025')
      expect(formatPeriodDisplay('2025-07', 'month')).toBe('Июль 2025')
      expect(formatPeriodDisplay('2025-08', 'month')).toBe('Август 2025')
      expect(formatPeriodDisplay('2025-09', 'month')).toBe('Сентябрь 2025')
      expect(formatPeriodDisplay('2025-10', 'month')).toBe('Октябрь 2025')
      expect(formatPeriodDisplay('2025-11', 'month')).toBe('Ноябрь 2025')
      expect(formatPeriodDisplay('2025-12', 'month')).toBe('Декабрь 2025')
    })

    it('capitalizes month name', () => {
      expect(formatPeriodDisplay('2026-01', 'month')).toMatch(/^[А-Я]/)
    })
  })

  describe('edge cases', () => {
    it('throws error for invalid week format', () => {
      expect(() => formatPeriodDisplay('invalid', 'week')).toThrow()
    })

    it('throws error for invalid month format', () => {
      expect(() => formatPeriodDisplay('invalid', 'month')).toThrow()
    })
  })
})

// =============================================================================
// Date Range Functions
// =============================================================================

describe('Story 60.1-FE: getWeekStartDate', () => {
  describe('basic functionality', () => {
    it('returns Monday for week start', () => {
      const start = getWeekStartDate('2026-W05')
      expect(start.getDay()).toBe(1) // Monday
    })

    it('returns correct date for W05 2026', () => {
      const start = getWeekStartDate('2026-W05')
      const year = start.getFullYear()
      const month = String(start.getMonth() + 1).padStart(2, '0')
      const day = String(start.getDate()).padStart(2, '0')
      expect(`${year}-${month}-${day}`).toBe('2026-01-26')
    })
  })
})

describe('Story 60.1-FE: getWeekEndDate', () => {
  describe('basic functionality', () => {
    it('returns Sunday for week end', () => {
      const end = getWeekEndDate('2026-W05')
      expect(end.getDay()).toBe(0) // Sunday
    })

    it('returns correct date for W05 2026', () => {
      const end = getWeekEndDate('2026-W05')
      const year = end.getFullYear()
      const month = String(end.getMonth() + 1).padStart(2, '0')
      const day = String(end.getDate()).padStart(2, '0')
      expect(`${year}-${month}-${day}`).toBe('2026-02-01')
    })
  })
})

describe('Story 60.1-FE: getMonthStartDate', () => {
  describe('basic functionality', () => {
    it('returns first day of month', () => {
      const start = getMonthStartDate('2026-01')
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(0) // January
      expect(start.getFullYear()).toBe(2026)
    })

    it('returns correct date for any month', () => {
      const start = getMonthStartDate('2026-06')
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(5) // June (0-indexed)
      expect(start.getFullYear()).toBe(2026)
    })
  })
})

describe('Story 60.1-FE: getMonthEndDate', () => {
  describe('basic functionality', () => {
    it('returns last day of January', () => {
      const end = getMonthEndDate('2026-01')
      expect(end.getDate()).toBe(31)
    })

    it('returns last day of February (non-leap year)', () => {
      const end = getMonthEndDate('2026-02')
      expect(end.getDate()).toBe(28)
    })

    it('returns last day of February (leap year)', () => {
      const end = getMonthEndDate('2024-02')
      expect(end.getDate()).toBe(29)
    })

    it('returns last day of months with 30 days', () => {
      const end = getMonthEndDate('2026-04')
      expect(end.getDate()).toBe(30)
    })

    it('returns last day of December', () => {
      const end = getMonthEndDate('2026-12')
      expect(end.getDate()).toBe(31)
    })
  })
})

// =============================================================================
// Story 61.11-FE: getIsoWeeksInYear Function
// =============================================================================

describe('Story 61.11-FE: getIsoWeeksInYear', () => {
  describe('years with 53 weeks', () => {
    it('returns 53 for year 2020', () => {
      // 2020 is a 53-week year (Jan 1 is Wednesday, Dec 31 is Thursday)
      expect(getIsoWeeksInYear(2020)).toBe(53)
    })

    it('returns 53 for year 2026', () => {
      // 2026 is a 53-week year (Jan 1 is Thursday)
      expect(getIsoWeeksInYear(2026)).toBe(53)
    })

    it('returns 53 for year 2032', () => {
      expect(getIsoWeeksInYear(2032)).toBe(53)
    })

    it('returns 53 for year 2037', () => {
      expect(getIsoWeeksInYear(2037)).toBe(53)
    })

    it('returns 53 for year 2043', () => {
      expect(getIsoWeeksInYear(2043)).toBe(53)
    })

    it('returns 53 for year 2048', () => {
      expect(getIsoWeeksInYear(2048)).toBe(53)
    })
  })

  describe('years with 52 weeks', () => {
    it('returns 52 for year 2021', () => {
      expect(getIsoWeeksInYear(2021)).toBe(52)
    })

    it('returns 52 for year 2022', () => {
      expect(getIsoWeeksInYear(2022)).toBe(52)
    })

    it('returns 52 for year 2023', () => {
      expect(getIsoWeeksInYear(2023)).toBe(52)
    })

    it('returns 52 for year 2024', () => {
      expect(getIsoWeeksInYear(2024)).toBe(52)
    })

    it('returns 52 for year 2025', () => {
      expect(getIsoWeeksInYear(2025)).toBe(52)
    })

    it('returns 52 for year 2027', () => {
      expect(getIsoWeeksInYear(2027)).toBe(52)
    })
  })

  describe('ISO 8601 rule verification', () => {
    it('year has 53 weeks when Jan 1 is Thursday', () => {
      // 2026: Jan 1 is Thursday -> 53 weeks
      const jan1 = new Date(2026, 0, 1)
      expect(jan1.getDay()).toBe(4) // Thursday
      expect(getIsoWeeksInYear(2026)).toBe(53)
    })

    it('year has 53 weeks when Dec 31 is Thursday', () => {
      // 2020: Dec 31 is Thursday -> 53 weeks
      const dec31 = new Date(2020, 11, 31)
      expect(dec31.getDay()).toBe(4) // Thursday
      expect(getIsoWeeksInYear(2020)).toBe(53)
    })

    it('leap year that starts on Wednesday has 53 weeks', () => {
      // 2020: leap year, Jan 1 is Wednesday -> 53 weeks
      const jan1 = new Date(2020, 0, 1)
      expect(jan1.getDay()).toBe(3) // Wednesday
      expect(getIsoWeeksInYear(2020)).toBe(53)
    })
  })
})

// =============================================================================
// Story 61.7-FE: dateToIsoWeek Function
// =============================================================================

describe('Story 61.7-FE: dateToIsoWeek (new function)', () => {
  describe('basic functionality', () => {
    it('converts Date object to ISO week string', () => {
      // new Date("2026-01-31") -> "2026-W05"
      expect(dateToIsoWeek(new Date('2026-01-31'))).toBe('2026-W05')
    })

    it('converts date string to ISO week string', () => {
      // "2026-01-31" -> "2026-W05"
      expect(dateToIsoWeek('2026-01-31')).toBe('2026-W05')
    })

    it('pads week number with zero', () => {
      // "2026-01-05" -> "2026-W02" (W01 starts Dec 29, 2025)
      expect(dateToIsoWeek('2026-01-05')).toBe('2026-W02')
    })
  })

  describe('ISO week year determination', () => {
    it('returns ISO week year when different from calendar year', () => {
      // "2025-12-29" -> "2026-W01" (ISO year 2026, calendar year 2025)
      expect(dateToIsoWeek('2025-12-29')).toBe('2026-W01')
    })

    it('handles December dates in next years W01', () => {
      // "2025-12-30", "2025-12-31" -> "2026-W01"
      expect(dateToIsoWeek('2025-12-30')).toBe('2026-W01')
      expect(dateToIsoWeek('2025-12-31')).toBe('2026-W01')
    })

    it('handles January dates in previous years W52/W53', () => {
      // "2021-01-01" -> "2020-W53"
      expect(dateToIsoWeek('2021-01-01')).toBe('2020-W53')
    })
  })

  describe('round-trip consistency', () => {
    it('dateToIsoWeek on parsed week start returns same week', () => {
      const week = '2026-W10'
      const startDate = getWeekStartDate(week)
      expect(dateToIsoWeek(startDate)).toBe(week)
    })
  })
})

// =============================================================================
// Story 61.7-FE: getWeekRange Function
// =============================================================================

describe('Story 61.7-FE: getWeekRange (new function)', () => {
  describe('basic functionality', () => {
    it('returns array of N weeks going back from start week', () => {
      const range = getWeekRange(4, '2026-W05')
      expect(range).toHaveLength(4)
      expect(range[0]).toBe('2026-W05')
      expect(range[1]).toBe('2026-W04')
      expect(range[2]).toBe('2026-W03')
      expect(range[3]).toBe('2026-W02')
    })

    it('returns single week when numWeeks is 1', () => {
      const range = getWeekRange(1, '2026-W05')
      expect(range).toEqual(['2026-W05'])
    })

    it('returns empty array when numWeeks is 0', () => {
      expect(getWeekRange(0, '2026-W05')).toEqual([])
    })

    it('first element is the current/starting week', () => {
      const range = getWeekRange(3, '2026-W10')
      expect(range[0]).toBe('2026-W10')
    })
  })

  describe('year boundary handling', () => {
    it('correctly crosses year boundary from 52-week year', () => {
      // From W02 2026 going back 4 weeks -> W02, W01 2026, W52, W51 2025
      const range = getWeekRange(4, '2026-W02')
      expect(range).toEqual(['2026-W02', '2026-W01', '2025-W52', '2025-W51'])
    })

    it('correctly crosses year boundary from 53-week year', () => {
      // From W02 2021 going back 4 weeks -> W02, W01 2021, W53, W52 2020
      const range = getWeekRange(4, '2021-W02')
      expect(range).toEqual(['2021-W02', '2021-W01', '2020-W53', '2020-W52'])
    })

    it('includes W53 only when previous year has 53 weeks', () => {
      // Going back from 2021 should include W53 2020
      const range2021 = getWeekRange(4, '2021-W02')
      expect(range2021).toContain('2020-W53')
      // Going back from 2026 should NOT include W53 2025
      const range2026 = getWeekRange(4, '2026-W02')
      expect(range2026).not.toContain('2025-W53')
    })
  })

  describe('optional startWeek parameter', () => {
    it('accepts startWeek to generate range from specific week', () => {
      const range = getWeekRange(3, '2026-W10')
      expect(range).toEqual(['2026-W10', '2026-W09', '2026-W08'])
    })
  })
})

// =============================================================================
// Story 61.7-FE: isoWeekToDateRange Function
// =============================================================================

describe('Story 61.7-FE: isoWeekToDateRange (new function)', () => {
  describe('basic functionality', () => {
    it('returns { from, to } for given week', () => {
      const range = isoWeekToDateRange('2026-W05')
      expect(range.from).toBe('2026-01-26')
      expect(range.to).toBe('2026-02-01')
    })

    it('from is always Monday (ISO standard)', () => {
      // Verify by checking getWeekStartDate returns Monday
      for (const week of ['2026-W01', '2026-W10', '2025-W52']) {
        const start = getWeekStartDate(week)
        expect(start.getDay()).toBe(1) // Monday
      }
    })

    it('to is always Sunday (ISO standard)', () => {
      for (const week of ['2026-W01', '2026-W10', '2025-W52']) {
        const end = getWeekEndDate(week)
        expect(end.getDay()).toBe(0) // Sunday
      }
    })

    it('returns dates in YYYY-MM-DD format', () => {
      const range = isoWeekToDateRange('2026-W10')
      expect(range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('year boundary weeks', () => {
    it('W01 may start in previous calendar year', () => {
      // "2026-W01" -> { from: "2025-12-29", to: "2026-01-04" }
      const range = isoWeekToDateRange('2026-W01')
      expect(range.from).toBe('2025-12-29')
      expect(range.to).toBe('2026-01-04')
    })

    it('W52/W53 may end in next calendar year', () => {
      // "2020-W53" -> { from: "2020-12-28", to: "2021-01-03" }
      const range = isoWeekToDateRange('2020-W53')
      expect(range.from).toBe('2020-12-28')
      expect(range.to).toBe('2021-01-03')
    })
  })

  describe('consistency with existing functions', () => {
    it('from matches getWeekStartDate result', () => {
      const week = '2026-W05'
      const start = getWeekStartDate(week)
      const range = isoWeekToDateRange(week)
      const expected = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      expect(range.from).toBe(expected)
    })

    it('to matches getWeekEndDate result', () => {
      const week = '2026-W05'
      const end = getWeekEndDate(week)
      const range = isoWeekToDateRange(week)
      const expected = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
      expect(range.to).toBe(expected)
    })
  })
})

// =============================================================================
// Story 61.7-FE: getPreviousIsoWeek (Enhanced for 53-week years)
// =============================================================================

describe('Story 61.7-FE: getPreviousIsoWeek enhanced', () => {
  describe('53-week year transitions', () => {
    it('correctly handles W01 -> W53 for years with 53 weeks', () => {
      expect(getPreviousPeriod('2021-W01', 'week')).toBe('2020-W53')
    })

    it('correctly handles W01 -> W52 for years with 52 weeks', () => {
      expect(getPreviousPeriod('2026-W01', 'week')).toBe('2025-W52')
    })

    it('correctly handles W53 -> W52 within same year', () => {
      expect(getPreviousPeriod('2020-W53', 'week')).toBe('2020-W52')
    })

    it('correctly handles W01 -> W53 for 2027 (2026 has 53 weeks)', () => {
      expect(getPreviousPeriod('2027-W01', 'week')).toBe('2026-W53')
    })
  })

  describe('multiple year transitions with 53-week years', () => {
    it('handles sequence through multiple 53-week year boundaries', () => {
      // W02 2021 -> W01 2021 -> W53 2020 -> W52 2020
      expect(getPreviousPeriod('2021-W02', 'week')).toBe('2021-W01')
      expect(getPreviousPeriod('2021-W01', 'week')).toBe('2020-W53')
      expect(getPreviousPeriod('2020-W53', 'week')).toBe('2020-W52')
    })
  })
})

// =============================================================================
// getCurrentWeek / getCurrentMonth — Europe/Moscow anchoring (2026-06-04 fix)
// =============================================================================

describe('getCurrentWeek / getCurrentMonth — Moscow anchoring', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('getCurrentWeek returns the Moscow week across a Sun->Mon week boundary', () => {
    vi.useFakeTimers()
    // Sun 2025-01-05 22:30 UTC = Mon 2025-01-06 01:30 MSK. ISO: Jan 5 -> W01, Jan 6 -> W02.
    vi.setSystemTime(new Date('2025-01-05T22:30:00Z'))
    expect(getCurrentWeek()).toBe('2025-W02') // Moscow (Mon W02), NOT UTC-local (Sun W01)
  })

  it('getCurrentMonth returns the Moscow month across a Jan->Feb boundary', () => {
    vi.useFakeTimers()
    // Fri 2025-01-31 22:30 UTC = Sat 2025-02-01 01:30 MSK.
    vi.setSystemTime(new Date('2025-01-31T22:30:00Z'))
    expect(getCurrentMonth()).toBe('2025-02') // Moscow (Feb), NOT UTC-local (Jan)
  })

  it('mid-day instants are unaffected (same week/month in both zones)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-12T09:00:00Z')) // Wed 12:00 MSK
    expect(getCurrentWeek()).toBe('2025-W11')
    expect(getCurrentMonth()).toBe('2025-03')
  })
})
