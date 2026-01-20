'use client'

import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import type { TwoLevelVariableCosts } from '@/types/price-calculator'

/**
 * Props for VariableCostsBreakdown component
 */
export interface VariableCostsBreakdownProps {
  /** Variable costs breakdown data */
  costs: TwoLevelVariableCosts
}

/**
 * Variable costs breakdown section (DRR/Advertising)
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows advertising costs (DRR) which are NOT included in minimum price.
 * This section highlights that DRR is a variable cost that only
 * applies to the recommended price calculation.
 *
 * Returns null if DRR is 0% (no variable costs to display).
 *
 * @example
 * <VariableCostsBreakdown costs={variableCosts} />
 */
export function VariableCostsBreakdown({ costs }: VariableCostsBreakdownProps) {
  // Don't render if DRR is 0
  if (costs.drr.pct === 0) return null

  return (
    <div className="space-y-2" data-testid="variable-costs-breakdown">
      {/* Section Header */}
      <div className="flex justify-between font-medium text-sm">
        <span>ПЕРЕМЕННЫЕ ЗАТРАТЫ</span>
        <span>{formatCurrency(costs.total.rub)}</span>
      </div>

      {/* Cost Line Items */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between items-center">
          <span>└─ DRR Реклама ({costs.drr.pct}%)</span>
          <span className="w-24 text-right">{formatCurrency(costs.drr.rub)}</span>
        </div>
      </div>

      {/* Note about minimum price */}
      <div className="pt-1">
        <Badge variant="outline" className="text-xs">
          Не включено в минимальную цену
        </Badge>
      </div>
    </div>
  )
}
