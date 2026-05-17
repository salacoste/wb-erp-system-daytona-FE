'use client'

/**
 * MapeTrendChart — MAPE history line chart for a single AI model.
 * Story 109.5-FE: recharts LineChart with brand red, Russian tooltip, empty-state Alert.
 * Pattern: single-series line → recharts (not raw SVG) per Epic 92-FE § Pattern 2.
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatDate } from '@/lib/utils'
import { formatMapeTick } from './model-performance-helpers'
import type { MapeTrendEntry } from '@/types/ai/models'

interface MapeTrendTooltipProps {
  active?: boolean
  payload?: Array<{ payload: MapeTrendEntry }>
}

/** Custom tooltip with Russian labels. Null cabinetMape renders '—' (AP#8). Named export for direct unit testing (F-8). */
export function MapeTrendTooltip({ active, payload }: MapeTrendTooltipProps) {
  if (!active || !payload?.length) return null
  const entry = payload[0].payload
  return (
    <div className="rounded border border-border bg-background px-3 py-2 shadow-sm text-sm space-y-1">
      <p className="font-medium">Дата: {formatDate(entry.evaluationDate)}</p>
      <p>MAPE: {entry.cabinetMape != null ? `${entry.cabinetMape.toFixed(1)}%` : '—'}</p>
      <p>SKU: {entry.skuCount}</p>
    </div>
  )
}

interface MapeTrendChartProps {
  entries: MapeTrendEntry[]
}

/** MAPE trend line chart. Renders empty-state Alert when entries is empty. */
export function MapeTrendChart({ entries }: MapeTrendChartProps) {
  if (entries.length === 0) {
    return (
      <Alert>
        <AlertDescription>Нет данных истории MAPE для построения тренда.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      role="img"
      aria-label="График тренда точности модели MAPE"
      className="h-64 w-full"
      data-testid="mape-trend-chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={entries} margin={{ top: 8, right: 10, bottom: 24, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
          <XAxis
            dataKey="evaluationDate"
            tickFormatter={(v: string) => formatDate(v).slice(0, 5)}
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={{ stroke: '#EEEEEE' }}
          />
          <YAxis
            domain={['auto', 'auto']}
            padding={{ top: 10, bottom: 10 }}
            tickFormatter={formatMapeTick}
            tick={{ fontSize: 12, fill: '#757575' }}
            axisLine={{ stroke: '#EEEEEE' }}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<MapeTrendTooltip />} />
          <Line
            type="monotone"
            dataKey="cabinetMape"
            stroke="#E53935"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            activeDot={{ r: 4, fill: '#E53935' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
