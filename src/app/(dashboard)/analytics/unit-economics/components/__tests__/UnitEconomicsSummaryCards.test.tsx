import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'
import { UnitEconomicsSummaryCards } from '../UnitEconomicsSummaryCards'
import type { UnitEconomicsSummary } from '@/types/unit-economics'

const baseSummary: UnitEconomicsSummary = {
  total_revenue: 100000,
  total_net_profit: 25000,
  avg_cogs_pct: 30,
  avg_wb_fees_pct: 25,
  avg_net_margin_pct: 25,
  sku_count: 10,
  profitable_sku_count: 8,
  loss_making_sku_count: 2,
  missing_cogs_count: 0,
}

describe('UnitEconomicsSummaryCards — delivery card (Story 77.5)', () => {
  it('renders "Ср. доставка" label', () => {
    render(<UnitEconomicsSummaryCards summary={baseSummary} />)
    expect(screen.getByText('Ср. доставка')).toBeInTheDocument()
  })

  it('shows formatted currency with ₽ symbol when avgDeliveryCost provided', () => {
    render(
      <UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={50} deliverySkuCount={5} />
    )
    const label = screen.getByText('Ср. доставка')
    const card = label.closest('.min-h-\\[120px\\]')
    expect(card).not.toHaveTextContent('—')
    expect(card).toHaveTextContent(/50/)
    expect(card).toHaveTextContent(/₽/)
  })

  it('shows "—" when avgDeliveryCost is undefined', () => {
    render(<UnitEconomicsSummaryCards summary={baseSummary} />)
    const label = screen.getByText('Ср. доставка')
    const card = label.closest('.min-h-\\[120px\\]')
    expect(card).toHaveTextContent('—')
  })

  it('shows subtext with SKU count when deliverySkuCount provided', () => {
    render(
      <UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={50} deliverySkuCount={3} />
    )
    expect(screen.getByText('3 SKU с подтв. отправкой')).toBeInTheDocument()
  })

  it('has no subtext when deliverySkuCount is undefined', () => {
    render(<UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={50} />)
    expect(screen.queryByText(/SKU с подтв/)).not.toBeInTheDocument()
  })

  it('delivery card contains an icon (Truck SVG)', () => {
    render(
      <UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={50} deliverySkuCount={3} />
    )
    const label = screen.getByText('Ср. доставка')
    const card = label.closest('.min-h-\\[120px\\]')
    const svg = card?.querySelector('svg')
    expect(svg).toBeTruthy()
  })
})

describe('UnitEconomicsSummaryCards — core cards', () => {
  it('renders all 7 standard cards', () => {
    render(
      <UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={100} deliverySkuCount={5} />
    )
    expect(screen.getByText('Выручка')).toBeInTheDocument()
    expect(screen.getByText('COGS %')).toBeInTheDocument()
    expect(screen.getByText('Комиссии WB %')).toBeInTheDocument()
    expect(screen.getByText('Ср. доставка')).toBeInTheDocument()
    expect(screen.getByText('Маржа %')).toBeInTheDocument()
    expect(screen.getByText('Прибыльные')).toBeInTheDocument()
    expect(screen.getByText('Убыточные')).toBeInTheDocument()
  })

  // iter-62: pin the profitable/loss sub-label share in Russian locale (8/10 → "(80,0 %)",
  // 2/10 → "(20,0 %)") — was "(80.0%)" dot-locale (the codepath the iter-58 fix missed).
  it('renders profitable/loss SKU share sub-labels in Russian locale (comma, not dot)', () => {
    render(<UnitEconomicsSummaryCards summary={baseSummary} />)
    expect(screen.getByText(/\(80,0\s%\)/)).toBeInTheDocument()
    expect(screen.getByText(/\(20,0\s%\)/)).toBeInTheDocument()
    expect(screen.queryByText(/80\.0%/)).not.toBeInTheDocument()
    expect(screen.queryByText(/20\.0%/)).not.toBeInTheDocument()
  })
})

// The headline "Маржа %" value is coloured by health (mirrors the per-SKU table + this
// card's trend thresholds: >=20 green, <10 red, else neutral) so a loss-making margin reads
// red, not neutral gray. Other cards keep the default gray.
describe('UnitEconomicsSummaryCards — margin value health colour', () => {
  function marginValueEl(avg_net_margin_pct: number) {
    render(<UnitEconomicsSummaryCards summary={{ ...baseSummary, avg_net_margin_pct }} />)
    return screen.getByText('Маржа %').closest('.min-h-\\[120px\\]')?.querySelector('.text-2xl')
  }

  it('colours a loss-making margin (−31,2 %) red', () => {
    expect(marginValueEl(-31.18)?.className).toContain('text-red-600')
  })

  it('colours a healthy margin (>=20 %) green', () => {
    expect(marginValueEl(25)?.className).toContain('text-green-600')
  })

  it('keeps a mid-range margin (10–20 %) neutral gray, not red', () => {
    const el = marginValueEl(15)
    expect(el?.className).toContain('text-gray-900')
    expect(el?.className).not.toContain('text-red-600')
  })

  // Boundary guards: >=20 is green, <10 is red, so 20 is the green edge and 10 is neutral.
  it('treats the 20 % boundary as green (>=20)', () => {
    expect(marginValueEl(20)?.className).toContain('text-green-600')
  })

  it('treats the 10 % boundary as neutral gray, not red (<10 is the red edge)', () => {
    const el = marginValueEl(10)
    expect(el?.className).toContain('text-gray-900')
    expect(el?.className).not.toContain('text-red-600')
  })
})
