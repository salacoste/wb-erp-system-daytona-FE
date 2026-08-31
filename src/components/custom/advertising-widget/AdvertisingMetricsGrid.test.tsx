/**
 * Tests for AdvertisingMetricsGrid — organic-share colour + locale.
 *
 * Regression: the organic value <p> was once a hardcoded legacy green utility, so a
 * negative or low share rendered "healthy", and the value used dot-locale `${v.toFixed(0)}%`.
 * It now uses getOrganicContributionColorClass (error <0, success ≥50, …) + formatPercentageInt
 * (Russian locale), consistent with AdvertisingSummaryCards. Story 174.2: valence tokens.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AdvertisingMetricsGrid } from './AdvertisingMetricsGrid'

interface Summary {
  total_sales?: number | null
  avg_organic_contribution?: number | null
  overall_roas?: number | null
}

function renderGrid(summary: Summary) {
  return render(
    <TooltipProvider>
      <AdvertisingMetricsGrid summary={summary} />
    </TooltipProvider>
  )
}

describe('AdvertisingMetricsGrid — organic contribution', () => {
  it('renders a negative organic share with the error valence (NOT success)', () => {
    renderGrid({ total_sales: 1000, avg_organic_contribution: -40, overall_roas: 2 })
    // \s+ (not \s*) so the regex itself also guards the locale separator: the old
    // dot-locale "-40%" (no NBSP) would NOT match — independent of the classList check.
    const el = screen.getByText(/[-−]40\s+%/)
    expect(el.classList.contains('text-status-error')).toBe(true)
    expect(el.classList.contains('text-status-success')).toBe(false)
  })

  it('renders a healthy positive share with the success valence, Russian locale', () => {
    renderGrid({ total_sales: 1000, avg_organic_contribution: 92.45, overall_roas: 2 })
    const el = screen.getByText(/92\s+%/)
    expect(el.classList.contains('text-status-success')).toBe(true)
  })

  it('renders "—" muted when organic contribution is null', () => {
    renderGrid({ total_sales: 1000, avg_organic_contribution: null, overall_roas: 2 })
    const el = screen.getByText('—')
    expect(el.classList.contains('text-muted-foreground')).toBe(true)
  })

  it('renders ROAS with Russian comma decimal (formatRoas), not dot', () => {
    renderGrid({ total_sales: 1000, avg_organic_contribution: 50, overall_roas: 2.5 })
    expect(screen.getByText('2,5x')).toBeInTheDocument()
    expect(screen.queryByText('2.5x')).not.toBeInTheDocument()
  })
})
