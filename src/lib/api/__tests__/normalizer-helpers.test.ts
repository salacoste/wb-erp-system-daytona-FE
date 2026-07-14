import { describe, expect, it } from 'vitest'

import {
  asRecord,
  toCount,
  toDecimalNumber,
  toNullableNumber,
  toOptionalString,
  toStr,
  toStringOrNull,
} from '@/lib/api/normalizer-helpers'

describe('normalizer-helpers', () => {
  // --- toCount ---
  describe('toCount', () => {
    it('returns number for valid number', () => expect(toCount(42)).toBe(42))
    it('returns 0 for null', () => expect(toCount(null)).toBe(0))
    it('returns 0 for undefined', () => expect(toCount(undefined)).toBe(0))
    it('coerces string number', () => expect(toCount('7')).toBe(7))
    it('returns 0 for NaN', () => expect(toCount('not-a-number')).toBe(0))
    it('returns 0 for Infinity', () => expect(toCount(Infinity)).toBe(0))
    it('returns 0 for -Infinity', () => expect(toCount(-Infinity)).toBe(0))
    it('coerces boolean true to 1', () => expect(toCount(true)).toBe(1))
    it('returns 0 for object', () => expect(toCount({})).toBe(0))
    it('coerces boolean false to 0', () => expect(toCount(false)).toBe(0))
  })

  // --- toNullableNumber ---
  describe('toNullableNumber', () => {
    it('returns number for valid number', () => expect(toNullableNumber(42)).toBe(42))
    it('returns null for null', () => expect(toNullableNumber(null)).toBeNull())
    it('returns null for undefined', () => expect(toNullableNumber(undefined)).toBeNull())
    it('coerces string number', () => expect(toNullableNumber('3.14')).toBeCloseTo(3.14))
    it('returns null for non-numeric string', () => expect(toNullableNumber('abc')).toBeNull())
    it('returns null for NaN', () => expect(toNullableNumber(NaN)).toBeNull())
    it('returns null for Infinity', () => expect(toNullableNumber(Infinity)).toBeNull())
    it('handles 0 correctly', () => expect(toNullableNumber(0)).toBe(0))
    it('handles negative number', () => expect(toNullableNumber(-5)).toBe(-5))
  })

  // --- toStringOrNull ---
  describe('toStringOrNull', () => {
    it('returns string for string', () => expect(toStringOrNull('hello')).toBe('hello'))
    it('returns null for null', () => expect(toStringOrNull(null)).toBeNull())
    it('returns null for undefined', () => expect(toStringOrNull(undefined)).toBeNull())
    it('returns null for number', () => expect(toStringOrNull(42)).toBeNull())
    it('returns null for object', () => expect(toStringOrNull({})).toBeNull())
    it('returns empty string for empty string', () => expect(toStringOrNull('')).toBe(''))
  })

  // --- toOptionalString ---
  describe('toOptionalString', () => {
    it('returns string for string', () => expect(toOptionalString('hi')).toBe('hi'))
    it('returns undefined for null', () => expect(toOptionalString(null)).toBeUndefined())
    it('returns undefined for undefined', () => expect(toOptionalString(undefined)).toBeUndefined())
    it('returns undefined for number', () => expect(toOptionalString(42)).toBeUndefined())
  })

  // --- toStr ---
  describe('toStr', () => {
    it('returns string for string', () => expect(toStr('hello')).toBe('hello'))
    it('returns empty string for null', () => expect(toStr(null)).toBe(''))
    it('returns empty string for undefined', () => expect(toStr(undefined)).toBe(''))
    it('returns empty string for number', () => expect(toStr(42)).toBe(''))
    it('returns empty string for object', () => expect(toStr({})).toBe(''))
    it('returns empty string for empty string', () => expect(toStr('')).toBe(''))
  })

  // --- asRecord ---
  describe('asRecord', () => {
    it('returns object for plain object', () => {
      expect(asRecord({ a: 1 })).toEqual({ a: 1 })
    })
    it('returns empty for null', () => expect(asRecord(null)).toEqual({}))
    it('returns empty for undefined', () => expect(asRecord(undefined)).toEqual({}))
    it('returns empty for string', () => expect(asRecord('str')).toEqual({}))
    it('returns empty for number', () => expect(asRecord(42)).toEqual({}))
    it('returns array as Record (arrays are objects)', () => {
      const result = asRecord([1, 2])
      expect(result[0]).toBe(1)
      expect(result[1]).toBe(2)
    })
  })

  // --- toDecimalNumber ---
  describe('toDecimalNumber', () => {
    // decimal.js-verified samples (Prisma Decimal serialization: {s,e,d}).
    it('decodes the real backend sample {s:1,e:4,d:[28765,3100000]} → 28765.31', () => {
      expect(toDecimalNumber({ s: 1, e: 4, d: [28765, 3100000] })).toBe(28765.31)
    })
    it('decodes a fractional decimal {s:1,e:4,d:[28765,310000]} → 28765.031', () => {
      expect(toDecimalNumber({ s: 1, e: 4, d: [28765, 310000] })).toBeCloseTo(28765.031, 3)
    })
    it('returns null for null', () => expect(toDecimalNumber(null)).toBeNull())
    it('returns null for undefined', () => expect(toDecimalNumber(undefined)).toBeNull())
    it('passes a number through', () => expect(toDecimalNumber(5)).toBe(5))
    it('parses a numeric string "12.5" → 12.5', () => expect(toDecimalNumber('12.5')).toBe(12.5))
    it('returns null for a non-numeric string', () => expect(toDecimalNumber('abc')).toBeNull())
    it('returns null for NaN number', () => expect(toDecimalNumber(NaN)).toBeNull())
    it('decodes a negative integer {s:-1,e:0,d:[5]} → -5', () => {
      expect(toDecimalNumber({ s: -1, e: 0, d: [5] })).toBe(-5)
    })
    it('decodes a small fraction {s:1,e:-2,d:[500000]} → 0.05', () => {
      expect(toDecimalNumber({ s: 1, e: -2, d: [500000] })).toBeCloseTo(0.05, 2)
    })
    it('decodes a pure integer {s:1,e:3,d:[1000]} → 1000', () => {
      expect(toDecimalNumber({ s: 1, e: 3, d: [1000] })).toBe(1000)
    })
    it('decodes a large integer across digit groups {s:1,e:14,d:[1,2345678,9012345]}', () => {
      expect(toDecimalNumber({ s: 1, e: 14, d: [1, 2345678, 9012345] })).toBe(123456789012345)
    })
    it('decodes pi {s:1,e:0,d:[3,1415900]} → 3.14159', () => {
      expect(toDecimalNumber({ s: 1, e: 0, d: [3, 1415900] })).toBeCloseTo(3.14159, 5)
    })
    it('returns null for a malformed {s,e,d} (non-array d)', () =>
      expect(toDecimalNumber({ s: 1, e: 4, d: 'x' })).toBeNull())
    it('returns null for a malformed {s,e,d} (non-number e)', () =>
      expect(toDecimalNumber({ s: 1, e: '4', d: [28765] })).toBeNull())
    it('returns null for a malformed {s,e,d} (negative digit group)', () =>
      expect(toDecimalNumber({ s: 1, e: 4, d: [-5] })).toBeNull())
    it('returns null for an unrelated object', () =>
      expect(toDecimalNumber({ foo: 'bar' })).toBeNull())
  })
})
