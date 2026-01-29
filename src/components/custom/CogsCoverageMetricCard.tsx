/**
 * COGS Coverage Metric Card Component
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Displays COGS coverage as "X из Y товаров" with percentage badge.
 * Shows how many products have COGS assigned vs total products.
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

'use client'

import { PieChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CogsCoverageMetricCardProps {
  /** Number of products with COGS assigned */
  productsWithCogs: number | null | undefined
  /** Total number of products */
  totalProducts: number | null | undefined
  /** COGS coverage percentage (0-100) */
  coverage: number | null | undefined
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Additional class names */
  className?: string
  /** Click handler */
  onClick?: () => void
}

/** Format coverage value as "X из Y" */
function formatCogsCoverage(productsWithCogs: number, totalProducts: number): string {
  const formattedWith = new Intl.NumberFormat('ru-RU').format(productsWithCogs)
  const formattedTotal = new Intl.NumberFormat('ru-RU').format(totalProducts)
  return `${formattedWith} из ${formattedTotal}`
}

/** Get badge color based on coverage percentage */
function getBadgeVariant(coverage: number): 'default' | 'secondary' | 'destructive' {
  if (coverage >= 100) return 'default' // Green - full coverage
  if (coverage >= 50) return 'secondary' // Yellow - partial coverage
  return 'destructive' // Red - low coverage
}

/** Get badge class based on coverage */
function getBadgeClass(coverage: number): string {
  if (coverage >= 100) return 'bg-green-100 text-green-800 hover:bg-green-100'
  if (coverage >= 50) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
  return 'bg-red-100 text-red-800 hover:bg-red-100'
}

/**
 * COGS coverage metric card for dashboard grid
 * Custom display with "X из Y" format and percentage badge
 */
export function CogsCoverageMetricCard({
  productsWithCogs,
  totalProducts,
  coverage,
  isLoading = false,
  error = null,
  className,
  onClick,
}: CogsCoverageMetricCardProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card data-testid="cogs-coverage-skeleton" aria-busy="true">
        <CardContent className="p-4 min-h-[120px]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" aria-hidden="true" />
            <Skeleton className="h-4 w-24" aria-hidden="true" />
          </div>
          <Skeleton className="mt-2 h-8 w-32" aria-hidden="true" />
          <Skeleton className="mt-1 h-4 w-20" aria-hidden="true" />
        </CardContent>
      </Card>
    )
  }

  const hasValue =
    productsWithCogs !== null &&
    productsWithCogs !== undefined &&
    totalProducts !== null &&
    totalProducts !== undefined

  const displayValue = hasValue ? formatCogsCoverage(productsWithCogs, totalProducts) : '—'

  const coverageValue = coverage ?? 0
  const isClickable = !!onClick

  return (
    <Card
      role="article"
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? e => handleKeyDown(e, onClick) : undefined}
      className={cn(
        'transition-shadow',
        isClickable && 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2',
        className
      )}
      data-testid="cogs-coverage-metric-card"
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="h-4 w-4 text-muted-foreground" data-testid="metric-icon" />
            <span className="text-sm font-medium text-muted-foreground">COGS покрытие</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" data-testid="info-icon" />
            </TooltipTrigger>
            <TooltipContent size="md">
              <p>Количество товаров с назначенной себестоимостью</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Value */}
        {error ? (
          <div className="mt-2 text-sm text-destructive">{error}</div>
        ) : (
          <div className="mt-2">
            <span className="text-2xl font-bold">{displayValue}</span>
          </div>
        )}

        {/* Coverage badge */}
        {hasValue && !error && (
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant={getBadgeVariant(coverageValue)}
              className={getBadgeClass(coverageValue)}
            >
              {coverageValue.toFixed(0)}%
            </Badge>
            <span className="text-sm text-muted-foreground">
              {coverageValue >= 100 ? 'Полное покрытие' : 'товаров с COGS'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function handleKeyDown(e: React.KeyboardEvent, onClick: () => void): void {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    onClick()
  }
}
