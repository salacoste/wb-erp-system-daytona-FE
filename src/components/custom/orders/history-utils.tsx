/**
 * History Tab Utilities
 * Story 40.4-FE: Order Details Modal
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Shared formatting functions and UI components for history tabs.
 */

import { AlertCircle, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format ISO timestamp to Russian date format: DD.MM.YYYY HH:mm
 */
export function formatHistoryTimestamp(isoDate: string): string {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${day}.${month}.${year} ${hours}:${minutes}`
}

/**
 * Format duration in minutes to human readable Russian format
 * @example formatDuration(90) => "1 ч 30 мин"
 * @example formatDuration(1500) => "1 д 1 ч"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} мин`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours} ч ${remainingMinutes} мин` : `${hours} ч`
  }
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days} д ${remainingHours} ч` : `${days} д`
}

// ============================================================================
// Shared UI Components
// ============================================================================

interface TabErrorStateProps {
  onRetry: () => void
}

/**
 * Error state for history tabs with retry button
 */
export function TabErrorState({ onRetry }: TabErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="ml-2 flex items-center gap-2">
        Не удалось загрузить данные.
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4 mr-1" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
}

interface EmptyStateProps {
  message: string
}

/**
 * Empty state for history tabs
 */
export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <p>{message}</p>
    </div>
  )
}

/**
 * Timeline skeleton loading state
 */
export function TimelineSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 py-2">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
