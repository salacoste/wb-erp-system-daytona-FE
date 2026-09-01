import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@/test/utils/test-utils'
import {
  SEARCH_ORDERS_CHART_DATA_TABLE_ID,
  SearchOrdersChart,
  formatDayTick,
  formatSearchOrdersTooltipLabel,
  formatSearchOrdersTooltipValue,
  toChartRows,
} from '../SearchOrdersChart'
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
        summary: { totalSearchOrders: 0, searchOrderShare: null },
      } as SearchOrdersResponse,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersChart from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('Нет ежедневных данных за выбранный период')).toBeInTheDocument()
  })

  it('exposes exact period, units, series, every daily value, and tooltip precision', () => {
    mockUseSearchOrders.mockReturnValue({
      data: {
        period: { from: '2026-03-01', to: '2026-03-31' },
        groupBy: 'day',
        items: [
          { key: '2026-03-15', totalOrders: 12_345 },
          { key: '2026-03-16', totalOrders: 67 },
        ],
        summary: {},
      } as SearchOrdersResponse,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersChart from="2026-03-01" to="2026-03-31" />)
    const chart = screen.getByRole('img', {
      name: 'Динамика поисковых заказов по дням: 2 дня',
    })
    expect(chart).toHaveAttribute('aria-describedby', SEARCH_ORDERS_CHART_DATA_TABLE_ID)

    const table = screen.getByRole('table', {
      name: 'Данные динамики поисковых заказов; период: 2026-03-01 — 2026-03-31; единицы: заказы, шт.',
    })
    expect(table).toHaveAttribute('id', SEARCH_ORDERS_CHART_DATA_TABLE_ID)
    expect(within(table).getByRole('columnheader', { name: 'Дата' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'Заказы, шт.' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: '2026-03-15' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '12 345' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: '2026-03-16' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '67' })).toBeInTheDocument()
    expect(formatSearchOrdersTooltipLabel('2026-03-15')).toBe('15.03')
    expect(formatSearchOrdersTooltipValue(12_345)).toBe('12 345')
  })
})
