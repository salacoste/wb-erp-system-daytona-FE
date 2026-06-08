/**
 * Unit tests for useStorageTrends hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStorageTrends } from '../useStorageTrends'

vi.mock('@/lib/api/storage-analytics', () => ({
  getStorageTrends: vi.fn(),
}))

import { getStorageTrends } from '@/lib/api/storage-analytics'
const mockGetStorageTrends = vi.mocked(getStorageTrends)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  nm_id: null,
  data: [
    { week: '2025-W44', storage_cost: 1200.5, volume: 450.2 },
    { week: '2025-W45', storage_cost: 1350.0, volume: 480.0 },
    { week: '2025-W46', storage_cost: 1100.75, volume: 420.5 },
    { week: '2025-W47', storage_cost: 1500.25, volume: 510.8 },
  ],
  summary: {
    storage_cost: { min: 1100.75, max: 1500.25, avg: 1287.88, trend: 12.5 },
    volume: { min: 420.5, max: 510.8, avg: 465.38, trend: 8.2 },
  },
  has_data: true,
}

describe('useStorageTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches storage trends for week range', async () => {
    mockGetStorageTrends.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useStorageTrends('2025-W44', '2025-W47'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(4)
    expect(data.data[0].week).toBe('2025-W44')
    expect(data.data[3].storage_cost).toBe(1500.25)
    expect(data.has_data).toBe(true)
    expect(data.summary?.storage_cost?.trend).toBe(12.5)
  })

  it('passes additional filter params to API', async () => {
    mockGetStorageTrends.mockResolvedValueOnce(mockResponse)

    renderHook(
      () =>
        useStorageTrends('2025-W44', '2025-W47', { nm_id: '12345678', metrics: ['storage_cost'] }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetStorageTrends).toHaveBeenCalledTimes(1))
    const params = mockGetStorageTrends.mock.calls[0][0]
    expect(params.weekStart).toBe('2025-W44')
    expect(params.weekEnd).toBe('2025-W47')
    expect(params.nm_id).toBe('12345678')
    expect(params.metrics).toEqual(['storage_cost'])
  })

  it('handles empty trends data', async () => {
    mockGetStorageTrends.mockResolvedValueOnce({
      ...mockResponse,
      data: [],
      has_data: false,
      summary: undefined,
    })

    const { result } = renderHook(() => useStorageTrends('2025-W44', '2025-W47'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
    expect(result.current.data!.has_data).toBe(false)
  })

  it('handles API error', async () => {
    mockGetStorageTrends.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useStorageTrends('2025-W44', '2025-W47'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(
      () => useStorageTrends('2025-W44', '2025-W47', { enabled: false }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('returns nm_id when filtered by product', async () => {
    mockGetStorageTrends.mockResolvedValueOnce({ ...mockResponse, nm_id: '12345678' })

    const { result } = renderHook(
      () => useStorageTrends('2025-W44', '2025-W47', { nm_id: '12345678' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.nm_id).toBe('12345678')
  })
})
