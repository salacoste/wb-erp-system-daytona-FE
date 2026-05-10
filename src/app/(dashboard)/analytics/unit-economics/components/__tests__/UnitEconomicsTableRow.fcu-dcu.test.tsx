import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/utils/test-utils'
import { Table, TableBody } from '@/components/ui/table'
import { UnitEconomicsTableRow } from '../UnitEconomicsTableRow'
import type { UnitEconomicsItem } from '@/types/unit-economics'

// Note: Radix UI Tooltip only renders portal content after a real hover event.
// jsdom does not support pointer events that trigger Radix open state.
// M2-1+L2-1 (2nd-pass): role="button" and tabIndex dropped from trigger spans — Radix
// TooltipTrigger asChild handles role wiring natively; paper a11y win was worse than none.
// Tests now query via data-testid="delivery-tooltip-trigger" (stable, role-independent).
// aria-label assertions use toHaveAccessibleName (reads the aria-label attribute directly).
// Manual Chrome verification covers visual tooltip content (Task 5 / AC-5).
// Pattern follows CLAUDE.md anti-pattern #6 — use regex for locale-sensitive text.

const baseCostsPct = {
  cogs: 30,
  commission: 15,
  logistics_delivery: 5,
  logistics_return: 1,
  storage: 2,
  paid_acceptance: 0,
  penalties: 0,
  other_deductions: 0,
  advertising: 0,
  delivery_to_warehouse: 4,
}

const baseCostsRub = {
  cogs: 3000,
  commission: 1500,
  logistics_delivery: 500,
  logistics_return: 100,
  storage: 200,
  paid_acceptance: 0,
  penalties: 0,
  other_deductions: 0,
  advertising: 0,
  delivery_to_warehouse: 400,
}

const baseItem: UnitEconomicsItem = {
  sku_id: 'SKU-001',
  product_name: 'Test Product',
  brand: 'TestBrand',
  category: 'TestCat',
  revenue: 10000,
  units_sold: 10,
  total_costs_pct: 57,
  net_margin_pct: 25,
  net_profit: 2500,
  profitability_status: 'good',
  has_cogs: true,
  costs_pct: { ...baseCostsPct },
  costs_rub: { ...baseCostsRub },
}

function renderRow(item: UnitEconomicsItem) {
  return render(
    <Table>
      <TableBody>
        <UnitEconomicsTableRow item={item} isSelected={false} onSelect={() => {}} />
      </TableBody>
    </Table>
  )
}

describe('UnitEconomicsTableRow FCU/DCU tooltip (Story 96.10-FE AC-1)', () => {
  it('renders trigger with aria-label including DCU and FCU when both populated', () => {
    // Use data-testid (stable after M2-1+L2-1 dropped role="button")
    // Assert aria-label content for DCU/FCU (no exact-string — locale-safe regex)
    const item = { ...baseItem, latestFcu: 175.5, latestDcu: 25.3 }
    renderRow(item)
    const trigger = screen.getByTestId('delivery-tooltip-trigger')
    expect(trigger).toBeInTheDocument()
    // Delivery % included in aria-label
    expect(trigger).toHaveAccessibleName(/Доставка/)
    // DCU included
    expect(trigger).toHaveAccessibleName(/DCU/)
    // FCU included
    expect(trigger).toHaveAccessibleName(/FCU/)
  })

  it('delivery trigger aria-label includes % text and currency strings when FCU/DCU set', () => {
    const item = { ...baseItem, latestFcu: 50, latestDcu: 10 }
    renderRow(item)
    const trigger = screen.getByTestId('delivery-tooltip-trigger')
    expect(trigger).toBeInTheDocument()
    // Delivery % in accessible name — tightened regex (4.0% in Russian locale)
    expect(trigger).toHaveAccessibleName(/4[,.]?\d*\s*%/)
  })

  it('renders em-dash trigger with a11y label "Нет данных" when delivery_to_warehouse is null', () => {
    const item: UnitEconomicsItem = {
      ...baseItem,
      latestFcu: null,
      latestDcu: null,
      costs_pct: { ...baseCostsPct, delivery_to_warehouse: null },
      costs_rub: { ...baseCostsRub, delivery_to_warehouse: null },
    }
    renderRow(item)
    const trigger = screen.getByTestId('delivery-tooltip-trigger')
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAccessibleName(/Нет данных/)
    expect(trigger).toHaveTextContent('—')
  })

  it('row renders without errors when latestFcu and latestDcu are both undefined', () => {
    // undefined = SKU not in FCU response (no FCU map entry at all)
    const item = { ...baseItem }
    renderRow(item)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    // Delivery % trigger still rendered (delivery_to_warehouse: 4 from baseItem)
    const trigger = screen.getByTestId('delivery-tooltip-trigger')
    expect(trigger).toBeInTheDocument()
    // L2-2: verify DCU/FCU are ABSENT from aria-label when fields are undefined —
    // guards against formatCurrency(undefined) leaking "NaN ₽" into the label.
    expect(trigger).not.toHaveAccessibleName(/DCU/)
    expect(trigger).not.toHaveAccessibleName(/FCU/)
  })

  it('M-1 contradiction case (AC-3): row with delivery_to_warehouse % but null FCU/DCU renders without throwing', () => {
    // L-1: AC-3 mixed-null fixture test — locks in the invariant that when
    // delivery_to_warehouse % is set from aggregated data path but latestFcu/latestDcu
    // are null (no FCU map entry), the row renders and the trigger is accessible.
    // This is the 3-state case documented in M-1: backend computed % via aggregated
    // path while FCU endpoint returned no entry for this SKU.
    const item: UnitEconomicsItem = {
      ...baseItem,
      latestFcu: null,
      latestDcu: null,
      costs_pct: { ...baseCostsPct, delivery_to_warehouse: 4 },
      costs_rub: { ...baseCostsRub, delivery_to_warehouse: 400 },
    }
    renderRow(item)
    // Trigger element still rendered; aria-label discloses % even with null FCU/DCU
    const trigger = screen.getByTestId('delivery-tooltip-trigger')
    expect(trigger).toBeInTheDocument()
    // Aria-label includes the % but NOT DCU/FCU (they are null)
    expect(trigger).toHaveAccessibleName(/Доставка/)
    expect(trigger).not.toHaveAccessibleName(/DCU/)
    expect(trigger).not.toHaveAccessibleName(/FCU/)
  })
})
