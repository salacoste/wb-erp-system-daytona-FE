/**
 * Semantic token pins for PnL Waterfall components (Story 168.3)
 *
 * Pins the shadcn semantic token classes on PnLRow / KeyMetricsSection /
 * GrossProfitSection and guards against legacy palette classes in the DOM.
 * Style follows the 168.2 pin template (AlertHistoryHelpers.test.tsx):
 * exact classList.contains matches — no substring [class*=] false-passes.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PnLRow } from '../PnLRow'
import { SectionHeader } from '../PnLSectionHeader'
import { KeyMetricsSection } from '../KeyMetricsSection'
import { GrossProfitSection } from '../GrossProfitSection'
import { PnLWaterfall } from '../PnLWaterfall'
import type { CabinetSummaryTotals, CabinetProductStats } from '@/types/analytics'

// Widened legacy-palette regex from 168.2
const LEGACY_PALETTE_RE =
  /((bg|text|border|ring|divide|fill|stroke|outline)-(red|yellow|blue|green|gray|rose|amber|emerald|sky|orange|slate|zinc|neutral|stone|lime|teal|cyan|indigo|violet|purple|fuchsia|pink)(-\d+)?)/

const totals: CabinetSummaryTotals = {
  sales_gross: 100000,
  returns_gross: 10000,
  sale_gross: 90000,
  total_commission_rub: 10000,
  logistics_cost: 5000,
  storage_cost: 2000,
  paid_acceptance_cost: 0,
  penalties: 0,
  payout_total: 70000,
  revenue_net: 70000,
  cogs_total: 30000,
  profit: 40000,
  margin_pct: 40,
  qty: 100,
  profit_per_unit: 400,
  roi: 120,
  skus_with_expenses_only: 3,
}

const products: CabinetProductStats = {
  total: 10,
  with_cogs: 8,
  without_cogs: 2,
  coverage_pct: 80,
}

/** Find an element whose classList contains the exact token. */
const findByToken = (container: HTMLElement, token: string) =>
  Array.from(container.querySelectorAll<HTMLElement>('*')).find(el => el.classList.contains(token))

describe('PnLRow — semantic value/row tokens (168.3)', () => {
  it('names the report help tooltip button', () => {
    render(<PnLWaterfall data={totals} products={products} />)

    expect(
      screen.getByRole('button', {
        name: 'Подробнее об отчёте о прибылях и убытках (P&L)',
      })
    ).toBeVisible()
  })

  it('names row and section formula tooltip buttons', () => {
    render(
      <TooltipProvider>
        <SectionHeader title="Валовая прибыль" formula="Выручка − COGS" />
        <PnLRow label="Логистика" value={1000} tooltip="Расходы на логистику" />
      </TooltipProvider>
    )

    expect(screen.getByRole('button', { name: 'Формула расчёта: Валовая прибыль' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Подробнее: Логистика' })).toBeVisible()
  })

  it('positive value renders text-financial-positive', () => {
    const { container } = render(
      <TooltipProvider>
        <PnLRow label="Компенсация" value={1000} isPositive />
      </TooltipProvider>
    )
    expect(findByToken(container, 'text-financial-positive')).toBeDefined()
  })

  it('uses foreground text on a positive-tinted highlight for AA contrast', () => {
    const { container } = render(
      <TooltipProvider>
        <PnLRow
          label="Итого к выплате"
          value={70000}
          isPositive
          highlight="positive"
          percentOfRevenue={70}
        />
      </TooltipProvider>
    )

    expect(findByToken(container, 'bg-financial-positive/10')).toBeDefined()
    expect(findByToken(container, 'text-financial-positive')).toBeUndefined()
    expect(container.querySelectorAll('.text-foreground')).toHaveLength(2)
  })

  it('negative value renders text-financial-negative', () => {
    const { container } = render(
      <TooltipProvider>
        <PnLRow label="Штрафы" value={1000} isNegative />
      </TooltipProvider>
    )
    expect(findByToken(container, 'text-financial-negative')).toBeDefined()
  })

  it('total row renders bg-muted with border-border', () => {
    const { container } = render(
      <TooltipProvider>
        <PnLRow label="Итого" value={50000} isTotal />
      </TooltipProvider>
    )
    expect(findByToken(container, 'bg-muted')).toBeDefined()
    expect(findByToken(container, 'border-border')).toBeDefined()
  })

  it('renders no legacy palette classes in the DOM (positive/negative/total/tooltip)', () => {
    const { container } = render(
      <TooltipProvider>
        <PnLRow label="A" value={1} isPositive tooltip="t" formula="f = 1" percentOfRevenue={5} />
        <PnLRow label="B" value={-1} isNegative highlight="negative" />
        <PnLRow label="C" value={2} isTotal highlight="positive" tooltip="t2" formula="f2" />
        <PnLRow label="D" value={3} isSubtotal highlight="warning" />
      </TooltipProvider>
    )
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})

describe('KeyMetricsSection — semantic card tokens (168.3)', () => {
  it('ROI card uses status-information tokens', () => {
    const { container } = render(
      <TooltipProvider>
        <KeyMetricsSection data={totals} roi={120} profitPerUnit={400} />
      </TooltipProvider>
    )
    expect(findByToken(container, 'bg-status-information/10')).toBeDefined()
    expect(findByToken(container, 'text-status-information')).toBeDefined()
  })

  it('renders no legacy palette classes in the DOM (all four cards)', () => {
    const { container } = render(
      <TooltipProvider>
        <KeyMetricsSection data={totals} roi={120} profitPerUnit={400} />
      </TooltipProvider>
    )
    expect(container.innerHTML).not.toMatch(LEGACY_PALETTE_RE)
  })
})

describe('GrossProfitSection — coverage warning uses status-warning (168.3)', () => {
  it('COGS-coverage warning block uses status-warning tokens', () => {
    const { container } = render(
      <TooltipProvider>
        <GrossProfitSection
          hasCogs={false}
          sellerPayout={70000}
          cogsTotal={null}
          cogsPct={null}
          grossProfit={null}
          grossMarginPct={null}
          profitToRevenuePct={null}
          products={products}
        />
      </TooltipProvider>
    )
    expect(findByToken(container, 'bg-status-warning/10')).toBeDefined()
    expect(findByToken(container, 'text-status-warning')).toBeDefined()
  })
})
