/**
 * Advertising Card — Секция 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА (правая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows ad spend + ROAS, ДРР (% of sales), ДРРз (% of orders revenue).
 * Story 65.4: added ordersRevenue prop + DRRz calculation.
 * Source: advertising endpoint summary + fulfillment total.
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-1-2.md Story 65.4
 */

'use client'

import { Megaphone, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface AdvertisingCardProps {
  totalSpend: number | null | undefined
  roas: number | null | undefined
  previousSpend: number | null | undefined
  saleGross: number | null | undefined
  /** Orders revenue (retail price) from fulfillment total — for DRRz calculation */
  ordersRevenue?: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

function getRoasColor(roas: number): string {
  if (roas >= 5) return 'text-green-600'
  if (roas >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

/** DRR = totalSpend / saleGross * 100 (% of net sales) */
function calculateDrr(
  totalSpend: number | null | undefined,
  saleGross: number | null | undefined
): number | null {
  if (totalSpend == null || saleGross == null || saleGross <= 0) return null
  return (totalSpend / saleGross) * 100
}

/** DRRz = totalSpend / ordersRevenue * 100 (% of orders retail price) */
function calculateDrrz(
  totalSpend: number | null | undefined,
  ordersRevenue: number | null | undefined
): number | null {
  if (totalSpend == null || ordersRevenue == null || ordersRevenue <= 0) return null
  return (totalSpend / ordersRevenue) * 100
}

export function AdvertisingCard({
  totalSpend,
  roas,
  previousSpend,
  saleGross,
  ordersRevenue,
  isLoading = false,
  error,
  onRetry,
  className,
}: AdvertisingCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Реклама"
        icon={Megaphone}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const hasValue = totalSpend != null
  const displayValue = hasValue ? formatCurrency(totalSpend) : '—'
  const comparison =
    totalSpend != null && previousSpend != null && previousSpend !== 0
      ? calculateComparison(totalSpend, previousSpend, true)
      : null

  const drr = calculateDrr(totalSpend, saleGross)
  const drrz = calculateDrrz(totalSpend, ordersRevenue)
  // Show DRRz only when ordersRevenue is available and > 0
  const showDrrz = ordersRevenue != null && ordersRevenue > 0

  const tooltipText = showDrrz
    ? 'ДРР — доля рекламных расходов от продаж. ДРРз — от суммы заказов (розничная цена). ДРРз всегда ниже ДРР.'
    : 'Общие расходы на рекламу в Wildberries за период.'

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Реклама: ${displayValue}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-yellow-600" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Реклама</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о метрике Реклама"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-yellow-600">{displayValue}</span>
        </div>
        {comparison && (
          <div className="mt-2 flex items-center gap-1.5">
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
            <span className={cn('text-xs font-medium', getRoasColor(roas))}>
              ROAS: {roas.toFixed(1)}x
            </span>
          )}
          {drr != null && (
            <span className="text-xs text-gray-400">
              ДРР: {formatPercentage(drr)}
              {showDrrz && drrz != null && ` · ДРРз: ${formatPercentage(drrz)}`}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
