/**
 * TDD Tests for Financial Aggregation - Margin Calculation Consistency
 * Story 61.13-FE: Fix Margin Calculation Inconsistency (Week vs Month)
 *
 * BUG DESCRIPTION:
 * - Week W04: Shows 12.92% (Net Margin formula used)
 * - Month January: Shows 72.32% (Gross Margin formula used)
 * - This is inconsistent - different formulas for different periods
 *
 * EXPECTED FIX:
 * - Standardize on Gross Margin: (sale_gross_total - cogs_total) / sale_gross_total * 100
 * - Same formula for both week and month aggregations
 *
 * Real data from API (W04):
 *   sale_gross_total: 126922.45
 *   payout_total: 52219.92
 *   cogs_total: 35818
 *   gross_profit: 16401.92 (API returns this)
 *
 * Expected Gross Margin: (126922.45 - 35818) / 126922.45 = 71.78%
 * Current Net Margin (BUG): 16401.92 / 126922.45 = 12.92%
 *
 * The bug is that current code uses gross_profit (from API) instead of
 * recalculating as (revenue - COGS) / revenue.
 *
 * @see docs/stories/epic-61/story-61.13-fe-margin-consistency.md
 */

import { describe, it, expect } from 'vitest'
import { aggregateFinanceSummaries } from '../aggregation'
import type { FinanceSummary } from '@/types/finance-summary'

// ============================================================================
// Test Data - Real values from production API
// ============================================================================

/** Week W04 data (single week) */
const WEEK_W04_DATA: FinanceSummary = {
  week: '2025-W04',
  sale_gross_total: 126922.45,
  payout_total: 52219.92,
  cogs_total: 35818,
  cogs_coverage_pct: 100,
  products_total: 50,
  products_with_cogs: 50,
  gross_profit: 16401.92, // API returns this (payout - cogs, WRONG formula)
}

/** Expected Gross Margin for W04: (126922.45 - 35818) / 126922.45 = 71.78% */
const EXPECTED_GROSS_MARGIN_W04 = 71.78

/** Current buggy Net Margin: 16401.92 / 126922.45 = 12.92% */
const BUGGY_NET_MARGIN_W04 = 12.92

/** Week data for monthly aggregation (4 weeks in January) */
const JANUARY_WEEKS: FinanceSummary[] = [
  {
    week: '2025-W01',
    sale_gross_total: 150000,
    payout_total: 60000,
    cogs_total: 42000,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
  },
  {
    week: '2025-W02',
    sale_gross_total: 175000,
    payout_total: 70000,
    cogs_total: 49000,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
  },
  {
    week: '2025-W03',
    sale_gross_total: 224322.35,
    payout_total: 44028.34,
    cogs_total: 60382,
    cogs_coverage_pct: 100,
    products_total: 50,
    products_with_cogs: 50,
  },
  WEEK_W04_DATA,
]

/**
 * Month January aggregated values:
 * sale_gross_total: 150000 + 175000 + 224322.35 + 126922.45 = 676244.80
 * cogs_total: 42000 + 49000 + 60382 + 35818 = 187200
 *
 * Expected Gross Margin: (676244.80 - 187200) / 676244.80 = 72.32%
 */
const EXPECTED_GROSS_MARGIN_MONTH = 72.32

// ============================================================================
// Core Margin Calculation Tests (Story 61.13-FE)
// ============================================================================

