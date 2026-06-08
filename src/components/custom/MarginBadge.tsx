/**
 * MarginBadge and MarginInfoCard components
 * Extracted from MarginDisplay.tsx for file size compliance
 */

'use client'

import { cn } from '@/lib/utils'
import { getMissingDataReasonMessage } from '@/hooks/useSingleCogsAssignment'
import type { MissingDataReason } from '@/types/api'
import { formatMarginPercent, MarginDisplay, type MarginDisplayProps } from './MarginDisplay'

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
  // Check for valid finite number (handles null, undefined, NaN, Infinity)
  if (marginPct !== null && marginPct !== undefined && Number.isFinite(marginPct)) {
    const isPositive = marginPct > 0
    const isZero = marginPct === 0
    const bgColor = isZero ? 'bg-gray-50' : isPositive ? 'bg-green-50' : 'bg-red-50'
    const textColor = isZero ? 'text-gray-700' : isPositive ? 'text-green-700' : 'text-red-700'
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

  // No margin available (null, undefined, NaN, or Infinity)
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
 * <MarginInfoCard marginPct={35.5} period="2025-W46" salesQty={50} revenue={125000.50} />
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
          {salesQty !== null && salesQty !== undefined && <div>Продано: {salesQty} шт.</div>}
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
