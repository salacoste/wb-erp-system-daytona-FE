/**
 * Paid Acceptance Card — separate dashboard card for paid acceptance cost.
 * Shows cost ₽ / % of revenue with period comparison.
 */

'use client'

import { PackageCheck, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface PaidAcceptanceCardProps {
  paidAcceptanceCost: number | null | undefined
  previousPaidAcceptanceCost: number | null | undefined
  saleGross: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function PaidAcceptanceCard({
  paidAcceptanceCost,
  previousPaidAcceptanceCost,
  saleGross,
  isLoading = false,
  error,
  onRetry,
  className,
}: PaidAcceptanceCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Плат. приемка"
        icon={PackageCheck}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const hasValue = paidAcceptanceCost != null
  const cost = paidAcceptanceCost ?? 0

  const comparison =
    hasValue && previousPaidAcceptanceCost != null && previousPaidAcceptanceCost !== 0
      ? calculateComparison(cost, previousPaidAcceptanceCost, true)
      : null

  const pctOfSales =
    hasValue && saleGross != null && saleGross > 0 ? (cost / saleGross) * 100 : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Плат. приемка: ${hasValue ? formatCurrency(cost) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Плат. приемка</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о платной приёмке"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Стоимость приемки товара и соотношение этой стоимости к реализации (продажи без учета СПП и ВБ кошелька для ВБ и Соинвеста для Ozon).\nПлатная приёмка — плата за приём поставки на склад WB (не на всех складах).\nИсточник: еженедельный финансовый отчёт WB.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          {hasValue ? (
            <>
              <span className="text-xl font-bold text-red-500">{formatCurrency(cost)}</span>
              {pctOfSales != null && (
                <>
                  <span className="text-lg font-bold text-muted-foreground">/</span>
                  <span className="text-xl font-bold text-red-500">
                    {new Intl.NumberFormat('ru-RU', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    }).format(pctOfSales)}
                    {' %'}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          )}
        </div>
        {comparison && (
          <div className="mt-1 flex items-center gap-1.5">
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
