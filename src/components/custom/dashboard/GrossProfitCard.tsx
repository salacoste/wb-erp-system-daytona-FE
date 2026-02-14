/**
 * Gross Profit Card — Секция 5: ПРИБЫЛЬ (левая, АКЦЕНТ)
 * Dashboard Restructuring: P&L Narrative
 *
 * Shows gross_profit = payout_total - cogs_total.
 * Conditional on COGS coverage >= 80%.
 * Green/Red accent based on sign. Source: finance-summary.gross_profit.
 */

'use client'

import { TrendingUp, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface GrossProfitCardProps {
  grossProfit: number | null | undefined
  previousGrossProfit: number | null | undefined
  cogsCoverage: number
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

export function GrossProfitCard({
  grossProfit,
  previousGrossProfit,
  cogsCoverage,
  isLoading = false,
  error,
  onRetry,
  onAssignCogs,
  className,
}: GrossProfitCardProps): React.ReactElement {
  if (isLoading) return <HighlightedMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Валовая прибыль"
        icon={TrendingUp}
        error={error}
        onRetry={onRetry}
        className={className}
        minHeight="min-h-[140px]"
      />
    )
  }

  const canShow = cogsCoverage >= 80
  const isPositive = grossProfit != null && grossProfit >= 0
  const comparison =
    canShow && grossProfit != null && previousGrossProfit != null && previousGrossProfit !== 0
      ? calculateComparison(grossProfit, previousGrossProfit, false)
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
      aria-label={`Валовая прибыль: ${canShow && grossProfit != null ? formatCurrency(grossProfit) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Валовая прибыль</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о валовой прибыли"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>К перечислению минус себестоимость. Показывает реальную прибыль от продаж.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-3">
          {canShow && grossProfit != null ? (
            <span className={cn('text-4xl font-bold', valueColor)}>
              {formatCurrency(grossProfit)}
            </span>
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">—</span>
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
        {!canShow && (
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Заполните себестоимость для расчёта</span>
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
        {canShow && cogsCoverage < 100 && (
          <div className="mt-1 text-xs text-yellow-600">
            <AlertTriangle className="mr-1 inline h-3 w-3" />
            Покрытие COGS: {Math.round(cogsCoverage)}%
          </div>
        )}
      </CardContent>
    </Card>
  )
}
