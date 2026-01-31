/**
 * TDD Tests for useOrdersCogsWithComparison Hook
 * Story 61.11-FE: Previous Period Data Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Tests for NEW hook: useOrdersCogsWithComparison
 * This hook should fetch COGS data for both current AND previous periods
 * for use in dashboard comparison displays.
 *
 * CURRENT STATE: Hook does NOT exist. useOrdersCogs only fetches single period.
 * EXPECTED: New hook that mirrors useOrdersVolumeWithComparison pattern.
 *
 * TDD RED PHASE: All tests should FAIL until implementation
 *
 * @see docs/stories/epic-61/story-61.11-fe-previous-period-data.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

// =============================================================================
// Mock Setup
// =============================================================================

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn() },
}))

import { apiClient } from '@/lib/api-client'

// =============================================================================
// Mock Response Fixtures
// =============================================================================

/**
 * Current period COGS response (Week 2026-W05)
 */
const mockCurrentPeriodResponse = {
  total_orders: 250,
  total_amount: 100000,
  cogs_total: 35818,
  gross_profit: 64182,
  margin_pct: 64.18,
  cogs_coverage_pct: 85,
  orders_with_cogs: 213,
  by_status: { complete: 200, cancel: 30, pending: 20 },
  by_day_with_cogs: [],
}

/**
 * Previous period COGS response (Week 2026-W04)
 */
const mockPreviousPeriodResponse = {
  total_orders: 280,
  total_amount: 116077.27,
  cogs_total: 43890,
  gross_profit: 72187.27,
  margin_pct: 62.19,
  cogs_coverage_pct: 80,
  orders_with_cogs: 224,
  by_status: { complete: 230, cancel: 35, pending: 15 },
  by_day_with_cogs: [],
}

/**
 * Empty response for missing data scenario
 */
const mockEmptyResponse = {
  total_orders: 0,
  total_amount: 0,
  cogs_total: 0,
  gross_profit: 0,
  margin_pct: 0,
  cogs_coverage_pct: 0,
  orders_with_cogs: 0,
  by_status: { complete: 0, cancel: 0, pending: 0 },
  by_day_with_cogs: [],
}

// =============================================================================
// Test Utilities
// =============================================================================

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })
}

function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// =============================================================================
// Hook Under Test (Import will fail until implementation)
// =============================================================================

// NOTE: This import will FAIL until the hook is implemented
// import { useOrdersCogsWithComparison } from '@/hooks/useOrdersCogs'
// Expected hook interface documented in tests below

// =============================================================================
// Tests for useOrdersCogsWithComparison Hook
// =============================================================================

