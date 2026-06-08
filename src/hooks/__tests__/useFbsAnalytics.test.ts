/**
 * Unit tests for useFbsTrends, useFbsSeasonal, useFbsCompare hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useFbsTrends,
  useFbsSeasonal,
  useFbsCompare,
  getSmartAggregation,
  calculateDaysDiff,
} from '../useFbsAnalytics'

vi.mock('@/lib/api/fbs-analytics', () => ({
  getFbsTrends: vi.fn(),
  getFbsSeasonal: vi.fn(),
  getFbsCompare: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { getFbsTrends, getFbsSeasonal, getFbsCompare } from '@/lib/api/fbs-analytics'
const mockGetTrends = vi.mocked(getFbsTrends)
const mockGetSeasonal = vi.mocked(getFbsSeasonal)
const mockGetCompare = vi.mocked(getFbsCompare)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockTrendsResponse = {
  trends: [
    { date: '2026-01-01', ordersCount: 10, revenue: 15000 },
    { date: '2026-01-02', ordersCount: 15, revenue: 22000 },
  ],
  period: { from: '2026-01-01', to: '2026-01-02', daysIncluded: 2 },
  summary: {
    totalOrders: 25,
    totalRevenue: 37000,
    avgOrderValue: 1480,
    avgDailyOrders: 12.5,
  },
}

const mockSeasonalResponse = {
  patterns: {
    monthly: [{ month: 1, avgOrders: 100 }],
    weekday: [{ day: 1, avgOrders: 14 }],
    quarterly: [{ quarter: 1, avgOrders: 300 }],
  },
}

const mockCompareResponse = {
  period1: { totalOrders: 100, totalRevenue: 150000 },
  period2: { totalOrders: 120, totalRevenue: 180000 },
  comparison: {
    ordersChange: 20,
    ordersChangePercent: 20,
    revenueChange: 30000,
    revenueChangePercent: 20,
  },
}

// --- Pure function tests ---

describe('getSmartAggregation', () => {
  it('returns "day" for 0-90 days', () => {
    expect(getSmartAggregation(0)).toBe('day')
    expect(getSmartAggregation(45)).toBe('day')
    expect(getSmartAggregation(90)).toBe('day')
  })

  it('returns "week" for 91-180 days', () => {
    expect(getSmartAggregation(91)).toBe('week')
    expect(getSmartAggregation(150)).toBe('week')
    expect(getSmartAggregation(180)).toBe('week')
  })

  it('returns "month" for 181+ days', () => {
    expect(getSmartAggregation(181)).toBe('month')
    expect(getSmartAggregation(365)).toBe('month')
  })
})

describe('calculateDaysDiff', () => {
  it('calculates days between two dates', () => {
    expect(calculateDaysDiff('2026-01-01', '2026-01-10')).toBe(9)
  })

  it('handles reversed date order', () => {
    expect(calculateDaysDiff('2026-01-10', '2026-01-01')).toBe(9)
  })
})

// --- useFbsTrends ---

describe('useFbsTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches trends data successfully', async () => {
    mockGetTrends.mockResolvedValueOnce(
      mockTrendsResponse as unknown as Awaited<ReturnType<typeof getFbsTrends>>
    )

    const { result } = renderHook(() => useFbsTrends({ from: '2026-01-01', to: '2026-01-02' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.trends).toHaveLength(2)
    expect(result.current.data?.summary.totalOrders).toBe(25)
  })

  it('is disabled when from is missing', () => {
    const { result } = renderHook(() => useFbsTrends({ from: '', to: '2026-01-02' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when to is missing', () => {
    const { result } = renderHook(() => useFbsTrends({ from: '2026-01-01', to: '' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(
      () => useFbsTrends({ from: '2026-01-01', to: '2026-01-02' }, { enabled: false }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error with retry: 1', async () => {
    mockGetTrends.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFbsTrends({ from: '2026-01-01', to: '2026-01-02' }), {
      wrapper: createWrapper(),
    })

    // Hook has retry: 1, so with QueryClient retry: false it retries once via hook config
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
  })
})

// --- useFbsSeasonal ---

describe('useFbsSeasonal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches seasonal data successfully', async () => {
    mockGetSeasonal.mockResolvedValueOnce(
      mockSeasonalResponse as unknown as Awaited<ReturnType<typeof getFbsSeasonal>>
    )

    const { result } = renderHook(() => useFbsSeasonal({ months: 12, view: 'monthly' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.patterns?.monthly).toHaveLength(1)
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(() => useFbsSeasonal({ months: 12 }, { enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGetSeasonal.mockRejectedValue(new Error('Seasonal error'))

    const { result } = renderHook(() => useFbsSeasonal({ months: 6 }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Seasonal error')
  })
})

// --- useFbsCompare ---

describe('useFbsCompare', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches comparison data successfully', async () => {
    mockGetCompare.mockResolvedValueOnce(
      mockCompareResponse as unknown as Awaited<ReturnType<typeof getFbsCompare>>
    )

    const params = {
      period1From: '2026-01-01',
      period1To: '2026-01-31',
      period2From: '2025-12-01',
      period2To: '2025-12-31',
    }
    const { result } = renderHook(() => useFbsCompare(params), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.comparison.ordersChangePercent).toBe(20)
  })

  it('is disabled when period fields are missing', () => {
    const { result } = renderHook(
      () =>
        useFbsCompare({
          period1From: '',
          period1To: '2026-01-31',
          period2From: '2025-12-01',
          period2To: '2025-12-31',
        }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGetCompare.mockRejectedValue(new Error('Compare error'))

    const params = {
      period1From: '2026-01-01',
      period1To: '2026-01-31',
      period2From: '2025-12-01',
      period2To: '2025-12-31',
    }
    const { result } = renderHook(() => useFbsCompare(params), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Compare error')
  })
})
