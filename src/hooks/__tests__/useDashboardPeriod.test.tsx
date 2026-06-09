/**
 * Tests for useDashboardPeriod re-exports and period helper functions
 * Story 60.1-FE: Period State Management
 *
 * The hook file re-exports from dashboard-period-context and period-helpers.
 * Tests verify: re-exports exist, helper functions produce correct output.
 */

import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import {
  useDashboardPeriod,
  DashboardPeriodProvider,
  formatPeriodDisplay,
  formatWeekLabel,
  formatMonthLabel,
  getWeeksInMonth,
  getMonthFromWeek,
  getPreviousPeriod,
  isValidWeekFormat,
  isValidMonthFormat,
} from '../useDashboardPeriod'

describe('useDashboardPeriod re-exports', () => {
  it('throws when used outside DashboardPeriodProvider', () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useDashboardPeriod())

    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toContain('useDashboardPeriod')
    expect(result.error.message).toContain('DashboardPeriodProvider')

    spy.mockRestore()
  })

  it('provides context value when wrapped in provider', () => {
    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <DashboardPeriodProvider initialWeek="2026-W05">
          {children}
        </DashboardPeriodProvider>
      ),
    })

    expect(result.error).toBeUndefined()
    expect(result.current).toBeDefined()
    expect(result.current.state).toBeDefined()
    expect(result.current.actions).toBeDefined()
  })

  it('exposes state with selectedWeek', () => {
    const { result } = renderHook(() => useDashboardPeriod(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <DashboardPeriodProvider initialWeek="2026-W10">
          {children}
        </DashboardPeriodProvider>
      ),
    })

    expect(result.current.state.selectedWeek).toBe('2026-W10')
  })
})

describe('period helper re-exports', () => {
  it('getWeeksInMonth returns weeks for a month', () => {
    const weeks = getWeeksInMonth('2026-01')
    expect(weeks.length).toBeGreaterThan(0)
    weeks.forEach(w => {
      expect(w).toMatch(/^\d{4}-W\d{2}$/)
    })
  })

  it('getMonthFromWeek returns month for a week', () => {
    const month = getMonthFromWeek('2026-W05')
    expect(month).toMatch(/^\d{4}-\d{2}$/)
  })

  it('getPreviousPeriod returns previous week', () => {
    const prev = getPreviousPeriod('2026-W10', 'week')
    expect(prev).toBe('2026-W09')
  })

  it('getPreviousPeriod returns previous month', () => {
    const prev = getPreviousPeriod('2026-05', 'month')
    expect(prev).toBe('2026-04')
  })

  it('isValidWeekFormat validates correct format', () => {
    expect(isValidWeekFormat('2026-W05')).toBe(true)
    expect(isValidWeekFormat('')).toBe(false)
    expect(isValidWeekFormat('invalid')).toBe(false)
  })

  it('isValidMonthFormat validates correct format', () => {
    expect(isValidMonthFormat('2026-05')).toBe(true)
    expect(isValidMonthFormat('')).toBe(false)
    expect(isValidMonthFormat('invalid')).toBe(false)
  })

  it('formatWeekLabel returns a string', () => {
    const label = formatWeekLabel('2026-W05')
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('formatMonthLabel returns a string', () => {
    const label = formatMonthLabel('2026-05')
    expect(typeof label).toBe('string')
    expect(label.length).toBeGreaterThan(0)
  })

  it('formatPeriodDisplay returns a string for week', () => {
    const display = formatPeriodDisplay('2026-W05', 'week')
    expect(typeof display).toBe('string')
    expect(display.length).toBeGreaterThan(0)
  })

  it('formatPeriodDisplay returns a string for month', () => {
    const display = formatPeriodDisplay('2026-05', 'month')
    expect(typeof display).toBe('string')
    expect(display.length).toBeGreaterThan(0)
  })
})
