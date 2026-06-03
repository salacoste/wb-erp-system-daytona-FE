'use client'

import Link from 'next/link'
import { Info, History, ChevronRight } from 'lucide-react'
import { isCogsAfterLastCompletedWeek, getLastCompletedWeek } from '@/lib/margin-helpers'
import { cn, formatWeeksAgoShort, formatPercentage } from '@/lib/utils'
import { formatCogs } from '@/hooks/useSingleCogsAssignment-utils'
import type { ProductListItem } from '@/types/api'

/**
 * Request #33/#35 UX: Unified COGS Not Assigned Context
 * Shows for ALL COGS_NOT_ASSIGNED cases:
 * - Product with future COGS (valid_from > week midpoint)
 * - Product with no applicable COGS for current week
 * - Product with no COGS at all
 *
 * Unified layout matching HistoricalMarginContext:
 * 1. Status line with icon ("Нет продаж за W47" or "Нет COGS")
 * 2. Additional info (applicable COGS if different, or "no COGS" message)
 * 3. Historical margin context OR "no sales in 12 weeks" message
 * 4. History link
 */
export interface COGSNotAssignedContextProps {
  product: ProductListItem
  enableMarginDisplay: boolean
}

function formatWeekShort(week: string | null | undefined): string {
  if (!week) return '—'
  const match = week.match(/W\d+/)
  return match ? match[0] : week
}

function getMarginColorClass(margin: number | null): string {
  if (margin === null) return 'text-muted-foreground'
  if (margin > 0) return 'text-green-600'
  if (margin < 0) return 'text-red-600'
  return 'text-muted-foreground'
}

export function COGSNotAssignedContext({
  product,
  enableMarginDisplay,
}: COGSNotAssignedContextProps): React.ReactElement {
  const lastCompletedWeek = getLastCompletedWeek()

  // Check for historical data
  const hasHistoricalData = product.last_sales_week != null

  // Determine if product has any COGS at all
  const hasAnyCogs = product.has_cogs && product.cogs

  // Check if COGS is from future date
  const hasFutureCogs =
    hasAnyCogs && product.cogs!.valid_from && isCogsAfterLastCompletedWeek(product.cogs!.valid_from)

  return (
    <div className="space-y-2" role="region" aria-label="COGS не назначен">
      {/* Line 1: Status - depends on whether product has COGS */}
      <div
        className="flex items-center gap-1.5 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {hasFutureCogs
            ? `Нет продаж за ${formatWeekShort(lastCompletedWeek)}`
            : hasAnyCogs
              ? `Нет COGS для ${formatWeekShort(lastCompletedWeek)}`
              : 'Нет COGS'}
        </span>
      </div>

      {/* Line 2: Applicable COGS info (only if has future COGS) */}
      {hasFutureCogs &&
        (product.applicable_cogs && !product.applicable_cogs.is_same_as_current ? (
          <div
            className="flex items-center gap-1.5 text-xs text-blue-600"
            title={`COGS ${formatCogs(product.applicable_cogs.unit_cost_rub)} действует с ${product.applicable_cogs.valid_from.split('T')[0]}`}
          >
            <Info className="h-3 w-3" aria-hidden="true" />
            <span>
              {/* formatCogs: Russian locale + ₽, and parseFloats the backend's string unit_cost_rub
                  (the embedded product cogs is NOT boundary-normalized — raw "500" → "500,00 ₽"). */}
              COGS для {product.applicable_cogs.applies_to_week}:{' '}
              {formatCogs(product.applicable_cogs.unit_cost_rub)}
            </span>
          </div>
        ) : !product.applicable_cogs ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3" aria-hidden="true" />
            <span>Нет предыдущих COGS</span>
          </div>
        ) : null)}

      {/* Line 3: Historical margin context */}
      {hasHistoricalData ? (
        <div className="mt-1 text-xs">
          <span className="text-muted-foreground">Последняя продажа: </span>
          <span className="text-foreground font-medium">
            {formatWeekShort(product.last_sales_week!)}
          </span>
          {enableMarginDisplay && product.last_sales_margin_pct != null && (
            <>
              <span className="text-muted-foreground"> • </span>
              <span
                className={cn('font-semibold', getMarginColorClass(product.last_sales_margin_pct))}
              >
                {formatPercentage(product.last_sales_margin_pct)}
              </span>
            </>
          )}
          {product.last_sales_qty != null && (
            <>
              <span className="text-muted-foreground"> • </span>
              <span className="text-muted-foreground">{product.last_sales_qty} шт</span>
            </>
          )}
          <span className="text-muted-foreground"> • </span>
          <span className="text-muted-foreground">
            {formatWeeksAgoShort(product.weeks_since_last_sale)}
          </span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground">Нет продаж за последние 12 недель</div>
      )}

      {/* Line 4: History Link */}
      <Link
        href={`/analytics/sku?nm_id=${product.nm_id}`}
        className={cn(
          'mt-2 inline-flex items-center gap-1.5 text-xs font-medium',
          'text-primary hover:text-primary/80 hover:underline',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
          'transition-colors duration-150 ease-in-out',
          'active:scale-[0.98]'
        )}
        role="link"
        aria-label="История продаж, ссылка"
      >
        <History className="h-3 w-3" aria-hidden="true" />
        <span>История продаж</span>
        <ChevronRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  )
}
