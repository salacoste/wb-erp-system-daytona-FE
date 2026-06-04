/**
 * Russian-locale guards for the two FBS-analytics percent formatters.
 *
 * Regression fix (2026-06-04): both rendered percents WITHOUT the mandatory NBSP before "%"
 * (`formatPercentValue` → "6,67%", `formatSeasonalIndex` → "72%"). The Russian-locale rule
 * requires "6,67 %" / "72 %" (comma decimal + U+00A0). Neither was caught by check:locale-percent
 * (that gate targets dot-locale `.toFixed(N)%`, not the NBSP-spacing facet), so they drifted
 * untested. These tests assert the NBSP is present and the old no-space form is gone.
 */

import { describe, it, expect } from 'vitest'
import { formatPercentValue, formatSeasonalIndex } from '../fbs-analytics-utils'

const NBSP = ' '

describe('formatPercentValue — Russian locale (0-100 input)', () => {
  it('inserts NBSP before "%" and uses comma decimal', () => {
    const out = formatPercentValue(6.67)
    expect(out).toBe(`6,67${NBSP}%`)
    expect(out).not.toMatch(/6,67%/) // old no-NBSP form must be gone
    expect(out).not.toMatch(/6\.67/) // never dot-locale
  })

  it('renders whole percents without a spurious trailing ",0" (min 0 decimals)', () => {
    expect(formatPercentValue(5)).toBe(`5${NBSP}%`)
  })

  it('keeps up to 2 decimals and renders 0 as "0 %"', () => {
    expect(formatPercentValue(5.78)).toBe(`5,78${NBSP}%`)
    expect(formatPercentValue(0)).toBe(`0${NBSP}%`)
  })
})

describe('formatSeasonalIndex — Russian locale (0-1 ratio input)', () => {
  it('converts ratio→whole percent with NBSP, no dot, no missing space', () => {
    const out = formatSeasonalIndex(0.72)
    expect(out).toBe(`72${NBSP}%`)
    expect(out).not.toMatch(/72%/) // old no-NBSP form must be gone
  })

  it('rounds half-up, matching the previous Math.round behaviour', () => {
    expect(formatSeasonalIndex(0.155)).toBe(`16${NBSP}%`) // 15.5 → 16
    expect(formatSeasonalIndex(0.15)).toBe(`15${NBSP}%`)
  })

  it('handles coefficient-of-variation > 1 (high seasonality)', () => {
    // backend seasonalityIndex = coefficientOfVariation, which can exceed 1
    expect(formatSeasonalIndex(1.2)).toBe(`120${NBSP}%`)
  })
})

describe('degenerate inputs (documented behaviour, not happy-path)', () => {
  it('renders negative and >100 percents for formatPercentValue', () => {
    expect(formatPercentValue(-5)).toBe(`-5${NBSP}%`)
    expect(formatPercentValue(150)).toBe(`150${NBSP}%`)
  })

  it('renders NaN as the ru-RU non-number label, never the JS "NaN%" string', () => {
    // 2026-06-04: the Intl percent path emits "не число %" (ru-RU label) for NaN. The two old
    // paths differed: `formatSeasonalIndex`'s `${Math.round(NaN)}%` emitted "NaN%", while
    // `formatPercentValue`'s `Intl.format(NaN)+'%'` emitted "не число%" (ru-RU label, still no
    // NBSP). Backend validates the field, so this is a defensive guard — locks the change, not
    // endorses NaN.
    expect(formatPercentValue(NaN)).not.toMatch(/NaN/)
    expect(formatSeasonalIndex(NaN)).not.toMatch(/NaN/)
    expect(formatPercentValue(NaN)).toContain('%')
  })
})
