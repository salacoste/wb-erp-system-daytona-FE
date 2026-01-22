/**
 * Unit tests for form-utils.ts
 * Story 44.27-FE: Bug Fix - Empty Field Handling in Price Calculator
 *
 * Tests cover:
 * - parseNumericValue function
 * - numericFieldOptions factory function
 * - Edge cases: empty string, null, undefined, NaN, valid numbers
 */

import { describe, it, expect } from 'vitest'
import { parseNumericValue, numericFieldOptions } from '../form-utils'

// ============================================================================
// parseNumericValue Tests
// ============================================================================

describe('parseNumericValue', () => {
  describe('empty value handling', () => {
    it('converts empty string to 0', () => {
      expect(parseNumericValue('')).toBe(0)
    })

    it('converts null to 0', () => {
      expect(parseNumericValue(null)).toBe(0)
    })

    it('converts undefined to 0', () => {
      expect(parseNumericValue(undefined)).toBe(0)
    })
  })

  describe('string parsing', () => {
    it('parses valid integer string', () => {
      expect(parseNumericValue('42')).toBe(42)
    })

    it('parses valid decimal string', () => {
      expect(parseNumericValue('3.14')).toBe(3.14)
    })

    it('parses string with leading zeros', () => {
      expect(parseNumericValue('007')).toBe(7)
    })

    it('parses negative number string', () => {
      expect(parseNumericValue('-10')).toBe(-10)
    })

    it('converts invalid string to 0', () => {
      expect(parseNumericValue('abc')).toBe(0)
    })

    it('converts string with text prefix to 0', () => {
      expect(parseNumericValue('abc123')).toBe(0)
    })

    it('parses string with number prefix (parseFloat behavior)', () => {
      // parseFloat('123abc') returns 123
      expect(parseNumericValue('123abc')).toBe(123)
    })

    it('converts whitespace-only string to 0', () => {
      expect(parseNumericValue('   ')).toBe(0)
    })
  })

  describe('number passthrough', () => {
    it('passes through positive integer', () => {
      expect(parseNumericValue(42)).toBe(42)
    })

    it('passes through positive decimal', () => {
      expect(parseNumericValue(3.14159)).toBe(3.14159)
    })

    it('passes through zero', () => {
      expect(parseNumericValue(0)).toBe(0)
    })

    it('passes through negative number', () => {
      expect(parseNumericValue(-100)).toBe(-100)
    })

    it('converts NaN to 0', () => {
      expect(parseNumericValue(NaN)).toBe(0)
    })

    it('passes through Infinity', () => {
      expect(parseNumericValue(Infinity)).toBe(Infinity)
    })

    it('passes through negative Infinity', () => {
      expect(parseNumericValue(-Infinity)).toBe(-Infinity)
    })
  })

  describe('edge cases', () => {
    it('handles very large numbers', () => {
      expect(parseNumericValue('999999999999')).toBe(999999999999)
    })

    it('handles very small decimals', () => {
      expect(parseNumericValue('0.0001')).toBe(0.0001)
    })

    it('handles scientific notation string', () => {
      expect(parseNumericValue('1e5')).toBe(100000)
    })

    it('handles number with trailing whitespace', () => {
      expect(parseNumericValue('42 ')).toBe(42)
    })

    it('handles number with leading whitespace', () => {
      expect(parseNumericValue(' 42')).toBe(42)
    })
  })
})

// ============================================================================
// numericFieldOptions Tests
// ============================================================================

describe('numericFieldOptions', () => {
  it('returns object with valueAsNumber: true', () => {
    const options = numericFieldOptions()
    expect(options.valueAsNumber).toBe(true)
  })

  it('returns object with setValueAs function', () => {
    const options = numericFieldOptions()
    expect(typeof options.setValueAs).toBe('function')
  })

  it('setValueAs converts empty string to 0', () => {
    const options = numericFieldOptions()
    expect(options.setValueAs?.('')).toBe(0)
  })

  it('setValueAs converts valid number string', () => {
    const options = numericFieldOptions()
    expect(options.setValueAs?.('100')).toBe(100)
  })

  it('merges additional options', () => {
    const options = numericFieldOptions({
      required: 'This field is required',
      min: { value: 0, message: 'Must be positive' },
    })

    expect(options.valueAsNumber).toBe(true)
    expect(options.setValueAs).toBeDefined()
    expect(options.required).toBe('This field is required')
    expect(options.min).toEqual({ value: 0, message: 'Must be positive' })
  })

  it('preserves onChange callback', () => {
    const mockOnChange = (): void => {
      // mock callback
    }
    const options = numericFieldOptions({
      onChange: mockOnChange,
    })

    expect(options.onChange).toBe(mockOnChange)
  })

  it('preserves max validation', () => {
    const options = numericFieldOptions({
      max: { value: 300, message: 'Max 300' },
    })

    expect(options.max).toEqual({ value: 300, message: 'Max 300' })
  })

  it('works with empty options object', () => {
    const options = numericFieldOptions({})
    expect(options.valueAsNumber).toBe(true)
    expect(options.setValueAs).toBeDefined()
  })
})

// ============================================================================
// Integration Tests - Simulating Form Scenarios
// ============================================================================

describe('Form Integration Scenarios', () => {
  it('handles user clearing a field (typical bug scenario)', () => {
    const options = numericFieldOptions({
      required: 'Required',
      min: { value: 0, message: 'Min 0' },
    })

    // User types 500, then selects all and deletes
    // Input becomes empty string ""
    const result = options.setValueAs?.('')
    expect(result).toBe(0)
    expect(typeof result).toBe('number')
  })

  it('handles user typing valid COGS value', () => {
    const options = numericFieldOptions({
      required: 'COGS required',
      min: { value: 0, message: 'Cannot be negative' },
    })

    expect(options.setValueAs?.('500.50')).toBe(500.5)
  })

  it('handles dimension field with max constraint', () => {
    const options = numericFieldOptions({
      min: { value: 0, message: 'Min 0' },
      max: { value: 300, message: 'Max 300 cm' },
    })

    expect(options.setValueAs?.('150')).toBe(150)
    expect(options.setValueAs?.('')).toBe(0)
  })

  it('handles storage field (optional, can be 0)', () => {
    const options = numericFieldOptions({
      min: { value: 0, message: 'Cannot be negative' },
    })

    // Storage is optional, empty is valid as 0
    expect(options.setValueAs?.('')).toBe(0)
    expect(options.setValueAs?.('0')).toBe(0)
    expect(options.setValueAs?.('25.99')).toBe(25.99)
  })

  it('prevents NaN from propagating to calculations', () => {
    const options = numericFieldOptions()

    // Various ways NaN could be introduced
    const scenarios = ['', null, undefined, 'abc', NaN]

    scenarios.forEach((input) => {
      const result = options.setValueAs?.(input as string)
      expect(result).toBe(0)
      expect(isNaN(result as number)).toBe(false)
    })
  })
})
