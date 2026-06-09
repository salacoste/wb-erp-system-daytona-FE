/**
 * Expense Metric Card - Skeleton and Error states
 * Extracted from ExpenseMetricCard.tsx for file size compliance
 */

'use client'

import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

/** Skeleton loading state */
export function ExpenseCardSkeleton({ className }: { className?: string }): React.ReactElement {
  return (
    <Card className={className} data-testid="expense-card-skeleton" aria-busy="true">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="mt-1 h-7 w-32" />
        <Skeleton className="mt-1 h-3 w-28" />
        <Skeleton className="mt-1 h-3 w-20" />
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

/** Error state with retry */
export function ExpenseCardError({ title, icon: Icon, error, onRetry, className }: ErrorProps) {
  return (
    <Card className={className} data-testid="expense-card-error" role="alert">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="mt-2 text-sm text-destructive">Ошибка загрузки данных</div>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="mr-1 h-3 w-3" />
            Повторить
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
