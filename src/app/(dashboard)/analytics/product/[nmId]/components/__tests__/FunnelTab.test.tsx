/**
 * FunnelTab unit tests (Story 122.1-FE).
 * Verifies KPI rendering with data, AP#8 null handling, chart presence, and empty state.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FunnelTab } from '../FunnelTab'
import type { FunnelDayItem, FunnelTotals } from '@/types/unified-product'

const mockTotals: FunnelTotals = {
  openCardCount: 1000,
  addToCartCount: 200,
  ordersCount: 80,
  buyoutCount: 60,
  cancelCount: 15,
  avgCartConversion: 20,
  avgOrderConversion: 8,
  avgBuyoutConversion: 6,
}

const mockTotalsWithNulls: FunnelTotals = {
  openCardCount: 0,
  addToCartCount: 0,
  ordersCount: 0,
  buyoutCount: 0,
  cancelCount: 0,
  avgCartConversion: null,
  avgOrderConversion: null,
  avgBuyoutConversion: null,
}

const mockDates: FunnelDayItem[] = [
  {
    date: '2026-05-26',
    openCardCount: 500,
    addToCartCount: 100,
    ordersCount: 40,
    buyoutCount: 30,
    cancelCount: 8,
    cartConversion: 20,
    orderConversion: 8,
    buyoutConversion: 6,
    cancelRate: 2,
    totalConversion: 6,
  },
  {
    date: '2026-05-27',
    openCardCount: 500,
    addToCartCount: 100,
    ordersCount: 40,
    buyoutCount: 30,
    cancelCount: 7,
    cartConversion: null,
    orderConversion: null,
    buyoutConversion: null,
    cancelRate: null,
    totalConversion: null,
  },
]

describe('FunnelTab', () => {
  it('renders all 8 KPI cards with data', () => {
    render(<FunnelTab dates={mockDates} totals={mockTotals} />)

    expect(screen.getByText('Просмотры')).toBeInTheDocument()
    expect(screen.getByText('Добавления в корзину')).toBeInTheDocument()
    expect(screen.getByText('Заказы')).toBeInTheDocument()
    expect(screen.getByText('Выкупы')).toBeInTheDocument()
    expect(screen.getByText('Отмены')).toBeInTheDocument()
    expect(screen.getByText('Конверсия в корзину')).toBeInTheDocument()
    expect(screen.getByText('Конверсия в заказ')).toBeInTheDocument()
    expect(screen.getByText('Сквозная конверсия')).toBeInTheDocument()
  })

  it('renders formatted count values in KPI cards', () => {
    render(<FunnelTab dates={mockDates} totals={mockTotals} />)

    // formatNumber(1000) → "1 000" (Russian locale with NBSP)
    expect(screen.getByText(/1\s*000/)).toBeInTheDocument()
  })

  it('renders formatted percentage values in KPI cards', () => {
    render(<FunnelTab dates={mockDates} totals={mockTotals} />)

    // formatPercentage(20) → "20,0 %" (Russian locale with comma + NBSP)
    expect(screen.getByText(/20.*%/)).toBeInTheDocument()
  })

  it('renders dash for null conversion averages (AP#8)', () => {
    render(<FunnelTab dates={mockDates} totals={mockTotalsWithNulls} />)

    // Three conversion cards should show "—" for null values
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(3)
  })

  it('renders chart when dates array has data', () => {
    const { container } = render(<FunnelTab dates={mockDates} totals={mockTotals} />)

    // recharts renders a responsive container in jsdom
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
  })

  it('renders empty state when dates array is empty', () => {
    render(<FunnelTab dates={[]} totals={mockTotals} />)

    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('does not render chart when dates array is empty', () => {
    const { container } = render(<FunnelTab dates={[]} totals={mockTotals} />)

    expect(container.querySelector('.recharts-responsive-container')).toBeFalsy()
  })

  it('handles single data point', () => {
    const singleDate = [mockDates[0]]
    const { container } = render(<FunnelTab dates={singleDate} totals={mockTotals} />)

    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy()
  })
})
