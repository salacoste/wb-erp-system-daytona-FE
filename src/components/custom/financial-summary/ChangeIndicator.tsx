/**
 * Format change value with trend indicator
 * Request #41: Added isNegativeMetric prop - for returns, decrease is good (green)
 */

import { calculateChange } from '@/hooks/useFinancialSummary'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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
    return <span className="text-gray-400">{'\u2014'}</span>
  }

  const change = calculateChange(current, previous)

  if (change.value === null || change.percentage === null) {
    return <span className="text-gray-400">{'\u2014'}</span>
  }

  const Icon = change.trend === 'up' ? TrendingUp : change.trend === 'down' ? TrendingDown : Minus

  // For negative metrics (like returns), inverted colors: up=red, down=green
  const color = isNegativeMetric
    ? change.trend === 'up'
      ? 'text-red-600'
      : change.trend === 'down'
        ? 'text-green-600'
        : 'text-gray-500'
    : change.trend === 'up'
      ? 'text-green-600'
      : change.trend === 'down'
        ? 'text-red-600'
        : 'text-gray-500'

  return (
    <div className={`flex items-center gap-1 ${color} text-sm`}>
      <Icon className="h-4 w-4" />
      <span>
        {change.percentage > 0 ? '+' : ''}
        {change.percentage.toFixed(1)}%
      </span>
    </div>
  )
}
