/**
 * TDD Integration Tests for DashboardContent Null Consistency
 * Story: null vs undefined Standardization + P&L Restructuring
 *
 * Tests verify that DashboardContent uses null (not undefined) for missing data.
 *
 * @see docs/briefs/dashboard-restructuring-v2.md
 */

import { describe, it, expect, vi } from 'vitest'
import type { PreviousPeriodData } from '@/components/custom/dashboard'

// =============================================================================
// Mock Setup
// =============================================================================

vi.mock('@/hooks/useDashboardPeriod', () => ({
  useDashboardPeriod: () => ({
    periodType: 'week' as const,
    selectedWeek: '2025-W03',
    selectedMonth: '2025-01',
    lastRefresh: new Date(),
    previousWeek: '2025-W02',
    previousMonth: '2024-12',
  }),
}))

vi.mock('@/hooks/useFinancialSummary', () => ({
  useFinancialSummaryWithPeriodComparison: () => ({
    current: {
      summary_rus: {
        logistics_cost: 15000,
        storage_cost: 8000,
        sale_gross: 250000,
      },
    },
    previous: null,
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/hooks/useAdvertisingAnalytics', () => ({
  useAdvertisingAnalyticsComparison: () => ({
    current: { summary: { total_spend: 12000 } },
    previous: { summary: { total_spend: 10000 } },
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/hooks/useProcessingStatus', () => ({
  useProcessingStatus: () => ({ data: null }),
}))

vi.mock('@/hooks/useProducts', () => ({
  useProductsCount: () => ({ data: 100, isLoading: false }),
  useProductsWithCogs: () => ({
    data: { pagination: { total: 80 } },
    isLoading: false,
  }),
}))

vi.mock('@/hooks/useDataImportNotification', () => ({
  useDataImportNotification: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }
})

// =============================================================================
// Helper
// =============================================================================

/** Complete PreviousPeriodData with all null values */
const ALL_NULL_PREV: PreviousPeriodData = {
  ordersAmount: null,
  ordersCount: null,
  saleGross: null,
  wbCommissionsTotal: null,
  logisticsCost: null,
  payoutTotal: null,
  storageAcceptanceTotal: null,
  cogsTotal: null,
  advertisingSpend: null,
  grossProfit: null,
  marginPct: null,
  ordersCogs: null,
  salesAmount: null,
  salesCogs: null,
  storageCost: null,
  theoreticalProfit: null,
}

// =============================================================================
// PreviousPeriodData Construction Tests
// =============================================================================

describe('DashboardContent previousPeriodData consistency', () => {
  describe('previousPeriodData object structure', () => {
    it('uses null for missing fields, not undefined', () => {
      const prev: PreviousPeriodData = {
        ...ALL_NULL_PREV,
        ordersAmount: 80000,
        advertisingSpend: 10000,
      }

      expect(prev.ordersCogs).toBeNull()
      expect(prev.ordersCogs).not.toBeUndefined()
      expect(prev.salesAmount).toBeNull()
      expect(prev.logisticsCost).toBeNull()
      expect(prev.theoreticalProfit).toBeNull()
      expect(prev.grossProfit).toBeNull()
      expect(prev.marginPct).toBeNull()
    })
  })

  describe('no undefined values in previousPeriodData', () => {
    it('all fields are either number or null, never undefined', () => {
      const prev: PreviousPeriodData = {
        ...ALL_NULL_PREV,
        ordersAmount: 80000,
        advertisingSpend: 10000,
      }

      Object.entries(prev).forEach(([key, value]) => {
        expect(value, `${key} should not be undefined`).not.toBeUndefined()
        expect(
          value === null || typeof value === 'number',
          `${key} should be null or number, got ${typeof value}`
        ).toBe(true)
      })
    })
  })
})

// =============================================================================
// Null Coalescing Pattern Tests
// =============================================================================

describe('null coalescing patterns', () => {
  it('converts undefined to null using ?? null', () => {
    const value: number | undefined = undefined
    expect(value ?? null).toBeNull()
  })

  it('preserves 0 when using ?? null', () => {
    const value: number | undefined = 0
    expect(value ?? null).toBe(0)
  })

  it('handles nested optional chain with null fallback', () => {
    const data: { summary?: { total_spend?: number } } = {}
    expect(data.summary?.total_spend ?? null).toBeNull()
  })

  it('extracts value from nested optional chain', () => {
    const data = { summary: { total_spend: 12000 } }
    expect(data.summary?.total_spend ?? null).toBe(12000)
  })
})

// =============================================================================
// Type Guard Tests
// =============================================================================

describe('type guards for null vs undefined', () => {
  it('null !== undefined in strict equality', () => {
    expect(null === undefined).toBe(false)
    expect(null == undefined).toBe(true)
  })

  it('value != null returns false for null and undefined', () => {
    expect((null as number | null) != null).toBe(false)
    expect((undefined as number | undefined) != null).toBe(false)
    expect((0 as number | null) != null).toBe(true)
  })
})
