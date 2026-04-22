/**
 * Tests for SearchByQueryTab
 * Story 71.7-FE: By-Query Product Ranking Tab
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { SearchByQueryResponse } from '@/types/search-analytics'

const mockUseSearchByQuery = vi.fn()
vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchByQuery: (...args: unknown[]) => mockUseSearchByQuery(...args),
}))

import { SearchByQueryTab } from '../components/SearchByQueryTab'

let queryClient: QueryClient

const mockData: SearchByQueryResponse = {
  query: 'платье',
  period: { from: '2026-03-01', to: '2026-03-06' },
  products: [
    {
      nmId: 11111111,
      vendorCode: 'ART-001',
      avgPosition: 5.2,
      totalImpressions: 5000,
      totalClicks: 200,
      avgCtr: 4.0,
      totalOrders: 15,
    },
    {
      nmId: 22222222,
      vendorCode: null,
      avgPosition: 25.7,
      totalImpressions: 8000,
      totalClicks: 350,
      avgCtr: 4.4,
      totalOrders: 25,
    },
  ],
  totalProducts: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  queryClient = createTestQueryClient()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderTab() {
  return render(<SearchByQueryTab from="2026-03-01" to="2026-03-06" />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

async function typeAndDebounce(input: HTMLElement, text: string) {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  await user.type(input, text)
  act(() => {
    vi.advanceTimersByTime(300)
  })
}

describe('SearchByQueryTab', () => {
  describe('no query entered', () => {
    it('shows placeholder when no query is entered', () => {
      mockUseSearchByQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false })
      renderTab()
      expect(
        screen.getByText('Введите поисковый запрос, чтобы увидеть рейтинг товаров')
      ).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('shows skeletons when loading after query input', async () => {
      mockUseSearchByQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
      const { container } = renderTab()

      const input = screen.getByPlaceholderText('Введите поисковый запрос (мин. 2 символа)')
      await typeAndDebounce(input, 'пл')

      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('error state', () => {
    it('shows destructive alert on error', async () => {
      mockUseSearchByQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true })
      renderTab()

      const input = screen.getByPlaceholderText('Введите поисковый запрос (мин. 2 символа)')
      await typeAndDebounce(input, 'пл')

      expect(screen.getByText(/Не удалось загрузить данные/)).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty message when no products found', async () => {
      mockUseSearchByQuery.mockReturnValue({
        data: { ...mockData, products: [], totalProducts: 0 },
        isLoading: false,
        isError: false,
      })
      renderTab()

      const input = screen.getByPlaceholderText('Введите поисковый запрос (мин. 2 символа)')
      await typeAndDebounce(input, 'пл')

      expect(screen.getByText(/Ваши товары не найдены по запросу/)).toBeInTheDocument()
    })
  })

  describe('data rendering', () => {
    it('shows totalProducts count and table rows', async () => {
      mockUseSearchByQuery.mockReturnValue({ data: mockData, isLoading: false, isError: false })
      renderTab()

      const input = screen.getByPlaceholderText('Введите поисковый запрос (мин. 2 символа)')
      await typeAndDebounce(input, 'пл')

      expect(screen.getByText(/Найдено товаров/)).toHaveTextContent('2')
      expect(screen.getByText('11111111')).toBeInTheDocument()
      expect(screen.getByText('22222222')).toBeInTheDocument()
    })
  })

  describe('clear button', () => {
    it('resets query and shows placeholder after clearing', async () => {
      mockUseSearchByQuery.mockReturnValue({ data: mockData, isLoading: false, isError: false })
      renderTab()

      const input = screen.getByPlaceholderText('Введите поисковый запрос (мин. 2 символа)')
      await typeAndDebounce(input, 'пл')

      // Data should be visible
      expect(screen.getByText('11111111')).toBeInTheDocument()

      // Click clear button
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      const clearBtn = screen.getByRole('button', { name: 'Очистить запрос' })
      await user.click(clearBtn)

      // Placeholder should return
      expect(
        screen.getByText('Введите поисковый запрос, чтобы увидеть рейтинг товаров')
      ).toBeInTheDocument()
    })
  })

  describe('hook params', () => {
    it('calls useSearchByQuery with empty string initially', () => {
      mockUseSearchByQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false })
      renderTab()
      expect(mockUseSearchByQuery).toHaveBeenCalledWith('', '2026-03-01', '2026-03-06')
    })
  })
})
