'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { formatCurrency, cn, formatPercentage, formatPercentageInt } from '@/lib/utils'
import type { TwoLevelMargin, TaxType } from '@/types/price-calculator'
import { getMarginColor, getMarginStatus, MARGIN_STATUS_CONFIG } from './margin-status-helpers'
import { MarginProgressBar } from './MarginProgressBar'

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
            {/* margin.pct = target margin (slider step 0.5 → fractional) → 1 decimal, not Int */}
            {formatPercentage(margin.pct, 1)} — {statusConfig.label}
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
                  <p>
                    <span className="text-green-600">●</span> ≥20% — Отлично
                  </p>
                  <p>
                    <span className="text-lime-600">●</span> 10-20% — Хорошо
                  </p>
                  <p>
                    <span className="text-yellow-600">●</span> 5-10% — Низкая
                  </p>
                  <p>
                    <span className="text-red-600">●</span> {'<'}5% — Критично
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className={cn('font-bold text-sm', marginColor)}>{formatCurrency(margin.rub)}</span>
      </div>

      {/* Visual Progress Indicator */}
      <MarginProgressBar marginPct={margin.pct} />

      {/* Profit Display - Card-based hierarchy */}
      <div className="space-y-2 text-sm">
        <ProfitCards
          margin={margin}
          marginColor={marginColor}
          showAfterTax={showAfterTax}
          taxRatePct={taxRatePct}
        />
      </div>
    </div>
  )
}

/** Gross margin and net profit cards */
function ProfitCards({
  margin,
  marginColor,
  showAfterTax,
  taxRatePct,
}: {
  margin: TwoLevelMargin
  marginColor: string
  showAfterTax: boolean
  taxRatePct: number
}) {
  return (
    <>
      {/* Gross Margin Card */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              margin.pct >= 20
                ? 'bg-green-500'
                : margin.pct >= 10
                  ? 'bg-lime-500'
                  : margin.pct >= 5
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            )}
            aria-hidden="true"
          />
          <span className="text-muted-foreground">Валовая прибыль</span>
        </div>
        <span className={cn('font-semibold', marginColor)}>{formatCurrency(margin.rub)}</span>
      </div>

      {/* Net Profit After Tax (profit tax only) */}
      {showAfterTax && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-green-50/50 ml-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              Чистая прибыль{' '}
              <span className="text-xs">(после налога {formatPercentageInt(taxRatePct)})</span>
            </span>
          </div>
          <span className="font-semibold text-green-600">
            {formatCurrency(margin.afterTax ?? 0)}
          </span>
        </div>
      )}
    </>
  )
}
