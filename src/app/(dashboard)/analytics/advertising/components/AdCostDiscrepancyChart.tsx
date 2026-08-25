'use client'

/**
 * Ad Cost Discrepancy Chart — Story 73.9-FE
 * Grouped bar chart comparing Layer 1 (platform spend) vs Layer 3 (actual WB deduction).
 * Shows side-by-side bars for visual comparison with delta annotation.
 */

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import { AD_COST_LAYERS, calculateDiscrepancy } from './ad-cost-discrepancy-config'
import { ResponsiveChartFrame } from '@/components/custom/analytics/ResponsiveChartFrame'

interface AdCostDiscrepancyChartProps {
  platformSpend: number | null
  actualDeduction: number | null
  isLoading?: boolean
}

interface ChartDataItem {
  name: string
  value: number
  color: string
}

/** Russian-locale compact currency formatter for chart axis ticks */
function formatCompactRub(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toFixed(1).replace('.', ',')
    return `${sign}${v} млн ₽`
  }
  if (abs >= 1_000) {
    const v = Math.round(abs / 1_000)
    return `${sign}${v} тыс ₽`
  }
  return `${sign}${abs} ₽`
}

function tooltipNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value) || 0
}

export function AdCostDiscrepancyChart({
  platformSpend,
  actualDeduction,
  isLoading,
}: AdCostDiscrepancyChartProps) {
  const chartData = useMemo<ChartDataItem[]>(() => {
    const items: ChartDataItem[] = []
    const platformLayer = AD_COST_LAYERS.find(l => l.key === 'platform')
    const actualLayer = AD_COST_LAYERS.find(l => l.key === 'actual')

    if (!platformLayer || !actualLayer) return items

    if (platformSpend != null) {
      items.push({ name: platformLayer.label, value: platformSpend, color: platformLayer.color })
    }
    if (actualDeduction != null) {
      items.push({ name: actualLayer.label, value: actualDeduction, color: actualLayer.color })
    }
    return items
  }, [platformSpend, actualDeduction])

  if (isLoading) return <Skeleton className="h-48 w-full rounded-lg" />
  if (chartData.length < 2) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Сравнение расходов</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveChartFrame
          label="Сравнение рекламных расходов: платформа и факт"
          className="h-48 min-h-[192px]"
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={1}
            minHeight={1}
            initialDimension={{ width: 1, height: 1 }}
          >
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 30, bottom: 8, left: 10 }}
            >
              {/* Story 170.1: grid/axis hex → border/chart-axis/foreground tokens */}
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={formatCompactRub}
                tick={{ fontSize: 12, fill: 'var(--color-chart-axis)' }}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 13, fill: 'var(--color-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
              <Tooltip
                formatter={value => [formatCurrency(tooltipNumber(value)), 'Расход']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={36} animationDuration={300}>
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ResponsiveChartFrame>
        {/* Story 170.1: non-hover data alternative (169.11 sr-only canon).
            Third layer (Скорректированная) is unavailable by config — the card
            renders its "Скоро" text; here only the two charted layers appear. */}
        <table className="sr-only">
          <caption>Сравнение рекламных расходов по слоям, рубли</caption>
          <thead>
            <tr>
              <th scope="col">Слой</th>
              <th scope="col">Расход, ₽</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map(entry => (
              <tr key={entry.name}>
                <th scope="row">{entry.name}</th>
                <td>{formatCurrency(entry.value)}</td>
              </tr>
            ))}
            {(() => {
              const delta = calculateDiscrepancy(actualDeduction, platformSpend)
              return (
                delta && (
                  <tr>
                    <th scope="row">Изменение платформа → факт</th>
                    <td>{delta.comparison.formattedPercentage}</td>
                  </tr>
                )
              )
            })()}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
