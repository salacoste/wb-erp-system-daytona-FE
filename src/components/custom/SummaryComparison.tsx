/**
 * Summary Comparison Component
 * Story 6.2-FE: Period Comparison Enhancement (DEFER-002)
 *
 * Displays comparison summary with delta indicators for table footers.
 */

'use client'

import { cn, formatPercentage } from '@/lib/utils'
import {
  type PeriodTotals,
  formatCurrency,
  calculateDelta,
  DeltaDisplay,
} from './ComparisonHelpers'

// Re-export for backward compatibility
export type { PeriodTotals }

/**
 * Comparison summary props
 */
export interface ComparisonSummaryProps {
  /** Current period totals */
  current: PeriodTotals
  /** Comparison period totals (optional) */
  compare?: PeriodTotals | null
  /** Additional CSS classes */
  className?: string
}

/**
 * Comparison Summary - displays period comparison with delta indicators
 *
 * Shows current period totals with optional comparison to previous period.
 * Displays revenue, profit, and margin with delta indicators.
 *
 * @example
 * <ComparisonSummary
 *   current={{ totalRevenue: 500000, totalProfit: 75000, avgMargin: 15, itemCount: 100 }}
 *   compare={{ totalRevenue: 450000, totalProfit: 60000, avgMargin: 13.3, itemCount: 95 }}
 * />
 */
export function ComparisonSummary({ current, compare, className }: ComparisonSummaryProps) {
  const hasComparison = compare !== null && compare !== undefined

  // Calculate deltas if comparison available
  const revenueDelta = hasComparison
    ? calculateDelta(current.totalRevenue, compare.totalRevenue)
    : null
  const profitDelta = hasComparison
    ? calculateDelta(current.totalProfit, compare.totalProfit)
    : null
  const marginDelta =
    hasComparison && current.avgMargin !== null && compare.avgMargin !== null
      ? { value: current.avgMargin - compare.avgMargin, percent: 0 }
      : null

  return (
    <div className={cn('border-t bg-muted p-4', className)}>
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        {/* Item Count */}
        <div>
          <div className="text-muted-foreground">Всего позиций</div>
          <div className="text-lg font-semibold text-foreground">
            {current.itemCount.toLocaleString('ru-RU')}
          </div>
          {hasComparison && compare.itemCount !== current.itemCount && (
            <div className="text-xs text-muted-foreground">
              vs {compare.itemCount.toLocaleString('ru-RU')}
            </div>
          )}
        </div>

        {/* Total Revenue */}
        <div>
          <div className="text-muted-foreground">Общая выручка</div>
          <div className="text-lg font-semibold text-foreground">
            {formatCurrency(current.totalRevenue)}
          </div>
          {revenueDelta && (
            <DeltaDisplay
              value={revenueDelta.value}
              percent={revenueDelta.percent}
              type="currency"
            />
          )}
        </div>

        {/* Total Profit */}
        <div>
          <div className="text-muted-foreground">Общая прибыль</div>
          <div className="text-lg font-semibold text-foreground">
            {formatCurrency(current.totalProfit)}
          </div>
          {profitDelta && (
            <DeltaDisplay value={profitDelta.value} percent={profitDelta.percent} type="currency" />
          )}
        </div>

        {/* Average Margin */}
        <div>
          <div className="text-muted-foreground">Средняя маржа</div>
          <div className="text-lg font-semibold text-foreground">
            {current.avgMargin !== null ? formatPercentage(current.avgMargin, 2) : '—'}
          </div>
          {marginDelta && <DeltaDisplay value={marginDelta.value} percent={0} type="percent" />}
        </div>
      </div>
    </div>
  )
}
