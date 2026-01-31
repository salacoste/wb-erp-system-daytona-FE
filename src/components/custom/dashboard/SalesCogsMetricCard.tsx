/**
 * Sales COGS Metric Card Component
 * Story 63.2-FE: Sales COGS Metric Card (COGS Vykupov)
 * Epic 63-FE: Dashboard Business Logic Completion
 *
 * @see docs/stories/epic-63/story-63.2-fe-sales-cogs-metric-card.md
 */

'use client'

import { Package, Info, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { formatCurrency, cn } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ROUTES } from '@/lib/routes'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface SalesCogsMetricCardProps {
  cogsTotal: number | null | undefined
  previousCogsTotal: number | null | undefined
  productsWithCogs: number
  totalProducts: number
  cogsCoverage: number
  isLoading?: boolean
  error?: Error | null
  onAssignCogs?: () => void
  onRetry?: () => void
  className?: string
}

const fmtNum = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v))
const fmtPct = (v: number) => `${Math.round(v)}%`

export function SalesCogsMetricCard({
  cogsTotal,
  previousCogsTotal,
  productsWithCogs,
  totalProducts,
  cogsCoverage,
  isLoading = false,
  error,
  onAssignCogs,
  onRetry,
  className,
}: SalesCogsMetricCardProps): React.ReactElement {
  const isIncomplete = cogsCoverage < 100
  const hasNoCogs = cogsCoverage === 0 || cogsTotal == null

  const handleAssignCogs = () => {
    if (onAssignCogs) {
      onAssignCogs()
    } else if (typeof window !== 'undefined') {
      window.location.href = ROUTES.COGS.SINGLE
    }
  }

  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error) {
    return (
      <MetricCardError
        title="COGS выкупов"
        icon={Package}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const comparison =
    !hasNoCogs && cogsTotal != null && previousCogsTotal != null && previousCogsTotal !== 0
      ? calculateComparison(cogsTotal, previousCogsTotal, true)
      : null

  const ariaLabel = hasNoCogs
    ? 'COGS выкупов: не заполнен'
    : `COGS выкупов: ${formatCurrency(cogsTotal!)}`

  return (
    <Card
      className={cn('min-h-[120px] transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={ariaLabel}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">COGS выкупов</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Подробнее о метрике COGS выкупов"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>
                Себестоимость выкупленных товаров. Используется для расчёта маржи и прибыли по
                фактическим продажам.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        {hasNoCogs ? (
          <div className="mt-2 rounded-md bg-yellow-100 p-2">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">COGS не заполнен</span>
            </div>
            <p className="mt-1 text-xs text-yellow-700">
              {fmtNum(productsWithCogs)} из {fmtNum(totalProducts)} товаров ({fmtPct(cogsCoverage)})
            </p>
            <button
              onClick={handleAssignCogs}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              aria-label="Заполнить COGS"
            >
              Заполнить COGS <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-2">
              <span className="text-[32px] font-bold text-gray-500">
                {formatCurrency(cogsTotal!)}
              </span>
            </div>
            {comparison && (
              <div className="mt-2 flex items-center gap-2">
                <ComparisonBadge
                  percentageChange={comparison.percentageChange}
                  direction={comparison.direction}
                  absoluteDifference={comparison.formattedDifference}
                />
                <span className="text-xs text-muted-foreground">
                  vs {formatCurrency(previousCogsTotal ?? 0)}
                </span>
              </div>
            )}
            <div className="mt-1 flex items-center gap-1">
              {isIncomplete && (
                <AlertTriangle className="h-3 w-3 text-yellow-500" aria-hidden="true" />
              )}
              <span className={cn('text-xs', isIncomplete ? 'text-yellow-600' : 'text-gray-400')}>
                COGS: {fmtNum(productsWithCogs)} из {fmtNum(totalProducts)} товаров (
                {fmtPct(cogsCoverage)})
              </span>
            </div>
            {isIncomplete && (
              <button
                onClick={handleAssignCogs}
                className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                aria-label="Заполнить COGS"
              >
                Заполнить COGS <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
