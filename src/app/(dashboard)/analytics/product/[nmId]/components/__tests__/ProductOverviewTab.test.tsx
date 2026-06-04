/**
 * Tests for ProductOverviewTab — data-driven overview KPI grid (Story 120.6-FE).
 *
 * Renders the /unified response summary + funnel/advertising totals as KPI cards.
 * Uses regex assertions for Russian locale formatting (comma + NBSP + %).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductOverviewTab } from '../ProductOverviewTab'
import { emptyUnifiedProductData } from '@/test/fixtures/unified-product-empty'

describe('ProductOverviewTab', () => {
  it('renders traffic split KPIs with formatted values', () => {
    const data = emptyUnifiedProductData({
      summary: { organicTrafficShare: 64.0, adTrafficShare: 36.0, blendedConversion: 5.0 },
      advertising: {
        ...emptyUnifiedProductData().advertising,
        totals: { views: 1800, clicks: 180, orders: 60, spend: 9000, avgCtr: 10, avgCpc: 50 },
      },
      organic: {
        ...emptyUnifiedProductData().organic,
        totals: { organicViews: 3200, organicOrders: 190 },
      },
    })

    render(<ProductOverviewTab data={data} />)

    expect(screen.getByText('Органический трафик')).toBeInTheDocument()
    expect(screen.getByText('Рекламный трафик')).toBeInTheDocument()
    expect(screen.getByText('Смешанная конверсия')).toBeInTheDocument()
    expect(screen.getByText('Рекламные расходы')).toBeInTheDocument()

    // Russian locale: "9 000 ₽" (formatCurrency)
    expect(screen.getByText(/9\s*000/)).toBeInTheDocument()
  })

  it('renders funnel summary row', () => {
    const data = emptyUnifiedProductData({
      funnel: {
        dates: [],
        totals: {
          openCardCount: 5000,
          addToCartCount: 1000,
          ordersCount: 250,
          buyoutCount: 225,
          cancelCount: 25,
          avgCartConversion: null,
          avgOrderConversion: null,
          avgBuyoutConversion: null,
        },
      },
    })

    render(<ProductOverviewTab data={data} />)

    expect(screen.getByText('Открытия карт')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выкупы')).toBeInTheDocument()
  })

  it('renders with all-zero data without crashing', () => {
    const data = emptyUnifiedProductData()
    render(<ProductOverviewTab data={data} />)

    // All KPI titles present
    expect(screen.getByText('Органический трафик')).toBeInTheDocument()
    expect(screen.getByText('Открытия карт')).toBeInTheDocument()
  })
})
