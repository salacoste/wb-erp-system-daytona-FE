/**
 * TDD RED Phase Tests for NetProfitCard Component
 * Story 66.6-FE: Net Profit After Tax Display
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * @see docs/stories/epic-66/story-66.6-fe-net-profit-card.md
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { TaxMetrics } from '@/types/finance-summary'
import { NetProfitCard } from '../NetProfitCard'

// =============================================================================
// Test Factory
// =============================================================================

function createTaxMetrics(overrides?: Partial<TaxMetrics>): TaxMetrics {
  return {
    tax_amount: 15000,
    tax_base: 100000,
    effective_tax_rate: 15,
    tax_system: 'usn15',
    is_minimum_rule: false,
    net_profit_after_tax: 85000,
    vat_payer: false,
    vat_rate: null,
    vat_output: null,
    vat_payable: null,
    revenue_excl_vat: null,
    net_profit_after_all_tax: null,
    ...overrides,
  }
}

function renderCard(props: Partial<Parameters<typeof NetProfitCard>[0]> = {}) {
  const defaultProps = {
    taxMetrics: null,
    payoutTotal: null,
    saleGrossTotal: null,
    previousTaxMetrics: null,
    previousPayoutTotal: null,
    isLoading: false,
  }
  return render(
    <TooltipProvider>
      <NetProfitCard {...defaultProps} {...props} />
    </TooltipProvider>
  )
}

// =============================================================================
// Rendering Tests
// =============================================================================

describe('NetProfitCard (Story 66.6-FE)', () => {
  it('renders net profit after all tax when VAT configured', () => {
    const tax = createTaxMetrics({
      vat_payer: true,
      vat_rate: 20,
      net_profit_after_all_tax: 55000,
      net_profit_after_tax: 85000,
      revenue_excl_vat: 160000,
    })

    renderCard({ taxMetrics: tax, payoutTotal: 250000, saleGrossTotal: 200000 })

    // Should display "Чистая прибыль" label (not "К перечислению")
    expect(screen.getByText(/чистая прибыль/i)).toBeInTheDocument()
    // Should display 55,000 formatted value
    const card = screen.getByRole('article')
    expect(card.textContent).toMatch(/55\s?000/)
  })

  it('renders net profit after tax when only income tax configured', () => {
    const tax = createTaxMetrics({
      vat_payer: false,
      net_profit_after_tax: 85000,
      net_profit_after_all_tax: null,
    })

    renderCard({ taxMetrics: tax, payoutTotal: 250000, saleGrossTotal: 200000 })

    expect(screen.getByText(/чистая прибыль/i)).toBeInTheDocument()
    const card = screen.getByRole('article')
    expect(card.textContent).toMatch(/85\s?000/)
  })

  it('renders payout_total with pre-tax indicator when no tax configured', () => {
    renderCard({
      taxMetrics: null,
      payoutTotal: 250000,
      saleGrossTotal: 200000,
    })

    // When taxMetrics is null, getNetProfit() returns label='К перечислению' with
    // isPreTax=true. The component renders "К перечислению (до налога)" — NOT
    // "Чистая прибыль (до налога)". This is intentional honest UX per
    // src/lib/tax-display-helpers.ts — calling pre-tax payout "Чистая прибыль"
    // would be misleading because tax has not been deducted.
    expect(screen.getByText(/к перечислению/i)).toBeInTheDocument()
    // Should display 250,000 formatted value
    const card = screen.getByRole('article')
    expect(card.textContent).toMatch(/250\s?000/)
    // Should indicate pre-tax with "(до налога)" suffix or badge
    expect(card.textContent).toMatch(/до налога/i)
  })

  it('shows after-tax margin percentage', () => {
    const tax = createTaxMetrics({
      vat_payer: false,
      net_profit_after_tax: 85000,
    })

    // margin = (85000 / 200000) * 100 = 42.5%
    renderCard({ taxMetrics: tax, payoutTotal: 250000, saleGrossTotal: 200000 })

    const card = screen.getByRole('article')
    expect(card.textContent).toMatch(/42[,.]5\s?%/)
  })

  it('shows period comparison badge when previous data exists', () => {
    const currentTax = createTaxMetrics({ net_profit_after_tax: 85000 })
    const previousTax = createTaxMetrics({ net_profit_after_tax: 70000 })

    renderCard({
      taxMetrics: currentTax,
      payoutTotal: 250000,
      saleGrossTotal: 200000,
      previousTaxMetrics: previousTax,
      previousPayoutTotal: 220000,
    })

    // Should show comparison badge with percentage change
    expect(screen.getByTestId('comparison-badge')).toBeInTheDocument()
  })

  it('renders loading skeleton when isLoading=true', () => {
    const { container } = renderCard({ isLoading: true })

    // Skeleton indicator
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    // Value should NOT be visible
    expect(screen.queryByText(/чистая прибыль/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/к перечислению/i)).not.toBeInTheDocument()
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  it('renders dash when payoutTotal is null and no tax', () => {
    renderCard({ taxMetrics: null, payoutTotal: null })

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('hides margin when saleGrossTotal is null', () => {
    const tax = createTaxMetrics({ net_profit_after_tax: 85000 })

    renderCard({ taxMetrics: tax, payoutTotal: 250000, saleGrossTotal: null })

    const card = screen.getByRole('article')
    // Should not show any percentage since revenue is unknown
    expect(card.textContent).not.toMatch(/\d+[,.]?\d*\s?%/)
  })

  it('hides comparison when no previous data', () => {
    const tax = createTaxMetrics({ net_profit_after_tax: 85000 })

    renderCard({
      taxMetrics: tax,
      payoutTotal: 250000,
      saleGrossTotal: 200000,
      previousTaxMetrics: null,
      previousPayoutTotal: null,
    })

    expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================

  it('has role="article" with descriptive aria-label', () => {
    const tax = createTaxMetrics({ net_profit_after_tax: 85000 })

    renderCard({ taxMetrics: tax, payoutTotal: 250000, saleGrossTotal: 200000 })

    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('aria-label')
    const label = card.getAttribute('aria-label')
    expect(label).toMatch(/прибыль|перечислению/i)
  })

  it('applies custom className', () => {
    renderCard({ payoutTotal: 250000, className: 'my-custom-class' })

    const card = screen.getByRole('article')
    expect(card).toHaveClass('my-custom-class')
  })
})
