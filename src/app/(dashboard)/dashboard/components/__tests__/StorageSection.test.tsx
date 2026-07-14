import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StorageSection } from '../StorageSection'

const mockGetWeeksInMonth = vi.hoisted(() => vi.fn())
const storageWidgetCalls = vi.hoisted(() => ({
  trends: vi.fn(),
  top: vi.fn(),
}))

vi.mock('@/lib/period-helpers', () => ({
  getWeeksInMonth: mockGetWeeksInMonth,
}))

vi.mock('@/components/custom/dashboard', () => ({
  StorageTrendsWidget: (props: { weekStart: string; weekEnd: string }) => {
    storageWidgetCalls.trends(props)
    return <div data-testid="storage-trends" />
  },
  StorageTopConsumersWidget: (props: { weekStart: string; weekEnd: string }) => {
    storageWidgetCalls.top(props)
    return <div data-testid="storage-top" />
  },
}))

describe('StorageSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the existing 8-week lookback in week mode', () => {
    render(<StorageSection periodType="week" selectedWeek="2026-W26" selectedMonth="2026-06" />)

    expect(screen.getByTestId('storage-trends')).toBeInTheDocument()
    expect(storageWidgetCalls.trends).toHaveBeenCalledWith({
      weekStart: '2026-W19',
      weekEnd: '2026-W26',
    })
    expect(storageWidgetCalls.top).toHaveBeenCalledWith({
      weekStart: '2026-W19',
      weekEnd: '2026-W26',
    })
  })

  it('uses weeks from the selected month in month mode', () => {
    mockGetWeeksInMonth.mockReturnValue(['2026-W23', '2026-W24', '2026-W25', '2026-W26'])

    render(<StorageSection periodType="month" selectedWeek="2026-W26" selectedMonth="2026-06" />)

    expect(mockGetWeeksInMonth).toHaveBeenCalledWith('2026-06')
    expect(storageWidgetCalls.trends).toHaveBeenCalledWith({
      weekStart: '2026-W23',
      weekEnd: '2026-W26',
    })
    expect(storageWidgetCalls.top).toHaveBeenCalledWith({
      weekStart: '2026-W23',
      weekEnd: '2026-W26',
    })
  })
})
