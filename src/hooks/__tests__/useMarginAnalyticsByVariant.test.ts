/**
 * Unit tests for useMarginAnalyticsByVariant hook (FR-7 #221).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginAnalyticsByVariant, mapVariantItem } from '../useMarginAnalyticsByVariant'

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

const mockRawVariantItem = {
  chrt_id: 326996478,
  nm_id: 202867769,
  color_name: 'Синий',
  tech_size: '42',
  metadata_pending: false,
  has_revenue: true,
  revenue_net: 12829,
  total_units: 25,
  profit_allocated_rub: -82.78,
  margin_allocated_pct: -0.65,
  revenue_gross: 512,
  cogs: 211,
  total_expenses: 486,
  profit: 403.22,
  margin_pct: 65.65,
  operating_profit: -82.78,
  operating_margin_pct: -13.48,
}

const mockApiResponse = {
  data: [mockRawVariantItem],
  pagination: { count: 1, has_more: false, next_cursor: null },
}

describe('mapVariantItem', () => {
  it('maps a populated raw item faithfully', () => {
    const out = mapVariantItem(mockRawVariantItem)
    expect(out.chrt_id).toBe(326996478)
    expect(out.color_name).toBe('Синий')
    expect(out.tech_size).toBe('42') // string, not number
    expect(out.revenue_net).toBe(12829)
    expect(out.total_units).toBe(25)
    expect(out.profit_allocated_rub).toBe(-82.78)
    expect(out.margin_pct).toBe(65.65)
  })

  it('preserves null money/ratio as null (never ?? 0) — anti-pattern #8', () => {
    const out = mapVariantItem({
      ...mockRawVariantItem,
      profit_allocated_rub: null,
      margin_allocated_pct: null,
      profit: null,
      margin_pct: null,
    })
    expect(out.profit_allocated_rub).toBeNull()
    expect(out.margin_allocated_pct).toBeNull()
    expect(out.profit).toBeNull()
    expect(out.margin_pct).toBeNull()
    // exact counts stay numeric
    expect(out.revenue_net).toBe(12829)
    expect(out.total_units).toBe(25)
  })

  it('coerces numeric tech_size to string and null to null', () => {
    expect(mapVariantItem({ ...mockRawVariantItem, tech_size: 42 }).tech_size).toBe('42')
    expect(mapVariantItem({ ...mockRawVariantItem, tech_size: null }).tech_size).toBeNull()
    expect(mapVariantItem({ ...mockRawVariantItem, tech_size: undefined }).tech_size).toBeNull()
  })

  it('defaults booleans to false when absent', () => {
    const out = mapVariantItem({ chrt_id: 1, nm_id: 2, revenue_net: 0, total_units: 0 })
    expect(out.metadata_pending).toBe(false)
    expect(out.has_revenue).toBe(false)
    expect(out.color_name).toBeNull()
  })
})

describe('useMarginAnalyticsByVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and transforms variant data on success', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse)

    const { result } = renderHook(() => useMarginAnalyticsByVariant({ week: '2026-W26' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(1)
    const variant = data.data[0]
    expect(variant.chrt_id).toBe(326996478)
    expect(variant.color_name).toBe('Синий')
    expect(variant.profit_allocated_rub).toBe(-82.78)
    // queryKey is stable for the same filters
    expect(mockGet).toHaveBeenCalledTimes(1)
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('week=2026-W26')
    expect(url).not.toContain('include_cogs') // no range/flags sent
  })

  it('is disabled (idle) when no week provided', () => {
    const { result } = renderHook(() => useMarginAnalyticsByVariant({}), {
      wrapper: createWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles empty data array', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      pagination: { count: 0, has_more: false, next_cursor: null },
    })

    const { result } = renderHook(() => useMarginAnalyticsByVariant({ week: '2026-W26' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
  })

  it('surfaces pagination meta (has_more / next_cursor) for cursor-based paging', async () => {
    // Regression: apiClient unwraps `{data}`, so `{skipDataUnwrap:true}` MUST preserve
    // the full {data, pagination} envelope — otherwise has_more/next_cursor are silently
    // lost (extractItems only reads `.meta`, never `.pagination`) and Phase 2/3 cannot
    // paginate multi-page variant lists. This test fails on the pre-fix code.
    mockGet.mockResolvedValueOnce({
      data: [mockRawVariantItem, { ...mockRawVariantItem, chrt_id: 2 }],
      pagination: { count: 2, has_more: true, next_cursor: 'xyz' },
    })

    const { result } = renderHook(() => useMarginAnalyticsByVariant({ week: '2026-W26' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(2)
    expect(result.current.data!.meta?.has_more).toBe(true)
    expect(result.current.data!.meta?.next_cursor).toBe('xyz')
  })

  it('handles API error', async () => {
    // mockRejectedValue (not Once) — MARGIN_ANALYTICS_QUERY_CONFIG retries once,
    // so a single Once-mock would resolve undefined on retry and mask the error.
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useMarginAnalyticsByVariant({ week: '2026-W26' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('sends cursor/limit when provided', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse)

    renderHook(() => useMarginAnalyticsByVariant({ week: '2026-W26', cursor: 'abc', limit: 10 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('cursor=abc')
    expect(url).toContain('limit=10')
  })
})
