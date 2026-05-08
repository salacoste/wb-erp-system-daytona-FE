import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { Table, TableBody } from '@/components/ui/table'
import { UnitEconomicsTableRow } from '../components/UnitEconomicsTableRow'
import type { UnitEconomicsItem } from '@/types/unit-economics'

const baseCosts = {
  cogs: 30,
  commission: 10,
  logistics_delivery: 8,
  logistics_return: 2,
  storage: 5,
  paid_acceptance: 1,
  penalties: 0.5,
  other_deductions: 1,
  advertising: 3,
  delivery_to_warehouse: null, // Story 96.4-FE: nullable typing
}

function makeItem(overrides: Partial<UnitEconomicsItem> = {}): UnitEconomicsItem {
  return {
    sku_id: '12345',
    product_name: 'Test Product',
    revenue: 1000,
    units_sold: 10,
    costs_pct: { ...baseCosts },
    costs_rub: { ...baseCosts },
    total_costs_pct: 60,
    net_margin_pct: 15,
    net_profit: 150,
    profitability_status: 'good',
    has_cogs: true,
    ...overrides,
  }
}

function renderRow(item: UnitEconomicsItem, isSelected = false) {
  return render(
    <Table>
      <TableBody>
        <UnitEconomicsTableRow item={item} isSelected={isSelected} onSelect={() => {}} />
      </TableBody>
    </Table>
  )
}

describe('UnitEconomicsTableRow delivery column (H2)', () => {
  it('renders formatted delivery % when delivery_to_warehouse is present', () => {
    const item = makeItem({ costs_pct: { ...baseCosts, delivery_to_warehouse: 5.5 } })
    renderRow(item)
    // formatPercentage(5.5) produces "5,5 %" in Russian locale
    expect(screen.getByText(/5[.,]5/)).toBeInTheDocument()
  })

  it('renders "—" when delivery_to_warehouse is undefined', () => {
    renderRow(makeItem())
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('applies cyan color for delivery values', () => {
    const item = makeItem({ costs_pct: { ...baseCosts, delivery_to_warehouse: 3.2 } })
    renderRow(item)
    const el = screen.getByText(/3[.,]2/)
    expect(el.className).toContain('text-cyan-600')
  })

  it('applies gray color for missing delivery', () => {
    renderRow(makeItem())
    const dashes = screen.getAllByText('—')
    const grayDash = dashes.find(el => el.className.includes('text-gray-400'))
    expect(grayDash).toBeDefined()
  })
})
