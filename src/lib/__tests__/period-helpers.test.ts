/**
 * TDD Tests for Story 60.1-FE: Period Helper Functions
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * GREEN Phase: Tests enabled and passing after implementation
 *
 * Pure utility functions for period calculations, formatting, and conversions.
 *
 * @see docs/stories/epic-60/story-60.1-fe-period-state-management.md
 */

import { describe, it, expect } from 'vitest'
import {
  getWeeksInMonth,
  getMonthFromWeek,
  getPreviousPeriod,
  formatPeriodDisplay,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
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

    it.todo('throws error for invalid type')
    // Note: TypeScript prevents invalid type at compile time
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
      expect(formatPeriodDisplay('2026-01', 'month')).toBe('Январь 2026')
      expect(formatPeriodDisplay('2026-02', 'month')).toBe('Февраль 2026')
      expect(formatPeriodDisplay('2026-03', 'month')).toBe('Март 2026')
      expect(formatPeriodDisplay('2026-04', 'month')).toBe('Апрель 2026')
      expect(formatPeriodDisplay('2026-05', 'month')).toBe('Май 2026')
      expect(formatPeriodDisplay('2026-06', 'month')).toBe('Июнь 2026')
      expect(formatPeriodDisplay('2026-07', 'month')).toBe('Июль 2026')
      expect(formatPeriodDisplay('2026-08', 'month')).toBe('Август 2026')
      expect(formatPeriodDisplay('2026-09', 'month')).toBe('Сентябрь 2026')
      expect(formatPeriodDisplay('2026-10', 'month')).toBe('Октябрь 2026')
      expect(formatPeriodDisplay('2026-11', 'month')).toBe('Ноябрь 2026')
      expect(formatPeriodDisplay('2026-12', 'month')).toBe('Декабрь 2026')
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
      // Use local date formatting to avoid timezone issues
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
