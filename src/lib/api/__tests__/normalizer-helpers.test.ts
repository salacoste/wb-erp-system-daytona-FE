import { describe, expect, it } from 'vitest'

import {
  asRecord,
  toCount,
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
})
