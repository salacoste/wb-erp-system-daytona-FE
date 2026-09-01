import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { AdCostDiscrepancyChart, formatAdCostTooltipValue } from '../AdCostDiscrepancyChart'

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

  it('exposes exact currency units, accounting series, values, delta, and tooltip precision', () => {
    render(<AdCostDiscrepancyChart platformSpend={100_000} actualDeduction={95_000} />)
    const table = screen.getByRole('table', {
      name: 'Сравнение рекламных расходов по слоям, рубли',
    })
    expect(within(table).getByRole('columnheader', { name: 'Слой' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Расход, ₽' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: 'Платформа' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: 'Факт (отчёт WB)' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '100 000 ₽' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '95 000 ₽' })).toBeInTheDocument()
    expect(
      within(table).getByRole('rowheader', { name: 'Изменение платформа → факт' })
    ).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '-5,0 %' })).toBeInTheDocument()
    expect(formatAdCostTooltipValue(100_000)).toBe('100 000 ₽')
    expect(formatAdCostTooltipValue('95000')).toBe('95 000 ₽')
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
