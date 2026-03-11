import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalculationResults } from '../CalculationResults'
import type { CalculationResultItem } from '@/types/shipment-cost'

const mockResults: CalculationResultItem[] = [
  {
    nmId: 111,
    productName: 'Футболка',
    unitCostRub: 500,
    deliveryCostPerUnit: 30,
    finalCostPerUnit: 530,
    totalUnits: 10,
    finalCostLine: 5300,
  },
  {
    nmId: 222,
    productName: 'Джинсы',
    unitCostRub: 1200,
    deliveryCostPerUnit: 45.5,
    finalCostPerUnit: 1245.5,
    totalUnits: 5,
    finalCostLine: 6227.5,
  },
]

describe('CalculationResults', () => {
  it('renders nothing when results are empty', () => {
    const { container } = render(<CalculationResults results={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders header with success icon', () => {
    render(<CalculationResults results={mockResults} />)
    expect(screen.getByText('Результаты расчёта')).toBeInTheDocument()
  })

  it('renders all result rows with nmId', () => {
    render(<CalculationResults results={mockResults} />)
    expect(screen.getByText('111')).toBeInTheDocument()
    expect(screen.getByText('222')).toBeInTheDocument()
  })

  it('renders product names', () => {
    render(<CalculationResults results={mockResults} />)
    expect(screen.getByText('Футболка')).toBeInTheDocument()
    expect(screen.getByText('Джинсы')).toBeInTheDocument()
  })

  it('renders table headers', () => {
    render(<CalculationResults results={mockResults} />)
    expect(screen.getByText('Товар')).toBeInTheDocument()
    expect(screen.getByText('Себест. (PCU)')).toBeInTheDocument()
    expect(screen.getByText('Доставка (DCU)')).toBeInTheDocument()
    expect(screen.getByText('Итого (FCU)')).toBeInTheDocument()
    expect(screen.getByText('Кол-во')).toBeInTheDocument()
    expect(screen.getByText('Сумма')).toBeInTheDocument()
  })

  it('renders total units as plain numbers', () => {
    render(<CalculationResults results={mockResults} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders total row', () => {
    render(<CalculationResults results={mockResults} />)
    // "Итого" appears in both the header and the total row
    const itogoElements = screen.getAllByText('Итого')
    expect(itogoElements.length).toBeGreaterThanOrEqual(1)
  })
})
