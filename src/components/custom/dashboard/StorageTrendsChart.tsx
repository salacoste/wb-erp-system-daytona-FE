/**
 * Storage Trends Chart Sub-components
 * Story 63.6-FE: Storage Trends Chart Enhancement (Dashboard)
 * Epic 63: Dashboard Main Page (Frontend)
 *
 * Recharts-based area chart with purple gradient for storage cost trends.
 *
 * @see docs/stories/epic-63/story-63.6-fe-storage-trends-chart.md
 */

'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { StorageTrendPoint } from '@/types/storage-analytics'

// Chart color scheme - purple for storage
const CHART_COLORS = {
  line: '#7C4DFF',
  nullPoint: '#9CA3AF',
}

export interface StorageTrendsChartProps {
  data: StorageTrendPoint[]
  height: number
}

export function StorageTrendsChart({ data, height }: StorageTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="storageFillDashboard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.line} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.line} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="week"
          tickFormatter={formatWeekShort}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="storage_cost"
          stroke={CHART_COLORS.line}
          fill="url(#storageFillDashboard)"
          strokeWidth={2}
          connectNulls={false}
          dot={<ChartDot />}
          activeDot={{ r: 6, fill: CHART_COLORS.line, stroke: 'white', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Custom dot for null handling
interface ChartDotProps {
  cx?: number
  cy?: number
  payload?: StorageTrendPoint
}

function ChartDot({ cx, cy, payload }: ChartDotProps) {
  if (cx === undefined || cy === undefined) return null
  const hasData = payload?.storage_cost !== null && payload?.storage_cost !== undefined

  if (!hasData) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="transparent"
        stroke={CHART_COLORS.nullPoint}
        strokeWidth={2}
        strokeDasharray="2,2"
      />
    )
  }

  return <circle cx={cx} cy={cy} r={4} fill={CHART_COLORS.line} stroke="white" strokeWidth={2} />
}

// Custom tooltip
interface TooltipPayload {
  payload: StorageTrendPoint
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload
  const hasData = data.storage_cost !== null && data.storage_cost !== undefined
  const weekNum = label?.split('-W')[1] || label

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="font-medium text-sm mb-1">Неделя {weekNum}</p>
      {hasData ? (
        <p className="text-lg font-bold" style={{ color: CHART_COLORS.line }}>
          {formatCurrency(data.storage_cost!)}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Нет данных за эту неделю</p>
      )}
    </div>
  )
}

// Formatters
function formatWeekShort(week: string): string {
  return week.split('-')[1] || week
}

function formatYAxis(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
  return value.toString()
}
