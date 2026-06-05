/**
 * Orders Volume API Client
 * Story 61.3-FE: Orders Volume API Integration
 * Epic 61-FE: Dashboard Data Integration
 *
 * API functions for orders volume analytics.
 * Endpoint: GET /v1/analytics/orders/volume
 *
 * Transform functions: see orders-volume-transforms.ts
 *
 * @see docs/stories/epic-61/story-61.3-fe-orders-volume-api.md
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  OrdersVolumeParams,
  OrdersVolumeResponse,
  SeasonalPatternsParams,
  SeasonalPatternsResponse,
} from '@/types/orders-volume'

// Barrel re-exports from extracted module (transform functions)
export { transformToMetrics, transformToStatusBreakdown } from './orders-volume-transforms'

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

  logger.debug('[Orders Volume] Fetching orders volume:', params)

  return apiClient.get<OrdersVolumeResponse>(
    `/v1/analytics/orders/volume?${searchParams.toString()}`,
    { skipDataUnwrap: true }
  )
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

  logger.debug('[Seasonal Patterns] Fetching patterns:', params)

  return apiClient.get<SeasonalPatternsResponse>(url, { skipDataUnwrap: true })
}
