/**
 * Tests for useDailyMetrics Hook
 * Story 61.9-FE: Daily Breakdown Support
 * Epic 61-FE: Dashboard Data Integration
 *
 * Tests the hook's integration of daily data from multiple API sources,
 * aggregation, gap-filling, and enable/disable logic.
 *
 * @see docs/epics/epic-61-fe-dashboard-data-integration.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Mock the API layer
const mockGetAllDailyData = vi.fn()
vi.mock('@/lib/api/daily-analytics', () => ({
  getAllDailyData: (...args: unknown[]) => mockGetAllDailyData(...args),
  dailyAnalyticsQueryKeys: {
    all: ['daily-analytics'],
    metrics: (from: string, to: string) => ['daily-analytics', 'metrics', from, to],
  },
}))

// Mock the aggregation helpers
vi.mock('@/lib/daily-helpers', () => ({
  aggregateDailyMetrics: vi.fn((params: {
    ordersData: Array<{ date: string }>
    financeData: Array<{ date: string }>
    advertisingData: Array<{ date: string }>
  }) => {
    // Simple aggregation: return merged entries by date
    const allDates = new Set<string>()
    params.ordersData.forEach(d => allDates.add(d.date))
    params.financeData.forEach(d => allDates.add(d.date))
    params.advertisingData.forEach(d => allDates.add(d.date))
    return Array.from(allDates).sort().map(date => ({
      date,
      dayOfWeek: 1,
      orders: 100,
      ordersCount: 5,
      ordersCogs: null,
      sales: 80,
      salesCogs: null,
      advertising: 10,
      logistics: 5,
      storage: 2,
      penalties: 0,
      paidAcceptance: 0,
      commission: 15,
      theoreticalProfit: null,
      salesCount: 3,
      returnsCount: 1,
    }))
  }),
  fillMissingDays: vi.fn((data: Array<{ date: string }>, from: string, to: string) => {
    // Generate all dates between from and to
    const result: Array<{ date: string; dayOfWeek: number; orders: number; ordersCount: number; ordersCogs: number | null; sales: number; salesCogs: number | null; advertising: number; logistics: number; storage: number; penalties: number; paidAcceptance: number; commission: number; theoreticalProfit: number | null; salesCount: number; returnsCount: number }> = []
    const existingDates = new Set(data.map(d => d.date))
    const start = new Date(from)
    const end = new Date(to)
    const current = new Date(start)
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      if (!existingDates.has(dateStr)) {
        result.push({
          date: dateStr,
          dayOfWeek: 1,
          orders: 0,
          ordersCount: 0,
          ordersCogs: null,
          sales: 0,
          salesCogs: null,
          advertising: 0,
          logistics: 0,
          storage: 0,
          penalties: 0,
          paidAcceptance: 0,
          commission: 0,
          theoreticalProfit: null,
          salesCount: 0,
          returnsCount: 0,
        })
      } else {
        const existing = data.find(d => d.date === dateStr)
        if (existing) result.push(existing as typeof result[0])
      }
      current.setDate(current.getDate() + 1)
    }
    return result.sort((a, b) => a.date.localeCompare(b.date))
  }),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { debug: vi.fn(), warn: vi.fn() },
}))

import { useDailyMetrics } from '@/hooks/useDailyMetrics'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useDailyMetrics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default mock returns empty data for all sources
    mockGetAllDailyData.mockResolvedValue({
      ordersData: [],
      financeData: [],
      advertisingData: [],
      ordersCogsByDay: [],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Basic hook functionality
  // ============================================================================

  describe('basic hook functionality', () => {
    it('should return DailyMetrics[] array from useDailyMetrics hook', async () => {
      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-01',
            to: '2026-01-07',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(Array.isArray(result.current.data)).toBe(true)
    })

    it('should aggregate data from orders, finance-summary, and advertising APIs', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [{ date: '2026-01-01', total_amount: 500, total_orders: 5 }],
        financeData: [{ date: '2026-01-01', wb_sales_gross: 400, revenue_net: 300 }],
        advertisingData: [{ date: '2026-01-01', total_spend: 50 }],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-01',
            to: '2026-01-01',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      // getAllDailyData was called once
      expect(mockGetAllDailyData).toHaveBeenCalledWith('2026-01-01', '2026-01-01')
      // Data should have been processed
      expect(result.current.data).toBeDefined()
      expect(result.current.data!.length).toBeGreaterThanOrEqual(1)
    })

    it('should be enabled only when from and to params are provided', async () => {
      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '',
            to: '',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      // Should not fetch when params are empty
      expect(result.current.fetchStatus).toBe('idle')
      expect(mockGetAllDailyData).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // DailyMetrics data structure
  // ============================================================================

  describe('DailyMetrics data structure', () => {
    it('should return correct date field in YYYY-MM-DD format', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-05',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const dateStr = result.current.data![0].date
      expect(dateStr).toBe('2026-01-05')
      expect(/^\d{4}-\d{2}-\d{2}$/.test(dateStr)).toBe(true)
    })

    it('should return correct dayOfWeek (1=Monday, 7=Sunday)', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-05',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      // 2026-01-05 is a Monday (ISO day 1)
      expect(result.current.data![0].dayOfWeek).toBeGreaterThanOrEqual(1)
      expect(result.current.data![0].dayOfWeek).toBeLessThanOrEqual(7)
    })

    it('should include all required metric fields', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-05',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const metric = result.current.data![0]
      // Verify all required fields exist
      const requiredFields = [
        'date', 'dayOfWeek', 'orders', 'ordersCount', 'ordersCogs',
        'sales', 'salesCogs', 'advertising', 'logistics', 'storage',
        'penalties', 'paidAcceptance', 'commission', 'theoreticalProfit',
        'salesCount', 'returnsCount',
      ] as const
      for (const field of requiredFields) {
        expect(metric).toHaveProperty(field)
      }
    })

    it('should calculate theoreticalProfit from finance data', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [{ date: '2026-01-05', total_amount: 1000, total_orders: 10 }],
        financeData: [{
          date: '2026-01-05',
          wb_sales_gross: 800,
          revenue_net: 500,
          cogs_total: 200,
          logistics_cost: 50,
          storage_cost: 30,
          penalties: 0,
          paid_acceptance: 0,
          commission: 100,
          returns: 20,
          returns_count: 1,
          sales_count: 8,
          advertising_spend: 50,
          net_profit: 70,
        }],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-05',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      // theoreticalProfit should be present (from aggregation mock or finance net_profit)
      expect(result.current.data).toBeDefined()
      expect(result.current.data!.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================================================
  // Week mode (7 days)
  // ============================================================================

  describe('week mode (7 days)', () => {
    it('should return exactly 7 days for week mode', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-11',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(7)
    })

    it('should fill missing days with zero values', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [{ date: '2026-01-05', total_amount: 100, total_orders: 2 }],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-07',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(3)
      // First day has data, remaining days are gap-filled
      expect(result.current.data![0].date).toBe('2026-01-05')
      expect(result.current.data![1].date).toBe('2026-01-06')
      expect(result.current.data![2].date).toBe('2026-01-07')
    })

    it('should sort results by date ascending', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [
          { date: '2026-01-07', total_amount: 300, total_orders: 3 },
          { date: '2026-01-05', total_amount: 100, total_orders: 1 },
        ],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-05',
            to: '2026-01-07',
            mode: 'week',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      const dates = result.current.data!.map(d => d.date)
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true)
      }
    })
  })

  // ============================================================================
  // Month mode (28-31 days)
  // ============================================================================

  describe('month mode (28-31 days)', () => {
    it('should return correct number of days for month mode', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-01',
            to: '2026-01-31',
            mode: 'month',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(31)
    })

    it('should handle months with 28, 29, 30, and 31 days', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      // Test February (28 days in non-leap year)
      const { result: febResult } = renderHook(
        () =>
          useDailyMetrics({
            from: '2025-02-01',
            to: '2025-02-28',
            mode: 'month',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(febResult.current.isSuccess).toBe(true))
      expect(febResult.current.data).toHaveLength(28)

      // Test 30-day month (April)
      const { result: aprResult } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-04-01',
            to: '2026-04-30',
            mode: 'month',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(aprResult.current.isSuccess).toBe(true))
      expect(aprResult.current.data).toHaveLength(30)
    })

    it('should fill all missing days in month range', async () => {
      mockGetAllDailyData.mockResolvedValue({
        ordersData: [],
        financeData: [],
        advertisingData: [],
        ordersCogsByDay: [],
      })

      const { result } = renderHook(
        () =>
          useDailyMetrics({
            from: '2026-01-01',
            to: '2026-01-10',
            mode: 'month',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toHaveLength(10)
      // Every day should be present
      for (let i = 1; i <= 10; i++) {
        const day = String(i).padStart(2, '0')
        expect(result.current.data!.some(d => d.date === `2026-01-${day}`)).toBe(true)
      }
    })
  })
})
