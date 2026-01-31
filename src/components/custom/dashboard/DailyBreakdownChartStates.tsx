/**
 * DailyBreakdownChart State Components
 * Story 62.6-FE: Daily Breakdown Chart Component
 *
 * Loading, error, and empty state components for the daily breakdown chart.
 *
 * @see docs/stories/epic-62/story-62.6-fe-daily-breakdown-chart.md
 */

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ============================================================================
// Loading Skeleton
// ============================================================================

interface ChartLoadingSkeletonProps {
  className?: string
}

export function ChartLoadingSkeleton({ className }: ChartLoadingSkeletonProps) {
  return (
    <div className={cn('w-full', className)}>
      <Skeleton className="h-60 w-full md:h-70 lg:h-80" />
    </div>
  )
}

// ============================================================================
// Error State
// ============================================================================

interface ChartErrorStateProps {
  error: Error
  className?: string
}

export function ChartErrorState({ error, className }: ChartErrorStateProps) {
  return (
    <div className={cn('flex h-60 w-full items-center justify-center md:h-70 lg:h-80', className)}>
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Ошибка загрузки данных: {error.message}</AlertDescription>
      </Alert>
    </div>
  )
}

// ============================================================================
// Empty State
// ============================================================================

interface ChartEmptyStateProps {
  className?: string
}

export function ChartEmptyState({ className }: ChartEmptyStateProps) {
  return (
    <div className={cn('flex h-60 w-full items-center justify-center md:h-70 lg:h-80', className)}>
      <p className="text-gray-500">Нет данных для отображения</p>
    </div>
  )
}

// ============================================================================
// Partial Data Warning
// ============================================================================

interface ChartPartialDataWarningProps {
  actualDays: number
  expectedDays: number
}

export function ChartPartialDataWarning({
  actualDays,
  expectedDays,
}: ChartPartialDataWarningProps) {
  return (
    <Alert variant="default" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        Данные доступны за {actualDays} из {expectedDays} дней
      </AlertDescription>
    </Alert>
  )
}
