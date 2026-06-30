import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardMonthWeekScope, getDashboardMonthWeekScope } from '../DashboardMonthWeekScope'

afterEach(() => {
  vi.useRealTimers()
})

describe('getDashboardMonthWeekScope', () => {
  it('lists completed WB weeks and included dates for a selected month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-30T13:00:00+03:00'))

    expect(getDashboardMonthWeekScope('2026-06')).toEqual({
      weeksLabel: '2026-W23, 2026-W24, 2026-W25, 2026-W26',
      dateRangeLabel: '01.06.2026 — 28.06.2026',
    })
  })
})

describe('DashboardMonthWeekScope', () => {
  it('renders month week scope as a visible note', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-30T13:00:00+03:00'))

    render(<DashboardMonthWeekScope month="2026-06" />)

    expect(screen.getByRole('note')).toHaveTextContent(
      'Месячная выборка по недельным WB-отчётам: 2026-W23, 2026-W24, 2026-W25, 2026-W26; включены даты: 01.06.2026 — 28.06.2026.'
    )
  })
})
