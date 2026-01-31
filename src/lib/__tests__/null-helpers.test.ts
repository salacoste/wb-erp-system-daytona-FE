/**
 * TDD Tests for Null Helpers
 * Story: null vs undefined Standardization
 *
 * Tests verify utility functions for handling null values consistently.
 * Standard: Use `null` for missing data, NOT `undefined`.
 *
 * @see CLAUDE.md - Business Logic section
 */

import { describe, it, expect } from 'vitest'

// Functions to be implemented - tests should fail initially (TDD RED phase)
import { isNullish, coerceToNull, isStrictlyNull, assertNullNotUndefined } from '../null-helpers'

// =============================================================================
// isNullish Tests
// =============================================================================

describe('isNullish', () => {
  describe('truthy cases - should return true', () => {
    it('returns true for null', () => {
      expect(isNullish(null)).toBe(true)
    })

    it('returns true for undefined', () => {
      expect(isNullish(undefined)).toBe(true)
    })
  })

  describe('falsy cases - should return false', () => {
    it('returns false for 0 (zero is a valid value)', () => {
      expect(isNullish(0)).toBe(false)
    })

    it('returns false for empty string (empty string is a valid value)', () => {
      expect(isNullish('')).toBe(false)
    })

    it('returns false for false boolean', () => {
      expect(isNullish(false)).toBe(false)
    })

    it('returns false for NaN (NaN is a value, use isNaN to check)', () => {
      expect(isNullish(NaN)).toBe(false)
    })

    it('returns false for positive number', () => {
      expect(isNullish(42)).toBe(false)
    })

    it('returns false for negative number', () => {
      expect(isNullish(-1)).toBe(false)
    })

    it('returns false for non-empty string', () => {
      expect(isNullish('hello')).toBe(false)
    })

    it('returns false for empty array', () => {
      expect(isNullish([])).toBe(false)
    })

    it('returns false for empty object', () => {
      expect(isNullish({})).toBe(false)
    })
  })
})

// =============================================================================
// coerceToNull Tests
// =============================================================================

describe('coerceToNull', () => {
  describe('converts undefined to null', () => {
    it('converts undefined to null', () => {
      expect(coerceToNull(undefined)).toBeNull()
    })

    it('keeps null as null', () => {
      expect(coerceToNull(null)).toBeNull()
    })
  })

  describe('preserves valid values', () => {
    it('preserves 0', () => {
      expect(coerceToNull(0)).toBe(0)
    })

    it('preserves empty string', () => {
      expect(coerceToNull('')).toBe('')
    })

    it('preserves false', () => {
      expect(coerceToNull(false)).toBe(false)
    })

    it('preserves positive numbers', () => {
      expect(coerceToNull(42)).toBe(42)
    })

    it('preserves negative numbers', () => {
      expect(coerceToNull(-100)).toBe(-100)
    })

    it('preserves strings', () => {
      expect(coerceToNull('test')).toBe('test')
    })

    it('preserves objects', () => {
      const obj = { key: 'value' }
      expect(coerceToNull(obj)).toBe(obj)
    })

    it('preserves arrays', () => {
      const arr = [1, 2, 3]
      expect(coerceToNull(arr)).toBe(arr)
    })
  })

  describe('type safety', () => {
    it('returns correct type for number input', () => {
      const result: number | null = coerceToNull<number>(42)
      expect(result).toBe(42)
    })

    it('returns correct type for string input', () => {
      const result: string | null = coerceToNull<string>('test')
      expect(result).toBe('test')
    })

    it('returns null for undefined with correct type', () => {
      const result: number | null = coerceToNull<number>(undefined)
      expect(result).toBeNull()
    })
  })
})

// =============================================================================
// isStrictlyNull Tests
// =============================================================================

describe('isStrictlyNull', () => {
  it('returns true only for null', () => {
    expect(isStrictlyNull(null)).toBe(true)
  })

  it('returns false for undefined (strict null check)', () => {
    expect(isStrictlyNull(undefined)).toBe(false)
  })

  it('returns false for 0', () => {
    expect(isStrictlyNull(0)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isStrictlyNull('')).toBe(false)
  })

  it('returns false for false', () => {
    expect(isStrictlyNull(false)).toBe(false)
  })
})

// =============================================================================
// assertNullNotUndefined Tests
// =============================================================================

describe('assertNullNotUndefined', () => {
  describe('does not throw for valid inputs', () => {
    it('does not throw for null', () => {
      expect(() => assertNullNotUndefined(null, 'testField')).not.toThrow()
    })

    it('does not throw for 0', () => {
      expect(() => assertNullNotUndefined(0, 'testField')).not.toThrow()
    })

    it('does not throw for empty string', () => {
      expect(() => assertNullNotUndefined('', 'testField')).not.toThrow()
    })

    it('does not throw for false', () => {
      expect(() => assertNullNotUndefined(false, 'testField')).not.toThrow()
    })

    it('does not throw for valid values', () => {
      expect(() => assertNullNotUndefined(42, 'testField')).not.toThrow()
      expect(() => assertNullNotUndefined('test', 'testField')).not.toThrow()
      expect(() => assertNullNotUndefined({}, 'testField')).not.toThrow()
    })
  })

  describe('throws for undefined', () => {
    it('throws Error for undefined value', () => {
      expect(() => assertNullNotUndefined(undefined, 'testField')).toThrow()
    })

    it('throws with descriptive error message including field name', () => {
      expect(() => assertNullNotUndefined(undefined, 'ordersAmount')).toThrow(
        /ordersAmount.*undefined|undefined.*ordersAmount/i
      )
    })

    it('throws with suggestion to use null', () => {
      expect(() => assertNullNotUndefined(undefined, 'testField')).toThrow(/null/i)
    })
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  describe('nested objects with null/undefined values', () => {
    it('isNullish correctly identifies null in nested check', () => {
      const data = { nested: { value: null } }
      expect(isNullish(data.nested.value)).toBe(true)
    })

    it('coerceToNull works with optional chaining result', () => {
      const data: { nested?: { value?: number } } = {}
      // data.nested?.value is undefined
      const result = coerceToNull(data.nested?.value)
      expect(result).toBeNull()
    })
  })

  describe('array element handling', () => {
    it('coerceToNull handles sparse array element', () => {
      // eslint-disable-next-line no-sparse-arrays
      const arr = [1, , 3] // arr[1] is undefined
      expect(coerceToNull(arr[1])).toBeNull()
    })

    it('coerceToNull handles out-of-bounds array access', () => {
      const arr = [1, 2, 3]
      expect(coerceToNull(arr[10])).toBeNull()
    })
  })

  describe('function return value handling', () => {
    it('coerceToNull handles function returning undefined', () => {
      const fn = (): number | undefined => undefined
      expect(coerceToNull(fn())).toBeNull()
    })

    it('coerceToNull handles function returning null', () => {
      const fn = (): number | null => null
      expect(coerceToNull(fn())).toBeNull()
    })
  })
})
