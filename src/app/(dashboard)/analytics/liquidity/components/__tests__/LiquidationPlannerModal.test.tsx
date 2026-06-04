/**
 * Tests for LiquidationPlannerModal — turnover-days rendering.
 *
 * Regression: the "Оборот сейчас" value rendered raw `{item.turnover_days} дней`, so an
 * illiquid SKU (backend sentinel turnover_days = 999) showed "999 дней" — a magic-number
 * leak that contradicted the table cell's "Нет продаж" for the same SKU, and used wrong
 * Russian grammar ("22 дней"). Now routed through formatTurnoverDays.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { LiquidityItem } from '@/types/liquidity'
import { LiquidationPlannerModal } from '../LiquidationPlannerModal'

function makeItem(overrides: Partial<LiquidityItem> = {}): LiquidityItem {
  return {
    sku_id: '148188881',
    product_name: 'll-20-wh',
    current_stock_qty: 625,
    stock_value: 312500,
    current_price: 0,
    turnover_days: 999,
    liquidation_scenarios: [],
    ...overrides,
  } as unknown as LiquidityItem
}

describe('LiquidationPlannerModal — turnover days', () => {
  it('renders an illiquid turnover (999) as "Нет продаж", not the raw "999 дней"', () => {
    render(
      <LiquidationPlannerModal item={makeItem({ turnover_days: 999 })} open onClose={() => {}} />
    )
    expect(screen.getByText('Нет продаж')).toBeInTheDocument()
    expect(screen.queryByText(/999/)).not.toBeInTheDocument()
  })

  it('renders a normal turnover with correct Russian grammar (22 → "22 дня")', () => {
    render(
      <LiquidationPlannerModal item={makeItem({ turnover_days: 22 })} open onClose={() => {}} />
    )
    expect(screen.getByText('22 дня')).toBeInTheDocument()
  })

  it('renders "—" in the Стоимость slot when stock_value is null (anti-pattern #8, no "0 ₽")', () => {
    // COGS-unassigned items have stock_value === null — the slot must show "—", not a fabricated 0.
    render(
      <LiquidationPlannerModal item={makeItem({ stock_value: null })} open onClose={() => {}} />
    )
    const label = screen.getByText('Стоимость')
    expect(label.nextElementSibling).toHaveTextContent('—')
  })
})
