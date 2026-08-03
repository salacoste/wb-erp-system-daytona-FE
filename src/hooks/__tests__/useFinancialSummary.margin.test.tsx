/**
 * TDD Tests for useFinancialSummary Hook - Margin Consistency
 * Story 61.13-FE: Fix Margin Calculation Inconsistency (Week vs Month)
 * Updated for Request #155: Operating Margin formula
 *
 * These tests verify that the hook returns consistent margin_pct values
 * regardless of whether the period is a week or a month.
 *
 * CURRENT BEHAVIOR (Request #155):
 * Both week and month use Operating Margin formula:
 * margin_pct = (payout_total - cogs_total) / sale_gross_total * 100
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

/** Backend monthly aggregation response for January 2025 */
const MONTH_JANUARY_RESPONSE = {
  summary_total: {
    week: '2025-W01, 2025-W02, 2025-W03, 2025-W04',
    sale_gross_total: 676244.8,
    payout_total: 226248.26,
    cogs_total: 187200,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
    gross_profit: 39048.26,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2025-W01, 2025-W02, 2025-W03, 2025-W04',
    cabinet_id: 'test-cabinet',
    generated_at: '2025-02-01T12:00:00Z',
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
    vi.mocked(apiClient.get).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Week period margin calculation', () => {
    /**
     * RED TEST: Hook should return Gross Margin for week period
     */
    it('should calculate Operating Margin for single week period', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Expected Operating Margin: (52219.92 - 35818) / 126922.45 * 100 = 12.92%
      expect(summary?.margin_pct).toBeCloseTo(12.92, 1)
    })

    /**
     * RED TEST: Week margin should use sale_gross_total as revenue base
     */
    it('should use payout_total in numerator and sale_gross_total as denominator', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Operating Margin: (payout_total - cogs_total) / sale_gross_total * 100
      const expectedOperatingMargin =
        ((summary!.payout_total! - summary!.cogs_total!) / summary!.sale_gross_total!) * 100

      expect(summary?.margin_pct).toBeCloseTo(expectedOperatingMargin, 1)
    })
  })

  describe('Month period margin calculation', () => {
    /**
     * RED TEST: Hook should calculate Gross Margin for month aggregation
     */
    it('should calculate Operating Margin for month period (aggregated weeks)', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(MONTH_JANUARY_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-01', 'month'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

      const summary = result.current.data?.summary_total

      // Aggregated values:
      // payout_total: 60000 + 70000 + 44028.34 + 52219.92 = 226248.26
      // sale_gross_total: 150000 + 175000 + 224322.35 + 126922.45 = 676244.80
      // cogs_total: 42000 + 49000 + 60382 + 35818 = 187200
      // Operating Margin: (226248.26 - 187200) / 676244.80 * 100 ≈ 5.77%

      expect(summary?.margin_pct).toBeCloseTo(5.77, 0)
    })

    /**
     * RED TEST: Month margin should use aggregated sale_gross_total
     */
    it('should use aggregated sale_gross_total for month margin', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(MONTH_JANUARY_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-01', 'month'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 5000 })

      const summary = result.current.data?.summary_total

      // Verify aggregated sale_gross_total
      expect(summary?.sale_gross_total).toBeCloseTo(676244.8, 1)

      // Verify aggregated cogs_total
      expect(summary?.cogs_total).toBe(187200)

      // Verify margin uses Operating Margin formula with aggregated values
      const expectedMargin = ((226248.26 - 187200) / 676244.8) * 100
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
    it('should use same Operating Margin formula for both week and month', async () => {
      const mockGet = vi.mocked(apiClient.get)

      // Test week
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const weekResult = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(weekResult.result.current.isSuccess).toBe(true))

      const weekSummary = weekResult.result.current.data?.summary_total
      const weekMargin = weekSummary?.margin_pct

      // Calculate expected Operating Margin for week
      const weekExpectedMargin =
        ((weekSummary!.payout_total! - weekSummary!.cogs_total!) / weekSummary!.sale_gross_total!) *
        100

      // Week margin should match Operating Margin formula
      expect(weekMargin).toBeCloseTo(weekExpectedMargin, 1)

      // Reset and test month
      mockGet.mockReset()
      mockGet.mockResolvedValueOnce(MONTH_JANUARY_RESPONSE)

      const monthResult = renderHook(() => useFinancialSummary('2025-01', 'month'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(monthResult.result.current.isSuccess).toBe(true), {
        timeout: 5000,
      })

      const monthSummary = monthResult.result.current.data?.summary_total
      const monthMargin = monthSummary?.margin_pct

      // Calculate expected Operating Margin for month
      const monthExpectedMargin =
        ((monthSummary!.payout_total! - monthSummary!.cogs_total!) /
          monthSummary!.sale_gross_total!) *
        100

      // Month margin should also match Operating Margin formula
      expect(monthMargin).toBeCloseTo(monthExpectedMargin, 1)

      // Both should be valid numbers (Operating Margin can be lower than Gross Margin)
      expect(weekMargin).toBeDefined()
      expect(monthMargin).toBeDefined()
      expect(typeof weekMargin).toBe('number')
      expect(typeof monthMargin).toBe('number')
    })

    /**
     * RED TEST: Verify week margin is NOT Net Margin (API's gross_profit / revenue)
     */
    it('should use Operating Margin formula, not gross_profit from API', async () => {
      const mockGet = vi.mocked(apiClient.get)
      mockGet.mockResolvedValueOnce(WEEK_W04_RESPONSE)

      const { result } = renderHook(() => useFinancialSummary('2025-W04', 'week'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      const summary = result.current.data?.summary_total

      // Operating Margin: (payout_total - cogs_total) / sale_gross_total * 100
      // = (52219.92 - 35818) / 126922.45 * 100 = 12.92%
      const correctOperatingMargin = ((52219.92 - 35818) / 126922.45) * 100

      // Margin SHOULD be Operating Margin (12.92%)
      expect(summary?.margin_pct).toBeCloseTo(correctOperatingMargin, 1)
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
