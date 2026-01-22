'use client'

/**
 * CoefficientsLoadingSkeleton Component
 * Story 44.34-FE: Debounce Warehouse Selection & Rate Limit Handling
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Loading skeleton for coefficient fields during debounce/API fetch
 * Features: Smooth animation, label hints, spinner indicator
 */

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export interface CoefficientsLoadingSkeletonProps {
  /** Number of coefficient fields to show */
  fieldCount?: number
  /** Show loading message */
  showMessage?: boolean
  /** Custom loading message */
  message?: string
}

/**
 * Loading skeleton for coefficient fields
 *
 * AC2: Loading State During Debounce
 * Shows during 500ms debounce and API fetch
 */
export function CoefficientsLoadingSkeleton({
  fieldCount = 3,
  showMessage = true,
  message = 'Загрузка коэффициентов...',
}: CoefficientsLoadingSkeletonProps) {
  return (
    <Card className="overflow-hidden" role="status" aria-busy="true">
      <CardContent className="pt-6 space-y-4">
        {/* Coefficient field skeletons */}
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div key={index} className="space-y-2">
            {/* Label skeleton */}
            <Skeleton
              className="h-4 w-32 bg-muted/50"
              aria-hidden="true"
            />

            {/* Input skeleton */}
            <Skeleton
              className="h-10 w-full bg-muted/50"
              aria-hidden="true"
            />
          </div>
        ))}

        {/* Loading message with spinner - accessible */}
        {showMessage && (
          <div
            className="flex items-center gap-2 text-sm text-muted-foreground pt-2"
            aria-live="polite"
          >
            <div
              className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"
              role="status"
              aria-label="Загрузка"
            />
            <span>{message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
