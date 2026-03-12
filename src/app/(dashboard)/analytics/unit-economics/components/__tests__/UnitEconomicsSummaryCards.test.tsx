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
})
