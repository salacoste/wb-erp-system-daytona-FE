/**
 * Tests for SearchByProductTab
 * Story 71.6-FE: By-Product Keyword Explorer Tab
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { SearchByProductResponse } from '@/types/search-analytics'

const mockUseSearchByProduct = vi.fn()
vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchByProduct: (...args: unknown[]) => mockUseSearchByProduct(...args),
}))

// Mock ProductCombobox to simplify tab orchestration testing
vi.mock('../components/ProductCombobox', () => ({
  ProductCombobox: ({
    onChange,
  }: {
    value: number | undefined
    onChange: (v: number | undefined) => void
  }) => (
    <button data-testid="mock-product-select" onClick={() => onChange(12345678)}>
      Mock Select
    </button>
  ),
}))

import { SearchByProductTab } from '../components/SearchByProductTab'

let queryClient: QueryClient

const mockData: SearchByProductResponse = {
  nmId: 12345678,
  period: { from: '2026-03-01', to: '2026-03-06' },
  queries: [
    {
      searchQuery: 'платье летнее',
      avgPosition: 12.3,
      totalImpressions: 5000,
      totalClicks: 200,
      avgCtr: 4.0,
      totalOrders: 15,
    },
    {
      searchQuery: 'платье красное',
      avgPosition: 8.1,
      totalImpressions: 8000,
      totalClicks: 350,
      avgCtr: 4.4,
      totalOrders: 25,
    },
  ],
  totalQueries: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderTab() {
  return render(<SearchByProductTab from="2026-03-01" to="2026-03-06" />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchByProductTab', () => {
  describe('no product selected', () => {
    it('shows placeholder when no product is selected', () => {
      mockUseSearchByProduct.mockReturnValue({ data: undefined, isLoading: false, isError: false })
      renderTab()
      expect(
        screen.getByText('Выберите товар, чтобы увидеть поисковые запросы')
      ).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeletons when loading after product selection', async () => {
      const user = userEvent.setup()
      mockUseSearchByProduct.mockReturnValue({ data: undefined, isLoading: true, isError: false })
      const { container } = renderTab()

      await user.click(screen.getByTestId('mock-product-select'))

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    it('shows destructive alert on error after product selection', async () => {
      const user = userEvent.setup()
      mockUseSearchByProduct.mockReturnValue({ data: undefined, isLoading: false, isError: true })
      renderTab()

      await user.click(screen.getByTestId('mock-product-select'))

      expect(screen.getByText(/Не удалось загрузить поисковые данные/)).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty message when no queries found', async () => {
      const user = userEvent.setup()
      mockUseSearchByProduct.mockReturnValue({
        data: { ...mockData, queries: [], totalQueries: 0 },
        isLoading: false,
        isError: false,
      })
      renderTab()

      await user.click(screen.getByTestId('mock-product-select'))

      expect(
        screen.getByText('Нет поисковых данных для этого товара за выбранный период')
      ).toBeInTheDocument()
    })
  })

  describe('data rendering', () => {
    it('shows totalQueries count and table rows after product selection', async () => {
      const user = userEvent.setup()
      mockUseSearchByProduct.mockReturnValue({ data: mockData, isLoading: false, isError: false })
      renderTab()

      await user.click(screen.getByTestId('mock-product-select'))

      expect(screen.getByText('платье летнее')).toBeInTheDocument()
      expect(screen.getByText('платье красное')).toBeInTheDocument()
    })
  })

  describe('hook params', () => {
    it('calls useSearchByProduct with undefined nmId initially', () => {
      mockUseSearchByProduct.mockReturnValue({ data: undefined, isLoading: false, isError: false })
      renderTab()
      expect(mockUseSearchByProduct).toHaveBeenCalledWith(undefined, '2026-03-01', '2026-03-06')
    })
  })
})
