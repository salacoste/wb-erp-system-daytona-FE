/**
 * Profit Breakdown Popover Component
 * Story 62.4-FE: Theoretical Profit Card with Breakdown
 * Epic 66-FE: Added optional tax/VAT rows
 *
 * Displays breakdown of theoretical profit calculation components.
 * When taxMetrics provided, adds tax and НДС rows to the P&L waterfall.
 */

'use client'

import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TheoreticalProfitBreakdown } from '@/lib/theoretical-profit'
import type { TaxMetrics } from '@/types/finance-summary'

export interface ProfitBreakdownPopoverProps {
  breakdown: TheoreticalProfitBreakdown
  totalProfit: number
  /** Epic 66-FE: Optional tax data for P&L waterfall */
  taxMetrics?: TaxMetrics | null
}

interface BreakdownRow {
  label: string
  value: number
  sign: '+' | '-' | '='
  color: string
}

export function ProfitBreakdownPopover({
  breakdown,
  totalProfit,
  taxMetrics,
}: ProfitBreakdownPopoverProps): React.ReactElement {
  const rows: BreakdownRow[] = [
    { label: 'Выкупы', value: breakdown.sales, sign: '+', color: 'text-blue-500' },
    { label: 'COGS', value: breakdown.cogs, sign: '-', color: 'text-gray-500' },
    { label: 'Реклама', value: breakdown.advertising, sign: '-', color: 'text-yellow-600' },
    { label: 'Логистика', value: breakdown.logistics, sign: '-', color: 'text-red-500' },
    { label: 'Хранение', value: breakdown.storage, sign: '-', color: 'text-purple-500' },
  ]

  // Epic 66-FE: Add tax/VAT rows when data available
  const taxRows: BreakdownRow[] = []
  if (taxMetrics) {
    if (taxMetrics.tax_amount != null && taxMetrics.tax_amount !== 0) {
      taxRows.push({
        label: 'Налог на доход',
        value: taxMetrics.tax_amount,
        sign: '-',
        color: 'text-orange-500',
      })
    }
    if (taxMetrics.vat_payer && taxMetrics.vat_payable != null && taxMetrics.vat_payable !== 0) {
      taxRows.push({
        label: 'НДС к уплате',
        value: taxMetrics.vat_payable,
        sign: '-',
        color: 'text-orange-400',
      })
    }
  }

  const finalProfit =
    taxMetrics?.net_profit_after_all_tax ?? taxMetrics?.net_profit_after_tax ?? totalProfit
  const isPositive = finalProfit >= 0
  const label = taxRows.length > 0 ? 'Чистая прибыль' : 'Теор. прибыль'

  return (
    <div role="region" aria-label="Разбивка прибыли">
      <h4 className="mb-3 text-sm font-semibold">Разбивка прибыли</h4>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.color}>
              {row.sign}
              {formatCurrency(Math.abs(row.value))}
            </span>
          </div>
        ))}
        {taxRows.map(row => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.color}>
              {row.sign}
              {formatCurrency(Math.abs(row.value))}
            </span>
          </div>
        ))}
        <div className="border-t pt-2">
          <div className="flex justify-between text-sm font-bold">
            <span>{label}</span>
            <span className={cn(isPositive ? 'text-green-500' : 'text-red-500')}>
              = {formatCurrency(finalProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
