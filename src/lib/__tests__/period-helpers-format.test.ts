/**
 * Unit tests for period-helpers-format (Story 60.1-FE) — regression coverage added iter-145.
 *
 * Validators are pure regex. Label formatters depend on date-fns + period-helpers + today
 * (getCurrentWeek/Month), so they're tested robustly: structure regex (not TZ-fragile exact dates),
 * self-reference for isCurrent*, and the ⏳ indicator via getCurrentWeek()/getCurrentMonth().
 */

import { describe, it, expect } from 'vitest'
import { getCurrentWeek, getCurrentMonth } from '@/lib/period-helpers'
import {
  isCurrentWeek,
  formatWeekLabel,
  isCurrentMonth,
  formatMonthLabel,
  formatPeriodDisplay,
  isValidWeekFormat,
  isValidMonthFormat,
} from '@/lib/period-helpers-format'

describe('format validators (pure regex)', () => {
  it('isValidWeekFormat requires YYYY-Www (2-digit week)', () => {
    expect(isValidWeekFormat('2026-W03')).toBe(true)
    expect(isValidWeekFormat('2026-W3')).toBe(false)
    expect(isValidWeekFormat('2026-03')).toBe(false)
    expect(isValidWeekFormat('garbage')).toBe(false)
  })
  it('isValidMonthFormat requires YYYY-MM', () => {
    expect(isValidMonthFormat('2026-03')).toBe(true)
    expect(isValidMonthFormat('2026-3')).toBe(false)
    expect(isValidMonthFormat('2026-W03')).toBe(false)
  })
})

describe('isCurrentWeek / isCurrentMonth', () => {
  it('matches the value returned by getCurrentWeek/getCurrentMonth', () => {
    expect(isCurrentWeek(getCurrentWeek())).toBe(true)
    expect(isCurrentMonth(getCurrentMonth())).toBe(true)
  })
  it('is false for a far-past period', () => {
    expect(isCurrentWeek('1999-W01')).toBe(false)
    expect(isCurrentMonth('1999-01')).toBe(false)
  })
})

describe('formatWeekLabel', () => {
  it('renders "Неделя N, YYYY (D mmm — D mmm)" for a past week (no ⏳)', () => {
    expect(formatWeekLabel('2026-W03')).toMatch(/^Неделя 3, 2026 \(.+ — .+\)$/)
  })
  it('appends the ⏳ indicator for the current week', () => {
    expect(formatWeekLabel(getCurrentWeek())).toMatch(/⏳$/)
  })
  it('throws on an invalid week format', () => {
    expect(() => formatWeekLabel('2026-3')).toThrow(/Invalid week format/)
  })
})

describe('formatMonthLabel', () => {
  it('renders a capitalized Russian "Month YYYY" for a past month (no ⏳)', () => {
    expect(formatMonthLabel('2026-03')).toBe('Март 2026')
  })
  it('appends the ⏳ indicator for the current month', () => {
    expect(formatMonthLabel(getCurrentMonth())).toMatch(/⏳$/)
  })
})

describe('formatPeriodDisplay', () => {
  it('delegates to the week vs month formatter by type', () => {
    expect(formatPeriodDisplay('2026-W03', 'week')).toMatch(/^Неделя 3, 2026/)
    expect(formatPeriodDisplay('2026-03', 'month')).toBe('Март 2026')
  })
})
