import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SearchByQueryTable } from '../SearchByQueryTable'
import type { SearchProductItem } from '@/types/search-analytics'

// 170.7 (pattern #226/#236): unknown avgPosition must NOT masquerade as
// BEST-tier green badge 0 — render neutral «—» without badge, sort nulls LAST.
const mk = (nmId: number, avgPosition: number | null): SearchProductItem => ({
  nmId,
  vendorCode: null,
  avgPosition,
  totalImpressions: 10,
  totalClicks: 2,
  avgCtr: 5,
  totalOrders: 1,
  searchCartAdds: 1, // non-null so cart-conversion renders a number, keeping «—» unique to avgPosition
})

describe('SearchByQueryTable null avgPosition (170.7)', () => {
  it('renders «—» with NO badge for null avgPosition', () => {
    render(<SearchByQueryTable products={[mk(1, null)]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    // no green best-tier badge span (badge class only applies to non-null positions)
    expect(document.querySelector('.bg-green-100')).toBeNull()
  })

  it('sorts null avgPosition LAST in default asc order', () => {
    render(<SearchByQueryTable products={[mk(1, null), mk(2, 5), mk(3, 1.2)]} />)
    const rows = screen.getAllByRole('row')
    const cells = rows.map(r => r.textContent ?? '')
    const idxNull = cells.findIndex(c => c.includes('—'))
    const idxBest = cells.findIndex(c => c.includes('1,2'))
    expect(idxBest).toBeGreaterThan(0)
    expect(idxNull).toBe(cells.length - 1) // header + 3 rows; null row last
  })
})
