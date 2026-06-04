/**
 * CogsMissingState Component for Epic 60-FE
 *
 * Displays state when COGS are not assigned, showing coverage level
 * with appropriate messaging and action button.
 *
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle, Info, ArrowRight } from 'lucide-react'
import { cn, formatPercentageInt } from '@/lib/utils'
import { getCoverageLevel, COVERAGE_CONFIG } from './cogs-missing-state-config'

export interface CogsMissingStateProps {
  productsWithCogs?: number
  totalProducts?: number
  coverage?: number
  isLoading?: boolean
  onAssignCogs?: () => void
  className?: string
}

function MarginTooltip(): React.ReactElement {
  return (
    <div className="space-y-2">
      <p className="font-semibold">Маржа = (Выручка − COGS) / Выручка</p>
      <p className="text-xs text-gray-300">Назначьте себестоимость товарам, чтобы видеть:</p>
      <ul className="text-xs text-gray-300 space-y-1 ml-4">
        <li>Валовую прибыль по каждому товару</li>
        <li>Маржинальность по брендам и категориям</li>
        <li>Рентабельность вашего бизнеса</li>
      </ul>
    </div>
  )
}

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
  if (coverage >= 100 && !isLoading) return null

  const calculatedCoverage =
    coverage > 0 ? coverage : totalProducts > 0 ? (productsWithCogs / totalProducts) * 100 : 0

  if (calculatedCoverage >= 100 && !isLoading) return null

  const level = getCoverageLevel(calculatedCoverage)
  if (level === 'complete') return null

  const config = COVERAGE_CONFIG[level]
  const remainingProducts = totalProducts - productsWithCogs

  if (isLoading) return <LoadingState />

  return (
    <Card
      data-testid="cogs-missing-state"
      role="alert"
      aria-live="polite"
      className={cn('border-dashed border-2', className)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('rounded-full p-2 shrink-0', config.iconBgColor)} aria-hidden="true">
            <AlertTriangle className={cn('h-4 w-4', config.iconTextColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={config.badgeVariant}
                className={cn('text-xs font-medium', config.badgeClassName)}
                data-testid="coverage-badge"
              >
                {config.badgeText}
              </Badge>
              <span className="text-xs text-muted-foreground" data-testid="coverage-text">
                {formatPercentageInt(calculatedCoverage)} покрытия
                {totalProducts > 0 &&
                  remainingProducts > 0 &&
                  ` (${remainingProducts} товаров без COGS)`}
              </span>
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
            <p className="text-sm text-foreground mb-3" data-testid="message-text">
              {config.message}
            </p>
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
