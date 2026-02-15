/**
 * TDD Tests for TurnoverCard (RED phase)
 * Story 65.10: Inventory Turnover (days)
 *
 * Tests turnover calculation by sales and orders, zero-division handling,
 * day formatting, color-coded sentiment, and period comparison.
 *
 * Formulas (from backend-gap-analysis.md Section 4):
 * - turnover_by_sales  = totalStock / (salesCount / daysInPeriod)
 * - turnover_by_orders = totalStock / (ordersCount / daysInPeriod)
 *
 * Data sources:
 * - totalStock: GET /v1/inventory/summary (Request #140)
 * - salesCount: fulfillment/summary fbo.salesCount + fbs.salesCount
 * - ordersCount: fulfillment/summary total.ordersCount
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component that DOES NOT EXIST yet (TDD RED phase)
import { TurnoverCard } from '@/components/custom/dashboard/TurnoverCard'

// =============================================================================
// TurnoverCard Tests — Story 65.10
// =============================================================================

describe('TurnoverCard', () => {
  /**
   * AC-65.10.1: Card "Оборачиваемость по продажам" shows N Дн.
   */
  describe('turnover by sales', () => {
    it('calculates turnover_by_sales = totalStock / dailyAvgSales * period_days', () => {
      // totalStock = 2988, salesCount = 310 (fbo 210 + fbs 100), daysInPeriod = 7
      // dailyAvgSales = 310 / 7 = 44.29
      // turnover = 2988 / 44.29 = 67.5 days
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2988}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      // Should show ~67 or 68 days
      expect(screen.getByText(/6[78]/)).toBeInTheDocument()
      expect(screen.getByText(/дн\./)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.10.2: Card "Оборачиваемость по заказам" shows N Дн.
   */
  describe('turnover by orders', () => {
    it('calculates turnover_by_orders = totalStock / dailyAvgOrders * period_days', () => {
      // totalStock = 2988, ordersCount = 400, daysInPeriod = 7
      // dailyAvgOrders = 400 / 7 = 57.14
      // turnover = 2988 / 57.14 = 52.3 days
      renderWithProviders(
        <TurnoverCard
          type="orders"
          totalStock={2988}
          count={400}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      // Should show ~52 days
      expect(screen.getByText(/52/)).toBeInTheDocument()
      expect(screen.getByText(/дн\./)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.10.8: Division by zero handling
   */
  describe('zero division handling', () => {
    it('shows "—" when salesCount is 0', () => {
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2988}
          count={0}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows "—" when ordersCount is 0', () => {
      renderWithProviders(
        <TurnoverCard
          type="orders"
          totalStock={2988}
          count={0}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  /**
   * AC-65.10.3: Comparison shows days and percentage difference
   */
  describe('period comparison', () => {
    it('shows comparison with previous period', () => {
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2988}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={75}
          isLoading={false}
        />
      )

      // Current ~67 days vs previous 75 days = improvement
      expect(screen.getByTestId('trend-indicator')).toBeInTheDocument()
    })

    /**
     * AC-65.10.4: Inverted comparison — decrease in days = good (green)
     */
    it('uses inverted comparison: lower turnover days = positive (green)', () => {
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2000}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={75}
          isLoading={false}
        />
      )

      // Lower turnover = faster selling = good
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-500')
    })

    it('uses inverted comparison: higher turnover days = negative (red)', () => {
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={5000}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={50}
          isLoading={false}
        />
      )

      // Higher turnover = slower selling = bad
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })

    it('hides comparison when previousTurnoverDays is null', () => {
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2988}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })

  /**
   * AC-65.10.5: Color coding by turnover days
   */
  describe('sentiment coloring', () => {
    it('shows green color for turnover < 30 days (fast)', () => {
      // totalStock = 100, salesCount = 310, days = 7
      // daily = 310/7 = 44.3, turnover = 100 / 44.3 = 2.3 days
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={100}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl).toHaveClass('text-green-500')
    })

    it('shows yellow color for turnover 30-90 days (medium)', () => {
      // Need turnover between 30-90 days
      // totalStock = 2988, salesCount = 310, days = 7
      // daily = 44.3, turnover = 2988 / 44.3 = 67.5 days
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2988}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl).toHaveClass('text-yellow-500')
    })

    it('shows red color for turnover > 90 days (slow)', () => {
      // totalStock = 10000, salesCount = 310, days = 7
      // daily = 44.3, turnover = 10000 / 44.3 = 225.7 days
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={10000}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl).toHaveClass('text-red-500')
    })
  })

  /**
   * AC-65.10.6: Tooltip with formula explanation
   */
  describe('tooltip', () => {
    it('shows formula explanation in tooltip', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={2988}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      const tooltipTrigger = screen.getByTestId('turnover-tooltip-trigger')
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        // Tooltip should explain what turnover means
        expect(screen.getByText(/оборачиваемость/i)).toBeInTheDocument()
      })
    })
  })

  /**
   * AC-65.10.7: No data state
   */
  describe('loading and error states', () => {
    it('shows "—" when no inventory data (totalStock is null)', () => {
      renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={null}
          count={310}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <TurnoverCard
          type="sales"
          totalStock={null}
          count={null}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={true}
        />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('formats result as "XX дн." (Russian days abbreviation)', () => {
      renderWithProviders(
        <TurnoverCard
          type="orders"
          totalStock={1000}
          count={100}
          daysInPeriod={7}
          previousTurnoverDays={null}
          isLoading={false}
        />
      )

      // 1000 / (100/7) = 70 days
      expect(screen.getByText(/70/)).toBeInTheDocument()
      expect(screen.getByText(/дн\./)).toBeInTheDocument()
    })
  })
})
