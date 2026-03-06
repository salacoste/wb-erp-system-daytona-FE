/**
 * Tests for Search Analytics hooks
 * Story 71.2-FE: Search Analytics API Client & Hooks
 * Epic 71-FE: Search Analytics & Jam Gating
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createTestQueryClient, createQueryWrapper } from '@/test/utils/test-utils'
import type { QueryClient } from '@tanstack/react-query'

vi.mock('@/lib/api/search-analytics', () => ({
  getSearchByProduct: vi.fn(),
  getSearchByQuery: vi.fn(),
  getSearchOrders: vi.fn(),
  searchQueryKeys: {
    all: ['search-analytics'],
    byProduct: (params: Record<string, unknown>) => ['search-analytics', 'by-product', params],
    byQuery: (params: Record<string, unknown>) => ['search-analytics', 'by-query', params],
    orders: (params: Record<string, unknown>) => ['search-analytics', 'orders', params],
  },
  SEARCH_CACHE: { staleTime: 240000, gcTime: 1800000 },
}))

import { getSearchByProduct, getSearchByQuery, getSearchOrders } from '@/lib/api/search-analytics'
import { useSearchByProduct, useSearchByQuery, useSearchOrders } from '../use-search-analytics'

const mockedByProduct = vi.mocked(getSearchByProduct)
const mockedByQuery = vi.mocked(getSearchByQuery)
const mockedOrders = vi.mocked(getSearchOrders)

let queryClient: QueryClient

beforeEach(() => {
  vi.clearAllMocks()
  queryClient = createTestQueryClient()
})

describe('useSearchByProduct', () => {
  const mockResponse = {
    nmId: 12345,
    period: { from: '2026-02-01', to: '2026-02-28' },
    queries: [
      {
        searchQuery: 'test',
        avgPosition: 5,
        totalImpressions: 100,
        totalClicks: 10,
        avgCtr: 10,
        totalOrders: 2,
        totalRevenue: 0,
      },
    ],
    totalQueries: 1,
  }

  it('returns data when nmId, from, to are provided', async () => {
    mockedByProduct.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSearchByProduct(12345, '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.nmId).toBe(12345)
    expect(result.current.data?.queries).toHaveLength(1)
  })

  it('is disabled when nmId is undefined', () => {
    const { result } = renderHook(() => useSearchByProduct(undefined, '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByProduct).not.toHaveBeenCalled()
  })

  it('is disabled when from is empty', () => {
    const { result } = renderHook(() => useSearchByProduct(12345, '', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByProduct).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty', () => {
    const { result } = renderHook(() => useSearchByProduct(12345, '2026-02-01', ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByProduct).not.toHaveBeenCalled()
  })

  it('handles API error', async () => {
    mockedByProduct.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSearchByProduct(12345, '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error).toBeInstanceOf(Error)
  })
})

describe('useSearchByQuery', () => {
  const mockResponse = {
    query: 'кроссовки',
    period: { from: '2026-02-01', to: '2026-02-28' },
    products: [
      {
        nmId: 67890,
        vendorCode: 'ART-001',
        avgPosition: 3,
        totalImpressions: 2000,
        totalClicks: 150,
        avgCtr: 7.5,
        totalOrders: 30,
        totalRevenue: 0,
      },
    ],
    totalProducts: 1,
  }

  it('returns data when query has 2+ chars', async () => {
    mockedByQuery.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSearchByQuery('кроссовки', '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products).toHaveLength(1)
  })

  it('is disabled when query is too short (< 2 chars)', () => {
    const { result } = renderHook(() => useSearchByQuery('к', '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByQuery).not.toHaveBeenCalled()
  })

  it('is disabled when query is empty', () => {
    const { result } = renderHook(() => useSearchByQuery('', '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByQuery).not.toHaveBeenCalled()
  })

  it('is disabled when from is empty', () => {
    const { result } = renderHook(() => useSearchByQuery('кроссовки', '', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByQuery).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty', () => {
    const { result } = renderHook(() => useSearchByQuery('кроссовки', '2026-02-01', ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedByQuery).not.toHaveBeenCalled()
  })

  it('handles API error', async () => {
    mockedByQuery.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useSearchByQuery('кроссовки', '2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})

describe('useSearchOrders', () => {
  const mockResponse = {
    period: { from: '2026-02-01', to: '2026-02-28' },
    groupBy: 'query' as const,
    items: [{ key: 'кроссовки', totalOrders: 50, totalRevenue: 0, uniqueProducts: 12 }],
    summary: { totalSearchOrders: 500, totalSearchRevenue: 0, searchOrderShare: 35.2 },
  }

  it('returns data when from and to are provided', async () => {
    mockedOrders.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSearchOrders('2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.items).toHaveLength(1)
    expect(result.current.data?.summary.totalSearchOrders).toBe(500)
  })

  it('is disabled when from is empty', () => {
    const { result } = renderHook(() => useSearchOrders('', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedOrders).not.toHaveBeenCalled()
  })

  it('is disabled when to is empty', () => {
    const { result } = renderHook(() => useSearchOrders('2026-02-01', ''), {
      wrapper: createQueryWrapper(queryClient),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedOrders).not.toHaveBeenCalled()
  })

  it('passes optional params through', async () => {
    mockedOrders.mockResolvedValueOnce(mockResponse)

    renderHook(
      () => useSearchOrders('2026-02-01', '2026-02-28', { groupBy: 'product', limit: 25 }),
      {
        wrapper: createQueryWrapper(queryClient),
      }
    )

    await waitFor(() => expect(mockedOrders).toHaveBeenCalled())
    expect(mockedOrders).toHaveBeenCalledWith({
      from: '2026-02-01',
      to: '2026-02-28',
      groupBy: 'product',
      limit: 25,
    })
  })

  it('handles API error', async () => {
    mockedOrders.mockRejectedValue(new Error('Timeout'))

    const { result } = renderHook(() => useSearchOrders('2026-02-01', '2026-02-28'), {
      wrapper: createQueryWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})
