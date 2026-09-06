/**
 * Style pins for ProductTableRow + ProductMarginCell — p2-wave-6 (WCAG AA).
 *
 * Selected-row stack canon (cogs page Card mount): rest=card, hover=muted/50,
 * selected=info/10, selected-hover=info/20. Measured BEFORE: warn chip
 * text-status-warning over the chip tint = 4.24/4.07/3.70/3.21 light across
 * the 4 row states (FAIL text); ProductMarginCell polling chip
 * text-status-information on selected stack = 4.35/3.78 (FAIL); margin-positive
 * text-status-success on selected stack = 4.44/3.82 (FAIL). Neutral fg/muted-fg
 * pairs PASS on every state (12.01-16.10 light) — untouched.
 * Remediation (wave-6 remedy-b, registry follow-up #2): fg-on-tint —
 * text-foreground on the kept tints (row chip ≥10.74/9.94; margin cell ≥10.59/10.48 — selected-hover worst).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductTableRow } from '../ProductTableRow'
import { ProductMarginCell } from '../ProductMarginCell'
import type { ProductListItem } from '@/types/api'

const baseProduct: ProductListItem = {
  nm_id: '12345',
  sa_name: 'Тестовый товар',
  brand: 'Brand',
  vendor_code: 'VC-1',
  has_cogs: true,
  last_sale_date: null,
  total_sales_qty: 0,
}

function renderRow(overrides: Partial<ProductListItem> = {}, isSelected = false) {
  const product = { ...baseProduct, ...overrides }
  return render(
    <table>
      <tbody>
        <ProductTableRow
          product={product}
          isSelected={isSelected}
          enableSelection
          enableMarginDisplay
          isPolling={false}
          shouldShowRetryButton={() => false}
          getAffectedWeeks={() => []}
          triggerRecalculation={vi.fn()}
          isRecalculating={false}
          onProductClick={vi.fn()}
        />
      </tbody>
    </table>
  )
}

const marginCellProps = {
  enableMarginDisplay: true,
  isPolling: false,
  shouldShowRetryButton: () => false,
  getAffectedWeeks: () => [],
  triggerRecalculation: vi.fn(),
  isRecalculating: false,
}

describe('ProductTableRow — wave-6 selected-stack contrast pins', () => {
  it('selected row keeps the information tint idiom in both hover states', () => {
    renderRow({}, true)
    const row = screen.getByRole('row')
    expect(row).toHaveClass('bg-status-information/10', 'hover:bg-status-information/20')
  })

  it('unselected row keeps the neutral table hover layer', () => {
    renderRow({}, false)
    expect(screen.getByRole('row')).toHaveClass('hover:bg-muted/50')
  })

  it('orphan warn chip uses fg-on-tint over the warn/10 tint (all row states)', () => {
    renderRow({ is_orphan: true }, true)
    const badge = screen.getByText('отчёт')
    expect(badge).toHaveClass('bg-status-warning/10', 'border-status-warning/40', 'text-foreground')
    expect(badge.className).not.toContain('text-status-warning')
  })
})

describe('ProductMarginCell — wave-6 selected-stack contrast pins', () => {
  it('polling chip text is fg-on-tint over the information tint (no info text)', () => {
    render(<ProductMarginCell product={baseProduct} {...marginCellProps} isPolling />)
    const chip = screen.getByText('Расчёт...').parentElement
    expect(chip).toHaveClass('bg-status-information/10', 'border-status-information/40')
    expect(chip?.className).not.toContain('text-status-information')
    expect(chip).toHaveClass('text-foreground')
  })

  it('margin-positive sign is fg-on-tint (passes on selected + selected-hover)', () => {
    render(
      <ProductMarginCell
        product={{ ...baseProduct, current_margin_pct: 12.3 }}
        {...marginCellProps}
      />
    )
    const span = screen.getByText(/12,3/)
    expect(span).toHaveClass('text-foreground')
    expect(span.className).not.toContain('text-status-success')
  })

  it('margin-negative sign keeps the error token (5.66/4.87 on selected stack)', () => {
    render(
      <ProductMarginCell
        product={{ ...baseProduct, current_margin_pct: -5.1 }}
        {...marginCellProps}
      />
    )
    expect(screen.getByText(/-5,1/)).toHaveClass('text-status-error')
  })
})
