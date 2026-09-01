/**
 * Russian-locale guard for roi-profit-utils.formatROI, plus boundary coverage for getROIColor and
 * calculateROI (no prior dedicated test existed for this module).
 *
 * iter-70 (dot-locale percent consolidation — see
 * docs/process/dot-locale-percent-consolidation-proposal.md): formatROI rendered the dot-locale
 * form ("15.5%") — no comma decimal, no NBSP. It now delegates to the canonical formatPercentage(
 * x, 1) in @/lib/utils ("15,5 %" — comma + U+00A0). `\s` is a convenience match that tolerates
 * either separator; the NBSP separator identity is proven EXCLUSIVELY by the `.toContain(NBSP)`
 * code-point assertion below.
 */

import { describe, it, expect } from 'vitest'
import { formatROI, getROIColor, calculateROI } from './roi-profit-utils'

const NBSP = String.fromCharCode(0xa0)

describe('formatROI', () => {
  it('renders comma decimal + a NBSP-separated "%" (Russian locale), fixed 1 decimal', () => {
    expect(formatROI(15.5)).toMatch(/^15,5\s%$/)
    expect(formatROI(120)).toMatch(/^120,0\s%$/) // ROI can exceed 100%
    expect(formatROI(0)).toMatch(/^0,0\s%$/)
    expect(formatROI(15.5)).toContain(NBSP) // separator is NBSP, proven by code-point
  })

  it('never renders the dot-locale form', () => {
    expect(formatROI(15.5)).not.toContain('15.5%')
    expect(formatROI(15.5)).not.toContain('.')
    expect(formatROI(15.5)).not.toContain(' %') // not a plain ASCII space
  })

  it('renders an ASCII hyphen-minus for negative ROI', () => {
    // calculateROI can be negative (loss); ru-RU uses U+002D, not U+2212
    expect(formatROI(-33.3)).toMatch(/^-33,3\s%$/)
  })

  it('returns an em dash for null/undefined (anti-pattern #8: a missing ROI is unknown, not 0)', () => {
    expect(formatROI(null)).toBe('—')
    expect(formatROI(undefined)).toBe('—')
  })
})

describe('getROIColor', () => {
  it('maps ROI thresholds to color classes (>=100 / >=50 / >=20 / >=0 / <0)', () => {
    expect(getROIColor(100)).toBe('text-foreground')
    expect(getROIColor(99)).toBe('text-foreground')
    expect(getROIColor(50)).toBe('text-foreground')
    expect(getROIColor(49)).toBe('text-foreground')
    expect(getROIColor(20)).toBe('text-foreground')
    expect(getROIColor(19)).toBe('text-foreground')
    expect(getROIColor(0)).toBe('text-foreground')
    expect(getROIColor(-0.1)).toBe('text-foreground')
  })

  it('returns a neutral gray class for null/undefined', () => {
    expect(getROIColor(null)).toBe('text-muted-foreground')
    expect(getROIColor(undefined)).toBe('text-muted-foreground')
  })
})

describe('calculateROI', () => {
  it('returns (profit / cogs) * 100 in percent-units', () => {
    expect(calculateROI(50, 200)).toBe(25)
    expect(calculateROI(-20, 100)).toBe(-20)
  })

  it('returns null when cogs is 0 or any input is null/undefined', () => {
    expect(calculateROI(50, 0)).toBeNull()
    expect(calculateROI(null, 100)).toBeNull()
    expect(calculateROI(50, undefined)).toBeNull()
  })
})
