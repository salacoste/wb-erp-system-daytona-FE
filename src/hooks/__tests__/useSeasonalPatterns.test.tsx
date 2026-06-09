/**
 * Tests for useSeasonalPatterns hook
 * Story 63.8-FE: Orders Seasonal Patterns Analysis
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSeasonalPatterns } from '../useSeasonalPatterns'
import * as ordersVolumeApi from '@/lib/api/orders-volume'

vi.mock('@/lib/api/orders-volume', async () => {
  const actual = await vi.importActual<typeof ordersVolumeApi>('@/lib/api/orders-volume')
  return {
    ...actual,
    getSeasonalPatterns: vi.fn(),
  }
})

const mockGetSeasonal = vi.mocked(ordersVolumeApi.getSeasonalPatterns)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockResponse = {
  patterns: {
    monthly: [
      { month: 'January', avgOrders: 2500, avgRevenue: 750000 },
      { month: 'December', avgOrders: 5000, avgRevenue: 1500000 },
    ],
    weekday: [
      { dayOfWeek: 'Monday', avgOrders: 300, peakHour: 12 },
      { dayOfWeek: 'Saturday', avgOrders: 500, peakHour: 14 },
    ],
  },
  insights: {
    peakMonth: 'December',
    lowMonth: 'January',
    peakDay: 'Saturday',
  },
}

describe('useSeasonalPatterns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches seasonal patterns with default months=12', async () => {
    mockGetSeasonal.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSeasonalPatterns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetSeasonal).toHaveBeenCalledWith({ months: 12 })
    expect(result.current.data?.insights.peakMonth).toBe('December')
  })

  it('fetches seasonal patterns with custom months', async () => {
    mockGetSeasonal.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSeasonalPatterns({ months: 6 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGetSeasonal).toHaveBeenCalledWith({ months: 6 })
  })

  it('returns loading state initially', () => {
    mockGetSeasonal.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useSeasonalPatterns(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('returns error on API failure', async () => {
    mockGetSeasonal.mockRejectedValue(new Error('Seasonal fetch failed'))

    const { result } = renderHook(() => useSeasonalPatterns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Seasonal fetch failed')
  })

  it('respects enabled=false option', () => {
    const { result } = renderHook(() => useSeasonalPatterns({ enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(mockGetSeasonal).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('returns monthly patterns data', async () => {
    mockGetSeasonal.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSeasonalPatterns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.patterns.monthly).toHaveLength(2)
    expect(result.current.data?.patterns.monthly[0].month).toBe('January')
  })

  it('returns weekday patterns data', async () => {
    mockGetSeasonal.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSeasonalPatterns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.patterns.weekday).toHaveLength(2)
    expect(result.current.data?.patterns.weekday[1].dayOfWeek).toBe('Saturday')
  })

  it('returns insights with peak and low months', async () => {
    mockGetSeasonal.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useSeasonalPatterns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.insights.peakMonth).toBe('December')
    expect(result.current.data?.insights.lowMonth).toBe('January')
    expect(result.current.data?.insights.peakDay).toBe('Saturday')
  })
})
