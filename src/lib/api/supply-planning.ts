/**
 * Supply Planning API Client
 * Epic 6 - Supply Planning & Stockout Prevention
 * Backend: Epic 28 - Supply Planning Analytics API
 * Endpoint: GET /v1/analytics/supply-planning
 */

import { apiClient } from '../api-client'
import type {
  SupplyPlanningQueryParams,
  SupplyPlanningResponse,
} from '@/types/supply-planning'

/**
 * Fetch supply planning analytics data
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Supply planning response with summary and SKU data
 *
 * @example
 * const data = await getSupplyPlanning({
 *   velocity_weeks: 4,
 *   safety_stock_days: 14,
 *   show_only: 'stockout_risk',
 *   sort_by: 'days_until_stockout',
 *   limit: 100,
 * });
 */
export async function getSupplyPlanning(
  params: SupplyPlanningQueryParams = {}
): Promise<SupplyPlanningResponse> {
  const searchParams = new URLSearchParams()

  // Add all defined parameters to search params
  if (params.week) searchParams.set('week', params.week)
  if (params.velocity_weeks !== undefined) {
    searchParams.set('velocity_weeks', String(params.velocity_weeks))
  }
  if (params.safety_stock_days !== undefined) {
    searchParams.set('safety_stock_days', String(params.safety_stock_days))
  }
  if (params.view_by) searchParams.set('view_by', params.view_by)
  if (params.show_only) searchParams.set('show_only', params.show_only)
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.sort_order) searchParams.set('sort_order', params.sort_order)
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))

  const queryString = searchParams.toString()
  const endpoint = `/v1/analytics/supply-planning${queryString ? `?${queryString}` : ''}`

  // skipDataUnwrap: true to preserve meta, summary, data structure
  return apiClient.get<SupplyPlanningResponse>(endpoint, { skipDataUnwrap: true })
}
