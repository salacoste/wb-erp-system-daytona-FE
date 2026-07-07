/**
 * SupplyDetailRightColumn — BD-17 label regression guard.
 *
 * Bug BD-17 renamed the user-visible <dt> label in SupplyDetailRightColumn.tsx:95 from the
 * deceptive `Горизонт планирования:` (planning horizon) → honest `Покрытие страхового запаса:`
 * (safety stock coverage). The formatter (formatSafetyStockCoverage) is unit-tested, but NO test
 * asserted the rendered <dt> string itself — a future refactor could revert the label and every
 * test would stay green. These tests lock the visible label + its coverage value + the negative
 * assertion that the old deceptive text is gone.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { SupplyDetailRightColumn } from '../SupplyDetailRightColumn'
import type { ForecastDay } from '../supply-detail-calculations'
import type { SupplyPlanningItem, StockoutRisk } from '@/types/supply-planning'

// Minimal valid forecast — the right column only reads day/date/stockStart/stockEnd/isStockout.
const forecast: ForecastDay[] = [
  {
    day: 1,
    date: '2026-07-08',
    stockStart: 40,
    sales: 5,
    stockEnd: 35,
    isStockout: false,
    lostUnits: 0,
  },
  {
    day: 2,
    date: '2026-07-09',
    stockStart: 35,
    sales: 5,
    stockEnd: 30,
    isStockout: false,
    lostUnits: 0,
  },
]

/** Builds a valid SupplyPlanningItem with overrideable safety/velocity fields.
 *  Mirrors the inline-item convention from SupplyPlanningTable.test.tsx (no `any`). */
function makeItem(overrides: Partial<SupplyPlanningItem> = {}): SupplyPlanningItem {
  return {
    sku_id: 'sku-1',
    product_name: 'Product A',
    current_stock: 40,
    in_transit: 0,
    effective_stock: 40,
    avg_daily_sales: 5,
    velocity_trend: 'stable',
    days_until_stockout: 8,
    stockout_date: '2026-07-16',
    stockout_risk: 'healthy' as StockoutRisk,
    safety_stock_units: 40,
    reorder_quantity: 0,
    reorder_status: 'ok',
    cogs_per_unit: 100,
    has_cogs: true,
    selling_price: 200,
    warehouses: [],
    ...overrides,
  }
}

describe('SupplyDetailRightColumn — BD-17 safety-stock coverage label', () => {
  it('renders the corrected "Покрытие страхового запаса:" label', () => {
    render(<SupplyDetailRightColumn item={makeItem()} forecast={forecast} totalLostUnits={0} />)
    expect(screen.getByText(/Покрытие страхового запаса/)).toBeInTheDocument()
  })

  it('renders the coverage value = safety_stock_units / avg_daily_sales (40 / 5 → 8 дней)', () => {
    render(<SupplyDetailRightColumn item={makeItem()} forecast={forecast} totalLostUnits={0} />)
    // 40 / 5 = 8 days of buffer (a coverage metric, NOT a planning horizon)
    expect(screen.getByText(/8 дней/)).toBeInTheDocument()
  })

  it('does NOT render the reverted deceptive "Горизонт планирования" label', () => {
    render(<SupplyDetailRightColumn item={makeItem()} forecast={forecast} totalLostUnits={0} />)
    // BD-17: the old label lied about the metric semantics — it must never come back
    expect(screen.queryByText(/Горизонт планирования/)).toBeNull()
  })

  it('edge case: safety_stock_units <= 0 → label still present, coverage value "—"', () => {
    // No safety buffer → formatter returns "—"; the corrected label must survive edge data
    const item = makeItem({ safety_stock_units: 0 })
    render(<SupplyDetailRightColumn item={item} forecast={forecast} totalLostUnits={0} />)
    expect(screen.getByText(/Покрытие страхового запаса/)).toBeInTheDocument()
    // the dd renders the em dash for the no-buffer case
    const dd = screen
      .getByText(/Покрытие страхового запаса/)
      .closest('div')
      ?.querySelector('dd')
    expect(dd?.textContent).toMatch(/—/)
    // and the old deceptive label still must not appear
    expect(screen.queryByText(/Горизонт планирования/)).toBeNull()
  })
})
