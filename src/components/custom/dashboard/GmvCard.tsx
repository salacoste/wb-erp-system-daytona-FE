/**
 * GmvCard -- Story 65.13: GMV / Реализация (Gross Merchandise Value)
 *
 * Shows sales_gross_total from finance-summary (gross sales BEFORE returns).
 * Comparison uses calculateComparison() with inverted=false (higher GMV = better).
 * Blue accent, ShoppingCart icon.
 *
 * Data source: finance-summary.sales_gross_total (already available, no new endpoint)
 *
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-3.md
 */

'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { ShoppingCart, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison, type TrendDirection } from '@/lib/comparison-helpers'
import { StandardMetricSkeleton } from './MetricCardStates'

/** Color mapping for trend indicators -- text-green-500 for positive, text-red-500 for negative */
const TREND_COLORS: Record<TrendDirection, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-muted-foreground',
}

const TREND_ICONS: Record<TrendDirection, typeof TrendingUp> = {
  positive: TrendingUp,
  negative: TrendingDown,
  neutral: Minus,
}

export interface GmvCardProps {
  /** GMV value from finance-summary.sales_gross_total */
  value: number | null | undefined
  /** Previous period GMV for comparison */
  previousValue: number | null | undefined
  /** Loading state */
  isLoading?: boolean
  /** Additional CSS classes */
  className?: string
}

export function GmvCard({
  value,
  previousValue,
  isLoading = false,
  className,
}: GmvCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />

  const hasValue = value != null
  const displayValue = hasValue ? formatCurrency(value) : '\u2014'

  const comparison =
    value != null && previousValue != null ? calculateComparison(value, previousValue, false) : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Реализация: ${hasValue ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Реализация</span>
          </div>
          <GmvTooltip />
        </div>

        <div className="mt-1">
          <span className="text-xl font-bold" data-testid="metric-value">
            {displayValue}
          </span>
        </div>

        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
            <InlineTrend direction={comparison.direction} />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Inline trend icon with text-green-500 / text-red-500 coloring */
function InlineTrend({ direction }: { direction: TrendDirection }) {
  const Icon = TREND_ICONS[direction]
  return (
    <Icon
      data-testid="trend-indicator"
      className={cn('h-3 w-3', TREND_COLORS[direction])}
      aria-hidden="true"
    />
  )
}

/** Custom tooltip explaining GMV metric -- shows on hover/focus */
function GmvTooltip() {
  const [open, setOpen] = useState(false)
  const tooltipId = useId()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }, [])

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 100)
  }, [])

  return (
    <div className="relative inline-block">
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Подробнее о метрике Реализация"
        aria-describedby={open ? tooltipId : undefined}
        data-testid="gmv-tooltip-trigger"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2"
          style={{
            backgroundColor: '#1e293b',
            color: '#f1f5f9',
            padding: '8px 12px',
            borderRadius: '6px',
            minWidth: '200px',
          }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <p className="text-xs text-slate-100">Полный объём реализации до вычета возвратов</p>
        </div>
      )}
    </div>
  )
}
