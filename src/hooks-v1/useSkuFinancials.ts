/**
 * Hook for SKU Financials Analytics
 * Epic 31: Complete Per-SKU Financial Analytics
 * Reference: frontend/docs/request-backend/64-per-sku-margin-missing-expenses-backend-response.md
 *
 * Key features:
 * - Storage from paid_storage_daily (Epic 24)
 * - Commission/acquiring as visibility fields (already in net_for_pay)
 * - Operating profit = grossProfit - logistics - storage - penalties - paidAcceptance
 * - Profitability classification (excellent/good/warning/critical/loss/unknown)
 *
 * Types extracted to sku-financials-types.ts (Epic 74)
 * Transform functions extracted to sku-financials-transform.ts (Epic 74)
 */

import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  SkuFinancialsQuery,
  SkuFinancialsResponse,
  SkuFinancialsSortBy,
} from '@/types/sku-financials'
import type { BackendResponse } from './sku-financials-types'
import { transformBackendResponse } from './sku-financials-transform'

// Re-export types for convenience (backward compatibility)
export type { SkuFinancialsQuery, SkuFinancialsResponse, SkuFinancialsSortBy }

/**
 * Hook to fetch complete per-SKU financial analytics
 *
 * @example
 * // Basic usage - all SKUs for a week
 * const { data, isLoading } = useSkuFinancials({
 *   week: '2025-W50',
 * });
 *
 * @example
 * // With sorting and filtering
 * const { data, isLoading } = useSkuFinancials({
 *   week: '2025-W50',
 *   sortBy: 'operatingMarginPct',
 *   order: 'asc',
 *   limit: 20,
 * });
 *
 * @returns Query result with SKU financials data
 */
export function useSkuFinancials(params: SkuFinancialsQuery, enabled = true) {
  return useQuery<SkuFinancialsResponse>({
    queryKey: ['analytics', 'sku-financials', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set('week', params.week)

      if (params.nm_ids) {
        searchParams.set('nm_ids', params.nm_ids)
      }
      // Backend uses snake_case for query params
      if (params.sortBy) {
        searchParams.set('sort_by', params.sortBy)
      }
      if (params.order) {
        searchParams.set('sort_order', params.order)
      }
      if (params.includeVisibility !== undefined) {
        searchParams.set('include_visibility', String(params.includeVisibility))
      }
      if (params.limit !== undefined) {
        searchParams.set('limit', String(params.limit))
      }
      if (params.offset !== undefined) {
        searchParams.set('offset', String(params.offset))
      }

      // apiClient.get returns the response directly (type T), not wrapped in { data: T }
      // Backend returns snake_case, we transform to camelCase for frontend
      // IMPORTANT: Use skipDataUnwrap=true because response has { meta, data, totals } structure
      // Without this, apiClient unwraps "data" field and loses meta/totals
      const backendResponse = await apiClient.get<BackendResponse>(
        `/v1/analytics/sku-financials?${searchParams.toString()}`,
        { skipDataUnwrap: true }
      )
      return transformBackendResponse(backendResponse)
    },
    enabled: enabled && !!params.week,
    // Match backend cache TTL (30 minutes)
    staleTime: 30 * 60 * 1000,
    // Keep in cache for 1 hour
    gcTime: 60 * 60 * 1000,
  })
}

/**
 * Hook to fetch SKU financials with pagination support
 *
 * @example
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSkuFinancialsPaginated({
 *   week: '2025-W50',
 *   limit: 25,
 * });
 */
export function useSkuFinancialsWithPagination(
  baseParams: Omit<SkuFinancialsQuery, 'offset'>,
  enabled = true
) {
  const limit = baseParams.limit ?? 50

  return useQuery<SkuFinancialsResponse>({
    queryKey: ['analytics', 'sku-financials', 'paginated', baseParams],
    queryFn: async () => {
      const searchParams = new URLSearchParams()
      searchParams.set('week', baseParams.week)
      searchParams.set('limit', String(limit))
      searchParams.set('offset', '0')

      if (baseParams.nm_ids) {
        searchParams.set('nm_ids', baseParams.nm_ids)
      }
      // Backend uses snake_case for query params
      if (baseParams.sortBy) {
        searchParams.set('sort_by', baseParams.sortBy)
      }
      if (baseParams.order) {
        searchParams.set('sort_order', baseParams.order)
      }
      if (baseParams.includeVisibility !== undefined) {
        searchParams.set('include_visibility', String(baseParams.includeVisibility))
      }

      // apiClient.get returns the response directly (type T), not wrapped in { data: T }
      // Backend returns snake_case, we transform to camelCase for frontend
      // IMPORTANT: Use skipDataUnwrap=true because response has { meta, data, totals } structure
      // Without this, apiClient unwraps "data" field and loses meta/totals
      const backendResponse = await apiClient.get<BackendResponse>(
        `/v1/analytics/sku-financials?${searchParams.toString()}`,
        { skipDataUnwrap: true }
      )
      return transformBackendResponse(backendResponse)
    },
    enabled: enabled && !!baseParams.week,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
