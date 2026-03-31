'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useTrends, type TrendDataPoint } from '@/hooks/useTrends'
import { formatCurrency } from '@/lib/utils'
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

  const METRIC_LABELS: Record<string, string> = {
    revenue: 'Продажи (розница)',
    totalPayable: 'К перечислению',
    payoutTotal: 'Перечислено',
    cogsTotal: 'Себестоимость',
    operatingProfit: 'Опер. прибыль',
    logisticsCost: 'Логистика',
    efficiencyPct: 'Эффективность, %',
  }
  const PCT_METRICS = new Set(['efficiencyPct'])

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
          <p className="font-semibold text-gray-900 mb-2">{dataPoint.week}</p>
          {payload.map(entry => (
            <p key={entry.dataKey} className="text-sm" style={{ color: entry.color }}>
              {METRIC_LABELS[entry.dataKey] ?? entry.dataKey}:{' '}
              <span className="font-medium">
                {PCT_METRICS.has(entry.dataKey) ? `${entry.value}%` : formatCurrency(entry.value)}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
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
              tickFormatter={w => w.replace(/^\d{4}-/, '')}
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={value => formatCurrency(value)}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={v => `${v}%`}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={value => METRIC_LABELS[value] ?? value} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke="#3B82F6"
              strokeWidth={2}
              name="revenue"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="totalPayable"
              stroke="#22C55E"
              strokeWidth={2}
              name="totalPayable"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="payoutTotal"
              stroke="#9CA3AF"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              name="payoutTotal"
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cogsTotal"
              stroke="#FF9800"
              strokeWidth={1.5}
              name="cogsTotal"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="operatingProfit"
              stroke="#E53935"
              strokeWidth={2.5}
              name="operatingProfit"
              dot={{ r: 4, fill: '#E53935' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="logisticsCost"
              stroke="#F59E0B"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              name="logisticsCost"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="efficiencyPct"
              stroke="#7C4DFF"
              strokeWidth={2}
              strokeDasharray="8 4"
              name="efficiencyPct"
              dot={{ r: 4, fill: '#7C4DFF' }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
