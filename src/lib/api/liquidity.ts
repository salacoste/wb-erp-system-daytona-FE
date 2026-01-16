/**
 * Liquidity Analysis API Client
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Endpoints:
 *   - GET /v1/analytics/liquidity
 *   - GET /v1/analytics/liquidity/trends
 */

import { apiClient } from '../api-client'
import type {
  LiquidityQueryParams,
  LiquidityResponse,
  LiquidityTrendsQueryParams,
  LiquidityTrendsResponse,
} from '@/types/liquidity'

/**
 * Fetch liquidity analysis data
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Liquidity response with summary and SKU data
 *
 * @example
 * const data = await getLiquidity({
 *   category_filter: 'illiquid',
 *   sort_by: 'turnover_days',
 *   sort_order: 'desc',
 *   include_liquidation_scenarios: true,
 *   limit: 100,
 * });
 */
export async function getLiquidity(
  params: LiquidityQueryParams = {}
): Promise<LiquidityResponse> {
  const searchParams = new URLSearchParams()

  // Add all defined parameters to search params
  if (params.category_filter && params.category_filter !== 'all') {
    searchParams.set('category_filter', params.category_filter)
  }
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.sort_order) searchParams.set('sort_order', params.sort_order)
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))
  if (params.include_liquidation_scenarios !== undefined) {
    searchParams.set('include_liquidation_scenarios', String(params.include_liquidation_scenarios))
  }

  const queryString = searchParams.toString()
  const endpoint = `/v1/analytics/liquidity${queryString ? `?${queryString}` : ''}`

  return apiClient.get<LiquidityResponse>(endpoint)
}

/**
 * Fetch liquidity trends data (historical)
 *
 * @param params - Query parameters (period in days)
 * @returns Trends response with historical data points and insights
 *
 * @example
 * const data = await getLiquidityTrends({ period: 90 });
 */
export async function getLiquidityTrends(
  params: LiquidityTrendsQueryParams = {}
): Promise<LiquidityTrendsResponse> {
  const searchParams = new URLSearchParams()

  if (params.period !== undefined) {
    searchParams.set('period', String(params.period))
  }

  const queryString = searchParams.toString()
  const endpoint = `/v1/analytics/liquidity/trends${queryString ? `?${queryString}` : ''}`

  return apiClient.get<LiquidityTrendsResponse>(endpoint)
}
