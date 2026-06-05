/**
 * CrossReferenceTable (iter-129) — a null adRevenue (ad ran, WB returned no revenue) must render
 * "—", NOT a fabricated "0 ₽"; and a null row must sort to the bottom, not pin arbitrarily.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CrossReferenceTable } from '../CrossReferenceTable'
import type { CrossReferenceItem } from '../../utils/cross-reference-utils'

function makeItem(o: Partial<CrossReferenceItem> = {}): CrossReferenceItem {
  return {
    nmId: 1,
    vendorCode: 'VC-1',
    totalOrders: 5,
    uniqueQueries: 3,
    adSpend: 100,
    adClicks: 10,
    adRevenue: 500,
    organicContribution: 25,
    channel: 'both',
    ...o,
  }
}

describe('CrossReferenceTable — null adRevenue', () => {
  it('renders "—" for a null adRevenue cell (unknown), not "0 ₽"', () => {
    // uniqueQueries set + vendorCode set → adRevenue is the only "—" in the row
    render(<CrossReferenceTable items={[makeItem({ adRevenue: null, channel: 'ad' })]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText(/0[  ]₽/)).not.toBeInTheDocument()
  })

  it('renders a real adRevenue as currency', () => {
    render(<CrossReferenceTable items={[makeItem({ adRevenue: 1234 })]} />)
    expect(screen.getByText(t => t.includes('234') && t.includes('₽'))).toBeInTheDocument() // adRevenue 1234 → "1 234 ₽" (NBSP-agnostic match)
  })
})
