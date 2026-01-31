/**
 * Shared Metric Card States Component
 * Epic 62-FE: Dashboard UI/UX Presentation
 *
 * Reusable skeleton and error state components for dashboard metric cards.
 *
 * @see docs/stories/epic-62/story-62.3-fe-cogs-by-orders-metric-card.md
 * @see docs/stories/epic-62/story-62.4-fe-theoretical-profit-card.md
 */

'use client'

import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface MetricCardErrorProps {
  /** Card title */
  title: string
  /** Icon component */
  icon: React.ComponentType<{ className?: string }>
  /** Error object */
  error: Error
  /** Retry handler */
  onRetry?: () => void
  /** Additional CSS classes */
  className?: string
  /** Minimum height for consistency */
  minHeight?: string
}

/**
 * Error state component for metric cards
 * Displays error message with optional retry button
 */
export function MetricCardError({
  title,
  icon: Icon,
  error,
  onRetry,
  className,
  minHeight = 'min-h-[120px]',
}: MetricCardErrorProps): React.ReactElement {
  return (
    <Card className={cn(minHeight, 'border-red-200', className)} role="alert">
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="mt-2 text-sm text-red-600">{error.message || 'Ошибка загрузки данных'}</div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            Повторить
          </button>
        )}
      </CardContent>
    </Card>
  )
}

export interface StandardSkeletonProps {
  className?: string
  minHeight?: string
}

/**
 * Standard skeleton for regular metric cards (COGS, Orders, etc.)
 */
export function StandardMetricSkeleton({
  className,
  minHeight = 'min-h-[120px]',
}: StandardSkeletonProps): React.ReactElement {
  return (
    <Card className={cn(minHeight, className)} aria-busy="true" aria-hidden="true">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className="mt-2 h-8 w-32" />
        <Skeleton className="mt-2 h-5 w-24" />
        <Skeleton className="mt-1 h-3 w-40" />
      </CardContent>
    </Card>
  )
}

/**
 * Highlighted skeleton for emphasized cards (Theoretical Profit)
 */
export function HighlightedMetricSkeleton({
  className,
  minHeight = 'min-h-[140px]',
}: StandardSkeletonProps): React.ReactElement {
  return (
    <Card className={cn(minHeight, 'border-2', className)} aria-busy="true" aria-hidden="true">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-12 w-44" />
        <Skeleton className="mt-2 h-5 w-32" />
        <Skeleton className="mt-3 h-4 w-28" />
      </CardContent>
    </Card>
  )
}
