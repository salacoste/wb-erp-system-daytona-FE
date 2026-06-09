'use client'

/**
 * Organic vs Ad Scatter Chart — Epic 121 Story 121.1
 * Scatter plot correlating organic orders (X) with ad spend (Y).
 * Bubble size encodes ad clicks. Color distinguishes channel.
 */

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { CrossReferenceItem } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'

/** Semantic colors from the design system (CLAUDE.md) */
const CHANNEL_COLORS: Record<string, string> = {
  organic: '#22C55E',
  ad: '#3B82F6',
  both: '#F59E0B',
}

const CHANNEL_LABELS: Record<string, string> = {
  organic: 'Органика',
  ad: 'Реклама',
  both: 'Оба канала',
}

interface OrganicVsAdScatterProps {
  items: CrossReferenceItem[]
}

interface ScatterPayload {
  nmId: number
  vendorCode: string | null
  totalOrders: number
  adSpend: number
  adClicks: number
  channel: string
}

/** Skip items with 0 orders AND 0 spend (clutters origin). */
function toScatterData(items: CrossReferenceItem[]): ScatterPayload[] {
  return items
    .filter(i => i.totalOrders > 0 || i.adSpend > 0)
    .map(i => ({
      nmId: i.nmId,
      vendorCode: i.vendorCode,
      totalOrders: i.totalOrders,
      adSpend: i.adSpend,
      adClicks: i.adClicks,
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
    <div className="rounded-md border bg-card px-3 py-2 text-sm shadow-md space-y-1">
      <p className="font-semibold">{d.vendorCode || d.nmId}</p>
      <p>
        Заказы: <span className="font-medium">{d.totalOrders}</span>
      </p>
      <p>
        Расход: <span className="font-medium">{fmtCurrency(d.adSpend)}</span>
      </p>
      <p>
        Клики: <span className="font-medium">{d.adClicks}</span>
      </p>
    </div>
  )
}

export function OrganicVsAdScatter({ items }: OrganicVsAdScatterProps) {
  const data = toScatterData(items)

  if (data.length === 0) return null

  const grouped = Object.entries(CHANNEL_COLORS).map(([channel, fill]) => ({
    channel,
    fill,
    points: data.filter(d => d.channel === channel),
  }))

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Органика vs Реклама</h3>
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
              value: 'Рекламные расходы (₽)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
            }}
          />
          <ZAxis type="number" dataKey="adClicks" range={[40, 400]} name="Клики" />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value: string) => CHANNEL_LABELS[value] ?? value} />
          {grouped.map(g => (
            <Scatter key={g.channel} name={g.channel} data={g.points} fill={g.fill} opacity={0.7} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
