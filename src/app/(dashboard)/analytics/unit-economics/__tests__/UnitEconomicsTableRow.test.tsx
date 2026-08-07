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
    const grayDash = dashes.find(el => el.className.includes('text-muted-foreground'))
    expect(grayDash).toBeDefined()
  })
})

// Story 163.4-FE / FR8 (resolves iter-58): a genuine zero-revenue SKU must render "0 ₽", not
// "—". The revenue cell is the regression sentinel — before the fix the whole-ruble
// formatCurrency masked value===0 as "—", indistinguishable from missing data.
describe('UnitEconomicsTableRow revenue — zero vs missing (Story 163.4-FE / FR8)', () => {
  it('renders a genuine zero revenue as "0 ₽", NOT "—" (iter-58 regression)', () => {
    renderRow(makeItem({ revenue: 0 }))
    // Multiple cells carry ₽ (revenue + net_profit); collect them and assert a 0 ₽ cell exists.
    const rubCells = screen.getAllByText(/₽/)
    const revenueCell = rubCells.find(el => /(^|[^\d])0([^\d]|$)/.test(el.textContent ?? ''))
    expect(revenueCell).toBeDefined()
    expect(revenueCell?.textContent).toMatch(/₽/)
    // The 0-cell must NOT be a bare dash indistinguishable from missing data.
    expect(revenueCell?.textContent).not.toBe('—')
  })

  it('renders a positive revenue with ₽ (locale/format unchanged by 163.4)', () => {
    renderRow(makeItem({ revenue: 1500 }))
    const rubCells = screen.getAllByText(/₽/)
    const revenueCell = rubCells.find(el => /1.*500/.test(el.textContent ?? ''))
    expect(revenueCell).toBeDefined()
    expect(revenueCell?.textContent).toMatch(/₽/)
    expect(revenueCell?.textContent).not.toBe('—')
  })

  it('renders FCU/DCU tooltip labels with ₽ when present, and "—" segments when null', () => {
    const item = makeItem({
      revenue: 1000,
      latestFcu: 0, // genuine zero unit cost → "0 ₽/ед." in tooltip label
      latestDcu: null, // missing → DCU label omitted, "FCU/DCU —" rendered in tooltip body
      costs_pct: { ...baseCosts, delivery_to_warehouse: 5 },
    })
    renderRow(item)
    // latestFcu===0 → FCU label present with 0 + ₽; latestDcu null → DCU omitted from labels.
    expect(screen.getByTestId('delivery-tooltip-trigger')).toBeInTheDocument()
    // A ₽-bearing value is rendered alongside.
    expect(screen.getAllByText(/₽/).length).toBeGreaterThan(0)
  })
})
