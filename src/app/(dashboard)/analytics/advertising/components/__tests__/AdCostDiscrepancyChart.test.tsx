import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdCostDiscrepancyChart } from '../AdCostDiscrepancyChart'

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    if (this.classList.contains('recharts-responsive-container')) {
      return {
        width: 320,
        height: 192,
        top: 0,
        right: 320,
        bottom: 192,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      }
    }
    return originalGetBoundingClientRect.call(this)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

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
