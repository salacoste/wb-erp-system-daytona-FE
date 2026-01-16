'use client'

import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UnitEconomicsItem, UnitEconomicsSummary } from '@/types/unit-economics'
import { formatCurrency, formatPercentage } from '@/lib/unit-economics-utils'

/**
 * Unit Economics Waterfall Chart
 * Story 5.3: Cost Breakdown Visualization
 * UX Specs by Sally (2025-12-09)
 *
 * Displays a waterfall chart showing how revenue flows through costs to profit.
 * Can display portfolio-level (all SKUs) or product-level (single SKU) breakdown.
 */

interface WaterfallDataPoint {
  name: string
  value: number
  start: number
  end: number
  fill: string
  isProfit: boolean
  isRevenue: boolean
  percentage: number
  absoluteValue: number
}

interface UnitEconomicsWaterfallProps {
  data: UnitEconomicsItem[]
  summary: UnitEconomicsSummary
  selectedSku?: string
  onSelectSku?: (skuId: string | undefined) => void
}

// Color scheme from UX specs
const COLORS = {
  revenue: '#2196F3',     // Blue - starting point
  cogs: '#FF9800',        // Orange - significant cost
  commission: '#9C27B0',  // Purple - WB brand
  logistics_delivery: '#00BCD4', // Teal - movement
  logistics_return: '#4DD0E1',   // Cyan - related to delivery
  storage: '#795548',     // Brown - warehouse
  paid_acceptance: '#FFC107',    // Amber - processing
  penalties: '#F44336',   // Red - negative
  other_deductions: '#9E9E9E',   // Gray - misc
  advertising: '#14B8A6', // Teal - marketing
  profit: '#4CAF50',      // Green - positive outcome
  loss: '#F44336',        // Red - negative outcome
}

function transformToWaterfallData(
  revenue: number,
  costsPct: Record<string, number>,
  costsRub: Record<string, number>
): WaterfallDataPoint[] {
  const dataPoints: WaterfallDataPoint[] = []
  let runningTotal = 100 // Start at 100%

  // Revenue bar (full height from 0)
  dataPoints.push({
    name: 'Выручка',
    value: 100,
    start: 0,
    end: 100,
    fill: COLORS.revenue,
    isProfit: false,
    isRevenue: true,
    percentage: 100,
    absoluteValue: revenue,
  })

  // Cost categories (deductions)
  const costCategories = [
    { key: 'cogs', label: 'COGS', color: COLORS.cogs },
    { key: 'commission', label: 'Комиссия', color: COLORS.commission },
    { key: 'logistics_delivery', label: 'Доставка', color: COLORS.logistics_delivery },
    { key: 'logistics_return', label: 'Возвраты', color: COLORS.logistics_return },
    { key: 'storage', label: 'Хранение', color: COLORS.storage },
    { key: 'paid_acceptance', label: 'Приёмка', color: COLORS.paid_acceptance },
    { key: 'penalties', label: 'Штрафы', color: COLORS.penalties },
    { key: 'other_deductions', label: 'Прочее', color: COLORS.other_deductions },
    { key: 'advertising', label: 'Реклама', color: COLORS.advertising },
  ]

  for (const cat of costCategories) {
    const pct = costsPct[cat.key] || 0
    const rub = costsRub[cat.key] || 0

    if (pct > 0.5) { // Only show if > 0.5%
      const newTotal = runningTotal - pct
      dataPoints.push({
        name: cat.label,
        value: pct,
        start: newTotal,
        end: runningTotal,
        fill: cat.color,
        isProfit: false,
        isRevenue: false,
        percentage: pct,
        absoluteValue: rub,
      })
      runningTotal = newTotal
    }
  }

  // Profit/Loss bar (from 0 to remaining)
  const profitPct = runningTotal
  const profitRub = revenue * (profitPct / 100)
  dataPoints.push({
    name: profitPct >= 0 ? 'Прибыль' : 'Убыток',
    value: Math.abs(profitPct),
    start: 0,
    end: Math.max(0, profitPct),
    fill: profitPct >= 0 ? COLORS.profit : COLORS.loss,
    isProfit: true,
    isRevenue: false,
    percentage: profitPct,
    absoluteValue: profitRub,
  })

  return dataPoints
}

// Custom tooltip component
function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WaterfallDataPoint }> }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: data.fill }}
        />
        <span className="font-semibold text-gray-900">{data.name}</span>
      </div>
      <div className="space-y-1">
        <div className="text-lg font-bold text-gray-900">
          {formatCurrency(data.absoluteValue)}
        </div>
        <div className="text-sm text-gray-600">
          {formatPercentage(data.percentage)} от выручки
        </div>
      </div>
    </div>
  )
}

// Custom legend component
function WaterfallLegend({ items }: { items: Array<{ name: string; color: string }> }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4 px-4">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-gray-600">{item.name}</span>
        </div>
      ))}
    </div>
  )
}

