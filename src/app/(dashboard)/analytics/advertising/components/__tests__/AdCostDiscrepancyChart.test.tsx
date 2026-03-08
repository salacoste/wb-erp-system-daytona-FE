import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdCostDiscrepancyChart } from '../AdCostDiscrepancyChart'

describe('AdCostDiscrepancyChart', () => {
  it('returns null when both values are null', () => {
    const { container } = render(
      <AdCostDiscrepancyChart platformSpend={null} actualDeduction={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when only platformSpend is provided', () => {
    const { container } = render(
      <AdCostDiscrepancyChart platformSpend={100_000} actualDeduction={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when only actualDeduction is provided', () => {
    const { container } = render(
      <AdCostDiscrepancyChart platformSpend={null} actualDeduction={95_000} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders chart card when both values are provided', () => {
    render(<AdCostDiscrepancyChart platformSpend={100_000} actualDeduction={95_000} />)
    expect(screen.getByText('Сравнение расходов')).toBeInTheDocument()
  })

  it('renders accessible image role with aria-label', () => {
    render(<AdCostDiscrepancyChart platformSpend={100_000} actualDeduction={95_000} />)
    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute('aria-label', 'Сравнение рекламных расходов: платформа и факт')
  })

  it('renders ResponsiveContainer wrapper', () => {
    render(<AdCostDiscrepancyChart platformSpend={100_000} actualDeduction={95_000} />)
    const wrapper = document.querySelector('.recharts-responsive-container')
    expect(wrapper).toBeTruthy()
  })

  it('renders skeleton when isLoading is true', () => {
    render(<AdCostDiscrepancyChart platformSpend={null} actualDeduction={null} isLoading={true} />)
    const skeleton = document.querySelector('.h-48')
    expect(skeleton).toBeTruthy()
  })
})
