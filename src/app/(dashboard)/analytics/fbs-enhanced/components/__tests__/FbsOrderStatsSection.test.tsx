/**
 * Tests for FbsOrderStatsSection — Story 96.13-FE
 *
 * Covers: null-state (section prop null), empty fixture, populated with null ratios → '—'.
 * Pattern 3 fixture wiring: emptyFbsOrderStats() imported from fbs-enhanced-empty.ts.
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { emptyFbsOrderStats } from '@/test/fixtures/fbs-enhanced-empty'
import { FbsOrderStatsSection } from '../FbsOrderStatsSection'

describe('FbsOrderStatsSection (Story 96.13-FE)', () => {
  it('renders empty state when orderStats is null', () => {
    renderWithProviders(<FbsOrderStatsSection orderStats={null} />)
    expect(screen.getByText(/Нет данных по заказам/)).toBeInTheDocument()
  })

  it('renders 5 KPI cards from emptyFbsOrderStats() — Pattern 3 fixture wiring (M-1 fix)', () => {
    renderWithProviders(<FbsOrderStatsSection orderStats={emptyFbsOrderStats()} />)
    // 5 KPI cards: total orders, delivered, returned, buyout rate, return rate
    expect(screen.getByText('Всего заказов')).toBeInTheDocument()
    expect(screen.getByText('Доставлено')).toBeInTheDocument()
    expect(screen.getByText('Возвращено')).toBeInTheDocument()
    expect(screen.getByText('Процент выкупа')).toBeInTheDocument()
    expect(screen.getByText('Процент возвратов')).toBeInTheDocument()
    // null buyoutRate + null returnRate → 2 '—' in KPI cards;
    // averageOrderValue also null → '—' in footnote = 3 total
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3) // buyoutRate card + returnRate card + averageOrderValue footnote
  })

  it('locks end-to-end percent-points contract: input 80 renders as "80,0 %" not "0,8 %" or "8000 %" (H2-1 fix)', () => {
    // Verifies formatPercentage(80) → "80,0 %" end-to-end through the component.
    // Normalizer preserves scale (e.g., buyoutRate: 80.0 means 80%), and formatPercentage
    // does value/100 → Intl percent. This test locks the full display pipeline so a future
    // formatPercentage change breaks here, not silently in production.
    renderWithProviders(
      <FbsOrderStatsSection
        orderStats={{
          totalOrders: 100,
          deliveredOrders: 80,
          returnedOrders: 10,
          buyoutRate: 80,
          returnRate: 10,
          averageOrderValue: null,
        }}
      />
    )
    // "80,0 %" in ru-RU locale — regex covers comma or dot decimal separator
    expect(screen.getByText(/80[,.]0\s*%/)).toBeInTheDocument()
    expect(screen.getByText(/10[,.]0\s*%/)).toBeInTheDocument()
  })

  it('renders null buyoutRate as em-dash (CLAUDE.md anti-pattern #8)', () => {
    renderWithProviders(
      <FbsOrderStatsSection
        orderStats={{
          totalOrders: 100,
          deliveredOrders: 80,
          returnedOrders: 10,
          buyoutRate: null,
          returnRate: null,
          averageOrderValue: null,
        }}
      />
    )
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    // buyoutRate null → '—', returnRate null → '—', averageOrderValue null → '—' in footnote
    // exact count = 3 (H-2 fix: lower-bound hides regressions; M-1 fix: footnote always rendered)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3) // buyoutRate card + returnRate card + averageOrderValue footnote
  })
})
