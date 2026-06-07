/**
 * Tests for FbsFunnelSection — Epic 129-FE Story 129.3
 *
 * Updated to match real backend contract per Request #202.
 * Replaced 4-stage SVG funnel (productViews/cartAdds/orders/deliveries) with
 * 2 conversion metric cards (addToCartPercent/ordersPercent).
 * No SVG rendering, no recharts, no inversion warning — simple metric cards.
 *
 * Pattern 3 fixture wiring: emptyFbsFunnelData() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsFunnelData } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsFunnelSection } from '../FbsFunnelSection'

describe('FbsFunnelSection (Epic 129-FE)', () => {
  it('renders empty state when funnelData is null', () => {
    renderWithProviders(<FbsFunnelSection funnelData={null} />)
    expect(screen.getByText(/Нет данных по воронке/)).toBeInTheDocument()
  })

  it('renders 2 metric cards with null values as em-dash — Pattern 3 fixture wiring', () => {
    renderWithProviders(<FbsFunnelSection funnelData={emptyFbsFunnelData()} />)
    // Two metric labels
    expect(screen.getByText('Конверсия в корзину')).toBeInTheDocument()
    expect(screen.getByText('Конверсия в заказ')).toBeInTheDocument()
    // Both addToCartPercent and ordersPercent are null → 2 em-dashes
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(2)
  })

  it('renders populated conversion metrics as formatted percentages', () => {
    renderWithProviders(
      <FbsFunnelSection
        funnelData={{
          addToCartPercent: 25.0,
          ordersPercent: 5.0,
        }}
      />
    )
    // formatPercentage(25) → "25,0 %" in ru-RU locale
    expect(screen.getByText(/^25,0\s*%/)).toBeInTheDocument()
    expect(screen.getByText(/^5,0\s*%/)).toBeInTheDocument()
  })

  it('renders description text for each metric', () => {
    renderWithProviders(
      <FbsFunnelSection
        funnelData={{
          addToCartPercent: 25.0,
          ordersPercent: 5.0,
        }}
      />
    )
    expect(screen.getByText('Доля добавлений в корзину от просмотров')).toBeInTheDocument()
    expect(screen.getByText('Доля заказов от просмотров')).toBeInTheDocument()
  })

  it('renders one em-dash when only one conversion rate is null (partial data)', () => {
    renderWithProviders(
      <FbsFunnelSection
        funnelData={{
          addToCartPercent: 30.0,
          ordersPercent: null,
        }}
      />
    )
    // addToCartPercent renders as formatted percent, ordersPercent → '—'
    expect(screen.getByText(/30[,.]0\s*%/)).toBeInTheDocument()
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(1) // only ordersPercent is null
  })
})
