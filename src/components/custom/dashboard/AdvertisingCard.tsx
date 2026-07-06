/**
 * Advertising Card — СЕКЦИЯ 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА (правая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows ad spend + ROAS, ДРР (% of sales), ДРРз (% of orders revenue).
 * Story 65.4: added ordersRevenue prop + DRRz calculation.
 * Source: advertising endpoint summary + fulfillment total.
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md Story 65.4
 */

'use client'

import { Megaphone, Info, HelpCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency, formatPercentage, formatRoas } from '@/lib/utils'
import { getRoasColorClass } from '@/lib/efficiency-utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'
import {
  calculateDrr,
  calculateDrrz,
  ADVERTISING_TOOLTIPS,
  ROAS_TOOLTIP,
  DRR_TOOLTIP,
} from './AdvertisingCardHelpers'

export interface AdvertisingCardProps {
  totalSpend: number | null | undefined
  roas: number | null | undefined
  /** Actual WB promotion deductions from finance-summary */
  wbPromotionCost?: number | null | undefined
  /** Previous period wb_promotion_cost for comparison */
  previousWbPromotionCost?: number | null | undefined
  previousSpend: number | null | undefined
  saleGross: number | null | undefined
  /** Orders revenue (retail price) from fulfillment total — for DRRz calculation */
  ordersRevenue?: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function AdvertisingCard({
  totalSpend,
  roas,
  wbPromotionCost,
  previousWbPromotionCost,
  previousSpend,
  saleGross,
  ordersRevenue,
  isLoading = false,
  error,
  onRetry,
  className,
}: AdvertisingCardProps): React.ReactElement {
  // BD-12: headline source — wb_promotion (finance) vs ad-cabinet API spend. Computed
  // once from props (before early returns) so the label is consistent across loading /
  // error / loaded. The advertising page's «Расход» uses the same plain «Реклама» label
  // for a different number, hence the source-tracked label (REPORT.md BD-12/A5).
  const useFinanceSrc = wbPromotionCost != null
  const cardLabel = useFinanceSrc ? 'Продвижение WB' : 'Реклама'

  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title={cardLabel}
        icon={Megaphone}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  // Prefer actual WB deductions (finance-summary), fallback to ad API spend
  const amount = useFinanceSrc ? wbPromotionCost : totalSpend
  const prevAmount = useFinanceSrc ? (previousWbPromotionCost ?? previousSpend) : previousSpend
  const hasValue = amount != null
  const displayValue = hasValue ? formatCurrency(amount) : '—'
  const comparison =
    amount != null && prevAmount != null && prevAmount !== 0
      ? calculateComparison(amount, prevAmount, true)
      : null

  const drr = calculateDrr(amount, saleGross)
  const drrz = calculateDrrz(amount, ordersRevenue)
  // Show DRRz only when ordersRevenue is available and > 0
  const showDrrz = ordersRevenue != null && ordersRevenue > 0

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`${cardLabel}: ${displayValue}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-yellow-600" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{cardLabel}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Подробнее о метрике ${cardLabel}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {useFinanceSrc ? ADVERTISING_TOOLTIPS.finance : ADVERTISING_TOOLTIPS.api}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          <span className="text-xl font-bold text-yellow-600">{displayValue}</span>
        </div>
        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
            <TrendIndicator direction={comparison.direction} size="sm" />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
          {roas != null && (
            <span
              className={cn(
                'text-xs font-medium flex items-center gap-0.5',
                getRoasColorClass(roas)
              )}
            >
              ROAS: {formatRoas(roas)}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex" aria-label="О ROAS">
                    <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent size="lg">
                  <p style={{ whiteSpace: 'pre-line' }}>{ROAS_TOOLTIP}</p>
                </TooltipContent>
              </Tooltip>
            </span>
          )}
          {roas != null && drr != null && (
            <span className="text-xs text-gray-300" aria-hidden="true">
              ·
            </span>
          )}
          {drr != null && (
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              ДРР: {formatPercentage(drr)}
              {showDrrz && drrz != null && ` · ДРРз: ${formatPercentage(drrz)}`}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-flex" aria-label="О ДРР">
                    <HelpCircle className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                  </button>
                </TooltipTrigger>
                <TooltipContent size="lg">
                  <p style={{ whiteSpace: 'pre-line' }}>{DRR_TOOLTIP}</p>
                </TooltipContent>
              </Tooltip>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
