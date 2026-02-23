/**
 * Operating Profit Card — Request #155: Renamed from "Валовая прибыль"
 * Shows operating_profit = payout_total − cogs_total (after WB deductions).
 * Conditional on COGS coverage = 100%.
 * Green/Red accent based on sign.
 */

'use client'

import { TrendingUp, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface OperatingProfitCardProps {
  operatingProfit: number | null | undefined
  previousOperatingProfit: number | null | undefined
  cogsCoverage: number
  isLoading?: boolean
  showPreTaxLabel?: boolean
  error?: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

export function OperatingProfitCard({
  operatingProfit,
  previousOperatingProfit,
  cogsCoverage,
  showPreTaxLabel = false,
  isLoading = false,
  error,
  onRetry,
  onAssignCogs,
  className,
}: OperatingProfitCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Операционная прибыль"
        icon={TrendingUp}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[100px]"
      />
    )
  }

  const canShow = operatingProfit != null
  const isPositive = operatingProfit != null && operatingProfit >= 0
  const comparison =
    canShow && previousOperatingProfit != null && previousOperatingProfit !== 0
      ? calculateComparison(operatingProfit!, previousOperatingProfit, false)
      : null

  const borderColor = !canShow
    ? 'border-gray-300'
    : isPositive
      ? 'border-green-500'
      : 'border-red-500'
  const bgGradient = !canShow
    ? 'bg-gradient-to-br from-gray-50 to-white'
    : isPositive
      ? 'bg-gradient-to-br from-green-50 to-white'
      : 'bg-gradient-to-br from-red-50 to-white'
  const valueColor = isPositive ? 'text-green-600' : 'text-red-600'

  return (
    <Card
      className={cn(
        'border-2 transition-shadow hover:shadow-md',
        borderColor,
        bgGradient,
        className
      )}
      role="article"
      aria-label={`Операционная прибыль: ${canShow && operatingProfit != null ? formatCurrency(operatingProfit) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              Операционная прибыль
              {showPreTaxLabel && (
                <span className="ml-1 text-xs text-muted-foreground/70">(до налога)</span>
              )}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее об операционной прибыли"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>К перечислению − Себестоимость. После всех удержаний WB.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          {canShow && operatingProfit != null ? (
            <span className={cn('text-xl font-bold', valueColor)}>
              {formatCurrency(operatingProfit)}
            </span>
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
        </div>
        {comparison && (
          <div className="mt-2 flex items-center gap-2">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
        {cogsCoverage < 100 && (
          <div className="mt-1 flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Покрытие COGS: {Math.round(cogsCoverage)}%</span>
            {onAssignCogs && (
              <button
                onClick={onAssignCogs}
                className="ml-1 font-medium text-primary hover:underline"
              >
                Перейти
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
