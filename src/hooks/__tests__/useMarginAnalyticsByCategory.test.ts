/**
 * Unit tests for useMarginAnalyticsByCategory hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useMarginAnalyticsByCategory } from '../useMarginAnalyticsByCategory'

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

const mockRawCategoryItem = {
  subject_name: 'Футболки',
  revenue_gross_rub: '500000',
  revenue_net_rub: '400000',
  total_units: 100,
  sku_count: 5,
  cogs_rub: '200000',
  profit_rub: '200000',
  margin_pct: 50,
  markup_percent: 100,
  missing_cogs_count: 0,
  storage_cost_rub: '5000',
  penalties_rub: '1000',
  paid_acceptance_cost_rub: '2000',
  acquiring_fee_rub: '3000',
  loyalty_fee_rub: '500',
  loyalty_compensation_rub: '200',
  commission_rub: '50000',
  other_adjustments_rub: '0',
  total_expenses_rub: '61700',
  operating_profit_rub: '138300',
  operating_margin_pct: 34.58,
  skus_with_expenses_only: 1,
}

const mockApiResponse = {
  items: [mockRawCategoryItem],
  meta: { week: '2025-W47', cabinet_id: 'cab-1', generated_at: '2025-12-01T00:00:00Z' },
}

describe('useMarginAnalyticsByCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches and transforms category data on success', async () => {
    mockGet.mockResolvedValueOnce(mockApiResponse)

    const { result } = renderHook(() => useMarginAnalyticsByCategory({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const data = result.current.data!
    expect(data.data).toHaveLength(1)
    const category = data.data[0]
    expect(category.category).toBe('Футболки')
    expect(category.qty).toBe(100)
    expect(category.total_skus).toBe(5)
    expect(category.revenue_gross).toBe(500000)
    expect(category.revenue_net).toBe(400000)
    expect(category.operating_margin_pct).toBe(34.58)
    expect(data.meta?.week).toBe('2025-W47')
  })

  it('parses string money fields to numbers', async () => {
    mockGet.mockResolvedValueOnce({
      items: [mockRawCategoryItem],
      meta: {},
    })

    const { result } = renderHook(() => useMarginAnalyticsByCategory({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const category = result.current.data!.data[0]
    expect(typeof category.revenue_gross).toBe('number')
    expect(typeof category.cogs).toBe('number')
    expect(typeof category.profit).toBe('number')
    expect(typeof category.storage_cost).toBe('number')
  })

  it('handles null/missing cogs fields as undefined', async () => {
    mockGet.mockResolvedValueOnce({
      items: [{ ...mockRawCategoryItem, cogs_rub: null, profit_rub: null, margin_pct: null }],
      meta: {},
    })

    const { result } = renderHook(() => useMarginAnalyticsByCategory({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const category = result.current.data!.data[0]
    expect(category.cogs).toBeUndefined()
    expect(category.profit).toBeUndefined()
  })

  it('handles empty items array', async () => {
    mockGet.mockResolvedValueOnce({ items: [], meta: {} })

    const { result } = renderHook(() => useMarginAnalyticsByCategory({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(0)
  })

  it('handles raw array response (no items wrapper)', async () => {
    mockGet.mockResolvedValueOnce([mockRawCategoryItem])

    const { result } = renderHook(() => useMarginAnalyticsByCategory({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data!.data).toHaveLength(1)
  })

  it('is disabled when no week or range provided', () => {
    const { result } = renderHook(() => useMarginAnalyticsByCategory({}), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('handles API error', async () => {
    mockGet.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useMarginAnalyticsByCategory({ week: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Server error')
  })

  it('uses weekStart/weekEnd when provided', async () => {
    mockGet.mockResolvedValueOnce({ items: [], meta: {} })

    renderHook(() => useMarginAnalyticsByCategory({ weekStart: '2025-W40', weekEnd: '2025-W47' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1))
    const url = mockGet.mock.calls[0][0] as string
    expect(url).toContain('weekStart=2025-W40')
    expect(url).toContain('weekEnd=2025-W47')
  })
})