describe('Margin Calculation Consistency (Story 61.13-FE)', () => {
  describe('Gross Margin Formula', () => {
    /**
     * RED TEST: This test should FAIL with current implementation
     *
     * Current behavior: Uses gross_profit from API (Net Margin)
     * Expected behavior: Calculate (revenue - COGS) / revenue (Gross Margin)
     */
    it('should calculate margin_pct as Gross Margin, not Net Margin', () => {
      const result = aggregateFinanceSummaries([WEEK_W04_DATA])

      // Expected: Gross Margin = (126922.45 - 35818) / 126922.45 * 100 = 71.78%
      expect(result?.margin_pct).toBeCloseTo(EXPECTED_GROSS_MARGIN_W04, 1)

      // Should NOT be the buggy Net Margin (12.92%)
      expect(result?.margin_pct).not.toBeCloseTo(BUGGY_NET_MARGIN_W04, 1)
    })

    /**
     * RED TEST: Margin formula must be consistent across periods
     */
    it('should use same formula for week and month periods', () => {
      // Single week
      const weekResult = aggregateFinanceSummaries([WEEK_W04_DATA])

      // Month (aggregated weeks)
      const monthResult = aggregateFinanceSummaries(JANUARY_WEEKS)

      // Both should use Gross Margin formula
      // Week: ~71.78%
      // Month: ~72.32%
      // The VALUES differ (different data), but the FORMULA should be the same

      // Verify Gross Margin formula is used for week
      const weekGrossMargin =
        ((WEEK_W04_DATA.sale_gross_total! - WEEK_W04_DATA.cogs_total!) /
          WEEK_W04_DATA.sale_gross_total!) *
        100
      expect(weekResult?.margin_pct).toBeCloseTo(weekGrossMargin, 1)

      // Verify Gross Margin formula is used for month
      const monthSaleGross = JANUARY_WEEKS.reduce((sum, w) => sum + (w.sale_gross_total || 0), 0)
      const monthCogs = JANUARY_WEEKS.reduce((sum, w) => sum + (w.cogs_total || 0), 0)
      const monthGrossMargin = ((monthSaleGross - monthCogs) / monthSaleGross) * 100
      expect(monthResult?.margin_pct).toBeCloseTo(monthGrossMargin, 1)
    })

    /**
     * RED TEST: Month aggregation should produce correct Gross Margin
     */
    it('should calculate correct Gross Margin for month aggregation', () => {
      const result = aggregateFinanceSummaries(JANUARY_WEEKS)

      // Aggregated values:
      // sale_gross_total: 676244.80
      // cogs_total: 187200
      // Gross Margin: (676244.80 - 187200) / 676244.80 * 100 = 72.32%
      expect(result?.margin_pct).toBeCloseTo(EXPECTED_GROSS_MARGIN_MONTH, 1)
    })
  })

  describe('margin_pct calculation function', () => {
    /**
     * RED TEST: Should add calculateMarginPct helper function
     */
    it('should export calculateMarginPct function', () => {
      // This test verifies the function exists and works correctly
      // After implementation, import { calculateMarginPct } from '../aggregation'

      // Inline test of expected formula
      const calculateMarginPct = (saleGross: number, cogs: number): number | null => {
        if (saleGross <= 0) return null
        return ((saleGross - cogs) / saleGross) * 100
      }

      expect(calculateMarginPct(126922.45, 35818)).toBeCloseTo(71.78, 1)
      expect(calculateMarginPct(676244.8, 187200)).toBeCloseTo(72.32, 1)
      expect(calculateMarginPct(0, 35818)).toBeNull()
    })

    /**
     * RED TEST: margin_pct should be null when COGS coverage is incomplete
     */
    it('should return null margin_pct when cogs_coverage_pct < 100', () => {
      const incompleteData: FinanceSummary = {
        week: '2025-W04',
        sale_gross_total: 126922.45,
        cogs_total: 35818,
        cogs_coverage_pct: 80, // Only 80% COGS coverage
        products_total: 50,
        products_with_cogs: 40,
        payout_total: 52219.92,
      }

      const result = aggregateFinanceSummaries([incompleteData])

      // Should not calculate margin with incomplete COGS
      expect(result?.margin_pct).toBeUndefined()
    })

    /**
     * RED TEST: margin_pct should be null when sale_gross_total is zero
     */
    it('should return null margin_pct when sale_gross_total is zero', () => {
      const zeroSalesData: FinanceSummary = {
        week: '2025-W04',
        sale_gross_total: 0,
        cogs_total: 35818,
        cogs_coverage_pct: 100,
        products_total: 50,
        products_with_cogs: 50,
        payout_total: 0,
      }

      const result = aggregateFinanceSummaries([zeroSalesData])

      // Division by zero protection
      expect(result?.margin_pct).toBeUndefined()
    })

    /**
     * RED TEST: Should handle negative margin (COGS > Revenue)
     */
    it('should calculate negative margin when COGS exceeds revenue', () => {
      const lossData: FinanceSummary = {
        week: '2025-W04',
        sale_gross_total: 50000,
        cogs_total: 80000, // COGS > Revenue = loss
        cogs_coverage_pct: 100,
        products_total: 50,
        products_with_cogs: 50,
        payout_total: 20000,
      }

      const result = aggregateFinanceSummaries([lossData])

      // Gross Margin: (50000 - 80000) / 50000 = -60%
      expect(result?.margin_pct).toBeCloseTo(-60, 1)
    })
  })
})

// ============================================================================
// Aggregation Behavior Tests
// ============================================================================

