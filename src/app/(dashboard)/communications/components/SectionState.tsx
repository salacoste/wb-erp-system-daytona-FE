'use client'

/**
 * SectionState — NEW-2 shared tri-state body (loading / error / empty) for the
 * independent Communications sections (AC4). Each section renders its populated
 * branch itself and delegates the other three states here to stay <200 lines.
 *
 * Error renders a canonical RU message + retry (the WB sync may be unavailable).
 * Loading renders a scoped skeleton. Empty renders a muted RU placeholder.
 */

import { useCallback } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface SectionStateProps {
  isLoading: boolean
  isError: boolean
  /** True when the data loaded but has no rows/items (empty branch). */
  isEmpty: boolean
  /** Canonical RU error message for this section. */
  errorMessage: string
  /** Canonical RU empty message for this section. */
  emptyMessage: string
  /** Refetch callback (Retry button). */
  onRetry: () => void
  /** Children rendered only in the populated branch (caller controls layout). */
  children?: React.ReactNode
}

/** Render loading/error/empty, else children (populated). */
export function SectionState({
  isLoading,
  isError,
  isEmpty,
  errorMessage,
  emptyMessage,
  onRetry,
  children,
}: SectionStateProps) {
  const handleRetry = useCallback(() => onRetry(), [onRetry])

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Загрузка">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{errorMessage}</span>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Повторить
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (isEmpty) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return <>{children}</>
}
