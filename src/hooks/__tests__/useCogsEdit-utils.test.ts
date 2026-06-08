/**
 * Tests for useCogsEdit-utils.ts
 * Pure-function coverage: hasCogsChanges, buildUpdatePayload, validateUnitCost, validateNotes
 */

import { describe, it, expect } from 'vitest'
import {
  hasCogsChanges,
  buildUpdatePayload,
  validateUnitCost,
  validateNotes,
} from '../useCogsEdit-utils'

// ---------------------------------------------------------------------------
// hasCogsChanges
// ---------------------------------------------------------------------------

describe('hasCogsChanges', () => {
  const original = { unit_cost_rub: 100, notes: 'original note' }

  it('returns true when unit_cost_rub changed', () => {
    expect(hasCogsChanges(original, { unit_cost_rub: 200, notes: 'original note' })).toBe(true)
  })

  it('returns true when notes changed', () => {
    expect(hasCogsChanges(original, { unit_cost_rub: 100, notes: 'new note' })).toBe(true)
  })

  it('returns true when original notes null and edited notes non-empty', () => {
    const orig = { unit_cost_rub: 100, notes: null as string | null }
    expect(hasCogsChanges(orig, { unit_cost_rub: 100, notes: 'added note' })).toBe(true)
  })

  it('returns false when nothing changed', () => {
    expect(hasCogsChanges(original, { unit_cost_rub: 100, notes: 'original note' })).toBe(false)
  })

  it('returns false when original notes null and edited notes empty', () => {
    const orig = { unit_cost_rub: 100, notes: null as string | null }
    expect(hasCogsChanges(orig, { unit_cost_rub: 100, notes: '' })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// buildUpdatePayload
// ---------------------------------------------------------------------------

describe('buildUpdatePayload', () => {
  const original = { unit_cost_rub: 100, notes: 'original note' }

  it('includes unit_cost_rub when changed', () => {
    const payload = buildUpdatePayload(original, { unit_cost_rub: 200, notes: 'original note' })
    expect(payload).toEqual({ unit_cost_rub: 200 })
  })

  it('includes notes when changed', () => {
    const payload = buildUpdatePayload(original, { unit_cost_rub: 100, notes: 'new note' })
    expect(payload).toEqual({ notes: 'new note' })
  })

  it('includes both fields when both changed', () => {
    const payload = buildUpdatePayload(original, { unit_cost_rub: 200, notes: 'new note' })
    expect(payload).toEqual({ unit_cost_rub: 200, notes: 'new note' })
  })

  it('returns empty object when nothing changed', () => {
    const payload = buildUpdatePayload(original, { unit_cost_rub: 100, notes: 'original note' })
    expect(payload).toEqual({})
  })

  it('handles null original notes with non-empty edited notes', () => {
    const orig = { unit_cost_rub: 100, notes: null as string | null }
    const payload = buildUpdatePayload(orig, { unit_cost_rub: 100, notes: 'added' })
    expect(payload).toEqual({ notes: 'added' })
  })
})

// ---------------------------------------------------------------------------
// validateUnitCost
// ---------------------------------------------------------------------------

describe('validateUnitCost', () => {
  it('returns error for empty string', () => {
    expect(validateUnitCost('')).toContain('обязательна')
  })

  it('returns error for whitespace only', () => {
    expect(validateUnitCost('   ')).toContain('обязательна')
  })

  it('returns error for non-numeric input', () => {
    expect(validateUnitCost('abc')).toContain('числовое значение')
  })

  it('returns error for zero', () => {
    expect(validateUnitCost('0')).toContain('положительным')
  })

  it('returns error for negative number', () => {
    expect(validateUnitCost('-5')).toContain('положительным')
  })

  it('returns null for valid positive number', () => {
    expect(validateUnitCost('100')).toBeNull()
  })

  it('returns null for decimal number', () => {
    expect(validateUnitCost('150.50')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validateNotes
// ---------------------------------------------------------------------------

describe('validateNotes', () => {
  it('returns null for short notes', () => {
    expect(validateNotes('short note')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(validateNotes('')).toBeNull()
  })

  it('returns error for notes exceeding 1000 characters', () => {
    const longNote = 'a'.repeat(1001)
    expect(validateNotes(longNote)).toContain('1000')
  })

  it('returns null for exactly 1000 characters', () => {
    const exactNote = 'a'.repeat(1000)
    expect(validateNotes(exactNote)).toBeNull()
  })
})
