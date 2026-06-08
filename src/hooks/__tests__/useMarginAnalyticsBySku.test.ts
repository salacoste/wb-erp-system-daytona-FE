/**
 * Unit tests for useMarginAnalyticsBySku hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginAnalyticsBySku } from '../useMarginAnalyticsBySku'

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), error: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'
const mockGet = vi.mocked(apiClient.get)

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children)
}

const mockRawSkuItem = {
  nm_id: 12345678,
  sa_name: 'Test Product',
  revenue_net: 100000,
  total_units: 50,
  cogs: 40000,
  profit: 60000,
  margin_pct: 60,
  markup_percent: 150,
  missing_cogs_flag: false,
  profit_per_unit: 1200,
  roi: 150,
  weeks_with_sales: 4,
  weeks_with_cogs: 4,
  logistics_cost: 5000,
  storage_cost: 2000,
  penalties: 100,
  paid_acceptance_cost: 300,
  advertising_cost: 1000,
  total_expenses: 8400,
  operating_profit: 51600,
  operating_margin_pct: 51.6,
  has_revenue: true,
  net_profit: 50000,
  net_margin_pct: 50,
  storage_data_source: 'paid_storage_api' as const,
}

const mockApiResponse = {
  items: [mockRawSkuItem],
  meta: { week: '2025-W47', cabinet_id: 'cab-1', generated_at: '2025-12-01T00:00:00Z' },
}

describe('useMarginAnalyticsBySku', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and transforms SKU data on success', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse)

    const { result } = renderHook(() => useMarginAnalyticsBySku({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(1)
    const sku = data.data[0]
    expect(sku.nm_id).toBe('12345678') // Anti-pattern #10: opaque numeric ID -> string
    expect(sku.sa_name).toBe('Test Product')
    expect(sku.qty).toBe(50)
    expect(sku.revenue_net).toBe(100000)
    expect(sku.operating_margin_pct).toBe(51.6)
  })

  it('maps logistics_cost to logistics_cost_rub as string', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse)

    const { result } = renderHook(() => useMarginAnalyticsBySku({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const sku = result.current.data!.data[0]
    expect(sku.logistics_cost_rub).toBe('5000')
    expect(sku.storage_cost_rub).toBe('2000')
    expect(sku.total_expenses_rub).toBe('8400')
  })

  it('maps null costs to undefined', async () => {
    mockGet.mockResolvedValueOnce({
      items: [
        { ...mockRawSkuItem, cogs: null, profit: null, margin_pct: null, logistics_cost: null },
      ],
      meta: {},
    })

    const { result } = renderHook(() => useMarginAnalyticsBySku({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const sku = result.current.data!.data[0]
    expect(sku.cogs).toBeUndefined()
    expect(sku.profit).toBeUndefined()
    expect(sku.margin_pct).toBeUndefined()
    expect(sku.logistics_cost_rub).toBeUndefined()
  })

  it('filters by nmId client-side', async () => {
    const items = [mockRawSkuItem, { ...mockRawSkuItem, nm_id: 99999999, sa_name: 'Other Product' }]
    mockGet.mockResolvedValueOnce({ items, meta: {} })

    const { result } = renderHook(
      () => useMarginAnalyticsBySku({ week: '2025-W47', nmId: '12345678' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(1)
    expect(result.current.data!.data[0].nm_id).toBe('12345678')
  })

  it('handles empty items array', async () => {
    mockGet.mockResolvedValueOnce({ items: [], meta: {} })

    const { result } = renderHook(() => useMarginAnalyticsBySku({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
  })

  it('is disabled when no week or range provided', () => {
    const { result } = renderHook(() => useMarginAnalyticsBySku({}), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useMarginAnalyticsBySku({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('defaults missing_cogs_flag to false when absent', async () => {
    const item = { ...mockRawSkuItem }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (item as Record<string, unknown>).missing_cogs_flag
    mockGet.mockResolvedValueOnce({ items: [item], meta: {} })

    const { result } = renderHook(() => useMarginAnalyticsBySku({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data[0].missing_cogs_flag).toBe(false)
  })
})
