/**
 * Tests for SearchOrdersTab
 * Story 71.5-FE: Search Orders Tab
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

import { SearchOrdersTab } from '../components/SearchOrdersTab'

let queryClient: QueryClient

const mockData: SearchOrdersResponse = {
  period: { from: '2026-03-01', to: '2026-03-06' },
  groupBy: 'query',
  items: [
    { key: 'платье', totalOrders: 50, totalRevenue: 250000, uniqueProducts: 5 },
    { key: 'куртка', totalOrders: 30, totalRevenue: 180000, uniqueProducts: 3 },
  ],
  summary: { totalSearchOrders: 80, totalSearchRevenue: 430000, searchOrderShare: 12.5 },
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderTab() {
  return render(<SearchOrdersTab from="2026-03-01" to="2026-03-06" />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchOrdersTab', () => {
  describe('summary cards', () => {
    beforeEach(() => {
      mockUseSearchOrders.mockReturnValue({ data: mockData, isLoading: false, isError: false })
    })

    it('renders 3 summary cards with correct labels', () => {
      renderTab()
      expect(screen.getByText('Поисковые заказы')).toBeInTheDocument()
      expect(screen.getByText('Выручка от поиска')).toBeInTheDocument()
      expect(screen.getByText('Доля поисковых заказов')).toBeInTheDocument()
    })

    it('renders summary values formatted correctly', () => {
      renderTab()
      expect(screen.getByText('80')).toBeInTheDocument()
      expect(screen.getByText('430 000 ₽')).toBeInTheDocument()
      expect(screen.getByText('12.5%')).toBeInTheDocument()
    })
  })

  describe('table rendering', () => {
    beforeEach(() => {
      mockUseSearchOrders.mockReturnValue({ data: mockData, isLoading: false, isError: false })
    })

    it('renders table with 4 column headers', () => {
      renderTab()
      expect(screen.getByText('Запрос')).toBeInTheDocument()
      expect(screen.getByText('Заказы')).toBeInTheDocument()
      expect(screen.getByText('Выручка ₽')).toBeInTheDocument()
      expect(screen.getByText('Товаров')).toBeInTheDocument()
    })

    it('renders items in table rows', () => {
      renderTab()
      expect(screen.getByText('платье')).toBeInTheDocument()
      expect(screen.getByText('куртка')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeletons when loading', () => {
      mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false })
      const { container } = renderTab()
      const skeletons = container.querySelectorAll(
        '[class*="animate-pulse"], [data-slot="skeleton"]'
      )
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('empty state', () => {
    it('shows empty message when no items', () => {
      mockUseSearchOrders.mockReturnValue({
        data: { ...mockData, items: [] },
        isLoading: false,
        isError: false,
      })
      renderTab()
      expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows destructive alert on error', () => {
      mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true })
      renderTab()
      expect(screen.getByText(/Не удалось загрузить данные поисковых заказов/)).toBeInTheDocument()
    })
  })

  describe('missing summary', () => {
    it('renders table without summary cards when summary is undefined', () => {
      mockUseSearchOrders.mockReturnValue({
        data: { ...mockData, summary: undefined },
        isLoading: false,
        isError: false,
      })
      renderTab()
      // Table items still render
      expect(screen.getByText('платье')).toBeInTheDocument()
      // Summary card labels should NOT be present
      expect(screen.queryByText('Поисковые заказы')).not.toBeInTheDocument()
    })
  })

  describe('hook params', () => {
    it('calls useSearchOrders with correct params', () => {
      mockUseSearchOrders.mockReturnValue({ data: mockData, isLoading: false, isError: false })
      renderTab()
      expect(mockUseSearchOrders).toHaveBeenCalledWith('2026-03-01', '2026-03-06', {
        groupBy: 'query',
      })
    })
  })
})
