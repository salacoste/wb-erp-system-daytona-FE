/**
 * TDD Tests for Story 65.7: Commission Breakdown Popover
 * RED phase — all tests expected to FAIL (component does not exist yet).
 *
 * Popover on WbCommissionsCard showing 4 subcategories:
 * 1. Скидка МП (wb_commission_adj) — green (compensates seller)
 * 2. Номинальная комиссия (commission_sales) — red
 * 3. Эквайринг (acquiring_fee) — red
 * 4. Прочие (loyalty_fee + penalties_total + wb_services_cost) — red
 *
 * All 6 fields are already in WbCommissionsCard props.
 *
 * @see Story 65.7, AC-65.7.1 through AC-65.7.7
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component under test — DOES NOT EXIST YET (TDD Red phase)
import { CommissionBreakdownPopover } from '../../CommissionBreakdownPopover'

// =============================================================================
// Shared test data: commission fields matching WbCommissionsCard props
// =============================================================================

const defaultProps = {
  commissionSales: 120_000,
  acquiringFee: 25_000,
  wbCommissionAdj: -15_000,
  loyaltyFee: 8_000,
  penaltiesTotal: 3_000,
  wbServicesCost: 12_000,
  saleGross: 1_500_000,
}

// =============================================================================
// AC-65.7.1: Badge with count "4"
// =============================================================================

describe('CommissionBreakdownPopover', () => {
  describe('AC-65.7.1: badge renders with count', () => {
    it('renders badge showing "4" subcategories', () => {
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const badge = screen.getByTestId('commission-breakdown-badge')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toContain('4')
    })
  })

  // ===========================================================================
  // AC-65.7.2: Popover content with 4 rows
  // ===========================================================================

  describe('AC-65.7.2: popover shows 4 subcategories', () => {
    it('shows Скидка МП (wb_commission_adj) with value and % of revenue', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      // Click to open popover
      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      // Should show "Скидка МП"
      expect(screen.getByText(/Скидка МП/)).toBeInTheDocument()
      // Value: -15_000 formatted as currency
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/15\s*000/)
    })

    it('shows Номинальная комиссия (commission_sales) with value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      expect(screen.getByText(/Номинальная комиссия/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/120\s*000/)
    })

    it('shows Эквайринг (acquiring_fee) with value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      expect(screen.getByText(/Эквайринг/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/25\s*000/)
    })

    it('shows Прочие (loyalty + penalties + wb_services) with value', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      // Прочие = 8_000 + 3_000 + 12_000 = 23_000
      expect(screen.getByText(/Прочие/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/23\s*000/)
    })

    it('each subcategory shows % of revenue', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      const popover = screen.getByRole('dialog')
      // commission_sales / saleGross * 100 = 120_000 / 1_500_000 * 100 = 8.0%
      expect(popover.textContent).toMatch(/8,0/)
    })
  })

  // ===========================================================================
  // AC-65.7.3: wb_commission_adj shown in green (compensation)
  // ===========================================================================

  describe('AC-65.7.3: color coding', () => {
    it('shows Скидка МП in green (compensation to seller)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      const discountRow = screen.getByText(/Скидка МП/).closest('[data-testid]')
      expect(discountRow).toBeInTheDocument()
      // Green color for compensation
      if (discountRow) {
        expect(discountRow.className).toMatch(/green/)
      }
    })

    it('shows other subcategories in red (expenses)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      const commissionRow = screen.getByText(/Номинальная комиссия/).closest('[data-testid]')
      if (commissionRow) {
        expect(commissionRow.className).toMatch(/red/)
      }
    })
  })

  // ===========================================================================
  // AC-65.7.4: Net total matches card value
  // ===========================================================================

  describe('AC-65.7.4: net total validation', () => {
    it('shows net total at bottom of popover', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      // Net total = -15_000 + 120_000 + 25_000 + 8_000 + 3_000 + 12_000 = 153_000
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/153\s*000/)
    })
  })

  // ===========================================================================
  // AC-65.7.5: "Прочие" row grouping
  // ===========================================================================

  describe('AC-65.7.5: "Прочие" row calculation', () => {
    it('calculates Прочие = loyaltyFee + penaltiesTotal + wbServicesCost', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      // 8_000 + 3_000 + 12_000 = 23_000
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/23\s*000/)
    })

    it('shows Прочие when at least one sub-field is not null', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CommissionBreakdownPopover
          {...defaultProps}
          loyaltyFee={null}
          penaltiesTotal={null}
          wbServicesCost={12_000}
        />
      )

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      expect(screen.getByText(/Прочие/)).toBeInTheDocument()
    })

    it('hides Прочие when all 3 sub-fields are null', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CommissionBreakdownPopover
          {...defaultProps}
          loyaltyFee={null}
          penaltiesTotal={null}
          wbServicesCost={null}
        />
      )

      const trigger = screen.getByTestId('commission-breakdown-badge')
      await user.click(trigger)

      // When all three are null, "Прочие" row should not appear
      // Badge might show "3" instead of "4"
      expect(screen.queryByText(/Прочие/)).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // AC-65.7.6: No new data piping needed (all from existing props)
  // ===========================================================================

  describe('AC-65.7.6: works with existing WbCommissionsCard props', () => {
    it('renders with all 6 commission fields from WbCommissionsCard', () => {
      // All props match existing WbCommissionsCardProps
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      expect(screen.getByTestId('commission-breakdown-badge')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Accessibility: keyboard-accessible popover
  // ===========================================================================

  describe('accessibility', () => {
    it('popover can be triggered via keyboard (Enter)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      trigger.focus()
      await user.keyboard('{Enter}')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('popover can be triggered via keyboard (Space)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const trigger = screen.getByTestId('commission-breakdown-badge')
      trigger.focus()
      await user.keyboard(' ')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
