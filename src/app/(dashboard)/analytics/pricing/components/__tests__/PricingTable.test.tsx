/**
 * Tests for PricingTable (SPP-1.7-FE additions)
 * Basis badge in the current-price cell + alternative-basis companion price.
 */

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, renderWithProviders, screen } from '@/test/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { PricingTable } from '../PricingTable'
import { emptyPriceRecommendation } from '@/test/fixtures/price-recommendations-empty'
import type { PriceRecommendation } from '@/types/price-recommendations'

function item(overrides: Partial<PriceRecommendation> = {}): PriceRecommendation {
  return emptyPriceRecommendation({
    id: 'r-1',
    nmId: 123,
    vendorCode: 'SKU-001',
    productName: 'Товар',
    lastPrice: 1500,
    ...overrides,
  })
}

describe('PricingTable — SPP-1.7 basis badge', () => {
  it('exposes a named keyboard-focusable horizontal scroll region', () => {
    renderWithProviders(<PricingTable items={[item()]} isLoading={false} />)

    const region = screen.getByRole('region', { name: 'Рекомендации по ценам' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('table', { name: 'Рекомендации по ценам' })).toBeInTheDocument()
  })

  it('opens the exact SKU recommendation from its focused action button with Enter', async () => {
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    renderWithProviders(
      <PricingTable
        items={[item({ nmId: 123 }), item({ id: 'r-2', nmId: 456 })]}
        isLoading={false}
        onRowClick={onRowClick}
      />
    )

    const action = screen.getByRole('button', { name: 'Открыть рекомендации для SKU 456' })
    const row = action.closest('tr')
    expect(row).not.toBeNull()
    expect(row).toHaveRole('row')
    expect(row).not.toHaveAttribute('role')
    expect(row).not.toHaveAttribute('tabindex')
    expect(row?.querySelectorAll('td')).toHaveLength(8)
    action.focus()
    expect(action).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(456)
  })

  it('keeps pointer row activation as a single convenience action', () => {
    const onRowClick = vi.fn()
    renderWithProviders(
      <PricingTable items={[item({ nmId: 456 })]} isLoading={false} onRowClick={onRowClick} />
    )

    fireEvent.click(screen.getByRole('cell', { name: 'Товар' }))
    expect(onRowClick).toHaveBeenCalledOnce()
    expect(onRowClick).toHaveBeenCalledWith(456)
  })

  it('keeps the elasticity table in one named keyboard-focusable scroll region', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/(dashboard)/analytics/pricing/components/ElasticitySection.tsx'),
      'utf8'
    )

    expect(source).toMatch(/scrollContainerTabIndex=\{0\}/)
    expect(source).toMatch(/scrollContainerAriaLabel="Эластичность цен по товарам"/)
    expect(source).toMatch(/<TableCaption className="sr-only">Эластичность цен по товарам/)
    expect(source).not.toMatch(/className="rounded-md border overflow-x-auto"/)
  })

  it('renders the seller basis badge next to the current price', () => {
    renderWithProviders(<PricingTable items={[item()]} isLoading={false} />)
    expect(screen.getByText('Продавец')).toBeInTheDocument()
  })

  it('renders the storefront badge for STOREFRONT_ANON rows', () => {
    renderWithProviders(
      <PricingTable items={[item({ priceBasis: 'STOREFRONT_ANON' })]} isLoading={false} />
    )
    expect(screen.getByText('Витрина')).toBeInTheDocument()
  })

  it('renders the stale variant when STOREFRONT_STALE flag is present', () => {
    renderWithProviders(
      <PricingTable
        items={[
          item({
            priceBasis: 'STOREFRONT_ANON',
            validationFlags: ['STOREFRONT_STALE'],
          }),
        ]}
        isLoading={false}
      />
    )
    expect(screen.getByText('Витрина · устарела')).toBeInTheDocument()
  })

  it('renders the seller companion price when alternativeBasisPrice is non-null', () => {
    renderWithProviders(
      <PricingTable
        items={[item({ priceBasis: 'STOREFRONT_ANON', alternativeBasisPrice: 1487.5 })]}
        isLoading={false}
      />
    )
    expect(screen.getByText(/продав:/)).toBeInTheDocument()
    // Locale-safe currency assertion (NBS + ₽), not an exact formatted string.
    expect(screen.getByText(/продав:/).textContent).toMatch(/1[\s\u00A0]?487,5[\s\u00A0]?₽/)
  })

  it('does NOT render the companion price when alternativeBasisPrice is null (batch rows)', () => {
    renderWithProviders(<PricingTable items={[item()]} isLoading={false} />)
    expect(screen.queryByText(/продав:/)).not.toBeInTheDocument()
  })

  it("preserves '—' for the current price when lastPrice is null (AP#8)", () => {
    renderWithProviders(
      <PricingTable
        items={[item({ lastPrice: null, priceBasis: 'STOREFRONT_ANON' })]}
        isLoading={false}
      />
    )
    // Badge still renders; the price itself is '—' inside the same cell.
    const cell = screen.getByText('Витрина').closest('td')
    expect(cell).not.toBeNull()
    expect(cell?.textContent).toContain('—')
  })
})

