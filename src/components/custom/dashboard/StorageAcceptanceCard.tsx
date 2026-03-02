/**
 * Storage Card — Dashboard P&L card for storage cost only.
 * Paid acceptance is shown in a separate PaidAcceptanceCard.
 */

'use client'

import { Warehouse, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface StorageAcceptanceCardProps {
  storageCost: number | null | undefined
  paidAcceptanceCost?: number | null | undefined
  previousTotal: number | null | undefined
  saleGross: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function StorageAcceptanceCard({
  storageCost,
  previousTotal,
  saleGross,
  isLoading = false,
  error,
  onRetry,
  className,
}: StorageAcceptanceCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Хранение"
        icon={Warehouse}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const hasValue = storageCost != null
  const comparison =
    storageCost != null && previousTotal != null && previousTotal !== 0
      ? calculateComparison(storageCost, previousTotal, true)
      : null

  const pctOfSales =
    storageCost != null && saleGross != null && saleGross > 0
      ? (storageCost / saleGross) * 100
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Хранение: ${hasValue ? formatCurrency(storageCost) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Хранение</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о хранении"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Расходы на хранение товаров на складах WB.\nЕжедневная плата за каждый товар (зависит от объёма и срока хранения).\nДанные из еженедельного финансового отчёта WB.\n💡 Детализация по SKU — на странице аналитики хранения.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          <span className="text-xl font-bold text-red-500">
            {hasValue ? formatCurrency(storageCost) : '—'}
          </span>
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
        {pctOfSales != null && (
          <div className="mt-0.5">
            <span className="text-xs text-gray-400">{formatPercentage(pctOfSales)} от продаж</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
