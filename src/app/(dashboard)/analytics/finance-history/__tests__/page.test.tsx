import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import FinanceHistoryPage from '../page'

const mockUseAvailableWeeks = vi.fn()
const mockUseWeeklyFinancialSeries = vi.fn()

vi.mock('@/hooks/financial', () => ({
  useAvailableWeeks: () => mockUseAvailableWeeks(),
  useWeeklyFinancialSeries: (...args: unknown[]) => mockUseWeeklyFinancialSeries(...args),
}))
vi.mock('@/components/custom/finance-history/FinanceHistoryTable', () => ({
  FinanceHistoryTable: ({ points }: { points: Array<{ summary: unknown }> }) => (
    <div data-testid="finance-history-table">{points.filter(point => point.summary).length} ready</div>
  ),
}))

function setSeries(overrides: Record<string, unknown> = {}) {
  mockUseWeeklyFinancialSeries.mockReturnValue({
    data: [{ week: '2026-W30', summary: { revenue_net: 1_000_000_000_000 } }],
    isLoading: false,
    isError: false,
    error: null,
    isSettled: true,
    refetch: vi.fn(),
    ...overrides,
  })
}

describe('FinanceHistoryPage owner states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAvailableWeeks.mockReturnValue({ data: [{ week: '2026-W30' }], isLoading: false })
    setSeries()
  })

  it('keeps route identity visible while financial weeks are loading', () => {
    setSeries({ data: [], isLoading: true })

    render(<FinanceHistoryPage />)

    expect(screen.getByRole('heading', { name: 'Финансовый отчёт: история' })).toBeInTheDocument()
    expect(screen.queryByTestId('finance-history-table')).not.toBeInTheDocument()
  })

  it('renders a recoverable route error when every requested week fails', () => {
    const refetch = vi.fn()
    setSeries({
      data: [{ week: '2026-W30', summary: null }],
      isError: true,
      error: new Error('История недоступна'),
      refetch,
    })

    render(<FinanceHistoryPage />)

    expect(screen.getByText('История недоступна')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('retains successful weeks and labels a partial multi-week failure', () => {
    setSeries({
      data: [
        { week: '2026-W29', summary: { revenue_net: 100 } },
        { week: '2026-W30', summary: null },
      ],
      isError: true,
      error: new Error('Одна неделя недоступна'),
    })

    render(<FinanceHistoryPage />)

    expect(screen.getByTestId('finance-history-table')).toHaveTextContent('1 ready')
    expect(screen.getByText(/Часть недель недоступна/)).toBeInTheDocument()
  })

  it('passes a twelve-digit financial value to the table without route-level truncation', () => {
    render(<FinanceHistoryPage />)

    expect(mockUseWeeklyFinancialSeries).toHaveBeenCalledWith(['2026-W30'])
    expect(screen.getByTestId('finance-history-table')).toHaveTextContent('1 ready')
  })
})
