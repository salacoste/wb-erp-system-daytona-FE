'use client'

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { PriceCalculatorResponse } from '@/types/price-calculator'
import { useMemo } from 'react'

/**
 * Props for CostBreakdownChart component
 */
export interface CostBreakdownChartProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse
}

/** Color palette for chart segments - matches Epic 24 storage colors */
const CHART_COLORS = {
  commission_wb: '#8b5cf6', // purple
  acquiring: '#22c55e',     // green
  advertising: '#f97316',   // orange
  vat: '#ef4444',          // red
  margin: '#10b981',        // emerald
  fallback: '#94a3b8',      // gray
}

/**
 * Custom tooltip for the stacked bar chart
 */
function ChartTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: { name: string; value: number; rub: number } }>
}) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <p className="text-sm font-medium">{data?.name || 'Unknown'}</p>
      <p className="text-xs text-muted-foreground">
        {data?.value?.toFixed(2) || '0.00'}% ({formatCurrency(data?.rub || 0)})
      </p>
    </div>
  )
}

/**
 * Stacked bar chart showing cost composition
 * Uses Recharts library following ExpenseChart.tsx pattern
 *
 * @example
 * <CostBreakdownChart data={result} />
 */
export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  // percentage_breakdown is now at root level of API response
  const percentage_breakdown = data.percentage_breakdown

  // Guard clause for incomplete data
  if (!percentage_breakdown) {
    return null
  }

  // Memoize chart data to prevent unnecessary re-renders
  // API returns simple numbers, need to calculate percentages for display
  const recommended_price = data.result?.recommended_price || 0
  const chartData = useMemo(
    () => [
      {
        name: 'Комиссия WB',
        value: recommended_price > 0 ? (percentage_breakdown.commission_wb / recommended_price * 100) : 0,
        rub: percentage_breakdown.commission_wb || 0,
        fill: CHART_COLORS.commission_wb,
      },
      {
        name: 'Эквайринг',
        value: recommended_price > 0 ? (percentage_breakdown.acquiring / recommended_price * 100) : 0,
        rub: percentage_breakdown.acquiring || 0,
        fill: CHART_COLORS.acquiring,
      },
      {
        name: 'Реклама',
        value: recommended_price > 0 ? (percentage_breakdown.advertising / recommended_price * 100) : 0,
        rub: percentage_breakdown.advertising || 0,
        fill: CHART_COLORS.advertising,
      },
      {
        name: 'НДС',
        value: recommended_price > 0 ? (percentage_breakdown.vat / recommended_price * 100) : 0,
        rub: percentage_breakdown.vat || 0,
        fill: CHART_COLORS.vat,
      },
      {
        name: 'Маржа',
        value: recommended_price > 0 ? (percentage_breakdown.margin / recommended_price * 100) : 0,
        rub: percentage_breakdown.margin || 0,
        fill: CHART_COLORS.margin,
      },
    ],
    [percentage_breakdown, recommended_price]
  )

  // Memoize legend data to prevent unnecessary re-renders
  const legendData = useMemo(
    () => [
      { name: 'Комиссия WB', color: CHART_COLORS.commission_wb },
      { name: 'Эквайринг', color: CHART_COLORS.acquiring },
      { name: 'Реклама', color: CHART_COLORS.advertising },
      { name: 'НДС', color: CHART_COLORS.vat },
      { name: 'Маржа (прибыль)', color: CHART_COLORS.margin },
    ],
    []
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Структура затрат</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[{ stack: chartData }]}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <Bar
                  dataKey="stack"
                  stackId="costs"
                  isAnimationActive={false}
                  barSize={40}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {legendData.map((item) => (
              <div key={item.name} className="flex items-center gap-1">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
