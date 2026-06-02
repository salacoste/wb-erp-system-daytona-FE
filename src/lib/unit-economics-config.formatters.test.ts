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
import { formatPercentage } from './unit-economics-config'

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
