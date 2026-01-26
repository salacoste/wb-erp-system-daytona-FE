'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import type { TwoLevelMargin, TaxType } from '@/types/price-calculator'

/**
 * Props for MarginSection component
 */
export interface MarginSectionProps {
  /** Margin breakdown data */
  margin: TwoLevelMargin
  /** Tax type for conditional display */
  taxType: TaxType
  /** Tax rate for display */
  taxRatePct: number
}

/**
 * Get margin health color based on percentage
 */
function getMarginColor(marginPct: number): string {
  if (marginPct >= 20) return 'text-green-600'
  if (marginPct >= 10) return 'text-yellow-600'
  if (marginPct >= 5) return 'text-orange-600'
  return 'text-red-600'
}

/** Margin status configuration for badges */
const MARGIN_STATUS_CONFIG = {
  excellent: { label: 'Отлично', bgClass: 'bg-green-100', textClass: 'text-green-700' },
  good: { label: 'Хорошо', bgClass: 'bg-lime-100', textClass: 'text-lime-700' },
  warning: { label: 'Низкая', bgClass: 'bg-yellow-100', textClass: 'text-yellow-700' },
  critical: { label: 'Критично', bgClass: 'bg-red-100', textClass: 'text-red-700' },
} as const

/** Get margin status based on percentage */
function getMarginStatus(pct: number): keyof typeof MARGIN_STATUS_CONFIG {
  if (pct >= 20) return 'excellent'
  if (pct >= 10) return 'good'
  if (pct >= 5) return 'warning'
  return 'critical'
}

/**
 * Margin display section
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Shows margin information:
 * - Gross margin (% and rub) with status badge
 * - Visual progress indicator with color coding
 * - Net profit after tax (if profit tax type)
 *
 * @example
 * <MarginSection
 *   margin={margin}
 *   taxType="profit"
 *   taxRatePct={15}
 * />
 */
export function MarginSection({ margin, taxType, taxRatePct }: MarginSectionProps) {
  const marginColor = getMarginColor(margin.pct)
  const status = getMarginStatus(margin.pct)
  const statusConfig = MARGIN_STATUS_CONFIG[status]
  const showAfterTax = taxType === 'profit' && margin.afterTax !== null

  return (
    <div className="space-y-3" data-testid="margin-section">
      {/* Section Header with Badge and Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">МАРЖА</span>
          <Badge className={cn('text-xs', statusConfig.bgClass, statusConfig.textClass)}>
            {margin.pct}% — {statusConfig.label}
          </Badge>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info
                  className="h-3.5 w-3.5 text-muted-foreground cursor-help"
                  aria-label="Информация об уровнях маржи"
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">Уровни маржи:</p>
                  <p><span className="text-green-600">●</span> ≥20% — Отлично</p>
                  <p><span className="text-lime-600">●</span> 10-20% — Хорошо</p>
                  <p><span className="text-yellow-600">●</span> 5-10% — Низкая</p>
                  <p><span className="text-red-600">●</span> {'<'}5% — Критично</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={cn('font-bold text-sm', marginColor)}>{formatCurrency(margin.rub)}</span>
      </div>

      {/* Visual Progress Indicator with color coding */}
      <div className="space-y-1.5">
        <div className="relative h-3">
          {/* Background track */}
          <div className="absolute inset-0 rounded-full bg-muted overflow-hidden">
            {/* Colored fill */}
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                margin.pct >= 20 ? 'bg-green-500' :
                margin.pct >= 10 ? 'bg-lime-500' :
                margin.pct >= 5 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${Math.min((margin.pct / 30) * 100, 100)}%` }}
              role="progressbar"
              aria-valuenow={margin.pct}
              aria-valuemin={0}
              aria-valuemax={30}
              aria-label={`Маржа ${margin.pct}%`}
            />
          </div>
          {/* Threshold markers at 10% and 20% */}
          <div
            className="absolute top-0 h-full w-px bg-muted-foreground/30"
            style={{ left: '33.3%' }}
            aria-hidden="true"
          />
          <div
            className="absolute top-0 h-full w-px bg-muted-foreground/30"
            style={{ left: '66.6%' }}
            aria-hidden="true"
          />
        </div>
        {/* Scale labels */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span className="text-yellow-600">10%</span>
          <span className="text-green-600">20%</span>
          <span>30%+</span>
        </div>
      </div>

      {/* Profit Display - Card-based hierarchy */}
      <div className="space-y-2 text-sm">
        {/* Gross Margin Card */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                margin.pct >= 20 ? 'bg-green-500' :
                margin.pct >= 10 ? 'bg-lime-500' :
                margin.pct >= 5 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Валовая прибыль</span>
          </div>
          <span className={cn('font-semibold', marginColor)}>
            {formatCurrency(margin.rub)}
          </span>
        </div>

        {/* Net Profit After Tax (profit tax only) */}
        {showAfterTax && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-green-50/50 ml-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
              <span className="text-muted-foreground">
                Чистая прибыль <span className="text-xs">(после налога {taxRatePct}%)</span>
              </span>
            </div>
            <span className="font-semibold text-green-600">
              {formatCurrency(margin.afterTax ?? 0)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
