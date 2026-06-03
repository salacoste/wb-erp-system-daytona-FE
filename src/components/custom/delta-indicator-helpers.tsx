/**
 * DeltaIndicator helpers and DeltaBadge
 * Extracted from DeltaIndicator.tsx for file size compliance
 * Story 6.2-FE: Period Comparison Enhancement
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatPercentage } from '@/lib/utils'

export type DeltaType = 'absolute' | 'percentage'

/** Format delta value based on type */
export function formatDeltaValue(value: number, type: DeltaType): string {
  const sign = value > 0 ? '+' : ''

  if (type === 'percentage') {
    return `${sign}${formatPercentage(value, 1)}`
  }

  return `${sign}${new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)}`
}

/** Get icon based on delta direction */
export function getDeltaIcon(value: number, inverse: boolean, size: string) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'

  const isPositive = inverse ? value < 0 : value > 0
  const isNegative = inverse ? value > 0 : value < 0

  if (value === 0) return <Minus className={iconSize} />
  if (isPositive) return <TrendingUp className={iconSize} />
  if (isNegative) return <TrendingDown className={iconSize} />
  return <Minus className={iconSize} />
}

/** Get color class based on delta direction */
export function getDeltaColor(value: number, inverse: boolean): string {
  if (value === 0) return 'text-gray-400'
  const isPositive = inverse ? value < 0 : value > 0
  if (isPositive) return 'text-green-600'
  return 'text-red-600'
}

/** Compact delta badge for table cells */
export interface DeltaBadgeProps {
  value: number | null | undefined
  className?: string
}

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
      {formatPercentage(value, 1)}
    </span>
  )
}
