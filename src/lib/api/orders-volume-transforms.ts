/**
 * Orders Volume Transform Functions
 * Extracted from orders-volume.ts for file size compliance (Epic 74)
 *
 * Transform functions for converting raw API responses to dashboard-friendly formats.
 */

import type {
  OrdersVolumeResponse,
  OrdersVolumeMetrics,
  StatusBreakdownData,
  StatusBreakdownItem,
} from '@/types/orders-volume'

// =============================================================================
// Shared Helpers
// =============================================================================

/** Extract by_status object from raw response (handles both naming conventions) */
function extractByStatus(raw: Record<string, unknown>): {
  new: number
  confirm: number
  complete: number
  cancel: number
} {
  let byStatus = { new: 0, confirm: 0, complete: 0, cancel: 0 }

  if (raw.by_status) {
    byStatus = raw.by_status as typeof byStatus
  } else if (Array.isArray(raw.statusBreakdown)) {
    for (const item of raw.statusBreakdown as { status: string; count?: number }[]) {
      if (item.status === 'complete') byStatus.complete = item.count ?? 0
      else if (item.status === 'confirm') byStatus.confirm = item.count ?? 0
      else if (item.status === 'new') byStatus.new = item.count ?? 0
      else if (item.status === 'cancel') byStatus.cancel = item.count ?? 0
    }
  }

  return byStatus
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform API response to dashboard-friendly metrics
 * Handles edge cases like zero total orders
 *
 * NOTE: Backend returns camelCase fields (totalOrders), but we also
 * support snake_case (total_orders) for compatibility.
 *
 * @param response - Raw API response (may have camelCase or snake_case fields)
 * @returns Transformed metrics for dashboard display
 */
export function transformToMetrics(response: OrdersVolumeResponse): OrdersVolumeMetrics {
  // Backend may return camelCase (totalOrders) or snake_case (total_orders)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = response as any

  // Extract total orders with fallback for both naming conventions
  const totalOrders = raw.totalOrders ?? raw.total_orders ?? 0
  const totalAmount = raw.totalAmount ?? raw.total_amount ?? 0
  const avgOrderValue = raw.avgOrderValue ?? raw.avg_order_value ?? 0

  // Avoid division by zero - use 1 as divisor when total is 0
  const total = totalOrders || 1

  const byStatus = extractByStatus(raw)

  // Handle daily breakdown - by_day (snake_case) or dailyTrend (camelCase)
  let dailyBreakdown = raw.by_day
  if (!dailyBreakdown && Array.isArray(raw.dailyTrend)) {
    dailyBreakdown = raw.dailyTrend.map((d: { date: string; count: number; amount?: number }) => ({
      date: d.date,
      orders: d.count,
      amount: d.amount ?? 0,
    }))
  }

  return {
    totalOrders,
    totalAmount,
    avgOrderValue,
    completionRate: (byStatus.complete / total) * 100,
    cancellationRate: (byStatus.cancel / total) * 100,
    dailyBreakdown,
  }
}

/**
 * Transform volume response to status breakdown data
 * Handles both camelCase (statusBreakdown) and snake_case (by_status) formats.
 *
 * @param response - Raw orders volume response
 * @returns Status breakdown for chart display
 */
export function transformToStatusBreakdown(response: OrdersVolumeResponse): StatusBreakdownData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = response as any

  // Extract total with fallback for both naming conventions
  const total = raw.totalOrders ?? raw.total_orders ?? 0
  const divisor = total || 1 // Avoid division by zero

  const byStatus = extractByStatus(raw)

  const items: StatusBreakdownItem[] = [
    {
      status: 'complete',
      count: byStatus.complete,
      percentage: Number(((byStatus.complete / divisor) * 100).toFixed(1)),
    },
    {
      status: 'confirm',
      count: byStatus.confirm,
      percentage: Number(((byStatus.confirm / divisor) * 100).toFixed(1)),
    },
    {
      status: 'new',
      count: byStatus.new,
      percentage: Number(((byStatus.new / divisor) * 100).toFixed(1)),
    },
    {
      status: 'cancel',
      count: byStatus.cancel,
      percentage: Number(((byStatus.cancel / divisor) * 100).toFixed(1)),
    },
  ]

  return { total, items }
}
