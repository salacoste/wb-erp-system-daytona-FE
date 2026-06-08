/**
 * Tests for formatters.ts
 * Russian-locale number, currency, date, and percentage formatting.
 * Key: comma decimal, NBSP before ₽, space thousands separator.
 */
import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercentage,
  formatPercentageInt,
  formatDate,
  formatDateTime,
  formatIsoWeek,
  formatRoas,
  formatPercentagePoints,
  formatNumber,
  formatDecimal,
  formatWeeksAgo,
  formatWeeksAgoShort,
} from '../formatters'

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formats integer rubles with ₽ symbol', () => {
    const result = formatCurrency(1234567)
    // Russian locale: space thousands, ₽ symbol
    expect(result).toContain('₽')
    expect(result).toMatch(/1\s*234\s*567/)
  })

  it('formats with kopecks (2 decimals)', () => {
    const result = formatCurrency(1234567.89)
    expect(result).toContain('₽')
    // Comma decimal separator in Russian locale
    expect(result).toMatch(/,89/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('₽')
    expect(result).toMatch(/0/)
  })

  it('formats negative values', () => {
    const result = formatCurrency(-1500)
    expect(result).toContain('-')
    expect(result).toContain('₽')
  })

  it('uses comma as decimal separator (Russian locale)', () => {
    const result = formatCurrency(1234.5)
    expect(result).toMatch(/,5/)
    // Should NOT contain dot as decimal separator
    expect(result).not.toMatch(/\.\d{1,2}\s*₽/)
  })

  it('uses NBSP or space before ₽', () => {
    const result = formatCurrency(100)
    // The ₽ should be present, preceded by NBSP ( ) or regular space
    expect(result).toMatch(/[\s ]₽/)
  })

  it('formats small amounts', () => {
    const result = formatCurrency(1)
    expect(result).toContain('₽')
    expect(result).toMatch(/1/)
  })

  it('rounds to 2 decimals max', () => {
    const result = formatCurrency(123.456)
    // Should round to 2 decimals, not show 3
    expect(result).not.toMatch(/,456/)
  })

  it('shows 0 decimals for whole numbers', () => {
    const result = formatCurrency(100)
    // Whole numbers should not show ,00
    expect(result).not.toMatch(/,00/)
  })
})

// ---------------------------------------------------------------------------
// formatPercentage
// ---------------------------------------------------------------------------
describe('formatPercentage', () => {
  it('formats typical percentage with Russian locale', () => {
    const result = formatPercentage(15.5)
    // Value is already in percent units (0-100), divided by 100 internally
    // 15.5% → 0.155 → "15,5 %"
    expect(result).toContain('%')
    expect(result).toMatch(/,/)
  })

  it('uses comma as decimal separator', () => {
    const result = formatPercentage(15.5)
    // Should contain comma, not dot
    expect(result).toMatch(/,/)
  })

  it('uses NBSP before % symbol', () => {
    const result = formatPercentage(75)
    // Russian locale: "75 %" with NBSP
    expect(result).toMatch(/[\s ]%/)
  })

  it('formats zero percent', () => {
    const result = formatPercentage(0)
    expect(result).toMatch(/0/)
    expect(result).toContain('%')
  })

  it('formats 100 percent', () => {
    const result = formatPercentage(100)
    expect(result).toContain('%')
    expect(result).toMatch(/100/)
  })

  it('formats negative percentages', () => {
    const result = formatPercentage(-5.5)
    expect(result).toContain('-')
    expect(result).toContain('%')
  })

  it('respects decimals parameter = 0', () => {
    const result = formatPercentage(75.5, 0)
    // With 0 decimals: "76 %" (rounds up) or "75 %"
    expect(result).toContain('%')
    // Should NOT have a comma (no decimals)
    expect(result).not.toMatch(/\d+,\d/)
  })

  it('respects decimals parameter = 2', () => {
    const result = formatPercentage(15.55, 2)
    expect(result).toContain('%')
  })
})

// ---------------------------------------------------------------------------
// formatPercentageInt
// ---------------------------------------------------------------------------
describe('formatPercentageInt', () => {
  it('formats whole percentages without decimals', () => {
    const result = formatPercentageInt(75)
    // Should be something like "75 %"
    expect(result).toMatch(/75/)
    expect(result).toContain('%')
  })

  it('rounds fractional values', () => {
    const result = formatPercentageInt(75.5)
    // 75.5 → rounds to 76 or 75 depending on rounding mode
    expect(result).toContain('%')
  })
})

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------
describe('formatDate', () => {
  it('formats date as DD.MM.YYYY', () => {
    const result = formatDate('2026-01-20')
    expect(result).toBe('20.01.2026')
  })

  it('formats Date object', () => {
    const result = formatDate(new Date(2026, 0, 20))
    expect(result).toBe('20.01.2026')
  })

  it('pads single-digit day and month', () => {
    const result = formatDate('2026-03-05')
    expect(result).toBe('05.03.2026')
  })

  it('returns dash for invalid string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('returns dash for Invalid Date object', () => {
    expect(formatDate(new Date('invalid'))).toBe('—')
  })

  it('handles ISO datetime string', () => {
    const result = formatDate('2026-06-15T10:30:00.000Z')
    expect(result).toMatch(/^\d{2}\.\d{2}\.2026$/)
  })

  it('handles year boundary dates', () => {
    const result = formatDate('2025-12-31')
    expect(result).toBe('31.12.2025')
  })
})

