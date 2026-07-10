import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarginMissingCogsBanner, sumMissingCogs } from '../MarginMissingCogsBanner'
import type { MarginAnalyticsAggregated } from '@/types/cogs/products'

const row = (over: Partial<MarginAnalyticsAggregated> = {}): MarginAnalyticsAggregated => ({
  revenue_net: 1000,
  qty: 10,
  ...over,
})

describe('sumMissingCogs (BD-5 CTA count)', () => {
  it('returns 0 for empty / undefined', () => {
    expect(sumMissingCogs([])).toBe(0)
  })

  it('returns 0 when every entity has COGS', () => {
    expect(sumMissingCogs([row({ cogs: 500, total_skus: 3 }), row({ cogs: 100 })])).toBe(0)
  })

  it('falls back to total_skus when cogs===0 and missing_cogs_count absent (validation payload)', () => {
    // Raw W26 response has cogs:0, total_skus set, NO missing_cogs_count.
    const items = [row({ cogs: 0, total_skus: 5 }), row({ cogs: 0, total_skus: 7 })]
    expect(sumMissingCogs(items)).toBe(12)
  })

  it('uses missing_cogs_count when present (partial-COGS entity)', () => {
    const items = [row({ cogs: 500, total_skus: 10, missing_cogs_count: 3 })]
    expect(sumMissingCogs(items)).toBe(3)
  })

  it('prefers missing_cogs_count over the cogs===0 fallback', () => {
    // cogs===0 would contribute total_skus(8), but explicit count(2) wins.
    const items = [row({ cogs: 0, total_skus: 8, missing_cogs_count: 2 })]
    expect(sumMissingCogs(items)).toBe(2)
  })

  it('handles a mixed period (some with COGS, some without)', () => {
    const items = [
      row({ cogs: 500, total_skus: 4 }), // has COGS → 0
      row({ cogs: 0, total_skus: 6 }), // degenerate → 6
      row({ cogs: 0, total_skus: 9, missing_cogs_count: 4 }), // explicit → 4
    ]
    expect(sumMissingCogs(items)).toBe(10)
  })
})

describe('MarginMissingCogsBanner (BD-5 CTA render)', () => {
  it('renders nothing when all entities have COGS', () => {
    const { container } = render(
      <MarginMissingCogsBanner data={[row({ cogs: 500, total_skus: 3 })]} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the «Назначить COGS» CTA banner when COGS is absent', () => {
    render(<MarginMissingCogsBanner data={[row({ cogs: 0, total_skus: 5 })]} />)
    // MissingCogsAlert renders role="alert" + the canonical CTA link.
    expect(screen.getByRole('alert')).toBeInTheDocument()
    const cta = screen.getByRole('link', { name: /Назначить COGS/i })
    expect(cta).toHaveAttribute('href', '/cogs?has_cogs=false')
  })

  it('renders nothing for undefined data', () => {
    const { container } = render(<MarginMissingCogsBanner data={undefined} />)
    expect(container).toBeEmptyDOMElement()
  })
})
