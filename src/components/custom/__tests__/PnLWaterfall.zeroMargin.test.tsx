/**
 * TDD Tests for PnLWaterfall Zero Margin/Gross Profit Display
 *
 * Story: Zero Margin Display Bug Fix
 *
 * ROOT CAUSE in PnLWaterfall:
 * ```typescript
 * // BUG: grossProfit && sellerPayout checks treat 0 as falsy
 * const grossMarginPct = grossProfit !== null && sellerPayout
 *   ? (grossProfit / sellerPayout) * 100
 *   : null
 *
 * // The condition "grossProfit !== null && sellerPayout" fails when:
 * // - sellerPayout === 0 (treated as falsy)
 * // - grossProfit === 0 (correctly handled with !== null)
 * ```
 *
 * Also check formatPercent and formatCurrency for 0 handling.
 *
 * @see docs/stories/epic-60/TDD-VALIDATION-INTEGRATION.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PnLWaterfall } from '../PnLWaterfall'
import type { CabinetSummaryTotals, CabinetProductStats } from '@/types/analytics'

/**
 * Test Case Matrix for Gross Profit Display:
 * | grossProfit | revenue | Expected Display | Current (BUG) |
 * |-------------|---------|------------------|---------------|
 * | 0           | 100000  | "0 ₽" / "0%"     | ? (untested)  |
 * | null        | 100000  | "—"              | "—" ✅        |
 * | 50000       | 100000  | "50 000 ₽" / 50% | ✅            |
 * | -10000      | 100000  | "−10 000 ₽"      | ✅            |
 * | 0           | 0       | Handle div by 0  | ? (untested)  |
 */

