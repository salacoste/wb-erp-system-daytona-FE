import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GapsSummaryCards } from '../GapsSummaryCards'
import type { FinancialGapsResponse } from '@/types/financial-gaps'

const mockData: FinancialGapsResponse = {
  cabinet_id: 'cab-1',
  date_from: '2026-05-01',
  date_to: '2026-05-31',
  total_days: 31,
  existing_days: 28,
  missing_days: 3,
  coverage_percent: 90.3,
  missing_dates: [],
}

describe('GapsSummaryCards', () => {
  it('shows loading skeletons', () => {
    const { container } = render(<GapsSummaryCards data={undefined} isLoading={true} />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThanOrEqual(1)
  })

  it('renders coverage card with percentage', () => {
    render(<GapsSummaryCards data={mockData} isLoading={false} />)
    expect(screen.getByText('Покрытие')).toBeInTheDocument()
    // formatPercentage(90.3) => "90,3 %"
    expect(screen.getByText(/90,3/)).toBeInTheDocument()
  })

  it('renders total days card', () => {
    render(<GapsSummaryCards data={mockData} isLoading={false} />)
    expect(screen.getByText('Всего дней')).toBeInTheDocument()
    expect(screen.getByText('31')).toBeInTheDocument()
  })

  it('renders existing days card', () => {
    render(<GapsSummaryCards data={mockData} isLoading={false} />)
    expect(screen.getByText('Данные есть')).toBeInTheDocument()
    expect(screen.getByText('28')).toBeInTheDocument()
  })

  it('renders missing days card', () => {
    render(<GapsSummaryCards data={mockData} isLoading={false} />)
    expect(screen.getByText('Пропущено')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows dashes when data is undefined and not loading', () => {
    render(<GapsSummaryCards data={undefined} isLoading={false} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(4)
  })

  it('coverage card is neutral (not red) when there is no data — BD-31', () => {
    const { container } = render(<GapsSummaryCards data={undefined} isLoading={false} />)
    // No red-flash: coverage defaults to muted, and no card should be red.
    expect(container.querySelector('.bg-red-500')).toBeNull()
    expect(container.querySelector('.bg-muted-foreground')).toBeInTheDocument()
  })

  it('uses red color for missing days > 0', () => {
    const { container } = render(<GapsSummaryCards data={mockData} isLoading={false} />)
    // The "Пропущено" card should have bg-red-500
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument()
  })

  it('uses gray color when missing days is 0', () => {
    const noGaps = { ...mockData, missing_days: 0 }
    const { container } = render(<GapsSummaryCards data={noGaps} isLoading={false} />)
    expect(container.querySelector('.bg-muted-foreground')).toBeInTheDocument()
  })
})
