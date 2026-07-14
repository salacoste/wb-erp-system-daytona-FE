/**
 * Tests for MonitorWeeklyChart
 * Epic 92-FE Story 92.4: 7-day line chart.
 *
 * H-2 fix: Recharts mock captures Line inputs (dataKey + name) so assertions
 *          verify the chart receives correct data, not just that text appears.
 * M-3 fix: all-zero traffic empty state tested.
 *
 * Note on Recharts in jsdom: ResponsiveContainer renders zero-size in jsdom.
 * Mocked to a fixed div so LineChart children render correctly.
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { DailyMetrics } from '@/types/daily-metrics'
import { MonitorWeeklyChart } from '../MonitorWeeklyChart'

// H-2 fix: mocks capture inputs so assertions can verify dataKey + name + chart data.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 280 }}>{children}</div>
    ),
    LineChart: ({ data, children }: { data: unknown[]; children: React.ReactNode }) => (
      <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    CartesianGrid: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    Legend: ({ payload }: { payload?: Array<{ value: string }> }) => (
      <ul data-testid="recharts-legend">
        {payload?.map(p => (
          <li key={p.value}>{p.value}</li>
        ))}
      </ul>
    ),
    Line: ({ name, dataKey }: { name: string; dataKey: string }) => (
      <div data-testid={`line-${dataKey}`} data-line-name={name} />
    ),
  }
})

// Minimal fixture matching actual DailyMetrics shape (Story 61.9-FE + Story 92.4 new fields).
function makeDay(overrides: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    date: '2026-04-18',
    dayOfWeek: 6,
    orders: 0,
    ordersCount: 5,
    ordersCogs: null,
    sales: 12000,
    salesCogs: null,
    advertising: 0,
    logistics: 0,
    storage: 0,
    penalties: 0,
    paidAcceptance: 0,
    commission: 0,
    theoreticalProfit: 0,
    salesCount: 0,
    returnsCount: 0,
    ...overrides,
  }
}

const sevenDays: DailyMetrics[] = [
  makeDay({ date: '2026-04-14', salesCount: 10, returnsCount: 1 }),
  makeDay({ date: '2026-04-15', salesCount: 12, returnsCount: 2 }),
  makeDay({ date: '2026-04-16', salesCount: 8, returnsCount: 0 }),
  makeDay({ date: '2026-04-17', salesCount: 15, returnsCount: 3 }),
  makeDay({ date: '2026-04-18', salesCount: 11, returnsCount: 1 }),
  makeDay({ date: '2026-04-19', salesCount: 9, returnsCount: 2 }),
  makeDay({ date: '2026-04-20', salesCount: 13, returnsCount: 2 }),
]

describe('MonitorWeeklyChart', () => {
  it('renders 3 lines with correct dataKeys and Russian names', () => {
    renderWithProviders(<MonitorWeeklyChart data={sevenDays} />)

    expect(screen.getByTestId('line-sales')).toHaveAttribute('data-line-name', 'Продажи')
    // BD-22: renamed from "Заказы" — series is salesCount+returnsCount, not real order count
    expect(screen.getByTestId('line-orders')).toHaveAttribute(
      'data-line-name',
      'Продажи + Возвраты'
    )
    expect(screen.getByTestId('line-returns')).toHaveAttribute('data-line-name', 'Возвраты')
  })

  it('passes transformed chart data to LineChart with correct counts', () => {
    const data = [makeDay({ date: '2026-04-20', salesCount: 12, returnsCount: 2 })]
    renderWithProviders(<MonitorWeeklyChart data={data} />)

    const chart = screen.getByTestId('line-chart')
    const chartData = JSON.parse(chart.getAttribute('data-chart-data')!) as Array<{
      date: string
      sales: number
      orders: number
      returns: number
      label: string
    }>
    expect(chartData).toHaveLength(1)
    expect(chartData[0]).toMatchObject({
      date: '2026-04-20',
      sales: 12,
      orders: 14, // 12 + 2
      returns: 2,
      label: expect.stringMatching(/^Пн/), // L-1 fix: capitalized weekday
    })
  })

  it('renders empty-state message when data array is empty', () => {
    renderWithProviders(<MonitorWeeklyChart data={[]} />)

    expect(screen.getByText('Нет данных за последние 7 дней')).toBeInTheDocument()
  })

  it('renders all-zero traffic empty state when every row has zero counts', () => {
    // M-3 fix: array present but all counts are 0
    const allZero = [
      makeDay({ date: '2026-04-18', salesCount: 0, returnsCount: 0 }),
      makeDay({ date: '2026-04-19', salesCount: 0, returnsCount: 0 }),
    ]
    renderWithProviders(<MonitorWeeklyChart data={allZero} />)

    expect(screen.getByText('За последние 7 дней не было активности')).toBeInTheDocument()
  })

  it('renders landmark with correct role, aria-label, and data-testid', () => {
    renderWithProviders(<MonitorWeeklyChart data={sevenDays} />)

    const landmark = screen.getByTestId('monitor-weekly-chart')
    expect(landmark).toBeInTheDocument()
    expect(landmark).toHaveAttribute('role', 'region')
    expect(landmark).toHaveAttribute('aria-label', 'График за 7 дней')
  })

  it('renders landmark with correct attributes in empty state too', () => {
    renderWithProviders(<MonitorWeeklyChart data={[]} />)

    const landmark = screen.getByTestId('monitor-weekly-chart')
    expect(landmark).toHaveAttribute('role', 'region')
    expect(landmark).toHaveAttribute('aria-label', 'График за 7 дней')
  })

  it('renders landmark with correct attributes in all-zero traffic state', () => {
    const allZero = [makeDay({ salesCount: 0, returnsCount: 0 })]
    renderWithProviders(<MonitorWeeklyChart data={allZero} />)

    const landmark = screen.getByTestId('monitor-weekly-chart')
    expect(landmark).toHaveAttribute('role', 'region')
    expect(landmark).toHaveAttribute('aria-label', 'График за 7 дней')
  })
})
