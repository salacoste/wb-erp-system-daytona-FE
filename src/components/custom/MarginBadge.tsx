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
    // P2 boundary wave-2 (2026-09-03): financial valence semantics — same tokens as
    // MarginDisplay (Story 174.2-FE §11.12). Sign = money direction, not error/ok status.
    // HOUSE RULE (wave-1 canon): tinted chips need colored text ≥4.5:1 light → /5 tint
    // (fin-pos 4.80 light / 8.72 dark, fin-neg 5.20 / 8.19 over card; /10 and /15 fail
    // light at 4.49 / 4.19 for fin-pos). Border /20 per W2a canon.
    const bgColor = isZero
      ? 'bg-muted'
      : isPositive
        ? 'bg-financial-positive/5'
        : 'bg-financial-negative/5'
    const textColor = isZero
      ? 'text-muted-foreground'
      : isPositive
        ? 'text-financial-positive'
        : 'text-financial-negative'
    const borderColor = isZero
      ? 'border-border'
      : isPositive
        ? 'border-financial-positive/20'
        : 'border-financial-negative/20'

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
      className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground"
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
    <div className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <div className="mb-2 text-sm font-medium text-muted-foreground">Маржинальность</div>

      <MarginDisplay marginPct={marginPct} missingDataReason={missingDataReason} size="lg" />

      {period && marginPct !== null && (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
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
