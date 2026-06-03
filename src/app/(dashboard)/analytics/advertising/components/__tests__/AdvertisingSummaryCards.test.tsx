/**
 * Tests for AdvertisingSummaryCards — Story 88.2-FE null ROAS/ROI display
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdvertisingSummaryCards, getRoiColor, getRoasColor } from '../AdvertisingSummaryCards'
import type { AdvertisingSummary } from '@/types/advertising-analytics'

// iter-84: getRoiColor receives ROI in PERCENT units (e.g. 30 = 30%). Thresholds must be percents
// (green ≥50, yellow ≥20, orange ≥0, red <0). The old fraction thresholds (0.5/0.2) made any
// ROI ≥0.5% green — a 30% ROI green, a 1% ROI green. These cases FAIL on the old thresholds.
describe('getRoiColor — percent-domain thresholds', () => {
  it('colours by percent magnitude, not fraction', () => {
    expect(getRoiColor(75)).toBe('text-green-600') // ≥50%
    expect(getRoiColor(30)).toBe('text-yellow-600') // 20-50% (was green under 0.5 fraction)
    expect(getRoiColor(10)).toBe('text-orange-600') // 0-20% (was green under 0.5 fraction)
    expect(getRoiColor(0)).toBe('text-orange-600')
    expect(getRoiColor(-5)).toBe('text-red-600')
  })
})

// getRoasColor takes a raw MULTIPLIER (not percent) — guard against a future units regression.
describe('getRoasColor — multiplier-domain thresholds', () => {
  it('colours by ROAS multiplier', () => {
    expect(getRoasColor(3.5)).toBe('text-green-600') // ≥3×
    expect(getRoasColor(2.5)).toBe('text-yellow-600') // 2-3×
    expect(getRoasColor(1.5)).toBe('text-orange-600') // 1-2×
    expect(getRoasColor(0.5)).toBe('text-red-600') // <1× loss-making
  })
})

function makeSummary(overrides: Partial<AdvertisingSummary> = {}): AdvertisingSummary {
  return {
    total_spend: 0,
    total_sales: 0,
    total_revenue: 0,
    total_profit: 0,
    overall_roas: 0,
    overall_roi: 0,
    avg_ctr: 0,
    avg_conversion_rate: 0,
    total_organic_sales: 0,
    avg_organic_contribution: 0,
    ...overrides,
  }
}

/**
 * Find the metric card by its label text. Walks up from the label <span> to the
 * nearest card container — matched by `aria-label` on the value `div`, which
 * AdvertisingSummaryCards sets from the card's tooltip text and is stable.
 */
function getCardByLabel(labelText: string): HTMLElement {
  const label = screen.getByText(labelText)
  // Walk up to nearest element containing a value div with aria-label (the card root)
  let node: HTMLElement | null = label.parentElement
  while (node && !node.querySelector('[aria-label]')) {
    node = node.parentElement
  }
  if (!node) throw new Error(`Could not locate card containing "${labelText}"`)
  return node
}

describe('AdvertisingSummaryCards — Story 88.2-FE null ROAS/ROI', () => {
  it('renders "—" and does not crash when overall_roas is null', () => {
    const summary = makeSummary({ overall_roas: null })
    render(<AdvertisingSummaryCards summary={summary} isLoading={false} />)
    const card = getCardByLabel('Общий ROAS')
    expect(card.textContent).toContain('—')
    expect(card.textContent).not.toContain('0.0x')
  })

  it('renders "0.0x" (legitimate zero) when overall_roas is 0 — distinct from null', () => {
    const summary = makeSummary({ overall_roas: 0 })
    render(<AdvertisingSummaryCards summary={summary} isLoading={false} />)
    const card = getCardByLabel('Общий ROAS')
    expect(card.textContent).toContain('0.0x')
  })

  it('renders "2.5x" (non-null number) as baseline', () => {
    const summary = makeSummary({ overall_roas: 2.5 })
    render(<AdvertisingSummaryCards summary={summary} isLoading={false} />)
    const card = getCardByLabel('Общий ROAS')
    expect(card.textContent).toContain('2.5x')
  })

  it('renders "—" and does not crash when overall_roi is null', () => {
    const summary = makeSummary({ overall_roi: null })
    render(<AdvertisingSummaryCards summary={summary} isLoading={false} />)
    const card = getCardByLabel('Общий ROI')
    expect(card.textContent).toContain('—')
  })
})
