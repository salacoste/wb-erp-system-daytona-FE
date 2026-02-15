/**
 * Unit tests for useTrends hook
 * Story 3.4: Trend Graphs for Key Metrics
 * Story 3.4a: Trends API Optimization - Single endpoint tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTrends } from './useTrends'
import { apiClient } from '@/lib/api-client'
import type { WeeklyTrendsResponse } from '@/types/api'

// Mock apiClient
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Story 3.4a: Single Endpoint Optimization', () => {
    it('makes only one API call to /v1/analytics/weekly/trends', async () => {
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W44', to: '2025-W46', weeks_count: 3 },
        data: [
          { week: '2025-W44', sale_gross: 80000, to_pay_goods: 40000 },
          { week: '2025-W45', sale_gross: 100000, to_pay_goods: 50000 },
          { week: '2025-W46', sale_gross: 120000, to_pay_goods: 60000 },
        ],
        summary: {
          sale_gross: { min: 80000, max: 120000, avg: 100000, trend: '+50.0%' },
          to_pay_goods: { min: 40000, max: 60000, avg: 50000, trend: '+50.0%' },
        },
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(3), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // Should make exactly ONE API call (optimized)
      expect(apiClient.get).toHaveBeenCalledTimes(1)

      // Should call the trends endpoint with correct parameters
      // Story 61.1: Use wb_sales_gross (seller revenue after WB commission), NOT sale_gross
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringMatching(
          /\/v1\/analytics\/weekly\/trends\?from=.*&to=.*&metrics=wb_sales_gross,to_pay_goods/
        )
      )
    })

    it('fetches trend data for multiple weeks', async () => {
      // Story 61.1: Use wb_sales_gross (seller revenue after WB commission)
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W45', to: '2025-W46', weeks_count: 2 },
        data: [
          { week: '2025-W45', wb_sales_gross: 120000, to_pay_goods: 60000 },
          { week: '2025-W46', wb_sales_gross: 100000, to_pay_goods: 50000 },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(2), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toBeDefined()
      expect(result.current.data?.trends).toHaveLength(2)

      // Trends are sorted chronologically (ascending by week)
      expect(result.current.data?.trends[0]).toMatchObject({
        week: '2025-W45',
        revenue: 120000,
        totalPayable: 60000,
      })
      expect(result.current.data?.trends[1]).toMatchObject({
        week: '2025-W46',
        revenue: 100000,
        totalPayable: 50000,
      })
    })

    it('returns summary statistics from API', async () => {
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W44', to: '2025-W46', weeks_count: 3 },
        data: [
          { week: '2025-W44', sale_gross: 80000, to_pay_goods: 40000 },
          { week: '2025-W45', sale_gross: 100000, to_pay_goods: 50000 },
          { week: '2025-W46', sale_gross: 120000, to_pay_goods: 60000 },
        ],
        summary: {
          sale_gross: { min: 80000, max: 120000, avg: 100000, trend: '+50.0%' },
          to_pay_goods: { min: 40000, max: 60000, avg: 50000, trend: '+50.0%' },
        },
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(3), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.summary).toBeDefined()
      expect(result.current.data?.summary?.sale_gross?.trend).toBe('+50.0%')
      expect(result.current.data?.summary?.to_pay_goods?.min).toBe(40000)
    })
  })

  describe('Empty data handling', () => {
    it('handles empty data array from API', async () => {
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W44', to: '2025-W46', weeks_count: 3 },
        data: [],
        message: 'No data available for the specified period',
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(8), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.trends).toEqual([])
      expect(result.current.data?.period).toBe('weeks')
    })

    it('handles null data from API', async () => {
      const mockResponse = {
        period: { from: '2025-W44', to: '2025-W46', weeks_count: 3 },
        data: null,
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(8), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.trends).toEqual([])
    })
  })

  describe('Error handling', () => {
    it('handles API errors gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('API Error'))

      const { result } = renderHook(() => useTrends(8), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isError || result.current.isSuccess).toBe(true))

      // Should return empty trends on error (graceful degradation)
      if (result.current.isSuccess) {
        expect(result.current.data).toEqual({ trends: [], period: 'weeks' })
      }
    })

    it('handles 404 errors gracefully', async () => {
      const error = new Error('Not Found') as Error & { response?: { status: number } }
      error.response = { status: 404 }
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTrends(8), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual({ trends: [], period: 'weeks' })
    })

    it('handles 400 errors gracefully', async () => {
      const error = new Error('Bad Request') as Error & {
        response?: { status: number; data?: { message: string } }
      }
      error.response = { status: 400, data: { message: 'Invalid week format' } }
      vi.mocked(apiClient.get).mockRejectedValueOnce(error)

      const { result } = renderHook(() => useTrends(8), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data).toEqual({ trends: [], period: 'weeks' })
    })
  })

  describe('Data sorting', () => {
    it('sorts trends by week in ascending order', async () => {
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W44', to: '2025-W46', weeks_count: 3 },
        // API may return in any order
        data: [
          { week: '2025-W46', sale_gross: 120000, to_pay_goods: 60000 },
          { week: '2025-W44', sale_gross: 80000, to_pay_goods: 40000 },
          { week: '2025-W45', sale_gross: 100000, to_pay_goods: 50000 },
        ],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(3), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.trends).toHaveLength(3)
      // Should be sorted ascending by week
      expect(result.current.data?.trends[0].week).toBe('2025-W44')
      expect(result.current.data?.trends[1].week).toBe('2025-W45')
      expect(result.current.data?.trends[2].week).toBe('2025-W46')
    })
  })

  describe('Data mapping', () => {
    // Story 61.1: Use wb_sales_gross (seller revenue after WB commission), NOT sale_gross
    it('maps wb_sales_gross to revenue and to_pay_goods to totalPayable', async () => {
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W46', to: '2025-W46', weeks_count: 1 },
        data: [{ week: '2025-W46', wb_sales_gross: 150000, to_pay_goods: 75000 }],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(1), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.trends[0]).toMatchObject({
        week: '2025-W46',
        date: '2025-W46', // Uses week as date
        revenue: 150000, // Mapped from sale_gross
        totalPayable: 75000, // Mapped from to_pay_goods
      })
    })

    it('handles null metric values by defaulting to 0', async () => {
      const mockResponse: WeeklyTrendsResponse = {
        period: { from: '2025-W46', to: '2025-W46', weeks_count: 1 },
        data: [{ week: '2025-W46', sale_gross: null, to_pay_goods: null }],
      }

      vi.mocked(apiClient.get).mockResolvedValueOnce(mockResponse)

      const { result } = renderHook(() => useTrends(1), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(result.current.data?.trends[0]).toMatchObject({
        week: '2025-W46',
        revenue: 0, // null defaults to 0
        totalPayable: 0, // null defaults to 0
      })
    })
  })
})
