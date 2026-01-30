/**
 * CogsMissingState Component for Epic 60-FE
 *
 * Displays state when COGS are not assigned, showing coverage level
 * with appropriate messaging and action button.
 *
 * Backend confirmed: gross_profit = null when cogs_coverage_pct != 100%
 * This component guides users to assign COGS for margin calculation.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CogsMissingStateProps {
  /** Number of products with COGS assigned */
  productsWithCogs?: number
  /** Total number of products */
  totalProducts?: number
  /** Coverage percentage (0-100) */
  coverage?: number
  /** Show loading state */
  isLoading?: boolean
  /** Callback when action button is clicked */
  onAssignCogs?: () => void
  /** Additional CSS classes */
  className?: string
}

/** Coverage level classification */
type CoverageLevel = 'critical' | 'warning' | 'info' | 'complete'

/** Determine coverage level based on percentage */
function getCoverageLevel(coverage: number): CoverageLevel {
  if (coverage === 100) return 'complete'
  if (coverage >= 50) return 'info'
  if (coverage > 0) return 'warning'
  return 'critical'
}

/** Coverage level configuration */
const COVERAGE_CONFIG: Record<
  Exclude<CoverageLevel, 'complete'>,
  {
    badgeText: string
    message: string
    actionText: string
    badgeVariant: 'destructive' | 'secondary' | 'outline'
    badgeClassName: string
    iconBgColor: string
    iconTextColor: string
  }
> = {
  critical: {
    badgeText: 'Критично',
    message: 'Назначьте себестоимость товарам для расчета маржи',
    actionText: 'Назначить COGS',
    badgeVariant: 'destructive',
    badgeClassName: 'bg-red-600 text-white border-red-600',
    iconBgColor: 'bg-red-50',
    iconTextColor: 'text-red-600',
  },
  warning: {
    badgeText: 'Внимание',
    message: 'Назначьте COGS для точного расчета маржи',
    actionText: 'Назначить COGS',
    badgeVariant: 'secondary',
    badgeClassName: 'bg-orange-100 text-orange-800 border-orange-400',
    iconBgColor: 'bg-orange-50',
    iconTextColor: 'text-orange-600',
  },
  info: {
    badgeText: 'Почти готово',
    message: 'Назначьте COGS оставшимся товарам',
    actionText: 'Дособрать товары',
    badgeVariant: 'outline',
    badgeClassName: 'bg-yellow-100 text-yellow-800 border-yellow-400',
    iconBgColor: 'bg-yellow-50',
    iconTextColor: 'text-yellow-700',
  },
}

/** Tooltip content explaining margin calculation */
function MarginTooltip(): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="font-semibold">Маржа = (Выручка − COGS) / Выручка</p>
      <p className="text-xs text-gray-300">Назначьте себестоимость товарам, чтобы видеть:</p>
      <ul className="text-xs text-gray-300 space-y-1 ml-4">
        <li>• Валовую прибыль по каждому товару</li>
        <li>• Маржинальность по брендам и категориям</li>
        <li>• Рентабельность вашего бизнеса</li>
      </ul>
    </div>
  )
}

/**
 * CogsMissingState displays COGS assignment state with actionable guidance.
 *
 * Coverage levels:
 * - 0%: Critical - "Недостаточно данных"
 * - 1-49%: Warning - "Требуется действие"
 * - 50-99%: Info - "Почти готово"
 * - 100%: Hidden (component returns null)
 */
export function CogsMissingState({
  productsWithCogs = 0,
  totalProducts = 0,
  coverage = 0,
  isLoading = false,
  onAssignCogs,
  className,
}: CogsMissingStateProps): React.ReactElement | null {
  // Don't render if COGS coverage is complete
  if (coverage >= 100 && !isLoading) {
    return null
  }

  // Calculate coverage if not provided
  const calculatedCoverage =
    coverage > 0 ? coverage : totalProducts > 0 ? (productsWithCogs / totalProducts) * 100 : 0

  // Don't render if calculated coverage is >= 100
  if (calculatedCoverage >= 100 && !isLoading) {
    return null
  }

  const level = getCoverageLevel(calculatedCoverage)

  // Hide if complete
  if (level === 'complete') {
    return null
  }

  const config = COVERAGE_CONFIG[level]
  const remainingProducts = totalProducts - productsWithCogs

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <Card
      data-testid="cogs-missing-state"
      role="alert"
      aria-live="polite"
      className={cn('border-dashed border-2', className)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon with background */}
          <div className={cn('rounded-full p-2 shrink-0', config.iconBgColor)} aria-hidden="true">
            <AlertTriangle className={cn('h-4 w-4', config.iconTextColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={config.badgeVariant}
                className={cn('text-xs font-medium', config.badgeClassName)}
                data-testid="coverage-badge"
              >
                {config.badgeText}
              </Badge>

              {/* Coverage percentage */}
              <span className="text-xs text-muted-foreground" data-testid="coverage-text">
                {Math.round(calculatedCoverage)}% покрытия
                {totalProducts > 0 &&
                  remainingProducts > 0 &&
                  ` (${remainingProducts} товаров без COGS)`}
              </span>

              {/* Tooltip with margin formula */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0"
                    aria-label="Информация о расчете маржи"
                  >
                    <Info className="h-4 w-4 text-muted-foreground" data-testid="info-icon" />
                  </button>
                </TooltipTrigger>
                <TooltipContent size="lg">
                  <MarginTooltip />
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Message */}
            <p className="text-sm text-foreground mb-3" data-testid="message-text">
              {config.message}
            </p>

            {/* Action button */}
            {onAssignCogs && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAssignCogs}
                className="gap-1.5 text-xs"
                data-testid="action-button"
              >
                {config.actionText}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Loading state skeleton */
function LoadingState(): React.ReactElement {
  return (
    <Card
      data-testid="cogs-missing-state-loading"
      aria-busy="true"
      className="border-dashed border-2"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full p-2 bg-gray-100 shrink-0" aria-hidden="true">
            <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
