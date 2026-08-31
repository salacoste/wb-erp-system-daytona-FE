import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LiquidityDistributionChart } from '../LiquidityDistributionChart'
import type { LiquidityDistribution } from '@/types/liquidity'

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

const distribution: LiquidityDistribution = {
  highly_liquid: { count: 10, value: 50_000, pct: 50, avg_turnover_days: 10, no_sales_count: 0 },
  medium: { count: 5, value: 30_000, pct: 30, avg_turnover_days: 40, no_sales_count: 0 },
  low: { count: 3, value: 15_000, pct: 15, avg_turnover_days: 100, no_sales_count: 1 },
  illiquid: { count: 2, value: 5_000, pct: 5, avg_turnover_days: 999, no_sales_count: 2 },
}

describe('LiquidityDistributionChart accessibility', () => {
  it('provides a named chart and an exact category data table', () => {
    render(<LiquidityDistributionChart distribution={distribution} />)

    expect(
      screen.getByRole('img', {
        name: 'График распределения товаров по категориям ликвидности',
      })
    ).toBeVisible()
    expect(
      screen.getByRole('table', { name: 'Распределение товаров по ликвидности' })
    ).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Категория' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Доля стоимости запасов' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'SKU' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Стоимость запасов' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Высоколиквидный' })).toBeInTheDocument()
  })
})
