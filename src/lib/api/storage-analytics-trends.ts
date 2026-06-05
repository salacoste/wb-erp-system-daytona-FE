/**
 * Storage Analytics Trends & Summary Functions
 * Story 24.1-FE: TypeScript Types & API Client
 * Extracted from storage-analytics.ts (Story 74.5)
 *
 * Contains: getStorageTrends, getStorageSummary
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import { buildQueryString } from './storage-analytics-queries'
import {
  normalizeStorageTrendsResponse,
  normalizeStorageSummaryResponse,
} from './storage-trends-normalizer'
import type { StorageTrendsParams, StorageSummaryParams } from '@/types/storage-analytics'

/** Get storage cost trends over time — GET /v1/analytics/storage/trends */
export async function getStorageTrends(params: StorageTrendsParams) {
  const { weekStart, weekEnd, ...rest } = params
  const queryParams = buildQueryString({ weekStart, weekEnd, ...rest })

  logger.debug('[Storage Analytics] Fetching trends:', {
    weekStart,
    weekEnd,
    nmId: rest.nm_id ?? 'all',
    metrics: rest.metrics ?? ['storage_cost'],
    brand: rest.brand ?? 'all',
    warehouse: rest.warehouse ?? 'all',
    queryString: queryParams,
  })

  const rawResponse = await apiClient.get<unknown>(`/v1/analytics/storage/trends?${queryParams}`, {
    skipDataUnwrap: true,
  })

  const response = normalizeStorageTrendsResponse(rawResponse, weekStart, weekEnd)
  logger.debug('[Storage Analytics] Trends response:', {
    dataPoints: response.data?.length ?? 0,
    hasSummary: !!response.summary,
    hasData: response.has_data,
    data: response.data,
  })

  return response
}

/** Get storage summary — GET /v1/analytics/storage/summary */
export async function getStorageSummary(params: StorageSummaryParams) {
  const queryParams = buildQueryString({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  logger.debug('[Storage Analytics] Fetching summary:', {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  const rawResponse = await apiClient.get<unknown>(`/v1/analytics/storage/summary?${queryParams}`, {
    skipDataUnwrap: true,
  })

  const response = normalizeStorageSummaryResponse(rawResponse)
  logger.debug('[Storage Analytics] Summary response:', {
    totalCost: response.data?.totalCost ?? 0,
    uniqueSkus: response.data?.uniqueSkus ?? 0,
  })

  return response
}
