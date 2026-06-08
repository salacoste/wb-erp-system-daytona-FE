'use client'

import { cn } from '@/lib/utils'
import { getMissingDataReasonMessage } from '@/hooks/useSingleCogsAssignment'
import type { MissingDataReason } from '@/types/api'

// Re-export components moved to MarginBadge.tsx for backward compatibility
export { MarginBadge, MarginInfoCard } from './MarginBadge'
export type { MarginInfoCardProps } from './MarginBadge'

export interface MarginDisplayProps {
  marginPct: number | null | undefined
  missingDataReason?: MissingDataReason
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Format margin percentage using Intl.NumberFormat
 * Story 4.4 AC4: Margin percentage is formatted using Intl.NumberFormat with style 'percent'
 *
 * @param marginPct - Margin percentage as number (e.g., 35.5 for 35.5%)
 * @returns Formatted string (e.g., "35,50%" in Russian locale)
 *
 * @example
 * formatMarginPercent(35.5) // "35,50%"
 * formatMarginPercent(0) // "0,00%"
 * formatMarginPercent(-12.3) // "-12,30%"
 */
export function formatMarginPercent(marginPct: number): string {
  // Convert percentage number to decimal for Intl.NumberFormat
  // e.g., 35.5% -> 0.355
  const decimalValue = marginPct / 100

  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(decimalValue)
}

/**
 * Margin display component with color coding
 * Story 4.4: Automatic Margin Calculation Display
 *
 * Color coding:
 * - Green: Positive margin (profitable)
 * - Red: Negative margin (loss)
 * - Gray: No data available
 *
 * @example
 * <MarginDisplay marginPct={35.5} />
 * <MarginDisplay marginPct={null} missingDataReason="no_cogs" />
 */
export function MarginDisplay({
  marginPct,
  missingDataReason,
  className,
  size = 'md',
}: MarginDisplayProps) {
  // Size variants
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base font-semibold',
    lg: 'text-2xl font-bold',
  }

  // If margin is available and valid (not NaN or Infinity), display with color coding
  if (marginPct !== null && marginPct !== undefined && Number.isFinite(marginPct)) {
    const isPositive = marginPct > 0
    const isZero = marginPct === 0
    const colorClass = isZero ? 'text-gray-600' : isPositive ? 'text-green-600' : 'text-red-600'

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn(sizeClasses[size], colorClass)}>{formatMarginPercent(marginPct)}</span>
        {size !== 'sm' && !isZero && (
          <span className="text-xs text-gray-500">{isPositive ? '(прибыльно)' : '(убыток)'}</span>
        )}
      </div>
    )
  }

  // If margin is not available, show reason
  const message = getMissingDataReasonMessage(missingDataReason || null)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(sizeClasses[size], 'text-gray-400')}>—</span>
      {message && size !== 'sm' && <span className="text-xs text-gray-500">{message}</span>}
    </div>
  )
}
