'use client'

import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TwoLevelMargin, TaxType } from '@/types/price-calculator'

/**
 * Props for MarginSection component
 */
export interface MarginSectionProps {
  /** Margin breakdown data */
  margin: TwoLevelMargin
  /** Tax type for conditional display */
  taxType: TaxType
  /** Tax rate for display */
  taxRatePct: number
}

/**
 * Get margin health color based on percentage
 */
function getMarginColor(marginPct: number): string {
  if (marginPct >= 20) return 'text-green-600'
  if (marginPct >= 10) return 'text-yellow-600'
  if (marginPct >= 5) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Margin display section
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows margin information:
 * - Gross margin (% and ₽)
 * - Visual progress indicator
 * - Net profit after tax (if profit tax type)
 *
 * @example
 * <MarginSection
 *   margin={margin}
 *   taxType="profit"
 *   taxRatePct={15}
 * />
 */
export function MarginSection({
  margin,
  taxType,
  taxRatePct,
}: MarginSectionProps) {
  const marginColor = getMarginColor(margin.pct)
  const showAfterTax = taxType === 'profit' && margin.afterTax !== null

  return (
    <div className="space-y-3" data-testid="margin-section">
      {/* Section Header */}
      <div className="flex justify-between font-medium text-sm">
        <span>МАРЖА ({margin.pct}%)</span>
        <span className={cn('font-bold', marginColor)}>{formatCurrency(margin.rub)}</span>
      </div>

      {/* Visual Progress Indicator */}
      <div className="space-y-1">
        <Progress value={Math.min(margin.pct, 50)} max={50} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
        </div>
      </div>

      {/* Profit Display */}
      <div className="space-y-1 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <span>└─ Валовая прибыль</span>
          <span className={cn('font-medium', marginColor)}>
            {formatCurrency(margin.rub)}
          </span>
        </div>

        {/* Net Profit After Tax (profit tax only) */}
        {showAfterTax && (
          <div className="flex justify-between pl-4">
            <span>└─ Чистая прибыль (после налога {taxRatePct}%)</span>
            <span className="text-green-600 font-medium">
              {formatCurrency(margin.afterTax ?? 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
