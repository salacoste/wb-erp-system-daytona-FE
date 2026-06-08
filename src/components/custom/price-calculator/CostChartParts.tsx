'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/utils'
import { formatPctRu, type ChartSegment } from './cost-breakdown-helpers'

/**
 * Sub-components for CostBreakdownChart
 * Extracted for file-size compliance
 */

/** Single bar segment with tooltip and gap before margin */
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
        {/* role="presentation" on individual segments */}
        <div
          role="presentation"
          className="h-full transition-all duration-300 hover:opacity-80"
          style={{
            width: `${widthPct}%`,
            backgroundColor: segment.color,
            // 3px white gap before margin segment
            marginRight: isLastCost ? '3px' : '0',
          }}
        />
      </TooltipTrigger>
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

/** Bar segment rendering with tooltips and gap before margin */
export function ChartBar({
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
      {/* ARIA role="img" with descriptive label */}
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

/** Legend with ruble values and accessible text */
export function ChartLegend({ segments }: { segments: ChartSegment[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-xs">
      {segments.map(seg => (
        <div key={seg.key} className="flex items-center gap-1.5">
          <div
            className="h-3 w-3 rounded shrink-0"
            style={{ backgroundColor: seg.color }}
            aria-hidden="true"
          />
          {/* Ruble amount primary (bold), percentage secondary */}
          <span className="font-medium">{seg.label}:</span>
          <span className="font-semibold">{formatCurrency(seg.rub)}</span>
          <span className="text-muted-foreground">({formatPctRu(seg.pct)}%)</span>
        </div>
      ))}
    </div>
  )
}
