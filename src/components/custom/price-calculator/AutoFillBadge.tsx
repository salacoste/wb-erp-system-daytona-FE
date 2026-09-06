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
          // p2-wave-6: fg-on-tint — success on success/10 = 4.49/7.97 and warn
          // on warn/10 = 4.24/10.90 (FAIL 4.5); text-foreground per tint: warn/10 =
          // 14.18/14.73, success/10 = 14.11/15.36.
          // Valence = tint + border (wave-4 SourceBadge precedent).
          isAuto && 'bg-status-success/10 text-foreground border-status-success/30',
          !isAuto && 'bg-status-warning/10 text-foreground border-status-warning/30',
          className
        )}
        aria-live="polite"
      >
        {isAuto ? 'Авто' : 'Вручную'}
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
          // p2-wave-6: fg-on-tint (see legacy API above) — success on
          // success/10 = 4.49/7.97, warn on warn/10 = 4.24/10.90 FAIL;
          // text-foreground per tint: warn/10 = 14.18/14.73,
          // success/10 = 14.11/15.36. Valence = tint + border.
          isAuto && 'bg-status-success/10 text-foreground border-status-success/30',
          isModified && 'bg-status-warning/10 text-foreground border-status-warning/30'
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
            // p2-80-sweep: /80 hover-darken removed. p2-wave-6: the ghost
            // hover:bg-accent layer under warn text = 4.41 light (FAIL) →
            // hover switches to fg-on-accent (14.77/14.50); rest warn on
            // card = 4.81/13.38 PASS.
            'text-status-warning hover:text-foreground',
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
