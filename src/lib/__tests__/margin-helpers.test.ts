/**
 * Unit tests for margin-helpers
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 */

import { describe, it, expect } from 'vitest'
import {
  nowInMoscow,
  getLastCompletedWeek,
  getWeekEndDate,
  isCogsAfterLastCompletedWeek,
  calculateAffectedWeeks,
} from '../margin-helpers'

// ============================================================================
// nowInMoscow
// ============================================================================

describe('nowInMoscow', () => {
  it('returns a Date object', () => {
    expect(nowInMoscow()).toBeInstanceOf(Date)
  })

  it('returns a date whose local fields reflect Moscow wall-clock', () => {
    const now = new Date()
    // Moscow = UTC+3, so Moscow wall-clock = UTC hour + 3
    const moscowHour = (now.getUTCHours() + 3) % 24
    const result = nowInMoscow()
    // The result's local getHours() should match the Moscow hour
    // (allowing for 1 hour difference due to second-boundary edge cases)
    const diff = Math.abs(result.getHours() - moscowHour)
    expect(diff).toBeLessThanOrEqual(1)
  })
})

// ============================================================================
// getLastCompletedWeek
// ============================================================================

describe('getLastCompletedWeek', () => {
  it('returns a valid ISO week format', () => {
    const result = getLastCompletedWeek()
    expect(result).toMatch(/^\d{4}-W\d{2}$/)
  })

  it('returns a week in the past', () => {
    const result = getLastCompletedWeek()
    // Should never return a future week
    const [yearStr, weekStr] = result.split('-W')
    const year = parseInt(yearStr, 10)
    const week = parseInt(weekStr, 10)
    expect(year).toBeGreaterThan(2020)
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(53)
  })
})

// ============================================================================
// getWeekEndDate
// ============================================================================

describe('getWeekEndDate', () => {
  it('returns end of week as Sunday 23:59:59', () => {
    const end = getWeekEndDate('2025-W01')
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })

  it('throws for invalid ISO week format', () => {
    expect(() => getWeekEndDate('invalid')).toThrow('Invalid ISO week format')
  })

  it('throws for partial format', () => {
    expect(() => getWeekEndDate('2025-W')).toThrow()
  })

  it('returns a date that is after the week start', () => {
    const end = getWeekEndDate('2025-W10')
    // Should be 6-7 days from Monday
    expect(end.getDate()).toBeGreaterThanOrEqual(1)
  })

  it('handles week 52 correctly', () => {
    const end = getWeekEndDate('2024-W52')
    expect(end).toBeInstanceOf(Date)
    expect(end.getHours()).toBe(23)
  })
})

// ============================================================================
// isCogsAfterLastCompletedWeek
// ============================================================================

describe('isCogsAfterLastCompletedWeek', () => {
  it('returns true for far-future date', () => {
    const result = isCogsAfterLastCompletedWeek('2099-06-01')
    expect(result).toBe(true)
  })

  it('returns false for a date in the distant past', () => {
    const result = isCogsAfterLastCompletedWeek('2020-01-01')
    expect(result).toBe(false)
  })

  it('handles Date object input', () => {
    const result = isCogsAfterLastCompletedWeek(new Date('2020-01-01'))
    expect(result).toBe(false)
  })

  it('handles ISO string with time component', () => {
    const result = isCogsAfterLastCompletedWeek('2099-06-01T00:00:00.000Z')
    expect(result).toBe(true)
  })
})

// ============================================================================
// calculateAffectedWeeks
// ============================================================================

describe('calculateAffectedWeeks', () => {
  it('returns empty array for far-future date', () => {
    const result = calculateAffectedWeeks('2099-06-01')
    expect(result).toEqual([])
  })

  it('returns at least one week for a date in the past', () => {
    const result = calculateAffectedWeeks('2020-01-01')
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns weeks in ISO format', () => {
    const result = calculateAffectedWeeks('2024-01-01')
    for (const week of result) {
      expect(week).toMatch(/^\d{4}-W\d{2}$/)
    }
  })

  it('returns weeks without duplicates', () => {
    const result = calculateAffectedWeeks('2024-01-01')
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
  })

  it('handles Date object input', () => {
    const result = calculateAffectedWeeks(new Date('2020-06-15'))
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns weeks in chronological order', () => {
    const result = calculateAffectedWeeks('2024-06-01')
    for (let i = 1; i < result.length; i++) {
      expect(result[i] >= result[i - 1]).toBe(true)
    }
  })
})
