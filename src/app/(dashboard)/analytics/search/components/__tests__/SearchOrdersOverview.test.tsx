import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SearchOrdersOverview } from '../SearchOrdersOverview'
import type { SearchOrdersResponse } from '@/types/search-analytics'

vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: vi.fn(),
}))

import { useSearchOrders } from '@/hooks/use-search-analytics'

const mockUseSearchOrders = vi.mocked(useSearchOrders)

const mockData: SearchOrdersResponse = {
  period: { from: '2026-03-01', to: '2026-03-31' },
  groupBy: 'query',
  items: [
    { key: 'футболка', totalOrders: 15, uniqueProducts: 3 },
    { key: 'джинсы', totalOrders: 8, uniqueProducts: 2 },
  ],
  summary: {
    totalSearchOrders: 23,
    searchOrderShare: 65.5,
  },
}

describe('SearchOrdersOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton', () => {
    mockUseSearchOrders.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersOverview from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getAllByRole('status').length).toBeGreaterThanOrEqual(1)
  })

  it('shows error alert on fetch failure', () => {
    mockUseSearchOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersOverview from="2026-03-01" to="2026-03-31" />)
    expect(
      screen.getByText(
        'Не удалось загрузить данные поисковых заказов. Попробуйте обновить страницу.'
      )
    ).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    mockUseSearchOrders.mockReturnValue({
      data: { ...mockData, items: [] },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersOverview from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('renders summary cards and table with data', () => {
    mockUseSearchOrders.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersOverview from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('Поисковые заказы')).toBeInTheDocument()
    expect(screen.getByText('Доля поисковых заказов')).toBeInTheDocument()
  })

  it('renders total search orders count from summary', () => {
    mockUseSearchOrders.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSearchOrders>)
    render(<SearchOrdersOverview from="2026-03-01" to="2026-03-31" />)
    expect(screen.getByText('23')).toBeInTheDocument()
  })
})
