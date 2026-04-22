/**
 * Other Deductions Card — "Прочие удержания"
 * Shows Jam subscription + other WB services (excl. promotion).
 * Value ₽ / % format with breakdown tooltip.
 */

'use client'

import { FileText, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface OtherDeductionsCardProps {
  jamCost: number | null | undefined
  otherServicesCost: number | null | undefined
  previousTotal: number | null | undefined
  saleGross: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function OtherDeductionsCard({
  jamCost,
  otherServicesCost,
  previousTotal,
  saleGross,
  isLoading = false,
  error,
  onRetry,
  className,
}: OtherDeductionsCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Прочие удержания"
        icon={FileText}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const jam = jamCost ?? 0
  const other = otherServicesCost ?? 0
  const hasValue = jamCost != null || otherServicesCost != null
  const total = hasValue ? jam + other : null

  const comparison =
    total != null && previousTotal != null && previousTotal !== 0
      ? calculateComparison(total, previousTotal, true)
      : null

  const pctOfSales =
    total != null && saleGross != null && saleGross > 0 ? (total / saleGross) * 100 : null

  // Build breakdown lines for tooltip
  const breakdownLines: string[] = []
  if (jamCost != null && jamCost !== 0) breakdownLines.push(`Джем: ${formatCurrency(jamCost)}`)
  if (otherServicesCost != null && otherServicesCost !== 0)
    breakdownLines.push(`Прочие сервисы (утилизация и др.): ${formatCurrency(otherServicesCost)}`)
  const breakdown = breakdownLines.length > 0 ? `\n\nСостав:\n${breakdownLines.join('\n')}` : ''

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      data-testid="metric-card"
      aria-label={`Прочие удержания: ${total != null ? formatCurrency(total) : 'нет данных'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Прочие удержания</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о прочих удержаниях"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {`Затраты, связанные с подпиской «Джем», транзитом и пр. и соотношение данных затрат к реализации (продажи без учета СПП и ВБ кошелька для ВБ и Соинвеста для Ozon).\nИсточник: еженедельный финансовый отчёт WB.${breakdown}`}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          {hasValue ? (
            <>
              <span className="text-xl font-bold text-red-500">{formatCurrency(total!)}</span>
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
