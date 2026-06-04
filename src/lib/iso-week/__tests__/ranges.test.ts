/**
 * Unit tests for iso-week/ranges (Story 61.7-FE) — coverage added iter-155.
 *
 * Date-range + range-string logic built on iso-week/core. Date assertions node-verified (W03 2026 =
 * Mon 01-12 … Sun 01-18, Thu-midpoint 01-15); range-string logic via round-trips + day-of-week invariants.
 */

import { describe, it, expect } from 'vitest'
import {
  isoWeekToDateRange,
  getWeekStartDate,
  getWeekEndDate,
  getWeekMidpoint,
  buildPeriodRange,
  parseIsoWeekRange,
} from '@/lib/iso-week/ranges'

describe('week → date helpers (node-verified for 2026-W03)', () => {
  it('isoWeekToDateRange returns Monday..Sunday', () => {
    expect(isoWeekToDateRange('2026-W03')).toEqual({ from: '2026-01-12', to: '2026-01-18' })
  })
  it('getWeekStartDate is the Monday', () => {
    const d = getWeekStartDate('2026-W03')
    expect(d.getDay()).toBe(1)
  })
  it('getWeekEndDate is the Sunday', () => {
    expect(getWeekEndDate('2026-W03').getDay()).toBe(0)
  })
  it('getWeekMidpoint is the Thursday (COGS temporal lookup)', () => {
    const thu = getWeekMidpoint('2026-W03')
    expect(thu.getDay()).toBe(4)
    expect(thu.getDate()).toBe(15) // 2026-01-15
  })
})

describe('buildPeriodRange', () => {
  it('returns "" for empty and the single week for length 1', () => {
    expect(buildPeriodRange([])).toBe('')
    expect(buildPeriodRange(['2026-W03'])).toBe('2026-W03')
  })
  it('uses short format within a year ("first:Wlast")', () => {
    expect(buildPeriodRange(['2026-W01', '2026-W02', '2026-W05'])).toBe('2026-W01:W05')
  })
  it('uses full format across years', () => {
    expect(buildPeriodRange(['2025-W52', '2026-W01'])).toBe('2025-W52:2026-W01')
  })
})

describe('parseIsoWeekRange', () => {
  it('returns a single-element array for a single week', () => {
    expect(parseIsoWeekRange('2026-W03')).toEqual(['2026-W03'])
  })
  it('expands a short same-year range (inclusive)', () => {
    const r = parseIsoWeekRange('2026-W01:W03')
    expect(r).toEqual(['2026-W01', '2026-W02', '2026-W03'])
  })
  it('expands a cross-year range', () => {
    const r = parseIsoWeekRange('2025-W52:2026-W01')
    expect(r[0]).toBe('2025-W52')
    expect(r[r.length - 1]).toBe('2026-W01')
  })
  it('throws on an invalid range', () => {
    expect(() => parseIsoWeekRange('nope')).toThrow(/Invalid ISO week range/)
  })
})

describe('buildPeriodRange ⇄ parseIsoWeekRange round-trip', () => {
  it('round-trips a contiguous same-year sequence', () => {
    const weeks = ['2026-W01', '2026-W02', '2026-W03']
    expect(parseIsoWeekRange(buildPeriodRange(weeks))).toEqual(weeks)
  })
})
