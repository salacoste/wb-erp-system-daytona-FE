/**
 * Unit tests for useMarginTrends hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginTrends } from '../useMarginTrends'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
const mockGet = vi.mocked(apiClient.get)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockRawTrends = [
  {
    week: '2025-W45',
    week_start_date: '2025-11-03',
    week_end_date: '2025-11-09',
    margin_pct: 45.2,
    revenue_net: 500000,
    cogs: 274000,
    profit: 226000,
    qty: 100,
    sku_count: 20,
    missing_cogs_count: 2,
  },
  {
    week: '2025-W46',
    week_start_date: '2025-11-10',
    week_end_date: '2025-11-16',
    margin_pct: 48.1,
    revenue_net: 550000,
    cogs: 285450,
    profit: 264550,
    qty: 110,
    sku_count: 22,
    missing_cogs_count: 1,
  },
  {
    week: '2025-W47',
    week_start_date: '2025-11-17',
    week_end_date: '2025-11-23',
    margin_pct: 51.3,
    revenue_net: 600000,
    cogs: 292200,
    profit: 307800,
    qty: 120,
    sku_count: 25,
    missing_cogs_count: 0,
  },
]

describe('useMarginTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and returns trend data sorted by week ascending', async () => {
    mockGet.mockResolvedValueOnce([...mockRawTrends].reverse())

    const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data).toHaveLength(3)
    // Verify sorted ascending (oldest first)
    expect(data[0].week).toBe('2025-W45')
    expect(data[2].week).toBe('2025-W47')
    expect(data[1].revenue_net).toBe(550000)
  })

  it('normalizes raw array response (apiClient-unwrapped)', async () => {
    mockGet.mockResolvedValueOnce(mockRawTrends)

    const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
  })

  it('normalizes wrapped { data: [...] } response', async () => {
    mockGet.mockResolvedValueOnce({ data: mockRawTrends })

    const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(3)
  })

  it('handles null margin_pct from backend (all SKUs missing COGS)', async () => {
    mockGet.mockResolvedValueOnce([
      {
        week: '2025-W45',
        week_start_date: '2025-11-03',
        week_end_date: '2025-11-09',
        margin_pct: null,
        revenue_net: 500000,
        cogs: null,
        profit: null,
        qty: 100,
        sku_count: 20,
        missing_cogs_count: 20,
      },
    ])

    const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data![0].margin_pct).toBeNull()
    expect(result.current.data![0].cogs).toBeNull()
  })

  it('handles empty response array', async () => {
    mockGet.mockResolvedValueOnce([])

    const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })

  it('calls API with weekStart/weekEnd when provided', async () => {
    mockGet.mockResolvedValueOnce(mockRawTrends)

    renderHook(() => useMarginTrends({ weekStart: '2025-W40', weekEnd: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('weekStart=2025-W40')
    expect(url).toContain('weekEnd=2025-W47')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useMarginTrends({ weeks: 12 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('is enabled when weeks param is provided', async () => {
    mockGet.mockResolvedValueOnce(mockRawTrends)

    const { result } = renderHook(() => useMarginTrends({ weeks: 8 }), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it('is enabled when weekStart and weekEnd are provided', async () => {
    mockGet.mockResolvedValueOnce(mockRawTrends)

    const { result } = renderHook(
      () => useMarginTrends({ weekStart: '2025-W40', weekEnd: '2025-W47' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledTimes(1)
  })
})
