/**
 * TDD Tests for GmvCard (RED phase)
 * Story 65.13: GMV / Реализация (Gross Merchandise Value)
 *
 * Tests GMV display using sales_gross_total from existing finance-summary.
 * No new backend endpoint required.
 *
 * Data source: finance-summary.sales_gross_total (already available)
 * GMV = sales_gross_total = gross sales BEFORE returns subtraction
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 * @see docs/epics/epic-65-dashboard-metrics-parity/backend-gap-analysis.md
 */

import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'

// Component that DOES NOT EXIST yet (TDD RED phase)
import { GmvCard } from '@/components/custom/dashboard/GmvCard'

// =============================================================================
// GmvCard Tests — Story 65.13
// =============================================================================

describe('GmvCard', () => {
  /**
   * AC-65.13.1: Card "Реализация" shows N ₽
   */
  describe('GMV display', () => {
    it('renders sales_gross_total formatted as currency', () => {
      // sales_gross_total = 153220 (gross sales before returns)
      renderWithProviders(<GmvCard value={153220} previousValue={null} isLoading={false} />)

      expect(screen.getByText(/153\s?220/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })

    it('displays card title as "Реализация"', () => {
      renderWithProviders(<GmvCard value={153220} previousValue={null} isLoading={false} />)

      expect(screen.getByText('Реализация')).toBeInTheDocument()
    })

    it('formats large values as compact currency', () => {
      renderWithProviders(<GmvCard value={1532200} previousValue={null} isLoading={false} />)

      // Should display formatted large number
      expect(screen.getByText(/1\s?532\s?200/)).toBeInTheDocument()
      expect(screen.getByText(/₽/)).toBeInTheDocument()
    })
  })

  /**
   * AC-65.13.2: Comparison with previous period
   */
  describe('period comparison', () => {
    it('shows comparison with previous period as absolute and percentage', () => {
      renderWithProviders(<GmvCard value={153220} previousValue={146000} isLoading={false} />)

      // Change = 153220 - 146000 = 7220, or ~4.9%
      expect(screen.getByText(/4[,.]9/)).toBeInTheDocument()
    })

    it('shows positive direction for GMV growth (green)', () => {
      renderWithProviders(<GmvCard value={160000} previousValue={146000} isLoading={false} />)

      // GMV growth is good — positive direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-green-500')
    })

    it('shows negative direction for GMV decline (red)', () => {
      renderWithProviders(<GmvCard value={130000} previousValue={146000} isLoading={false} />)

      // GMV decline is bad — negative direction
      const indicator = screen.getByTestId('trend-indicator')
      expect(indicator).toHaveClass('text-red-500')
    })

    it('hides comparison when previousValue is null', () => {
      renderWithProviders(<GmvCard value={153220} previousValue={null} isLoading={false} />)

      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })

  /**
   * AC-65.13.3: Tooltip explains "Полный объём реализации до вычета возвратов"
   */
  describe('tooltip', () => {
    it('shows explanatory tooltip on hover', async () => {
      const user = userEvent.setup()
      renderWithProviders(<GmvCard value={153220} previousValue={null} isLoading={false} />)

      const tooltipTrigger = screen.getByTestId('gmv-tooltip-trigger')
      await user.hover(tooltipTrigger)

      await waitFor(() => {
        expect(screen.getByText(/до вычета возвратов/)).toBeInTheDocument()
      })
    })
  })

  /**
   * AC-65.13.5: Data from existing finance-summary — handles null
   */
  describe('null and loading states', () => {
    it('shows "—" when value is null', () => {
      renderWithProviders(<GmvCard value={null} previousValue={null} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('shows skeleton while loading', () => {
      const { container } = renderWithProviders(
        <GmvCard value={null} previousValue={null} isLoading={true} />
      )

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    })

    it('shows "—" when value is undefined', () => {
      renderWithProviders(<GmvCard value={undefined} previousValue={null} isLoading={false} />)

      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  /**
   * AC-65.13.4: GMV always >= "Продажи" (sale_gross_total)
   * This is a data invariant, tested as sanity check
   */
  describe('data invariant', () => {
    it('displays zero GMV correctly (not as dash)', () => {
      renderWithProviders(<GmvCard value={0} previousValue={null} isLoading={false} />)

      const valueEl = screen.getByTestId('metric-value')
      expect(valueEl.textContent).toMatch(/0/)
      expect(valueEl.textContent).not.toBe('—')
    })
  })
})
