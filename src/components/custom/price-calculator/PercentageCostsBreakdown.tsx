'use client'

import { formatCurrency } from '@/lib/utils'
import type { TwoLevelPercentageCosts } from '@/types/price-calculator'

/**
 * Props for PercentageCostsBreakdown component
 */
export interface PercentageCostsBreakdownProps {
  /** Percentage costs breakdown data */
  costs: TwoLevelPercentageCosts
}

/**
 * Percentage costs breakdown section
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows percentage-based costs calculated from selling price:
 * - WB Commission (always)
 * - Acquiring fee (always)
 * - Income tax (only if tax_type === 'income')
 *
 * Note: DRR is shown separately in VariableCostsBreakdown
 * because it's NOT included in minimum price calculation.
 *
 * @example
 * <PercentageCostsBreakdown costs={percentageCosts} />
 */
export function PercentageCostsBreakdown({ costs }: PercentageCostsBreakdownProps) {
  const hasTaxIncome = costs.taxIncome !== null

  return (
    <div className="space-y-2" data-testid="percentage-costs-breakdown">
      {/* Section Header */}
      <div className="flex justify-between font-medium text-sm">
        <span>ПРОЦЕНТНЫЕ ЗАТРАТЫ</span>
        <span>{formatCurrency(costs.total.rub)}</span>
      </div>

      {/* Cost Line Items */}
      <div className="space-y-1 text-sm text-muted-foreground">
        {/* WB Commission */}
        <div className="flex justify-between">
          <span>├─ Комиссия WB ({costs.commissionWb.pct}%)</span>
          <span className="w-24 text-right">{formatCurrency(costs.commissionWb.rub)}</span>
        </div>

        {/* Acquiring */}
        <div className="flex justify-between">
          <span>{hasTaxIncome ? '├─' : '└─'} Эквайринг ({costs.acquiring.pct}%)</span>
          <span className="w-24 text-right">{formatCurrency(costs.acquiring.rub)}</span>
        </div>

        {/* Income Tax (if applicable) */}
        {hasTaxIncome && (
          <div className="flex justify-between">
            <span>└─ Налог с выручки ({costs.taxIncome?.pct}%)</span>
            <span className="w-24 text-right">{formatCurrency(costs.taxIncome?.rub ?? 0)}</span>
          </div>
        )}
      </div>

      {/* Subtotal */}
      <div className="flex justify-between pt-1 border-t border-dashed text-sm font-medium">
        <span>Итого процентные ({costs.total.pct.toFixed(1)}%)</span>
        <span className="w-24 text-right">{formatCurrency(costs.total.rub)}</span>
      </div>
    </div>
  )
}
