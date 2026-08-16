'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTrends } from '@/hooks/useTrends'
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
import { TrendingUp, Info, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { METRIC_LABELS, METRIC_CHANGE_KEY, TrendTooltip } from './trend-graph-config'
import { TrendGraphSkeleton, TrendGraphError, TrendGraphEmpty } from './TrendGraphStates'

export function TrendGraph() {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useTrends(8)
  const [infoDismissed, setInfoDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(METRIC_CHANGE_KEY) === '1'
  })

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'trends'] })
    refetch()
  }

  if (isLoading) return <TrendGraphSkeleton />
  if (error) return <TrendGraphError onRetry={handleRetry} />
  if (!data || data.trends.length === 0) return <TrendGraphEmpty />

  return (
    // TD-E FIX-H1: stable testid for E2E — the AnalyticalDisclosure wrapper is
    // collapsed+lazy by default, so specs must expand it before this Card mounts.
    <Card data-testid="trend-graph">
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
      {!infoDismissed && (
        <div className="mx-6 mb-2 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Метрика обновлена: теперь показывает выручку продавца без комиссии WB</span>
          <button
            onClick={() => {
              localStorage.setItem(METRIC_CHANGE_KEY, '1')
              setInfoDismissed(true)
            }}
            className="ml-auto shrink-0 text-blue-500 hover:text-blue-700"
            aria-label="Скрыть"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
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
            <YAxis yAxisId="left" tickFormatter={v => formatCurrency(v)} tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={v => `${v}%`}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<TrendTooltip />} />
            <Legend formatter={v => METRIC_LABELS[v] ?? v} />
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
