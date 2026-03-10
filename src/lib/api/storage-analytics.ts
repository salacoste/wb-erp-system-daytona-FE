/**
 * Storage Analytics API Client
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 *
 * Split into modules (Story 74.5):
 * - storage-analytics-queries.ts: buildQueryString, getStorageBySku, getStorageTopConsumers
 * - storage-analytics-trends.ts: getStorageTrends, getStorageSummary
 * - this file: Barrel re-exports + import operations
 */

import { apiClient } from '../api-client'
import type {
  PaidStorageImportRequest,
  PaidStorageImportResponse,
  ImportStatusResponse,
} from '@/types/storage-analytics'

// Barrel re-exports — preserve consumer API
export {
  buildQueryString,
  getStorageBySku,
  getStorageTopConsumers,
} from './storage-analytics-queries'
export { getStorageTrends, getStorageSummary } from './storage-analytics-trends'

// ============================================================================
// Import Operations
// ============================================================================

/**
 * Trigger paid storage data import from WB API
 * POST /v1/imports/paid-storage
 *
 * @param request - Date range for import (max 8 days per WB API limit)
 * @returns Import job info with ID for status polling
 */
export async function triggerPaidStorageImport(
  request: PaidStorageImportRequest
): Promise<PaidStorageImportResponse> {
  console.info('[Storage Analytics] Triggering import:', {
    dateFrom: request.dateFrom,
    dateTo: request.dateTo,
  })

  const response = await apiClient.post<PaidStorageImportResponse>('/v1/imports/paid-storage', {
    date_from: request.dateFrom,
    date_to: request.dateTo,
  })

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
 */
export async function getImportStatus(importId: string): Promise<ImportStatusResponse> {
  const response = await apiClient.get<ImportStatusResponse>(`/v1/imports/${importId}`)
  return response
}
