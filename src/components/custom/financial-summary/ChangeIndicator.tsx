/**
 * Format change value with trend indicator
 * Request #41: Added isNegativeMetric prop - for returns, decrease is good (green)
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes — see debt-p2-boundary-wave1 artifact. Trend deltas are
// money-direction semantics: financial-positive/negative. Renders on card
// (5.13 / 5.62 light), on MetricRow's information/5 highlight (4.78 / 5.24
// light) and on ExpenseRow's warning/5 highlight (4.81 / 5.28 light) — all
// AA (review-pass-1 /5 tint rule, see MetricRow house rule).

import { calculateChange } from '@/hooks/useFinancialSummary'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatPercentage } from '@/lib/utils'

export function ChangeIndicator({
  current,
  previous,
  isNegativeMetric = false,
}: {
  current?: number | null
  previous?: number | null
  isNegativeMetric?: boolean
}) {
  if (current === undefined || current === null || previous === undefined || previous === null) {
    return <span className="text-muted-foreground">{'\u2014'}</span>
  }

  const change = calculateChange(current, previous)

  if (change.value === null || change.percentage === null) {
    return <span className="text-muted-foreground">{'\u2014'}</span>
  }

  const Icon = change.trend === 'up' ? TrendingUp : change.trend === 'down' ? TrendingDown : Minus

  // For negative metrics (like returns), inverted colors: up=red, down=green
  const color = isNegativeMetric
    ? change.trend === 'up'
      ? 'text-financial-negative'
      : change.trend === 'down'
        ? 'text-financial-positive'
        : 'text-muted-foreground'
    : change.trend === 'up'
      ? 'text-financial-positive'
      : change.trend === 'down'
        ? 'text-financial-negative'
        : 'text-muted-foreground'

  return (
    <div className={`flex items-center gap-1 ${color} text-sm`}>
      <Icon className="h-4 w-4" />
      <span>
        {change.percentage > 0 ? '+' : ''}
        {formatPercentage(change.percentage, 1)}
      </span>
    </div>
  )
}