describe('useOrdersCogsWithComparison Hook - Story 61.11-FE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ===========================================================================
  // Hook Existence Tests
  // ===========================================================================

  describe('Hook Availability', () => {
    it('should export useOrdersCogsWithComparison from useOrdersCogs module', async () => {
      // RED: This test FAILS because hook doesn't exist yet
      const module = await import('@/hooks/useOrdersCogs')
      expect(module).toHaveProperty('useOrdersCogsWithComparison')
      expect(typeof module.useOrdersCogsWithComparison).toBe('function')
    })
  })

  // ===========================================================================
  // Basic Comparison Functionality
  // ===========================================================================

  describe('Basic Comparison Functionality', () => {
    it('should fetch COGS for both current and previous periods', async () => {
      // Setup: Mock API to return different data for each period
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse) // Current period
        .mockResolvedValueOnce(mockPreviousPeriodResponse) // Previous period

      // RED: Will fail until hook is implemented
      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Verify both periods are populated
      expect(result.current.current).toBeDefined()
      expect(result.current.previous).toBeDefined()

      // Verify current period data
      expect(result.current.current?.cogsTotal).toBe(35818)
      expect(result.current.current?.totalAmount).toBe(100000)

      // Verify previous period data
      expect(result.current.previous?.cogsTotal).toBe(43890)
      expect(result.current.previous?.totalAmount).toBe(116077.27)
    })

    it('should calculate previous week correctly (year boundary)', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockPreviousPeriodResponse)

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W01', // First week of year
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        // Should call API twice: once for W01, once for W52 of previous year
        expect(apiClient.get).toHaveBeenCalledTimes(2)
      })

      // Verify second call uses previous year's last week
      const secondCall = vi.mocked(apiClient.get).mock.calls[1][0]
      expect(secondCall).toContain('2025') // Previous year
    })

    it('should calculate previous month correctly (year boundary)', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockPreviousPeriodResponse)

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'month',
            period: '2026-01', // January
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2)
      })

      // Verify second call uses December of previous year
      const secondCall = vi.mocked(apiClient.get).mock.calls[1][0]
      expect(secondCall).toContain('2025-12') // Previous month (December)
    })
  })

  // ===========================================================================
  // COGS Metrics Transformation
  // ===========================================================================

  describe('COGS Metrics Transformation', () => {
    it('should transform response to OrdersCogsMetrics for both periods', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockPreviousPeriodResponse)

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.current).toBeDefined()
      })

      // Verify current period transformation
      expect(result.current.current).toMatchObject({
        totalOrders: 250,
        totalAmount: 100000,
        cogsTotal: 35818,
        grossProfit: 64182,
        marginPct: expect.any(Number),
        cogsCoveragePct: expect.any(Number),
      })

      // Verify previous period transformation
      expect(result.current.previous).toMatchObject({
        totalOrders: 280,
        totalAmount: 116077.27,
        cogsTotal: 43890,
        grossProfit: 72187.27,
        marginPct: expect.any(Number),
        cogsCoveragePct: expect.any(Number),
      })
    })
  })

  // ===========================================================================
  // Missing Data Handling
  // ===========================================================================

  describe('Missing Previous Period Data', () => {
    it('should return undefined previous when no data exists', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockRejectedValueOnce(new Error('No data for period'))

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Current should be populated
      expect(result.current.current).toBeDefined()
      expect(result.current.current?.cogsTotal).toBe(35818)

      // Previous should be undefined (not error state)
      expect(result.current.previous).toBeUndefined()
      expect(result.current.isError).toBe(false) // Graceful handling
    })

    it('should return null COGS when previous period has zero data', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockEmptyResponse)

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.current).toBeDefined()
      })

      // Previous period has zero COGS
      expect(result.current.previous?.cogsTotal).toBe(0)
      expect(result.current.previous?.totalOrders).toBe(0)
    })
  })

  // ===========================================================================
  // Query Options
  // ===========================================================================

  describe('Query Options', () => {
    it('should respect enabled option', async () => {
      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
            enabled: false,
          }),
        { wrapper: createWrapper() }
      )

      // Should not call API when disabled
      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should not fetch when period is empty', async () => {
      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '',
          }),
        { wrapper: createWrapper() }
      )

      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should use correct query keys for caching', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockPreviousPeriodResponse)

      const { useOrdersCogsWithComparison, ordersCogsQueryKeys } = await import(
        '@/hooks/useOrdersCogs'
      )

      renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2)
      })

      // Verify query keys factory exists
      expect(ordersCogsQueryKeys).toBeDefined()
    })
  })

  // ===========================================================================
  // Loading and Error States
  // ===========================================================================

  describe('Loading and Error States', () => {
    it('should indicate loading while fetching both periods', async () => {
      // Delay responses to test loading state
      vi.mocked(apiClient.get).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockCurrentPeriodResponse), 100)
          })
      )

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      // Initially loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.current).toBeUndefined()
      expect(result.current.previous).toBeUndefined()

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('should handle API error gracefully', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'))

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error?.message).toContain('Network error')
    })
  })

  // ===========================================================================
  // Comparison Calculation Helpers
  // ===========================================================================

  describe('Comparison Calculations', () => {
    it('should support delta calculation between periods', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockPreviousPeriodResponse)

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.current).toBeDefined()
      })

      // Calculate delta manually (implementation may provide helpers)
      const currentCogs = result.current.current?.cogsTotal ?? 0
      const previousCogs = result.current.previous?.cogsTotal ?? 0
      const delta = currentCogs - previousCogs // 35818 - 43890 = -8072 (COGS decreased)

      expect(delta).toBe(-8072)
      expect(delta).toBeLessThan(0) // COGS decreased (good for profit)
    })

    it('should calculate percentage change', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodResponse)
        .mockResolvedValueOnce(mockPreviousPeriodResponse)

      const { useOrdersCogsWithComparison } = await import('@/hooks/useOrdersCogs')

      const { result } = renderHook(
        () =>
          useOrdersCogsWithComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.previous).toBeDefined()
      })

      // Calculate percentage change: ((new - old) / old) * 100
      const currentCogs = result.current.current?.cogsTotal ?? 0
      const previousCogs = result.current.previous?.cogsTotal ?? 1
      const pctChange = ((currentCogs - previousCogs) / previousCogs) * 100

      // (35818 - 43890) / 43890 * 100 = -18.4%
      expect(pctChange).toBeCloseTo(-18.4, 0)
    })
  })
})

// Suppress unused fixture warnings
void mockCurrentPeriodResponse
void mockPreviousPeriodResponse
void mockEmptyResponse