// ---------------------------------------------------------------------------
// formatDateTime
// ---------------------------------------------------------------------------
describe('formatDateTime', () => {
  it('formats date+time with Moscow timezone', () => {
    const result = formatDateTime('2026-06-15T10:30:00Z')
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/)
  })

  it('returns dash for null', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('returns dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('returns dash for invalid date string', () => {
    expect(formatDateTime('not-valid')).toBe('—')
  })

  it('returns dash for Invalid Date object', () => {
    expect(formatDateTime(new Date('invalid'))).toBe('—')
  })

  it('formats Date object', () => {
    const result = formatDateTime(new Date(2026, 5, 15, 10, 30))
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/)
  })
})

// ---------------------------------------------------------------------------
// formatIsoWeek
// ---------------------------------------------------------------------------
describe('formatIsoWeek', () => {
  it('formats a known date to ISO week', () => {
    // 2026-01-20 is a Tuesday in week 04
    const result = formatIsoWeek('2026-01-20')
    expect(result).toBe('2026-W04')
  })

  it('returns dash for invalid date string', () => {
    expect(formatIsoWeek('invalid')).toBe('—')
  })

  it('returns dash for empty string', () => {
    expect(formatIsoWeek('')).toBe('—')
  })

  it('returns dash for Invalid Date object', () => {
    expect(formatIsoWeek(new Date('invalid'))).toBe('—')
  })

  it('pads single-digit week numbers', () => {
    // First week of year should be "W01"
    const result = formatIsoWeek('2026-01-05')
    expect(result).toMatch(/-W0\d$/)
  })

  it('handles year boundary correctly (uses ISO week year)', () => {
    // 2024-12-30 is Monday of ISO week 01 of 2025
    const result = formatIsoWeek('2024-12-30')
    expect(result).toBe('2025-W01')
  })

  it('formats Date object', () => {
    const result = formatIsoWeek(new Date(2026, 0, 20))
    expect(result).toBe('2026-W04')
  })
})

// ---------------------------------------------------------------------------
// formatRoas
// ---------------------------------------------------------------------------
describe('formatRoas', () => {
  it('formats ROAS with comma decimal and x suffix', () => {
    expect(formatRoas(2.5)).toBe('2,5x')
  })

  it('formats integer ROAS', () => {
    expect(formatRoas(5)).toBe('5,0x')
  })

  it('formats zero', () => {
    expect(formatRoas(0)).toBe('0,0x')
  })

  it('formats high ROAS', () => {
    expect(formatRoas(12.3)).toBe('12,3x')
  })

  it('formats fractional ROAS', () => {
    expect(formatRoas(1.16)).toBe('1,2x') // rounds to 1 decimal
  })

  it('formats negative ROAS', () => {
    expect(formatRoas(-1.5)).toBe('-1,5x')
  })

  it('always uses one decimal place', () => {
    expect(formatRoas(3)).toBe('3,0x')
    expect(formatRoas(3.14)).toBe('3,1x')
  })
})

// ---------------------------------------------------------------------------
// formatPercentagePoints
// ---------------------------------------------------------------------------
describe('formatPercentagePoints', () => {
  it('formats positive diff with + sign', () => {
    expect(formatPercentagePoints(1.5)).toBe('+1,5 п.п.')
  })

  it('formats negative diff without extra sign', () => {
    expect(formatPercentagePoints(-2.0)).toBe('-2,0 п.п.')
  })

  it('formats zero diff', () => {
    expect(formatPercentagePoints(0)).toBe('0,0 п.п.')
  })

  it('uses comma as decimal separator', () => {
    expect(formatPercentagePoints(3.5)).toContain(',')
    expect(formatPercentagePoints(3.5)).not.toMatch(/\d+\.\d+/)
  })

  it('includes п.п. suffix', () => {
    expect(formatPercentagePoints(1)).toContain('п.п.')
  })

  it('uses one decimal place', () => {
    expect(formatPercentagePoints(1)).toBe('+1,0 п.п.')
    expect(formatPercentagePoints(2.34)).toBe('+2,3 п.п.')
  })
})

// ---------------------------------------------------------------------------
// formatNumber
// ---------------------------------------------------------------------------
describe('formatNumber', () => {
  it('formats integer with space thousands separator', () => {
    const result = formatNumber(1234567)
    // Russian locale uses space as thousands separator
    expect(result).toMatch(/1\s*234\s*567/)
  })

  it('rounds to integer', () => {
    expect(formatNumber(1234.7)).toMatch(/1\s*235/)
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats negative', () => {
    const result = formatNumber(-1500)
    expect(result).toContain('-')
  })

  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42')
  })
})

