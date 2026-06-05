import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '@/test/utils/test-utils'
import type { SupplyPlanningItem, VelocityTrend } from '@/types/supply-planning'
import { VelocityCell, SellingPriceCell } from '../SupplyPlanningRowCells'

/**
 * VelocityCell — Defensive Frontend: backend velocity_trend 'no_data'/null must
 * render the "—" unknown indicator, NEVER the gray Minus icon (a real 'stable' trend).
 * Regression guard for the supply-planning "fabricated stable trend" bug.
 */

function makeItem(velocity_trend: VelocityTrend | null): SupplyPlanningItem {
  return {
    sku_id: '12345',
    product_name: 'Тестовый товар',
    current_stock: 0,
    in_transit: 0,
    effective_stock: 0,
    avg_daily_sales: 0,
    velocity_trend,
    days_until_stockout: null,
    stockout_date: null,
    stockout_risk: 'out_of_stock',
    safety_stock_units: 0,
    reorder_quantity: 0,
    reorder_status: 'ok',
    reorder_value: 0,
    cogs_per_unit: null,
    has_cogs: false,
    selling_price: 1250,
    warehouses: [],
  }
}

function renderCell(velocity_trend: VelocityTrend | null) {
  return renderWithProviders(
    <table>
      <tbody>
        <tr>
          <VelocityCell item={makeItem(velocity_trend)} />
        </tr>
      </tbody>
    </table>
  )
}

describe('VelocityCell', () => {
  it("renders the '—' unknown indicator for velocity_trend 'no_data' (no fabricated Minus)", () => {
    const { getByLabelText, container } = renderCell('no_data')

    const indicator = getByLabelText(/Нет данных о тренде/)
    expect(indicator).toBeInTheDocument()
    expect(indicator.textContent).toBe('—')
    // No trend icon should be rendered — the bug coerced 'no_data' → 'stable' (lucide Minus).
    expect(container.querySelector('.lucide-minus')).toBeNull()
    expect(container.querySelector('svg')).toBeNull()
  })

  it("renders the '—' unknown indicator for velocity_trend null (same as no_data)", () => {
    const { getByLabelText, container } = renderCell(null)

    expect(getByLabelText(/Нет данных о тренде/)).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeNull()
  })

  it("renders the TrendingUp icon for velocity_trend 'growing'", () => {
    const { container, queryByLabelText } = renderCell('growing')

    expect(container.querySelector('.lucide-trending-up')).not.toBeNull()
    expect(queryByLabelText(/Нет данных о тренде/)).toBeNull()
  })

  it("renders the Minus icon for a genuine 'stable' trend", () => {
    const { container, queryByLabelText } = renderCell('stable')

    expect(container.querySelector('.lucide-minus')).not.toBeNull()
    expect(queryByLabelText(/Нет данных о тренде/)).toBeNull()
  })
})

describe('SellingPriceCell', () => {
  it('renders formatted price when selling_price is present', () => {
    const item = makeItem(null)
    const { container } = renderWithProviders(
      <table>
        <tbody>
          <tr>
            <SellingPriceCell item={item} />
          </tr>
        </tbody>
      </table>
    )
    // makeItem sets selling_price: 1250 — should render as Russian-locale RUB
    const cell = container.querySelector('td')
    expect(cell?.textContent).toContain('1')
    expect(cell?.textContent).toContain('250')
    // Must not render the em-dash for null
    expect(cell?.textContent).not.toBe('—')
  })

  it('renders em-dash when selling_price is null', () => {
    const item = { ...makeItem(null), selling_price: null as number | null }
    const { container } = renderWithProviders(
      <table>
        <tbody>
          <tr>
            <SellingPriceCell item={item} />
          </tr>
        </tbody>
      </table>
    )
    const cell = container.querySelector('td')
    expect(cell?.textContent).toBe('—')
  })
})
