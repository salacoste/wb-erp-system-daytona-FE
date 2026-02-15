/**
 * Unit tests for useCogsEdit hook helpers
 * Story 5.2-fe: COGS Edit Dialog
 *
 * Tests validation functions and helper utilities:
 * - hasCogsChanges: Change detection logic
 * - buildUpdatePayload: Payload construction
 * - validateUnitCost: Cost validation
 * - validateNotes: Notes validation
 */

import { describe, it, expect } from 'vitest'
import {
  hasCogsChanges,
  buildUpdatePayload,
  validateUnitCost,
  validateNotes,
} from './useCogsEdit'

describe('validateUnitCost', () => {
  it('should return null for valid positive number', () => {
    expect(validateUnitCost('100')).toBeNull()
    expect(validateUnitCost('100.50')).toBeNull()
    expect(validateUnitCost('0.01')).toBeNull()
  })

  it('should return error for empty value', () => {
    expect(validateUnitCost('')).toBe('Себестоимость обязательна для заполнения')
    expect(validateUnitCost('   ')).toBe('Себестоимость обязательна для заполнения')
  })

  it('should return error for non-numeric value', () => {
    expect(validateUnitCost('abc')).toBe('Введите числовое значение')
    expect(validateUnitCost('12abc')).toBe('Введите числовое значение')
  })

  it('should return error for zero', () => {
    expect(validateUnitCost('0')).toBe('Себестоимость должна быть положительным числом')
  })

  it('should return error for negative number', () => {
    expect(validateUnitCost('-100')).toBe('Себестоимость должна быть положительным числом')
    expect(validateUnitCost('-0.01')).toBe('Себестоимость должна быть положительным числом')
  })

  it('should handle decimal values', () => {
    expect(validateUnitCost('123.456')).toBeNull()
    expect(validateUnitCost('0.001')).toBeNull()
  })

  it('should handle large numbers', () => {
    expect(validateUnitCost('999999999.99')).toBeNull()
  })
})

describe('validateNotes', () => {
  it('should return null for valid notes', () => {
    expect(validateNotes('')).toBeNull()
    expect(validateNotes('Short note')).toBeNull()
    expect(validateNotes('A'.repeat(1000))).toBeNull()
  })

  it('should return error for notes exceeding 1000 characters', () => {
    expect(validateNotes('A'.repeat(1001))).toBe('Максимум 1000 символов')
    expect(validateNotes('A'.repeat(2000))).toBe('Максимум 1000 символов')
  })

  it('should handle exactly 1000 characters', () => {
    expect(validateNotes('A'.repeat(1000))).toBeNull()
  })
})

describe('hasCogsChanges', () => {
  describe('cost changes', () => {
    it('should detect cost change', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: null },
        { unit_cost_rub: 150, notes: '' }
      )
      expect(result).toBe(true)
    })

    it('should detect no change when cost is same', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: null },
        { unit_cost_rub: 100, notes: '' }
      )
      expect(result).toBe(false)
    })

    it('should detect small decimal change', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100.50, notes: null },
        { unit_cost_rub: 100.51, notes: '' }
      )
      expect(result).toBe(true)
    })
  })

  describe('notes changes', () => {
    it('should detect notes added', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: null },
        { unit_cost_rub: 100, notes: 'New note' }
      )
      expect(result).toBe(true)
    })

    it('should detect notes changed', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: 'Old note' },
        { unit_cost_rub: 100, notes: 'New note' }
      )
      expect(result).toBe(true)
    })

    it('should detect notes removed', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: 'Old note' },
        { unit_cost_rub: 100, notes: '' }
      )
      expect(result).toBe(true)
    })

    it('should treat null and empty string as equivalent', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: null },
        { unit_cost_rub: 100, notes: '' }
      )
      expect(result).toBe(false)
    })
  })

  describe('both changes', () => {
    it('should detect when both cost and notes changed', () => {
      const result = hasCogsChanges(
        { unit_cost_rub: 100, notes: 'Old' },
        { unit_cost_rub: 200, notes: 'New' }
      )
      expect(result).toBe(true)
    })
  })
})

describe('buildUpdatePayload', () => {
  it('should include only changed cost', () => {
    const result = buildUpdatePayload(
      { unit_cost_rub: 100, notes: null },
      { unit_cost_rub: 150, notes: '' }
    )
    expect(result).toEqual({ unit_cost_rub: 150 })
    expect(result.notes).toBeUndefined()
  })

  it('should include only changed notes', () => {
    const result = buildUpdatePayload(
      { unit_cost_rub: 100, notes: null },
      { unit_cost_rub: 100, notes: 'New note' }
    )
    expect(result).toEqual({ notes: 'New note' })
    expect(result.unit_cost_rub).toBeUndefined()
  })

  it('should include both when both changed', () => {
    const result = buildUpdatePayload(
      { unit_cost_rub: 100, notes: 'Old' },
      { unit_cost_rub: 200, notes: 'New' }
    )
    expect(result).toEqual({ unit_cost_rub: 200, notes: 'New' })
  })

  it('should return empty object when nothing changed', () => {
    const result = buildUpdatePayload(
      { unit_cost_rub: 100, notes: null },
      { unit_cost_rub: 100, notes: '' }
    )
    expect(result).toEqual({})
  })

  it('should include notes when changed from null to text', () => {
    const result = buildUpdatePayload(
      { unit_cost_rub: 100, notes: null },
      { unit_cost_rub: 100, notes: 'Added note' }
    )
    expect(result).toEqual({ notes: 'Added note' })
  })

  it('should include notes when changed from text to empty', () => {
    const result = buildUpdatePayload(
      { unit_cost_rub: 100, notes: 'Old note' },
      { unit_cost_rub: 100, notes: '' }
    )
    expect(result).toEqual({ notes: '' })
  })
})
