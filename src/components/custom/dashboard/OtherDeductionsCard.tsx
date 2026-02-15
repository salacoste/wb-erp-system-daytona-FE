// OtherDeductionsCard - Story 65.15: WB Services Breakdown with custom tooltip
'use client'

import { useCallback, useId, useRef, useState } from 'react'
import { FileText, Info, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison, type TrendDirection } from '@/lib/comparison-helpers'
import { StandardMetricSkeleton } from './MetricCardStates'

function formatRevenuePct(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

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

export interface OtherDeductionsCardProps {
  value: number | null | undefined
  previousValue: number | null | undefined
  revenueTotal: number | null | undefined
  promotionCost: number | null | undefined
  jamCost: number | null | undefined
  otherServicesCost: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

function BreakdownRow({ label, cost }: { label: string; cost: number | null | undefined }) {
  if (cost == null) return null
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-300">{label}</span>
      <span className="text-xs font-medium text-slate-100">{formatCurrency(cost)}</span>
    </div>
  )
}

export function OtherDeductionsCard({
  value,
  previousValue,
  revenueTotal,
  promotionCost,
  jamCost,
  otherServicesCost,
  isLoading = false,
  className,
}: OtherDeductionsCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  const hasValue = value != null
  const displayValue = hasValue ? formatCurrency(value) : '\u2014'
  const comparison =
    value != null && previousValue != null ? calculateComparison(value, previousValue, true) : null
  const revenuePct =
    value != null && revenueTotal != null && revenueTotal > 0 ? (value / revenueTotal) * 100 : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Прочие удержания: ${hasValue ? formatCurrency(value) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Прочие удержания</span>
          </div>
          <DeductionsTooltip
            promotionCost={promotionCost}
            jamCost={jamCost}
            otherServicesCost={otherServicesCost}
          />
        </div>

        <div className="mt-2">
          <span className="text-2xl font-bold text-red-500" data-testid="metric-value">
            {displayValue}
          </span>
        </div>

        {comparison && (
          <div className="mt-2 flex items-center gap-1.5">
            <InlineTrend direction={comparison.direction} />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}

        {revenuePct != null && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">{formatRevenuePct(revenuePct)} от выручки</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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

function DeductionsTooltip({
  promotionCost,
  jamCost,
  otherServicesCost,
}: {
  promotionCost: number | null | undefined
  jamCost: number | null | undefined
  otherServicesCost: number | null | undefined
}) {
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

  const hasData = promotionCost != null || jamCost != null || otherServicesCost != null

  return (
    <div className="relative inline-block">
      <button
        className="text-muted-foreground hover:text-foreground"
        aria-label="Подробнее о прочих удержаниях"
        aria-describedby={open ? tooltipId : undefined}
        data-testid="deductions-tooltip-trigger"
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
          <p className="mb-1.5 text-xs font-medium text-slate-100">Состав удержаний:</p>
          {hasData ? (
            <div className="flex flex-col gap-1">
              <BreakdownRow label="Продвижение" cost={promotionCost} />
              <BreakdownRow label="Джем" cost={jamCost} />
              <BreakdownRow label="Прочие сервисы" cost={otherServicesCost} />
            </div>
          ) : (
            <p className="text-xs text-slate-400">Нет данных</p>
          )}
        </div>
      )}
    </div>
  )
}
