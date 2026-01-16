'use client'

import { cn } from '@/lib/utils'
import { getMissingDataReasonMessage } from '@/hooks/useSingleCogsAssignment'
import type { MissingDataReason } from '@/types/api'

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

  // If margin is available, display with color coding
  if (marginPct !== null && marginPct !== undefined) {
    const isPositive = marginPct > 0
    const isZero = marginPct === 0
    const colorClass = isZero ? 'text-gray-600' : isPositive ? 'text-green-600' : 'text-red-600'

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn(sizeClasses[size], colorClass)}>
          {formatMarginPercent(marginPct)}
        </span>
        {size !== 'sm' && !isZero && (
          <span className="text-xs text-gray-500">
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
      <span className={cn(sizeClasses[size], 'text-gray-400')}>—</span>
      {message && size !== 'sm' && (
        <span className="text-xs text-gray-500">{message}</span>
      )}
    </div>
  )
}

/**
 * Compact margin badge for use in tables
 *
 * @example
 * <MarginBadge marginPct={35.5} />
 */
export function MarginBadge({
  marginPct,
  missingDataReason,
}: Omit<MarginDisplayProps, 'className' | 'size'>) {
  if (marginPct !== null && marginPct !== undefined) {
    const isPositive = marginPct > 0
    const isZero = marginPct === 0
    const bgColor = isZero
      ? 'bg-gray-50'
      : isPositive
        ? 'bg-green-50'
        : 'bg-red-50'
    const textColor = isZero
      ? 'text-gray-700'
      : isPositive
        ? 'text-green-700'
        : 'text-red-700'
    const borderColor = isZero
      ? 'border-gray-200'
      : isPositive
        ? 'border-green-200'
        : 'border-red-200'

    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
          bgColor,
          textColor,
          borderColor
        )}
      >
        {formatMarginPercent(marginPct)}
      </span>
    )
  }

  // No margin available
  const message = getMissingDataReasonMessage(missingDataReason || null)

  return (
    <span
      className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-semibold text-gray-500"
      title={message || 'Данные недоступны'}
    >
      —
    </span>
  )
}

/**
 * Margin info card with additional details
 * Shows margin with period and sales statistics
 *
 * @example
 * <MarginInfoCard
 *   marginPct={35.5}
 *   period="2025-W46"
 *   salesQty={50}
 *   revenue={125000.50}
 * />
 */
export interface MarginInfoCardProps {
  marginPct: number | null
  missingDataReason?: MissingDataReason
  period?: string | null
  salesQty?: number | null
  revenue?: number | null
  className?: string
}

export function MarginInfoCard({
  marginPct,
  missingDataReason,
  period,
  salesQty,
  revenue,
  className,
}: MarginInfoCardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <div className="mb-2 text-sm font-medium text-gray-600">Маржинальность</div>

      <MarginDisplay marginPct={marginPct} missingDataReason={missingDataReason} size="lg" />

      {period && marginPct !== null && (
        <div className="mt-3 space-y-1 text-xs text-gray-500">
          <div>Период расчёта: {period}</div>
          {salesQty !== null && salesQty !== undefined && (
            <div>Продано: {salesQty} шт.</div>
          )}
          {revenue !== null && revenue !== undefined && (
            <div>
              Выручка:{' '}
              {new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: 'RUB',
                minimumFractionDigits: 2,
              }).format(revenue)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
