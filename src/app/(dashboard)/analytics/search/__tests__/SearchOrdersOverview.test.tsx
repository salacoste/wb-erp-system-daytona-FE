/**
 * Tests for SearchOrdersOverview
 * Story 71.5-FE: Search Orders Tab (summary + table)
 * Story 117.1-FE: assertions migrated here when the tab body was extracted from
 * SearchOrdersTab into SearchOrdersOverview (orchestrator split for Pattern 1).
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

import { SearchOrdersOverview } from '../components/SearchOrdersOverview'

let queryClient: QueryClient

const mockData: SearchOrdersResponse = {
  period: { from: '2026-03-01', to: '2026-03-06' },
  groupBy: 'query',
  items: [
    { key: 'платье', totalOrders: 50, uniqueProducts: 10 },
    { key: 'куртка', totalOrders: 30, uniqueProducts: 5 },
  ],
  summary: {
    totalSearchOrders: 150,
    searchOrderShare: 42.5,
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderOverview() {
  return render(<SearchOrdersOverview from="2026-03-01" to="2026-03-06" />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchOrdersOverview', () => {
  describe('summary cards', () => {
    beforeEach(() => {
      mockUseSearchOrders.mockReturnValue({ data: mockData, isLoading: false, isError: false })
    })

    // Story 91.1-FE: revenue card removed (was 3 cards, now 2)
    it('renders 2 summary cards with correct labels', () => {
      renderOverview()
      expect(screen.getByText('Поисковые заказы')).toBeInTheDocument()
      expect(screen.getByText('Доля поисковых заказов')).toBeInTheDocument()
    })

    it('renders summary values formatted correctly', () => {
      renderOverview()
      expect(screen.getByText(/150/)).toBeInTheDocument()
      expect(screen.getByText(/42[.,]5/)).toBeInTheDocument()
    })

    // iter-59: pin the Russian-locale percent — share must render "42,5 %" (comma + separator),
    // NOT the old "42.5%" (dot, glued). The loose `/42[.,]5/` above can't catch the dot regression.
    it('formats the order-share percent in Russian locale (comma, not dot)', () => {
      renderOverview()
      const share = screen.getByText(/42,5/)
      expect(share).toBeInTheDocument()
      expect(share.textContent ?? '').not.toMatch(/42\.5/)
      expect(share.textContent ?? '').toMatch(/42,5\s%/) // \s matches the NBSP separator
    })
  })

  // F-6 (Request #176 / Story 111.6 AC8): >100% share inflation Info indicator
  describe('inflation indicator', () => {
    function withSummary(summary: SearchOrdersResponse['summary']) {
      mockUseSearchOrders.mockReturnValue({
        data: { ...mockData, summary },
        isLoading: false,
        isError: false,
      })
    }

    it('shows the Info indicator for a >100% inflated share, preserving the raw value', () => {
      withSummary({
        totalSearchOrders: 10,
        searchOrderShare: 176.38,
        searchOrderShareInflated: true,
      })
      renderOverview()
      expect(screen.getByLabelText(/WB засчитывает один заказ/)).toBeInTheDocument()
      expect(screen.getByText(/176[.,]4/)).toBeInTheDocument() // raw, not clamped
    })

    it('hides the indicator when not inflated', () => {
      withSummary({
        totalSearchOrders: 10,
        searchOrderShare: 42.5,
        searchOrderShareInflated: false,
      })
      renderOverview()
      expect(screen.queryByLabelText(/WB засчитывает один заказ/)).not.toBeInTheDocument()
    })

    it('hides the indicator when share is null even if inflated=true (no warning next to —)', () => {
      withSummary({ totalSearchOrders: 0, searchOrderShare: null, searchOrderShareInflated: true })
      renderOverview()
      expect(screen.queryByLabelText(/WB засчитывает один заказ/)).not.toBeInTheDocument()
    })
  })

  describe('table rendering', () => {
    beforeEach(() => {
      mockUseSearchOrders.mockReturnValue({ data: mockData, isLoading: false, isError: false })
    })

    // Story 91.1-FE: revenue column removed (was 4 headers, now 3)
    it('renders table with 3 column headers', () => {
      renderOverview()
      expect(screen.getByText('Запрос')).toBeInTheDocument()
      expect(screen.getByText('Заказы')).toBeInTheDocument()
      expect(screen.getByText('Товаров')).toBeInTheDocument()
    })

    it('renders items in table rows', () => {
      renderOverview()
      expect(screen.getByText('платье')).toBeInTheDocument()
      expect(screen.getByText('куртка')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeletons when loading', () => {
      mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: true, isError: false })
      const { container } = renderOverview()
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
      renderOverview()
      expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('shows destructive alert on error', () => {
      mockUseSearchOrders.mockReturnValue({ data: undefined, isLoading: false, isError: true })
      renderOverview()
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
      renderOverview()
      // Table items still render
      expect(screen.getByText('платье')).toBeInTheDocument()
      // Summary card labels should NOT be present
      expect(screen.queryByText('Поисковые заказы')).not.toBeInTheDocument()
    })
  })

  describe('hook params', () => {
    it('calls useSearchOrders with groupBy=query', () => {
      mockUseSearchOrders.mockReturnValue({ data: mockData, isLoading: false, isError: false })
      renderOverview()
      expect(mockUseSearchOrders).toHaveBeenCalledWith('2026-03-01', '2026-03-06', {
        groupBy: 'query',
      })
    })
  })
})
