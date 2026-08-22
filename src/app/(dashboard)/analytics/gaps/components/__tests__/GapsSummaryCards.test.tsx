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
    expect(container.querySelector('.bg-status-error')).toBeNull()
    expect(container.querySelector('.bg-muted')).toBeInTheDocument()
  })

  it('uses error color for missing days > 0', () => {
    const { container } = render(<GapsSummaryCards data={mockData} isLoading={false} />)
    // The "Пропущено" card chip uses the error status pair
    expect(
      container.querySelector('.bg-status-error.text-status-error-foreground')
    ).toBeInTheDocument()
  })

  it('uses muted color when missing days is 0 (neutral-zero)', () => {
    const noGaps = { ...mockData, missing_days: 0 }
    const { container } = render(<GapsSummaryCards data={noGaps} isLoading={false} />)
    expect(container.querySelector('.bg-muted.text-foreground')).toBeInTheDocument()
  })

  it('coverage chip collapses to 4 distinct token pairs across tiers (tier-collapse guard)', () => {
    const chipClassesOf = (data: FinancialGapsResponse | undefined): string[] => {
      const { container } = render(<GapsSummaryCards data={data} isLoading={false} />)
      return Array.from(container.querySelectorAll('div.rounded-lg.p-3')).map(
        chip => chip.className
      )
    }

    const noData = chipClassesOf(undefined)
    const success = chipClassesOf({ ...mockData, coverage_percent: 90 })
    const warning = chipClassesOf({ ...mockData, coverage_percent: 75 })
    const error = chipClassesOf({ ...mockData, coverage_percent: 50 })

    // Each variant renders a coverage chip as the first card
    expect(noData[0]).toContain('bg-muted text-foreground')
    expect(success[0]).toContain('bg-status-success text-status-success-foreground')
    expect(warning[0]).toContain('bg-status-warning text-status-warning-foreground')
    expect(error[0]).toContain('bg-status-error text-status-error-foreground')

    // All 4 coverage chips are pairwise distinct (no tier collapse)
    const coverageChips = [noData[0], success[0], warning[0], error[0]]
    expect(new Set(coverageChips).size).toBe(4)

    // No legacy palette leaks anywhere in the card set
    for (const chips of [noData, success, warning, error]) {
      for (const chip of chips) {
        expect(chip).not.toMatch(/\b(?:bg|text)-(?:red|green|yellow|blue|gray)-\d{2,3}\b/)
      }
    }
  })
})
