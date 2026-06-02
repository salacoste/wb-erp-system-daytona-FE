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

  // iter-65 (request #193): the live backend serializes Prisma DECIMAL as Decimal.js INTERNAL
  // objects {s,e,d} instead of strings. Reconstruct the real value (was parseFloat({…})→NaN→0,
  // which silently fabricated 0 across box-type dimensions + shipment costs).
  describe('Decimal.js {s,e,d} object reconstruction', () => {
    it('reconstructs whole numbers (live box-type + shipment values)', () => {
      expect(parseDecimal({ s: 1, e: 1, d: [70] })).toBe(70)
      expect(parseDecimal({ s: 1, e: 3, d: [5000] })).toBe(5000)
    })

    it('reconstructs fractional values across digit groups', () => {
      // 708.3333 (finalCostPerUnit) and 208.3333 (deliveryCostPerUnit) — observed live.
      expect(parseDecimal({ s: 1, e: 2, d: [708, 3333000] })).toBeCloseTo(708.3333, 4)
      expect(parseDecimal({ s: 1, e: 2, d: [208, 3333000] })).toBeCloseTo(208.3333, 4)
    })

    it('honours the sign', () => {
      expect(parseDecimal({ s: -1, e: 3, d: [5000] })).toBe(-5000)
    })

    it('reconstructs a sub-1 fraction (negative exponent)', () => {
      expect(parseDecimal({ s: 1, e: -2, d: [500000] })).toBeCloseTo(0.05, 10)
    })

    it('reconstructs a value with an internal zero digit-group', () => {
      // padStart(7) on the middle "0" group must not corrupt the magnitude.
      expect(parseDecimal({ s: 1, e: 7, d: [1, 0, 1] })).toBeCloseTo(10000000.0000001, 6)
    })

    it('reconstructs a large multi-group integer without precision loss', () => {
      expect(parseDecimal({ s: 1, e: 14, d: [1, 2345678, 9012345] })).toBe(123456789012345)
    })

    it('handles zero (d:[0]); empty d:[] is defensive only — decimal.js never emits it', () => {
      expect(parseDecimal({ s: 1, e: 0, d: [0] })).toBe(0)
      expect(parseDecimal({ s: 1, e: 0, d: [] })).toBe(0)
    })

    it('rejects a malformed digit array (non-numeric groups) → 0, not a corrupt number', () => {
      // isDecimalObject requires numeric groups; a garbage object must not reconstruct to junk.
      expect(parseDecimal({ s: 1, e: 1, d: ['x'] } as unknown as string)).toBe(0)
    })

    it('does NOT fabricate 0 from a real Decimal object (regression: was parseFloat→NaN→0)', () => {
      // The exact bug: a truthy object whose real value is non-zero must NOT render as 0.
      expect(parseDecimal({ s: 1, e: 1, d: [70] })).not.toBe(0)
    })
  })
})
