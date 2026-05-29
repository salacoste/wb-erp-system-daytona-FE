/**
 * Search Analytics API Client
 * Epic 71-FE: Search Analytics & Jam Gating
 * Backend endpoints: Task-139 (complete)
 *
 * Boundary Normalizer Pattern (Story 119.1-FE): every endpoint routes through
 * the search-analytics-normalizer so raw backend shapes never reach hooks or
 * components. `apiClient.get<unknown>` signals "don't trust the shape; the
 * normalizer enforces it". See src/lib/api/search-analytics-normalizer.ts.
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
import {
  normalizeSearchByProductResponse,
  normalizeSearchByQueryResponse,
  normalizeSearchOrdersResponse,
} from './search-analytics-normalizer'

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

  const raw = await apiClient.get<unknown>(`/v1/analytics/search/by-product?${sp.toString()}`, {
    skipDataUnwrap: true,
  })
  return normalizeSearchByProductResponse(raw)
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

  const raw = await apiClient.get<unknown>(`/v1/analytics/search/by-query?${sp.toString()}`, {
    skipDataUnwrap: true,
  })
  return normalizeSearchByQueryResponse(raw)
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

  // Story 119.1-FE 1st-pass F-7: gate hot-path console writes behind NODE_ENV
  // check (preserve debug aid for dev/test; silent in production).
  if (process.env.NODE_ENV !== 'production') {
    console.info('[SearchAnalytics] Fetching orders:', {
      groupBy: params.groupBy ?? 'query',
    })
  }

  const raw = await apiClient.get<unknown>(`/v1/analytics/search/orders?${sp.toString()}`, {
    skipDataUnwrap: true,
  })

  const response = normalizeSearchOrdersResponse(raw)

  // Story 119.1-FE: log post-normalize count so the debug line reflects what
  // consumers actually receive (Story 117.1-FE added the original log).
  // 1st-pass F-7: same NODE_ENV gate as above.
  if (process.env.NODE_ENV !== 'production') {
    console.info('[SearchAnalytics] orders response:', {
      items: response.items.length,
    })
  }

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
