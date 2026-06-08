'use client'

/**
 * ElasticitySkuChart — theoretical demand curve from elasticity coefficient.
 * Renders a recharts AreaChart showing price vs estimated demand,
 * with a reference line for profit-maximizing price.
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface ElasticitySkuChartProps {
  elasticity: number
  profitMaxPrice: number | null
}

/**
 * Generate theoretical demand curve points from constant-elasticity model.
 * demand = baseDemand * (price / basePrice)^elasticity
 * We normalize baseDemand=100 at basePrice (center of range).
 */
function generateCurvePoints(elasticity: number, profitMaxPrice: number | null) {
  const points = []
  const basePrice = profitMaxPrice ?? 1000
  const minPrice = Math.max(basePrice * 0.5, 1)
  const maxPrice = basePrice * 1.5
  const steps = 20
  const step = (maxPrice - minPrice) / steps

  for (let i = 0; i <= steps; i++) {
    const price = minPrice + step * i
    // Constant-elasticity demand: Q = Q0 * (P / P0)^e
    const demand = 100 * Math.pow(price / basePrice, elasticity)
    // Revenue = P * Q, normalized
    const revenue = (price * demand) / 100
    points.push({
      price: Math.round(price * 100) / 100,
      demand: Math.round(Math.max(demand, 0) * 10) / 10,
      revenue: Math.round(revenue * 100) / 100,
    })
  }
  return points
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number; color: string }>
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background p-3 text-sm shadow-md">
      <p className="font-medium mb-1">{formatCurrency(label ?? 0)}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'demand'
            ? `Спрос: ${formatPercentage(p.value, 1)}`
            : `Выручка: ${formatCurrency(p.value)}`}
        </p>
      ))}
    </div>
  )
}

export function ElasticitySkuChart({ elasticity, profitMaxPrice }: ElasticitySkuChartProps) {
  const data = generateCurvePoints(elasticity, profitMaxPrice)

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Кривая эластичности спроса</h4>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="price"
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            label={{ value: 'Цена', position: 'insideBottom', offset: -2, fontSize: 11 }}
          />
          <YAxis
            yAxisId="demand"
            tick={{ fontSize: 11 }}
            label={{ value: 'Спрос (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            yAxisId="demand"
            type="monotone"
            dataKey="demand"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.15}
            name="Спрос"
            strokeWidth={2}
          />
          {profitMaxPrice !== null && (
            <ReferenceLine
              yAxisId="demand"
              x={profitMaxPrice}
              stroke="#22C55E"
              strokeWidth={2}
              strokeDasharray="6 3"
              label={{
                value: `Оптимум: ${formatCurrency(profitMaxPrice)}`,
                fontSize: 11,
                fill: '#22C55E',
                position: 'top',
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
