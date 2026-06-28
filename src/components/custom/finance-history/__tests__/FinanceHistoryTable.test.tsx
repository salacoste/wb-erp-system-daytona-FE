/**
 * Render tests for FinanceHistoryTable — sections/rows/weeks grid + empty state.
 */

import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
import { FinanceHistoryTable } from '../FinanceHistoryTable'
import type { WeeklyFinancialPoint } from '@/hooks/financial/useWeeklyFinancialSeries'
import type { FinanceSummary } from '@/types/finance-summary'

function makePoint(week: string, overrides: Partial<FinanceSummary> = {}): WeeklyFinancialPoint {
  return {
    week,
    summary: {
      week,
      payout_total: 100000,
      penalties_total: 0,
      sale_gross_total: 500000,
      cogs_total: 200000,
      gross_profit_analytical: 300000,
      operating_profit_analytical: 150000,
      logistics_cost_total: 80000,
      storage_cost_total: 10000,
      total_commission_rub_total: 70000,
      wb_promotion_cost_total: 30000,
      ...overrides,
    } as unknown as FinanceSummary,
  }
}

describe('FinanceHistoryTable', () => {
  it('renders a header column per week', () => {
    const points = [makePoint('2026-W09'), makePoint('2026-W10')]
    renderWithProviders(<FinanceHistoryTable points={points} />)
    expect(screen.getByText('Нед. 9')).toBeInTheDocument()
    expect(screen.getByText('Нед. 10')).toBeInTheDocument()
  })

  it('renders all four section labels', () => {
    renderWithProviders(<FinanceHistoryTable points={[makePoint('2026-W10')]} />)
    expect(screen.getByText('Доходы')).toBeInTheDocument()
    expect(screen.getByText('Прибыль и маржинальность')).toBeInTheDocument()
    expect(screen.getByText('Структура расходов (% от выручки)')).toBeInTheDocument()
    expect(screen.getByText('Абсолютные расходы')).toBeInTheDocument()
  })

  it('renders the net-profit headline row and a currency value (₽)', () => {
    renderWithProviders(<FinanceHistoryTable points={[makePoint('2026-W10')]} />)
    expect(screen.getByText('Чистая прибыль')).toBeInTheDocument()
    expect(screen.getAllByText(/₽/).length).toBeGreaterThan(0)
  })

  it('renders a WoW delta when a previous week exists', () => {
    const points = [
      makePoint('2026-W09', { sale_gross_total: 400000 }),
      makePoint('2026-W10', { sale_gross_total: 500000 }),
    ]
    const { container } = renderWithProviders(<FinanceHistoryTable points={points} />)
    // A positive revenue change → a '+' percentage somewhere in the grid.
    expect(container.textContent).toMatch(/\+/)
  })

  it('shows the empty state when every week has a null summary', () => {
    const points: WeeklyFinancialPoint[] = [
      { week: '2026-W10', summary: null },
      { week: '2026-W09', summary: null },
    ]
    renderWithProviders(<FinanceHistoryTable points={points} />)
    expect(screen.getByText(/Нет финансовых данных/)).toBeInTheDocument()
  })
})
