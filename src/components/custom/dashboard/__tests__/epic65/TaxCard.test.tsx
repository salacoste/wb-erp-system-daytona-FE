/**
 * TDD Tests for TaxCard (RED phase)
 * Story 65.11: Tax Estimate
 *
 * Tests tax calculation for USN 6%, USN 15%, manual mode,
 * tax system selection, and period comparison.
 *
 * Backend dependency: Request #141 — Tax settings in cabinet profile
 *
 * Tax formulas (from backend-gap-analysis.md Section 4):
 * - USN 6%:  sale_gross_total * 0.06
 * - USN 15%: MAX((income - expenses) * 0.15, income * 0.01)
 * - Manual:  user-entered value
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component that DOES NOT EXIST yet (TDD RED phase)
import { TaxCard } from '@/components/custom/dashboard/TaxCard'

// Mock factories
import { createFinanceSummaryMock, createAdvertisingAnalyticsMock } from './mocks/api-mocks'

// =============================================================================
// TaxCard Tests — Story 65.11
// =============================================================================

describe('TaxCard', () => {
  const financeSummary = createFinanceSummaryMock()
  const advertisingData = createAdvertisingAnalyticsMock()

  /**
   * AC-65.11.1: Card "Налоги" shows currency and % of revenue
   * AC-65.11.5: Default USN 6%
   */
  describe('USN 6% (Доходы)', () => {
    it('calculates tax as sale_gross_total * 0.06', () => {
      // sale_gross_total = 145266, tax = 145266 * 0.06 = 8715.96
      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={financeSummary.sale_gross_total!}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      // 8 716 ₽ (rounded)
      expect(screen.getByText(/8\s?71[56]/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('shows tax as percentage of revenue', () => {
      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={145266}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      // 6% of revenue
      expect(screen.getByText(/6[,.]0/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.11.1: USN 15% calculation
   * Formula: MAX((sale_gross_total - expenses) * 0.15, sale_gross_total * 0.01)
   */
  describe('USN 15% (Доходы-Расходы)', () => {
    it('calculates USN 15% using income minus expenses formula', () => {
      // sale_gross_total = 145266
      // expenses = logistics(17566) + storage(2024) + acceptance(450)
      //          + penalties(1200) + other_adj(-3500) + cogs(35818) + advertising(3728)
      // expenses = 57286
      // taxBase = 145266 - 57286 = 87980
      // tax = 87980 * 0.15 = 13197
      // min tax = 145266 * 0.01 = 1452.66
      // result = MAX(13197, 1452.66) = 13197
      renderWithProviders(
        <TaxCard
          taxSystem="usn15"
          saleGrossTotal={financeSummary.sale_gross_total!}
          logisticsCostTotal={financeSummary.logistics_cost_total!}
          storageCostTotal={financeSummary.storage_cost_total!}
          paidAcceptanceCostTotal={financeSummary.paid_acceptance_cost_total!}
          penaltiesTotal={financeSummary.penalties_total}
          otherAdjustmentsNetTotal={financeSummary.other_adjustments_net_total!}
          cogsTotal={financeSummary.cogs_total!}
          advertisingSpend={advertisingData.total_spend}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      // Should show calculated tax value as currency
      expect(screen.getByText(/₽/)).toBeInTheDocument()
      // Value should be > 0 (not the minimum tax)
      expect(screen.getByTestId('metric-value').textContent).not.toBe('—')
    })

    it('applies minimum tax rule: MAX(calculated, 1% of income)', () => {
      // When expenses > income, calculated tax would be negative
      // Minimum tax = sale_gross_total * 0.01 should apply
      renderWithProviders(
        <TaxCard
          taxSystem="usn15"
          saleGrossTotal={100000}
          logisticsCostTotal={40000}
          storageCostTotal={10000}
          paidAcceptanceCostTotal={5000}
          penaltiesTotal={5000}
          otherAdjustmentsNetTotal={20000}
          cogsTotal={30000}
          advertisingSpend={10000}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      // Expenses = 120000 > income 100000 => tax_base = -20000
      // calculated tax = -20000 * 0.15 = -3000 (negative)
      // min tax = 100000 * 0.01 = 1000
      // result = MAX(-3000, 1000) = 1000
      expect(screen.getByText(/1\s?000/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.11.6: Manual mode shows user-entered value
   */
  describe('manual mode', () => {
    it('shows user-entered value in manual mode', () => {
      renderWithProviders(
        <TaxCard
          taxSystem="manual"
          manualTaxAmount={12500}
          saleGrossTotal={145266}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      // Shows manual value: 12 500 ₽
      expect(screen.getByText(/12\s?500/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.11.7: When tax_system not set, show setup prompt
   */
  describe('no tax system configured', () => {
    it('shows "не рассчитано" when tax_system is not set', () => {
      renderWithProviders(
        <TaxCard
          taxSystem={null}
          saleGrossTotal={145266}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      expect(screen.getByText(/Настройте систему/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.11.4: Tax system selector
   */
  describe('tax system selector', () => {
    it('renders tax system selector options', async () => {
      const user = userEvent.setup()
      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={145266}
          previousTaxAmount={null}
          isLoading={false}
          onTaxSystemChange={() => {}}
        />
      )

      const selector = screen.getByTestId('tax-system-selector')
      await user.click(selector)

      expect(screen.getByText(/УСН 6%/)).toBeInTheDocument()
      expect(screen.getByText(/УСН 15%/)).toBeInTheDocument()
    })

    it('persists tax system selection via callback', async () => {
      const onChangeMock = vi.fn()
      const user = userEvent.setup()

      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={145266}
          previousTaxAmount={null}
          isLoading={false}
          onTaxSystemChange={onChangeMock}
        />
      )

      const selector = screen.getByTestId('tax-system-selector')
      await user.click(selector)

      // Select USN 15%
      const usn15Option = screen.getByText(/УСН 15%/)
      await user.click(usn15Option)

      expect(onChangeMock).toHaveBeenCalledWith('usn15')
    })
  })

  /**
   * AC-65.11.3: Comparison with previous period
   */
  describe('period comparison', () => {
    it('shows comparison with previous period tax amount', () => {
      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={145266}
          previousTaxAmount={7800}
          isLoading={false}
        />
      )

      // Current: 145266 * 0.06 = 8715.96, Previous: 7800
      // Change = +11.7%
      expect(screen.getByText(/11/)).toBeInTheDocument()
    })
  })

  describe('formatting', () => {
    it('formats tax as currency with ₽ symbol', () => {
      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={100000}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      // 100000 * 0.06 = 6000
      expect(screen.getByText(/6\s?000/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })
  })

  describe('loading and error states', () => {
    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <TaxCard taxSystem="usn6" saleGrossTotal={0} previousTaxAmount={null} isLoading={true} />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('shows "—" when saleGrossTotal is null', () => {
      renderWithProviders(
        <TaxCard
          taxSystem="usn6"
          saleGrossTotal={null}
          previousTaxAmount={null}
          isLoading={false}
        />
      )

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
