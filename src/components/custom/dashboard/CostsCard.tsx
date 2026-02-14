/**
 * Costs (COGS) Card — Секция 4: СЕБЕСТОИМОСТЬ (левая)
 * Dashboard Restructuring: P&L Narrative
 *
 * Unified COGS card with coverage indicator.
 * Shows cogs_total from finance-summary + coverage % with color coding.
 * Gray accent. Links to COGS page when coverage < 100%.
 */

'use client'

import { useRouter } from 'next/navigation'
import { Package, Info, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, formatCurrency } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { ROUTES } from '@/lib/routes'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface CostsCardProps {
  cogsTotal: number | null | undefined
  previousCogs: number | null | undefined
  cogsCoverage: number
  productsWithCogs: number
  totalProducts: number
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

const fmtNum = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v))

function getCoverageColor(pct: number): string {
  if (pct >= 100) return 'text-green-600'
  if (pct >= 80) return 'text-yellow-600'
  return 'text-red-600'
}

export function CostsCard({
  cogsTotal,
  previousCogs,
  cogsCoverage,
  productsWithCogs,
  totalProducts,
  isLoading = false,
  error,
  onRetry,
  onAssignCogs,
  className,
}: CostsCardProps): React.ReactElement {
  const router = useRouter()
  const hasNoCogs = cogsCoverage === 0 || cogsTotal == null

  const handleAssignCogs = () => {
    if (onAssignCogs) onAssignCogs()
    else router.push(ROUTES.COGS.SINGLE)
  }

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
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" aria-hidden="true" />
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
            <TooltipContent size="md">
              <p>
                Себестоимость выкупленных товаров (COGS). Для точного расчёта прибыли заполните COGS
                для всех товаров.
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
              {fmtNum(productsWithCogs)} из {fmtNum(totalProducts)} товаров
            </p>
            <button
              onClick={handleAssignCogs}
              className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Заполнить COGS <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <>
            <div className="mt-2">
              <span className="text-2xl font-bold text-gray-600">{formatCurrency(cogsTotal!)}</span>
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
            <div className="mt-1 flex items-center gap-1">
              {cogsCoverage < 100 && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
              <span className={cn('text-xs', getCoverageColor(cogsCoverage))}>
                Покрытие: {Math.round(cogsCoverage)}%
              </span>
              <span className="text-xs text-gray-400">
                ({fmtNum(productsWithCogs)} из {fmtNum(totalProducts)})
              </span>
            </div>
            {cogsCoverage < 100 && (
              <button
                onClick={handleAssignCogs}
                className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
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