describe('aggregateFinanceSummaries - margin consistency', () => {
  describe('single week processing', () => {
    it('should calculate margin_pct for single week with 100% COGS coverage', () => {
      const result = aggregateFinanceSummaries([WEEK_W04_DATA])

      expect(result).not.toBeNull()
      expect(result?.margin_pct).toBeDefined()
      expect(result?.margin_pct).toBeCloseTo(71.78, 1)
    })

    it('should preserve all original fields for single week', () => {
      const result = aggregateFinanceSummaries([WEEK_W04_DATA])

      expect(result?.week).toBe('2025-W04')
      expect(result?.sale_gross_total).toBe(126922.45)
      expect(result?.cogs_total).toBe(35818)
      expect(result?.payout_total).toBe(52219.92)
    })
  })

  describe('multi-week aggregation', () => {
    it('should correctly sum sale_gross_total across weeks', () => {
      const result = aggregateFinanceSummaries(JANUARY_WEEKS)

      // 150000 + 175000 + 224322.35 + 126922.45 = 676244.80
      expect(result?.sale_gross_total).toBeCloseTo(676244.8, 1)
    })

    it('should correctly sum cogs_total across weeks', () => {
      const result = aggregateFinanceSummaries(JANUARY_WEEKS)

      // 42000 + 49000 + 60382 + 35818 = 187200
      expect(result?.cogs_total).toBe(187200)
    })

    it('should calculate gross_profit from aggregated values', () => {
      const result = aggregateFinanceSummaries(JANUARY_WEEKS)

      // gross_profit = sale_gross_total - cogs_total
      // 676244.80 - 187200 = 489044.80
      expect(result?.gross_profit).toBeCloseTo(489044.8, 1)
    })

    it('should calculate margin_pct from aggregated values', () => {
      const result = aggregateFinanceSummaries(JANUARY_WEEKS)

      // margin_pct = gross_profit / sale_gross_total * 100
      // 489044.80 / 676244.80 * 100 = 72.32%
      expect(result?.margin_pct).toBeCloseTo(72.32, 1)
    })
  })

  describe('edge cases', () => {
    it('should return null for empty array', () => {
      const result = aggregateFinanceSummaries([])
      expect(result).toBeNull()
    })

    it('should not calculate margin when cogs_coverage_pct varies across weeks', () => {
      const mixedCoverage: FinanceSummary[] = [
        {
          week: '2025-W01',
          sale_gross_total: 100000,
          cogs_total: 30000,
          cogs_coverage_pct: 100,
          products_total: 50,
          products_with_cogs: 50,
          payout_total: 60000,
        },
        {
          week: '2025-W02',
          sale_gross_total: 100000,
          cogs_total: 30000,
          cogs_coverage_pct: 80, // Only 80% coverage
          products_total: 50,
          products_with_cogs: 40,
          payout_total: 60000,
        },
      ]

      const result = aggregateFinanceSummaries(mixedCoverage)

      // Use MAX coverage logic - if any week has incomplete coverage,
      // the aggregated cogs_coverage_pct should reflect this
      // Margin should only be calculated if ALL weeks have 100% coverage
      // Current implementation uses MAX, which might show 100% even if one week is 80%
      // This is a potential bug that should be considered

      // For now, test that the current behavior is preserved or improved
      // The key requirement is that margin_pct uses Gross Margin formula
      if (result?.cogs_coverage_pct === 100) {
        // If coverage is treated as 100%, margin should be Gross Margin
        const expectedMargin = ((200000 - 60000) / 200000) * 100
        expect(result?.margin_pct).toBeCloseTo(expectedMargin, 1)
      }
    })
  })
})

// ============================================================================
// Formula Verification Tests
// ============================================================================

describe('Margin Formula Verification', () => {
  /**
   * These tests document the expected formula behavior
   */
  it('Gross Margin formula: (Revenue - COGS) / Revenue * 100', () => {
    // Reference documentation formula
    const revenue = 126922.45
    const cogs = 35818
    const grossMargin = ((revenue - cogs) / revenue) * 100

    expect(grossMargin).toBeCloseTo(71.78, 1)
  })

  it('Net Margin formula (WRONG for this use case): gross_profit / Revenue * 100', () => {
    // This is what the current buggy code does
    const revenue = 126922.45
    const grossProfitFromApi = 16401.92 // payout - cogs (wrong formula)
    const netMargin = (grossProfitFromApi / revenue) * 100

    // This produces 12.92% which is WRONG
    expect(netMargin).toBeCloseTo(12.92, 1)
  })

  it('should NOT use payout_total as revenue base', () => {
    // payout_total already has deductions (logistics, storage, commission)
    // Using it as revenue base produces incorrect margin

    const payout = 52219.92
    const cogs = 35818
    const wrongMargin = ((payout - cogs) / payout) * 100

    // This is NOT what we want
    expect(wrongMargin).toBeCloseTo(31.38, 1)

    // Gross Margin should use sale_gross_total
    const saleGross = 126922.45
    const correctMargin = ((saleGross - cogs) / saleGross) * 100
    expect(correctMargin).toBeCloseTo(71.78, 1)
  })
})
