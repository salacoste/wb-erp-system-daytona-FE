/**
 * Tests for formatTurnoverDays (liquidity-formatters).
 *
 * Covers: the 999 "Нет продаж" sentinel, the 0 "< 1 дня" fast-mover case, Russian plural
 * grammar across last-digit buckets, and (iter-109) fractional input — avg_turnover_days is
 * a category/summary average that can be non-integer; it must round to whole days, never
 * leak a dot-decimal like "22.5 дня".
 */

import { describe, it, expect } from 'vitest'
import { formatTurnoverDays, formatCurrency } from './liquidity-formatters'

describe('formatTurnoverDays', () => {
  it('maps the 999 sentinel (and above) to "Нет продаж"', () => {
    expect(formatTurnoverDays(999)).toBe('Нет продаж')
    expect(formatTurnoverDays(1000)).toBe('Нет продаж')
  })

  it('treats a just-below-999 fractional value as a real slow-mover, not the sentinel', () => {
    // sentinel is matched on the RAW value (>=999), so 998.5 is a real ~999-day turnover
    // rendered via rounding — NOT coerced into "Нет продаж".
    expect(formatTurnoverDays(998.5)).toBe('999 дней')
  })

  it('maps 0 to the sub-day "< 1 дня" label', () => {
    expect(formatTurnoverDays(0)).toBe('< 1 дня')
  })

  it('applies Russian plural grammar by last digit', () => {
    expect(formatTurnoverDays(1)).toBe('1 день')
    expect(formatTurnoverDays(2)).toBe('2 дня')
    expect(formatTurnoverDays(5)).toBe('5 дней')
    expect(formatTurnoverDays(11)).toBe('11 дней') // teens always "дней"
    expect(formatTurnoverDays(21)).toBe('21 день')
    expect(formatTurnoverDays(22)).toBe('22 дня')
    expect(formatTurnoverDays(25)).toBe('25 дней')
    expect(formatTurnoverDays(111)).toBe('111 дней') // 11 in last-two-digits
  })

  it('rounds fractional averages to whole days (never a dot-decimal)', () => {
    expect(formatTurnoverDays(22.5)).toBe('23 дня') // 22.5 → 23
    expect(formatTurnoverDays(22.4)).toBe('22 дня') // 22.4 → 22
    expect(formatTurnoverDays(14.6)).toBe('15 дней') // 14.6 → 15
    expect(formatTurnoverDays(7.7)).toBe('8 дней') // 7.7 → 8 (5-20 bucket)
    expect(formatTurnoverDays(0.4)).toBe('< 1 дня') // sub-half-day → "< 1 дня"
    expect(formatTurnoverDays(0.5)).toBe('1 день') // 0.5 → 1 (round half up)
    // no output ever contains a decimal separator
    for (const v of [22.5, 14.6, 7.7, 100.25]) {
      expect(formatTurnoverDays(v)).not.toMatch(/[.,]\d/)
    }
  })
})

describe('formatCurrency', () => {
  it('renders "—" for null/undefined/non-finite — never a fabricated "0 ₽" (anti-pattern #8)', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
    expect(formatCurrency(Number.NaN)).toBe('—')
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('still renders a real 0 as "0 ₽" (a genuine zero is not "unknown")', () => {
    expect(formatCurrency(0)).toMatch(/0\s*₽/)
  })

  it('formats a positive value in Russian locale with the ₽ symbol', () => {
    const out = formatCurrency(1000)
    expect(out).toMatch(/1\s*000\s*₽/) // NBSP grouping
  })
})
