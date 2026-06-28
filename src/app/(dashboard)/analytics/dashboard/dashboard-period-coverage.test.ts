import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getDashboardMonthCoverage,
  getDashboardMonthSummaryWeeks,
} from './dashboard-period-coverage'

afterEach(() => {
  vi.useRealTimers()
})

describe('getDashboardMonthCoverage', () => {
  it('makes non-calendar month coverage explicit for May 2026', () => {
    const coverage = getDashboardMonthCoverage('2026-05', '2026-W19', '2026-W22')

    expect(coverage.weeksLabel).toBe('2026-W19 — 2026-W22')
    expect(coverage.coveredRangeLabel).toBe('04.05.2026 — 31.05.2026')
    expect(coverage.calendarRangeLabel).toBe('01.05.2026 — 31.05.2026')
    expect(coverage.hasCalendarGap).toBe(true)
  })
})

describe('getDashboardMonthSummaryWeeks', () => {
  it('keeps established month weeks while availability is still loading', () => {
    expect(getDashboardMonthSummaryWeeks('2026-05', undefined)).toEqual({
      source: 'loading',
      weeks: ['2026-W19', '2026-W20', '2026-W21', '2026-W22'],
    })
  })

  it('filters month summaries to completed available weeks when availability is loaded', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-28T09:00:00Z'))

    expect(
      getDashboardMonthSummaryWeeks('2026-06', [
        { week: '2026-W23' },
        { week: '2026-W24' },
        { week: '2026-W25' },
        { week: '2026-W26' },
      ])
    ).toEqual({ source: 'available', weeks: ['2026-W23', '2026-W24', '2026-W25'] })
  })

  it('returns the longest contiguous available span so range API never covers gaps', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-28T09:00:00Z'))

    expect(
      getDashboardMonthSummaryWeeks('2026-06', [
        { week: '2026-W23' },
        { week: '2026-W25' },
        { week: '2026-W26' },
      ])
    ).toEqual({ source: 'available', weeks: ['2026-W25'] })
  })
})
