/**
 * Unit tests for useStorageSummary hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStorageSummary } from '../useStorageSummary'

vi.mock('@/lib/api/storage-analytics', () => ({
  getStorageSummary: vi.fn(),
}))

import { getStorageSummary } from '@/lib/api/storage-analytics'
const mockGetStorageSummary = vi.mocked(getStorageSummary)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockResponse = {
  period: { from: '2025-12-01', to: '2025-12-07', days_count: 7 },
  data: {
    totalCost: 1949.52,
    totalVolume: 3450.8,
    daysCount: 7,
    uniqueSkus: 42,
    avgCostPerSku: 46.42,
    dateFrom: '2025-12-01',
    dateTo: '2025-12-07',
  },
}

describe('useStorageSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches storage summary for date range', async () => {
    mockGetStorageSummary.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useStorageSummary('2025-12-01', '2025-12-07'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data.totalCost).toBe(1949.52)
    expect(data.data.uniqueSkus).toBe(42)
    expect(data.data.daysCount).toBe(7)
  })

  it('passes date parameters to API function', async () => {
    mockGetStorageSummary.mockResolvedValueOnce(mockResponse)

    renderHook(() => useStorageSummary('2025-12-01', '2025-12-07'), { wrapper: createWrapper() })

    await waitFor(() => expect(mockGetStorageSummary).toHaveBeenCalledTimes(1))
    const params = mockGetStorageSummary.mock.calls[0][0]
    expect(params.dateFrom).toBe('2025-12-01')
    expect(params.dateTo).toBe('2025-12-07')
  })

  it('handles API error', async () => {
    mockGetStorageSummary.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useStorageSummary('2025-12-01', '2025-12-07'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(
      () => useStorageSummary('2025-12-01', '2025-12-07', { enabled: false }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles zero cost response', async () => {
    mockGetStorageSummary.mockResolvedValueOnce({
      ...mockResponse,
      data: { ...mockResponse.data, totalCost: 0, uniqueSkus: 0, avgCostPerSku: 0 },
    })

    const { result } = renderHook(() => useStorageSummary('2025-12-01', '2025-12-07'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data.totalCost).toBe(0)
  })
})
