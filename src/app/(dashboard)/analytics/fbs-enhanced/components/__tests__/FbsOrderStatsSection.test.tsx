/**
 * Tests for FbsOrderStatsSection — Epic 129-FE Story 129.3
 *
 * Updated to match real backend contract per Request #202.
 * Fields renamed: totalOrders→ordersCount, deliveredOrders→buyoutCount,
 * returnedOrders→cancelCount, returnRate→cancelRate, averageOrderValue→avgOrderValue.
 * New fields: ordersSumRub, addToCartPercent, ordersPercent.
 *
 * Covers: null-state (section prop null), empty fixture, populated with null ratios → '—'.
 * Pattern 3 fixture wiring: emptyFbsOrderStats() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsOrderStats } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsOrderStatsSection } from '../FbsOrderStatsSection'

describe('FbsOrderStatsSection (Epic 129-FE)', () => {
  it('renders empty state when orderStats is null', () => {
    renderWithProviders(<FbsOrderStatsSection orderStats={null} />)
    expect(screen.getByText(/Нет данных по заказам/)).toBeInTheDocument()
  })

  it('renders KPI cards from emptyFbsOrderStats() — Pattern 3 fixture wiring', () => {
    renderWithProviders(<FbsOrderStatsSection orderStats={emptyFbsOrderStats()} />)
    // KPI cards: orders count, sum, delivered, cancelled, buyout rate, cancel rate
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    expect(screen.getByText('Сумма заказов')).toBeInTheDocument()
    expect(screen.getByText('Доставлено')).toBeInTheDocument()
    expect(screen.getByText('Отменено')).toBeInTheDocument()
    expect(screen.getByText('Процент выкупа')).toBeInTheDocument()
    expect(screen.getByText('Процент отмен')).toBeInTheDocument()
    // null buyoutRate + null cancelRate → 2 '—' in KPI cards;
    // null ordersSumRub → 1 '—'; null avgOrderValue → '—' in footnote = 4 total
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4) // ordersSumRub + buyoutRate + cancelRate + avgOrderValue
  })

  it('locks end-to-end percent-points contract: input 80 renders as "80,0 %" not "0,8 %" or "8000 %"', () => {
    // Verifies formatPercentage(80) → "80,0 %" end-to-end through the component.
    // Normalizer preserves scale (e.g., buyoutRate: 80.0 means 80%), and formatPercentage
    // does value/100 → Intl percent.
    renderWithProviders(
      <FbsOrderStatsSection
        orderStats={{
          ordersCount: 100,
          ordersSumRub: 150000,
          cancelCount: 10,
          cancelRate: 10,
          buyoutCount: 80,
          buyoutRate: 80,
          avgOrderValue: 1500,
          addToCartPercent: 25,
          ordersPercent: 5,
        }}
      />
    )
    // "80,0 %" in ru-RU locale — regex covers comma or dot decimal separator
    expect(screen.getByText(/80[,.]0\s*%/)).toBeInTheDocument()
    expect(screen.getByText(/10[,.]0\s*%/)).toBeInTheDocument()
  })

  it('renders null buyoutRate/cancelRate/ordersSumRub/avgOrderValue as em-dash (anti-pattern #8)', () => {
    renderWithProviders(
      <FbsOrderStatsSection
        orderStats={{
          ordersCount: 100,
          ordersSumRub: null,
          cancelCount: 10,
          cancelRate: null,
          buyoutCount: 80,
          buyoutRate: null,
          avgOrderValue: null,
          addToCartPercent: null,
          ordersPercent: null,
        }}
      />
    )
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    // ordersSumRub null → '—', buyoutRate null → '—', cancelRate null → '—',
    // avgOrderValue null → '—' in footnote = 4 total
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(4)
  })

  it('renders populated ordersSumRub as formatted currency', () => {
    renderWithProviders(
      <FbsOrderStatsSection
        orderStats={{
          ordersCount: 100,
          ordersSumRub: 150000,
          cancelCount: 10,
          cancelRate: 10,
          buyoutCount: 80,
          buyoutRate: 80,
          avgOrderValue: 1500,
          addToCartPercent: 25,
          ordersPercent: 5,
        }}
      />
    )
    // ordersSumRub rendered as Russian-locale currency — regex for formatted number
    expect(screen.getByText(/150\s*000/)).toBeInTheDocument()
  })

  it('renders populated avgOrderValue as formatted currency in footnote', () => {
    renderWithProviders(
      <FbsOrderStatsSection
        orderStats={{
          ordersCount: 100,
          ordersSumRub: 150000,
          cancelCount: 10,
          cancelRate: 10,
          buyoutCount: 80,
          buyoutRate: 80,
          avgOrderValue: 1500,
          addToCartPercent: 25,
          ordersPercent: 5,
        }}
      />
    )
    // avgOrderValue in footnote — "Средний чек: 1 500,00 ₽" (regex for formatted number)
    expect(screen.getByText(/1\s*500/)).toBeInTheDocument()
  })
})
