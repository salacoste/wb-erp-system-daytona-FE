import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkuBreakdownTable } from '../SkuBreakdownTable'
import type { SkuAccuracy } from '@/types/ai/forecast-accuracy'

const mockRows: SkuAccuracy[] = [
  { nmId: 123456, mape: 12.3, mae: 2.1, count: 8 },
  { nmId: 789012, mape: null, mae: null, count: 3 },
  { nmId: 345678, mape: 25.0, mae: 4.5, count: 15 },
]

describe('SkuBreakdownTable', () => {
  it('renders table headers', () => {
    render(<SkuBreakdownTable rows={mockRows} />)
    expect(screen.getByText('nmId')).toBeInTheDocument()
    expect(screen.getByText('MAPE')).toBeInTheDocument()
    expect(screen.getByText('MAE')).toBeInTheDocument()
    expect(screen.getByText('Кол-во')).toBeInTheDocument()
  })

  it('renders nmId values as strings (anti-pattern #10)', () => {
    render(<SkuBreakdownTable rows={mockRows} />)
    expect(screen.getByText('123456')).toBeInTheDocument()
    expect(screen.getByText('789012')).toBeInTheDocument()
    expect(screen.getByText('345678')).toBeInTheDocument()
  })

  it('shows dashes for null values', () => {
    render(<SkuBreakdownTable rows={mockRows} />)
    // Row 789012 has null mape and mae
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('shows empty message when no rows', () => {
    render(<SkuBreakdownTable rows={[]} />)
    expect(screen.getByText('Нет данных по SKU')).toBeInTheDocument()
  })

  it('limits display to 20 rows', () => {
    const manyRows: SkuAccuracy[] = Array.from({ length: 25 }, (_, i) => ({
      nmId: 100000 + i,
      mape: 10,
      mae: 2,
      count: 5,
    }))
    render(<SkuBreakdownTable rows={manyRows} />)
    // Only 20 rows rendered (nmId 100000..100019)
    expect(screen.getByText('100000')).toBeInTheDocument()
    expect(screen.queryByText('100024')).not.toBeInTheDocument()
  })
})
