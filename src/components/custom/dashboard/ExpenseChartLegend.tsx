/**
 * Expense Chart Legend Component
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Custom legend displaying expense categories with colors and percentages.
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

'use client'

import type { ExpenseChartDataItem } from './expense-chart-config'

interface ExpenseChartLegendProps {
  data: ExpenseChartDataItem[]
}

/**
 * Custom legend with color indicators and percentage values
 */
export function ExpenseChartLegend({ data }: ExpenseChartLegendProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 text-sm">
      {data.map(item => (
        <div key={item.key} className="flex items-center gap-1.5">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: item.color }}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">
            {item.name}: {item.percentage.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
