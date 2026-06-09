/**
 * Tests for useCabinetLevelExpenses hook
 * Epic 74: Extracted from useMarginAnalytics.ts
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCabinetLevelExpenses } from '../useCabinetLevelExpenses'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/lib/api-client'

const mockGet = vi.mocked(apiClient.get)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

const mockExpenses = {
  sales_gross: 500000,
  returns_gross: 20000,
  marketplace_commission: 75000,
  acquiring_fee: 5000,
  cogs_total: 150000,
  gross_profit_sku: 250000,
  logistics: 30000,
  storage: 10000,
  storage_weekly_report: 9500,
  storage_difference: 500,
  other_adjustments: 2000,
  wb_commission_adj: 1000,
  penalties: 0,
  paid_acceptance: 5000,
  total: 53000,
  weeks_included: ['2026-W18', '2026-W19'],
}

describe('useCabinetLevelExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches cabinet expenses with both weeks provided', async () => {
    mockGet.mockResolvedValueOnce({ data: mockExpenses })

    const { result } = renderHook(
      () => useCabinetLevelExpenses({ weekStart: '2026-W18', weekEnd: '2026-W19' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith(
      expect.stringContaining('/v1/analytics/weekly/cabinet-expenses?')
    )
    expect(result.current.data?.logistics).toBe(30000)
    expect(result.current.data?.storage).toBe(10000)
  })

  it('handles unwrapped response (no data wrapper)', async () => {
    mockGet.mockResolvedValueOnce(mockExpenses)

    const { result } = renderHook(
      () => useCabinetLevelExpenses({ weekStart: '2026-W18', weekEnd: '2026-W19' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.logistics).toBe(30000)
  })

  it('returns loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(
      () => useCabinetLevelExpenses({ weekStart: '2026-W18', weekEnd: '2026-W19' }),
      { wrapper: createWrapper() }
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('returns error on API failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(
      () => useCabinetLevelExpenses({ weekStart: '2026-W18', weekEnd: '2026-W19' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('Network error')
  })

  it('is disabled when weekStart is missing', () => {
    const { result } = renderHook(() => useCabinetLevelExpenses({ weekEnd: '2026-W19' }), {
      wrapper: createWrapper(),
    })

    expect(mockGet).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('is disabled when weekEnd is missing', () => {
    const { result } = renderHook(() => useCabinetLevelExpenses({ weekStart: '2026-W18' }), {
      wrapper: createWrapper(),
    })

    expect(mockGet).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('returns weeks_included from response', async () => {
    mockGet.mockResolvedValueOnce({ data: mockExpenses })

    const { result } = renderHook(
      () => useCabinetLevelExpenses({ weekStart: '2026-W18', weekEnd: '2026-W19' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.weeks_included).toEqual(['2026-W18', '2026-W19'])
  })

  it('passes weekStart and weekEnd as query params', async () => {
    mockGet.mockResolvedValueOnce({ data: mockExpenses })

    const { result } = renderHook(
      () => useCabinetLevelExpenses({ weekStart: '2026-W10', weekEnd: '2026-W20' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const calledUrl = mockGet.mock.calls[0][0] as string
    expect(calledUrl).toContain('weekStart=2026-W10')
    expect(calledUrl).toContain('weekEnd=2026-W20')
  })
})
