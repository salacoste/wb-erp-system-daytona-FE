/**
 * Storage Analytics Trends & Summary Functions
 * Story 24.1-FE: TypeScript Types & API Client
 * Extracted from storage-analytics.ts (Story 74.5)
 *
 * Contains: getStorageTrends, getStorageSummary + normalizers
 */

import { apiClient } from '../api-client'
import { buildQueryString } from './storage-analytics-queries'
import type {
  StorageTrendsParams,
  StorageTrendsResponse,
  StorageSummaryParams,
  StorageSummaryResponse,
} from '@/types/storage-analytics'

/** Get storage cost trends over time — GET /v1/analytics/storage/trends */
export async function getStorageTrends(
  params: StorageTrendsParams
): Promise<StorageTrendsResponse> {
  const { weekStart, weekEnd, ...rest } = params
  const queryParams = buildQueryString({ weekStart, weekEnd, ...rest })

  console.info('[Storage Analytics] Fetching trends:', {
    weekStart,
    weekEnd,
    nmId: rest.nm_id ?? 'all',
    metrics: rest.metrics ?? ['storage_cost'],
    brand: rest.brand ?? 'all',
    warehouse: rest.warehouse ?? 'all',
    queryString: queryParams,
  })

  const rawResponse = await apiClient.get<StorageTrendsResponse | unknown>(
    `/v1/analytics/storage/trends?${queryParams}`,
    { skipDataUnwrap: true }
  )

  const response = normalizeStorageTrendsResponse(rawResponse, weekStart, weekEnd)
  console.info('[Storage Analytics] Trends response:', {
    dataPoints: response.data?.length ?? 0,
    hasSummary: !!response.summary,
    hasData: response.has_data,
    data: response.data,
  })

  return response
}

/** Normalize API response to proper StorageTrendsResponse structure */
function normalizeStorageTrendsResponse(
  rawResponse: unknown,
  weekStart: string,
  weekEnd: string
): StorageTrendsResponse {
  if (typeof rawResponse === 'object' && rawResponse !== null && 'data' in rawResponse) {
    return rawResponse as StorageTrendsResponse
  }

  if (Array.isArray(rawResponse)) {
    return {
      period: { from: weekStart, to: weekEnd, days_count: 0 },
      nm_id: null,
      data: rawResponse,
      summary: undefined,
      has_data: rawResponse.length > 0,
    }
  }

  return {
    period: { from: weekStart, to: weekEnd, days_count: 0 },
    nm_id: null,
    data: [],
    summary: undefined,
    has_data: false,
  }
}

/** Get storage summary — GET /v1/analytics/storage/summary */
export async function getStorageSummary(
  params: StorageSummaryParams
): Promise<StorageSummaryResponse> {
  const queryParams = buildQueryString({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  console.info('[Storage Analytics] Fetching summary:', {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  const rawResponse = await apiClient.get<StorageSummaryResponse | unknown>(
    `/v1/analytics/storage/summary?${queryParams}`,
    { skipDataUnwrap: true }
  )

  const response = normalizeStorageSummaryResponse(rawResponse)
  console.info('[Storage Analytics] Summary response:', {
    totalCost: response.data?.totalCost ?? 0,
    uniqueSkus: response.data?.uniqueSkus ?? 0,
  })

  return response
}

/** Normalize API response to proper StorageSummaryResponse structure */
function normalizeStorageSummaryResponse(rawResponse: unknown): StorageSummaryResponse {
  if (typeof rawResponse === 'object' && rawResponse !== null && 'data' in rawResponse) {
    return rawResponse as StorageSummaryResponse
  }

  if (typeof rawResponse === 'object' && rawResponse !== null) {
    const response = rawResponse as Record<string, unknown>
    return {
      data: (response.data as StorageSummaryResponse['data']) ?? {
        totalCost: 0,
        uniqueSkus: 0,
        totalVolume: 0,
        daysCount: 0,
        avgCostPerSku: 0,
        dateFrom: '',
        dateTo: '',
      },
      period: (response.period as StorageSummaryResponse['period']) ?? {
        from: '',
        to: '',
        days_count: 0,
      },
    }
  }

  return {
    data: {
      totalCost: 0,
      uniqueSkus: 0,
      totalVolume: 0,
      daysCount: 0,
      avgCostPerSku: 0,
      dateFrom: '',
      dateTo: '',
    },
    period: { from: '', to: '', days_count: 0 },
  }
}
