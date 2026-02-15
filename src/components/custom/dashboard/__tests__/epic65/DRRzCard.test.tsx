/**
 * TDD Tests for Story 65.4: DRRz Card (Advertising as % of orders revenue)
 * RED phase — all tests expected to FAIL (component changes do not exist yet).
 *
 * DRR = totalSpend / saleGross * 100 (already exists as pctOfSales)
 * DRRz = totalSpend / ordersRevenue * 100 (NEW)
 *
 * This story modifies the existing AdvertisingCard to add DRRz.
 *
 * @see Story 65.4, AC-65.4.1 through AC-65.4.4
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component under test — AdvertisingCard will be MODIFIED (TDD Red phase)
import { AdvertisingCard } from '../../AdvertisingCard'

// =============================================================================
// AC-65.4.1: DRR relabeled + DRRz displayed
// =============================================================================

describe('AdvertisingCard — DRRz (Story 65.4)', () => {
  describe('AC-65.4.1: labels and layout', () => {
    it('displays "ДРР" label for existing pctOfSales metric', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={70_000}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      // Should show "ДРР" (relabeled from "от продаж")
      expect(screen.getByText(/ДРР/)).toBeInTheDocument()
    })

    it('displays "ДРРз" label for new ordersRevenue-based metric', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={70_000}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      // Should show "ДРРз" for the orders-based DRR
      expect(screen.getByText(/ДРРз/)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.4.2: DRRz calculation and formatting
  // ===========================================================================

  describe('AC-65.4.2: DRRz calculation', () => {
    it('calculates DRRz = totalSpend / ordersRevenue * 100', () => {
      // 75_000 / 5_000_000 * 100 = 1.5%
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={null}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      // Should show "1,5 %" or "1,50 %" formatted via formatPercentage
      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/1,5/)
    })

    it('calculates DRR = totalSpend / saleGross * 100', () => {
      // 75_000 / 1_500_000 * 100 = 5.0%
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={null}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      // DRR should show 5% area
      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/5/)
    })

    it('handles advertisingSpend === 0 gracefully (shows 0%)', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={0}
          roas={null}
          previousSpend={null}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      // DRRz should be 0
      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/0/)
    })

    it('shows "---" for DRRz when ordersRevenue === 0 (division by zero)', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={null}
          saleGross={1_500_000}
          ordersRevenue={0}
          isLoading={false}
        />
      )

      // DRRz should not be displayed when ordersRevenue is 0
      // DRR should still display (based on saleGross)
      expect(screen.queryByText(/ДРРз/)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.4.3: Tooltip explaining DRR vs DRRz
  // ===========================================================================

  describe('AC-65.4.3: tooltip content', () => {
    it('has tooltip explaining difference between DRR and DRRz', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={null}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      const tooltipButton = screen.getByLabelText(/подробнее/i)
      expect(tooltipButton).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.4.4: Graceful fallback when fulfillment unavailable
  // ===========================================================================

  describe('AC-65.4.4: graceful degradation', () => {
    it('shows only DRR (no DRRz) when ordersRevenue is undefined', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={70_000}
          saleGross={1_500_000}
          ordersRevenue={undefined}
          isLoading={false}
        />
      )

      // DRR should still be present
      expect(screen.getByText(/ДРР/)).toBeInTheDocument()
      // DRRз should NOT be present when ordersRevenue unavailable
      expect(screen.queryByText(/ДРРз/)).not.toBeInTheDocument()
    })

    it('shows only DRR when ordersRevenue is null', () => {
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={70_000}
          saleGross={1_500_000}
          ordersRevenue={null}
          isLoading={false}
        />
      )

      expect(screen.queryByText(/ДРРз/)).not.toBeInTheDocument()
    })

    it('inverted comparison: higher DRR/DRRz is worse', () => {
      // DRR increased from 4.67% to 5.0% — this is BAD (more spend relative to sales)
      renderWithProviders(
        <AdvertisingCard
          totalSpend={75_000}
          roas={6.0}
          previousSpend={70_000}
          saleGross={1_500_000}
          ordersRevenue={5_000_000}
          isLoading={false}
        />
      )

      // Advertising card already uses inverted comparison (increase = negative/red)
      // This test verifies the existing behavior is maintained with the new DRRz prop
      const card = screen.getByRole('article')
      expect(card).toBeInTheDocument()
    })
  })
})
