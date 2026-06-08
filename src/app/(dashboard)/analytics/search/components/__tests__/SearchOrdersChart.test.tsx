import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SearchOrdersChart, formatDayTick, toChartRows } from '../SearchOrdersChart'
import type { SearchOrderItem, SearchOrdersResponse } from '@/types/search-analytics'

vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: vi.fn(),
}))

import { useSearchOrders } from '@/hooks/use-search-analytics'

const mockUseSearchOrders = vi.mocked(useSearchOrders)

describe('formatDayTick', () => {
  it('formats ISO date YYYY-MM-DD to DD.MM', () => {
    expect(formatDayTick('2026-03-15')).toBe('15.03')
  })

  it('passes through non-date strings', () => {
    expect(formatDayTick('some-label')).toBe('some-label')
  })

  it('handles 8-digit YYYYMMDD strings', () => {
    expect(formatDayTick('20260315')).toBe('15.03')
  })

  it('does not parse ISO datetime strings as date', () => {
    // "2026-03-01T00:00:00" has a day part "01T00:00:00" which fails the 2-digit regex
    const result = formatDayTick('2026-03-01T00:00:00')
    expect(result).toBe('2026-03-01T00:00:00')
  })
})

describe('toChartRows', () => {
  it('maps items to chart rows with string keys', () => {
    const items: SearchOrderItem[] = [
      { key: '2026-03-15', totalOrders: 10 },
      { key: '2026-03-16', totalOrders: 20 },
    ]
    const rows = toChartRows(items)
    expect(rows).toEqual([
      { date: '2026-03-15', totalOrders: 10 },
      { date: '2026-03-16', totalOrders: 20 },
    ])
  })

  it('filters out null/undefined keys', () => {
    const items: SearchOrderItem[] = [
      { key: '2026-03-15', totalOrders: 10 },
      { key: null as unknown as string, totalOrders: 5 },
    ]
    const rows = toChartRows(items)
    expect(rows).toHaveLength(1)
  })

  it('coerces numeric keys to strings', () => {
    const items: SearchOrderItem[] = [{ key: 20260315, totalOrders: 8 }]
    const rows = toChartRows(items)
    expect(rows[0].date).toBe('20260315')
  })
})

describe('SearchOrdersChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton', () => {
    mockUseSearchOrders.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersChart from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message on fetch failure', () => {
    mockUseSearchOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersChart from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('Не удалось загрузить динамику поисковых заказов')).toBeInTheDocument()
  })

  it('shows empty message when no daily data', () => {
    mockUseSearchOrders.mockReturnValue({
      data: {
        period: { from: '2026-03-01', to: '2026-03-31' },
        groupBy: 'day',
        items: [],
        summary: {},
      } as SearchOrdersResponse,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersChart from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('Нет ежедневных данных за выбранный период')).toBeInTheDocument()
  })

  it('renders chart title', () => {
    mockUseSearchOrders.mockReturnValue({
      data: {
        period: { from: '2026-03-01', to: '2026-03-31' },
        groupBy: 'day',
        items: [{ key: '2026-03-15', totalOrders: 10 }],
        summary: {},
      } as SearchOrdersResponse,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersChart from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('Динамика поисковых заказов по дням')).toBeInTheDocument()
  })
})
