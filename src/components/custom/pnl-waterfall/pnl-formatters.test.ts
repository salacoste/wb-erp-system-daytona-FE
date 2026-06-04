/**
 * Guards for pnl-waterfall/pnl-formatters (no prior dedicated test existed for this module).
 *
 * iter-72 (dot-locale percent consolidation — see
 * docs/process/dot-locale-percent-consolidation-proposal.md): formatPercent rendered the dot-locale
 * form ("15.5%") — no comma decimal, no NBSP. It now delegates to the canonical formatPercentage(
 * x, 1) in @/lib/utils ("15,5 %" — comma + U+00A0). `\s` matches U+00A0; the NBSP separator is
 * proven exclusively by the `.toContain(NBSP)` code-point assertion below.
 */

import { describe, it, expect } from 'vitest'
import { formatPercent, formatCurrency } from './pnl-formatters'

const NBSP = String.fromCharCode(0xa0)

describe('formatPercent (pnl-formatters)', () => {
  it('renders comma decimal + a NBSP-separated "%" (Russian locale), fixed 1 decimal', () => {
    expect(formatPercent(15.5)).toMatch(/^15,5\s%$/)
    expect(formatPercent(100)).toMatch(/^100,0\s%$/)
    expect(formatPercent(0)).toMatch(/^0,0\s%$/)
    expect(formatPercent(15.5)).toContain(NBSP) // separator is NBSP, proven by code-point
  })

  it('never renders the dot-locale form', () => {
    expect(formatPercent(15.5)).not.toContain('15.5%')
    expect(formatPercent(15.5)).not.toContain('.')
    // guards the dot-locale shape: output must NOT contain an ASCII-space-before-% (the real
    // separator is NBSP, proven by the .toContain(NBSP) assertion above)
    expect(formatPercent(15.5)).not.toContain(' %')
  })

  it('renders an ASCII hyphen-minus for negative values', () => {
    expect(formatPercent(-7.1)).toMatch(/^-7,1\s%$/)
  })

  it('returns an em dash for null/undefined (anti-pattern #8: a missing ratio is unknown, not 0)', () => {
    expect(formatPercent(null)).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
  })
})

describe('formatCurrency (pnl-formatters)', () => {
  it('formats RUB with a U+2212 minus for negatives and optional + sign', () => {
    expect(formatCurrency(1000)).toMatch(/1\s*000\s*₽/)
    expect(formatCurrency(-1000)).toContain('−') // U+2212 typographic minus, not ASCII hyphen
    expect(formatCurrency(1000, true)).toContain('+')
    expect(formatCurrency(0, true)).not.toContain('+') // showSign suppressed at zero
    // negative + showSign: still a U+2212 minus, never a '+'
    expect(formatCurrency(-1000, true)).toContain('−')
    expect(formatCurrency(-1000, true)).not.toContain('+')
  })

  it('returns an em dash for null/undefined', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
  })
})
