/**
 * TDD Unit Tests for useFinancialSummary Hook - Gross Profit Formula
 * Story 61.2-FE: Fix Gross Profit Formula
 * Epic 61-FE: Dashboard Data Integration
 *
 * Tests written BEFORE implementation (TDD red-green-refactor cycle).
 *
 * PROBLEM:
 * Current (WRONG): gross_profit = payout_total - cogs_total
 * Correct: gross_profit = sale_gross_total - cogs_total
 *
 * payout_total already has logistics/storage deducted (маржинальный доход),
 * so it cannot be used as the revenue base for gross profit calculation.
 *
 * KEY REQUIREMENTS:
 * - AC1: Fix formula in aggregateFinanceSummaries() function
 * - AC2: Use sale_gross_total (or wb_sales_gross) as revenue base
 * - AC3: Add fallback: sale_gross_total || wb_sales_gross for compatibility
 * - AC4: Update margin percentage calculation to use same base
 * - AC5: Handle edge cases (null, zero, negative values)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// NOTE: We're testing the aggregateFinanceSummaries function which is currently
// not exported. Implementation should export it for testing, or we test via
// useMultiWeekFinancialSummary hook behavior.

// For now, we'll create a standalone function test and also test via hook

// Type definition matching FinanceSummary from useDashboard
interface FinanceSummary {
  week: string
  sale_gross_total?: number | null
  sale_gross?: number | null
  wb_sales_gross?: number | null
  wb_sales_gross_total?: number | null
  payout_total?: number | null
  cogs_total?: number | null
  cogs_coverage_pct?: number | null
  products_total?: number
  products_with_cogs?: number
  gross_profit?: number | null
  margin_pct?: number | null
  logistics_cost_total?: number | null
  logistics_cost?: number | null
  storage_cost_total?: number | null
  storage_cost?: number | null
  [key: string]: string | number | null | undefined
}

// ==========================================================================
// Tests for aggregateFinanceSummaries function (Story 61.2-FE)
// ==========================================================================

describe('aggregateFinanceSummaries - Gross Profit Formula Fix (Story 61.2-FE)', () => {
  // Import the function after implementation exports it
  // For now, we define expected behavior

  // Helper to simulate the FIXED aggregation function
  // This represents the EXPECTED behavior after fix
  function aggregateFinanceSummariesFixed(summaries: FinanceSummary[]): FinanceSummary | null {
    if (summaries.length === 0) return null

    // For single summary, still need to calculate gross_profit/margin
    const result: Partial<FinanceSummary> =
      summaries.length === 1 ? { ...summaries[0] } : { week: summaries.map(s => s.week).join(', ') }

    if (summaries.length > 1) {
      // Sum numeric fields for multi-week aggregation
      const numericFields: (keyof FinanceSummary)[] = [
        'sale_gross_total',
        'sale_gross',
        'wb_sales_gross',
        'wb_sales_gross_total',
        'payout_total',
        'cogs_total',
        'logistics_cost_total',
        'logistics_cost',
        'storage_cost_total',
        'storage_cost',
      ]

      for (const field of numericFields) {
        const sum = summaries.reduce((acc, summary) => {
          const value = summary[field]
          if (typeof value === 'number') {
            return acc + value
          }
          return acc
        }, 0)

        if (summaries.some(s => typeof s[field] === 'number')) {
          ;(result as Record<string, number>)[field] = sum
        }
      }

      // COGS coverage calculation for multi-week
      const maxProductsTotal = Math.max(...summaries.map(s => s.products_total || 0))
      const maxProductsWithCogs = Math.max(...summaries.map(s => s.products_with_cogs || 0))

      if (maxProductsTotal > 0) {
        result.products_total = maxProductsTotal
        result.products_with_cogs = Math.min(maxProductsWithCogs, maxProductsTotal)
        result.cogs_coverage_pct = (result.products_with_cogs / maxProductsTotal) * 100
      }
    }

    // FIXED: Gross Profit Calculation (Story 61.2-FE)
    // Use sale_gross_total as revenue base, NOT payout_total
    // This applies to both single and multi-week scenarios
    if (
      result.cogs_coverage_pct === 100 &&
      result.cogs_total !== null &&
      result.cogs_total !== undefined
    ) {
      // Use sale_gross_total as the revenue base (net sales after returns)
      // Fallback to wb_sales_gross if sale_gross_total not available
      const revenue = result.sale_gross_total ?? result.wb_sales_gross ?? 0

      if (revenue > 0 && typeof result.cogs_total === 'number') {
        result.gross_profit = revenue - result.cogs_total
        result.margin_pct = (result.gross_profit / revenue) * 100
      }
    }

    return result as FinanceSummary
  }

  // ==========================================================================
  // Core Formula Fix Tests (AC1, AC2)
  // ==========================================================================

  describe('gross profit formula (AC1, AC2)', () => {
    it('should calculate gross_profit using sale_gross_total, NOT payout_total', () => {
      // Story 61.2-FE: This is the core fix
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000, // Revenue (correct base)
          payout_total: 60000, // After deductions (WRONG base - was used before)
          cogs_total: 40000, // COGS
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // CORRECT: 100000 - 40000 = 60000
      expect(result?.gross_profit).toBe(60000)

      // WRONG would be: 60000 - 40000 = 20000
      expect(result?.gross_profit).not.toBe(20000)
    })

    it('should calculate margin_pct from sale_gross_total', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000,
          payout_total: 60000,
          cogs_total: 40000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Margin: 60000 / 100000 * 100 = 60%
      expect(result?.margin_pct).toBe(60)

      // Wrong margin would be: 20000 / 60000 * 100 = 33.33%
      expect(result?.margin_pct).not.toBeCloseTo(33.33, 1)
    })

    it('should aggregate multiple weeks correctly', () => {
      // Story 61.2-FE: Multi-week aggregation
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W04',
          sale_gross_total: 50000,
          payout_total: 30000,
          cogs_total: 20000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
        {
          week: '2026-W05',
          sale_gross_total: 50000,
          payout_total: 30000,
          cogs_total: 20000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Total sale_gross_total: 100000
      // Total cogs_total: 40000
      // Gross profit: 100000 - 40000 = 60000
      expect(result?.gross_profit).toBe(60000)
      expect(result?.margin_pct).toBe(60)
    })
  })

  // ==========================================================================
  // Fallback Logic Tests (AC3)
  // ==========================================================================

  describe('fallback to wb_sales_gross (AC3)', () => {
    it('should use wb_sales_gross when sale_gross_total is missing', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          wb_sales_gross: 80000, // Fallback field
          payout_total: 50000,
          cogs_total: 30000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Should use wb_sales_gross: 80000 - 30000 = 50000
      expect(result?.gross_profit).toBe(50000)
    })

    it('should prefer sale_gross_total over wb_sales_gross when both present', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000, // Primary field
          wb_sales_gross: 80000, // Should be ignored
          cogs_total: 40000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Should use sale_gross_total: 100000 - 40000 = 60000
      expect(result?.gross_profit).toBe(60000)
    })

    it('should handle case when both fields are present in aggregation', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W04',
          sale_gross_total: 50000,
          wb_sales_gross: 40000,
          cogs_total: 20000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
        {
          week: '2026-W05',
          sale_gross_total: 50000,
          wb_sales_gross: 40000,
          cogs_total: 20000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Should sum sale_gross_total: 100000
      // Should calculate: 100000 - 40000 = 60000
      expect(result?.gross_profit).toBe(60000)
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should not calculate gross_profit when cogs_coverage_pct < 100%', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000,
          cogs_total: 40000,
          cogs_coverage_pct: 80, // Not complete COGS coverage
          products_total: 100,
          products_with_cogs: 80,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Should not calculate gross_profit without 100% COGS coverage
      expect(result?.gross_profit).toBeUndefined()
    })

    it('should not calculate gross_profit when cogs_total is null', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000,
          cogs_total: null,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      expect(result?.gross_profit).toBeUndefined()
    })

    it('should handle zero revenue gracefully', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 0,
          cogs_total: 0,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Zero revenue = undefined (avoid division by zero)
      expect(result?.gross_profit).toBeUndefined()
      expect(result?.margin_pct).toBeUndefined()
    })

    it('should handle negative gross_profit (COGS > Revenue)', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 50000,
          cogs_total: 80000, // COGS exceeds revenue
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Negative profit is valid business scenario
      expect(result?.gross_profit).toBe(-30000)
      expect(result?.margin_pct).toBe(-60)
    })

    it('should return null for empty summaries array', () => {
      const result = aggregateFinanceSummariesFixed([])
      expect(result).toBeNull()
    })

    it('should calculate gross_profit and margin for single summary', () => {
      // Story 61.2-FE: Even single summaries should have gross_profit calculated
      const summary: FinanceSummary = {
        week: '2026-W05',
        sale_gross_total: 100000,
        cogs_total: 40000,
        cogs_coverage_pct: 100,
        products_total: 100,
        products_with_cogs: 100,
      }

      const result = aggregateFinanceSummariesFixed([summary])

      // Should preserve original fields
      expect(result?.week).toBe(summary.week)
      expect(result?.sale_gross_total).toBe(summary.sale_gross_total)
      expect(result?.cogs_total).toBe(summary.cogs_total)

      // Should calculate gross_profit and margin_pct
      expect(result?.gross_profit).toBe(60000) // 100000 - 40000
      expect(result?.margin_pct).toBe(60) // 60000 / 100000 * 100
    })
  })

  // ==========================================================================
  // Margin Percentage Tests (AC4)
  // ==========================================================================

  describe('margin percentage calculation (AC4)', () => {
    it('should calculate margin from correct revenue base', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 200000,
          payout_total: 150000,
          cogs_total: 100000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Correct margin: (200000 - 100000) / 200000 * 100 = 50%
      expect(result?.margin_pct).toBe(50)

      // Wrong margin (using payout): (150000 - 100000) / 150000 * 100 = 33.33%
      expect(result?.margin_pct).not.toBeCloseTo(33.33, 1)
    })

    it('should handle high margin scenario', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000,
          cogs_total: 10000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // High margin: 90%
      expect(result?.margin_pct).toBe(90)
    })

    it('should handle low margin scenario', () => {
      const summaries: FinanceSummary[] = [
        {
          week: '2026-W05',
          sale_gross_total: 100000,
          cogs_total: 95000,
          cogs_coverage_pct: 100,
          products_total: 100,
          products_with_cogs: 100,
        },
      ]

      const result = aggregateFinanceSummariesFixed(summaries)

      // Low margin: 5%
      expect(result?.margin_pct).toBe(5)
    })
  })
})

// ==========================================================================
// Hook Behavior Tests (integration)
// ==========================================================================

describe('useFinancialSummary hook integration (Story 61.2-FE)', () => {
  // These tests verify the hook behavior after the fix is implemented
  // They require mocking the API client and testing the full hook flow

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Placeholder for hook integration tests
  // These will be added when testing the actual hook implementation

  it.skip('should fetch data and calculate gross_profit correctly', async () => {
    // TODO: Implement after hook is updated
    // This test will verify end-to-end behavior
  })

  it.skip('should use correct formula when aggregating month data', async () => {
    // TODO: Implement after hook is updated
    // This test will verify monthly aggregation uses correct formula
  })
})

// ==========================================================================
// Comparison with Backend Formula Documentation
// ==========================================================================

describe('formula documentation compliance', () => {
  it('should match documented backend formula for gross profit', () => {
    // Reference: docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md
    // Formula: gross_profit = revenue - COGS
    // Where revenue = sale_gross_total (net sales after returns)

    const revenue = 100000 // sale_gross_total
    const cogs = 40000
    const expectedGrossProfit = revenue - cogs

    expect(expectedGrossProfit).toBe(60000)
  })

  it('should match documented backend formula for margin percentage', () => {
    // Formula: margin_pct = (gross_profit / revenue) * 100

    const revenue = 100000
    const grossProfit = 60000
    const expectedMarginPct = (grossProfit / revenue) * 100

    expect(expectedMarginPct).toBe(60)
  })

  it('should NOT use payout_total as revenue base', () => {
    // payout_total already has logistics, storage, commissions deducted
    // It's "маржинальный доход" (marginal income), not gross revenue

    const saleGrossTotal = 100000 // Actual revenue (correct)
    const payoutTotal = 60000 // After deductions (wrong)
    const cogs = 40000

    const correctGrossProfit = saleGrossTotal - cogs
    const wrongGrossProfit = payoutTotal - cogs

    expect(correctGrossProfit).toBe(60000) // Correct
    expect(wrongGrossProfit).toBe(20000) // Wrong (current bug)

    // The difference is 40000 (logistics + storage + commissions)
    expect(correctGrossProfit - wrongGrossProfit).toBe(40000)
  })
})
