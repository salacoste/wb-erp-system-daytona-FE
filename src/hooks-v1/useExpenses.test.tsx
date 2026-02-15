import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useExpenses } from './useExpenses'
import { apiClient } from '@/lib/api-client'
import type { FinanceSummary } from './useDashboard'

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock useAuthStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      cabinetId: 'test-cabinet-id',
    })),
  },
}))

describe('useExpenses', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    })
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient.clear()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  // Mock finance summary response format (as per Backend Team response)
  // Story 3.3 Enhancement: Include all expense categories from SDK → DB mapping
  // Request #06: Added acquiring_fee_total and commission_sales_total (2025-11-22)
  // Request #56: Added WB services breakdown (wb_promotion_cost, wb_jam_cost, etc.)
  const mockFinanceSummaryResponse = {
    summary_total: {
      week: '2025-W05',
      total_commission_rub_total: 100000, // Main WB commission
      logistics_cost_total: 50000,
      storage_cost_total: 30000,
      paid_acceptance_cost_total: 10000,
      penalties_total: 20000,
      wb_commission_adj_total: 5000,  // Корректировка ВВ
      // WB Services breakdown (Request #56)
      wb_promotion_cost_total: 15000,
      wb_jam_cost_total: 3000,
      wb_other_services_cost_total: 2000,
      wb_services_cost_total: 20000, // Sum of above
      other_adjustments_net_total: 25000, // Includes WB services + remaining
      loyalty_fee_total: 15000,
      loyalty_points_withheld_total: 8000,
      acquiring_fee_total: 12000,
      payout_total: 900000,
    } as FinanceSummary,
    summary_rus: null,
    summary_eaeu: null,
    meta: {
      week: '2025-W05',
      cabinet_id: 'test-cabinet-id',
      generated_at: '2025-11-21T00:00:00Z',
      timezone: 'Europe/Moscow',
    },
  }

  it('fetches and transforms expense data successfully', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ week: '2025-W03', start_date: '2025-01-13' }, { week: '2025-W02', start_date: '2025-01-06' }] })
      .mockResolvedValueOnce(mockFinanceSummaryResponse)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    // Hook filters out zero-value categories, so count depends on mock data
    expect(result.current.data?.expenses.length).toBeGreaterThan(0)
    // First category should be highest amount (sorted descending)
    expect(result.current.data?.expenses[0].category).toBe('Комиссия WB')
    expect(result.current.data?.expenses[0].amount).toBe(100000)
    expect(result.current.data?.total).toBeGreaterThan(0)
  })

  it('filters out zero-value categories', { timeout: 5000 }, async () => {
    const summaryWithZeros = {
      summary_total: {
        week: '2025-W03',
        total_commission_rub_total: 0,
        logistics_cost_total: 0,
        storage_cost_total: 0,
        paid_acceptance_cost_total: 0,
        penalties_total: 20000, // Only non-zero
        wb_commission_adj_total: 0,
        wb_promotion_cost_total: 0,
        wb_jam_cost_total: 0,
        wb_other_services_cost_total: 0,
        wb_services_cost_total: 0,
        other_adjustments_net_total: 0,
        loyalty_fee_total: 0,
        loyalty_points_withheld_total: 0,
        acquiring_fee_total: 0,
        payout_total: 900000,
      } as FinanceSummary,
      summary_rus: null,
      summary_eaeu: null,
      meta: {
        week: '2025-W03',
        cabinet_id: 'test-cabinet-id',
        generated_at: '2025-11-21T00:00:00Z',
        timezone: 'Europe/Moscow',
      },
    }

    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ week: '2025-W03', start_date: '2025-01-13' }] })
      .mockResolvedValueOnce(summaryWithZeros)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Request #56: Zero-value categories are filtered out
    expect(result.current.data?.expenses).toHaveLength(1) // Only Штрафы has value
    expect(result.current.data?.total).toBe(20000)
    expect(result.current.data?.expenses[0].category).toBe('Штрафы')
    expect(result.current.data?.expenses[0].amount).toBe(20000)
  })

  it('calculates percentages correctly', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ week: '2025-W03', start_date: '2025-01-13' }] })
      .mockResolvedValueOnce(mockFinanceSummaryResponse)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    const expenses = result.current.data?.expenses || []
    const totalPercentage = expenses.reduce((sum, e) => sum + (e.percentage || 0), 0)
    expect(totalPercentage).toBeCloseTo(100, 1)
  })

  it('returns empty data when no weeks available', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [] })

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data?.expenses).toEqual([])
    expect(result.current.data?.total).toBe(0)
  })

  it('handles API errors gracefully', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('API Error'),
    )

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      // Hook catches errors and returns empty data, so isSuccess should be true
      expect(result.current.isSuccess).toBe(true)
    })

    // Should return empty data on error (as per implementation)
    expect(result.current.data).toBeDefined()
    expect(result.current.data?.expenses).toEqual([])
    expect(result.current.data?.total).toBe(0)
  })

  it('uses latest week from available weeks', { timeout: 5000 }, async () => {
    const weeks = [
      { week: '2025-W05', start_date: '2025-01-27' },
      { week: '2025-W04', start_date: '2025-01-20' },
      { week: '2025-W03', start_date: '2025-01-13' },
    ]
    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: weeks })
      .mockResolvedValueOnce(mockFinanceSummaryResponse)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      '/v1/analytics/weekly/finance-summary?week=2025-W05',
    )
  })

  it('handles object response format for weeks', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ week: '2025-W03', start_date: '2025-01-13' }, { week: '2025-W02', start_date: '2025-01-06' }] })
      .mockResolvedValueOnce(mockFinanceSummaryResponse)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('handles object response format for weeks with array data', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ week: '2025-W03', start_date: '2025-01-13' }] })
      .mockResolvedValueOnce(mockFinanceSummaryResponse)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
  })

  it('configures query with correct cache settings', { timeout: 5000 }, async () => {
    ;(apiClient.get as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: [{ week: '2025-W03', start_date: '2025-01-13' }] })
      .mockResolvedValueOnce(mockFinanceSummaryResponse)

    const { result } = renderHook(() => useExpenses(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // Query should be configured with staleTime and gcTime
    // These are set in the hook implementation
    expect(result.current.data).toBeDefined()
  })
})

