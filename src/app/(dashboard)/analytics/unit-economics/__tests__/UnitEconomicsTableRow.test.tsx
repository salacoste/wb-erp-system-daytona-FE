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

  it('applies the information token color for delivery values (168.11)', () => {
    const item = makeItem({ costs_pct: { ...baseCosts, delivery_to_warehouse: 3.2 } })
    renderRow(item)
    const el = screen.getByText(/3[.,]2/)
    expect(el.className).toContain('text-status-information')
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
    // Story 163.4-FE pass-1 fix: the prior sentinel (scan all ₽-cells for a 0-bearing one) was a
    // no-op — it passed whether formatCurrency(0) rendered "0 ₽" OR "—". The revenue-cell testid
    // pins the exact cell, so a 0 → "—" regression now fails this assertion.
    const revenueCell = screen.getByTestId('revenue-cell')
    // Exact "0 ₽" (whole rubles, NBSP-or-space tolerated); NOT the "—" missing-data fallback.
    expect(revenueCell).toHaveTextContent(/^0\s*₽$/)
    expect(revenueCell).not.toHaveTextContent('—')
  })

  it('renders a positive revenue with ₽ (locale/format unchanged by 163.4)', () => {
    renderRow(makeItem({ revenue: 1500 }))
    const revenueCell = screen.getByTestId('revenue-cell')
    expect(revenueCell).toHaveTextContent(/1\s*500\s*₽/)
    expect(revenueCell).not.toHaveTextContent('—')
  })

  it('renders FCU "0 ₽/ед." for latestFcu===0 and omits DCU when latestDcu===null', () => {
    const item = makeItem({
      revenue: 1000,
      latestFcu: 0, // genuine zero unit cost → fcuLabel "FCU (всего) 0 ₽/ед."
      latestDcu: null, // missing → dcuLabel undefined → DCU segment filtered out of disclosure
      costs_pct: { ...baseCosts, delivery_to_warehouse: 5 },
    })
    renderRow(item)
    // Story 163.4-FE pass-1 fix: the prior sentinel only checked the trigger existed + some ₽
    // cell was present (the revenue cell supplied the ₽, not the tooltip). It never exercised
    // the FCU zero path, and was literally un-falsifiable — it passed whether formatCurrency(0)
    // rendered "0 ₽" OR "—". Radix Tooltip content is portaled and only mounts on open (and
    // jsdom doesn't fire the pointer events that open it), so the portaled body is unreachable
    // from a deterministic jsdom test. The trigger's aria-label is built by the SAME helper
    // (formatDeliveryDisclosure) as the tooltip body and is ALWAYS in the DOM, so it is the
    // faithful regression sentinel: a 0 → "—" regression turns the FCU label into
    // "FCU (всего) —/ед." and fails the assertion below.
    const trigger = screen.getByTestId('delivery-tooltip-trigger')
    const disclosure = trigger.getAttribute('aria-label') ?? ''
    // FCU label is built only when latestFcu != null; formatCurrency(0) → "0 ₽" (not "—").
    expect(disclosure).toMatch(/FCU.*0\s*₽/)
    expect(disclosure).not.toMatch(/FCU.*—/)
    // DCU label is omitted entirely when latestDcu===null (dcuLabel undefined → filter(Boolean)).
    expect(disclosure).not.toMatch(/DCU/)
  })
})

// 168.11 token migration: margin thresholds (>=20 positive, <10 negative, mid neutral)
// and the profitability Badge /15-chip classes (single token set shared with sku-financials).
describe('UnitEconomicsTableRow — token colors (168.11)', () => {
  function marginValueEl(margin: number | null) {
    const { container } = renderRow(makeItem({ net_margin_pct: margin }))
    // Column-index navigation (pass-1 MEDIUM fix): independent of the badge status,
    // which is fixture-driven and orthogonal to the margin cell. The costs cell renders
    // nested <td>s (5 cost categories), so the row has 10 td elements: margin value is
    // td[8] (0 sku, 1 name, 2 revenue, 3-7 costs, 8 margin, 9 badge) — content-pinned
    // by the percentage text below, so a column reshuffle fails loudly here too.
    const tds = container.querySelectorAll('tbody tr td')
    expect(tds[8]?.textContent).toContain('%')
    const cell = tds[8]
    return cell?.querySelector('span.font-medium') ?? undefined
  }

  it('margin >= 20 uses text-financial-positive', () => {
    expect(marginValueEl(25)?.className).toContain('text-financial-positive')
  })

  it('margin < 10 uses text-financial-negative', () => {
    expect(marginValueEl(5)?.className).toContain('text-financial-negative')
  })

  it('margin 10-20 stays neutral (muted, never positive/negative)', () => {
    const el = marginValueEl(15)
    expect(el?.className).toContain('text-muted-foreground')
    expect(el?.className).not.toContain('text-financial-positive')
    expect(el?.className).not.toContain('text-financial-negative')
  })

  it.each([
    ['good', 'Хорошо', 'bg-status-information/15 text-foreground'],
    ['excellent', 'Отлично', 'bg-financial-positive/5 text-foreground'],
    ['warning', 'Внимание', 'bg-status-warning/5 text-foreground'],
    ['critical', 'Критично', 'bg-status-error/15 text-foreground'],
    ['loss', 'Убыток', 'bg-financial-negative/5 text-financial-negative'],
  ] as const)(
    'profitability badge for %s uses the pass-2 AA token set (tints kept, fg-on-tint except loss)',
    (status, label, expected) => {
      renderRow(makeItem({ profitability_status: status }))
      const badge = screen.getByText(label)
      expect(badge.className).toContain(expected)
    }
  )

  it('badge carries no inline style color (token classes only, 168.11)', () => {
    renderRow(makeItem({ profitability_status: 'good' }))
    const badge = screen.getByText('Хорошо')
    expect(badge.getAttribute('style')).toBeNull()
  })
})
