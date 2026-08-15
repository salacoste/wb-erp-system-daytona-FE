/**
 * Tests for PricingTable (SPP-1.7-FE additions)
 * Basis badge in the current-price cell + alternative-basis companion price.
 */

import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test/utils/test-utils'
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
