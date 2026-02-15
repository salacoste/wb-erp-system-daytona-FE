/**
 * TDD Tests for useFinancialSummary Hook - Margin Consistency
 * Story 61.13-FE: Fix Margin Calculation Inconsistency (Week vs Month)
 *
 * These tests verify that the hook returns consistent margin_pct values
 * regardless of whether the period is a week or a month.
 *
 * BUG DESCRIPTION:
 * - Week view: Shows ~12.92% (Net Margin - uses gross_profit from API)
 * - Month view: Shows ~72.32% (Gross Margin - calculated correctly)
 *
 * EXPECTED BEHAVIOR:
 * Both week and month should use Gross Margin formula:
 * margin_pct = (sale_gross_total - cogs_total) / sale_gross_total * 100
 *
 * @see docs/stories/epic-61/story-61.13-fe-margin-consistency.md
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useFinancialSummary } from '../financial'
import { apiClient } from '@/lib/api-client'

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

// Mock margin helpers
vi.mock('@/lib/margin-helpers', () => ({
  getLastCompletedWeek: vi.fn(() => '2025-W05'),
}))

// Mock period helpers to return predictable weeks for January 2025
vi.mock('@/lib/period-helpers', () => ({
  getWeeksInMonth: vi.fn((month: string) => {
    if (month === '2025-01') {
      return ['2025-W01', '2025-W02', '2025-W03', '2025-W04']
    }
    return []
  }),
  isValidWeekFormat: vi.fn(() => true),
}))

// ============================================================================
// Test Data - Real values from production API
// ============================================================================

/** Week W04 API response */
const WEEK_W04_RESPONSE = {
  summary_total: {
    week: '2025-W04',
    sale_gross_total: 126922.45,
    payout_total: 52219.92,
    cogs_total: 35818,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
    gross_profit: 16401.92, // API returns this (payout - cogs)
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2025-W04',
    cabinet_id: 'test-cabinet',
    generated_at: '2025-01-24T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

/** Week W01 API response */
const WEEK_W01_RESPONSE = {
  summary_total: {
    week: '2025-W01',
    sale_gross_total: 150000,
    payout_total: 60000,
    cogs_total: 42000,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
    gross_profit: 18000,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2025-W01',
    cabinet_id: 'test-cabinet',
    generated_at: '2025-01-03T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

/** Week W02 API response */
const WEEK_W02_RESPONSE = {
  summary_total: {
    week: '2025-W02',
    sale_gross_total: 175000,
    payout_total: 70000,
    cogs_total: 49000,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
    gross_profit: 21000,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2025-W02',
    cabinet_id: 'test-cabinet',
    generated_at: '2025-01-10T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

/** Week W03 API response */
const WEEK_W03_RESPONSE = {
  summary_total: {
    week: '2025-W03',
    sale_gross_total: 224322.35,
    payout_total: 44028.34,
    cogs_total: 60382,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
    gross_profit: -16353.66,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2025-W03',
    cabinet_id: 'test-cabinet',
    generated_at: '2025-01-17T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

// ============================================================================
// Test Helpers
// ============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ============================================================================
// Hook Tests - Margin Consistency (Story 61.13-FE)
// ============================================================================

describe('useFinancialSummary - Margin Consistency (Story 61.13-FE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Week period margin calculation', () => {
    /**
     * RED TEST: Hook should return Gross Margin for week period
     */
    it('should calculate Gross Margin for single week period', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Expected Gross Margin: (126922.45 - 35818) / 126922.45 * 100 = 71.78%
      expect(summary?.margin_pct).toBeCloseTo(71.78, 1)

      // Should NOT be the buggy Net Margin (12.92%)
      expect(summary?.margin_pct).not.toBeCloseTo(12.92, 1)
    })

    /**
     * RED TEST: Week margin should use sale_gross_total as revenue base
     */
    it('should use sale_gross_total as revenue base for week margin', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Verify the formula uses sale_gross_total (126922.45) not payout_total (52219.92)
      const expectedGrossMargin =
        ((summary!.sale_gross_total! - summary!.cogs_total!) / summary!.sale_gross_total!) * 100

      expect(summary?.margin_pct).toBeCloseTo(expectedGrossMargin, 1)
    })
  })

  describe('Month period margin calculation', () => {
    /**
     * RED TEST: Hook should calculate Gross Margin for month aggregation
     */
    it('should calculate Gross Margin for month period (aggregated weeks)', async () => {
      const mockGet = vi.mocked(apiClient.get)

      // Mock all week responses for January (W01-W04)
      mockGet
        .mockResolvedValueOnce(WEEK_W01_RESPONSE)
        .mockResolvedValueOnce(WEEK_W02_RESPONSE)
        .mockResolvedValueOnce(WEEK_W03_RESPONSE)
        .mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-01', 'month'), {
        wrapper: createWrapper(),
      })

      await waitFor(
        () => expect(result.current.isSuccess).toBe(true),
        { timeout: 5000 } // Allow more time for multiple requests
      )

      const summary = result.current.data?.summary_total

      // Aggregated values:
      // sale_gross_total: 150000 + 175000 + 224322.35 + 126922.45 = 676244.80
      // cogs_total: 42000 + 49000 + 60382 + 35818 = 187200
      // Gross Margin: (676244.80 - 187200) / 676244.80 * 100 = 72.32%

      expect(summary?.margin_pct).toBeCloseTo(72.32, 1)
    })

    /**
     * RED TEST: Month margin should use aggregated sale_gross_total
     */
    it('should use aggregated sale_gross_total for month margin', async () => {
      const mockGet = vi.mocked(apiClient.get)

      mockGet
        .mockResolvedValueOnce(WEEK_W01_RESPONSE)
        .mockResolvedValueOnce(WEEK_W02_RESPONSE)
        .mockResolvedValueOnce(WEEK_W03_RESPONSE)
        .mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-01', 'month'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

      const summary = result.current.data?.summary_total

      // Verify aggregated sale_gross_total
      expect(summary?.sale_gross_total).toBeCloseTo(676244.8, 1)

      // Verify aggregated cogs_total
      expect(summary?.cogs_total).toBe(187200)

      // Verify margin uses these aggregated values
      const expectedMargin = ((676244.8 - 187200) / 676244.8) * 100
      expect(summary?.margin_pct).toBeCloseTo(expectedMargin, 1)
    })
  })

  describe('Formula consistency between periods', () => {
    /**
     * RED TEST: Same formula should be used for week and month
     *
     * This is the KEY test - verifies that switching period type
     * doesn't change the margin calculation formula.
     */
    it('should use same Gross Margin formula for both week and month', async () => {
      const mockGet = vi.mocked(apiClient.get)

      // Test week
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const weekResult = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(weekResult.result.current.isSuccess).toBe(true))

      const weekSummary = weekResult.result.current.data?.summary_total
      const weekMargin = weekSummary?.margin_pct

      // Calculate expected Gross Margin for week
      const weekExpectedMargin =
        ((weekSummary!.sale_gross_total! - weekSummary!.cogs_total!) /
          weekSummary!.sale_gross_total!) *
        100

      // Week margin should match Gross Margin formula
      expect(weekMargin).toBeCloseTo(weekExpectedMargin, 1)

      // Reset and test month
      mockGet.mockReset()
      mockGet
        .mockResolvedValueOnce(WEEK_W01_RESPONSE)
        .mockResolvedValueOnce(WEEK_W02_RESPONSE)
        .mockResolvedValueOnce(WEEK_W03_RESPONSE)
        .mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const monthResult = renderHook(() => useFinancialSummary('2025-01', 'month'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(monthResult.result.current.isSuccess).toBe(true), {
        timeout: 5000,
      })

      const monthSummary = monthResult.result.current.data?.summary_total
      const monthMargin = monthSummary?.margin_pct

      // Calculate expected Gross Margin for month
      const monthExpectedMargin =
        ((monthSummary!.sale_gross_total! - monthSummary!.cogs_total!) /
          monthSummary!.sale_gross_total!) *
        100

      // Month margin should also match Gross Margin formula
      expect(monthMargin).toBeCloseTo(monthExpectedMargin, 1)

      // Both should be valid Gross Margins (typically 50-80% range)
      // NOT Net Margins (typically 10-20% range)
      expect(weekMargin).toBeGreaterThan(50)
      expect(monthMargin).toBeGreaterThan(50)
    })

    /**
     * RED TEST: Verify week margin is NOT Net Margin (API's gross_profit / revenue)
     */
    it('should NOT use gross_profit from API for margin calculation', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // If using API's gross_profit (16401.92), margin would be:
      // 16401.92 / 126922.45 * 100 = 12.92%
      const wrongNetMargin = (16401.92 / 126922.45) * 100

      // Margin should NOT be this Net Margin value
      expect(summary?.margin_pct).not.toBeCloseTo(wrongNetMargin, 1)

      // Margin SHOULD be Gross Margin
      const correctGrossMargin = ((126922.45 - 35818) / 126922.45) * 100
      expect(summary?.margin_pct).toBeCloseTo(correctGrossMargin, 1)
    })
  })

  describe('Edge cases', () => {
    /**
     * RED TEST: No margin when COGS coverage is incomplete
     */
    it('should not return margin_pct when cogs_coverage_pct < 100', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce({
        ...WEEK_W04_RESPONSE,
        summary_total: {
          ...WEEK_W04_RESPONSE.summary_total,
          cogs_coverage_pct: 80,
          products_with_cogs: 40,
        },
      })

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Should not calculate margin with incomplete COGS
      expect(summary?.margin_pct).toBeUndefined()
    })

    /**
     * RED TEST: Handle zero revenue
     */
    it('should handle zero sale_gross_total gracefully', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce({
        ...WEEK_W04_RESPONSE,
        summary_total: {
          ...WEEK_W04_RESPONSE.summary_total,
          sale_gross_total: 0,
        },
      })

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Should not divide by zero - margin should be undefined
      expect(summary?.margin_pct).toBeUndefined()
    })
  })
})
