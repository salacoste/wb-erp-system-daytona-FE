/**
 * Style pins for ProfitBreakdownPopover — p2-80-sweep (WCAG AA).
 *
 * The "НДС к уплате" row mounts on an opaque PopoverContent (bg-popover).
 * Measured: text-status-warning/80 = 3.33:1 light (FAIL 4.5 text);
 * full text-status-warning = 4.81:1 light / 12.71:1 dark (PASS).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProfitBreakdownPopover } from '../ProfitBreakdownPopover'
import type { TheoreticalProfitBreakdown } from '@/lib/theoretical-profit'
import type { TaxMetrics } from '@/types/finance-summary'

const breakdown: TheoreticalProfitBreakdown = {
  sales: 100000,
  cogs: 40000,
  advertising: 10000,
  logistics: 5000,
  storage: 2000,
}

const taxMetrics: TaxMetrics = {
  tax_amount: 15000,
  tax_base: 100000,
  effective_tax_rate: 15,
  tax_system: 'usn15',
  is_minimum_rule: false,
  net_profit_after_tax: 85000,
  vat_payer: true,
  vat_rate: 20,
  vat_output: 30000,
  vat_payable: 3000,
  revenue_excl_vat: 160000,
  net_profit_after_all_tax: 82000,
}

/** Value span of a breakdown row = last span inside the row div. */
function rowValueSpan(label: string): HTMLElement {
  const row = screen.getByText(label).parentElement
  if (!row) throw new Error(`row for "${label}" not found`)
  const spans = row.querySelectorAll('span')
  return spans[spans.length - 1]
}

describe('ProfitBreakdownPopover — /80-sweep contrast pins', () => {
  it('"НДС к уплате" value uses full text-status-warning (no /80 darkening)', () => {
    render(
      <ProfitBreakdownPopover breakdown={breakdown} totalProfit={43000} taxMetrics={taxMetrics} />
    )
    const value = rowValueSpan('НДС к уплате')
    expect(value).toHaveClass('text-status-warning')
    expect(value.className).not.toContain('/80')
  })
})
