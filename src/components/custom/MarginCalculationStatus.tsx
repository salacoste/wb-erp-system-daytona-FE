/**
 * Component for displaying margin calculation status
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 */

'use client'

import { Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface MarginCalculationStatusProps {
  /** Whether margin calculation is in progress */
  isPolling: boolean
  /** Current polling attempt number (1-based) */
  attempts: number
  /** Maximum polling attempts */
  maxAttempts: number
  /** Estimated calculation time in milliseconds */
  estimatedTime: number
  /** Whether this is a bulk operation */
  isBulk?: boolean
  /** Number of products in bulk operation */
  bulkCount?: number
  /** Optional custom className */
  className?: string
}

/**
 * Component to display margin calculation progress
 * Shows spinner, progress bar, and status message
 *
 * @example
 * <MarginCalculationStatus
 *   isPolling={true}
 *   attempts={3}
 *   maxAttempts={10}
 *   estimatedTime={10000}
 * />
 */
export function MarginCalculationStatus({
  isPolling,
  attempts,
  maxAttempts,
  estimatedTime,
  isBulk = false,
  bulkCount,
  className,
}: MarginCalculationStatusProps) {
  if (!isPolling) {
    return null
  }

  const progress = Math.min((attempts / maxAttempts) * 100, 100)
  const estimatedSeconds = Math.round(estimatedTime / 1000)

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-blue-50 p-4',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Расчёт маржи в процессе"
    >
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-900">
            {isBulk && bulkCount
              ? `Расчёт маржи для ${bulkCount} товаров...`
              : 'Расчёт маржи...'}
          </div>
          <div className="mt-1 text-xs text-blue-700">
            Ожидаемое время: ~{estimatedSeconds}с
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <Progress value={progress} className="h-2" />
        <div className="mt-1 text-xs text-blue-600">
          Попытка {attempts} из {maxAttempts}
        </div>
      </div>
    </div>
  )
}

