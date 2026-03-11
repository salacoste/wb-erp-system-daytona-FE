/**
 * Unit tests for useCabinetSummary hook
 * Story 6.4-FE: Cabinet Summary Dashboard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useCabinetSummary } from '../useCabinetSummary'
import { apiClient } from '@/lib/api-client'
import type { CabinetSummaryResponse } from '@/types/analytics'
import React from 'react'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

const mockApiClient = apiClient as any

// Mock response data
const mockCabinetSummary: CabinetSummaryResponse = {
  summary: {
    totals: {
      // Story 25.1: P&L metrics from weekly_payout_total
      sales_gross: 1800000,
      returns_gross: 100000,
      sale_gross: 1700000,
      total_commission_rub: 150000,
      logistics_cost: 50000,
      storage_cost: 10000,
      paid_acceptance_cost: 5000,
      penalties: 2000,
      payout_total: 1483000,
      // Original margin metrics
      revenue_net: 1500000,
      cogs_total: 800000,
      profit: 700000,
      margin_pct: 46.7,
      qty: 1500,
      profit_per_unit: 466.67,
      roi: 87.5,
      // Epic 26: Operating Expenses
      total_expenses: 217000,
      operating_profit: 483000,
      operating_margin_pct: 32.2,
      skus_with_expenses_only: 5,
    },
    products: {
      total: 100,
      with_cogs: 85,
      without_cogs: 15,
      coverage_pct: 85,
    },
    trends: {
      revenue_trend: 'up',
      profit_trend: 'up',
      margin_trend: 'stable',
      week_over_week_growth: 12.5,
    },
  },
  top_products: [
    {
      nm_id: '12345',
      sa_name: 'Product A',
      revenue_net: 150000,
      profit: 60000,
      margin_pct: 40,
      contribution_pct: 10,
    },
  ],
  top_brands: [
    {
      brand: 'Brand X',
      revenue_net: 500000,
      profit: 200000,
      margin_pct: 40,
    },
  ],
  meta: {
    cabinet_id: 'cabinet-123',
    cabinet_name: 'Test Cabinet',
    period: {
      start: '2025-W44',
      end: '2025-W47',
      weeks_count: 4,
    },
    generated_at: '2025-12-05T10:00:00Z',
  },
}

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCabinetSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Query parameters', () => {
    it('should call API with default weeks=4 when no params provided', async () => {
      mockApiClient.get.mockResolvedValue(mockCabinetSummary)

      renderHook(() => useCabinetSummary(), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/v1/analytics/weekly/cabinet-summary?weeks=4'
        )
      })
    })

    it('should call API with custom weeks param', async () => {
      mockApiClient.get.mockResolvedValue(mockCabinetSummary)

      renderHook(() => useCabinetSummary({ weeks: 8 }), { wrapper: createWrapper() })

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/v1/analytics/weekly/cabinet-summary?weeks=8'
        )
      })
    })

    it('should call API with weekStart/weekEnd when both provided', async () => {
      mockApiClient.get.mockResolvedValue(mockCabinetSummary)

      renderHook(
        () => useCabinetSummary({ weekStart: '2025-W40', weekEnd: '2025-W47' }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/v1/analytics/weekly/cabinet-summary?weekStart=2025-W40&weekEnd=2025-W47'
        )
      })
    })

    it('should prefer weekStart/weekEnd over weeks param', async () => {
      mockApiClient.get.mockResolvedValue(mockCabinetSummary)

      renderHook(
        () =>
          useCabinetSummary({
            weeks: 8,
            weekStart: '2025-W40',
            weekEnd: '2025-W47',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          '/v1/analytics/weekly/cabinet-summary?weekStart=2025-W40&weekEnd=2025-W47'
        )
      })
    })
  })

  describe('Data handling', () => {
    it('should return cabinet summary data on success', async () => {
      mockApiClient.get.mockResolvedValue(mockCabinetSummary)

      const { result } = renderHook(() => useCabinetSummary(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockCabinetSummary)
      expect(result.current.data?.summary.totals.revenue_net).toBe(1500000)
      expect(result.current.data?.top_products).toHaveLength(1)
      expect(result.current.data?.top_brands).toHaveLength(1)
    })

    it('should handle API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'))

      const { result } = renderHook(() => useCabinetSummary(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('Query key isolation', () => {
    it('should have different query keys for different params', async () => {
      mockApiClient.get.mockResolvedValue(mockCabinetSummary)

      const { result: result1 } = renderHook(() => useCabinetSummary({ weeks: 4 }), {
        wrapper: createWrapper(),
      })

      const { result: result2 } = renderHook(() => useCabinetSummary({ weeks: 8 }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
        expect(result2.current.isSuccess).toBe(true)
      })

      // Both should be called - different query keys
      expect(mockApiClient.get).toHaveBeenCalledTimes(2)
    })
  })
})