describe('PricingTable — 168.6 semantic tokens', () => {
  // Exact classList pins (never [class*=] — defect-pattern #19 false-pass).
  const legacyPaletteRegex =
    /(bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?/

  function marginCellFor(pct: number) {
    // Single margin source: recommendedPct is null → only one MarginCell has a value span.
    renderWithProviders(
      <PricingTable
        items={[item({ marginAtCurrentPct: pct, marginAtRecommendedPct: null })]}
        isLoading={false}
      />
    )
    const spans = Array.from(document.querySelectorAll('span')).filter(s =>
      new RegExp(`${pct}([.,]\\d)?[\\s\\u00A0]?%`).test(s.textContent ?? '')
    )
    expect(spans.length).toBe(1)
    return spans[0]
  }

  it('MarginCell pins financial-positive for value >= 15 (exact class)', () => {
    const span = marginCellFor(20)
    expect(span.classList.contains('text-financial-positive')).toBe(true)
    expect(span.classList.contains('text-status-warning/80')).toBe(false)
    expect(span.classList.contains('text-financial-negative')).toBe(false)
  })

  it('MarginCell uses the AA foreground for 0 <= value < 15 while preserving the 3-tier threshold', () => {
    const span = marginCellFor(10)
    expect(span.classList.contains('text-foreground')).toBe(true)
    expect(span.classList.contains('text-status-warning/80')).toBe(false)
    expect(span.classList.contains('text-financial-positive')).toBe(false)
    expect(span.classList.contains('text-financial-negative')).toBe(false)
  })

  it('MarginCell pins financial-negative for value < 0 (exact class)', () => {
    const span = marginCellFor(-5)
    expect(span.classList.contains('text-financial-negative')).toBe(true)
    expect(span.classList.contains('text-status-warning/80')).toBe(false)
    expect(span.classList.contains('text-financial-positive')).toBe(false)
  })

  it('GapCell pins financial-positive for gap >= 0 (exact class)', () => {
    renderWithProviders(<PricingTable items={[item({ gap: 50, gapPct: 5 })]} isLoading={false} />)
    const span = Array.from(document.querySelectorAll('span')).find(s =>
      s.classList.contains('text-financial-positive')
    )
    expect(span).toBeDefined()
    expect(span!.classList.contains('font-medium')).toBe(true)
    expect(span!.classList.contains('text-financial-negative')).toBe(false)
  })

  it('GapCell pins financial-negative for gap < 0 (exact class)', () => {
    renderWithProviders(<PricingTable items={[item({ gap: -30, gapPct: -4 })]} isLoading={false} />)
    const span = Array.from(document.querySelectorAll('span')).find(s =>
      s.classList.contains('text-financial-negative')
    )
    expect(span).toBeDefined()
    expect(span!.classList.contains('font-medium')).toBe(true)
    expect(span!.classList.contains('text-financial-positive')).toBe(false)
  })

  it('renders no legacy palette classes in table rows (168.6 sweep guard)', () => {
    const { container } = renderWithProviders(
      <PricingTable
        items={[
          item({ gap: -10, gapPct: -2, marginAtCurrentPct: 20, marginAtRecommendedPct: -5 }),
          item({ gap: 5, gapPct: 1, marginAtCurrentPct: 3, marginAtRecommendedPct: 25 }),
        ]}
        isLoading={false}
      />
    )
    // Guard covers this story's surface (gap/margin cells + row markup).
    // Shared PriceBasisBadge legitimately keeps legacy grays — out of 168.6 scope.
    const rows = container.querySelectorAll('tbody tr')
    rows.forEach(row => {
      const owned = Array.from(row.querySelectorAll('span')).filter(s => !s.closest('[aria-label]'))
      owned.forEach(s => expect(s.className).not.toMatch(legacyPaletteRegex))
      Array.from(row.querySelectorAll('td')).forEach(td =>
        expect(td.className).not.toMatch(legacyPaletteRegex)
      )
    })
    expect(rows.length).toBe(2)
  })
})
