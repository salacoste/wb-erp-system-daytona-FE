import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PricingSummaryCards } from '../PricingSummaryCards'
import type { PriceRecommendation } from '@/types/price-recommendations'

const mockItems: PriceRecommendation[] = [
  {
    id: '1',
    nmId: 111,
    vendorCode: 'SKU-001',
    productName: 'Product A',
    lastPrice: 500,
    breakEvenPrice: 300,
    recommendedPrice: 550,
    marginAtCurrentPct: 25.0,
    marginAtRecommendedPct: 35.0,
    gap: -10,
    gapPct: -2.5,
    targetMarginPct: 30,
    computedAt: '2026-06-01T00:00:00Z',
    priceBasis: 'SELLER',
    validationFlags: [],
    alternativeBasisPrice: null,
  },
  {
    id: '2',
    nmId: 222,
    vendorCode: 'SKU-002',
    productName: 'Product B',
    lastPrice: 800,
    breakEvenPrice: 400,
    recommendedPrice: 750,
    marginAtCurrentPct: 40.0,
    marginAtRecommendedPct: 38.0,
    gap: 5,
    gapPct: 1.2,
    targetMarginPct: 30,
    computedAt: '2026-06-01T00:00:00Z',
    priceBasis: 'SELLER',
    validationFlags: [],
    alternativeBasisPrice: null,
  },
  {
    id: '3',
    nmId: 333,
    vendorCode: 'SKU-003',
    productName: 'Product C',
    lastPrice: 200,
    breakEvenPrice: 150,
    recommendedPrice: 220,
    marginAtCurrentPct: 20.0,
    marginAtRecommendedPct: 28.0,
    gap: -8,
    gapPct: -3.0,
    targetMarginPct: 30,
    computedAt: '2026-06-01T00:00:00Z',
    priceBasis: 'SELLER',
    validationFlags: [],
    alternativeBasisPrice: null,
  },
]

describe('PricingSummaryCards', () => {
  it('shows loading skeletons', () => {
    const { container } = render(<PricingSummaryCards items={[]} isLoading={true} />)
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders all four summary cards with data', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    expect(screen.getByText('Всего SKU')).toBeInTheDocument()
    expect(screen.getByText('Средний разрыв')).toBeInTheDocument()
    expect(screen.getByText('Ниже цели')).toBeInTheDocument()
    expect(screen.getByText('Выше цели')).toBeInTheDocument()
  })

  it('shows total SKU count', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('counts below-target SKUs (gap < 0)', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    // SKU-001 and SKU-003 have gap < 0
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('counts above-target SKUs (gap >= 0)', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    // SKU-002 has gap >= 0 — value "1" appears in "Выше цели" card
  })

  it('returns null when items is empty', () => {
    const { container } = render(<PricingSummaryCards items={[]} isLoading={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows description subtitles', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    expect(screen.getByText('с рекомендациями')).toBeInTheDocument()
    expect(screen.getByText('от целевой маржи')).toBeInTheDocument()
  })

  it('renders "—" for avg gap when no SKU has a gapPct — BD-37', () => {
    const noGaps = mockItems.map(i => ({ ...i, gapPct: null }))
    render(<PricingSummaryCards items={noGaps} isLoading={false} />)
    // "Средний разрыв" value is "—", not a fabricated "0 %".
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('PricingSummaryCards — 168.6 semantic tokens', () => {
  const legacyPaletteRegex =
    /(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?/

  /** Value element of the card whose title matches: title span → title div → next sibling (bold value div). */
  function cardValueElement(title: string): HTMLElement {
    const titleDiv = screen.getByText(title).parentElement
    expect(titleDiv).not.toBeNull()
    const valueEl = titleDiv!.nextElementSibling as HTMLElement | null
    expect(valueEl).not.toBeNull()
    expect(valueEl!.className).toContain('font-bold')
    return valueEl!
  }

  it('pins exact financial-negative on the "Ниже цели" card value (168.6)', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    const valueEl = cardValueElement('Ниже цели')
    expect(valueEl.classList.contains('text-financial-negative')).toBe(true)
    expect(valueEl.classList.contains('text-red-600')).toBe(false)
  })

  it('pins exact financial-positive on the "Выше цели" card value (168.6)', () => {
    render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    const valueEl = cardValueElement('Выше цели')
    expect(valueEl.classList.contains('text-financial-positive')).toBe(true)
    expect(valueEl.classList.contains('text-green-600')).toBe(false)
  })

  it('renders no legacy palette classes anywhere in the cards DOM (168.6 sweep guard)', () => {
    const { container } = render(<PricingSummaryCards items={mockItems} isLoading={false} />)
    expect(container.innerHTML).not.toMatch(legacyPaletteRegex)
  })
})