// ---------------------------------------------------------------------------
// formatDecimal
// ---------------------------------------------------------------------------
describe('formatDecimal', () => {
  it('formats with default 1 decimal place', () => {
    const result = formatDecimal(12.5)
    expect(result).toContain(',')
    expect(result).toMatch(/12,5/)
  })

  it('formats with custom decimal places', () => {
    const result = formatDecimal(12.567, 2)
    expect(result).toMatch(/12,57/)
  })

  it('pads whole numbers to specified decimals', () => {
    const result = formatDecimal(2, 1)
    expect(result).toBe('2,0')
  })

  it('adds thousands grouping for large numbers', () => {
    const result = formatDecimal(1234.5, 1)
    // Should have space as thousands separator
    expect(result).toMatch(/1\s*234,5/)
  })

  it('handles zero', () => {
    expect(formatDecimal(0, 1)).toBe('0,0')
  })

  it('handles negative', () => {
    const result = formatDecimal(-5.5, 1)
    expect(result).toContain('-')
    expect(result).toMatch(/5,5/)
  })

  it('uses comma decimal separator (not dot)', () => {
    const result = formatDecimal(3.14, 1)
    expect(result).not.toMatch(/\./)
    expect(result).toContain(',')
  })
})

// ---------------------------------------------------------------------------
// formatWeeksAgo
// ---------------------------------------------------------------------------
describe('formatWeeksAgo', () => {
  it('returns empty string for null', () => {
    expect(formatWeeksAgo(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatWeeksAgo(undefined)).toBe('')
  })

  it('returns "на этой неделе" for 0', () => {
    expect(formatWeeksAgo(0)).toBe('на этой неделе')
  })

  it('returns "более года назад" for > 52', () => {
    expect(formatWeeksAgo(53)).toBe('более года назад')
    expect(formatWeeksAgo(100)).toBe('более года назад')
  })

  // Russian pluralization: 1 → "неделю"
  it('uses accusative singular for 1', () => {
    expect(formatWeeksAgo(1)).toBe('1 неделю назад')
  })

  // 2-4 → "недели"
  it('uses genitive singular for 2-4', () => {
    expect(formatWeeksAgo(2)).toBe('2 недели назад')
    expect(formatWeeksAgo(3)).toBe('3 недели назад')
    expect(formatWeeksAgo(4)).toBe('4 недели назад')
  })

  // 5-20 → "недель"
  it('uses genitive plural for 5-20', () => {
    expect(formatWeeksAgo(5)).toBe('5 недель назад')
    expect(formatWeeksAgo(10)).toBe('10 недель назад')
    expect(formatWeeksAgo(20)).toBe('20 недель назад')
  })

  // 11-19 exception (always "недель")
  it('uses genitive plural for 11-19 regardless of last digit', () => {
    expect(formatWeeksAgo(11)).toBe('11 недель назад')
    expect(formatWeeksAgo(12)).toBe('12 недель назад')
    expect(formatWeeksAgo(14)).toBe('14 недель назад')
    expect(formatWeeksAgo(19)).toBe('19 недель назад')
  })

  // 21 → "неделю", 22-24 → "недели", 25-30 → "недель"
  it('cycles correctly in the 20s', () => {
    expect(formatWeeksAgo(21)).toBe('21 неделю назад')
    expect(formatWeeksAgo(22)).toBe('22 недели назад')
    expect(formatWeeksAgo(25)).toBe('25 недель назад')
    expect(formatWeeksAgo(30)).toBe('30 недель назад')
  })

  // 31 → "неделю"
  it('cycles correctly at 31', () => {
    expect(formatWeeksAgo(31)).toBe('31 неделю назад')
  })

  // 51 → "неделю" (last in range before >52)
  it('handles 51 correctly', () => {
    expect(formatWeeksAgo(51)).toBe('51 неделю назад')
  })

  it('handles 52 as last normal week', () => {
    expect(formatWeeksAgo(52)).toBe('52 недели назад')
  })
})

// ---------------------------------------------------------------------------
// formatWeeksAgoShort
// ---------------------------------------------------------------------------
describe('formatWeeksAgoShort', () => {
  it('returns empty string for null', () => {
    expect(formatWeeksAgoShort(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatWeeksAgoShort(undefined)).toBe('')
  })

  it('returns short form for 0', () => {
    expect(formatWeeksAgoShort(0)).toBe('на этой нед.')
  })

  it('returns >1 года for > 52', () => {
    expect(formatWeeksAgoShort(53)).toBe('>1 года')
  })

  it('returns abbreviated form for normal weeks', () => {
    expect(formatWeeksAgoShort(3)).toBe('3 нед. назад')
    expect(formatWeeksAgoShort(10)).toBe('10 нед. назад')
    expect(formatWeeksAgoShort(1)).toBe('1 нед. назад')
  })

  it('handles 52', () => {
    expect(formatWeeksAgoShort(52)).toBe('52 нед. назад')
  })
})
