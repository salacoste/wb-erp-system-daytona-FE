/**
 * Tests for SearchOrdersChart
 * Story 117.1-FE: Search Orders time-series chart
 *
 * DOM-query harness (no vi.mock('recharts')) — jsdom renders
 * .recharts-responsive-container. Pattern per AdCostDiscrepancyChart.test.tsx.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { SearchOrdersResponse } from '@/types/search-analytics'

const mockUseSearchOrders = vi.fn()
vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: (...args: unknown[]) => mockUseSearchOrders(...args),
}))

import { SearchOrdersChart, toChartRows, formatDayTick } from '../components/SearchOrdersChart'
import type { SearchOrderItem } from '@/types/search-analytics'

let queryClient: QueryClient

const dayData: SearchOrdersResponse = {
  period: { from: '2026-03-01', to: '2026-03-03' },
  groupBy: 'day',
  items: [
    { key: '2026-03-01', totalOrders: 50, uniqueQueries: 20, uniqueProducts: 10 },
    { key: '2026-03-02', totalOrders: 65, uniqueQueries: 24, uniqueProducts: 12 },
    { key: '2026-03-03', totalOrders: 40, uniqueQueries: 18, uniqueProducts: 9 },
  ],
  summary: { totalSearchOrders: 155, searchOrderShare: 38.0 },
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderChart() {
  return render(<SearchOrdersChart from="2026-03-01" to="2026-03-03" />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchOrdersChart', () => {
  it('renders the chart title in every state', () => {
    mockUseSearchOrders.mockReturnValue({ data: dayData, isLoading: false, isError: false })
    renderChart()
    expect(screen.getByText('Динамика поисковых заказов по дням')).toBeInTheDocument()
  })

  it('shows a skeleton while loading', () => {
    mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { container } = renderChart()
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows a non-destructive empty message when there are no day items', () => {
    mockUseSearchOrders.mockReturnValue({
      data: { ...dayData, items: [] },
      isLoading: false,
      isError: false,
    })
    renderChart()
    expect(screen.getByText('Нет ежедневных данных за выбранный период')).toBeInTheDocument()
  })

  it('shows a contained error message on fetch error (does not throw)', () => {
    mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    renderChart()
    expect(screen.getByText('Не удалось загрузить динамику поисковых заказов')).toBeInTheDocument()
  })

  it('renders the recharts ResponsiveContainer + accessible img role when data present', () => {
    mockUseSearchOrders.mockReturnValue({ data: dayData, isLoading: false, isError: false })
    const { container } = renderChart()
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
    const chart = screen.getByRole('img')
    expect(chart).toHaveAttribute(
      'aria-label',
      expect.stringContaining('Динамика поисковых заказов по дням')
    )
  })

  it('fetches with groupBy=day (independent from the query-grouped overview)', () => {
    mockUseSearchOrders.mockReturnValue({ data: dayData, isLoading: false, isError: false })
    renderChart()
    expect(mockUseSearchOrders).toHaveBeenCalledWith('2026-03-01', '2026-03-03', { groupBy: 'day' })
  })

  // F-1 (1st-pass): numeric keys must be COERCED (String), not filtered out. A
  // typeof filter would fail-closed and render the empty state despite real data.
  it('renders the chart (not the empty state) when day keys are numeric', () => {
    const numericKeyData: SearchOrdersResponse = {
      ...dayData,
      items: [
        { key: 20260301, totalOrders: 12, uniqueQueries: 5 },
        { key: 20260302, totalOrders: 18, uniqueQueries: 7 },
      ],
    }
    mockUseSearchOrders.mockReturnValue({ data: numericKeyData, isLoading: false, isError: false })
    const { container } = renderChart()
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
    expect(screen.queryByText('Нет ежедневных данных за выбранный период')).not.toBeInTheDocument()
  })
})

// 2nd-pass F-2: direct pure-function tests prove coercion OUTPUT (not just "not empty").
describe('toChartRows', () => {
  it('coerces string date keys to chart rows', () => {
    const items: SearchOrderItem[] = [{ key: '2026-03-01', totalOrders: 12 }]
    expect(toChartRows(items)).toEqual([{ date: '2026-03-01', totalOrders: 12 }])
  })

  it('coerces numeric keys via String (does NOT drop them) — F-1 1st-pass', () => {
    const items: SearchOrderItem[] = [{ key: 20260301, totalOrders: 12 }]
    expect(toChartRows(items)).toEqual([{ date: '20260301', totalOrders: 12 }])
  })

  it('drops null/undefined keys rather than fabricating "null"/"undefined" labels — F-3 2nd-pass', () => {
    const items = [
      { key: '2026-03-01', totalOrders: 12 },
      { key: null, totalOrders: 5 },
      { key: undefined, totalOrders: 3 },
    ] as unknown as SearchOrderItem[]
    expect(toChartRows(items)).toEqual([{ date: '2026-03-01', totalOrders: 12 }])
  })
})

describe('formatDayTick', () => {
  it('formats ISO date to DD.MM', () => {
    expect(formatDayTick('2026-03-01')).toBe('01.03')
  })

  it('formats compact 8-digit YYYYMMDD to DD.MM — F-1 2nd-pass defensive', () => {
    expect(formatDayTick('20260301')).toBe('01.03')
  })

  it('passes through non-date strings unchanged', () => {
    expect(formatDayTick('платье')).toBe('платье')
  })

  // 3rd-pass F-5: an ISO datetime must NOT yield a garbage "01T00:00:00.03" label —
  // the day-part 2-digit guard makes it fall through to passthrough instead.
  it('does not mangle an ISO datetime key (falls through to passthrough)', () => {
    expect(formatDayTick('2026-03-01T00:00:00')).toBe('2026-03-01T00:00:00')
  })
})
