'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PriceCalculatorResponse } from '@/types/price-calculator'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import {
  buildAriaLabel,
  buildChartSegments,
  calcSegmentWidths,
  type ChartInputParams,
} from './cost-breakdown-helpers'
import { ChartBar, ChartLegend } from './CostChartParts'

/**
 * Props for CostBreakdownChart component
 * Updated: accepts input params for dynamic labels (#1)
 */
export interface CostBreakdownChartProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse
  /** User input percentages for dynamic labels */
  inputParams?: ChartInputParams
}

/**
 * Horizontal stacked bar chart showing price structure
 * Renamed: "Структура цены" (includes margin, not just costs)
 *
 * Improvements implemented:
 * - #1: Dynamic labels from user inputs
 * - #2: Ruble values in legend
 * - #3: ARIA accessibility
 * - #4: Renamed to "Структура цены"
 * - #5: Visual gap before margin
 * - #6: shadcn Tooltip instead of native title
 * - #7: Minimum segment width (24px)
 * - #8: Segments sorted by size (margin always last)
 * - #9: Color-blind safe palette
 */
export function CostBreakdownChart({ data, inputParams }: CostBreakdownChartProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [barWidth, setBarWidth] = useState(400)

  const percentage_breakdown = data.percentage_breakdown
  if (!percentage_breakdown) return null

  const recommendedPrice = data.result?.recommended_price || 0

  const params: ChartInputParams = inputParams ?? {
    commissionPct: percentage_breakdown.commission_pct ?? 15,
    acquiringPct: 1.5,
    drrPct: 0,
    vatPct: 0,
  }

  const segments = useMemo(
    () => buildChartSegments(percentage_breakdown, recommendedPrice, params),
    [percentage_breakdown, recommendedPrice, params]
  )

  const ariaLabel = useMemo(() => buildAriaLabel(segments), [segments])

  const widths = useMemo(() => calcSegmentWidths(segments, barWidth), [segments, barWidth])

  // Measure bar container width for min-width calculations
  const measureBar = useCallback(() => {
    if (barRef.current) setBarWidth(barRef.current.offsetWidth)
  }, [])

  useEffect(() => {
    measureBar()
    window.addEventListener('resize', measureBar)
    return () => window.removeEventListener('resize', measureBar)
  }, [measureBar])

  if (segments.length === 0) return null

  return (
    <Card className="shadow-sm rounded-xl border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        {/* #4: Renamed to "Структура цены" */}
        <CardTitle className="text-lg">Структура цены</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ChartBar
            segments={segments}
            widths={widths}
            barRef={barRef}
            ariaLabel={ariaLabel}
            recommendedPrice={recommendedPrice}
          />
          <ChartLegend segments={segments} />
        </div>
      </CardContent>
    </Card>
  )
}
