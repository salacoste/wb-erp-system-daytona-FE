/**
 * MetricCardEnhanced Component for Story 60.3-FE
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * Enhanced metric card with trend indicators and comparison badges.
 * @see docs/stories/epic-60/story-60.3-fe-enhanced-metric-card.md
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency, formatPercentage, formatRoas } from '@/lib/utils'
import { calculateComparison, type TrendDirection } from '@/lib/comparison-helpers'
import { CogsMissingState } from './CogsMissingState'
import {
  prefersReducedMotion,
  handleKeyDown,
  MetricCardHeader,
  ComparisonRow,
  type MetricFormat,
} from './MetricCardEnhancedParts'

export type { MetricFormat }

export interface MetricCardEnhancedProps {
  title: string
  value: number | null | undefined
  previousValue?: number | null
  format?: MetricFormat
  icon?: React.ComponentType<{ className?: string }>
  tooltip?: string
  isLoading?: boolean
  error?: string | null
  invertComparison?: boolean
  className?: string
  onClick?: () => void
  showCogsWarning?: boolean
  productsWithCogs?: number
  totalProducts?: number
  cogsCoverage?: number
  onAssignCogs?: () => void
}

const FORMAT_FN: Record<MetricFormat, (value: number) => string> = {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: (v: number) => new Intl.NumberFormat('ru-RU').format(v),
  roas: formatRoas,
}

export function MetricCardEnhanced({
  title,
  value,
  previousValue,
  format = 'currency',
  icon: Icon,
  tooltip,
  isLoading = false,
  error = null,
  invertComparison = false,
  className,
  onClick,
  showCogsWarning = false,
  productsWithCogs = 0,
  totalProducts = 0,
  cogsCoverage = 0,
  onAssignCogs,
}: MetricCardEnhancedProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card data-testid="metric-card-skeleton" aria-busy="true">
        <CardContent className="p-4 min-h-[120px]">
          <div className="flex items-center gap-2">
            {Icon && <Skeleton className="h-5 w-5 rounded" aria-hidden="true" />}
            <Skeleton className="h-4 w-24" aria-hidden="true" />
          </div>
          <Skeleton className="mt-2 h-8 w-32" aria-hidden="true" />
          <Skeleton className="mt-1 h-4 w-20" aria-hidden="true" />
        </CardContent>
      </Card>
    )
  }

  const formatValue = FORMAT_FN[format]
  const hasValue = value !== null && value !== undefined
  const displayValue = hasValue ? formatValue(value) : '—'
  const comparison =
    hasValue && previousValue !== null && previousValue !== undefined
      ? calculateComparison(value, previousValue, invertComparison)
      : null
  const isClickable = !!onClick

  return (
    <Card
      data-testid="metric-card"
      role="article"
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? e => handleKeyDown(e, onClick) : undefined}
      className={cn(
        'transition-shadow',
        isClickable && 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2',
        className
      )}
    >
      <CardContent className="p-4">
        <MetricCardHeader title={title} icon={Icon} tooltip={tooltip} />
        {error ? (
          <div className="mt-2 text-sm text-destructive">{error}</div>
        ) : showCogsWarning && value === null ? (
          <CogsMissingState
            productsWithCogs={productsWithCogs}
            totalProducts={totalProducts}
            coverage={cogsCoverage}
            onAssignCogs={onAssignCogs}
          />
        ) : (
          <>
            <div
              key={`value-${value}`}
              className="mt-2 animate-in fade-in duration-200"
              style={{
                animationDuration: prefersReducedMotion() ? '0ms' : '200ms',
              }}
            >
              <span className="text-2xl font-bold" data-testid="metric-value">
                {displayValue}
              </span>
            </div>
            <ComparisonRow
              comparison={comparison}
              previousValue={previousValue}
              formatValue={formatValue}
              hasError={!!error}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export type { TrendDirection }
