/**
 * Tests for useExpenseStructure hook
 * Story 63.9-FE: Expense Structure Pie Chart
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useExpenseStructure, expenseStructureQueryKeys } from '../useExpenseStructure'

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

const mockResponse = {
  meta: { week: '2026-W05', view_by: 'total' as const, generated_at: '2026-02-01T00:00:00Z' },
  summary: {
    revenue: 1000000,
    total_costs: 600000,
    gross_profit: 400000,
    gross_margin_pct: 40,
    cost_breakdown: {
      logistics: 200000,
      storage: 50000,
      commissions: 150000,
      cogs: 100000,
      other: 100000,
    },
  },
  data: [],
}

describe('expenseStructureQueryKeys', () => {
  it('generates correct base key', () => {
    expect(expenseStructureQueryKeys.all).toEqual(['expense-structure'])
  })

  it('generates correct byWeek key', () => {
    expect(expenseStructureQueryKeys.byWeek('2026-W05')).toEqual(['expense-structure', '2026-W05'])
  })
})

describe('useExpenseStructure', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches expense structure for given week', async () => {
    mockGet.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useExpenseStructure({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('/v1/analytics/unit-economics?week=2026-W05&view_by=total')
    expect(result.current.data?.summary.gross_profit).toBe(400000)
  })

  it('returns loading state initially', () => {
    mockGet.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useExpenseStructure({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('returns error on API failure', async () => {
    mockGet.mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useExpenseStructure({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })
    expect(result.current.error?.message).toBe('API Error')
  })

  it('is disabled when week is empty', () => {
    const { result } = renderHook(() => useExpenseStructure({ week: '' }), {
      wrapper: createWrapper(),
    })

    expect(mockGet).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('respects enabled=false option', () => {
    const { result } = renderHook(() => useExpenseStructure({ week: '2026-W05', enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(mockGet).not.toHaveBeenCalled()
    expect(result.current.isPending).toBe(true)
  })

  it('fetches data with different week', async () => {
    mockGet.mockResolvedValueOnce({
      ...mockResponse,
      meta: { ...mockResponse.meta, week: '2026-W10' },
    })

    const { result } = renderHook(() => useExpenseStructure({ week: '2026-W10' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockGet).toHaveBeenCalledWith('/v1/analytics/unit-economics?week=2026-W10&view_by=total')
  })

  it('returns cost breakdown data', async () => {
    mockGet.mockResolvedValueOnce(mockResponse)

    const { result } = renderHook(() => useExpenseStructure({ week: '2026-W05' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const breakdown = result.current.data?.summary.cost_breakdown
    expect(breakdown?.logistics).toBe(200000)
    expect(breakdown?.commissions).toBe(150000)
  })
})
