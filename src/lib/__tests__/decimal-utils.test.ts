import { describe, expect, it } from 'vitest'
import { parseDecimal } from '@/lib/decimal-utils'

describe('parseDecimal', () => {
  it('parses Decimal-as-string from backend', () => {
    expect(parseDecimal('96000.0000')).toBe(96000)
    expect(parseDecimal('60.00')).toBe(60)
    expect(parseDecimal('40.00')).toBe(40)
    expect(parseDecimal('312.50')).toBe(312.5)
  })

  it('passes through numbers unchanged', () => {
    expect(parseDecimal(42)).toBe(42)
    expect(parseDecimal(0)).toBe(0)
    expect(parseDecimal(3.14)).toBe(3.14)
    expect(parseDecimal(-100)).toBe(-100)
  })

  it('returns 0 for null and undefined', () => {
    expect(parseDecimal(null)).toBe(0)
    expect(parseDecimal(undefined)).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(parseDecimal('')).toBe(0)
  })

  it('returns 0 for NaN and Infinity inputs', () => {
    expect(parseDecimal('NaN')).toBe(0)
    expect(parseDecimal(NaN)).toBe(0)
    expect(parseDecimal('not-a-number')).toBe(0)
    expect(parseDecimal(Infinity)).toBe(0)
    expect(parseDecimal(-Infinity)).toBe(0)
  })

  it('returns 0 for whitespace-only strings', () => {
    expect(parseDecimal('  ')).toBe(0)
    expect(parseDecimal('\t')).toBe(0)
  })

  it('handles zero as string', () => {
    expect(parseDecimal('0')).toBe(0)
    expect(parseDecimal('0.0000')).toBe(0)
  })

  it('handles negative Decimal strings', () => {
    expect(parseDecimal('-15625.0000')).toBe(-15625)
  })
})
