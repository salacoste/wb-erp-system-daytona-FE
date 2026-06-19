import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnalyticsMarketingWidgets } from '../AnalyticsMarketingWidgets'

vi.mock('../SearchPerformanceWidget', () => ({
  SearchPerformanceWidget: ({ from, to }: { from: string; to: string }) => (
    <div data-testid="search-widget">
      {from}:{to}
    </div>
  ),
}))

vi.mock('../MarketingKpiCard', () => ({
  MarketingKpiCard: ({ from, to }: { from: string; to: string }) => (
    <div data-testid="marketing-kpi">
      {from}:{to}
    </div>
  ),
}))

describe('AnalyticsMarketingWidgets', () => {
  it('converts selected ISO week to API date range before querying marketing widgets', () => {
    render(<AnalyticsMarketingWidgets selectedWeek="2026-W24" />)

    expect(screen.getByTestId('search-widget')).toHaveTextContent('2026-06-08:2026-06-14')
    expect(screen.getByTestId('marketing-kpi')).toHaveTextContent('2026-06-08:2026-06-14')
  })

  it('renders nothing until a selected week exists', () => {
    const { container } = render(<AnalyticsMarketingWidgets selectedWeek={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
