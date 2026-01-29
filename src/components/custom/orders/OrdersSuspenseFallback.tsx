/**
 * Orders Suspense Fallback Component
 * Story 40.7-FE: Integration & Polish
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Suspense fallback for lazy-loaded Orders components.
 * Shows spinner with loading text in Russian.
 */

'use client'

import { Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export interface OrdersSuspenseFallbackProps {
  /** Variant: minimal (spinner only) or skeleton (full skeleton) */
  variant?: 'minimal' | 'skeleton'
}

/**
 * Suspense fallback for lazy-loaded Orders components
 */
export function OrdersSuspenseFallback({ variant = 'minimal' }: OrdersSuspenseFallbackProps) {
  if (variant === 'skeleton') {
    return (
      <div className="space-y-4 p-4" data-testid="orders-suspense-skeleton">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-8"
      data-testid="orders-suspense-fallback"
      aria-busy="true"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Загрузка...</p>
    </div>
  )
}
