/**
 * TDD Unit Tests for useDashboardMetrics with Period Support
 * Story 60.4-FE: Connect Dashboard to Period State
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Tests written BEFORE implementation following TDD red-green-refactor cycle.
 *
 * KEY REQUIREMENTS:
 * - AC1: Dashboard page wrapped with DashboardPeriodProvider
 * - AC2: useDashboardMetrics hook accepts optional week parameter
 * - AC3: Period changes trigger automatic refetch
 * - AC4: Both current and previous period data fetched in parallel
 * - AC5: ExpenseChart receives week parameter from context
 * - AC6: Skeleton loaders during period transition
 * - AC7: Query keys include week: ['dashboard', 'metrics', week]
 * - AC8: Query invalidation on refresh button click
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/test-utils'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    cabinetId: 'test-cabinet-id',
  })),
}))

// Import mocked modules after mock setup
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'

// Import implementations
import { useDashboardMetrics, dashboardQueryKeys } from '../useDashboard'

// ==========================================================================
// Test Fixtures
// ==========================================================================

const mockAvailableWeeks = [
  { week: '2026-W05', start_date: '2026-01-27' },
  { week: '2026-W04', start_date: '2026-01-20' },
  { week: '2026-W03', start_date: '2026-01-13' },
]

const mockFinanceSummary2026W05 = {
  summary_total: {
    week: '2026-W05',
    to_pay_goods_total: 1500000,
    sale_gross_total: 2000000,
    payout_total: 1400000,
    logistics_cost_total: 50000,
    storage_cost_total: 30000,
    penalties_total: 10000,
    cogs_coverage_pct: 85,
    products_with_cogs: 170,
    products_total: 200,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2026-W05',
    cabinet_id: 'test-cabinet-id',
    generated_at: '2026-01-29T10:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

const mockFinanceSummary2026W04 = {
  summary_total: {
    week: '2026-W04',
    to_pay_goods_total: 1200000,
    sale_gross_total: 1800000,
    payout_total: 1100000,
    logistics_cost_total: 45000,
    storage_cost_total: 28000,
    penalties_total: 8000,
    cogs_coverage_pct: 80,
    products_with_cogs: 160,
    products_total: 200,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2026-W04',
    cabinet_id: 'test-cabinet-id',
    generated_at: '2026-01-22T10:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

// ==========================================================================
// Tests
// ==========================================================================

describe('useDashboardMetrics with Period Support - Story 60.4-FE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      cabinetId: 'test-cabinet-id',
    } as ReturnType<typeof useAuthStore>)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // AC2: Hook accepts optional week parameter
  // ==========================================================================

  describe('week parameter handling (AC2)', () => {
    it('should fetch data for specified week when week parameter provided', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce(mockFinanceSummary2026W05)

      const { result } = renderHook(() => useDashboardMetrics({ week: '2026-W05' }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('week=2026-W05'))
      expect(result.current.data?.totalPayable).toBe(1500000)
    })

    it('should fetch latest available week when no week parameter provided', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockAvailableWeeks) // available-weeks call
        .mockResolvedValueOnce(mockFinanceSummary2026W05) // finance-summary call

      const { result } = renderHook(() => useDashboardMetrics(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Should use latest week (2026-W05)
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('week=2026-W05'))
    })

    it('should handle undefined week parameter same as no parameter', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockAvailableWeeks)
        .mockResolvedValueOnce(mockFinanceSummary2026W05)

      const { result } = renderHook(() => useDashboardMetrics({ week: undefined }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Should fallback to latest week
      expect(apiClient.get).toHaveBeenCalledWith(expect.stringContaining('week=2026-W05'))
    })

    it('should not fetch for invalid week format', async () => {
      const { result } = renderHook(() => useDashboardMetrics({ week: 'invalid-format' }), {
        wrapper: createQueryWrapper(),
      })

      // Query should be disabled for invalid week
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  // ==========================================================================
  // AC7: Query keys include week parameter
  // ==========================================================================

  describe('query key isolation (AC7)', () => {
    it('should use correct query key format: ["dashboard", "metrics", week]', () => {
      expect(dashboardQueryKeys.metrics('2026-W05')).toEqual(['dashboard', 'metrics', '2026-W05'])
      expect(dashboardQueryKeys.metrics(undefined)).toEqual(['dashboard', 'metrics', undefined])
    })

    it.todo('should include week in query key for cache isolation')
    it.todo('should not reuse cached data for different weeks')
  })

  // ==========================================================================
  // AC3: Refetch on period change
  // ==========================================================================

  describe('refetch on period change (AC3)', () => {
    it('should refetch when week parameter changes', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockFinanceSummary2026W05)
        .mockResolvedValueOnce(mockFinanceSummary2026W04)

      const { result, rerender } = renderHook(({ week }) => useDashboardMetrics({ week }), {
        wrapper: createQueryWrapper(),
        initialProps: { week: '2026-W05' },
      })

      await waitFor(() => expect(result.current.data?.totalPayable).toBe(1500000))

      // Change week
      rerender({ week: '2026-W04' })

      await waitFor(() => expect(result.current.data?.totalPayable).toBe(1200000))
      expect(apiClient.get).toHaveBeenCalledTimes(2)
    })

    it.todo('should show loading state during refetch')
    it.todo('should preserve previous data during refetch (keepPreviousData)')
  })

  // ==========================================================================
  // AC4: Parallel fetching for comparison
  // ==========================================================================

  describe('useDashboardMetricsWithComparison (AC4)', () => {
    it.todo('should fetch both current and previous periods in parallel')
    it.todo('should return null for previous when previous week unavailable')
    it.todo('should track loading states for current and previous independently')
    it.todo('should calculate change percentages between periods')
  })

  // ==========================================================================
  // AC8: Manual refresh / query invalidation
  // ==========================================================================

  describe('manual refresh (AC8)', () => {
    it('should provide refetch function', async () => {
      vi.mocked(apiClient.get).mockResolvedValue(mockFinanceSummary2026W05)

      const { result } = renderHook(() => useDashboardMetrics({ week: '2026-W05' }), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(typeof result.current.refetch).toBe('function')
    })

    it.todo('should invalidate queries for all weeks on full refresh')
  })

  // ==========================================================================
  // Error handling
  // ==========================================================================

  describe('error handling', () => {
    it.todo('should handle API errors gracefully')
    it.todo('should handle 404 for non-existent week')

    it('should return empty metrics when no weeks available', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]) // empty available-weeks

      const { result } = renderHook(() => useDashboardMetrics(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      expect(result.current.data).toEqual({})
    })
  })

  // ==========================================================================
  // Stale time configuration
  // ==========================================================================

  describe('stale time configuration', () => {
    it.todo('should use 60s stale time for current period')
    it.todo('should use 5min stale time for previous period (historical)')
  })

  // ==========================================================================
  // Context fallback
  // ==========================================================================

  describe('context fallback', () => {
    it('should work without DashboardPeriodContext (fallback to latest)', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockAvailableWeeks)
        .mockResolvedValueOnce(mockFinanceSummary2026W05)

      // Render without context provider
      const { result } = renderHook(() => useDashboardMetrics(), {
        wrapper: createQueryWrapper(),
      })

      await waitFor(() => expect(result.current.isLoading).toBe(false))

      // Should successfully fetch latest week
      expect(result.current.data?.totalPayable).toBe(1500000)
    })
  })
})

// ==========================================================================
// Query Keys Export Tests
// ==========================================================================

describe('dashboardQueryKeys', () => {
  it('should export dashboardQueryKeys.all', () => {
    expect(dashboardQueryKeys.all).toEqual(['dashboard'])
  })

  it('should export dashboardQueryKeys.metrics factory', () => {
    expect(dashboardQueryKeys.metrics('2026-W05')).toEqual(['dashboard', 'metrics', '2026-W05'])
  })

  it('should handle undefined week in query key', () => {
    expect(dashboardQueryKeys.metrics(undefined)).toEqual(['dashboard', 'metrics', undefined])
  })
})
