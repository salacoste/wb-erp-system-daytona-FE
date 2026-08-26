/**
 * Tests for SearchPageContent
 * Story 71.4-FE: Search Page Scaffold & Route Registration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { JamStatusResponse } from '@/types/cabinet'
import { ROUTES } from '@/lib/routes'

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  // Dual-form: RequireJam destructures `useAuthStore()` (object) while SearchSellerBadge
  // calls `useAuthStore(auth => auth.cabinetId)` (selected value). Honour both.
  useAuthStore: vi.fn((selector?: (s: { cabinetId: string }) => unknown) => {
    const state = { cabinetId: 'cab-1' }
    return selector ? selector(state) : state
  }),
}))

// Story 117.3-FE: header now renders SearchSellerBadge → stub the hook so the page
// tests stay deterministic and don't fire a real seller-info fetch.
vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: () => ({ data: undefined }),
}))

// Story 119.2-FE Pass-2 P2-5: useSearchByQuery converted to `vi.fn` so the
// initialQuery auto-search test can capture its call arguments. A future
// refactor that pre-fills the input but forgets to seed `debouncedQuery` would
// pass the value-match assertion while silently breaking auto-search; this
// call-capture is the load-bearing regression guard.
vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
  useSearchByProduct: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
  useSearchByQuery: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: undefined, isLoading: false }),
}))

import { useJamStatus } from '@/hooks/useJamStatus'
import { useSearchByQuery } from '@/hooks/use-search-analytics'
import { SearchPageContent } from '../components/SearchPageContent'

const mockedUseJamStatus = vi.mocked(useJamStatus)
const mockedUseSearchByQuery = vi.mocked(useSearchByQuery)
let queryClient: QueryClient

const mockJamData: JamStatusResponse = {
  tier: 'advanced',
  available: true,
  searchTextsLimit: 100,
  checkedAt: '2026-03-06T12:00:00.000Z',
  probeCallsMade: 2,
}

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

function renderPage(props?: { initialQuery?: string }) {
  return render(<SearchPageContent initialQuery={props?.initialQuery} />, {
    wrapper: createQueryWrapper(queryClient),
  })
}

describe('SearchPageContent', () => {
  describe('route constant', () => {
    it('ROUTES.ANALYTICS.SEARCH equals /analytics/search', () => {
      expect(ROUTES.ANALYTICS.SEARCH).toBe('/analytics/search')
    })
  })

  describe('page rendering', () => {
    beforeEach(() => {
      mockedUseJamStatus.mockReturnValue({
        data: mockJamData,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)
    })

    it('renders page title', () => {
      renderPage()
      expect(screen.getByText('Поисковая аналитика')).toBeInTheDocument()
    })

    it('renders page subtitle', () => {
      renderPage()
      expect(screen.getByText('Анализ поисковых запросов, позиций и заказов')).toBeInTheDocument()
    })

    it('renders 3 tab triggers', () => {
      renderPage()
      expect(screen.getByRole('tab', { name: 'Заказы' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'По товарам' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'По запросам' })).toBeInTheDocument()
    })

    it('Заказы tab is default active', () => {
      renderPage()
      const ordersTab = screen.getByRole('tab', { name: 'Заказы' })
      expect(ordersTab).toHaveAttribute('aria-selected', 'true')
    })

    it('switches tabs when clicking another tab', async () => {
      const user = userEvent.setup()
      renderPage()
      const byProductTab = screen.getByRole('tab', { name: 'По товарам' })
      await user.click(byProductTab)
      expect(byProductTab).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tab', { name: 'Заказы' })).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('initialQuery prop (Story 119.2-FE Pass-1 F-1)', () => {
    beforeEach(() => {
      mockedUseJamStatus.mockReturnValue({
        data: mockJamData,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)
    })

    it('defaults to by-query tab and pre-populates input when initialQuery is provided', () => {
      renderPage({ initialQuery: 'жидкая изолента' })
      const byQueryTab = screen.getByRole('tab', { name: 'По запросам' })
      expect(byQueryTab).toHaveAttribute('aria-selected', 'true')
      const input = screen.getByLabelText('Поисковый запрос')
      expect(input).toHaveValue('жидкая изолента')
    })

    it('falls back to the orders tab when initialQuery is undefined', () => {
      renderPage()
      const ordersTab = screen.getByRole('tab', { name: 'Заказы' })
      expect(ordersTab).toHaveAttribute('aria-selected', 'true')
    })

    it('falls back to the orders tab when initialQuery is the empty string', () => {
      renderPage({ initialQuery: '' })
      const ordersTab = screen.getByRole('tab', { name: 'Заказы' })
      expect(ordersTab).toHaveAttribute('aria-selected', 'true')
    })

    it('auto-fires search with seeded query — not just pre-populates input (Pass-2 P2-5)', () => {
      // P2-5: assert useSearchByQuery is CALLED with the seeded query, not just
      // that the input value matches. A future refactor that pre-fills the
      // input but forgets to seed `debouncedQuery` would pass value-match
      // assertions while silently breaking auto-search; this guards the wiring.
      renderPage({ initialQuery: 'жидкая изолента' })
      const calledQueries = mockedUseSearchByQuery.mock.calls.map(args => args[0])
      expect(calledQueries).toContain('жидкая изолента')
    })
  })

  describe('RequireJam gating', () => {
    it('shows overlay when tier is none', () => {
      mockedUseJamStatus.mockReturnValue({
        data: { ...mockJamData, tier: 'none' },
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderPage()
      expect(screen.getByText('Доступно с подпиской WB Джем')).toBeInTheDocument()
    })

    it('renders tabs when tier is sufficient', () => {
      mockedUseJamStatus.mockReturnValue({
        data: mockJamData,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof useJamStatus>)

      renderPage()
      expect(screen.getByRole('tab', { name: 'Заказы' })).toBeInTheDocument()
      expect(screen.queryByText('Доступно с подпиской WB Джем')).not.toBeInTheDocument()
    })
  })
})
