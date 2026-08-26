import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    // 170.7: unknown position renders NO badge at all (not even neutral) — preface pin preserved.
    expect(document.querySelector('[class*="bg-status-success/15"], [class*="bg-status-warning/15"], [class*="bg-status-error/15"]')).toBeNull()
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

  it('preface F3: nulls sort LAST in DESC too (unknown never masquerades via sort)', async () => {
    render(<SearchByQueryTable products={[mk(1, null), mk(2, 5), mk(3, 1.2)]} />)
    // Default sort = avgPosition asc. Click the avgPosition sort header to flip to desc.
    await userEvent.click(screen.getByRole('button', { name: /по возрастанию|ascending/i }))
    const cells = screen.getAllByRole('row').map(r => r.textContent ?? '')
    const idxFive = cells.findIndex(c => c.includes('5,0'))
    const idxBest = cells.findIndex(c => c.includes('1,2'))
    const idxNull = cells.findIndex(c => c.includes('—'))
    // DESC: 5,0 first among data rows, 1,2 second — explicit ordinals (review F4)
    expect(idxFive).toBeGreaterThan(0)
    expect(idxBest).toBeGreaterThan(idxFive)
    // nulls LAST even in desc — unknown never masquerades as a position via sort
    expect(idxNull).toBe(cells.length - 1)
  })
})