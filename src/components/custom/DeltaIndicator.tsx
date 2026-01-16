/**
 * Delta Indicator Component
 * Story 6.2-FE: Period Comparison Enhancement
 *
 * Displays delta values with directional icons and color coding.
 * Shows growth (green), decline (red), or stable (gray) indicators.
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Delta display type
 */
export type DeltaType = 'absolute' | 'percentage'

/**
 * Props for DeltaIndicator component
 */
export interface DeltaIndicatorProps {
  /** Delta value (positive = growth, negative = decline) */
  value: number | null | undefined
  /** Display type: absolute (currency) or percentage */
  type?: DeltaType
  /** Invert logic: true when negative is good (e.g., costs) */
  inverse?: boolean
  /** Show tooltip with formatted value */
  showTooltip?: boolean
  /** Custom tooltip text */
  tooltipText?: string
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
}

/**
 * Format delta value based on type
 */
function formatDeltaValue(value: number, type: DeltaType): string {
  const sign = value > 0 ? '+' : ''

  if (type === 'percentage') {
    return `${sign}${value.toFixed(1)}%`
  }

  // Absolute value - format as currency
  return `${sign}${new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)}`
}

/**
 * Get icon based on delta direction
 */
function getDeltaIcon(value: number, inverse: boolean, size: string) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  // Determine if this is "good" (considering inverse)
  const isPositive = inverse ? value < 0 : value > 0
  const isNegative = inverse ? value > 0 : value < 0

  if (value === 0) {
    return <Minus className={iconSize} />
  }

  if (isPositive) {
    return <TrendingUp className={iconSize} />
  }

  if (isNegative) {
    return <TrendingDown className={iconSize} />
  }

  return <Minus className={iconSize} />
}

/**
 * Get color class based on delta direction
 */
function getDeltaColor(value: number, inverse: boolean): string {
  if (value === 0) {
    return 'text-gray-400'
  }

  // Determine if this is "good" (considering inverse)
  const isPositive = inverse ? value < 0 : value > 0

  if (isPositive) {
    return 'text-green-600'
  }

  return 'text-red-600'
}

/**
 * Delta Indicator - displays change values with visual feedback
 *
 * @example
 * // Positive revenue change
 * <DeltaIndicator value={15000} type="absolute" />
 *
 * @example
 * // Percentage change
 * <DeltaIndicator value={12.5} type="percentage" />
 *
 * @example
 * // Cost reduction (negative is good)
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
  // Handle null/undefined
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

  if (!showTooltip) {
    return content
  }

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

/**
 * Compact delta badge for table cells
 */
export interface DeltaBadgeProps {
  /** Delta percentage value */
  value: number | null | undefined
  /** Additional CSS classes */
  className?: string
}

/**
 * Compact delta badge for use in table cells
 *
 * @example
 * <DeltaBadge value={12.5} />
 */
export function DeltaBadge({ value, className }: DeltaBadgeProps) {
  if (value === null || value === undefined) {
    return <span className={cn('text-gray-400 text-xs', className)}>—</span>
  }

  const isPositive = value > 0
  const isNegative = value < 0
  const sign = isPositive ? '+' : ''

  const bgColor = isPositive
    ? 'bg-green-100 text-green-700'
    : isNegative
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-500'

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
        bgColor,
        className
      )}
    >
      {sign}
      {value.toFixed(1)}%
    </span>
  )
}
