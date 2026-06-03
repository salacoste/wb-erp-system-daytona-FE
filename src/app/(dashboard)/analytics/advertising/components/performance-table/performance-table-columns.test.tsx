/**
 * renderValue — null rate/money fields render "—", not a fabricated 0 (iter-130).
 * The normalizer now preserves null for ctr/conversion_rate/profit_after_ads (was toNum→0,
 * which defeated this renderer's existing null guard). Pins that the guard now fires.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderValue } from './performance-table-columns'
import type { AdvertisingItem } from '@/types/advertising-analytics'

// anti-pattern #4 bridge: renderValue only reads efficiency_status + item[field].
function item(overrides: Partial<AdvertisingItem>): AdvertisingItem {
  return { efficiency_status: 'good', ...overrides } as unknown as AdvertisingItem
}
const fmt = (v: number) => `${v}`

describe('renderValue — null rate/money → "—" (iter-130)', () => {
  it('renders "—" for a null ctr (not "0")', () => {
    render(<>{renderValue(item({ ctr: null }), 'ctr', fmt)}</>)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('renders "—" for a null conversion_rate', () => {
    render(<>{renderValue(item({ conversion_rate: null }), 'conversion_rate', fmt)}</>)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders "—" for a null profit_after_ads', () => {
    render(<>{renderValue(item({ profit_after_ads: null }), 'profit_after_ads', fmt)}</>)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders a real value via the formatter (non-null)', () => {
    render(<>{renderValue(item({ ctr: 5 }), 'ctr', v => `${v}%`)}</>)
    expect(screen.getByText('5%')).toBeInTheDocument()
  })
})
