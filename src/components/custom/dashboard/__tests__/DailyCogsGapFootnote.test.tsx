/**
 * Tests for DailyCogsGapFootnote — Story 88.2-FE
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyCogsGapFootnote } from '../DailyCogsGapFootnote'
import type { DailyMetrics } from '@/types/daily-metrics'

function makeDay(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    date: '2026-01-01',
    dayOfWeek: 4,
    orders: 0,
    ordersCount: 0,
    ordersCogs: 0,
    sales: 0,
    salesCogs: 0,
    advertising: 0,
    logistics: 0,
    storage: 0,
    penalties: 0,
    paidAcceptance: 0,
    commission: 0,
    theoreticalProfit: 0,
    ...overrides,
  }
}

describe('DailyCogsGapFootnote — Story 88.2-FE', () => {
  it('renders nothing when all days have numeric COGS', () => {
    const data: DailyMetrics[] = [
      makeDay({ date: '2026-01-01', salesCogs: 100, ordersCogs: 50 }),
      makeDay({ date: '2026-01-02', salesCogs: 0, ordersCogs: 0 }),
    ]
    const { container } = render(<DailyCogsGapFootnote data={data} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders footnote with count when one active day has null salesCogs', () => {
    const data: DailyMetrics[] = [
      // Active day (sales > 0) with null COGS → counted
      makeDay({ date: '2026-01-01', sales: 5000, salesCogs: null, ordersCogs: 50 }),
      makeDay({ date: '2026-01-02', sales: 5000, salesCogs: 100, ordersCogs: 50 }),
    ]
    render(<DailyCogsGapFootnote data={data} />)
    expect(screen.getByText(/COGS неизвестна для 1 дн\./)).toBeInTheDocument()
  })

  it('counts active days where either salesCogs OR ordersCogs is null', () => {
    const data: DailyMetrics[] = [
      makeDay({ date: '2026-01-01', sales: 5000, salesCogs: null, ordersCogs: 50 }),
      makeDay({ date: '2026-01-02', orders: 3000, salesCogs: 100, ordersCogs: null }),
      makeDay({ date: '2026-01-03', sales: 1000, salesCogs: null, ordersCogs: null }),
      makeDay({ date: '2026-01-04', sales: 5000, salesCogs: 100, ordersCogs: 50 }),
    ]
    render(<DailyCogsGapFootnote data={data} />)
    expect(screen.getByText(/COGS неизвестна для 3 дн\./)).toBeInTheDocument()
  })

  it('Story 88.2-FE: excludes zero-activity days from count (not a data gap)', () => {
    const data: DailyMetrics[] = [
      // Idle day: zero sales, zero orders, null COGS → NOT counted
      makeDay({ date: '2026-01-01', sales: 0, orders: 0, salesCogs: null, ordersCogs: null }),
      // Active day with null COGS → counted
      makeDay({ date: '2026-01-02', sales: 5000, salesCogs: null, ordersCogs: 50 }),
    ]
    render(<DailyCogsGapFootnote data={data} />)
    expect(screen.getByText(/COGS неизвестна для 1 дн\./)).toBeInTheDocument()
  })
})
