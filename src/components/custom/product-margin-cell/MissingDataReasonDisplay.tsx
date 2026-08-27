'use client'

import { HistoricalMarginContext } from '@/components/custom/HistoricalMarginContext'
import { COGSNotAssignedContext } from './COGSNotAssignedContext'
import type { ProductListItem } from '@/types/api'

export interface MissingDataReasonDisplayProps {
  product: ProductListItem
  enableMarginDisplay: boolean
}

export function MissingDataReasonDisplay({
  product,
  enableMarginDisplay,
}: MissingDataReasonDisplayProps): React.ReactElement {
  // Simple text reasons - use wrapper div with text-xs
  if (product.missing_data_reason === 'NO_SALES_IN_PERIOD') {
    return <div className="text-xs text-muted-foreground mt-0.5">(нет продаж за неделю)</div>
  }

  if (product.missing_data_reason === 'ANALYTICS_UNAVAILABLE') {
    return <div className="text-xs text-muted-foreground mt-0.5">(недоступно)</div>
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
    return <COGSNotAssignedContext product={product} enableMarginDisplay={enableMarginDisplay} />
  }

  // Fallback for unknown reasons
  return <div className="text-xs text-muted-foreground mt-0.5" />
}
