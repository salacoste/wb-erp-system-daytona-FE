/**
 * Storage Analytics API Client
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 * Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
 */

import { apiClient } from '../api-client'
import type {
  StorageBySkuParams,
  StorageBySkuResponse,
  StorageTopConsumersParams,
  TopConsumersResponse,
  StorageTrendsParams,
  StorageTrendsResponse,
  PaidStorageImportRequest,
  PaidStorageImportResponse,
  ImportStatusResponse,
  StorageSummaryParams,
  StorageSummaryResponse,
} from '@/types/storage-analytics'

/**
 * Build query string from params object
 * Filters out undefined/null values and handles arrays
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      // Join arrays with comma (e.g., metrics=['storage_cost', 'volume'] → metrics=storage_cost,volume)
      if (value.length > 0) {
        searchParams.append(key, value.join(','))
      }
    } else {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

/**
 * Get storage analytics by SKU
 * GET /v1/analytics/storage/by-sku
 *
 * @param params - Query parameters including weekStart, weekEnd, filters, sorting, pagination
 * @returns Paginated list of SKU storage data with summary
 *
 * @example
 * const data = await getStorageBySku({
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   sort_by: 'storage_cost',
 *   sort_order: 'desc',
 *   limit: 20,
 * });
 */
export async function getStorageBySku(
  params: StorageBySkuParams,
): Promise<StorageBySkuResponse> {
  const { weekStart, weekEnd, ...rest } = params

  const queryParams = buildQueryString({
    weekStart: weekStart,
    weekEnd: weekEnd,
    ...rest,
  })

  console.info('[Storage Analytics] Fetching by SKU:', {
    weekStart,
    weekEnd,
    filters: rest,
  })

  // Story 24: Use skipDataUnwrap to get full response with period, summary, pagination
  // The response has a 'data' field but also other important fields we need
  const response = await apiClient.get<StorageBySkuResponse>(
    `/v1/analytics/storage/by-sku?${queryParams}`,
    { skipDataUnwrap: true },
  )

  console.info('[Storage Analytics] By SKU response:', {
    count: response.data?.length ?? 0,
    total: response.pagination?.total ?? 0,
    hasMore: response.pagination?.has_more ?? false,
  })

  return response
}

/**
 * Get top storage consumers
 * GET /v1/analytics/storage/top-consumers
 *
 * @param params - Query parameters including weekStart, weekEnd, limit, include_revenue
 * @returns Top N products by storage cost with optional revenue ratio
 *
 * @example
 * const data = await getStorageTopConsumers({
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   limit: 5,
 *   include_revenue: true,
 * });
 */
export async function getStorageTopConsumers(
  params: StorageTopConsumersParams,
): Promise<TopConsumersResponse> {
  const { weekStart, weekEnd, ...rest } = params

  const queryParams = buildQueryString({
    weekStart: weekStart,
    weekEnd: weekEnd,
    ...rest,
  })

  console.info('[Storage Analytics] Fetching top consumers:', {
    weekStart,
    weekEnd,
    limit: rest.limit ?? 5,
    includeRevenue: rest.include_revenue ?? false,
  })

  // Story 24: Use skipDataUnwrap to ensure we get the full response
  const response = await apiClient.get<TopConsumersResponse>(
    `/v1/analytics/storage/top-consumers?${queryParams}`,
    { skipDataUnwrap: true },
  )

  console.info('[Storage Analytics] Top consumers response:', {
    count: response.top_consumers?.length ?? 0,
    totalCost: response.total_storage_cost ?? 0,
  })

  return response
}

/**
 * Get storage cost trends over time
 * GET /v1/analytics/storage/trends
 *
 * @param params - Query parameters including weekStart, weekEnd, nm_id (optional), metrics
 * @returns Time series data with optional summary statistics
 *
 * @example
 * const data = await getStorageTrends({
 *   weekStart: '2025-W44',
 *   weekEnd: '2025-W47',
 *   metrics: ['storage_cost', 'volume'],
 * });
 */
