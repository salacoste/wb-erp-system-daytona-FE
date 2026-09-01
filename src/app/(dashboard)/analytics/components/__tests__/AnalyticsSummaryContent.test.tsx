import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import type { FinanceSummary } from '@/hooks/useDashboard'
import { AnalyticsSummaryContent } from '../AnalyticsSummaryContent'

vi.mock('@/components/custom/FinancialSummaryTable', () => ({
  FinancialSummaryTable: () => <div data-testid="financial-summary">summary</div>,
}))
vi.mock('@/components/custom/ExpenseChart', () => ({
  ExpenseChart: () => <div data-testid="expense-chart">chart</div>,
}))

const summary = { revenue_net: 100 } as FinanceSummary

function renderContent(overrides: Partial<React.ComponentProps<typeof AnalyticsSummaryContent>> = {}) {
  const props: React.ComponentProps<typeof AnalyticsSummaryContent> = {
    viewMode: 'multi',
    selectedWeek: '2026-W30',
    isLoading: false,
    isError: false,
    error: null,
    primarySummary: summary,
    secondarySummary: undefined,
    onRetry: vi.fn(),
    ...overrides,
  }
  return { ...render(<AnalyticsSummaryContent {...props} />), props }
}

describe('AnalyticsSummaryContent owner states', () => {
  it('renders the initial structural loading state without fabricating summary data', () => {
    renderContent({ isLoading: true, primarySummary: undefined })

    expect(screen.queryByTestId('financial-summary')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.animate-pulse')).not.toHaveLength(0)
  })

  it('renders the global empty state when no primary summary exists', () => {
    renderContent({ primarySummary: undefined })

    expect(screen.getByText(/Нет данных для отображения/)).toBeInTheDocument()
  })

  it('retries a recoverable terminal summary error without losing route identity', () => {
    const onRetry = vi.fn()
    renderContent({ primarySummary: undefined, isError: true, error: new Error('Сбой'), onRetry })

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(screen.getByText('Сбой')).toBeInTheDocument()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('retains the loaded summary and labels a background refresh', () => {
    renderContent({ isLoading: true })

    expect(screen.getByTestId('financial-summary')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Обновляем финансовую сводку')
  })

  it('retains stale summary evidence and exposes retry after a background failure', () => {
    const onRetry = vi.fn()
    renderContent({ isError: true, error: new Error('Сбой обновления'), onRetry })

    expect(screen.getByTestId('financial-summary')).toBeInTheDocument()
    expect(screen.getByText(/Показаны ранее загруженные данные/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
