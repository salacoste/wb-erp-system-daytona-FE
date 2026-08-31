import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnitEconomicsWaterfall } from '../UnitEconomicsWaterfall'
import type { UnitEconomicsItem, UnitEconomicsSummary } from '@/types/unit-economics'

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
  ReferenceLine: () => null,
}))

const item: UnitEconomicsItem = {
  sku_id: '12345',
  product_name: 'Тестовый товар',
  revenue: 100_000,
  costs_pct: {
    cogs: 30,
    commission: 10,
    logistics_delivery: 5,
    logistics_return: 1,
    storage: 2,
    paid_acceptance: 0,
    penalties: 0,
    other_deductions: 1,
    advertising: 0,
    delivery_to_warehouse: 1,
  },
  costs_rub: {
    cogs: 30_000,
    commission: 10_000,
    logistics_delivery: 5_000,
    logistics_return: 1_000,
    storage: 2_000,
    paid_acceptance: 0,
    penalties: 0,
    other_deductions: 1_000,
    advertising: 0,
    delivery_to_warehouse: 1_000,
  },
  total_costs_pct: 50,
  net_margin_pct: 50,
  net_profit: 50_000,
  profitability_status: 'excellent',
  has_cogs: true,
}

const summary: UnitEconomicsSummary = {
  total_revenue: 100_000,
  total_net_profit: 50_000,
  avg_cogs_pct: 30,
  avg_wb_fees_pct: 20,
  avg_net_margin_pct: 50,
  sku_count: 1,
  profitable_sku_count: 1,
  loss_making_sku_count: 0,
  missing_cogs_count: 0,
}

describe('UnitEconomicsWaterfall accessibility', () => {
  it('provides a named chart and a precise non-hover data table', () => {
    render(
      <UnitEconomicsWaterfall
        data={[item]}
        summary={summary}
        categoryOrder={['cogs', 'commission', 'logistics_delivery']}
      />
    )

    expect(screen.getByRole('img', { name: /График структуры затрат/ })).toBeVisible()
    expect(screen.getByRole('table', { name: /Структура затрат/ })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Категория' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Доля от выручки' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Сумма' })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'Выручка' })).toBeInTheDocument()
  })
})
