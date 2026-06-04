/**
 * Regression tests for SalesFunnelSection (Воронка продаж).
 *
 * Guards the data-completeness fix (2026-06-04): the funnel card was HIDDEN on the default
 * `summary_total` view because the component read the ghost field `retail_price_total_total`
 * (which the backend never sends) instead of `retail_price_total_combined` (the field the backend
 * actually emits at summary_total scope — `finance-mapping.service.ts:271`, verified vs source).
 *
 * The component had ZERO coverage before this file, which is why the bug shipped undetected.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SalesFunnelSection } from '../SalesFunnelSection'
import type { FinanceSummary } from '@/hooks/useDashboard'

const FUNNEL_TITLE = /Воронка продаж/

/** A summary shaped like the backend's `summary_total` scope (combined RUS+EAEU, the default view). */
function summaryTotalShape(overrides: Partial<FinanceSummary> = {}): FinanceSummary {
  return {
    week: '2025-W01',
    retail_price_total_combined: 1_000_000,
    sales_gross_total: 800_000,
    sale_gross_total: 760_000,
    payout_total: 600_000,
    returns_gross_total: 40_000,
    gross_profit: null,
    ...overrides,
  } as FinanceSummary
}

describe('SalesFunnelSection — retail-price source resolution', () => {
  it('renders the funnel on the default summary_total view (reads retail_price_total_combined)', () => {
    // THE regression: combined is the only retail source present, mirroring summary_total scope.
    render(<SalesFunnelSection summary={summaryTotalShape()} isComparison={false} />)

    expect(screen.getByText(FUNNEL_TITLE)).toBeInTheDocument()
    // РРЦ (top funnel level) renders — i.e. the card is NOT the hidden/null path.
    expect(screen.getByText('РРЦ (каталог)')).toBeInTheDocument()
  })

  it('still renders on a per-region view (retail_price_total, summary_rus/eaeu shape)', () => {
    const perRegion = summaryTotalShape({ retail_price_total_combined: undefined })
    ;(perRegion as FinanceSummary).retail_price_total = 500_000

    render(<SalesFunnelSection summary={perRegion} isComparison={false} />)
    expect(screen.getByText(FUNNEL_TITLE)).toBeInTheDocument()
  })

  it('hides the card when no retail-price base is present (guard returns null)', () => {
    const noRetail = summaryTotalShape({ retail_price_total_combined: undefined })
    const { container } = render(<SalesFunnelSection summary={noRetail} isComparison={false} />)

    expect(screen.queryByText(FUNNEL_TITLE)).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('reads combined VALUE in preference to the ghost retail_price_total_total field', () => {
    // Both present with distinct values — assert the rendered РРЦ uses combined (1 000 000), NOT
    // the ghost (999). Without the value check the case would pass even if the code preferred ghost.
    const withGhost = summaryTotalShape({ retail_price_total_combined: 1_000_000 })
    ;(withGhost as FinanceSummary).retail_price_total_total = 999
    render(<SalesFunnelSection summary={withGhost} isComparison={false} />)

    expect(screen.getByText(FUNNEL_TITLE)).toBeInTheDocument()
    // 1 000 000 ₽ rendered with Russian NBSP grouping; the ghost value 999 must NOT appear.
    expect(screen.getByText(/1\s*000\s*000/)).toBeInTheDocument()
    expect(screen.queryByText(/(^|[^0-9])999([^0-9]|$)/)).not.toBeInTheDocument()
  })
})

describe('SalesFunnelSection — COGS null handling (anti-pattern #8)', () => {
  it('renders "—" for COGS when cogs_total is null (must NOT fabricate 0,00 ₽)', () => {
    // FunnelProfitLevel renders when gross_profit is non-null; cogs_total is computed
    // independently and may be null. The COGS line must show "—", never a false 0,00 ₽.
    const withNullCogs = summaryTotalShape({ gross_profit: 16_400, cogs_total: null })
    render(<SalesFunnelSection summary={withNullCogs} isComparison={false} />)

    // The profit level rendered, so the COGS line is present. Its currency slot must be the
    // em-dash "—" (formatCurrency(null)), NOT a fabricated number — no digit follows the label.
    const cogsLine = screen.getByText(/Себестоимость \(COGS\)/)
    expect(cogsLine).toHaveTextContent('—') // — null sentinel
    expect(cogsLine.textContent).not.toMatch(/\d/) // never a fabricated 0,00 ₽
  })
})
