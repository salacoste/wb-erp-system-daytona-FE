/**
 * Helper functions for Orders with COGS
 * Story 61.4-FE: COGS for Orders Integration
 *
 * API functions, transforms, and date helpers.
 * Extracted from useOrdersCogs.ts for file size compliance (Epic 74).
 */

import { apiClient } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { getPreviousWeek, getPreviousMonth } from '@/lib/period-helpers'
import type {
  OrdersVolumeWithCogsResponse,
  OrdersCogsMetrics,
  OrdersCogsParams,
} from '@/types/orders-cogs'
import type { OrderStatusBreakdown } from '@/types/orders-volume'

// =============================================================================
// API Functions
// =============================================================================

/**
 * Map backend camelCase response to frontend snake_case types.
 * Backend returns camelCase fields (totalOrders, statusBreakdown[]),
 * but frontend types use snake_case (total_orders, by_status{}).
 */
export function mapBackendResponse(raw: Record<string, unknown>): OrdersVolumeWithCogsResponse {
  // Map statusBreakdown array -> by_status object
  const statusArray = (raw.statusBreakdown as Array<{ status: string; count: number }>) ?? []
  const byStatus: OrderStatusBreakdown = { new: 0, confirm: 0, complete: 0, cancel: 0 }
  for (const item of statusArray) {
    if (item.status in byStatus) {
      byStatus[item.status as keyof OrderStatusBreakdown] = item.count
    }
  }

  // Map by_day_with_cogs fields (backend: count/cogs -> frontend: orders/cogs_total)
  const rawDaily = (raw.by_day_with_cogs as Array<Record<string, unknown>>) ?? []
  const byDayWithCogs = rawDaily.map(d => ({
    date: d.date as string,
    orders: (d.count as number) ?? 0,
    amount: (d.amount as number) ?? 0,
    cogs_total: (d.cogs as number) ?? 0,
    profit: (d.profit as number) ?? 0,
    margin_pct: (d.margin_pct as number) ?? undefined,
  }))

  return {
    total_orders: (raw.totalOrders as number) ?? 0,
    total_amount:
      (raw.total_amount as number) ??
      ((raw.gross_profit as number) ?? 0) + ((raw.cogs_total as number) ?? 0),
    avg_order_value: (raw.avgOrderValue as number) ?? 0,
    by_status: byStatus,
    cogs_total: (raw.cogs_total as number) ?? undefined,
    avg_cogs_per_order: (raw.avg_cogs_per_order as number) ?? undefined,
    gross_profit: (raw.gross_profit as number) ?? undefined,
    margin_pct: (raw.margin_pct as number) ?? undefined,
    orders_with_cogs: (raw.orders_with_cogs as number) ?? undefined,
    cogs_coverage_pct: (raw.cogs_coverage_pct as number) ?? undefined,
    by_day_with_cogs: byDayWithCogs.length > 0 ? byDayWithCogs : undefined,
  }
}

/**
 * Fetch orders volume with COGS data
 * Uses include_cogs=true to get COGS enrichment from backend (Request #138)
 */
export async function getOrdersWithCogs(
  params: OrdersCogsParams
): Promise<OrdersVolumeWithCogsResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  })

  if (params.aggregation) {
    searchParams.set('aggregation', params.aggregation)
  }

  if (params.include_cogs) {
    searchParams.set('include_cogs', 'true')
  }

  logger.debug('[Orders COGS] Fetching orders with COGS:', params)

  const raw = await apiClient.get<Record<string, unknown>>(
    `/v1/analytics/orders/volume?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )

  return mapBackendResponse(raw)
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform API response to dashboard-friendly COGS metrics
 */
export function transformToCogsMetrics(response: OrdersVolumeWithCogsResponse): OrdersCogsMetrics {
  const total = response.total_orders || 1
  const cogsTotal = response.cogs_total || 0
  const ordersWithCogs = response.orders_with_cogs || 0
  const grossProfit = response.gross_profit ?? response.total_amount - cogsTotal

  // Defensive: handle missing by_status (API may not always return it)
  const byStatus = response.by_status ?? { new: 0, confirm: 0, complete: 0, cancel: 0 }

  return {
    totalOrders: response.total_orders,
    totalAmount: response.total_amount,
    cogsTotal,
    grossProfit,
    marginPct:
      response.margin_pct ??
      (response.total_amount > 0
        ? ((response.total_amount - cogsTotal) / response.total_amount) * 100
        : 0),
    cogsCoveragePct: response.cogs_coverage_pct ?? (ordersWithCogs / total) * 100,
    ordersMissingCogs: response.total_orders - ordersWithCogs,
    avgProfitPerOrder: total > 0 ? grossProfit / total : 0,
    completionRate: (byStatus.complete / total) * 100,
    cancellationRate: (byStatus.cancel / total) * 100,
    byStatus,
    dailyBreakdown: response.by_day_with_cogs,
  }
}

// Re-export date helpers from canonical source (DRY — @/lib/period-helpers is authoritative)
export { getPreviousWeek, getPreviousMonth }
