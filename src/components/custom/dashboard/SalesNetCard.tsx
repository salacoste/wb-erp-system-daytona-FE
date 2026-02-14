/**
 * Sales Net Card — Секция 1: ВЫРУЧКА (правая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows net sales (sale_gross = wb_sales_gross - wb_returns_gross).
 * Subtitle shows breakdown: Выкупы X ₽ — Возвраты Y ₽.
 * Green accent. Source: finance-summary.
 */

'use client'

import { TrendingUp, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface SalesNetCardProps {
  saleGross: number | null | undefined
  wbSalesGross: number | null | undefined
  wbReturnsGross: number | null | undefined
  previousSaleGross: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function SalesNetCard({
  saleGross,
  wbSalesGross,
  wbReturnsGross,
  previousSaleGross,
  isLoading = false,
  error,
  onRetry,
  className,
}: SalesNetCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Продажи"
        icon={TrendingUp}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const hasValue = saleGross != null
  const displayValue = hasValue ? formatCurrency(saleGross) : '—'
  const comparison =
    saleGross != null && previousSaleGross != null && previousSaleGross !== 0
      ? calculateComparison(saleGross, previousSaleGross, false)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Продажи: ${displayValue}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Продажи</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о метрике Продажи"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Чистые продажи: выкупы минус возвраты. Основа для расчёта P&L.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-green-600">{displayValue}</span>
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
        {wbSalesGross != null && wbReturnsGross != null && (
          <div className="mt-1">
            <span className="text-xs text-gray-400">
              Выкупы {formatCurrency(wbSalesGross)} — Возвраты {formatCurrency(wbReturnsGross)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
