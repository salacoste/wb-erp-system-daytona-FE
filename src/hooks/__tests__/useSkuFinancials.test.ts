/**
 * Unit tests for useSkuFinancials hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSkuFinancials } from '../useSkuFinancials'

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

const mockBackendItem = {
  nm_id: 12345678,
  sku_name: 'Футболка мужская',
  brand: 'TestBrand',
  subject_name: 'Футболки',
  sales: { quantity: 10, revenue_gross: 15000, revenue_net: 12000 },
  returns: { quantity: 1, revenue_gross: 1500, revenue_net: 1200 },
  cogs: { unit_cost: 300, total: 3000, source: 'manual', valid_from: '2025-W47' },
  gross_profit: { total: 9000, per_unit: 900, margin_pct: 75 },
  expenses: {
    logistics_delivery: 500,
    logistics_return: 50,
    logistics_total: 550,
    storage: 100,
    storage_source: 'paid_storage_api',
    penalties: 0,
    paid_acceptance: 0,
    other_adjustments: 0,
    total_operating: 650,
  },
  operating_profit: { total: 8350, per_unit: 835, margin_pct: 69.58 },
  profitability: { status: 'excellent', health_score: 95 },
}

const mockBackendResponse = {
  data: [mockBackendItem],
  meta: { week: '2025-W47', total_items: 1, has_more: false },
  totals: {
    total_revenue: 12000,
    total_cogs: 3000,
    total_profit: 9000,
    avg_margin_pct: 75,
  },
}

describe('useSkuFinancials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches SKU financials data successfully', async () => {
    mockGet.mockResolvedValueOnce(mockBackendResponse)

    const { result } = renderHook(() => useSkuFinancials({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    // SkuFinancialsResponse has 'data' not 'items'
    expect(result.current.data?.data).toBeDefined()
  })

  it('passes week parameter in query', async () => {
    mockGet.mockResolvedValueOnce(mockBackendResponse)

    renderHook(() => useSkuFinancials({ week: '2025-W48' }), { wrapper: createWrapper() })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('week=2025-W48')
  })

  it('passes sort and order parameters', async () => {
    mockGet.mockResolvedValueOnce(mockBackendResponse)

    renderHook(
      () =>
        useSkuFinancials({
          week: '2025-W47',
          sortBy: 'operating_margin_pct',
          order: 'desc',
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('sort_by=operating_margin_pct')
    expect(url).toContain('sort_order=desc')
  })

  it('passes limit and offset parameters', async () => {
    mockGet.mockResolvedValueOnce(mockBackendResponse)

    renderHook(() => useSkuFinancials({ week: '2025-W47', limit: 25, offset: 50 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('limit=25')
    expect(url).toContain('offset=50')
  })

  it('is disabled when enabled=false', () => {
    const { result } = renderHook(() => useSkuFinancials({ week: '2025-W47' }, false), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when week is empty', () => {
    const { result } = renderHook(() => useSkuFinancials({ week: '' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useSkuFinancials({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Server error')
  })

  it('uses skipDataUnwrap for response', async () => {
    mockGet.mockResolvedValueOnce(mockBackendResponse)

    renderHook(() => useSkuFinancials({ week: '2025-W47' }), { wrapper: createWrapper() })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const options = mockGet.mock.calls[0][1] as Record<string, unknown> | undefined
    expect(options?.skipDataUnwrap).toBe(true)
  })
})
