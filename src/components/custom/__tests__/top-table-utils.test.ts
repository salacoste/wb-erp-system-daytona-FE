/**
 * Russian-locale guard for top-table-utils.formatPercent (TopProducts/TopBrands "%" columns),
 * plus boundary coverage for getMarginColor.
 *
 * iter-69 (dot-locale percent consolidation — see
 * docs/process/dot-locale-percent-consolidation-proposal.md): formatPercent rendered the dot-locale
 * form ("15.5%") — no comma decimal, no NBSP before "%". The Russian-locale rule requires "15,5 %"
 * (comma + U+00A0). It now delegates to the canonical formatPercentage(x, 1) in @/lib/utils. These
 * tests lock comma + the NBSP separator + the em-dash null guard (anti-pattern #8) directly on the
 * helper, complementing the consumer render tests in TopProductsTable / TopBrandsTable (whose
 * getByText matchers normalize the NBSP to a plain space).
 *
 * NBSP note: the ru-RU percent separator is U+00A0 (NBSP) on this runtime; ICU switched ru percent
 * from ASCII space to NBSP at CLDR 42 / ICU 72 (the historical inflection point — the active ICU
 * is the test runner's embedded Node/Vitest ICU, not the comment; check process.versions.icu in CI
 * if this ever regresses). `\s` matches U+00A0; the separator is also asserted via its code-point below.
 */

import { describe, it, expect } from 'vitest'
import { formatPercent, getMarginColor } from '../top-table-utils'

const NBSP = String.fromCharCode(0xa0)

describe('formatPercent (top-table-utils)', () => {
  it('renders comma decimal + a separated "%" (Russian locale), fixed 1 decimal', () => {
    expect(formatPercent(30)).toMatch(/^30,0\s%$/) // margin_pct range
    expect(formatPercent(25.5)).toMatch(/^25,5\s%$/)
    expect(formatPercent(10)).toMatch(/^10,0\s%$/) // contribution_pct range
    expect(formatPercent(0)).toMatch(/^0,0\s%$/)
  })

  it('uses a U+00A0 non-breaking space before "%", never a plain ASCII space or dot decimal', () => {
    expect(formatPercent(15.5)).toContain(NBSP) // separator is NBSP, proven by code-point
    expect(formatPercent(15.5)).not.toContain(' %') // not a plain ASCII space
    expect(formatPercent(15.5)).not.toContain('15.5%') // not dot-locale
    expect(formatPercent(15.5)).not.toContain('.')
  })

  it('renders an ASCII hyphen-minus for negative margins', () => {
    // margin_pct can be negative; ru-RU uses U+002D, not U+2212
    expect(formatPercent(-7.1)).toMatch(/^-7,1\s%$/)
  })

  it('returns an em dash for null (anti-pattern #8: a missing ratio is unknown, not 0)', () => {
    expect(formatPercent(null)).toBe('—')
  })
})

describe('getMarginColor (top-table-utils)', () => {
  it('maps margin thresholds to color classes (>=30 green, >=15 yellow, >=0 orange, <0 red)', () => {
    expect(getMarginColor(30)).toBe('text-green-600')
    expect(getMarginColor(15)).toBe('text-yellow-600')
    expect(getMarginColor(14.9)).toBe('text-orange-500')
    expect(getMarginColor(0)).toBe('text-orange-500')
    expect(getMarginColor(-0.1)).toBe('text-red-600')
  })

  it('returns a neutral gray class for null', () => {
    expect(getMarginColor(null)).toBe('text-gray-400')
  })
})
