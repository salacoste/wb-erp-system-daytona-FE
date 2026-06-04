/**
 * Russian-locale guard for formatDiscount (iter-112).
 *
 * Was `-${pct}%` → "-30%" (dot-locale, no NBSP). Now `-${formatPercentageInt(pct)}` → "-30 %"
 * (whole percent + NBSP; suggested_discount_pct is a whole-percent discount). The "-" is a literal
 * prefix marking a discount; the magnitude is formatted positive. This is a RAW helper return (not
 * DOM-queried), so assert NBSP via `\s` regex / String.fromCharCode(0xa0), never a plain-space literal.
 */

import { describe, it, expect } from 'vitest'
import { formatDiscount } from '@/lib/liquidity-utils'

const NBSP = String.fromCharCode(0xa0)

describe('formatDiscount — Russian-locale discount', () => {
  it('formats a whole-percent discount as "-30 %" (comma-locale NBSP)', () => {
    expect(formatDiscount(30)).toMatch(/^-30\s%$/)
  })

  it('uses a real NBSP (U+00A0) before the percent sign, not a plain space', () => {
    expect(formatDiscount(50)).toBe(`-50${NBSP}%`)
  })

  it('rounds a fractional discount DOWN (<.5) to whole percent', () => {
    expect(formatDiscount(15.4)).toMatch(/^-15\s%$/)
  })

  it('rounds a fractional discount UP (>=.5) to whole percent', () => {
    expect(formatDiscount(15.6)).toMatch(/^-16\s%$/)
  })
})
