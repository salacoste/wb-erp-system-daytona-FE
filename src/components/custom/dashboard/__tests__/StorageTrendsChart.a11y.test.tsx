import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@/test/utils/test-utils'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: ({ isAnimationActive }: { isAnimationActive?: boolean }) => (
    <div data-testid="storage-area" data-animation-active={String(isAnimationActive)} />
  ),
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}))

import { ChartTooltip, StorageTrendsChart } from '../StorageTrendsChart'

const data = [
  { week: '2026-W30', storage_cost: 1234.5 },
  { week: '2026-W31', storage_cost: null },
]

afterEach(() => vi.unstubAllGlobals())

describe('dashboard StorageTrendsChart accessibility', () => {
  it('exposes exact weeks, ruble units, series values, null state, and tooltip precision', () => {
    render(<StorageTrendsChart data={data} height={250} />)

    expect(
      screen.getByRole('img', { name: 'График расходов на хранение на главной странице' })
    ).toHaveAttribute('aria-describedby', 'dashboard-storage-trend-data-table')
    const table = screen.getByRole('table', {
      name: 'Данные графика расходов на хранение на главной странице',
    })
    expect(within(table).getByRole('columnheader', { name: 'Неделя' })).toBeInTheDocument()
    expect(
      within(table).getByRole('columnheader', { name: 'Расходы на хранение, ₽' })
    ).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: '2026-W30' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: '1 234,5 ₽' })).toBeInTheDocument()
    expect(within(table).getByRole('rowheader', { name: '2026-W31' })).toBeInTheDocument()
    expect(within(table).getByRole('cell', { name: 'нет данных' })).toBeInTheDocument()

    render(<ChartTooltip active label="2026-W30" payload={[{ payload: data[0] }]} />)
    expect(screen.getByText('Неделя 30')).toBeInTheDocument()
    expect(screen.getAllByText((_, element) => element?.textContent === '1 234,5 ₽')).toHaveLength(
      2
    )
  })

  it('disables Recharts animation for reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }) as MediaQueryList)
    )

    render(<StorageTrendsChart data={data} height={250} />)

    expect(screen.getByTestId('storage-area')).toHaveAttribute('data-animation-active', 'false')
  })
})
