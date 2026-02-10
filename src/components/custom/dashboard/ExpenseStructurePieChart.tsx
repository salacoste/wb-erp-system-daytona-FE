/**
 * Expense Structure Pie Chart Component
 * Story 63.9-FE: Expense Structure Pie Chart
 * Epic 63-FE: Dashboard Main Page Enhancement
 *
 * Donut chart displaying cost breakdown as percentage of total costs.
 * @see docs/stories/epic-63/story-63.9-fe-expense-structure-chart.md
 */

'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useExpenseStructure } from '@/hooks/useExpenseStructure'
import { formatCurrency } from '@/lib/utils'
import { EmptyStateIllustration } from '@/components/custom/EmptyStateIllustration'
import { ExpenseChartSkeleton } from './ExpenseChartSkeleton'
import { ExpenseChartTooltip } from './ExpenseChartTooltip'
import { ExpenseChartLegend } from './ExpenseChartLegend'
import { transformToChartData, calculateTotalExpenses } from './expense-chart-config'

export interface ExpenseStructurePieChartProps {
  /** ISO week string (e.g., "2026-W05") */
  week: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Expense Structure Pie Chart
 *
 * Displays cost breakdown as a donut chart with:
 * - 9 expense categories with distinct colors
 * - Center showing total expenses
 * - Custom tooltip with amount and percentage
 * - Responsive legend with category names
 */
export function ExpenseStructurePieChart({ week, className }: ExpenseStructurePieChartProps) {
  const { data, isLoading, error } = useExpenseStructure({ week })

  // Loading state
  if (isLoading) {
    return <ExpenseChartSkeleton />
  }

  // Error or empty state
  if (error || !data?.data?.[0]) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Структура расходов</CardTitle>
          <CardDescription>Распределение затрат по категориям</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyStateIllustration type="expenses" />
        </CardContent>
      </Card>
    )
  }

  const totalData = data.data[0]
  const chartData = transformToChartData(totalData.costs_rub, totalData.costs_pct)
  const totalExpenses = calculateTotalExpenses(chartData)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Структура расходов</CardTitle>
        <CardDescription>Распределение затрат по категориям</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="relative"
          style={{ height: 320 }}
          role="img"
          aria-label="Диаграмма структуры расходов: круговая диаграмма с распределением затрат по категориям"
        >
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                animationDuration={300}
              >
                {chartData.map(entry => (
                  <Cell
                    key={`cell-${entry.key}`}
                    fill={entry.color}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<ExpenseChartTooltip />} />
              <Legend
                content={() => <ExpenseChartLegend data={chartData} />}
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 16 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center total display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground">Итого</span>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
