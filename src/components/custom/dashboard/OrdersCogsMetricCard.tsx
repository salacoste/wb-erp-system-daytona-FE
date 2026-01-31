/** Story 62.3-FE: COGS by Orders Metric Card - Epic 62-FE: Dashboard UI/UX Presentation */

'use client'

import { useRouter } from 'next/navigation'
import { Package, Info, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { formatCurrency, cn } from '@/lib/utils'
import { calculateComparison } from '@/lib/comparison-helpers'
import { ROUTES } from '@/lib/routes'
import { StandardMetricSkeleton, MetricCardError } from './MetricCardStates'

export interface OrdersCogsMetricCardProps {
  cogsTotal: number | null | undefined
  previousCogsTotal: number | null | undefined
  productsWithCogs: number
  totalProducts: number
  cogsCoverage: number
  isLoading?: boolean
  error?: Error | null
  onAssignCogs?: () => void
  className?: string
  onRetry?: () => void
}

const formatNumber = (v: number) => new Intl.NumberFormat('ru-RU').format(Math.round(v))
const formatPct = (v: number) => `${Math.round(v)}%`

export function OrdersCogsMetricCard({
  cogsTotal,
  previousCogsTotal,
  productsWithCogs,
  totalProducts,
  cogsCoverage,
  isLoading = false,
  error,
  onAssignCogs,
  className,
  onRetry,
}: OrdersCogsMetricCardProps): React.ReactElement {
  const router = useRouter()
  const isIncomplete = cogsCoverage < 100
  const hasNoCogs = cogsCoverage === 0 || cogsTotal == null

  const handleAssignCogs = () => (onAssignCogs ? onAssignCogs() : router.push(ROUTES.COGS.SINGLE))

  if (isLoading) return <StandardMetricSkeleton className={className} />
  if (error)
    return (
      <MetricCardError
        title="COGS по заказам"
        icon={Package}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )

  const comparison =
    !hasNoCogs && cogsTotal != null ? calculateComparison(cogsTotal, previousCogsTotal, true) : null

  return (
    <Card
      className={cn('transition-shadow hover:shadow-md', className)}
      role="article"
      aria-label={`COGS по заказам: ${!hasNoCogs ? formatCurrency(cogsTotal!) : 'не заполнен'}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-muted-foreground">COGS по заказам</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="text-muted-foreground hover:text-foreground"
                aria-label="Подробнее о метрике COGS по заказам"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Себестоимость товаров для всех заказов, рассчитанная по COGS на момент заказа.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {hasNoCogs ? (
          <MissingState
            productsWithCogs={productsWithCogs}
            totalProducts={totalProducts}
            cogsCoverage={cogsCoverage}
            onAssignCogs={handleAssignCogs}
          />
        ) : (
          <ValueDisplay
            cogsTotal={cogsTotal!}
            previousCogsTotal={previousCogsTotal}
            productsWithCogs={productsWithCogs}
            totalProducts={totalProducts}
            cogsCoverage={cogsCoverage}
            comparison={comparison}
            isIncomplete={isIncomplete}
            onAssignCogs={handleAssignCogs}
          />
        )}
      </CardContent>
    </Card>
  )
}

function MissingState(props: {
  productsWithCogs: number
  totalProducts: number
  cogsCoverage: number
  onAssignCogs: () => void
}): React.ReactElement {
  const { productsWithCogs, totalProducts, cogsCoverage, onAssignCogs } = props
  return (
    <div className="mt-2 rounded-md bg-yellow-100 p-2">
      <div className="flex items-center gap-2 text-yellow-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">COGS не заполнен</span>
      </div>
      <p className="mt-1 text-xs text-yellow-700">
        {formatNumber(productsWithCogs)} из {formatNumber(totalProducts)} товаров (
        {formatPct(cogsCoverage)})
      </p>
      <button
        onClick={onAssignCogs}
        className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        Заполнить COGS <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}

function ValueDisplay(props: {
  cogsTotal: number
  previousCogsTotal: number | null | undefined
  productsWithCogs: number
  totalProducts: number
  cogsCoverage: number
  comparison: ReturnType<typeof calculateComparison>
  isIncomplete: boolean
  onAssignCogs: () => void
}): React.ReactElement {
  const {
    cogsTotal,
    previousCogsTotal,
    productsWithCogs,
    totalProducts,
    cogsCoverage,
    comparison,
    isIncomplete,
    onAssignCogs,
  } = props
  return (
    <>
      <div className="mt-2">
        <span className="text-2xl font-bold text-gray-500">{formatCurrency(cogsTotal)}</span>
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
        {isIncomplete && <AlertTriangle className="h-3 w-3 text-yellow-500" />}
        <span className={cn('text-xs', isIncomplete ? 'text-yellow-600' : 'text-gray-400')}>
          COGS: {formatNumber(productsWithCogs)} из {formatNumber(totalProducts)} товаров (
          {formatPct(cogsCoverage)})
        </span>
      </div>
      {isIncomplete && (
        <button
          onClick={onAssignCogs}
          className="mt-1 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Заполнить COGS <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </>
  )
}
