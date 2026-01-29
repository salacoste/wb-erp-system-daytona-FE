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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import {
  calculateComparison,
  type TrendDirection,
  type ComparisonResult,
} from '@/lib/comparison-helpers'
import { TrendIndicator } from './TrendIndicator'
import { ComparisonBadge } from './ComparisonBadge'

export type MetricFormat = 'currency' | 'percentage' | 'number'

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
}

const FORMAT_FN: Record<MetricFormat, (value: number) => string> = {
  currency: formatCurrency,
  percentage: formatPercentage,
  number: (v: number) => new Intl.NumberFormat('ru-RU').format(v),
}

/** Check if user prefers reduced motion (safely handles SSR and test environments) */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
        <CardHeader title={title} icon={Icon} tooltip={tooltip} />
        {error ? (
          <div className="mt-2 text-sm text-destructive">{error}</div>
        ) : (
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
        )}
        <ComparisonRow
          comparison={comparison}
          previousValue={previousValue}
          formatValue={formatValue}
          hasError={!!error}
        />
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

export type { TrendDirection }

interface CardHeaderProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  tooltip?: string
}

function CardHeader({ title, icon: Icon, tooltip }: CardHeaderProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" data-testid="metric-icon" />}
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground cursor-help" data-testid="info-icon" />
          </TooltipTrigger>
          <TooltipContent size="md">
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

interface ComparisonRowProps {
  comparison: ComparisonResult | null
  previousValue: number | null | undefined
  formatValue: (v: number) => string
  hasError: boolean
}

function ComparisonRow({
  comparison,
  previousValue,
  formatValue,
  hasError,
}: ComparisonRowProps): React.ReactElement | null {
  if (hasError) return null

  if (comparison) {
    return (
      <div className="mt-1 flex items-center gap-1.5">
        <TrendIndicator direction={comparison.direction} size="sm" />
        <ComparisonBadge
          percentageChange={comparison.percentageChange}
          direction={comparison.direction}
          absoluteDifference={comparison.formattedDifference}
        />
        <span className="text-sm text-muted-foreground">(vs {formatValue(previousValue!)})</span>
      </div>
    )
  }

  if (previousValue === null || previousValue === undefined) {
    return (
      <div className="mt-1">
        <span className="text-sm text-muted-foreground">Нет данных за предыдущий период</span>
      </div>
    )
  }

  return null
}
