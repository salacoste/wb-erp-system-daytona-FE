import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { DailyMetrics } from '@/types/daily-metrics'
import { DailyBreakdownChart } from '../DailyBreakdownChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

const day: DailyMetrics = {
  date: '2026-08-31',
  dayOfWeek: 1,
  orders: 1500,
  ordersCount: 3,
  ordersCogs: 500,
  sales: 1200,
  salesCogs: 400,
  advertising: 100,
  logistics: 50,
  storage: 25,
  penalties: 0,
  paidAcceptance: 0,
  commission: 120,
  theoreticalProfit: 505,
  salesCount: 2,
  returnsCount: 0,
}

describe('DailyBreakdownChart accessibility', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )
  })

  it('exposes the exact visible series as a non-hover table with period and ruble units', () => {
    render(
      <DailyBreakdownChart
        data={[day]}
        periodType="week"
        visibleSeries={['orders', 'sales', 'profit']}
        isLoading={false}
      />
    )

    expect(
      screen.getByRole('table', {
        name: 'Данные графика детализации по дням за неделю; единицы: рубли',
      })
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Дата' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Заказы, ₽' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Выкупы, ₽' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Теор. прибыль, ₽' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /31\.08\.2026.*1\s*500.*1\s*200.*505/ })).toBeVisible()
  })
})
