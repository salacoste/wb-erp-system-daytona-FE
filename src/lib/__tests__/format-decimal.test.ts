/**
 * Unit tests for formatDecimal (iter-116).
 *
 * Canonical ru-RU fractional formatter for BARE unitless decimals (rates, velocities, multipliers) —
 * comma decimal, fixed decimals, NO NBSP for sub-1000 values. Replaces ad-hoc `value.toFixed(n)`
 * (dot-locale) and `.toFixed(n).replace('.', ',')` patterns. Rounding is Intl halfExpand (≠ toFixed).
 * Plain numbers <1000 carry no NBSP, so exact-string assertions are safe here.
 */

import { describe, it, expect } from 'vitest'
import { formatDecimal } from '@/lib/utils'

describe('formatDecimal', () => {
  it('formats a fractional number with comma decimal (default 1 place)', () => {
    expect(formatDecimal(12.5)).toBe('12,5')
  })

  it('forces the fixed decimal place on a whole number (2 → "2,0")', () => {
    expect(formatDecimal(2)).toBe('2,0')
  })

  it('uses Intl halfExpand rounding at .x5 (1.45 → "1,5", not toFixed "1,4")', () => {
    expect(formatDecimal(1.45)).toBe('1,5')
  })

  it('honours an explicit decimals argument (3.456, 2 → "3,46")', () => {
    expect(formatDecimal(3.456, 2)).toBe('3,46')
  })

  it('renders negatives with an ASCII hyphen (-2.1 → "-2,1")', () => {
    expect(formatDecimal(-2.1)).toBe('-2,1')
  })

  it('does NOT emit an NBSP for sub-1000 values (plain "12,5")', () => {
    expect(formatDecimal(12.5)).not.toContain(String.fromCharCode(0xa0))
  })

  it('DOES emit NBSP thousands-grouping for values ≥1000 ("1 234,5")', () => {
    // documents the helper's full contract; callers ≥1000 must use \s-regex / NBSP, not a plain space
    expect(formatDecimal(1234.5)).toBe(`1${String.fromCharCode(0xa0)}234,5`)
  })
})
