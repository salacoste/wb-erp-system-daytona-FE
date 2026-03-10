/**
 * Liquidity Analysis API Client
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Backend: Request #55 - Liquidity API Endpoint
 * Endpoints:
 *   - GET /v1/analytics/liquidity
 *   - GET /v1/analytics/liquidity/trends
 *
 * Uses skipDataUnwrap: true because backend returns {meta, summary, data: [...items]}
 * and apiClient auto-unwrap would strip meta/summary, leaving only the items array.
 *
 * Mappers extracted to:
 *   - liquidity-item-mapper.ts (item-level mapping)
 *   - liquidity-summary-mapper.ts (summary/distribution/meta mapping)
 * See: Epic 74, Story 74.5, Task 8
 */

import { apiClient } from '../api-client'
import type {
  LiquidityQueryParams,
  LiquidityResponse,
  LiquidityTrendsQueryParams,
  LiquidityTrendsResponse,
} from '@/types/liquidity'
import { mapBackendResponse } from './liquidity-summary-mapper'

// Re-export mappers for any consumers that need direct access
export { mapBackendResponse } from './liquidity-summary-mapper'
export {
  deriveRecommendation,
  deriveActionType,
  mapLiquidationScenarios,
  mapItem,
} from './liquidity-item-mapper'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch liquidity analysis data
 *
 * @param params - Query parameters for filtering and pagination
 * @returns Liquidity response with summary and SKU data
 */
export async function getLiquidity(params: LiquidityQueryParams = {}): Promise<LiquidityResponse> {
  const searchParams = new URLSearchParams()

  if (params.category_filter && params.category_filter !== 'all') {
    searchParams.set('category_filter', params.category_filter)
  }
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.sort_order) searchParams.set('sort_order', params.sort_order)
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit))

  const queryString = searchParams.toString()
  const endpoint = `/v1/analytics/liquidity${queryString ? `?${queryString}` : ''}`

  // skipDataUnwrap: true — backend returns {meta, summary, data: [...items]}
  // Without this, apiClient sees 'data' key and unwraps to just the items array
  const raw = await apiClient.get<Record<string, unknown>>(endpoint, { skipDataUnwrap: true })
  return mapBackendResponse(raw)
}

/**
 * Fetch liquidity trends data (historical)
 *
 * @param params - Query parameters (period in days)
 * @returns Trends response with historical data points and insights
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

  // skipDataUnwrap: true — preserve full response structure
  return apiClient.get<LiquidityTrendsResponse>(endpoint, { skipDataUnwrap: true })
}
