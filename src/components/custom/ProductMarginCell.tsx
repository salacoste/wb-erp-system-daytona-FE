'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, Info, History, ChevronRight } from 'lucide-react'
import { isCogsAfterLastCompletedWeek, getLastCompletedWeek } from '@/lib/margin-helpers'
import { cn, formatWeeksAgoShort } from '@/lib/utils'
import { HistoricalMarginContext } from './HistoricalMarginContext'
import { useAuthStore } from '@/stores/authStore'
import type { ProductListItem } from '@/types/api'

/**
 * Story 23.10: Role-based access control for task enqueue
 * Manager+ (Owner, Manager, Service) can trigger recalculation
 * Analyst cannot - button is hidden
 */
function canEnqueueTasks(role: string | undefined): boolean {
  if (!role) return false
  return ['Owner', 'Manager', 'Service'].includes(role)
}

export interface ProductMarginCellProps {
  product: ProductListItem
  enableMarginDisplay: boolean
  isPolling: boolean
  shouldShowRetryButton: (nmId: string) => boolean
  getAffectedWeeks: (nmId: string) => string[]
  triggerRecalculation: (params: { weeks: string[]; nm_ids: string[] }) => void
  isRecalculating: boolean
}

/**
 * Renders margin cell content based on product state
 * Extracted from ProductList.tsx for better maintainability
 *
 * States handled:
 * - Polling in progress
 * - Valid margin value
 * - Missing data reasons (NO_SALES_IN_PERIOD, NO_SALES_DATA, COGS_NOT_ASSIGNED, ANALYTICS_UNAVAILABLE)
 * - Calculation in progress
 * - Margin display disabled
 */
export function ProductMarginCell({
  product,
  enableMarginDisplay,
  isPolling,
  shouldShowRetryButton,
  getAffectedWeeks,
  triggerRecalculation,
  isRecalculating,
}: ProductMarginCellProps): React.ReactElement {
  // Story 4.8: Show polling status if product is being polled
  if (isPolling) {
    return (
      <Badge variant="outline" className="flex items-center gap-1.5 border-blue-200 bg-blue-50 text-blue-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Расчёт...</span>
      </Badge>
    )
  }

  if (!enableMarginDisplay) {
    // Default: show hint that margin is available in product detail
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">—</span>
        {product.has_cogs && (
          <span className="text-xs text-gray-400" title="Включите отображение маржи или откройте карточку товара">
            (в карточке)
          </span>
        )}
      </div>
    )
  }

  // Request #15: Show margin when enableMarginDisplay=true
  const hasValidMargin = typeof product.current_margin_pct === 'number' && Number.isFinite(product.current_margin_pct)

  if (hasValidMargin) {
    const marginColor = product.current_margin_pct! > 0
      ? 'text-green-600'
      : product.current_margin_pct! < 0
        ? 'text-red-600'
        : 'text-gray-500'

    return (
      <span className={`text-sm font-medium ${marginColor}`}>
        {product.current_margin_pct!.toFixed(1)}%
      </span>
    )
  }

  // No valid margin - show reason or status (no dash, just explanation)
  return (
    <div className="inline-block">
      {product.missing_data_reason ? (
        <MissingDataReasonDisplay
          product={product}
          enableMarginDisplay={enableMarginDisplay}
        />
      ) : product.has_cogs && product.cogs && product.cogs.valid_from ? (
        <CalculationInProgressDisplay
          product={product}
          shouldShowRetryButton={shouldShowRetryButton}
          getAffectedWeeks={getAffectedWeeks}
          triggerRecalculation={triggerRecalculation}
          isRecalculating={isRecalculating}
        />
      ) : (
        <div className="text-xs text-gray-400 mt-0.5">(нет COGS)</div>
      )}
    </div>
  )
}

interface MissingDataReasonDisplayProps {
  product: ProductListItem
  enableMarginDisplay: boolean
}

function MissingDataReasonDisplay({ product, enableMarginDisplay }: MissingDataReasonDisplayProps): React.ReactElement {
  // Simple text reasons - use wrapper div with text-xs
  if (product.missing_data_reason === 'NO_SALES_IN_PERIOD') {
    return <div className="text-xs text-gray-400 mt-0.5">(нет продаж за неделю)</div>
  }

  if (product.missing_data_reason === 'ANALYTICS_UNAVAILABLE') {
    return <div className="text-xs text-gray-400 mt-0.5">(недоступно)</div>
  }

  // Story 4.9: Show historical margin context for NO_SALES_DATA
  // Component manages its own styles - no wrapper needed
  if (product.missing_data_reason === 'NO_SALES_DATA') {
    return (
      <HistoricalMarginContext
        nmId={product.nm_id}
        currentPeriod={product.current_margin_period ?? null}
        lastSalesWeek={product.last_sales_week ?? null}
        lastSalesMarginPct={product.last_sales_margin_pct ?? null}
        lastSalesQty={product.last_sales_qty ?? null}
        weeksSinceLastSale={product.weeks_since_last_sale ?? null}
        enableMarginDisplay={enableMarginDisplay}
      />
    )
  }

  // Request #16/#19: Backend returns COGS_NOT_ASSIGNED for various scenarios
  // Request #31: Show applicable_cogs if different from current cogs
  // Request #33 UX: Show historical margin context + "no sales in week X" message
  // Request #35 UX: Unified display for ALL COGS_NOT_ASSIGNED cases (with or without COGS)
  if (product.missing_data_reason === 'COGS_NOT_ASSIGNED') {
    // Use unified component for all COGS_NOT_ASSIGNED cases
    // Component handles: future COGS, no applicable COGS, and no COGS at all
    return (
      <COGSNotAssignedContext
        product={product}
        enableMarginDisplay={enableMarginDisplay}
      />
    )
  }

  // Fallback for unknown reasons
  return <div className="text-xs text-gray-400 mt-0.5" />
}

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
interface COGSNotAssignedContextProps {
  product: ProductListItem
  enableMarginDisplay: boolean
}

