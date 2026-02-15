/**
 * BaseMetricCard sub-components — Skeleton and Error states
 * Extracted to keep BaseMetricCard under 200 lines.
 *
 * @see BaseMetricCard.tsx — Story 65.19
 */

'use client'

import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  variant?: 'standard' | 'highlighted'
  className?: string
}

/** Skeleton for BaseMetricCard — adapts to variant */
export function BaseMetricCardSkeleton({
  variant = 'standard',
  className,
}: SkeletonProps): React.ReactElement {
  const isHighlighted = variant === 'highlighted'

  return (
    <Card
      className={cn(isHighlighted ? 'min-h-[140px] border-2' : 'min-h-[120px]', className)}
      aria-busy="true"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-4 w-4 rounded" />
        </div>
        <Skeleton className={cn('mt-2', isHighlighted ? 'h-12 w-44' : 'h-8 w-32')} />
        <Skeleton className="mt-2 h-5 w-24" />
        <Skeleton className="mt-1 h-3 w-40" />
      </CardContent>
    </Card>
  )
}

interface ErrorProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  error: Error
  onRetry?: () => void
  className?: string
}

/** Error state for BaseMetricCard */
export function BaseMetricCardError({
  title,
  icon: Icon,
  error,
  onRetry,
  className,
}: ErrorProps): React.ReactElement {
  return (
    <Card className={cn('border-red-200', className)} role="alert">
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
