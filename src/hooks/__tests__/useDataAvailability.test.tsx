/**
 * Tests for useDataAvailability hook
 * Finance data availability logic for period selection
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDataAvailability } from '../useDataAvailability'
import type { WeekData } from '../financial/types'

// Mock period helpers
vi.mock('@/lib/period-helpers', () => ({
  getWeeksInMonth: vi.fn((month: string) => {
    // Return predictable weeks for test months
    if (month === '2026-W01') return ['2026-W01']
    if (month === '2026-01') return ['2026-W01', '2026-W02', '2026-W03', '2026-W04']
    if (month === '2026-05') return ['2026-W19', '2026-W20', '2026-W21', '2026-W22']
    return []
  }),
}))

vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: vi.fn(() => '2026-W22'),
}))

describe('useDataAvailability', () => {
  it('returns isFinanceAvailable=true when availableWeeks is undefined (loading)', () => {
    const { result } = renderHook(() =>
      useDataAvailability('week', '2026-W05', '2026-05', undefined)
    )

    expect(result.current.isFinanceAvailable).toBe(true)
    expect(result.current.latestAvailableWeek).toBeNull()
  })

  it('returns available=true when selected week is in availableWeeks', () => {
    const weeks: WeekData[] = [
      { week: '2026-W05', start_date: '2026-01-27' },
      { week: '2026-W04', start_date: '2026-01-20' },
    ]

    const { result } = renderHook(() => useDataAvailability('week', '2026-W05', '2026-01', weeks))

    expect(result.current.isFinanceAvailable).toBe(true)
  })

  it('returns available=false when selected week is NOT in availableWeeks', () => {
    const weeks: WeekData[] = [{ week: '2026-W04', start_date: '2026-01-20' }]

    const { result } = renderHook(() => useDataAvailability('week', '2026-W05', '2026-01', weeks))

    expect(result.current.isFinanceAvailable).toBe(false)
  })

  it('returns latestAvailableWeek from first element', () => {
    const weeks: WeekData[] = [
      { week: '2026-W10', start_date: '2026-03-03' },
      { week: '2026-W09', start_date: '2026-02-24' },
    ]

    const { result } = renderHook(() => useDataAvailability('week', '2026-W05', '2026-01', weeks))

    expect(result.current.latestAvailableWeek).toBe('2026-W10')
  })

  it('returns null latestAvailableWeek for empty availableWeeks', () => {
    const { result } = renderHook(() => useDataAvailability('week', '2026-W05', '2026-01', []))

    expect(result.current.latestAvailableWeek).toBeNull()
  })

  it('returns available=true in month mode when at least one week overlaps', () => {
    const weeks: WeekData[] = [
      { week: '2026-W19', start_date: '2026-05-04' },
      { week: '2026-W18', start_date: '2026-04-27' },
    ]

    const { result } = renderHook(() => useDataAvailability('month', '2026-W05', '2026-05', weeks))

    expect(result.current.isFinanceAvailable).toBe(true)
  })

  it('returns available=false in month mode when no weeks overlap', () => {
    const weeks: WeekData[] = [{ week: '2026-W10', start_date: '2026-03-03' }]

    const { result } = renderHook(() => useDataAvailability('month', '2026-W05', '2026-05', weeks))

    expect(result.current.isFinanceAvailable).toBe(false)
  })

  it('memoizes result for same inputs', () => {
    const weeks: WeekData[] = [{ week: '2026-W05', start_date: '2026-01-27' }]

    const { result, rerender } = renderHook(
      ({ periodType, selectedWeek, selectedMonth, availableWeeks }) =>
        useDataAvailability(periodType, selectedWeek, selectedMonth, availableWeeks),
      {
        initialProps: {
          periodType: 'week' as const,
          selectedWeek: '2026-W05',
          selectedMonth: '2026-01',
          availableWeeks: weeks,
        },
      }
    )

    const firstResult = result.current
    rerender({
      periodType: 'week',
      selectedWeek: '2026-W05',
      selectedMonth: '2026-01',
      availableWeeks: weeks,
    })

    // Same object reference since deps didn't change
    expect(result.current.isFinanceAvailable).toBe(firstResult.isFinanceAvailable)
  })

  it('handles empty availableWeeks array', () => {
    const { result } = renderHook(() => useDataAvailability('week', '2026-W05', '2026-01', []))

    expect(result.current.isFinanceAvailable).toBe(false)
    expect(result.current.latestAvailableWeek).toBeNull()
  })
})
