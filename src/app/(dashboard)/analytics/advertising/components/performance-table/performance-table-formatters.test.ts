/**
 * performance-table-formatters — ROI magnitude + Russian-locale pinning (iter-61)
 *
 * `roi`/`ctr`/`organic_contribution` are ALREADY in percent units (0-100±). The old
 * formatPercent did `value * 100` → rendered ROI 100× too large ("-13667.0%"); formatPercentRaw
 * used dot-locale. These tests pin the corrected magnitude (NO 100× inflation) AND Russian locale
 * (comma decimal + separator). Per convention, locale assertions match the comma/space shape.
 */
import { describe, it, expect } from 'vitest'
import { formatPercent, formatPercentRaw } from './performance-table-formatters'

describe('formatPercent (ROI) — no 100× inflation + Russian locale', () => {
  it('renders a percent-unit ROI at correct magnitude (NOT ×100)', () => {
    const out = formatPercent(-136.67)
    expect(out).toMatch(/136,7/) // -136,7 % — the real magnitude
    expect(out).not.toMatch(/13667/) // the old ×100 bug
  })

  it('uses comma decimal + separated percent sign, not "101.4%"', () => {
    const out = formatPercent(101.43)
    expect(out).toMatch(/101,4\s%/)
    expect(out).not.toMatch(/101\.4/)
  })

  it('preserves the sign for negative ROI', () => {
    expect(formatPercent(-19.4)).toMatch(/^-|−/)
  })
})

describe('formatPercentRaw (CTR / organic) — Russian locale, 2 decimals', () => {
  it('renders ctr at correct magnitude with comma decimal (not "11.42%")', () => {
    const out = formatPercentRaw(11.42)
    expect(out).toMatch(/11,42\s%/)
    expect(out).not.toMatch(/11\.42/)
    expect(out).not.toMatch(/1142/) // no ×100 inflation
  })

  it('renders organic_contribution percent in locale', () => {
    expect(formatPercentRaw(94.61)).toMatch(/94,61\s%/)
  })
})
