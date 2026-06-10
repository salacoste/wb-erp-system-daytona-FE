/**
 * Unit tests for usePriceRecommendations hooks
 * Tests: usePriceRecommendations, usePriceRecommendation, usePriceRefresh,
 *        usePriceRecommendationHistory
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  usePriceRecommendations,
  usePriceRecommendation,
  usePriceRefresh,
  usePriceRecommendationHistory,
  priceRecommendationQueryKeys,
} from '../usePriceRecommendations'
import * as api from '@/lib/api/price-recommendations'
import type {
  PriceRecommendation,
  PriceRecommendationsResponse,
  PriceRecommendationHistoryPoint,
} from '@/types/price-recommendations'

vi.mock('@/lib/api/price-recommendations')

const mockGetList = vi.mocked(api.getPriceRecommendations)
const mockGetDetail = vi.mocked(api.getPriceRecommendation)
const mockRefresh = vi.mocked(api.refreshPriceRecommendations)
const mockGetHistory = vi.mocked(api.getPriceRecommendationHistory)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const mockItem: PriceRecommendation = {
  id: 'rec-1',
  nmId: 12345,
  vendorCode: 'SKU-001',
  productName: 'Test Product',
  lastPrice: 1000,
  breakEvenPrice: 800,
  recommendedPrice: 950,
  marginAtCurrentPct: 20,
  marginAtRecommendedPct: 15.8,
  gap: -50,
  gapPct: -5,
  targetMarginPct: 15,
  computedAt: '2025-01-15T00:00:00Z',
}

const mockListResponse: PriceRecommendationsResponse = {
  items: [mockItem],
  total: 1,
  nextCursor: null,
}

const mockHistoryPoint: PriceRecommendationHistoryPoint = {
  weekStart: '2025-W02',
  lastPrice: 1000,
  recommendedPrice: 950,
  breakEvenPrice: 800,
  marginAtCurrentPct: 20,
  marginAtRecPct: 15.8,
  gap: -50,
  gapPct: -5,
  targetMarginPct: 15,
  recomputationCount: 3,
}

// ── queryKeys ──────────────────────────────────────────────────────────────────

describe('priceRecommendationQueryKeys', () => {
  it('list key includes params', () => {
    const params = { limit: 10, gap_filter: 'above' }
    const key = priceRecommendationQueryKeys.list(params)
    expect(key).toEqual(['price-recommendations', 'list', params])
  })

  it('detail key includes nmId', () => {
    expect(priceRecommendationQueryKeys.detail(123)).toEqual([
      'price-recommendations',
      'detail',
      123,
    ])
  })

  it('history key includes nmId and limit', () => {
    expect(priceRecommendationQueryKeys.history(123, 10)).toEqual([
      'price-recommendations',
      'history',
      123,
      10,
    ])
  })

  it('different nmIds produce different keys', () => {
    expect(priceRecommendationQueryKeys.detail(1)).not.toEqual(
      priceRecommendationQueryKeys.detail(2)
    )
  })
})

// ── usePriceRecommendations ────────────────────────────────────────────────────

describe('usePriceRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches recommendations list with default params', async () => {
    mockGetList.mockResolvedValueOnce(mockListResponse)
    const { result } = renderHook(() => usePriceRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockListResponse)
  })

  it('passes filter params to API', async () => {
    mockGetList.mockResolvedValueOnce(mockListResponse)
    const params = { gap_filter: 'above', limit: 20 }
    const { result } = renderHook(() => usePriceRecommendations(params), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetList).toHaveBeenCalledWith(params)
  })

  it('is disabled when options.enabled=false', () => {
    const { result } = renderHook(() => usePriceRecommendations({}, { enabled: false }), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetList).not.toHaveBeenCalled()
  })

  it('returns error on failure', async () => {
    mockGetList.mockRejectedValueOnce(new Error('Server error'))
    mockGetList.mockRejectedValueOnce(new Error('Server error'))
    const { result } = renderHook(() => usePriceRecommendations(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})

// ── usePriceRecommendation ─────────────────────────────────────────────────────

describe('usePriceRecommendation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches single recommendation when nmId provided', async () => {
    mockGetDetail.mockResolvedValueOnce(mockItem)
    const { result } = renderHook(() => usePriceRecommendation(12345), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetDetail).toHaveBeenCalledWith(12345)
    expect(result.current.data).toEqual(mockItem)
  })

  it('is disabled when nmId is null', () => {
    const { result } = renderHook(() => usePriceRecommendation(null), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetDetail).not.toHaveBeenCalled()
  })

  it('returns error on failure', async () => {
    mockGetDetail.mockRejectedValueOnce(new Error('Not found'))
    mockGetDetail.mockRejectedValueOnce(new Error('Not found'))
    const { result } = renderHook(() => usePriceRecommendation(99999), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
  })
})

// ── usePriceRefresh ────────────────────────────────────────────────────────────

describe('usePriceRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls refreshPriceRecommendations and invalidates cache', async () => {
    mockRefresh.mockResolvedValueOnce({ jobId: 'price-rec-test-job-123' })
    const { result } = renderHook(() => usePriceRefresh(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockRefresh).toHaveBeenCalledOnce()
  })

  it('returns error on refresh failure', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('Refresh failed'))
    const { result } = renderHook(() => usePriceRefresh(), { wrapper: createWrapper() })

    result.current.mutate()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

// ── usePriceRecommendationHistory ──────────────────────────────────────────────

describe('usePriceRecommendationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches history when nmId provided', async () => {
    mockGetHistory.mockResolvedValueOnce([mockHistoryPoint])
    const { result } = renderHook(() => usePriceRecommendationHistory(12345, 10), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetHistory).toHaveBeenCalledWith(12345, { limit: 10 })
    expect(result.current.data).toEqual([mockHistoryPoint])
  })

  it('is disabled when nmId is null', () => {
    const { result } = renderHook(() => usePriceRecommendationHistory(null), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
    expect(mockGetHistory).not.toHaveBeenCalled()
  })

  it('fetches without limit when omitted', async () => {
    mockGetHistory.mockResolvedValueOnce([])
    const { result } = renderHook(() => usePriceRecommendationHistory(12345), {
      wrapper: createWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetHistory).toHaveBeenCalledWith(12345, { limit: undefined })
  })
})
