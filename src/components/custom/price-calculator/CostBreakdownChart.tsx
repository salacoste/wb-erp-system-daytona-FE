'use client'

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

/** Color palette for chart segments */
const CHART_COLORS = {
  commission_wb: '#8b5cf6', // purple
  acquiring: '#22c55e',     // green
  advertising: '#f97316',   // orange
  vat: '#ef4444',          // red
  margin: '#10b981',        // emerald
}

/**
 * Simple horizontal stacked bar chart showing cost composition
 * Uses pure CSS instead of Recharts to avoid dimension issues
 *
 * @example
 * <CostBreakdownChart data={result} />
 */
export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const percentage_breakdown = data.percentage_breakdown

  if (!percentage_breakdown) {
    return null
  }

  const recommended_price = data.result?.recommended_price || 0

  // Calculate percentages for display
  const chartData = useMemo(() => {
    if (recommended_price <= 0) return []

    return [
      {
        name: 'Комиссия WB',
        pct: (percentage_breakdown.commission_wb / recommended_price) * 100,
        rub: percentage_breakdown.commission_wb || 0,
        color: CHART_COLORS.commission_wb,
      },
      {
        name: 'Эквайринг',
        pct: (percentage_breakdown.acquiring / recommended_price) * 100,
        rub: percentage_breakdown.acquiring || 0,
        color: CHART_COLORS.acquiring,
      },
      {
        name: 'Реклама',
        pct: (percentage_breakdown.advertising / recommended_price) * 100,
        rub: percentage_breakdown.advertising || 0,
        color: CHART_COLORS.advertising,
      },
      {
        name: 'НДС',
        pct: (percentage_breakdown.vat / recommended_price) * 100,
        rub: percentage_breakdown.vat || 0,
        color: CHART_COLORS.vat,
      },
      {
        name: 'Маржа',
        pct: (percentage_breakdown.margin / recommended_price) * 100,
        rub: percentage_breakdown.margin || 0,
        color: CHART_COLORS.margin,
      },
    ].filter(item => item.pct > 0)
  }, [percentage_breakdown, recommended_price])

  if (chartData.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm rounded-xl border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Структура затрат</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Horizontal stacked bar */}
          <div className="h-10 flex rounded-lg overflow-hidden">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="h-full transition-all duration-300 hover:opacity-80 group relative"
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: item.color,
                  minWidth: item.pct > 0 ? '2px' : '0',
                }}
                title={`${item.name}: ${item.pct.toFixed(1)}% (${formatCurrency(item.rub)})`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="h-3 w-3 rounded"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
                <span className="text-muted-foreground">
                  ({item.pct.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
