import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdCostDiscrepancySection } from '../AdCostDiscrepancySection'

vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: () => '2026-W09',
}))

vi.mock('@/hooks/financial', () => ({
  useFinancialSummary: () => ({
    data: {
      summary_total: { wb_promotion_cost_total: 95_000 },
    },
    isLoading: false,
  }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('AdCostDiscrepancySection', () => {
  it('renders card with platform and actual data', () => {
    render(<AdCostDiscrepancySection platformSpend={100_000} isLoading={false} />, {
      wrapper,
    })
    expect(screen.getByText('Расхождение рекламных расходов')).toBeInTheDocument()
  })

  it('renders chart when both values present', () => {
    render(<AdCostDiscrepancySection platformSpend={100_000} isLoading={false} />, {
      wrapper,
    })
    expect(screen.getByText('Сравнение расходов')).toBeInTheDocument()
  })

  it('shows week label from getLastCompletedWeek', () => {
    render(<AdCostDiscrepancySection platformSpend={100_000} isLoading={false} />, {
      wrapper,
    })
    expect(screen.getByText('(2026-W09)')).toBeInTheDocument()
  })

  it('shows loading skeleton when ad data is loading', () => {
    render(<AdCostDiscrepancySection platformSpend={null} isLoading={true} />, {
      wrapper,
    })
    const skeleton = document.querySelector('.h-40')
    expect(skeleton).toBeTruthy()
  })

  it('renders grid layout with two columns', () => {
    const { container } = render(
      <AdCostDiscrepancySection platformSpend={100_000} isLoading={false} />,
      { wrapper }
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
    expect(grid.className).toContain('md:grid-cols-2')
  })
})
