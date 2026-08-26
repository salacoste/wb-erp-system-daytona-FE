/**
 * Story 170.7 Task 3 deep-link tests (validator verdict: IMPLEMENT).
 * ?tab ∈ {orders,by-product,by-query,position-trends} selects the default tab;
 * ?nmId (numeric) preselects the by-product product. Invalid/garbage values
 * fall back to the pre-deep-link defaults (orders, no preselect).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'
import type { JamStatusResponse } from '@/types/cabinet'

vi.mock('@/hooks/useJamStatus', () => ({
  useJamStatus: vi.fn(),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: { cabinetId: string }) => unknown) => {
    const state = { cabinetId: 'cab-1' }
    return selector ? selector(state) : state
  }),
}))

vi.mock('@/hooks/useSellerInfo', () => ({
  useSellerInfo: () => ({ data: undefined }),
}))

vi.mock('@/hooks/use-search-analytics', () => ({
  useSearchOrders: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
  useSearchByProduct: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
  useSearchByQuery: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProducts: () => ({ data: undefined, isLoading: false }),
}))

import { useJamStatus } from '@/hooks/useJamStatus'
import { useSearchByProduct } from '@/hooks/use-search-analytics'
import SearchPage from '../page'
import { SearchPageContent } from '../components/SearchPageContent'

const mockedUseJamStatus = vi.mocked(useJamStatus)
const mockedUseSearchByProduct = vi.mocked(useSearchByProduct)
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
  mockedUseJamStatus.mockReturnValue({ data: mockJamData } as ReturnType<
    typeof useJamStatus
  >)
})

function activeTab(): string {
  return screen.getByRole('tab', { selected: true })?.textContent ?? ''
}

describe('Story 170.7 deep-link: page-level ?tab=/?nmId= parsing', () => {
  it('?tab=position-trends activates the Позиции tab', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ tab: 'position-trends' }) }), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(activeTab()).toBe('Позиции')
  })

  it('explicit ?tab= wins over ?query= default', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ tab: 'orders', query: 'кепка' }) }), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(activeTab()).toBe('Заказы')
  })

  it('unknown ?tab= falls back to orders (no fabricated tabs)', async () => {
    render(await SearchPage({ searchParams: Promise.resolve({ tab: 'bogus' }) }), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(activeTab()).toBe('Заказы')
  })

  it('?nmId= (numeric) preselects the by-product product via useSearchByProduct', async () => {
    render(
      await SearchPage({
        searchParams: Promise.resolve({ tab: 'by-product', nmId: '12345' }),
      }),
      { wrapper: createQueryWrapper(queryClient) }
    )
    expect(mockedUseSearchByProduct).toHaveBeenCalledWith(
      12345,
      expect.any(String),
      expect.any(String)
    )
  })

  it('non-numeric ?nmId= is ignored (undefined, not NaN)', async () => {
    // by-product tab explicitly opened so the hook actually mounts
    render(
      await SearchPage({
        searchParams: Promise.resolve({ tab: 'by-product', nmId: '12x3' }),
      }), {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(mockedUseSearchByProduct).toHaveBeenCalledWith(
      undefined,
      expect.any(String),
      expect.any(String)
    )
  })
})

describe('Story 170.7 deep-link: SearchPageContent props', () => {
  it('initialTab=by-query activates По запросам', () => {
    render(<SearchPageContent initialTab="by-query" />, {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(activeTab()).toBe('По запросам')
  })

  it('by-query input keeps the e2e-locked aria-label «Поисковый запрос»', () => {
    render(<SearchPageContent initialTab="by-query" />, {
      wrapper: createQueryWrapper(queryClient),
    })
    expect(screen.getByLabelText('Поисковый запрос')).toBeInTheDocument()
  })
})