function COGSNotAssignedContext({ product, enableMarginDisplay }: COGSNotAssignedContextProps): React.ReactElement {
  const lastCompletedWeek = getLastCompletedWeek()
  const formatWeekShort = (week: string | null | undefined): string => {
    if (!week) return '—'
    const match = week.match(/W\d+/)
    return match ? match[0] : week
  }

  // Determine margin color
  const getMarginColorClass = (margin: number | null): string => {
    if (margin === null) return 'text-muted-foreground'
    if (margin > 0) return 'text-green-600'
    if (margin < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  // Check for historical data
  const hasHistoricalData = product.last_sales_week != null

  // Determine if product has any COGS at all
  const hasAnyCogs = product.has_cogs && product.cogs

  // Check if COGS is from future date
  const hasFutureCogs = hasAnyCogs && product.cogs!.valid_from && isCogsAfterLastCompletedWeek(product.cogs!.valid_from)

  return (
    <div className="space-y-2" role="region" aria-label="COGS не назначен">
      {/* Line 1: Status - depends on whether product has COGS */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status" aria-live="polite">
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        <span>
          {hasFutureCogs
            ? `Нет продаж за ${formatWeekShort(lastCompletedWeek)}`
            : hasAnyCogs
              ? `Нет COGS для ${formatWeekShort(lastCompletedWeek)}`
              : 'Нет COGS'
          }
        </span>
      </div>

      {/* Line 2: Applicable COGS info (only if has future COGS) */}
      {hasFutureCogs && (
        product.applicable_cogs && !product.applicable_cogs.is_same_as_current ? (
          <div
            className="flex items-center gap-1.5 text-xs text-blue-600"
            title={`COGS ${product.applicable_cogs.unit_cost_rub}₽ действует с ${product.applicable_cogs.valid_from.split('T')[0]}`}
          >
            <Info className="h-3 w-3" aria-hidden="true" />
            <span>COGS для {product.applicable_cogs.applies_to_week}: {product.applicable_cogs.unit_cost_rub}₽</span>
          </div>
        ) : !product.applicable_cogs ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3" aria-hidden="true" />
            <span>Нет предыдущих COGS</span>
          </div>
        ) : null
      )}

      {/* Line 3: Historical margin context */}
      {hasHistoricalData ? (
        <div className="mt-1 text-xs">
          <span className="text-muted-foreground">Последняя продажа: </span>
          <span className="text-foreground font-medium">{formatWeekShort(product.last_sales_week!)}</span>
          {enableMarginDisplay && product.last_sales_margin_pct != null && (
            <>
              <span className="text-muted-foreground"> • </span>
              <span className={cn('font-semibold', getMarginColorClass(product.last_sales_margin_pct))}>
                {product.last_sales_margin_pct.toFixed(2)}%
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
          <span className="text-muted-foreground">{formatWeeksAgoShort(product.weeks_since_last_sale)}</span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground">
          Нет продаж за последние 12 недель
        </div>
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

interface CalculationInProgressDisplayProps {
  product: ProductListItem
  shouldShowRetryButton: (nmId: string) => boolean
  getAffectedWeeks: (nmId: string) => string[]
  triggerRecalculation: (params: { weeks: string[]; nm_ids: string[] }) => void
  isRecalculating: boolean
}

function CalculationInProgressDisplay({
  product,
  shouldShowRetryButton,
  getAffectedWeeks,
  triggerRecalculation,
  isRecalculating,
}: CalculationInProgressDisplayProps): React.ReactElement {
  // Story 23.10: Get user role for access control
  const user = useAuthStore((state) => state.user)
  const canTriggerRecalculation = canEnqueueTasks(user?.role)

  // Request #18: COGS assigned but no missing_data_reason and no margin = calculation in progress
  // Request #31: Show applicable COGS if different from current
  // Request #33/#35 UX: Reuse COGSNotAssignedContext for consistent display
  if (isCogsAfterLastCompletedWeek(product.cogs!.valid_from)) {
    // When COGS is from future date and no margin data, show enhanced context
    // This provides same UX as MissingDataReasonDisplay with COGS_NOT_ASSIGNED
    return (
      <COGSNotAssignedContext
        product={product}
        enableMarginDisplay={true} // Always show margin in this context
      />
    )
  }

  // COGS is valid for last completed week, but margin calculation in progress
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-400" title="Маржа рассчитывается для последней завершенной недели. Расчёт может занять несколько секунд.">
        (расчёт маржи...)
      </div>
      {/* Request #18: Show manual retry button if state persists > 5 minutes
          Story 23.10: Only show for Manager+ roles (Analyst gets 403 from backend) */}
      {shouldShowRetryButton(product.nm_id) && canTriggerRecalculation && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 -ml-1"
          onClick={(e) => {
            e.stopPropagation()
            const affectedWeeks = getAffectedWeeks(product.nm_id)
            if (affectedWeeks.length > 0) {
              triggerRecalculation({ weeks: affectedWeeks, nm_ids: [product.nm_id] })
            } else {
              const lastCompletedWeek = getLastCompletedWeek()
              triggerRecalculation({ weeks: [lastCompletedWeek], nm_ids: [product.nm_id] })
            }
          }}
          disabled={isRecalculating}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isRecalculating ? 'animate-spin' : ''}`} />
          Пересчитать вручную
        </Button>
      )}
    </div>
  )
}

export default ProductMarginCell
