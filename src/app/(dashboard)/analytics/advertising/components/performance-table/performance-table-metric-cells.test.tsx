/**
 * Tests for renderOrganicContribution (performance-table metric cell).
 *
 * Focus: WB re-attribution can drive organic_contribution <0% (a real value, not
 * no-data — see AdvertisingSummaryCards tooltip + useAdvertisingAnalytics.test.ts:506
 * "Negative % is valid"). The prior `< 0 ? '—'` branch masked that real negative,
 * inconsistent with the summary card. It must now render the value in red (mirroring
 * renderROI), not a dash (Defensive Frontend: indicate, don't hide).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderOrganicContribution } from './performance-table-metric-cells'
import type { AdvertisingItem } from '@/types/advertising-analytics'

// Subset of AdvertisingItem that renderOrganicContribution actually reads (anti-pattern #4
// bridge): typed literal so a mistyped override key is caught, then `as unknown as` to the
// full type. If the renderer ever reads a new field, extend this interface.
interface OrganicContribCell {
  organic_contribution: number | null
  organic_sales: number
  total_sales: number
}

function item(overrides: Partial<OrganicContribCell>): AdvertisingItem {
  const cell: OrganicContribCell = {
    organic_contribution: 0,
    organic_sales: 0,
    total_sales: 0,
    ...overrides,
  }
  return cell as unknown as AdvertisingItem
}

describe('renderOrganicContribution', () => {
  it('renders a negative contribution in red (not masked as "—")', () => {
    render(renderOrganicContribution(item({ organic_contribution: -40, total_sales: 250 })))
    const el = screen.getByText(/[-−]40,00\s*%/)
    expect(el.classList.contains('text-destructive')).toBe(true) // Story 170.1 token pin
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('renders a positive contribution without red styling', () => {
    render(renderOrganicContribution(item({ organic_contribution: 91.35, total_sales: 1000 })))
    const el = screen.getByText(/91,35\s*%/)
    expect(el.classList.contains('text-destructive')).toBe(false)
  })

  it('renders zero as "0,00 %" (real value, not masked)', () => {
    render(renderOrganicContribution(item({ organic_contribution: 0 })))
    expect(screen.getByText(/0,00\s*%/)).toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('renders "—" only when the value is genuinely null/undefined', () => {
    render(renderOrganicContribution(item({ organic_contribution: null })))
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
