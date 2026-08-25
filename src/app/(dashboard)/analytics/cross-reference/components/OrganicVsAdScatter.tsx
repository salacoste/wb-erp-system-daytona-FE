'use client'

/**
 * Organic vs Ad Scatter Chart — Epic 121 Story 121.1
 * Scatter plot correlating organic orders (X) with ad spend (Y).
 * Bubble size encodes ad clicks. Color distinguishes channel.
 * Story 170.6-FE: hex channel fills → categorical chart-N tokens (single-source
 * channel map), tooltip → bg-popover canon, grid/axis → border/chart-axis tokens,
 * selected-point detail line (RTC — keyboard users get the table evidence).
 */

import { useState } from 'react'
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
import { X } from 'lucide-react'
import type { ScatterPointItem } from 'recharts/types/cartesian/Scatter'
import type { CrossReferenceItem, Channel } from '../utils/cross-reference-utils'
import { fmtCurrency } from '../utils/cross-reference-utils'
import { CHANNEL_STYLES } from './channel-styling'

const CHANNEL_LABELS: Record<string, string> = {
  organic: 'Органика',
  ad: 'Реклама',
  both: 'Оба канала',
}

const CHANNELS: Channel[] = ['organic', 'ad', 'both']

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
    <div className="rounded-md border bg-popover text-popover-foreground px-3 py-2 text-sm shadow-md space-y-1">
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
  const [selected, setSelected] = useState<ScatterPayload | null>(null)

  if (data.length === 0) return null

  const grouped = CHANNELS.map(channel => ({
    channel,
    fill: CHANNEL_STYLES[channel].chartFill,
    points: data.filter(d => d.channel === channel),
  }))

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Органика vs Реклама</h2>
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
              value: 'Рекламные расходы (₽)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fill: 'var(--color-chart-axis)' },
            }}
          />
          <ZAxis type="number" dataKey="adClicks" range={[40, 400]} name="Клики" />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={(value: string) => CHANNEL_LABELS[value] ?? value} />
          {grouped.map(g => (
            <Scatter
              key={g.channel}
              name={g.channel}
              data={g.points}
              fill={g.fill}
              opacity={0.7}
              onClick={(point: ScatterPointItem) => {
                // recharts passes the clicked datum (payload: our ScatterPayload)
                if (point?.payload) setSelected(point.payload)
              }}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      {/* RTC: selected point as text (no hover needed); keyboard path = CrossReferenceTable */}
      {selected && (
        <p className="text-sm text-muted-foreground mt-2" data-testid="scatter-selected-point">
          Выбрано: {selected.vendorCode || selected.nmId} — Заказы:{' '}
          <span className="font-medium text-foreground">{selected.totalOrders}</span>, Расход:{' '}
          <span className="font-medium text-foreground">{fmtCurrency(selected.adSpend)}</span>,
          Клики: <span className="font-medium text-foreground">{selected.adClicks}</span>
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
