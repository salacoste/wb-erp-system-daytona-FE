/**
 * TDD Tests for Financial Summary Comparison Hook
 * Story 61.11-FE: Previous Period Data Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * Tests for enhanced useFinancialSummary with period comparison support.
 * Current useFinancialSummaryComparison only compares two specific weeks,
 * not previous period relative to current selection.
 *
 * EXPECTED: Hook that fetches current AND previous period financial data
 * for dashboard comparison displays (logistics_cost, storage_cost).
 *
 * TDD RED PHASE: Tests should FAIL until implementation
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
 * Current period financial summary (Week 2026-W05)
 */
const mockCurrentPeriodSummary = {
  summary_total: {
    sale_gross_total: 150000,
    revenue: 145000,
    logistics_cost: 17566.04,
    storage_cost: 2024.94,
    acceptance_cost: 500,
    penalty_cost: 150,
    gross_profit: 64182,
    margin_pct: 44.26,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2026-W05',
    cabinet_id: 'test-cabinet',
    generated_at: '2026-01-30T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

/**
 * Previous period financial summary (Week 2026-W04)
 */
const mockPreviousPeriodSummary = {
  summary_total: {
    sale_gross_total: 180000,
    revenue: 175000,
    logistics_cost: 20000,
    storage_cost: 2500,
    acceptance_cost: 600,
    penalty_cost: 200,
    gross_profit: 72187,
    margin_pct: 41.25,
  },
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2026-W04',
    cabinet_id: 'test-cabinet',
    generated_at: '2026-01-23T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
}

/**
 * Empty summary for missing data scenario
 */
const mockEmptySummary = {
  summary_total: null,
  summary_rus: null,
  summary_eaeu: null,
  meta: {
    week: '2026-W03',
    cabinet_id: 'test-cabinet',
    generated_at: '2026-01-16T12:00:00Z',
    timezone: 'Europe/Moscow',
  },
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
// Tests for useFinancialSummaryWithPeriodComparison Hook
// =============================================================================

describe('useFinancialSummaryWithPeriodComparison - Story 61.11-FE', () => {
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
    it('should export useFinancialSummaryWithPeriodComparison from financial hooks', async () => {
      // RED: This test FAILS because hook doesn't exist yet
      const module = await import('@/hooks/useFinancialSummary')

      // Check for new period-based comparison hook
      expect(module).toHaveProperty('useFinancialSummaryWithPeriodComparison')
      expect(typeof module.useFinancialSummaryWithPeriodComparison).toBe('function')
    })
  })

  // ===========================================================================
  // Logistics Cost Comparison
  // ===========================================================================

  describe('Logistics Cost Comparison', () => {
    it('should return logistics_cost for both current and previous periods', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockPreviousPeriodSummary)

      // RED: Will fail until hook is implemented
      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Current period logistics
      expect(result.current.current?.summary_total?.logistics_cost).toBe(17566.04)

      // Previous period logistics (NOT null!)
      expect(result.current.previous?.summary_total?.logistics_cost).not.toBeNull()
      expect(result.current.previous?.summary_total?.logistics_cost).toBe(20000)
    })

    it('should calculate logistics cost delta correctly', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockPreviousPeriodSummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.current).toBeDefined()
      })

      const currentLogistics = result.current.current?.summary_total?.logistics_cost ?? 0
      const previousLogistics = result.current.previous?.summary_total?.logistics_cost ?? 0

      // Delta: 17566.04 - 20000 = -2433.96 (logistics decreased - good!)
      expect(currentLogistics - previousLogistics).toBeCloseTo(-2433.96, 2)
    })
  })

  // ===========================================================================
  // Storage Cost Comparison
  // ===========================================================================

  describe('Storage Cost Comparison', () => {
    it('should return storage_cost for both current and previous periods', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockPreviousPeriodSummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Current period storage
      expect(result.current.current?.summary_total?.storage_cost).toBe(2024.94)

      // Previous period storage (NOT null!)
      expect(result.current.previous?.summary_total?.storage_cost).not.toBeNull()
      expect(result.current.previous?.summary_total?.storage_cost).toBe(2500)
    })

    it('should calculate storage cost percentage change', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockPreviousPeriodSummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.previous).toBeDefined()
      })

      const currentStorage = result.current.current?.summary_total?.storage_cost ?? 0
      const previousStorage = result.current.previous?.summary_total?.storage_cost ?? 1

      // Percentage change: ((2024.94 - 2500) / 2500) * 100 = -19%
      const pctChange = ((currentStorage - previousStorage) / previousStorage) * 100
      expect(pctChange).toBeCloseTo(-19, 0)
    })
  })

  // ===========================================================================
  // Period Type Support (Week vs Month)
  // ===========================================================================

  describe('Period Type Support', () => {
    it('should handle week period type', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockPreviousPeriodSummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledTimes(2)
      })

      // First call: current week (W05)
      expect(vi.mocked(apiClient.get).mock.calls[0][0]).toContain('2026-W05')

      // Second call: previous week (W04)
      expect(vi.mocked(apiClient.get).mock.calls[1][0]).toContain('2026-W04')
    })

    it('should handle month period type with aggregation', async () => {
      // Month periods aggregate multiple weeks
      vi.mocked(apiClient.get).mockResolvedValue(mockCurrentPeriodSummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'month',
            period: '2026-01',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        // Should fetch weeks for both January and December
        expect(apiClient.get).toHaveBeenCalled()
      })
    })

    it('should handle year boundary for previous period (January to December)', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockPreviousPeriodSummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'month',
            period: '2026-01', // January
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalled()
      })

      // Previous month should be December 2025
      const calls = vi.mocked(apiClient.get).mock.calls
      const hasPreviousYearCall = calls.some(call => String(call[0]).includes('2025'))
      expect(hasPreviousYearCall).toBe(true)
    })
  })

  // ===========================================================================
  // Missing Data Handling
  // ===========================================================================

  describe('Missing Previous Period Data', () => {
    it('should return undefined previous when no data exists', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockResolvedValueOnce(mockEmptySummary)

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Current should be populated
      expect(result.current.current?.summary_total?.logistics_cost).toBe(17566.04)

      // Previous should have null summary_total (no data)
      expect(result.current.previous?.summary_total).toBeNull()
    })

    it('should handle API error for previous period gracefully', async () => {
      vi.mocked(apiClient.get)
        .mockResolvedValueOnce(mockCurrentPeriodSummary)
        .mockRejectedValueOnce(new Error('No data available'))

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Current data should still be available
      expect(result.current.current).toBeDefined()

      // Previous should be undefined but not cause error state
      expect(result.current.previous).toBeUndefined()
      expect(result.current.isError).toBe(false)
    })
  })

  // ===========================================================================
  // Query Options
  // ===========================================================================

  describe('Query Options', () => {
    it('should respect enabled option', async () => {
      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
            enabled: false,
          }),
        { wrapper: createWrapper() }
      )

      expect(apiClient.get).not.toHaveBeenCalled()
    })

    it('should not fetch when period is empty', async () => {
      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '',
          }),
        { wrapper: createWrapper() }
      )

      expect(apiClient.get).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Combined Loading State
  // ===========================================================================

  describe('Loading States', () => {
    it('should indicate loading while fetching both periods', async () => {
      vi.mocked(apiClient.get).mockImplementation(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve(mockCurrentPeriodSummary), 100)
          })
      )

      const { useFinancialSummaryWithPeriodComparison } = await import(
        '@/hooks/useFinancialSummary'
      )

      const { result } = renderHook(
        () =>
          useFinancialSummaryWithPeriodComparison({
            periodType: 'week',
            period: '2026-W05',
          }),
        { wrapper: createWrapper() }
      )

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })
})

// Suppress unused fixture warnings
void mockCurrentPeriodSummary
void mockPreviousPeriodSummary
void mockEmptySummary
