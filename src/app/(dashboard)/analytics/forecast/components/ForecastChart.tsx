'use client'

/**
 * ForecastChart — AI forecast line chart with confidence band.
 * Story 109.2-FE: ComposedChart with 3 layers (band area, naive baseline, AI prediction).
 * Pure helpers + data transform extracted to forecast-chart-helpers.ts.
 */
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { type AiForecastPrediction } from '@/types/ai-forecast'
import { formatDate } from '@/lib/utils'
import {
  transformPredictionsForChart,
  formatConfidence,
  formatBandRange,
  type ForecastChartRow,
} from './forecast-chart-helpers'

// Re-export for direct unit testing (pure-function discipline)
export { getForecastBand } from './forecast-chart-helpers'

/** Recharts tooltip payload entry — exported for direct-render testing (F-2). */
export interface TooltipPayloadEntry {
  dataKey: string
  value: number
  payload: ForecastChartRow
}

interface ForecastChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}

/** Custom tooltip: 5 labelled rows in Russian. Null values render '—' (AP#8 compliance). */
export function ForecastChartTooltip({ active, payload }: ForecastChartTooltipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded border border-border bg-background px-3 py-2 shadow-sm text-sm space-y-1">
      <p className="font-medium">Дата: {formatDate(row.date)}</p>
      <p>Прогноз (AI): {Math.round(row.predictedSales)}</p>
      <p>Базовая оценка: {row.naiveBaseline != null ? Math.round(row.naiveBaseline) : '—'}</p>
      <p>Уверенность: {formatConfidence(row.confidence)}</p>
      <p>Диапазон: {formatBandRange(row.bandLower, row.bandUpper)}</p>
    </div>
  )
}

interface ForecastChartProps {
  predictions: AiForecastPrediction[]
}

/** Forecast chart with confidence band. Empty state when predictions is empty. */
export function ForecastChart({ predictions }: ForecastChartProps) {
  if (predictions.length === 0) {
    return (
      <Alert>
        <AlertDescription>Нет данных для построения графика прогноза.</AlertDescription>
      </Alert>
    )
  }

  const chartData = transformPredictionsForChart(predictions)

  return (
    <Card>
      <CardHeader>
        <CardTitle>График прогноза</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          role="img"
          aria-label="График прогноза продаж с доверительным интервалом"
          className="h-72 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 10, bottom: 24, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={{ stroke: '#EEEEEE' }}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => Math.round(v).toString()}
                tick={{ fontSize: 12, fill: '#757575' }}
                axisLine={{ stroke: '#EEEEEE' }}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<ForecastChartTooltip />} />
              {/* Layer 1 (bottom): confidence band — brand red at low opacity */}
              <Area
                type="monotone"
                dataKey="bandUpper"
                stroke="none"
                fill="#E53935"
                fillOpacity={0.15}
                legendType="none"
              />
              <Area
                type="monotone"
                dataKey="bandLower"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                legendType="none"
              />
              {/* Layer 2: naive baseline — dashed gray */}
              <Line
                type="monotone"
                dataKey="naiveBaseline"
                stroke="#9CA3AF"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              {/* Layer 3 (top): AI prediction — solid brand red */}
              <Line
                type="monotone"
                dataKey="predictedSales"
                stroke="#E53935"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#E53935' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
