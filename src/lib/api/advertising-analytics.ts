/**
 * Advertising Analytics API Client - Barrel module
 *
 * Re-exports core analytics from advertising-analytics-api.ts and provides
 * campaign and sync status endpoints.
 *
 * Epic 74 Story 74.5 Task 7: Split for file size compliance (<=200 lines).
 * Consumers continue importing from '@/lib/api/advertising-analytics'.
 *
 * @see Story 33.1-fe: Types & API Client
 */

import { apiClient } from '../api-client'
import { logger } from '@/lib/logger'
import type {
  CampaignsParams,
  CampaignsResponse,
  SyncStatusResponse,
} from '@/types/advertising-analytics'
import { buildQueryString } from './advertising-analytics-api'
import {
  normalizeCampaignsResponse,
  normalizeSyncStatusResponse,
} from './advertising-campaigns-normalizer'

// ============================================================================
// Barrel Re-exports (preserve consumer API)
// ============================================================================

export {
  advertisingErrorMessages,
  getAdvertisingErrorMessage,
  buildQueryString,
  getAdvertisingAnalytics,
} from './advertising-analytics-api'

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get list of advertising campaigns.
 * GET /v1/analytics/advertising/campaigns
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns Campaigns response with meta and campaign list
 */
export async function getAdvertisingCampaigns(
  params?: CampaignsParams
): Promise<CampaignsResponse> {
  const queryParams = params ? buildQueryString({ ...params }) : ''
  const url = queryParams
    ? `/v1/analytics/advertising/campaigns?${queryParams}`
    : '/v1/analytics/advertising/campaigns'

  logger.debug('[Advertising Analytics] Fetching campaigns:', {
    status: params?.status ?? 'all',
    type: params?.type ?? 'all',
    search: params?.search ?? '',
    limit: params?.limit ?? 'default',
    offset: params?.offset ?? 0,
  })

  const raw = await apiClient.get<unknown>(url, { skipDataUnwrap: true })
  const response = normalizeCampaignsResponse(raw)

  logger.debug('[Advertising Analytics] Campaigns response:', {
    totalCount: response.meta.total_count,
    activeCount: response.meta.active_count,
    returnedCount: response.data.length,
  })

  return response
}

/**
 * Get advertising sync status.
 * GET /v1/analytics/advertising/sync-status
 *
 * @returns Sync status response with health status and statistics
 */
export async function getAdvertisingSyncStatus(): Promise<SyncStatusResponse> {
  logger.debug('[Advertising Analytics] Fetching sync status')

  const raw = await apiClient.get<unknown>('/v1/analytics/advertising/sync-status', {
    skipDataUnwrap: true,
  })
  const response = normalizeSyncStatusResponse(raw)

  logger.debug('[Advertising Analytics] Sync status:', {
    status: response.status,
    lastSyncAt: response.lastSyncAt ?? 'never',
    campaignsSynced: response.campaignsSynced,
    dataAvailableFrom: response.dataAvailableFrom,
    dataAvailableTo: response.dataAvailableTo,
  })

  return response
}
