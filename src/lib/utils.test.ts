/**
 * Tests for utility functions
 * Story 4.9: formatWeeksAgo and formatWeeksAgoShort functions
 * Story 24.11-FE: Additional utility function tests for storage analytics
 */

import { describe, it, expect } from 'vitest'
import {
  formatWeeksAgo,
  formatWeeksAgoShort,
  formatCurrency,
  formatPercentage,
  formatPercentageInt,
  formatRoas,
  formatDate,
  formatIsoWeek,
} from './utils'

describe('formatWeeksAgo', () => {
  it('returns empty string for null', () => {
    expect(formatWeeksAgo(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatWeeksAgo(undefined)).toBe('')
  })

  it('returns "на этой неделе" for 0 weeks', () => {
    expect(formatWeeksAgo(0)).toBe('на этой неделе')
  })

  it('returns "более года назад" for >52 weeks', () => {
    expect(formatWeeksAgo(53)).toBe('более года назад')
    expect(formatWeeksAgo(100)).toBe('более года назад')
  })

  // Russian pluralization: 1 неделю
  it('returns "1 неделю назад" for 1 week', () => {
    expect(formatWeeksAgo(1)).toBe('1 неделю назад')
  })

  it('returns "21 неделю назад" for 21 weeks', () => {
    expect(formatWeeksAgo(21)).toBe('21 неделю назад')
  })

  // Russian pluralization: 2-4 недели
  it('returns "2 недели назад" for 2 weeks', () => {
    expect(formatWeeksAgo(2)).toBe('2 недели назад')
  })

  it('returns "3 недели назад" for 3 weeks', () => {
    expect(formatWeeksAgo(3)).toBe('3 недели назад')
  })

  it('returns "4 недели назад" for 4 weeks', () => {
    expect(formatWeeksAgo(4)).toBe('4 недели назад')
  })

  it('returns "22 недели назад" for 22 weeks', () => {
    expect(formatWeeksAgo(22)).toBe('22 недели назад')
  })

  // Russian pluralization: 5-20 недель
  it('returns "5 недель назад" for 5 weeks', () => {
    expect(formatWeeksAgo(5)).toBe('5 недель назад')
  })

  it('returns "10 недель назад" for 10 weeks', () => {
    expect(formatWeeksAgo(10)).toBe('10 недель назад')
  })

  it('returns "11 недель назад" for 11 weeks', () => {
    expect(formatWeeksAgo(11)).toBe('11 недель назад')
  })

  it('returns "19 недель назад" for 19 weeks', () => {
    expect(formatWeeksAgo(19)).toBe('19 недель назад')
  })

  it('returns "20 недель назад" for 20 weeks', () => {
    expect(formatWeeksAgo(20)).toBe('20 недель назад')
  })
})

describe('formatWeeksAgoShort', () => {
  it('returns empty string for null', () => {
    expect(formatWeeksAgoShort(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatWeeksAgoShort(undefined)).toBe('')
  })

  it('returns "на этой нед." for 0 weeks', () => {
    expect(formatWeeksAgoShort(0)).toBe('на этой нед.')
  })

  it('returns ">1 года" for >52 weeks', () => {
    expect(formatWeeksAgoShort(53)).toBe('>1 года')
  })

  it('returns "3 нед. назад" for 3 weeks', () => {
    expect(formatWeeksAgoShort(3)).toBe('3 нед. назад')
  })

  it('returns "12 нед. назад" for 12 weeks', () => {
    expect(formatWeeksAgoShort(12)).toBe('12 нед. назад')
  })
})

describe('formatCurrency', () => {
  it('formats positive numbers correctly', () => {
    // Russian locale uses non-breaking space and specific formatting
    const result = formatCurrency(1234567.89)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('567')
    expect(result).toContain('₽')
  })

  it('formats zero correctly', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('₽')
  })

  it('formats negative numbers correctly', () => {
    const result = formatCurrency(-1234.56)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('₽')
  })
})

describe('formatPercentage', () => {
  it('formats percentage correctly', () => {
    // 15 / 100 = 0.15 = 15%
    const result = formatPercentage(15)
    expect(result).toContain('15')
    expect(result).toContain('%')
  })

  it('formats decimal percentage correctly', () => {
    const result = formatPercentage(15.5)
    expect(result).toContain('15')
    expect(result).toContain('%')
  })

  it('formats zero correctly', () => {
    const result = formatPercentage(0)
    expect(result).toContain('0')
    expect(result).toContain('%')
  })

  // iter-67: locale-percent consolidation helpers.
  it('uses comma decimal + a separated percent sign (Russian locale, not dot)', () => {
    const result = formatPercentage(15.5)
    expect(result).toMatch(/15,5\s%/)
    expect(result).not.toMatch(/15\.5/)
  })

  it('honours an explicit fixed decimals argument', () => {
    expect(formatPercentage(15.5, 0)).toMatch(/16\s%/) // rounds to whole
    expect(formatPercentage(15, 0)).toMatch(/15\s%/)
    expect(formatPercentage(15.5, 0)).not.toMatch(/,/) // no decimal separator at 0 places
  })
})

describe('formatPercentageInt', () => {
  it('renders a whole percent with no decimals (Russian locale)', () => {
    expect(formatPercentageInt(75)).toMatch(/75\s%/)
    expect(formatPercentageInt(75)).not.toMatch(/,/)
    expect(formatPercentageInt(100)).toMatch(/100\s%/)
  })

  it('rounds fractional input to a whole percent', () => {
    expect(formatPercentageInt(33.27)).toMatch(/33\s%/)
  })
})

describe('formatRoas', () => {
  it('formats a ROAS multiplier with Russian comma decimal and x suffix', () => {
    expect(formatRoas(2.5)).toBe('2,5x')
    expect(formatRoas(13.2)).toBe('13,2x')
  })

  it('renders a legitimate zero as "0,0x" (distinct from a null "—")', () => {
    expect(formatRoas(0)).toBe('0,0x')
  })

  it('rounds to one decimal (same as toFixed(1)) and never emits a dot', () => {
    expect(formatRoas(0.05)).toBe('0,1x')
    expect(formatRoas(2.5)).not.toContain('.')
  })

  it('preserves the sign for a negative ROAS', () => {
    expect(formatRoas(-1.5)).toBe('-1,5x')
  })
})

describe('formatDate', () => {
  it('formats Date object correctly', () => {
    const date = new Date(2025, 0, 20) // January 20, 2025
    expect(formatDate(date)).toBe('20.01.2025')
  })

  it('formats date string correctly', () => {
    expect(formatDate('2025-01-20')).toBe('20.01.2025')
  })

  it('pads single digit day and month', () => {
    const date = new Date(2025, 0, 5) // January 5, 2025
    expect(formatDate(date)).toBe('05.01.2025')
  })

  it('handles end of year dates', () => {
    const date = new Date(2025, 11, 31) // December 31, 2025
    expect(formatDate(date)).toBe('31.12.2025')
  })
})

describe('formatIsoWeek', () => {
  // iter-86: tightened from lenient regexes to exact assertions. The date-fns implementation is
  // deterministic (no timezone jitter), so these mid-year dates have one correct ISO week each.
  it('formats Date object to ISO week', () => {
    // January 20, 2025 (Monday) is in ISO week 4 of 2025
    expect(formatIsoWeek(new Date(2025, 0, 20))).toBe('2025-W04')
  })

  it('formats date string to ISO week', () => {
    expect(formatIsoWeek('2025-01-20')).toBe('2025-W04')
  })

  it('pads single digit week numbers', () => {
    // January 6, 2025 (Monday) is in ISO week 2
    expect(formatIsoWeek(new Date(2025, 0, 6))).toBe('2025-W02')
  })

  it('handles week 1 of new year', () => {
    // January 1, 2025 is Wednesday — ISO week 1 of 2025
    expect(formatIsoWeek(new Date(2025, 0, 1))).toBe('2025-W01')
  })

  it('returns the "—" sentinel for an invalid date (no "NaN-WNaN")', () => {
    expect(formatIsoWeek('not-a-date')).toBe('—')
    expect(formatIsoWeek('')).toBe('—')
  })

  // iter-86: year-boundary correctness — formatIsoWeek must emit the ISO-week-YEAR, not the
  // calendar year. These days belong to the NEXT/PRIOR ISO year; the old getFullYear() code
  // returned the wrong year + a nonexistent week (e.g. "2024-W01").
  it('uses the ISO-week-year at the end of the calendar year (Dec 29 2025 → 2026-W01)', () => {
    // Monday 2025-12-29 is in the ISO week whose Thursday is 2026-01-01 → ISO year 2026, week 1.
    expect(formatIsoWeek(new Date(2025, 11, 29))).toBe('2026-W01')
  })

  it('uses the ISO-week-year at the start of the calendar year (Dec 30 2024 → 2025-W01)', () => {
    expect(formatIsoWeek(new Date(2024, 11, 30))).toBe('2025-W01')
  })

  it('belongs to the PRIOR ISO year for early-January days (Jan 1 2023 → 2022-W52)', () => {
    // Sunday 2023-01-01 is in ISO week 2022-W52 (its Thursday is 2022-12-29).
    expect(formatIsoWeek(new Date(2023, 0, 1))).toBe('2022-W52')
  })

  it('handles an ISO W53 year boundary (Jan 1 2021 → 2020-W53)', () => {
    // Friday 2021-01-01 is in ISO week 2020-W53 (its Thursday is 2020-12-31).
    expect(formatIsoWeek(new Date(2021, 0, 1))).toBe('2020-W53')
  })
})
