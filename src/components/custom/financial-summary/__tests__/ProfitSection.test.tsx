import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@/test/utils/test-utils'
import { ProfitSection } from '../ProfitSection'
import type { FinanceSummary } from '@/hooks/useDashboard'

function summary(overrides: Partial<FinanceSummary>): FinanceSummary {
  return {
    cogs_coverage_pct: 100,
    gross_profit: 1_234_567.89,
    ...overrides,
  } as FinanceSummary
}

describe('ProfitSection', () => {
  it('renders the conditional profit table at complete COGS coverage with exact identity and value', () => {
    render(<ProfitSection summary={summary({})} isComparison={false} />)

    const table = screen.getByRole('table', { name: 'Чистая прибыль' })
    expect(within(table).getByRole('columnheader', { name: 'Показатель' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Значение' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: 'Чистая прибыль' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '1 234 567,89 ₽' })).toBeInTheDocument()

    const { rerender } = render(
      <ProfitSection summary={summary({ cogs_coverage_pct: 99.9 })} isComparison={false} />
    )
    rerender(<ProfitSection summary={summary({ gross_profit: null })} isComparison={false} />)
    expect(screen.getAllByRole('table', { name: 'Чистая прибыль' })).toHaveLength(1)
  })
})
