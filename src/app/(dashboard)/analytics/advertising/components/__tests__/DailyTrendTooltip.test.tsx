/**
 * Tests for DailyTrendTooltip component
 * Tests rendering with active/inactive states, series filtering, and value formatting.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { DailyTrendTooltip } from '../DailyTrendTooltip'
import type { AdvertisingDailyItem } from '@/types/advertising-analytics'

function makeDailyItem(overrides: Partial<AdvertisingDailyItem> = {}): AdvertisingDailyItem {
  return {
    date: '2026-03-08',
    spend: 1500,
    views: 10000,
    clicks: 300,
    orders: 25,
    ctr: 3.0,
    cpc: 5.0,
    revenue_attributed: 50000,
    roas: 3.33,
    ...overrides,
  }
}

const allSeries = ['spend', 'views', 'clicks', 'orders', 'roas']

describe('DailyTrendTooltip', () => {
  it('returns null when active is false', () => {
    const { container } = render(
      <DailyTrendTooltip
        active={false}
        payload={[
          {
            dataKey: 'spend',
            value: 1500,
            payload: makeDailyItem(),
          },
        ]}
        visibleSeries={allSeries}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when payload is empty', () => {
    const { container } = render(
      <DailyTrendTooltip active={true} payload={[]} visibleSeries={allSeries} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('returns null when payload is undefined', () => {
    const { container } = render(
      <DailyTrendTooltip active={true} payload={undefined} visibleSeries={allSeries} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders date header in Russian format', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[
          { dataKey: 'spend', value: 1500, payload: makeDailyItem({ date: '2026-03-08' }) },
        ]}
        visibleSeries={allSeries}
      />
    )
    // formatDailyTooltipDate renders Russian weekday + date
    expect(screen.getByText(/марта/)).toBeInTheDocument()
  })

  it('renders all visible series labels', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[{ dataKey: 'spend', value: 1500, payload: makeDailyItem() }]}
        visibleSeries={allSeries}
      />
    )
    expect(screen.getByText('Расходы')).toBeInTheDocument()
    expect(screen.getByText('Показы')).toBeInTheDocument()
    expect(screen.getByText('Клики')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('ROAS')).toBeInTheDocument()
  })

  it('hides series not in visibleSeries', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[{ dataKey: 'spend', value: 1500, payload: makeDailyItem() }]}
        visibleSeries={['spend', 'orders']}
      />
    )
    expect(screen.getByText('Расходы')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.queryByText('Показы')).not.toBeInTheDocument()
    expect(screen.queryByText('Клики')).not.toBeInTheDocument()
  })

  it('formats ROAS with "x" suffix', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[{ dataKey: 'spend', value: 1500, payload: makeDailyItem({ roas: 2.5 }) }]}
        visibleSeries={['roas']}
      />
    )
    expect(screen.getByText('2.50x')).toBeInTheDocument()
  })

  it('renders "—" for null ROAS', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[
          {
            dataKey: 'spend',
            value: 1500,
            payload: makeDailyItem({ roas: null }),
          },
        ]}
        visibleSeries={['roas']}
      />
    )
    // The tooltip container contains "—" for the null ROAS value
    const tooltip = document.querySelector('.shadow-lg')
    expect(tooltip?.textContent).toContain('—')
  })

  it('formats spend as currency', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[{ dataKey: 'spend', value: 1500, payload: makeDailyItem({ spend: 1500 }) }]}
        visibleSeries={['spend']}
      />
    )
    // formatCurrency renders Russian locale with ruble sign
    const tooltip = document.querySelector('.shadow-lg')
    expect(tooltip?.textContent).toContain('₽')
  })

  it('formats numeric values with Russian locale', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[{ dataKey: 'orders', value: 25, payload: makeDailyItem({ orders: 1234 }) }]}
        visibleSeries={['orders']}
      />
    )
    // The tooltip renders the value via toLocaleString('ru-RU')
    const tooltip = document.querySelector('.shadow-lg')
    expect(tooltip?.textContent).toMatch(/1\s*234/)
  })

  it('renders colored dots for each visible series', () => {
    render(
      <DailyTrendTooltip
        active={true}
        payload={[{ dataKey: 'spend', value: 1500, payload: makeDailyItem() }]}
        visibleSeries={['spend']}
      />
    )
    const dot = document.querySelector('.rounded-full')
    expect(dot).toBeInTheDocument()
  })
})
