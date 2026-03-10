/**
 * Storage Analytics Query Functions
 * Story 24.1-FE: TypeScript Types & API Client
 * Extracted from storage-analytics.ts (Story 74.5)
 *
 * Contains: buildQueryString, getStorageBySku, getStorageTopConsumers
 */

import { apiClient } from '../api-client'
import type {
  StorageBySkuParams,
  StorageBySkuResponse,
  StorageTopConsumersParams,
  TopConsumersResponse,
} from '@/types/storage-analytics'

/**
 * Build query string from params object
 * Filters out undefined/null values and handles arrays
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      if (value.length > 0) {
        searchParams.append(key, value.join(','))
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

/** Get storage analytics by SKU — GET /v1/analytics/storage/by-sku */
export async function getStorageBySku(params: StorageBySkuParams): Promise<StorageBySkuResponse> {
  const { weekStart, weekEnd, ...rest } = params
  const queryParams = buildQueryString({ weekStart, weekEnd, ...rest })

  console.info('[Storage Analytics] Fetching by SKU:', { weekStart, weekEnd, filters: rest })

  const rawResponse = await apiClient.get<StorageBySkuResponse | unknown>(
    `/v1/analytics/storage/by-sku?${queryParams}`,
    { skipDataUnwrap: true }
  )

  const response = normalizeStorageBySkuResponse(rawResponse, weekStart, weekEnd)
  console.info('[Storage Analytics] By SKU response:', {
    count: response.data?.length ?? 0,
    total: response.pagination?.total ?? 0,
    hasMore: response.pagination?.has_more ?? false,
  })

  return response
}

/** Normalize API response to proper StorageBySkuResponse structure */
function normalizeStorageBySkuResponse(
  rawResponse: unknown,
  weekStart: string,
  weekEnd: string
): StorageBySkuResponse {
  if (typeof rawResponse === 'object' && rawResponse !== null && 'data' in rawResponse) {
    return rawResponse as StorageBySkuResponse
  }

  if (Array.isArray(rawResponse)) {
    return {
      period: { from: weekStart, to: weekEnd, days_count: 0 },
      data: rawResponse,
      summary: {
        total_storage_cost: 0,
        products_count: rawResponse.length,
        avg_cost_per_product: 0,
      },
      pagination: { total: rawResponse.length, cursor: null, has_more: false },
      has_data: rawResponse.length > 0,
    }
  }

  return {
    period: { from: weekStart, to: weekEnd, days_count: 0 },
    data: [],
    summary: { total_storage_cost: 0, products_count: 0, avg_cost_per_product: 0 },
    pagination: { total: 0, cursor: null, has_more: false },
    has_data: false,
  }
}

/** Get top storage consumers — GET /v1/analytics/storage/top-consumers */
export async function getStorageTopConsumers(
  params: StorageTopConsumersParams
): Promise<TopConsumersResponse> {
  const { weekStart, weekEnd, ...rest } = params
  const queryParams = buildQueryString({ weekStart, weekEnd, ...rest })

  console.info('[Storage Analytics] Fetching top consumers:', {
    weekStart,
    weekEnd,
    limit: rest.limit ?? 5,
    includeRevenue: rest.include_revenue ?? false,
  })

  const rawResponse = await apiClient.get<TopConsumersResponse | unknown>(
    `/v1/analytics/storage/top-consumers?${queryParams}`,
    { skipDataUnwrap: true }
  )

  const response = normalizeTopConsumersResponse(rawResponse)
  console.info('[Storage Analytics] Top consumers response:', {
    count: response.top_consumers?.length ?? 0,
    totalCost: response.total_storage_cost ?? 0,
  })

  return response
}

/** Normalize API response to proper TopConsumersResponse structure */
function normalizeTopConsumersResponse(rawResponse: unknown): TopConsumersResponse {
  if (typeof rawResponse === 'object' && rawResponse !== null && 'top_consumers' in rawResponse) {
    return rawResponse as TopConsumersResponse
  }

  if (typeof rawResponse === 'object' && rawResponse !== null) {
    const response = rawResponse as Record<string, unknown>
    if ('period' in response) {
      return {
        period: (response.period as { from: string; to: string; days_count: number }) ?? {
          from: '',
          to: '',
          days_count: 0,
        },
        top_consumers: (response.top_consumers as TopConsumersResponse['top_consumers']) ?? [],
        total_storage_cost: (response.total_storage_cost as number) ?? 0,
        has_data: (response.has_data as boolean) ?? false,
      }
    }
  }

  return {
    period: { from: '', to: '', days_count: 0 },
    top_consumers: [],
    total_storage_cost: 0,
    has_data: false,
  }
}
