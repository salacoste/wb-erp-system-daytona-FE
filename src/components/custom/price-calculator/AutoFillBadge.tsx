'use client'

/**
 * AutoFillBadge Component
 * Story 44.13-FE: Auto-fill Coefficients from Warehouse
 * Story 44.26b-FE: Auto-fill Dimensions & Category
 * Epic 44: Price Calculator UI (Frontend)
 *
 * Visual indicator for auto-filled vs manually entered/modified values
 * Supports restore functionality when values are modified
 */

import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AutoFillStatus } from '@/types/price-calculator'

/** Source type for coefficient fields (backward compatibility) */
export type FieldSource = 'auto' | 'manual'

export interface AutoFillBadgeProps {
  /**
   * Badge status determines display variant (new API):
   * - 'auto': Green "Автозаполнено" badge
   * - 'modified': Yellow "Изменено" badge with restore button
   * - 'none': Nothing rendered
   */
  status?: AutoFillStatus
  /**
   * Legacy source prop (backward compatibility with Story 44.13):
   * - 'auto': Green "Автозаполнено" badge
   * - 'manual': Yellow "Вручную" badge
   */
  source?: FieldSource
  /** Callback when restore button is clicked (only for 'modified' status) */
  onRestore?: () => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Badge showing auto-fill status with optional restore functionality
 *
 * Supports two APIs for backward compatibility:
 *
 * New API (Story 44.26b):
 * - status='auto': "Автозаполнено" (green)
 * - status='modified': "Изменено" (yellow) + restore button
 * - status='none': nothing rendered
 *
 * Legacy API (Story 44.13):
 * - source='auto': "Автозаполнено" (green)
 * - source='manual': "Вручную" (yellow)
 */
export function AutoFillBadge({ status, source, onRestore, className }: AutoFillBadgeProps) {
  // Handle legacy source prop for backward compatibility
  if (source !== undefined && status === undefined) {
    const isAuto = source === 'auto'
    return (
      <Badge
        variant={isAuto ? 'secondary' : 'outline'}
        className={cn(
          'text-xs font-normal transition-colors duration-200',
          isAuto && 'bg-green-100 text-green-700 border-green-200',
          !isAuto && 'bg-yellow-100 text-yellow-700 border-yellow-200',
          className
        )}
        aria-live="polite"
      >
        {isAuto ? 'Автозаполнено' : 'Вручную'}
      </Badge>
    )
  }

  // New status-based API
  // Don't render anything for 'none' status or undefined
  if (!status || status === 'none') {
    return null
  }

  const isAuto = status === 'auto'
  const isModified = status === 'modified'

  return (
    <div
      className={cn('inline-flex items-center gap-1.5 transition-all duration-200', className)}
      role="status"
      aria-live="polite"
    >
      <Badge
        variant={isAuto ? 'secondary' : 'outline'}
        className={cn(
          'text-xs font-normal transition-colors duration-200',
          isAuto && 'bg-green-100 text-green-700 border-green-200',
          isModified && 'bg-yellow-100 text-yellow-700 border-yellow-200'
        )}
      >
        {isAuto ? 'Автозаполнено' : 'Изменено'}
      </Badge>

      {isModified && onRestore && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRestore}
          className={cn(
            'h-6 px-2 text-xs font-normal',
            'text-yellow-700 hover:text-yellow-800',
            'hover:bg-yellow-100/50',
            'transition-colors duration-200'
          )}
          aria-label="Восстановить автозаполненные значения"
        >
          <RotateCcw className="h-3 w-3 mr-1" aria-hidden="true" />
          Восстановить
        </Button>
      )}
    </div>
  )
}
