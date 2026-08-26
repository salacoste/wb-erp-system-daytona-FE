/**
 * Gross Profit Card — Request #155: TRUE Gross Profit
 * Shows gross_profit_analytical = revenue_net − COGS (before WB deductions).
 * From weekly_margin_fact SUM(gross_profit_rub).
 * Green/Red accent based on sign.
 */

'use client'

import { TrendingUp, Info, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency, formatPercentageInt } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { HighlightedMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface GrossProfitCardProps {
  grossProfit: number | null | undefined
  previousGrossProfit: number | null | undefined
  cogsCoverage: number
  isLoading?: boolean
  showPreTaxLabel?: boolean
  error?: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

export function GrossProfitCard({
  grossProfit,
  previousGrossProfit,
  cogsCoverage,
  showPreTaxLabel = false,
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
        minHeight="min-h-[100px]"
      />
    )
  }

  const canShow = grossProfit != null
  const isPositive = grossProfit != null && grossProfit >= 0
  const comparison =
    canShow && previousGrossProfit != null && previousGrossProfit !== 0
      ? calculateComparison(grossProfit!, previousGrossProfit, false)
      : null

  const borderColor = !canShow
    ? 'border-border'
    : isPositive
      ? 'border-status-success'
      : 'border-status-error'
  const bgGradient = !canShow
    ? 'bg-gradient-to-br from-muted to-card'
    : isPositive
      ? 'bg-gradient-to-br from-status-success/10 to-card'
      : 'bg-gradient-to-br from-status-error/10 to-card'
  const valueColor = isPositive ? 'text-status-success' : 'text-status-error'

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
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">
              Валовая прибыль
              {showPreTaxLabel && (
                <span className="ml-1 text-xs text-muted-foreground/70">(до налога)</span>
              )}
            </span>
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
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Валовая прибыль = Выручка нетто − Себестоимость (COGS).\nЭто прибыль ДО удержаний WB (логистика, хранение, комиссии ещё не вычтены).\nПоказывает, насколько выгодно вы закупаете/производите товар.\nЕсли валовая прибыль отрицательная — вы продаёте дешевле, чем закупаете.\n⚠ Точность зависит от покрытия COGS (при < 100% прибыль завышена).\nИсточник: расчёт из weekly_margin_fact (revenue_net − cogs).'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          {canShow && grossProfit != null ? (
            <span className={cn('text-xl font-bold', valueColor)}>
              {formatCurrency(grossProfit)}
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
          <div className="mt-1 flex items-center gap-1 text-xs text-status-warning">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Покрытие COGS: {formatPercentageInt(cogsCoverage)}</span>
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
