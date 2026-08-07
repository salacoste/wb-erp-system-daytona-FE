/**
 * unit-economics-config formatters — Russian-locale pinning (iter-58)
 *
 * formatPercentage previously emitted "15.5%" (dot decimal, no separator), violating the
 * Russian-locale rule (frontend/CLAUDE.md: formatPercentage(15.5) → "15,5 %"). These tests pin
 * the comma decimal + space separator so the dot form cannot silently return. Per the
 * "regex for locale assertions" convention, assertions match the comma/space shape, not the
 * exact NBSP byte.
 */
import { describe, it, expect } from 'vitest'
import { formatPercentage, formatMargin, formatCurrency } from './unit-economics-formatters'

describe('unit-economics formatPercentage — Russian locale', () => {
  it('uses a comma decimal separator, not a dot', () => {
    const out = formatPercentage(15.5)
    expect(out).toMatch(/15,5/)
    expect(out).not.toMatch(/15\.5/)
  })

  it('renders a separated percent sign (not glued "15.5%")', () => {
    // ru-RU style:'percent' inserts a (non-breaking) space before % — \s matches NBSP too.
    expect(formatPercentage(15.5)).toMatch(/15,5\s%/)
  })

  it('formats whole numbers with one decimal place by default', () => {
    expect(formatPercentage(20)).toMatch(/20,0\s%/)
  })

  it('preserves the sign for negative margins', () => {
    const out = formatPercentage(-17.4)
    expect(out).toMatch(/17,4/)
    expect(out).toMatch(/^-|−/) // leading minus (ASCII or Unicode)
  })

  it('respects the decimals argument', () => {
    expect(formatPercentage(7.198, 2)).toMatch(/7,20\s%/)
  })
})

// iter-83: formatMargin migrated from `${sign}${marginPct.toFixed(1)}%` to the in-file
// formatPercentage. Pin the sign contract + locale so the dot form / a double-sign cannot return.
describe('unit-economics formatMargin — Russian locale + sign', () => {
  it('positive margin: leading + and comma+NBSP percent', () => {
    expect(formatMargin(15.5).text).toMatch(/^\+15,5\s%$/)
  })

  it('negative margin: Intl minus only, no double sign', () => {
    expect(formatMargin(-15.5).text).toMatch(/^[-−]15,5\s%$/)
    expect(formatMargin(-15.5).text).not.toMatch(/^[+\-−]{2}/) // no "+-"/"−−"
  })

  it('zero margin: no sign prefix', () => {
    expect(formatMargin(0).text).toMatch(/^0,0\s%$/)
  })
})

// Story 163.4-FE / FR8 (resolves iter-58): the canonical zero-vs-missing contract for the
// unit-economics whole-ruble formatter. Numeric 0 is a GENUINE measurement → "0 ₽";
// null/undefined/non-finite is MISSING → "—". Per the "regex for locale assertions" convention,
// match the ₽/digit/dash shape, not exact NBSP bytes.
describe('unit-economics formatCurrency — zero vs missing (Story 163.4-FE / FR8)', () => {
  it('renders a genuine numeric zero as "0 ₽", NOT "—" (iter-58 decision)', () => {
    const out = formatCurrency(0)
    expect(out).toMatch(/0/)
    expect(out).toMatch(/₽/)
    expect(out).not.toBe('—')
  })

  it('renders null as "—"', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('renders undefined as "—"', () => {
    expect(formatCurrency(undefined)).toBe('—')
  })

  it('renders NaN as "—"', () => {
    expect(formatCurrency(Number.NaN)).toBe('—')
  })

  it('renders +Infinity as "—"', () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('renders -Infinity as "—"', () => {
    expect(formatCurrency(Number.NEGATIVE_INFINITY)).toBe('—')
  })

  it('renders a positive finite value with whole-ruble grouping + ₽', () => {
    // 1234567 → "1 234 567 ₽" (ru-RU grouping, whole rubles, no fraction digits)
    const out = formatCurrency(1_234_567)
    expect(out).toMatch(/1.*234.*567/)
    expect(out).toMatch(/₽/)
    expect(out).not.toMatch(/\d[.,]\d/) // no fraction digits (whole-ruble design)
  })

  it('renders a negative finite value with a leading minus + ₽', () => {
    const out = formatCurrency(-500)
    expect(out).toMatch(/^-|−/)
    expect(out).toMatch(/500/)
    expect(out).toMatch(/₽/)
  })

  it('never returns "—" for a finite value, including a fractional one', () => {
    // fractional input is rounded to whole rubles (maximumFractionDigits:0), not masked
    expect(formatCurrency(0.49)).not.toBe('—')
    expect(formatCurrency(0.49)).toMatch(/₽/)
  })
})
