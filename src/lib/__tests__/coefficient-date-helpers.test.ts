/**
 * Unit tests for coefficient-date-helpers
 * Stories 44.9-FE, 44.26a-FE
 */

import { describe, it, expect } from 'vitest'
import {
  formatCoefficient,
  formatCoefficientDate,
  getDayFromDate,
  isToday,
  formatDateLongRu,
  getTomorrowDate,
  getFirstAvailableDate,
} from '../coefficient-date-helpers'
import type { NormalizedCoefficient } from '../coefficient-types'

// ============================================================================
// formatCoefficient
// ============================================================================

describe('formatCoefficient', () => {
  it('formats standard coefficient with 2 decimal places', () => {
    expect(formatCoefficient(1.25)).toBe('1,25')
  })

  it('formats whole number coefficient', () => {
    expect(formatCoefficient(1)).toBe('1,00')
  })

  it('formats zero coefficient', () => {
    expect(formatCoefficient(0)).toBe('0,00')
  })

  it('formats high coefficient', () => {
    expect(formatCoefficient(2.75)).toBe('2,75')
  })

  it('formats coefficient with many decimals', () => {
    expect(formatCoefficient(1.256)).toBe('1,26')
  })
})

// ============================================================================
// formatCoefficientDate
// ============================================================================

describe('formatCoefficientDate', () => {
  it('formats ISO date string in Russian locale', () => {
    const result = formatCoefficientDate('2026-01-20')
    expect(result).toContain('20')
  })
})

// ============================================================================
// getDayFromDate
// ============================================================================

describe('getDayFromDate', () => {
  it('returns correct day of month', () => {
    expect(getDayFromDate('2026-01-15')).toBe(15)
  })

  it('returns 1 for first day of month', () => {
    expect(getDayFromDate('2026-03-01')).toBe(1)
  })

  it('returns 31 for last day of January', () => {
    expect(getDayFromDate('2026-01-31')).toBe(31)
  })
})

// ============================================================================
// isToday
// ============================================================================

describe('isToday', () => {
  it('returns true when date string matches today', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(isToday(today)).toBe(true)
  })

  it('returns false for a different date', () => {
    expect(isToday('2020-01-01')).toBe(false)
  })
})

// ============================================================================
// formatDateLongRu
// ============================================================================

describe('formatDateLongRu', () => {
  it('formats date in long Russian format', () => {
    const result = formatDateLongRu('2026-01-21')
    // Russian locale: day month year
    expect(result).toMatch(/21/)
    expect(result).toMatch(/2026/)
  })

  it('formats first day of year', () => {
    const result = formatDateLongRu('2026-01-01')
    expect(result).toMatch(/1/)
    expect(result).toMatch(/2026/)
  })
})

// ============================================================================
// getTomorrowDate
// ============================================================================

describe('getTomorrowDate', () => {
  it('returns date string in YYYY-MM-DD format', () => {
    const result = getTomorrowDate()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a date one day after today', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const expected = tomorrow.toISOString().split('T')[0]
    expect(getTomorrowDate()).toBe(expected)
  })
})

// ============================================================================
// getFirstAvailableDate
// ============================================================================

describe('getFirstAvailableDate', () => {
  const makeCoeff = (overrides: Partial<NormalizedCoefficient> = {}): NormalizedCoefficient => ({
    date: '2026-01-20',
    coefficient: 1.0,
    status: 'base',
    isAvailable: false,
    ...overrides,
  })

  it('returns null for empty array', () => {
    expect(getFirstAvailableDate([])).toBeNull()
  })

  it('returns first available coefficient', () => {
    const items: NormalizedCoefficient[] = [
      makeCoeff({ date: '2026-01-20', isAvailable: false }),
      makeCoeff({ date: '2026-01-21', isAvailable: true }),
      makeCoeff({ date: '2026-01-22', isAvailable: true }),
    ]
    const result = getFirstAvailableDate(items)
    expect(result).not.toBeNull()
    expect(result!.date).toBe('2026-01-21')
  })

  it('returns null when no coefficients are available', () => {
    const items: NormalizedCoefficient[] = [
      makeCoeff({ isAvailable: false }),
      makeCoeff({ isAvailable: false }),
    ]
    expect(getFirstAvailableDate(items)).toBeNull()
  })

  it('returns first item when it is available', () => {
    const items: NormalizedCoefficient[] = [
      makeCoeff({ date: '2026-01-20', isAvailable: true }),
      makeCoeff({ date: '2026-01-21', isAvailable: true }),
    ]
    const result = getFirstAvailableDate(items)
    expect(result!.date).toBe('2026-01-20')
  })
})
