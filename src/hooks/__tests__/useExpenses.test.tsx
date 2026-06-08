/**
 * Tests for useExpenses hook
 * Expense breakdown fetch with week validation and previous period comparison
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExpenses } from '../useExpenses'
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
    sale_gross_total: 100000,
    total_commission_rub_total: 15000,
    logistics_cost_total: 5000,
    storage_cost_total: 2000,
    paid_acceptance_cost_total: 1000,
    other_adjustments_net_total: 0,
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

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty expenses when no available weeks', async () => {
    mockGet.mockResolvedValueOnce([] as never)

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expenses).toEqual([])
    expect(result.current.data?.total).toBe(0)
  })

  it('fetches expenses for latest week', async () => {
    mockGet
      .mockResolvedValueOnce(mockWeeksResponse as never)
      .mockResolvedValueOnce(mockFinanceSummary as never)

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expenses.length).toBeGreaterThan(0)
    expect(result.current.data?.total).toBeGreaterThan(0)
  })

  it('returns empty when specified week not in available weeks', async () => {
    mockGet.mockResolvedValueOnce(mockWeeksResponse as never)

    const { result } = renderHook(() => useExpenses('2026-W99'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expenses).toEqual([])
  })

  it('fetches expenses for specified week override', async () => {
    mockGet
      .mockResolvedValueOnce(mockWeeksResponse as never)
      .mockResolvedValueOnce(mockFinanceSummary as never)

    const { result } = renderHook(() => useExpenses('2026-W05'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expenses.length).toBeGreaterThan(0)
  })

  it('returns empty when summary is null', async () => {
    mockGet.mockResolvedValueOnce(mockWeeksResponse as never).mockResolvedValueOnce({
      summary_total: null,
      summary_rus: null,
      summary_eaeu: null,
      meta: {},
    } as never)

    const { result } = renderHook(() => useExpenses('2026-W05'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expenses).toEqual([])
  })

  it('returns empty on API error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.expenses).toEqual([])
  })
})
