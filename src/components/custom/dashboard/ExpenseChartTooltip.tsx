/**
 * Expense Chart Tooltip Component
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Custom tooltip for expense pie chart hover state.
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

'use client'

import { formatCurrency, formatPercentage } from '@/lib/utils'
import type { ExpenseChartDataItem } from './expense-chart-config'

interface ExpenseChartTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ExpenseChartDataItem }>
}

/**
 * Custom tooltip showing category name, amount, and percentage
 */
export function ExpenseChartTooltip({ active, payload }: ExpenseChartTooltipProps) {
  if (!active || !payload?.[0]) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <p className="font-semibold text-foreground">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        Сумма: <span className="font-medium">{formatCurrency(data.value)}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Доля: <span className="font-medium">{formatPercentage(data.percentage, 1)}</span>
      </p>
    </div>
  )
}