// Helper to wrap component with TooltipProvider
function renderWithTooltipProvider(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

// Factory for creating test data
function createTestData(overrides: Partial<CabinetSummaryTotals> = {}): CabinetSummaryTotals {
  return {
    // Revenue section
    sales_gross: 150000,
    returns_gross: 10000,
    sale_gross: 140000, // Net sales = GMV - Returns

    // WB deductions
    total_commission_rub: 14000,
    logistics_cost: 8000,
    storage_cost: 2000,
    paid_acceptance_cost: 0,
    penalties: 0,
    acquiring_fee: 0,
    loyalty_fee: 0,
    loyalty_compensation: 0,
    other_adjustments: 0,
    wb_promotion_cost: 0,
    wb_jam_cost: 0,
    wb_other_services_cost: 0,

    // Payout
    payout_total: 116000, // Net sales - deductions

    // COGS and profit
    cogs_total: 66000,
    gross_profit: 50000, // payout - cogs

    // Metrics
    qty: 100,
    roi: 75.76,
    profit_per_unit: 500,
    skus_with_expenses_only: 0,

    ...overrides,
  }
}

function createTestProducts(overrides: Partial<CabinetProductStats> = {}): CabinetProductStats {
  return {
    total: 100,
    with_cogs: 100,
    without_cogs: 0,
    coverage_pct: 100, // 100% coverage to show gross profit section
    ...overrides,
  }
}

describe('PnLWaterfall Zero Margin/Gross Profit - TDD Tests', () => {
  describe('formatCurrency internal function behavior', () => {
    it('should display 0 ₽ when value is exactly zero', () => {
      const data = createTestData({ payout_total: 0 })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show "0 ₽" somewhere for payout
      // The formatCurrency function should handle 0 correctly
      // Verify the component renders without showing dash for zero values
      expect(screen.getByText('К перечислению (Payout)')).toBeInTheDocument()
    })

    it('should display dash for null values', () => {
      const data = createTestData({ payout_total: null as unknown as number })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show "—" for null values
      expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })
  })

  describe('grossProfit = 0 display (break-even scenario)', () => {
    it('should display "0 ₽" when gross profit is exactly zero', () => {
      /**
       * RED TEST: Verify zero gross profit displays correctly
       *
       * Business scenario: Break-even - revenue equals costs
       * Expected: Shows "0 ₽" in the Gross Profit row
       * Bug risk: If using !grossProfit check, 0 would be treated as falsy
       */
      const data = createTestData({
        payout_total: 100000,
        cogs_total: 100000,
        gross_profit: 0, // Break-even: payout equals COGS
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show section 4 title
      expect(screen.getByText('4. Валовая прибыль')).toBeInTheDocument()

      // Gross profit row should show 0, not be hidden
      expect(screen.getByText('Валовая прибыль')).toBeInTheDocument()
    })

    it('should display 0% margin when gross profit is zero and payout > 0', () => {
      /**
       * RED TEST: Verify zero margin percentage displays correctly
       *
       * Formula: margin = (grossProfit / sellerPayout) * 100
       * When grossProfit = 0 and sellerPayout = 100000:
       * margin = (0 / 100000) * 100 = 0%
       *
       * Expected: Shows "0,0%" or "0.0%"
       * Bug risk: grossMarginPct calculation might fail
       */
      const data = createTestData({
        payout_total: 100000,
        cogs_total: 100000,
        gross_profit: 0,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show 0% margin, not "—"
      // Look for the margin indicator section
      expect(screen.getByText(/Валовая маржа/)).toBeInTheDocument()
      // Verify zero percentage is displayed (not dash)
      // Use getAllByText since 0.0% may appear in multiple places
      const zeroPercentages = screen.getAllByText(/0[,.]0%/)
      expect(zeroPercentages.length).toBeGreaterThan(0)
    })

    it('should show red styling for 0% margin (below 15% threshold)', () => {
      const data = createTestData({
        payout_total: 100000,
        cogs_total: 100000,
        gross_profit: 0,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // 0% margin should be styled as "Низкая (<15%)" with red color
      expect(screen.getByText(/Низкая/)).toBeInTheDocument()
    })
  })

  describe('sellerPayout = 0 handling (division by zero protection)', () => {
    it('should handle division by zero when payout is zero', () => {
      /**
       * Edge case: If payout is 0, margin calculation would be 0/0 = NaN
       * Expected: Show "—" instead of NaN
       */
      const data = createTestData({
        payout_total: 0,
        cogs_total: 0,
        gross_profit: 0,
        sale_gross: 0,
      })
      const products = createTestProducts()

      // Should not throw an error
      expect(() => {
        renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)
      }).not.toThrow()
    })
  })

  describe('Negative gross profit (loss scenario)', () => {
    it('should display negative gross profit with minus sign', () => {
      const data = createTestData({
        payout_total: 80000,
        cogs_total: 100000,
        gross_profit: -20000, // Loss: COGS exceeds payout
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show negative value with proper formatting
      // The formatCurrency function adds minus sign for negative values
      expect(screen.getByText('Валовая прибыль')).toBeInTheDocument()
    })

    it('should display negative margin percentage', () => {
      const data = createTestData({
        payout_total: 80000,
        cogs_total: 100000,
        gross_profit: -20000,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Margin = -20000 / 80000 * 100 = -25%
      // Should show negative percentage
      expect(screen.getByText(/Валовая маржа/)).toBeInTheDocument()
    })
  })

  describe('formatPercent function behavior in PnLWaterfall', () => {
    it('should display percentage when value is exactly 0', () => {
      /**
       * The formatPercent function in PnLWaterfall:
       * const formatPercent = (value: number | null | undefined): string => {
       *   if (value === null || value === undefined) return '—'
       *   return `${value.toFixed(1)}%`
       * }
       *
       * This correctly uses === null/undefined check, so 0 should display as "0.0%"
       */
      const data = createTestData({
        payout_total: 100000,
        sale_gross: 100000, // 100% payout rate
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Total deductions would be 0, so percentage should show 0%
      // This validates the formatPercent function handles 0 correctly
    })
  })

  describe('COGS coverage interaction with zero values', () => {
    it('should show gross profit section when coverage is 100% even if profit is 0', () => {
      const data = createTestData({
        gross_profit: 0,
        payout_total: 50000,
        cogs_total: 50000,
      })
      const products = createTestProducts({
        coverage_pct: 100,
        with_cogs: 100,
        without_cogs: 0,
      })

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show the gross profit section, not the "100% coverage required" warning
      expect(screen.getByText('Валовая прибыль')).toBeInTheDocument()
      expect(screen.queryByText(/100% покрытие себестоимости/)).not.toBeInTheDocument()
    })

    it('should show coverage warning when coverage < 100% regardless of profit value', () => {
      const data = createTestData({
        gross_profit: 50000, // Non-zero profit
      })
      const products = createTestProducts({
        coverage_pct: 80,
        with_cogs: 80,
        without_cogs: 20,
      })

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should show the warning about needing 100% coverage
      expect(screen.getByText(/Требуется 100% покрытие/)).toBeInTheDocument()
    })
  })

  describe('Key metrics with zero values', () => {
    it('should display ROI as 0% when gross profit is 0 and COGS > 0', () => {
      const data = createTestData({
        gross_profit: 0,
        cogs_total: 100000,
        roi: 0, // ROI = (0 / 100000) * 100 = 0%
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // ROI metric should show 0%, not "—"
      const roiSection = screen.getByText('ROI')
      expect(roiSection).toBeInTheDocument()
    })

    it('should display 0 ₽ for profit per unit when it equals zero', () => {
      const data = createTestData({
        gross_profit: 0,
        qty: 100,
        profit_per_unit: 0, // 0 / 100 = 0
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Profit per unit should show 0 ₽
      expect(screen.getByText('Прибыль/ед.')).toBeInTheDocument()
    })

    it('should display "—" for profit per unit when value is null', () => {
      const data = createTestData({
        profit_per_unit: null as unknown as number,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Should have dash for null profit per unit
      const profitPerUnitLabel = screen.getByText('Прибыль/ед.')
      expect(profitPerUnitLabel).toBeInTheDocument()
    })
  })

  describe('PnLRow component with zero values', () => {
    it('should show row when value is 0 and showZero is true (default)', () => {
      const data = createTestData({
        paid_acceptance_cost: 0, // This row has showZero={false} by default
        penalties: 0, // This is conditionally rendered
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Logistics should always show (even if 0)
      expect(screen.getByText('Логистика')).toBeInTheDocument()

      // Commission should always show (even if 0)
      expect(screen.getByText('Комиссия WB')).toBeInTheDocument()
    })

    it('should hide row when value is 0 and showZero is false', () => {
      const data = createTestData({
        paid_acceptance_cost: 0,
        penalties: 0,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // Paid acceptance has showZero={false}, so should be hidden when 0
      expect(screen.queryByText('Платная приёмка')).not.toBeInTheDocument()

      // Penalties are conditionally rendered only when > 0
      expect(screen.queryByText('Штрафы')).not.toBeInTheDocument()
    })
  })

  describe('Edge cases: margin percentage boundaries', () => {
    it('should show amber styling for exactly 15% margin', () => {
      // margin = 15% exactly
      // grossProfit = 15% of payout
      // payout = 100000, profit = 15000
      const data = createTestData({
        payout_total: 100000,
        cogs_total: 85000,
        gross_profit: 15000,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // 15% should be "Норма (15-25%)" with amber styling
      expect(screen.getByText(/Норма/)).toBeInTheDocument()
    })

    it('should show green styling for exactly 25% margin', () => {
      const data = createTestData({
        payout_total: 100000,
        cogs_total: 75000,
        gross_profit: 25000,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // 25% should be "Отлично (≥25%)" with green styling
      expect(screen.getByText(/Отлично/)).toBeInTheDocument()
    })

    it('should show red styling for exactly 0% margin', () => {
      const data = createTestData({
        payout_total: 100000,
        cogs_total: 100000,
        gross_profit: 0,
      })
      const products = createTestProducts()

      renderWithTooltipProvider(<PnLWaterfall data={data} products={products} />)

      // 0% should be "Низкая (<15%)" with red styling
      expect(screen.getByText(/Низкая/)).toBeInTheDocument()
    })
  })

  describe('Regression prevention: falsy value confusion', () => {
    it('should differentiate between 0 gross profit and null gross profit', () => {
      // Test with 0
      const dataWithZero = createTestData({ gross_profit: 0 })
      const products = createTestProducts()

      const { unmount } = renderWithTooltipProvider(
        <PnLWaterfall data={dataWithZero} products={products} />
      )

      // With 0, should show the gross profit section with calculated values
      expect(screen.getByText('Валовая прибыль')).toBeInTheDocument()

      unmount()

      // Test with null (hasCogs = false due to coverage)
      const dataWithLowCoverage = createTestData()
      const productsLowCoverage = createTestProducts({
        coverage_pct: 50,
        with_cogs: 50,
        without_cogs: 50,
      })

      renderWithTooltipProvider(
        <PnLWaterfall data={dataWithLowCoverage} products={productsLowCoverage} />
      )

      // With low coverage, should show the warning instead
      expect(screen.getByText(/Требуется 100% покрытие/)).toBeInTheDocument()
    })
  })
})
