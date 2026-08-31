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
 * Color coding (Story 174.2-FE §11.12: financial valence semantics):
 * - financial-positive: Positive margin (profitable)
 * - financial-negative: Negative margin (loss)
 * - muted-foreground: zero margin and no-data states
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
    // 174.2: financial valence tokens (169.4 canon) — positive/negative sign,
    // zero → muted (neutral). Supplementary annotation stays muted.
    const colorClass = isZero
      ? 'text-muted-foreground'
      : isPositive
        ? 'text-financial-positive'
        : 'text-financial-negative'

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn(sizeClasses[size], colorClass)}>{formatMarginPercent(marginPct)}</span>
        {size !== 'sm' && !isZero && (
          <span className="text-xs text-muted-foreground">
            {isPositive ? '(прибыльно)' : '(убыток)'}
          </span>
        )}
      </div>
    )
  }

  // If margin is not available, show reason
  const message = getMissingDataReasonMessage(missingDataReason || null)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(sizeClasses[size], 'text-muted-foreground')}>—</span>
      {message && size !== 'sm' && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  )
}
