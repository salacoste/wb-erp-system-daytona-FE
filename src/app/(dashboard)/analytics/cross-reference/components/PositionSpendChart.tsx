'use client'

/**
 * Search Position vs Ad Spend Scatter Chart — Feature 3.6
 * Scatter plot showing correlation between organic order count (X-axis)
 * and ad spend (Y-axis). Includes Pearson correlation badge.
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'
import { formatPercentage } from '@/lib/utils'
import { computePositionSpendCorrelation } from '../utils/ad-search-correlation-utils'

interface PositionSpendChartProps {
  items: CrossReferenceItem[]
}

interface ScatterPayload {
  nmId: number
  vendorCode: string | null
  totalOrders: number
  adSpend: number
  channel: string
}

function toScatterData(items: CrossReferenceItem[]): ScatterPayload[] {
  return items
    .filter(i => i.totalOrders > 0 || i.adSpend > 0)
    .map(i => ({
      nmId: i.nmId,
      vendorCode: i.vendorCode,
      totalOrders: i.totalOrders,
      adSpend: i.adSpend,
      channel: i.channel,
    }))
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload?: ScatterPayload }[]
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (!d) return null

  return (
    <div className="rounded-md border bg-white px-3 py-2 text-sm shadow-md space-y-1">
      <p className="font-semibold">{d.vendorCode || d.nmId}</p>
      <p>
        Органические заказы: <span className="font-medium">{d.totalOrders}</span>
      </p>
      <p>
        Рекламный расход: <span className="font-medium">{fmtCurrency(d.adSpend)}</span>
      </p>
    </div>
  )
}

/** Color-coded badge for Pearson r value */
function CorrelationBadge({ r }: { r: number }) {
  const pct = Math.abs(r) * 100
  const label =
    pct < 20
      ? 'Слабая'
      : pct < 40
        ? 'Умеренная'
        : pct < 60
          ? 'Заметная'
          : pct < 80
            ? 'Сильная'
            : 'Очень сильная'

  const color =
    pct < 30
      ? 'bg-gray-100 text-gray-800 border-gray-300'
      : pct < 60
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-red-100 text-red-800 border-red-300'

  return (
    <Badge variant="outline" className={color}>
      {label}: {formatPercentage(pct)} ({r >= 0 ? '+' : ''}
      {r.toFixed(2)})
    </Badge>
  )
}

export function PositionSpendChart({ items }: PositionSpendChartProps) {
  const data = toScatterData(items)
  const correlation = computePositionSpendCorrelation(items)

  if (data.length < 2) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-3">Позиция в поиске vs Расход на рекламу</h2>
        <p className="text-muted-foreground text-sm">
          Недостаточно данных для построения графика (минимум 2 точки)
        </p>
      </div>
    )
  }

  // Median lines for reference
  const sortedOrders = [...data].sort((a, b) => a.totalOrders - b.totalOrders)
  const sortedSpend = [...data].sort((a, b) => a.adSpend - b.adSpend)
  const ordersMedian = sortedOrders[Math.floor(sortedOrders.length / 2)]?.totalOrders ?? 0
  const spendMedian = sortedSpend[Math.floor(sortedSpend.length / 2)]?.adSpend ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Позиция в поиске vs Расход на рекламу</h2>
        {correlation.pearsonR !== null && <CorrelationBadge r={correlation.pearsonR} />}
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        Корреляция между органическими заказами и рекламными расходами ({correlation.label}, n=
        {correlation.sampleSize})
      </p>

      <ResponsiveContainer width="100%" height={350}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="totalOrders"
            name="Органические заказы"
            label={{ value: 'Органические заказы', position: 'bottom', offset: -5 }}
          />
          <YAxis
            type="number"
            dataKey="adSpend"
            name="Рекламные расходы"
            tickFormatter={(v: number) => fmtCurrency(v)}
            label={{
              value: 'Расход (₽)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
          />
          <ReferenceLine
            x={ordersMedian}
            stroke="#9CA3AF"
            strokeDasharray="4 4"
            label={{ value: 'Медиана', position: 'top', fill: '#9CA3AF', fontSize: 10 }}
          />
          <ReferenceLine y={spendMedian} stroke="#9CA3AF" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Товары" data={data} fill="#3B82F6" opacity={0.6} r={5} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
