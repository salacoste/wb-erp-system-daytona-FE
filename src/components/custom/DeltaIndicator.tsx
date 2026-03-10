/**
 * Delta Indicator Component
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Displays delta values with directional icons and color coding.
 * Shows growth (green), decline (red), or stable (gray) indicators.
 */

import { Minus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  formatDeltaValue,
  getDeltaIcon,
  getDeltaColor,
  type DeltaType,
} from './delta-indicator-helpers'

export type { DeltaType }
export { DeltaBadge, type DeltaBadgeProps } from './delta-indicator-helpers'

export interface DeltaIndicatorProps {
  value: number | null | undefined
  type?: DeltaType
  inverse?: boolean
  showTooltip?: boolean
  tooltipText?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Delta Indicator - displays change values with visual feedback
 *
 * @example
 * <DeltaIndicator value={15000} type="absolute" />
 * <DeltaIndicator value={12.5} type="percentage" />
 * <DeltaIndicator value={-5000} type="absolute" inverse />
 */
export function DeltaIndicator({
  value,
  type = 'percentage',
  inverse = false,
  showTooltip = true,
  tooltipText,
  size = 'md',
  className,
}: DeltaIndicatorProps) {
  if (value === null || value === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-gray-400', className)}>
        <Minus className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        <span className={size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}>
          —
        </span>
      </span>
    )
  }

  const icon = getDeltaIcon(value, inverse, size)
  const colorClass = getDeltaColor(value, inverse)
  const formattedValue = formatDeltaValue(value, type)
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium transition-colors',
        colorClass,
        textSize,
        className
      )}
      role="img"
      aria-label={`Изменение: ${formattedValue}`}
    >
      {icon}
      <span>{formattedValue}</span>
    </span>
  )

  if (!showTooltip) return content

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText || `Изменение: ${formattedValue}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
