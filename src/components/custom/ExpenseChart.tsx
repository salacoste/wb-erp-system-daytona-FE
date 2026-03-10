'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useExpenses } from '@/hooks/useExpenses'
import { formatCurrency } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { EmptyStateIllustration } from './EmptyStateIllustration'
import { COLORS, ExpenseChartTooltip, ExpenseChartSkeleton } from './expense-chart-config'

/**
 * Expense breakdown chart component
 * Story 3.3: Expense Breakdown Visualization
 *
 * @param weekOverride - Optional week to display (YYYY-Www format)
 */
export function ExpenseChart({ weekOverride }: { weekOverride?: string }) {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useExpenses(weekOverride)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
              <span>Не удалось загрузить данные о расходах. Пожалуйста, попробуйте еще раз.</span>
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
          <CardDescription>Визуализация расходов по категориям</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyStateIllustration type="expenses" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Разбивка расходов</CardTitle>
        <CardDescription>Визуализация расходов по категориям</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer
          width="100%"
          height={Math.max(250, data.expenses.length * 50 + 160)}
          aria-label="Диаграмма расходов по категориям"
        >
          <BarChart
            data={data.expenses}
            margin={{
              top: 20,
              right: isMobile ? 0 : 30,
              left: isMobile ? 0 : 20,
              bottom: 100,
            }}
          >
            <XAxis
              dataKey="category"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickFormatter={value => formatCurrency(value)}
              tick={{ fontSize: 12 }}
              width={isMobile ? 60 : 80}
            />
            <Tooltip content={<ExpenseChartTooltip />} />
            <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
              {data.expenses.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
