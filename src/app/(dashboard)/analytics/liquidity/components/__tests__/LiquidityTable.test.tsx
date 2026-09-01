import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LiquidityTable } from '../LiquidityTable'
import type { LiquidityItem } from '@/types/liquidity'

vi.mock('../LiquidationPlannerModal', () => ({
  LiquidationPlannerModal: ({ item }: { item: LiquidityItem }) => (
    <div role="dialog" aria-label={`План ликвидации SKU ${item.sku_id}`} />
  ),
}))

const item: LiquidityItem = {
  sku_id: 'SKU-174-3',
  product_name: 'Тестовый товар',
  category: 'Категория',
  brand: 'Бренд',
  current_stock_qty: 10,
  avg_stock_qty_30d: 12,
  stock_value: 5_000,
  units_sold_30d: 2,
  velocity_per_day: 0.1,
  turnover_days: 100,
  liquidity_category: 'illiquid',
  current_price: 900,
  cogs_per_unit: 500,
  recommendation: 'Ликвидировать остаток',
  action_type: 'LIQUIDATE',
  liquidation_scenarios: [
    {
      target_days: 30,
      required_velocity: 0.3,
      velocity_multiplier: 3,
      suggested_discount_pct: 20,
      new_price: 720,
      expected_revenue: 7_200,
      expected_profit: 2_200,
      is_profitable: true,
    },
  ],
}

describe('LiquidityTable interactions', () => {
  it('expands the exact SKU by keyboard and opens its liquidation planner without cross-triggering', async () => {
    const user = userEvent.setup()
    render(
      <LiquidityTable
        data={[item]}
        activeFilter={null}
        sortBy="turnover_days"
        sortOrder="desc"
        onSortChange={vi.fn()}
        onClearFilter={vi.fn()}
      />
    )

    const toggle = screen.getByRole('button', { name: 'Показать детали SKU SKU-174-3' })
    toggle.focus()
    await user.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Ликвидировать остаток')).toBeInTheDocument()

    const action = screen.getByRole('button', { name: 'Ликвидировать' })
    action.focus()
    await user.keyboard('{Enter}')
    expect(
      screen.getByRole('dialog', { name: 'План ликвидации SKU SKU-174-3' })
    ).toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps pointer activation on a non-interactive row cell', async () => {
    const user = userEvent.setup()
    render(
      <LiquidityTable
        data={[item]}
        activeFilter={null}
        sortBy="turnover_days"
        sortOrder="desc"
        onSortChange={vi.fn()}
        onClearFilter={vi.fn()}
      />
    )

    await user.click(screen.getByRole('cell', { name: /Тестовый товар/ }))
    expect(screen.getByRole('button', { name: 'Скрыть детали SKU SKU-174-3' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })
})
