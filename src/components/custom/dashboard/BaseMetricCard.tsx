/**
 * BaseMetricCard — Foundation for all dashboard metric cards (Story 65.19)
 * Two variants: standard (text-2xl) and highlighted (text-4xl, border-2, gradient).
 * @see docs/epics/epic-65-dashboard-metrics-parity/stories-wave-4-ux.md
 */

'use client'

import { clsx } from 'clsx'
import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendIndicator } from '@/components/custom/TrendIndicator'
import { ComparisonBadge } from '@/components/custom/ComparisonBadge'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { calculateComparison, type TrendDirection } from '@/lib/comparison-helpers'
import { BaseMetricCardSkeleton, BaseMetricCardError } from './BaseMetricCardParts'

export interface BaseMetricCardProps {
  title: string
  tooltip: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
  accentColor: string
  value: number | null | undefined
  previousValue?: number | null | undefined
  format: 'currency' | 'percent' | 'number' | 'days'
  inverted?: boolean
  secondaryValue?: string
  variant?: 'standard' | 'highlighted'
  valueColor?: string
  sentimentBg?: boolean
  badge?: React.ReactNode
  actions?: React.ReactNode
  subtitle?: React.ReactNode
  breakdownCount?: number
  onBreakdownClick?: () => void
  isLoading?: boolean
  error?: Error | null
  onRetry?: () => void
  className?: string
  'data-testid'?: string
}

function formatValue(value: number, format: BaseMetricCardProps['format']): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percent':
      return formatPercentage(value)
    case 'number':
      return new Intl.NumberFormat('ru-RU').format(value)
    case 'days':
      return `${value} дн.`
  }
}

function getSentimentClasses(direction: TrendDirection): string {
  if (direction === 'positive') return 'bg-green-50 border-green-200'
  if (direction === 'negative') return 'bg-red-50 border-red-200'
  return ''
}

export function BaseMetricCard(props: BaseMetricCardProps): React.ReactElement {
  const {
    title,
    tooltip,
    icon: Icon,
    accentColor,
    value,
    previousValue,
    format,
    inverted = false,
    secondaryValue,
    variant = 'standard',
    valueColor,
    sentimentBg = false,
    badge,
    actions,
    subtitle,
    breakdownCount,
    onBreakdownClick,
    isLoading = false,
    error,
    onRetry,
    className,
    'data-testid': testId,
  } = props

  const isHighlighted = variant === 'highlighted'

  if (isLoading) {
    return <BaseMetricCardSkeleton variant={variant} className={className} />
  }

  if (error) {
    return (
      <BaseMetricCardError
        title={title}
        icon={Icon}
        error={error}
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const comparison =
    value != null && previousValue != null
      ? calculateComparison(value, previousValue, inverted)
      : null

  const formattedValue = value != null ? formatValue(value, format) : null
  const ariaValue = formattedValue ?? 'нет данных'

  const sentimentClasses =
    sentimentBg && !isHighlighted && comparison ? getSentimentClasses(comparison.direction) : ''

  // Use clsx (not cn/twMerge) so transition-shadow + transition-colors both survive
  const cardClasses = clsx(
    'rounded-xl border bg-card text-card-foreground shadow',
    'transition-shadow transition-colors hover:shadow-md',
    isHighlighted && 'border-2 bg-gradient-to-br from-green-50 to-white',
    sentimentClasses,
    className
  )

  return (
    <div
      className={cardClasses}
      role="article"
      aria-label={`${title}: ${ariaValue}`}
      data-testid={testId}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', accentColor)} aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {breakdownCount != null && (
              <button
                data-testid="breakdown-badge"
                onClick={onBreakdownClick}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
              >
                {breakdownCount}
              </button>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Подробнее о метрике ${title}`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent size="md">
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-1">
          <span
            data-testid="metric-value"
            className={cn('font-bold', isHighlighted ? 'text-4xl' : 'text-2xl', valueColor)}
          >
            {formattedValue ?? '—'}
          </span>
          {secondaryValue && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{secondaryValue}</span>
            </>
          )}
        </div>

        {comparison && (
          <div className="mt-2 flex items-center gap-1.5">
            <TrendIndicator direction={comparison.direction} size="sm" />
            <ComparisonBadge
              percentageChange={comparison.percentageChange}
              direction={comparison.direction}
              absoluteDifference={comparison.formattedDifference}
            />
          </div>
        )}

        {badge && <div className="mt-2">{badge}</div>}
        {subtitle && <div className="mt-1">{subtitle}</div>}
        {actions && <div className="mt-2">{actions}</div>}
      </div>
    </div>
  )
}
