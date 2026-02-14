/**
 * Storage + Acceptance Card — Секция 3: К ПЕРЕЧИСЛЕНИЮ (правая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Combines storage_cost + paid_acceptance_cost.
 * Subtitle shows breakdown. Red accent. Inverted comparison.
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
  paidAcceptanceCost: number | null | undefined
  previousTotal: number | null | undefined
  saleGross: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function StorageAcceptanceCard({
  storageCost,
  paidAcceptanceCost,
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
        title="Хранение и приёмка"
        icon={Warehouse}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const storage = storageCost ?? 0
  const acceptance = paidAcceptanceCost ?? 0
  const total = storageCost != null || paidAcceptanceCost != null ? storage + acceptance : null
  const hasValue = total != null

  const comparison =
    total != null && previousTotal != null && previousTotal !== 0
      ? calculateComparison(total, previousTotal, true)
      : null

  const pctOfSales =
    total != null && saleGross != null && saleGross > 0 ? (total / saleGross) * 100 : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Хранение и приёмка: ${hasValue ? formatCurrency(total) : 'нет данных'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Хранение и приёмка</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о хранении и приёмке"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Расходы на хранение товаров и платную приёмку на складах WB.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-2">
          <span className="text-2xl font-bold text-red-500">
            {hasValue ? formatCurrency(total) : '—'}
          </span>
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
        <div className="mt-1 flex flex-wrap gap-x-2">
          {storageCost != null && (
            <span className="text-xs text-gray-400">Хранение {formatCurrency(storageCost)}</span>
          )}
          {paidAcceptanceCost != null && paidAcceptanceCost > 0 && (
            <span className="text-xs text-gray-400">
              Приёмка {formatCurrency(paidAcceptanceCost)}
            </span>
          )}
        </div>
        {pctOfSales != null && (
          <div className="mt-0.5">
            <span className="text-xs text-gray-400">{formatPercentage(pctOfSales)} от продаж</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
