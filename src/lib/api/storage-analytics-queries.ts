/**
 * Storage Analytics Query Functions
 * Story 24.1-FE: TypeScript Types & API Client
 * Extracted from storage-analytics.ts (Story 74.5)
 *
 * Contains: buildQueryString, getStorageBySku, getStorageTopConsumers
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import {
  normalizeStorageBySkuResponse,
  normalizeTopConsumersResponse,
} from './storage-queries-normalizer'
import type { StorageBySkuParams, StorageTopConsumersParams } from '@/types/storage-analytics'

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
export async function getStorageBySku(params: StorageBySkuParams) {
  const { weekStart, weekEnd, ...rest } = params
  const queryParams = buildQueryString({ weekStart, weekEnd, ...rest })

  logger.debug('[Storage Analytics] Fetching by SKU:', { weekStart, weekEnd, filters: rest })

  const rawResponse = await apiClient.get<unknown>(`/v1/analytics/storage/by-sku?${queryParams}`, {
    skipDataUnwrap: true,
  })

  const response = normalizeStorageBySkuResponse(rawResponse, weekStart, weekEnd)
  logger.debug('[Storage Analytics] By SKU response:', {
    count: response.data?.length ?? 0,
    total: response.pagination?.total ?? 0,
    hasMore: response.pagination?.has_more ?? false,
  })

  return response
}

/** Get top storage consumers — GET /v1/analytics/storage/top-consumers */
export async function getStorageTopConsumers(params: StorageTopConsumersParams) {
  const { weekStart, weekEnd, ...rest } = params
  const queryParams = buildQueryString({ weekStart, weekEnd, ...rest })

  logger.debug('[Storage Analytics] Fetching top consumers:', {
    weekStart,
    weekEnd,
    limit: rest.limit ?? 5,
    includeRevenue: rest.include_revenue ?? false,
  })

  const rawResponse = await apiClient.get<unknown>(
    `/v1/analytics/storage/top-consumers?${queryParams}`,
    { skipDataUnwrap: true }
  )

  const response = normalizeTopConsumersResponse(rawResponse)
  logger.debug('[Storage Analytics] Top consumers response:', {
    count: response.top_consumers?.length ?? 0,
    // eslint-disable-next-line no-restricted-syntax -- DEBUG-LOG: total_storage_cost used only in console.log
    totalCost: response.total_storage_cost ?? 0,
  })

  return response
}
