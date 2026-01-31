/**
 * Orders Volume API Client
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * API functions for orders volume analytics.
 * Endpoint: GET /v1/analytics/orders/volume
 *
 * @see docs/stories/epic-61/story-61.3-fe-orders-volume-api.md
 */

import { apiClient } from '../api-client'
import type {
  OrdersVolumeParams,
  OrdersVolumeResponse,
  OrdersVolumeMetrics,
  StatusBreakdownData,
  StatusBreakdownItem,
  SeasonalPatternsParams,
  SeasonalPatternsResponse,
} from '@/types/orders-volume'

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get orders volume analytics for a date range
 *
 * @param params - Date range and aggregation options
 * @returns Orders volume with status breakdown
 *
 * @example
 * const data = await getOrdersVolume({
 *   from: '2026-01-27',
 *   to: '2026-02-02',
 *   aggregation: 'day',
 * })
 */
export async function getOrdersVolume(params: OrdersVolumeParams): Promise<OrdersVolumeResponse> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  })

  if (params.aggregation) {
    searchParams.set('aggregation', params.aggregation)
  }

  console.info('[Orders Volume] Fetching orders volume:', params)

  return apiClient.get<OrdersVolumeResponse>(
    `/v1/analytics/orders/volume?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
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

  // Handle by_status (snake_case) or statusBreakdown (camelCase array format)
  let byStatus = { new: 0, confirm: 0, complete: 0, cancel: 0 }

  if (raw.by_status) {
    byStatus = raw.by_status
  } else if (Array.isArray(raw.statusBreakdown)) {
    // Convert array format to object format
    for (const item of raw.statusBreakdown) {
      if (item.status === 'complete') byStatus.complete = item.count ?? 0
      else if (item.status === 'confirm') byStatus.confirm = item.count ?? 0
      else if (item.status === 'new') byStatus.new = item.count ?? 0
      else if (item.status === 'cancel') byStatus.cancel = item.count ?? 0
    }
  }

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

// =============================================================================
// Query Keys Factory
// =============================================================================

/**
 * Query keys factory for React Query cache management
 *
 * @example
 * // All orders volume queries
 * ordersVolumeQueryKeys.all // ['orders-volume']
 *
 * // By date range
 * ordersVolumeQueryKeys.byRange('2026-01-27', '2026-02-02')
 * // ['orders-volume', '2026-01-27', '2026-02-02']
 *
 * // By date range with aggregation
 * ordersVolumeQueryKeys.byRangeWithAggregation('2026-01-27', '2026-02-02', 'day')
 * // ['orders-volume', '2026-01-27', '2026-02-02', 'day']
 */
export const ordersVolumeQueryKeys = {
  all: ['orders-volume'] as const,

  byRange: (from: string, to: string) => [...ordersVolumeQueryKeys.all, from, to] as const,

  byRangeWithAggregation: (from: string, to: string, aggregation: string) =>
    [...ordersVolumeQueryKeys.byRange(from, to), aggregation] as const,

  statusBreakdown: (from: string, to: string) =>
    [...ordersVolumeQueryKeys.all, 'status-breakdown', from, to] as const,

  seasonalPatterns: (months: number) => [...ordersVolumeQueryKeys.all, 'seasonal', months] as const,
}

// =============================================================================
// Status Breakdown API (Story 63.7-FE)
// =============================================================================

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

  // Handle by_status (snake_case) or statusBreakdown (camelCase array format)
  let byStatus = { new: 0, confirm: 0, complete: 0, cancel: 0 }

  if (raw.by_status) {
    byStatus = raw.by_status
  } else if (Array.isArray(raw.statusBreakdown)) {
    // Convert array format to object format
    for (const item of raw.statusBreakdown) {
      if (item.status === 'complete') byStatus.complete = item.count ?? 0
      else if (item.status === 'confirm') byStatus.confirm = item.count ?? 0
      else if (item.status === 'new') byStatus.new = item.count ?? 0
      else if (item.status === 'cancel') byStatus.cancel = item.count ?? 0
    }
  }

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

// =============================================================================
// Seasonal Patterns API (Story 63.8-FE)
// =============================================================================

/**
 * Get seasonal patterns for orders
 * Endpoint: GET /v1/analytics/orders/seasonal
 *
 * @param params - Months and view options
 * @returns Seasonal patterns with insights
 */
export async function getSeasonalPatterns(
  params: SeasonalPatternsParams = {}
): Promise<SeasonalPatternsResponse> {
  const searchParams = new URLSearchParams()

  if (params.months) {
    searchParams.set('months', params.months.toString())
  }
  if (params.view) {
    searchParams.set('view', params.view)
  }

  const queryString = searchParams.toString()
  const url = queryString
    ? `/v1/analytics/orders/seasonal?${queryString}`
    : '/v1/analytics/orders/seasonal'

  console.info('[Seasonal Patterns] Fetching patterns:', params)

  return apiClient.get<SeasonalPatternsResponse>(url, { skipDataUnwrap: true })
}
