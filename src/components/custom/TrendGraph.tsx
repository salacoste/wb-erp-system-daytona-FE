'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useTrends, type TrendDataPoint } from '@/hooks/useTrends'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { EmptyStateIllustration } from './EmptyStateIllustration'

/**
 * Trend graph component for key metrics over time
 * Story 3.4: Trend Graphs for Key Metrics
 */
export function TrendGraph() {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useTrends(8) // Last 8 weeks

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'trends'] })
    refetch()
  }

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ dataKey: string; value: number; color: string; payload: TrendDataPoint }>
  }) => {
    if (active && payload && payload.length > 0) {
      const dataPoint = payload[0].payload
      return (
        <div className="rounded-lg border bg-white p-3 shadow-md">
          <p className="font-semibold text-gray-900 mb-2">
            {dataPoint.week} ({formatDate(dataPoint.date)})
          </p>
          {payload.map(entry => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'revenue'
                ? 'Вайлдберриз реализовал Товар'
                : 'К перечислению за товар'}
              : <span className="font-medium">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // Format week for X-axis display (week is already in YYYY-Www format)
  const formatWeekLabel = (week: string) => {
    return week // Week is already in ISO format (YYYY-Www)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренды ключевых метрик</CardTitle>
          <CardDescription>Изменение метрик по неделям</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренды ключевых метрик</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Не удалось загрузить данные трендов. Пожалуйста, попробуйте еще раз.</span>
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

  if (!data || data.trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренды ключевых метрик</CardTitle>
          <CardDescription>Изменение метрик по неделям</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyStateIllustration type="trends" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Тренды ключевых метрик</CardTitle>
            <CardDescription>Изменение метрик по неделям</CardDescription>
          </div>
          <Link href="/analytics/time-period">
            <Button variant="outline" size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Подробная аналитика
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="week"
              tickFormatter={formatWeekLabel}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis tickFormatter={value => formatCurrency(value)} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={value =>
                value === 'revenue' ? 'Вайлдберриз реализовал Товар' : 'К перечислению за товар'
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2196F3"
              strokeWidth={2}
              name="revenue"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="totalPayable"
              stroke="#4CAF50"
              strokeWidth={2}
              name="totalPayable"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
