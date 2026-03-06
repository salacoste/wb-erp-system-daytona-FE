/**
 * Search Analytics API Client
 * Epic 71-FE: Search Analytics & Jam Gating
 * Backend endpoints: Task-139 (complete)
 */

import { apiClient } from '@/lib/api-client'
import type {
  SearchByProductParams,
  SearchByProductResponse,
  SearchByQueryParams,
  SearchByQueryResponse,
  SearchOrdersParams,
  SearchOrdersResponse,
} from '@/types/search-analytics'

/**
 * Queries driving traffic to a product
 * GET /v1/analytics/search/by-product
 * Auth: X-Cabinet-Id header (auto via apiClient)
 */
export async function getSearchByProduct(
  params: SearchByProductParams
): Promise<SearchByProductResponse> {
  const sp = new URLSearchParams()
  sp.set('nmId', String(params.nmId))
  sp.set('from', params.from)
  sp.set('to', params.to)
  if (params.orderBy) sp.set('orderBy', params.orderBy)
  if (params.limit != null) sp.set('limit', String(params.limit))

  console.info('[SearchAnalytics] Fetching by-product:', {
    nmId: params.nmId,
    from: params.from,
    to: params.to,
  })

  const response = await apiClient.get<SearchByProductResponse>(
    `/v1/analytics/search/by-product?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[SearchAnalytics] by-product response:', {
    queries: response.queries?.length,
  })

  return response
}

/**
 * Products ranking for a search term
 * GET /v1/analytics/search/by-query
 */
export async function getSearchByQuery(
  params: SearchByQueryParams
): Promise<SearchByQueryResponse> {
  const sp = new URLSearchParams()
  sp.set('query', params.query)
  sp.set('from', params.from)
  sp.set('to', params.to)
  if (params.limit != null) sp.set('limit', String(params.limit))

  console.info('[SearchAnalytics] Fetching by-query:', { query: params.query })

  const response = await apiClient.get<SearchByQueryResponse>(
    `/v1/analytics/search/by-query?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[SearchAnalytics] by-query response:', {
    products: response.products?.length,
  })

  return response
}

/**
 * Order attribution from organic search
 * GET /v1/analytics/search/orders
 */
export async function getSearchOrders(params: SearchOrdersParams): Promise<SearchOrdersResponse> {
  const sp = new URLSearchParams()
  sp.set('from', params.from)
  sp.set('to', params.to)
  if (params.groupBy) sp.set('groupBy', params.groupBy)
  if (params.limit != null) sp.set('limit', String(params.limit))

  console.info('[SearchAnalytics] Fetching orders:', {
    groupBy: params.groupBy ?? 'query',
  })

  const response = await apiClient.get<SearchOrdersResponse>(
    `/v1/analytics/search/orders?${sp.toString()}`,
    { skipDataUnwrap: true }
  )

  console.info('[SearchAnalytics] orders response:', {
    items: response.items?.length,
  })

  return response
}

// Query Keys Factory
export const searchQueryKeys = {
  all: ['search-analytics'] as const,
  byProduct: (params: SearchByProductParams) =>
    [...searchQueryKeys.all, 'by-product', params] as const,
  byQuery: (params: SearchByQueryParams) => [...searchQueryKeys.all, 'by-query', params] as const,
  orders: (params: SearchOrdersParams) => [...searchQueryKeys.all, 'orders', params] as const,
}

// Cache: staleTime < backend TTL (5 min)
export const SEARCH_CACHE = {
  staleTime: 4 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const
