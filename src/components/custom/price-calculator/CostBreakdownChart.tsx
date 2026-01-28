'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import type { PriceCalculatorResponse } from '@/types/price-calculator'
import { useCallback, useMemo, useRef, useState, useEffect } from 'react'
import {
  buildAriaLabel,
  buildChartSegments,
  calcSegmentWidths,
  formatPctRu,
  type ChartInputParams,
  type ChartSegment,
} from './cost-breakdown-helpers'

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

/** Bar segment rendering with tooltips and gap before margin */
function ChartBar({
  segments,
  widths,
  barRef,
  ariaLabel,
  recommendedPrice,
}: {
  segments: ChartSegment[]
  widths: number[]
  barRef: React.RefObject<HTMLDivElement | null>
  ariaLabel: string
  recommendedPrice: number
}) {
  return (
    <TooltipProvider delayDuration={200}>
      {/* #3: ARIA role="img" with descriptive label */}
      <div
        ref={barRef}
        className="h-10 flex rounded-lg overflow-hidden"
        role="img"
        aria-label={ariaLabel}
      >
        {segments.map((seg, i) => (
          <SegmentBar
            key={seg.key}
            segment={seg}
            widthPct={widths[i] ?? seg.pct}
            recommendedPrice={recommendedPrice}
            isLastCost={!seg.isMargin && segments[i + 1]?.isMargin}
          />
        ))}
      </div>
    </TooltipProvider>
  )
}

/** Single bar segment with tooltip (#6) and gap before margin (#5) */
function SegmentBar({
  segment,
  widthPct,
  recommendedPrice,
  isLastCost,
}: {
  segment: ChartSegment
  widthPct: number
  recommendedPrice: number
  isLastCost: boolean
}) {
  const sharePct = recommendedPrice > 0 ? (segment.rub / recommendedPrice) * 100 : 0

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* #3: role="presentation" on individual segments */}
        <div
          role="presentation"
          className="h-full transition-all duration-300 hover:opacity-80"
          style={{
            width: `${widthPct}%`,
            backgroundColor: segment.color,
            // #5: 3px white gap before margin segment
            marginRight: isLastCost ? '3px' : '0',
          }}
        />
      </TooltipTrigger>
      {/* #6: shadcn Tooltip with detailed info */}
      <TooltipContent size="md">
        <div className="space-y-1">
          <p className="font-medium">{segment.label}</p>
          <p>{formatCurrency(segment.rub)}</p>
          <p className="text-slate-400">{formatPctRu(sharePct)}% от цены</p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

/** Legend with ruble values (#2) and accessible text (#3) */
function ChartLegend({ segments }: { segments: ChartSegment[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs">
      {segments.map(seg => (
        <div key={seg.key} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded shrink-0"
            style={{ backgroundColor: seg.color }}
            aria-hidden="true"
          />
          {/* #2: Ruble amount primary (bold), percentage secondary */}
          <span className="font-medium">{seg.label}:</span>
          <span className="font-semibold">{formatCurrency(seg.rub)}</span>
          <span className="text-muted-foreground">({formatPctRu(seg.pct)}%)</span>
        </div>
      ))}
    </div>
  )
}
