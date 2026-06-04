/**
 * Unit tests for storage-week-utils (Request #52 / Story 74.5) — regression coverage added iter-131.
 *
 * Pure ISO-week utilities (storage-specific). Date-dependent outputs (getWeekDateRange, the
 * generateWeekRange year-boundary, getMaxWeeks) were node-verified before asserting — not fabricated.
 */

import { describe, it, expect } from 'vitest'
import {
  parseIsoWeek,
  formatIsoWeekString,
  generateWeekRange,
  fillMissingWeeks,
  getWeekDateRange,
} from '@/lib/storage-week-utils'

describe('parseIsoWeek', () => {
  it('parses a well-formed ISO week', () => {
    expect(parseIsoWeek('2025-W40')).toEqual({ year: 2025, weekNum: 40 })
    expect(parseIsoWeek('2025-W01')).toEqual({ year: 2025, weekNum: 1 })
  })

  it('accepts a single-digit week (regex \\d{1,2})', () => {
    expect(parseIsoWeek('2025-W5')).toEqual({ year: 2025, weekNum: 5 })
  })

  it('throws on a malformed string', () => {
    expect(() => parseIsoWeek('2025-40')).toThrow(/Invalid ISO week format/)
    expect(() => parseIsoWeek('garbage')).toThrow(/Invalid ISO week format/)
  })
})

describe('formatIsoWeekString', () => {
  it('zero-pads the week number to 2 digits', () => {
    expect(formatIsoWeekString(2025, 5)).toBe('2025-W05')
    expect(formatIsoWeekString(2025, 40)).toBe('2025-W40')
    expect(formatIsoWeekString(2025, 53)).toBe('2025-W53')
  })

  it('round-trips with parseIsoWeek', () => {
    expect(parseIsoWeek(formatIsoWeekString(2025, 7))).toEqual({ year: 2025, weekNum: 7 })
  })
})

describe('generateWeekRange', () => {
  it('lists inclusive weeks within a single year', () => {
    expect(generateWeekRange('2025-W40', '2025-W42')).toEqual(['2025-W40', '2025-W41', '2025-W42'])
  })

  it('returns a single week when start === end', () => {
    expect(generateWeekRange('2025-W40', '2025-W40')).toEqual(['2025-W40'])
  })

  it('crosses a year boundary correctly (2025 has 52 weeks → rolls to 2026-W01)', () => {
    expect(generateWeekRange('2025-W51', '2026-W01')).toEqual(['2025-W51', '2025-W52', '2026-W01'])
  })
})

describe('fillMissingWeeks', () => {
  it('fills gaps with null storage_cost/volume and preserves existing rows', () => {
    const result = fillMissingWeeks(
      [{ week: '2025-W41', storage_cost: 1800 }],
      '2025-W40',
      '2025-W42'
    )
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ week: '2025-W40', storage_cost: null, volume: null })
    expect(result[1]).toEqual({ week: '2025-W41', storage_cost: 1800 }) // existing row, untouched
    expect(result[2]).toEqual({ week: '2025-W42', storage_cost: null, volume: null })
  })
})

describe('getWeekDateRange', () => {
  it('converts an ISO week to its Mon–Sun date range (node-verified)', () => {
    expect(getWeekDateRange('2025-W49')).toEqual({ dateFrom: '2025-12-01', dateTo: '2025-12-07' })
  })

  it('handles W01 starting in the previous calendar year', () => {
    expect(getWeekDateRange('2025-W01')).toEqual({ dateFrom: '2024-12-30', dateTo: '2025-01-05' })
  })

  it('throws on malformed format', () => {
    expect(() => getWeekDateRange('2025/49')).toThrow(/Invalid ISO week format/)
  })

  it('throws on out-of-range week number', () => {
    expect(() => getWeekDateRange('2025-W00')).toThrow(/Must be between 1 and 53/)
    expect(() => getWeekDateRange('2025-W54')).toThrow(/Must be between 1 and 53/)
  })
})
