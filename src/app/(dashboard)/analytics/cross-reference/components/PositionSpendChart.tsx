'use client'

/**
 * Search Position vs Ad Spend Scatter Chart — Feature 3.6
 * Scatter plot showing correlation between organic order count (X-axis)
 * and ad spend (Y-axis). Includes Pearson correlation badge.
 * Story 170.6-FE: correlation taxonomy UNIFIED on the util interpretCorrelation
 * (label AND badge tint — the former local 20/40/60/80 label ladder and the
 * divergent 30/60 color bands are deleted); tooltip → bg-popover; grid/axis →
 * border/chart-axis tokens; selected-point detail line (RTC).
 */

import { useState } from 'react'
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
import type { ScatterPointItem } from 'recharts/types/cartesian/Scatter'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'
import { formatPercentage } from '@/lib/utils'
import {
  computePositionSpendCorrelation,
  interpretCorrelation,
} from '../utils/ad-search-correlation-utils'

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
    <div className="rounded-md border bg-popover text-popover-foreground px-3 py-2 text-sm shadow-md space-y-1">
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

/** Badge consumes the unified util taxonomy (label + tint bands) — no local ladders. */
function CorrelationBadge({ r }: { r: number }) {
  const pct = Math.abs(r) * 100
  const interpretation = interpretCorrelation(r)

  return (
    <Badge variant="outline" className={interpretation.badgeClassName}>
      {interpretation.label}: {formatPercentage(pct)} ({r >= 0 ? '+' : ''}
      {r.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
    </Badge>
  )
}

export function PositionSpendChart({ items }: PositionSpendChartProps) {
  const data = toScatterData(items)
  const correlation = computePositionSpendCorrelation(items)
  const [selected, setSelected] = useState<ScatterPayload | null>(null)

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
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            type="number"
            dataKey="totalOrders"
            name="Органические заказы"
            tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
            label={{
              value: 'Органические заказы',
              position: 'bottom',
              offset: -5,
              style: { fill: 'var(--color-chart-axis)' },
            }}
          />
          <YAxis
            type="number"
            dataKey="adSpend"
            name="Рекламные расходы"
            tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
            tickFormatter={(v: number) => fmtCurrency(v)}
            label={{
              value: 'Расход (₽)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fill: 'var(--color-chart-axis)' },
            }}
          />
          <ReferenceLine
            x={ordersMedian}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
            label={{
              value: 'Медиана',
              position: 'top',
              fill: 'var(--color-chart-axis)',
              fontSize: 10,
            }}
          />
          <ReferenceLine y={spendMedian} stroke="var(--color-border)" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            name="Товары"
            data={data}
            fill="var(--color-chart-1)"
            opacity={0.6}
            r={5}
            onClick={(point: ScatterPointItem) => {
              // recharts passes the clicked datum (payload: our ScatterPayload)
              if (point?.payload) setSelected(point.payload)
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      {/* RTC: selected point as text (no hover needed); keyboard path = CrossReferenceTable */}
      {selected && (
        <p className="text-sm text-muted-foreground mt-2" data-testid="scatter-selected-point">
          Выбрано: {selected.vendorCode || selected.nmId} — Органические заказы:{' '}
          <span className="font-medium text-foreground">{selected.totalOrders}</span>, Рекламный
          расход:{' '}
          <span className="font-medium text-foreground">{fmtCurrency(selected.adSpend)}</span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="ml-2 inline-flex items-center gap-1 text-xs hover:text-foreground"
            aria-label="Сбросить выбранную точку"
          >
            <X className="h-3 w-3" aria-hidden="true" /> Сбросить
          </button>
        </p>
      )}
    </div>
  )
}
