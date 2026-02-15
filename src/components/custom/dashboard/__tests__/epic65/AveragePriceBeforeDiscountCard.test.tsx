/**
 * TDD Tests for AveragePriceBeforeDiscountCard (RED phase)
 * Story 65.15: Average Price Before Marketplace Discount
 *
 * Tests calculation of average retail price before marketplace discount.
 * All data comes from existing finance-summary and fulfillment endpoints.
 *
 * Formula (from backend-gap-analysis.md Section 2, C8):
 *   avg_price_before_discount = retail_price_total / salesCount
 *   where salesCount = fbo.salesCount + fbs.salesCount
 *
 * NOTE: retail_price_total is SUM(retail_price) WHERE doc_type='sale',
 * so we divide by salesCount (buyouts), NOT ordersCount.
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component that DOES NOT EXIST yet (TDD RED phase)
import { AveragePriceBeforeDiscountCard } from '@/components/custom/dashboard/AveragePriceBeforeDiscountCard'

// =============================================================================
// AveragePriceBeforeDiscountCard Tests — Story 65.15 (C8)
// =============================================================================

describe('AveragePriceBeforeDiscountCard', () => {
  /**
   * C8: avg_price_before_discount = retail_price_total / salesCount
   */
  describe('calculation', () => {
    it('calculates average price as retail_price_total / salesCount', () => {
      // retail_price_total = 198000, salesCount = 310
      // avg = 198000 / 310 = 638.71
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={310}
          previousValue={null}
          isLoading={false}
        />
      )

      // Should show ~639 ₽
      expect(screen.getByText(/63[89]/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('uses salesCount (buyouts) not ordersCount for division', () => {
      // Ensure correct denominator: salesCount, not ordersCount
      // retail_price_total = 100000, salesCount = 200
      // avg = 100000 / 200 = 500
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={100000}
          salesCount={200}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.getByText(/500/)).toBeInTheDocument()
    })
  })

  /**
   * Division by zero protection
   */
  describe('zero salesCount handling', () => {
    it('shows "—" when salesCount is 0', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={0}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows "—" when salesCount is null', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={null}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  /**
   * Currency formatting
   */
  describe('formatting', () => {
    it('formats result as currency with ₽', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={310}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('displays card title', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={310}
          previousValue={null}
          isLoading={false}
        />
      )

      // Card should have a title indicating "average price" concept
      expect(screen.getByText(/Ср\. цена до скидок/)).toBeInTheDocument()
    })
  })

  /**
   * Period comparison
   */
  describe('comparison with previous period', () => {
    it('shows comparison when previousValue is provided', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={310}
          previousValue={600}
          isLoading={false}
        />
      )

      // Current ~639, previous 600 => +6.5%
      expect(screen.getByTestId('trend-indicator')).toBeInTheDocument()
    })

    it('hides comparison when previousValue is null', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={198000}
          salesCount={310}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })

  /**
   * Loading and null states
   */
  describe('loading and null states', () => {
    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={null}
          salesCount={null}
          previousValue={null}
          isLoading={true}
        />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('shows "—" when retailPriceTotal is null', () => {
      renderWithProviders(
        <AveragePriceBeforeDiscountCard
          retailPriceTotal={null}
          salesCount={310}
          previousValue={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
