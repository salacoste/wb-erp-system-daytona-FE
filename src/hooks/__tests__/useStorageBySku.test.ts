/**
 * Unit tests for useStorageBySku hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStorageBySku } from '../useStorageBySku'

vi.mock('@/lib/api/storage-analytics', () => ({
  getStorageBySku: vi.fn(),
}))

import { getStorageBySku } from '@/lib/api/storage-analytics'
const mockGetStorageBySku = vi.mocked(getStorageBySku)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockResponse = {
  period: { from: '2025-W44', to: '2025-W47', days_count: 28 },
  data: [
    {
      nm_id: '12345678',
      vendor_code: 'VC-001',
      product_name: 'Product A',
      brand: 'BrandX',
      storage_cost_total: 1500.5,
      storage_cost_avg_daily: 53.59,
      volume_avg: 12.3,
      warehouses: ['Warehouse-1'],
      days_stored: 28,
      total_stock: 50,
      last_charge_date: '2025-11-28',
      has_warehouse_stock: true,
    },
  ],
  summary: { total_storage_cost: 1500.5, products_count: 1, avg_cost_per_product: 1500.5 },
  pagination: { total: 1, cursor: null, has_more: false },
  has_data: true,
}

describe('useStorageBySku', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches storage data for week range', async () => {
    mockGetStorageBySku.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useStorageBySku('2025-W44', '2025-W47'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(1)
    expect(data.data[0].nm_id).toBe('12345678')
    expect(data.data[0].storage_cost_total).toBe(1500.5)
    expect(data.has_data).toBe(true)
  })

  it('passes additional params to API function', async () => {
    mockGetStorageBySku.mockResolvedValueOnce(mockResponse)

    renderHook(
      () =>
        useStorageBySku('2025-W44', '2025-W47', { sort_by: 'storage_cost', sort_order: 'desc' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGetStorageBySku).toHaveBeenCalledTimes(1))
    const params = mockGetStorageBySku.mock.calls[0][0]
    expect(params.weekStart).toBe('2025-W44')
    expect(params.weekEnd).toBe('2025-W47')
    expect(params.sort_by).toBe('storage_cost')
    expect(params.sort_order).toBe('desc')
  })

  it('handles empty response', async () => {
    mockGetStorageBySku.mockResolvedValueOnce({
      ...mockResponse,
      data: [],
      has_data: false,
      summary: { total_storage_cost: 0, products_count: 0, avg_cost_per_product: 0 },
    })

    const { result } = renderHook(() => useStorageBySku('2025-W44', '2025-W47'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
    expect(result.current.data!.has_data).toBe(false)
  })

  it('handles API error', async () => {
    mockGetStorageBySku.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useStorageBySku('2025-W44', '2025-W47'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(
      () => useStorageBySku('2025-W44', '2025-W47', { enabled: false }),
      { wrapper: createWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
  })
})