export async function getStorageTrends(
  params: StorageTrendsParams,
): Promise<StorageTrendsResponse> {
  const { weekStart, weekEnd, ...rest } = params

  const queryParams = buildQueryString({
    weekStart: weekStart,
    weekEnd: weekEnd,
    ...rest,
  })

  // Story 24.9: Debug logging for filter troubleshooting
  console.info('[Storage Analytics] Fetching trends:', {
    weekStart,
    weekEnd,
    nmId: rest.nm_id ?? 'all',
    metrics: rest.metrics ?? ['storage_cost'],
    brand: rest.brand ?? 'all',
    warehouse: rest.warehouse ?? 'all',
    queryString: queryParams,
  })

  // Story 24: Use skipDataUnwrap to get full response with period, summary
  // The response has a 'data' field but also other important fields we need
  const response = await apiClient.get<StorageTrendsResponse>(
    `/v1/analytics/storage/trends?${queryParams}`,
    { skipDataUnwrap: true },
  )

  // Story 24.9: Debug logging for filter troubleshooting
  console.info('[Storage Analytics] Trends response:', {
    dataPoints: response.data?.length ?? 0,
    hasSummary: !!response.summary,
    hasData: response.has_data,
    data: response.data,
  })

  return response
}

/**
 * Trigger paid storage data import from WB API
 * POST /v1/imports/paid-storage
 *
 * @param request - Date range for import (max 8 days per WB API limit)
 * @returns Import job info with ID for status polling
 *
 * @example
 * const result = await triggerPaidStorageImport({
 *   dateFrom: '2025-11-18',
 *   dateTo: '2025-11-24',
 * });
 * // Poll status with getImportStatus(result.import_id)
 */
export async function triggerPaidStorageImport(
  request: PaidStorageImportRequest,
): Promise<PaidStorageImportResponse> {
  console.info('[Storage Analytics] Triggering import:', {
    dateFrom: request.dateFrom,
    dateTo: request.dateTo,
  })

  const response = await apiClient.post<PaidStorageImportResponse>(
    '/v1/imports/paid-storage',
    {
      date_from: request.dateFrom,
      date_to: request.dateTo,
    },
  )

  console.info('[Storage Analytics] Import triggered:', {
    importId: response.import_id,
    status: response.status,
    estimatedTime: response.estimated_time_sec,
  })

  return response
}

/**
 * Get import job status
 * GET /v1/imports/{id}
 *
 * @param importId - Import job ID from triggerPaidStorageImport response
 * @returns Current status of the import job
 *
 * @example
 * const status = await getImportStatus('import-uuid-123');
 * if (status.status === 'completed') {
 *   console.log(`Imported ${status.rows_imported} rows`);
 * }
 */
export async function getImportStatus(
  importId: string,
): Promise<ImportStatusResponse> {
  const response = await apiClient.get<ImportStatusResponse>(
    `/v1/imports/${importId}`,
  )

  return response
}

/**
 * Get storage summary for a date range
 * GET /v1/analytics/storage/summary
 *
 * Request #52: Storage summary endpoint for joining with weekly_payout_summary
 * Reference: docs/request-backend/52-storage-sku-breakdown-for-weekly-reports.md
 *
 * @param params - Date range parameters (dateFrom, dateTo)
 * @returns Storage summary with total cost, volume, and SKU count
 *
 * @example
 * // Get storage summary for week 49 (Dec 1-7, 2025)
 * const summary = await getStorageSummary({
 *   dateFrom: '2025-12-01',
 *   dateTo: '2025-12-07',
 * });
 * // { data: { totalCost: 1949.52, uniqueSkus: 195, ... } }
 */
export async function getStorageSummary(
  params: StorageSummaryParams,
): Promise<StorageSummaryResponse> {
  const queryParams = buildQueryString({
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  console.info('[Storage Analytics] Fetching summary:', {
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  })

  const response = await apiClient.get<StorageSummaryResponse>(
    `/v1/analytics/storage/summary?${queryParams}`,
    { skipDataUnwrap: true },
  )

  console.info('[Storage Analytics] Summary response:', {
    totalCost: response.data?.totalCost ?? 0,
    uniqueSkus: response.data?.uniqueSkus ?? 0,
  })

  return response
}
