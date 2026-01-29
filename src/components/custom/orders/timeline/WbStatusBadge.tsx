/**
 * WbStatusBadge Component
 * Story 40.5-FE: History Timeline Components
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Status badge for WB native status codes with color-coding from wb-status-mapping.
 * Shows Russian label with optional final status indicator.
 *
 * @see docs/stories/epic-40/story-40.5-fe-history-timeline-components.md#AC5
 */

'use client'

import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getWbStatusConfig, isWbStatusFinal } from '@/lib/wb-status-mapping'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface WbStatusBadgeProps {
  /** WB status code (e.g., 'created', 'assembling') */
  statusCode: string
  /** Show final status checkmark indicator */
  showFinalIndicator?: boolean
  /** Show tooltip with details on hover */
  showTooltip?: boolean
  /** Badge size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-sm',
  lg: 'px-2.5 py-1 text-sm',
}

/**
 * WbStatusBadge - Displays WB status with color from status config
 */
export function WbStatusBadge({
  statusCode,
  showFinalIndicator = true,
  showTooltip = true,
  size = 'md',
  className,
}: WbStatusBadgeProps) {
  const config = getWbStatusConfig(statusCode)
  const isFinal = isWbStatusFinal(statusCode)
  const showCheckmark = showFinalIndicator && isFinal

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        config.bgColor,
        config.color,
        SIZE_CLASSES[size],
        className
      )}
      aria-label={`Статус: ${config.label}`}
    >
      {config.label}
      {showCheckmark && <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
    </span>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent size="md">
          <div className="space-y-1">
            <div>
              <span className="font-medium">Код:</span> {statusCode}
            </div>
            <div>
              <span className="font-medium">Статус:</span> {config.label}
            </div>
            <div>
              <span className="font-medium">Категория:</span> {config.category}
            </div>
            {isFinal && <div className="text-green-400 font-medium">Финальный статус</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
