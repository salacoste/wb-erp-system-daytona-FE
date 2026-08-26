/**
 * Tests for Story 65.7: Commission Breakdown Popover
 *
 * Popover on WbCommissionsCard showing canonical commission subcategories:
 * 1. Корректировка ВВ (wb_commission_adj)
 * 2. Номинальная комиссия (commission_sales)
 * 3. Эквайринг (acquiring_fee)
 * 4. Комиссия лояльности + штрафы
 *
 * @see Story 65.7, AC-65.7.1 through AC-65.7.7
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { CommissionBreakdownPopover } from '../../CommissionBreakdownPopover'

const defaultProps = {
  commissionSales: 120_000,
  acquiringFee: 25_000,
  wbCommissionAdj: -15_000,
  loyaltyFee: 8_000,
  penaltiesTotal: 3_000,
  saleGross: 1_500_000,
}

describe('CommissionBreakdownPopover', () => {
  describe('badge count', () => {
    it('renders badge showing "4" subcategories when loyalty/penalty row exists', () => {
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      const badge = screen.getByTestId('commission-breakdown-badge')
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toContain('4')
    })
  })

  describe('popover rows', () => {
    it('labels wbCommissionAdj as Корректировка ВВ and omits the deprecated MP-discount label', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      expect(screen.getByText(/Корректировка ВВ/)).toBeInTheDocument()
      const deprecatedMpDiscountLabel = `Скидка ${'МП'}`
      expect(screen.queryByText(deprecatedMpDiscountLabel)).not.toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/15\s*000/)
    })

    it('shows canonical commission and acquiring labels with values', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      expect(screen.getByText(/Номинальная комиссия/)).toBeInTheDocument()
      expect(screen.getByText(/Эквайринг/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/120\s*000/)
      expect(popover.textContent).toMatch(/25\s*000/)
    })

    it('shows loyalty and penalties as an explicit display grouping', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      expect(screen.getByText(/Комиссия лояльности \+ штрафы/)).toBeInTheDocument()
      const popover = screen.getByRole('dialog')
      // 8_000 + 3_000 = 11_000; WB services are not included by default.
      expect(popover.textContent).toMatch(/11\s*000/)
      expect(screen.queryByText(/^Прочие$/)).not.toBeInTheDocument()
    })

    it('each subcategory shows % of revenue', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      const popover = screen.getByRole('dialog')
      // commission_sales / saleGross * 100 = 120_000 / 1_500_000 * 100 = 8.0%
      expect(popover.textContent).toMatch(/8,0/)
    })
  })

  describe('color coding', () => {
    it('shows Корректировка ВВ as an expense/correction row, not green compensation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      const correctionRow = screen.getByText(/Корректировка ВВ/).closest('[data-testid]')
      expect(correctionRow).toBeInTheDocument()
      expect(correctionRow?.className).toMatch(/status-error/)
      expect(correctionRow?.className).not.toMatch(/status-success/)
    })

    it('shows other subcategories in red (expenses)', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      const commissionRow = screen.getByText(/Номинальная комиссия/).closest('[data-testid]')
      expect(commissionRow?.className).toMatch(/status-error/)
    })
  })

  describe('net total validation', () => {
    it('shows net total at bottom of popover without WB services by default', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      // Net total = -15_000 + 120_000 + 25_000 + 8_000 + 3_000 = 141_000
      const popover = screen.getByRole('dialog')
      expect(popover.textContent).toMatch(/141\s*000/)
      expect(popover.textContent).not.toMatch(/153\s*000/)
    })

    it('keeps W24-style total at 91 605,44 when WB services are undefined', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CommissionBreakdownPopover
          commissionSales={73_196.83}
          acquiringFee={18_182.01}
          wbCommissionAdj={0}
          loyaltyFee={0}
          penaltiesTotal={226.6}
          saleGross={723_537.55}
        />
      )

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      const popover = screen.getByRole('dialog')
      expect(screen.getByText(/Комиссия лояльности \+ штрафы/)).toBeInTheDocument()
      expect(popover.textContent).toMatch(/226,6/)
      expect(popover.textContent).toMatch(/91\s*605,44/)
      expect(popover.textContent).not.toMatch(/138\s*825,44/)
    })
  })

  describe('loyalty/penalty/services grouping', () => {
    it('shows loyalty/penalty grouping when at least one included sub-field is not null', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CommissionBreakdownPopover {...defaultProps} loyaltyFee={null} penaltiesTotal={3_000} />
      )

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      expect(screen.getByText(/Комиссия лояльности \+ штрафы/)).toBeInTheDocument()
    })

    it('hides grouping when loyalty, penalties, and services are all null', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <CommissionBreakdownPopover {...defaultProps} loyaltyFee={null} penaltiesTotal={null} />
      )

      await user.click(screen.getByTestId('commission-breakdown-badge'))

      expect(screen.queryByText(/Комиссия лояльности \+ штрафы/)).not.toBeInTheDocument()
      expect(screen.queryByText(/^Прочие$/)).not.toBeInTheDocument()
    })
  })

  describe('works with existing WbCommissionsCard props', () => {
    it('renders with all commission fields from WbCommissionsCard', () => {
      renderWithProviders(<CommissionBreakdownPopover {...defaultProps} />)

      expect(screen.getByTestId('commission-breakdown-badge')).toBeInTheDocument()
    })
  })

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
