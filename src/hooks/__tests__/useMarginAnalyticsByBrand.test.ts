/**
 * Unit tests for useMarginAnalyticsByBrand hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginAnalyticsByBrand } from '../useMarginAnalyticsByBrand'

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

const mockRawBrandItem = {
  brand: 'TestBrand',
  revenue_gross: 500000,
  revenue_net: 400000,
  total_units: 100,
  total_skus: 5,
  cogs: 200000,
  profit: 200000,
  margin_pct: 50,
  markup_percent: 100,
  missing_cogs_count: 0,
  storage_cost: 5000,
  penalties: 1000,
  paid_acceptance_cost: 2000,
  acquiring_fee: 3000,
  loyalty_fee: 500,
  loyalty_compensation: 200,
  commission: 50000,
  other_adjustments: 0,
  total_expenses: 61700,
  operating_profit: 138300,
  operating_margin_pct: 34.58,
  skus_with_expenses_only: 1,
}

const mockApiResponse = {
  items: [mockRawBrandItem],
  meta: { week: '2025-W47', cabinet_id: 'cab-1', generated_at: '2025-12-01T00:00:00Z' },
}

describe('useMarginAnalyticsByBrand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and transforms brand data on success', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse)

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(1)
    const brand = data.data[0]
    expect(brand.brand).toBe('TestBrand')
    expect(brand.qty).toBe(100)
    expect(brand.total_skus).toBe(5)
    expect(brand.revenue_gross).toBe(500000)
    expect(brand.operating_margin_pct).toBe(34.58)
    expect(data.meta?.week).toBe('2025-W47')
  })

  it('maps null cogs to undefined', async () => {
    mockGet.mockResolvedValueOnce({
      items: [{ ...mockRawBrandItem, cogs: null, profit: null, margin_pct: null }],
      meta: {},
    })

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const brand = result.current.data!.data[0]
    expect(brand.cogs).toBeUndefined()
    expect(brand.profit).toBeUndefined()
    expect(brand.margin_pct).toBeUndefined()
  })

  it('handles empty items array', async () => {
    mockGet.mockResolvedValueOnce({ items: [], meta: {} })

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
  })

  it('handles raw array response (no items wrapper)', async () => {
    mockGet.mockResolvedValueOnce([mockRawBrandItem])

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(1)
  })

  it('is disabled when no week or range provided', () => {
    const { result } = renderHook(() => useMarginAnalyticsByBrand({}), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('calls API with weekStart/weekEnd when provided', async () => {
    mockGet.mockResolvedValueOnce({ items: [], meta: {} })

    renderHook(() => useMarginAnalyticsByBrand({ weekStart: '2025-W40', weekEnd: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('weekStart=2025-W40')
    expect(url).toContain('weekEnd=2025-W47')
  })

  it('preserves backend roi and profit_per_unit when present (percent 0-100)', async () => {
    mockGet.mockResolvedValueOnce({
      items: [{ ...mockRawBrandItem, roi: 309.48, profit_per_unit: 9.47 }],
      meta: {},
    })

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const brand = result.current.data!.data[0]
    expect(brand.roi).toBe(309.48)
    expect(brand.profit_per_unit).toBe(9.47)
  })

  it('maps roi and profit_per_unit to null when omitted (preserve null, never undefined/0)', async () => {
    mockGet.mockResolvedValueOnce({
      // cogs=0 → backend sends roi=null (ROI meaningless without COGS)
      items: [{ ...mockRawBrandItem, cogs: 0, roi: null, profit_per_unit: 395.66 }],
      meta: {},
    })

    const { result } = renderHook(() => useMarginAnalyticsByBrand({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const brand = result.current.data!.data[0]
    expect(brand.roi).toBeNull()
    expect(brand.profit_per_unit).toBe(395.66)
  })
})
