'use client'

/**
 * Product-Level Scatter Chart — Story 121.2-FE
 * X = organic contribution %, Y = ad spend (₽).
 * Four quadrants: "Переплата" (high organic + high spend),
 * "Эффективно" (moderate organic + moderate spend),
 * "Органика сильна" (high organic + low spend),
 * "Возможность" (low organic + low spend).
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
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'

interface ProductScatterChartProps {
  items: CrossReferenceItem[]
}

interface ScatterPayload {
  nmId: number
  vendorCode: string | null
  organicContribution: number
  adSpend: number
  totalOrders: number
}

/** Quadrant thresholds */
const ORGANIC_THRESHOLD = 40
const SPEND_MEDIAN_DIVISOR = 2

function toScatterData(items: CrossReferenceItem[]): ScatterPayload[] {
  return items
    .filter(i => i.organicContribution != null && i.adSpend > 0)
    .map(i => ({
      nmId: i.nmId,
      vendorCode: i.vendorCode,
      organicContribution: i.organicContribution!,
      adSpend: i.adSpend,
      totalOrders: i.totalOrders,
    }))
}

function computeSpendMedian(data: ScatterPayload[]): number {
  if (data.length === 0) return 0
  const sorted = [...data].sort((a, b) => a.adSpend - b.adSpend)
  const mid = Math.floor(sorted.length / SPEND_MEDIAN_DIVISOR)
  return sorted[mid]?.adSpend ?? 0
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
        Органика: <span className="font-medium">{d.organicContribution.toFixed(1)} %</span>
      </p>
      <p>
        Расход: <span className="font-medium">{fmtCurrency(d.adSpend)}</span>
      </p>
      <p>
        Заказы: <span className="font-medium">{d.totalOrders}</span>
      </p>
    </div>
  )
}

/** Quadrant label positions — rendered as text annotations */
const QUADRANT_STYLE = 'text-xs fill-muted-foreground opacity-70'

export function ProductScatterChart({ items }: ProductScatterChartProps) {
  const data = toScatterData(items)

  if (data.length < 2) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Вклад органики vs Расходы на рекламу</h3>
        <p className="text-muted-foreground text-sm">
          Недостаточно данных для построения графика (нужно минимум 2 товара с рекламными расходами)
        </p>
      </div>
    )
  }

  const spendMedian = computeSpendMedian(data)

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Вклад органики vs Расходы на рекламу</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="organicContribution"
            name="Вклад органики (%)"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            label={{
              value: 'Вклад органики (%)',
              position: 'bottom',
              offset: -5,
            }}
          />
          <YAxis
            type="number"
            dataKey="adSpend"
            name="Расход на рекламу"
            tickFormatter={(v: number) => fmtCurrency(v)}
            label={{
              value: 'Расход (₽)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
          />
          {/* Quadrant reference lines */}
          <ReferenceLine x={ORGANIC_THRESHOLD} stroke="#9CA3AF" strokeDasharray="4 4" />
          <ReferenceLine y={spendMedian} stroke="#9CA3AF" strokeDasharray="4 4" />
          <Tooltip content={<CustomTooltip />} />
          <Scatter name="Товары" data={data} fill="#3B82F6" opacity={0.6} r={6} />
          {/* Quadrant labels */}
          <text x={ORGANIC_THRESHOLD + 2} y={16} className={QUADRANT_STYLE}>
            ← Переплата (высокая органика, высокий расход)
          </text>
          <text x={4} y={16} className={QUADRANT_STYLE}>
            Эффективно →
          </text>
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>🔴 Переплата: органика &gt;40 % + высокий расход</span>
        <span>🟡 Органика сильна: органика &gt;40 % + низкий расход</span>
        <span>🟢 Эффективно: органика ≤40 % + умеренный расход</span>
        <span>🔵 Возможность: органика ≤40 % + низкий расход</span>
      </div>
    </div>
  )
}
