/**
 * Tests for useDashboard hook
 * Dashboard metrics fetch with optional week parameter
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDashboardMetrics, dashboardQueryKeys } from '../useDashboard'
import * as apiClientModule from '@/lib/api-client'

vi.mock('@/lib/api-client')
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const mockGet = vi.mocked(apiClientModule.apiClient.get)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockWeeksResponse = [
  { week: '2026-W05', start_date: '2026-01-27' },
  { week: '2026-W04', start_date: '2026-01-20' },
]

const mockFinanceSummary = {
  summary_total: {
    to_pay_goods_total: 50000,
    sale_gross_total: 120000,
    gross_profit: 30000,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2026-W05',
    cabinet_id: 'cab-1',
    generated_at: '2026-02-01',
    timezone: 'Europe/Moscow',
  },
}

describe('dashboardQueryKeys', () => {
  it('all returns base key', () => {
    expect(dashboardQueryKeys.all).toEqual(['dashboard'])
  })

  it('metrics includes week', () => {
    expect(dashboardQueryKeys.metrics('2026-W05')).toEqual(['dashboard', 'metrics', '2026-W05'])
  })

  it('expenses includes week', () => {
    expect(dashboardQueryKeys.expenses('2026-W05')).toEqual(['dashboard', 'expenses', '2026-W05'])
  })
})

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches latest week when no week specified', async () => {
    mockGet
      .mockResolvedValueOnce(mockWeeksResponse as never)
      .mockResolvedValueOnce(mockFinanceSummary as never)

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalPayable).toBe(50000)
    expect(result.current.data?.revenue).toBe(120000)
    expect(result.current.data?.grossProfit).toBe(30000)
  })

  it('fetches specific week when week provided', async () => {
    mockGet.mockResolvedValueOnce(mockFinanceSummary as never)

    const { result } = renderHook(() => useDashboardMetrics({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalPayable).toBe(50000)
  })

  it('returns empty metrics when no weeks available', async () => {
    mockGet.mockResolvedValueOnce([] as never)

    const { result } = renderHook(() => useDashboardMetrics(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({})
  })

  it('returns empty metrics when summary is null', async () => {
    mockGet.mockResolvedValueOnce({
      summary_total: null,
      summary_rus: null,
      summary_eaeu: null,
      meta: {},
    } as never)

    const { result } = renderHook(() => useDashboardMetrics({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({})
  })

  it('returns empty metrics on API error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useDashboardMetrics({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({})
  })

  it('disables query for invalid week format', async () => {
    const { result } = renderHook(() => useDashboardMetrics({ week: 'invalid' }), {
      wrapper: createWrapper(),
    })

    // Query should be disabled, so it stays in loading/pending state
    expect(result.current.fetchStatus).toBe('idle')
  })
})
