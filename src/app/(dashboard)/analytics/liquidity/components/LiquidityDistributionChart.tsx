'use client'

/**
 * Liquidity Distribution Pie Chart
 * Visual breakdown of SKU distribution across 4 liquidity categories
 * Uses recharts PieChart in donut mode with Russian labels.
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LiquidityDistribution } from '@/types/liquidity'
import { transformDistributionForChart, formatCurrency } from '@/lib/liquidity-utils'
import { formatPercentage } from '@/lib/utils'

interface ChartRow {
  category: string
  name: string
  value: number
  count: number
  stockValue: number
  color: string
  [key: string]: unknown
}

interface LiquidityDistributionChartProps {
  distribution: LiquidityDistribution
}

/** Custom recharts tooltip for distribution pie chart */
function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartRow }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium" style={{ color: d.color }}>
        {d.name}
      </p>
      <p className="text-muted-foreground">Доля: {formatPercentage(d.value)}</p>
      <p className="text-muted-foreground">SKU: {d.count}</p>
      <p className="text-muted-foreground">Стоимость: {formatCurrency(d.stockValue)}</p>
    </div>
  )
}

/** Custom legend renderer with Russian labels */
function DistributionLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
      {payload.map(entry => (
        <span key={entry.value} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  )
}

/**
 * Donut pie chart showing liquidity category distribution by inventory value.
 * Placed below the 4-card grid as a visual summary.
 */
export function LiquidityDistributionChart({ distribution }: LiquidityDistributionChartProps) {
  const rawData = transformDistributionForChart(distribution)
  const chartData: ChartRow[] = rawData.map(d => ({ ...d }))
  const totalSku = chartData.reduce((sum, d) => sum + d.count, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Распределение по ликвидности</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData as unknown as Record<string, unknown>[]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                strokeWidth={0}
              >
                {chartData.map(entry => (
                  <Cell key={entry.category} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DistributionTooltip />} />
              <Legend content={<DistributionLegend />} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm text-muted-foreground mt-1">Всего артикулов: {totalSku}</p>
        </div>
      </CardContent>
    </Card>
  )
}
