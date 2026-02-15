/**
 * TDD Tests for OtherDeductionsCard (RED phase)
 * Story 65.15: Other Deductions (Прочие удержания) — WB Services Breakdown
 *
 * Tests aggregation of WB service deductions with tooltip breakdown.
 * All data comes from existing finance-summary fields.
 * No new backend endpoint required.
 *
 * Data source fields (all in finance-summary):
 * - wb_services_cost_total (main value)
 * - wb_promotion_cost_total (WB.Продвижение)
 * - wb_jam_cost_total (Подписка Джем)
 * - wb_other_services_cost_total (Прочие сервисы)
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md (Story 65.15)
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component that DOES NOT EXIST yet (TDD RED phase)
import { OtherDeductionsCard } from '@/components/custom/dashboard/OtherDeductionsCard'

// =============================================================================
// OtherDeductionsCard Tests — Story 65.15
// =============================================================================

describe('OtherDeductionsCard', () => {
  /**
   * AC-65.15.1: Card "Прочие удержания" shows wb_services_cost_total
   */
  describe('main value display', () => {
    it('renders wb_services_cost_total formatted as currency', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      expect(screen.getByText(/2\s?100/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('displays card title as "Прочие удержания"', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      expect(screen.getByText('Прочие удержания')).toBeInTheDocument()
    })
  })

  /**
   * AC-65.15.4: % от выр. = wb_services_cost_total / sales_gross_total * 100
   */
  describe('revenue percentage', () => {
    it('shows percentage of revenue', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={153220}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      // 2100 / 153220 * 100 = ~1.37%
      expect(screen.getByText(/1[,.]4/)).toBeInTheDocument()
      expect(screen.getByText(/от выручки/)).toBeInTheDocument()
    })

    it('does not show percentage when revenueTotal is null', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
    })
  })

  /**
   * AC-65.15.2: Inverted comparison (growth = bad)
   */
  describe('period comparison', () => {
    it('uses inverted comparison: increase = negative (red)', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={1800}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      // Growth in deductions is bad — negative direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })

    it('uses inverted comparison: decrease = positive (green)', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={1500}
          previousValue={1800}
          revenueTotal={null}
          promotionCost={800}
          jamCost={400}
          otherServicesCost={300}
          isLoading={false}
        />
      )

      // Decrease in deductions is good — positive direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-500')
    })

    it('hides comparison when previousValue is null', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })

  /**
   * AC-65.15.3: Tooltip with breakdown by subcategory
   */
  describe('tooltip breakdown', () => {
    it('shows "Продвижение" with promotion cost in tooltip', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      const tooltipTrigger = screen.getByTestId('deductions-tooltip-trigger')
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText(/Продвижение/)).toBeInTheDocument()
        expect(screen.getByText(/1\s?200/)).toBeInTheDocument()
      })
    })

    it('shows "Джем" with jam cost in tooltip', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      const tooltipTrigger = screen.getByTestId('deductions-tooltip-trigger')
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText(/Джем/)).toBeInTheDocument()
        expect(screen.getByText(/500/)).toBeInTheDocument()
      })
    })

    it('shows "Прочие сервисы" with other services cost in tooltip', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <OtherDeductionsCard
          value={2100}
          previousValue={null}
          revenueTotal={null}
          promotionCost={1200}
          jamCost={500}
          otherServicesCost={400}
          isLoading={false}
        />
      )

      const tooltipTrigger = screen.getByTestId('deductions-tooltip-trigger')
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText(/Прочие сервисы/)).toBeInTheDocument()
        expect(screen.getByText(/400/)).toBeInTheDocument()
      })
    })
  })

  /**
   * Edge cases and states
   */
  describe('edge cases', () => {
    it('shows "—" when value is null', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={null}
          previousValue={null}
          revenueTotal={null}
          promotionCost={null}
          jamCost={null}
          otherServicesCost={null}
          isLoading={false}
        />
      )

      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })

    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <OtherDeductionsCard
          value={null}
          previousValue={null}
          revenueTotal={null}
          promotionCost={null}
          jamCost={null}
          otherServicesCost={null}
          isLoading={true}
        />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('displays zero as 0 ₽, not as "—"', () => {
      renderWithProviders(
        <OtherDeductionsCard
          value={0}
          previousValue={null}
          revenueTotal={null}
          promotionCost={0}
          jamCost={0}
          otherServicesCost={0}
          isLoading={false}
        />
      )

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl.textContent).toMatch(/0/)
      expect(valueEl.textContent).not.toBe('—')
    })
  })
})
