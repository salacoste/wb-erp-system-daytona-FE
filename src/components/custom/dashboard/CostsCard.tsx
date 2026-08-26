/**
 * Costs (COGS) Card — Себестоимость (COGS total).
 *
 * Shows the cogs_total amount (себестоимость выкупленных товаров) with period comparison.
 * TZ-6: the COGS-coverage indicator + "assign COGS" CTA were removed from this card —
 * CogsCoverageMetricCard (Tier 1) is the single canonical COGS-coverage surface. This card
 * is now purely the COGS-expense amount.
 */

'use client'

import { Package, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface CostsCardProps {
  cogsTotal: number | null | undefined
  previousCogs: number | null | undefined
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
}

export function CostsCard({
  cogsTotal,
  previousCogs,
  isLoading = false,
  error,
  onRetry,
  className,
}: CostsCardProps): React.ReactElement {
  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="Себестоимость"
        icon={Package}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  // BD-2: treat cogs_total === 0 the same as null — the BE returns 0 (not null)
  // when COGS is unassigned for the period, which would render a misleading "0 ₽".
  // Render «—» + "не заполнена" until COGS is actually assigned.
  const hasNoCogs = cogsTotal == null || cogsTotal === 0
  const comparison =
    !hasNoCogs && cogsTotal != null && previousCogs != null && previousCogs !== 0
      ? calculateComparison(cogsTotal, previousCogs, true)
      : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`Себестоимость: ${!hasNoCogs ? formatCurrency(cogsTotal!) : 'не заполнена'}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">Себестоимость</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о себестоимости"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="lg">
              <p style={{ whiteSpace: 'pre-line' }}>
                {
                  'Себестоимость выкупленных товаров (COGS) — сколько вы потратили на закупку/производство проданных товаров.\nВы задаёте COGS для каждого товара вручную, а система рассчитывает общую сумму по количеству выкупов.\n⚠ Если COGS не назначена, прибыль и маржа будут завышены (часть расходов не учтена).\nИсточник: ваши данные COGS + количество выкупов из финансового отчёта WB.'
                }
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="mt-1">
          {hasNoCogs ? (
            <span className="text-xl font-bold text-muted-foreground">—</span>
          ) : (
            <span className="text-xl font-bold text-foreground">{formatCurrency(cogsTotal!)}</span>
          )}
        </div>
        {comparison && (
          <div className="mt-1 flex items-center gap-2">
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}
        {/* TZ-6: coverage indicator + assign-COGS CTA removed — see CogsCoverageMetricCard (T1). */}
      </CardContent>
    </Card>
  )
}
