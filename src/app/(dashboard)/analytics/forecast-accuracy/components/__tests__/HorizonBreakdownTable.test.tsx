import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HorizonBreakdownTable } from '../HorizonBreakdownTable'
import type { HorizonAccuracy } from '@/types/ai/forecast-accuracy'

const mockRows: HorizonAccuracy[] = [
  { horizonDays: 7, mape: 15.2, mae: 3.5, count: 45 },
  { horizonDays: 14, mape: 22.1, mae: 5.8, count: 20 },
  { horizonDays: 28, mape: null, mae: null, count: 10 },
]

describe('HorizonBreakdownTable', () => {
  it('renders table headers', () => {
    render(<HorizonBreakdownTable rows={mockRows} />)
    expect(screen.getByText('Горизонт (дни)')).toBeInTheDocument()
    expect(screen.getByText('MAPE')).toBeInTheDocument()
    expect(screen.getByText('MAE')).toBeInTheDocument()
    expect(screen.getByText('Кол-во')).toBeInTheDocument()
  })

  it('renders horizon day values', () => {
    render(<HorizonBreakdownTable rows={mockRows} />)
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })

  it('shows dashes for null MAPE/MAE values', () => {
    render(<HorizonBreakdownTable rows={mockRows} />)
    // Row 28 has null mape and mae → two dashes in that row
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(2)
  })

  it('renders count column values', () => {
    render(<HorizonBreakdownTable rows={mockRows} />)
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows empty message when no rows', () => {
    render(<HorizonBreakdownTable rows={[]} />)
    expect(screen.getByText('Нет данных по горизонтам')).toBeInTheDocument()
  })
})
