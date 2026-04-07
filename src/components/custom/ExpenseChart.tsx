'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useExpenses } from '@/hooks/useExpenses'
import { formatCurrency } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import { RefreshCw, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { EmptyStateIllustration } from './EmptyStateIllustration'
import {
  getCategoryColor,
  mergeSmallCategories,
  ExpenseBarTooltip,
  ExpenseChartSkeleton,
} from './expense-chart-config'

/**
 * Expense breakdown chart — horizontal bars with business context
 * Redesign 2026-03-31: horizontal layout, summary header, semantic colors
 */
export function ExpenseChart({ weekOverride }: { weekOverride?: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useExpenses(weekOverride)

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'expenses'] })
    refetch()
  }

  if (isLoading) return <ExpenseChartSkeleton />

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Разбивка расходов</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные о расходах.</span>
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Повторить
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Разбивка расходов</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyStateIllustration type="expenses" />
        </CardContent>
      </Card>
    )
  }

  const merged = mergeSmallCategories(data.expenses)
  const chartData = merged.map(item => ({
    ...item,
    color: getCategoryColor(item.category),
  }))
  const chartHeight = Math.max(200, chartData.length * 44 + 20)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle>Разбивка расходов</CardTitle>
          <ExpenseSummaryBadge total={data.total} />
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 0, right: 90, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="category"
              width={130}
              tick={{ fontSize: 13, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ExpenseBarTooltip />} cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={24}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              <LabelList
                dataKey="amount"
                position="right"
                formatter={(v: number) => formatCurrency(v)}
                style={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function ExpenseSummaryBadge({ total }: { total: number }) {
  const isHigh = total > 100000
  const Icon = isHigh ? TrendingUp : TrendingDown
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1">
      <Icon className={`h-3.5 w-3.5 ${isHigh ? 'text-red-500' : 'text-green-500'}`} />
      <span className="text-sm font-semibold text-gray-800">{formatCurrency(total)}</span>
    </div>
  )
}
