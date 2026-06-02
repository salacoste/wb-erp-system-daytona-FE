'use client'

import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { MissingDataReasonDisplay } from './product-margin-cell/MissingDataReasonDisplay'
import { CalculationInProgressDisplay } from './product-margin-cell/CalculationInProgressDisplay'
import type { ProductListItem } from '@/types/api'

export interface ProductMarginCellProps {
  product: ProductListItem
  enableMarginDisplay: boolean
  /**
   * Request #190: true when margin is unavailable due to a backend error (not a user choice).
   * Suppresses the "(в карточке)" hint so the cell doesn't contradict the page's degraded banner.
   */
  marginUnavailable?: boolean
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
  marginUnavailable = false,
  isPolling,
  shouldShowRetryButton,
  getAffectedWeeks,
  triggerRecalculation,
  isRecalculating,
}: ProductMarginCellProps): React.ReactElement {
  // Story 4.8: Show polling status if product is being polled
  if (isPolling) {
    return (
      <Badge
        variant="outline"
        className="flex items-center gap-1.5 border-blue-200 bg-blue-50 text-blue-700"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Расчёт...</span>
      </Badge>
    )
  }

  if (!enableMarginDisplay) {
    // Default: show hint that margin is available in product detail.
    // Request #190: when margin is server-degraded (marginUnavailable), suppress the hint —
    // the page-level banner already explains the server error, and "Включите отображение маржи"
    // would contradict it (margin display IS on; the backend failed).
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">—</span>
        {product.has_cogs && !marginUnavailable && (
          <span
            className="text-xs text-gray-400"
            title="Включите отображение маржи или откройте карточку товара"
          >
            (в карточке)
          </span>
        )}
      </div>
    )
  }

  // Request #15: Show margin when enableMarginDisplay=true
  const hasValidMargin =
    typeof product.current_margin_pct === 'number' && Number.isFinite(product.current_margin_pct)

  if (hasValidMargin) {
    const marginColor =
      product.current_margin_pct! > 0
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
        <MissingDataReasonDisplay product={product} enableMarginDisplay={enableMarginDisplay} />
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

export default ProductMarginCell