export function UnitEconomicsWaterfall({
  data,
  summary,
  selectedSku,
  onSelectSku,
}: UnitEconomicsWaterfallProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Find selected item or use summary
  const selectedItem = useMemo(() => {
    if (selectedSku) {
      return data.find(item => item.sku_id === selectedSku)
    }
    return null
  }, [data, selectedSku])

  // Transform data for waterfall
  const waterfallData = useMemo(() => {
    if (selectedItem) {
      // Single SKU waterfall
      // Cast to Record<string, number> for index access in transformToWaterfallData
      return transformToWaterfallData(
        selectedItem.revenue,
        selectedItem.costs_pct as unknown as Record<string, number>,
        selectedItem.costs_rub as unknown as Record<string, number>
      )
    }

    // Portfolio-level: calculate weighted averages
    const totalRevenue = summary.total_revenue

    // Aggregate costs from all items
    const aggregateCostsPct: Record<string, number> = {
      cogs: summary.avg_cogs_pct,
      commission: 0,
      logistics_delivery: 0,
      logistics_return: 0,
      storage: 0,
      paid_acceptance: 0,
      penalties: 0,
      other_deductions: 0,
      advertising: 0,
    }

    const aggregateCostsRub: Record<string, number> = {}

    // Calculate weighted average percentages from all items
    if (data.length > 0 && totalRevenue > 0) {
      let totalCogs = 0
      let totalCommission = 0
      let totalLogisticsDelivery = 0
      let totalLogisticsReturn = 0
      let totalStorage = 0
      let totalPaidAcceptance = 0
      let totalPenalties = 0
      let totalOther = 0
      let totalAdvertising = 0

      for (const item of data) {
        const weight = item.revenue / totalRevenue
        totalCogs += item.costs_pct.cogs * weight
        totalCommission += item.costs_pct.commission * weight
        totalLogisticsDelivery += item.costs_pct.logistics_delivery * weight
        totalLogisticsReturn += item.costs_pct.logistics_return * weight
        totalStorage += item.costs_pct.storage * weight
        totalPaidAcceptance += item.costs_pct.paid_acceptance * weight
        totalPenalties += item.costs_pct.penalties * weight
        totalOther += item.costs_pct.other_deductions * weight
        totalAdvertising += item.costs_pct.advertising * weight
      }

      aggregateCostsPct.cogs = totalCogs
      aggregateCostsPct.commission = totalCommission
      aggregateCostsPct.logistics_delivery = totalLogisticsDelivery
      aggregateCostsPct.logistics_return = totalLogisticsReturn
      aggregateCostsPct.storage = totalStorage
      aggregateCostsPct.paid_acceptance = totalPaidAcceptance
      aggregateCostsPct.penalties = totalPenalties
      aggregateCostsPct.other_deductions = totalOther
      aggregateCostsPct.advertising = totalAdvertising
    }

    // Calculate absolute values
    for (const key of Object.keys(aggregateCostsPct)) {
      aggregateCostsRub[key] = totalRevenue * (aggregateCostsPct[key] / 100)
    }

    return transformToWaterfallData(totalRevenue, aggregateCostsPct, aggregateCostsRub)
  }, [data, summary, selectedItem])

  // Legend items
  const legendItems = useMemo(() => {
    const items = waterfallData
      .filter(d => !d.isRevenue && !d.isProfit && d.percentage > 0.5)
      .map(d => ({ name: d.name, color: d.fill }))

    // Add revenue and profit
    return [
      { name: 'Выручка', color: COLORS.revenue },
      ...items,
      { name: waterfallData[waterfallData.length - 1]?.name || 'Прибыль', color: waterfallData[waterfallData.length - 1]?.fill || COLORS.profit },
    ]
  }, [waterfallData])

  // Chart title
  const chartTitle = selectedItem
    ? `${selectedItem.product_name} (${selectedItem.sku_id})`
    : 'Все товары (портфель)'

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              Структура затрат
              {selectedSku && onSelectSku && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onSelectSku(undefined)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Сбросить
                </Button>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1 truncate max-w-[400px]" title={chartTitle}>
              {chartTitle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Развернуть
              </>
            ) : (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Свернуть
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className={cn(
        'transition-all duration-300 overflow-hidden',
        isCollapsed ? 'h-0 py-0' : 'h-auto'
      )}>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#E5E7EB" />

              {/* Invisible bar for stacking (creates waterfall effect) */}
              <Bar
                dataKey="start"
                stackId="a"
                fill="transparent"
                isAnimationActive={false}
              />

              {/* Visible bar */}
              <Bar
                dataKey="value"
                stackId="a"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                {waterfallData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <WaterfallLegend items={legendItems} />
      </CardContent>
    </Card>
  )
}
