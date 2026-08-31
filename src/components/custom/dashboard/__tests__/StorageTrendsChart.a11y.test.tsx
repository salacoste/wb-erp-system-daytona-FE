import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

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

import { StorageTrendsChart } from '../StorageTrendsChart'

const data = [
  { week: '2026-W30', storage_cost: 1234.5 },
  { week: '2026-W31', storage_cost: null },
]

afterEach(() => vi.unstubAllGlobals())

describe('dashboard StorageTrendsChart accessibility', () => {
  it('associates the chart with an exact semantic data alternative', () => {
    render(<StorageTrendsChart data={data} height={250} />)

    expect(
      screen.getByRole('img', { name: 'График расходов на хранение на главной странице' })
    ).toHaveAttribute('aria-describedby', 'dashboard-storage-trend-data-table')
    const table = screen.getByRole('table', {
      name: 'Данные графика расходов на хранение на главной странице',
    })
    expect(table).toHaveTextContent('2026-W30')
    expect(table).toHaveTextContent('нет данных')
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
