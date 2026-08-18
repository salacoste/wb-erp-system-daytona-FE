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

// 168.11: icon chips pair their semantic bg token with a paired *-foreground token —
// pass-2 fix: hardcoded text-white icons failed the 3.0 graphical threshold in dark
// (white on light dark-theme status bgs ≈ 1.7–2.6).
describe('UnitEconomicsSummaryCards — icon chip tokens (168.11)', () => {
  function chipEl(label: string) {
    render(
      <UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={100} deliverySkuCount={5} />
    )
    return screen.getByText(label).closest('.min-h-\\[120px\\]')?.querySelector('.rounded-lg')
  }

  it.each([
    ['Выручка', 'bg-primary'],
    ['COGS %', 'bg-status-warning'],
    ['Комиссии WB %', 'bg-status-information'],
    ['Ср. доставка', 'bg-status-information'],
    ['Маржа %', 'bg-financial-positive'],
    ['Прибыльные', 'bg-status-success'],
    ['Убыточные', 'bg-status-error'],
  ])('icon chip for "%s" uses its semantic token', (label, token) => {
    expect(chipEl(label)?.className).toContain(token)
  })

  it.each([
    ['Выручка', 'text-primary-foreground'],
    ['COGS %', 'text-status-warning-foreground'],
    ['Комиссии WB %', 'text-status-information-foreground'],
    ['Ср. доставка', 'text-status-information-foreground'],
    ['Маржа %', 'text-primary-foreground'],
    ['Прибыльные', 'text-status-success-foreground'],
    ['Убыточные', 'text-status-error-foreground'],
  ])('icon for "%s" pairs its chip bg with a foreground token (dark-safe)', (label, fg) => {
    const chip = chipEl(label)
    const svgClass = chip?.querySelector('svg')?.getAttribute('class') ?? ''
    // SVG className is SVGAnimatedString in jsdom — assert on the attribute string
    expect(svgClass).toContain(fg)
    expect(svgClass).not.toContain('text-white')
  })

  it('icon chip for "Ваша цена" uses bg-status-information when present', () => {
    render(<UnitEconomicsSummaryCards summary={{ ...baseSummary, total_your_price: 500 }} />)
    const chip = screen
      .getByText('Ваша цена')
      .closest('.min-h-\\[120px\\]')
      ?.querySelector('.rounded-lg')
    expect(chip?.className).toContain('bg-status-information')
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
    expect(marginValueEl(-31.18)?.className).toContain('text-financial-negative')
  })

  it('colours a healthy margin (>=20 %) green', () => {
    expect(marginValueEl(25)?.className).toContain('text-financial-positive')
  })

  it('keeps a mid-range margin (10–20 %) neutral gray, not red', () => {
    const el = marginValueEl(15)
    expect(el?.className).toContain('text-foreground')
    expect(el?.className).not.toContain('text-financial-negative')
  })

  // Boundary guards: >=20 is green, <10 is red, so 20 is the green edge and 10 is neutral.
  it('treats the 20 % boundary as green (>=20)', () => {
    expect(marginValueEl(20)?.className).toContain('text-financial-positive')
  })

  it('treats the 10 % boundary as neutral gray, not red (<10 is the red edge)', () => {
    const el = marginValueEl(10)
    expect(el?.className).toContain('text-foreground')
    expect(el?.className).not.toContain('text-financial-negative')
  })
})

// Story 163.4-FE / FR8 (resolves iter-58): the "Ваша цена" card visibility gate was
// `total_your_price > 0`, hiding a genuine 0 ₽ price indistinguishably from an absent field.
// Now gated on `!== undefined` — present-but-zero renders "0 ₽"; absent hides the card.
describe('UnitEconomicsSummaryCards — zero vs missing monetary (Story 163.4-FE / FR8)', () => {
  it('shows the "Ваша цена" card with "0 ₽" when total_your_price is a genuine 0', () => {
    render(<UnitEconomicsSummaryCards summary={{ ...baseSummary, total_your_price: 0 }} />)
    const label = screen.getByText('Ваша цена')
    const card = label.closest('.min-h-\\[120px\\]')
    expect(card).toHaveTextContent(/0/)
    expect(card).toHaveTextContent(/₽/)
    expect(card).not.toHaveTextContent('—')
  })

  it('hides the "Ваша цена" card when total_your_price is undefined (field absent)', () => {
    render(<UnitEconomicsSummaryCards summary={{ ...baseSummary }} />)
    expect(screen.queryByText('Ваша цена')).not.toBeInTheDocument()
  })

  it('renders total_revenue 0 as "0 ₽", NOT "—" (iter-58 regression on Выручка)', () => {
    render(<UnitEconomicsSummaryCards summary={{ ...baseSummary, total_revenue: 0 }} />)
    const label = screen.getByText('Выручка')
    const card = label.closest('.min-h-\\[120px\\]')
    const value = card?.querySelector('.text-2xl')
    expect(value?.textContent).toMatch(/0/)
    expect(value?.textContent).toMatch(/₽/)
    expect(value?.textContent).not.toBe('—')
  })

  it('renders avgDeliveryCost 0 as "0 ₽" (formatter handles null → "—" internally)', () => {
    render(
      <UnitEconomicsSummaryCards summary={baseSummary} avgDeliveryCost={0} deliverySkuCount={4} />
    )
    const label = screen.getByText('Ср. доставка')
    const card = label.closest('.min-h-\\[120px\\]')
    expect(card).toHaveTextContent(/0/)
    expect(card).toHaveTextContent(/₽/)
    expect(card).not.toHaveTextContent('—')
  })
})
