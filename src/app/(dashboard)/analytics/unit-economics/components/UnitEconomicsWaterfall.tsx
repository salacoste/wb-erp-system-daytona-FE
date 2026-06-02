'use client'

import { useState } from 'react'
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
import { CustomTooltip, WaterfallLegend } from './WaterfallTooltip'
import { useWaterfallData } from './useWaterfallData'
import { computeWaterfallYDomain } from './waterfall-chart-utils'

/**
 * Unit Economics Waterfall Chart
 * Story 5.3: Cost Breakdown Visualization
 * UX Specs by Sally (2025-12-09)
 *
 * Displays a waterfall chart showing how revenue flows through costs to profit.
 * Can display portfolio-level (all SKUs) or product-level (single SKU) breakdown.
 *
 * Extracted sub-modules (Epic 74 - file size compliance):
 * - waterfall-chart-utils.ts: transformToWaterfallData, WATERFALL_COLORS
 * - WaterfallTooltip.tsx: CustomTooltip, WaterfallLegend
 * - useWaterfallData.ts: useWaterfallData hook (portfolio aggregation)
 */

interface UnitEconomicsWaterfallProps {
  data: UnitEconomicsItem[]
  summary: UnitEconomicsSummary
  selectedSku?: string
  onSelectSku?: (skuId: string | undefined) => void
  /**
   * Backend-driven cost-category ordering from `response.meta.cost_category_order`.
   * Threaded through to `transformToWaterfallData`. When absent, hook falls back
   * to hardcoded order with `console.warn` (Story 96.3-FE).
   */
  categoryOrder?: string[]
}

export function UnitEconomicsWaterfall({
  data,
  summary,
  selectedSku,
  onSelectSku,
  categoryOrder,
}: UnitEconomicsWaterfallProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { selectedItem, waterfallData, legendItems } = useWaterfallData({
    data,
    summary,
    selectedSku,
    categoryOrder,
  })

  // F-44: dynamic Y-domain so COGS>100% / deep-loss bars aren't clipped (was hardcoded [0,100]).
  const yDomain = computeWaterfallYDomain(waterfallData)

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
            <p
              className="text-sm text-muted-foreground mt-1 truncate max-w-[400px]"
              title={chartTitle}
            >
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

      <CardContent
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isCollapsed ? 'h-0 py-0' : 'h-auto'
        )}
      >
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                domain={yDomain}
                tickFormatter={value => `${value}%`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#E5E7EB' }}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#E5E7EB" />

              {/* Invisible bar for stacking (creates waterfall effect) */}
              <Bar dataKey="start" stackId="a" fill="transparent" isAnimationActive={false} />

              {/* Visible bar */}
              <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]} maxBarSize={48}>
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
