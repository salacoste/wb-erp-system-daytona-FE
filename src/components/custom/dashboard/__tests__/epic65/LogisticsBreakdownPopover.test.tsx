/**
 * Tests for Story 65.6: Logistics Breakdown Popover
 *
 * Popover on LogisticsMetricCard showing 4 subcategories:
 * 1. К клиенту при продаже (to_buyer) — green (delivery to customer)
 * 2. К клиенту при отмене (to_buyer_cancel) — red
 * 3. От клиента при отмене (from_buyer_cancel) — red
 * 4. От клиента при возврате (from_buyer_return) — red
 *
 * @see Story 65.6, AC-65.6.1 through AC-65.6.5
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { LogisticsBreakdownPopover } from '../../LogisticsBreakdownPopover'
import type { LogisticsBreakdown } from '@/types/finance-summary'

// =============================================================================
// Shared test data
// =============================================================================

const defaultBreakdown: LogisticsBreakdown = {
  to_buyer: 16_602,
  to_buyer_cancel: 4_845,
  from_buyer_cancel: 2_200,
  from_buyer_return: 100,
}

const defaultProps = {
  breakdown: defaultBreakdown,
  saleGross: 1_500_000,
}

// =============================================================================
// AC-65.6.1: Badge with count
// =============================================================================

describe('LogisticsBreakdownPopover', () => {
  describe('AC-65.6.1: badge renders with count', () => {
    it('renders badge showing "4" subcategories', () => {
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      const badge = screen.getByTestId('logistics-breakdown-badge')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toContain('4')
    })

    it('shows correct count when some fields are null', () => {
      const partial: LogisticsBreakdown = {
        to_buyer: 16_602,
        to_buyer_cancel: null,
        from_buyer_cancel: 2_200,
        from_buyer_return: null,
      }
      renderWithProviders(<LogisticsBreakdownPopover breakdown={partial} saleGross={1_500_000} />)

      const badge = screen.getByTestId('logistics-breakdown-badge')
      expect(badge.textContent).toContain('2')
    })
  })

  // ===========================================================================
  // AC-65.6.2: Popover content with 4 rows
  // ===========================================================================

  describe('AC-65.6.2: popover shows subcategories', () => {
    it('shows К клиенту при продаже with value and %', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      expect(screen.getByText(/К клиенту при продаже/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/16\s*602/)
    })

    it('shows К клиенту при отмене with value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      expect(screen.getByText(/К клиенту при отмене/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/4\s*845/)
    })

    it('shows От клиента при отмене with value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      expect(screen.getByText(/От клиента при отмене/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/2\s*200/)
    })

    it('shows От клиента при возврате with value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      expect(screen.getByText(/От клиента при возврате/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/100/)
    })

    it('each subcategory shows % of revenue', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      const popover = screen.getByRole('dialog')
      // 16_602 / 1_500_000 * 100 ≈ 1.1%
      expect(popover.textContent).toMatch(/1,1/)
    })
  })

  // ===========================================================================
  // AC-65.6.3: Color coding
  // ===========================================================================

  describe('AC-65.6.3: color coding', () => {
    it('shows К клиенту при продаже in green (delivery)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      const row = screen.getByText(/К клиенту при продаже/).closest('[data-testid]')
      expect(row).toBeInTheDocument()
      if (row) {
        expect(row.className).toMatch(/status-success/)
      }
    })

    it('shows other subcategories in red (expenses)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      const cancelRow = screen.getByText(/К клиенту при отмене/).closest('[data-testid]')
      if (cancelRow) {
        expect(cancelRow.className).toMatch(/status-error/)
      }
    })
  })

  // ===========================================================================
  // AC-65.6.4: Graceful degradation
  // ===========================================================================

  describe('AC-65.6.4: graceful degradation', () => {
    it('renders badge when breakdown is null', () => {
      renderWithProviders(<LogisticsBreakdownPopover breakdown={null} saleGross={1_500_000} />)

      expect(screen.getByTestId('logistics-breakdown-badge')).toBeInTheDocument()
    })

    it('renders badge when breakdown is undefined', () => {
      renderWithProviders(<LogisticsBreakdownPopover breakdown={undefined} saleGross={1_500_000} />)

      expect(screen.getByTestId('logistics-breakdown-badge')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.6.5: Sum validation
  // ===========================================================================

  describe('AC-65.6.5: total matches sum', () => {
    it('shows total equal to sum of 4 subcategories', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('logistics-breakdown-badge'))

      // Total = 16_602 + 4_845 + 2_200 + 100 = 23_747
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/23\s*747/)
    })
  })

  // ===========================================================================
  // Accessibility: keyboard-accessible popover
  // ===========================================================================

  describe('accessibility', () => {
    it('popover can be triggered via keyboard (Enter)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('logistics-breakdown-badge')
      trigger.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('popover can be triggered via keyboard (Space)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<LogisticsBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('logistics-breakdown-badge')
      trigger.focus()
      await user.keyboard(' ')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
