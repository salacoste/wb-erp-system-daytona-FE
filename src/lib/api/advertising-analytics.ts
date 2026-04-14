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
import type {
  CampaignsParams,
  CampaignsResponse,
  SyncStatusResponse,
} from '@/types/advertising-analytics'
import { buildQueryString } from './advertising-analytics-api'

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
 * Returns campaigns for the cabinet with optional filtering.
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns Campaigns response with meta and campaign list
 *
 * @example
 * // Get all campaigns
 * const campaigns = await getAdvertisingCampaigns();
 *
 * @example
 * // Get only active campaigns
 * const activeCampaigns = await getAdvertisingCampaigns({
 *   status: '9',  // 9 = active
 * });
 *
 * @example
 * // Search by name with pagination
 * const searchResults = await getAdvertisingCampaigns({
 *   search: 'Autumn',
 *   limit: 10,
 *   offset: 0,
 * });
 */
export async function getAdvertisingCampaigns(
  params?: CampaignsParams
): Promise<CampaignsResponse> {
  const queryParams = params ? buildQueryString({ ...params }) : ''
  const url = queryParams
    ? `/v1/analytics/advertising/campaigns?${queryParams}`
    : '/v1/analytics/advertising/campaigns'

  console.info('[Advertising Analytics] Fetching campaigns:', {
    status: params?.status ?? 'all',
    type: params?.type ?? 'all',
    search: params?.search ?? '',
    limit: params?.limit ?? 'default',
    offset: params?.offset ?? 0,
  })

  // Backend format (snake_case with campaigns array)
  interface BackendCampaignsResponse {
    campaigns: Array<{
      id: string
      advertId: number
      name: string
      type: number
      typeLabel: string
      status: number
      statusLabel: string
      nmIds: number[]
      productsCount: number
      budget: number | null
      dailyBudget: number
      startDate: string
      endDate: string
      createdAt: string
      updatedAt: string
      placements?: {
        // Story 33.9 - Request #79: Type 9 campaigns only
        search: boolean
        recommendations: boolean
        carousel?: boolean
      } | null
    }>
    total: number
    limit: number
    offset: number
  }

  // Story 33.1-fe: Fetch backend response
  const backendResponse = await apiClient.get<BackendCampaignsResponse>(url, {
    skipDataUnwrap: true,
  })

  // Adapt backend format to frontend format (Campaign interface from types/advertising-analytics.ts:194)
  const response: CampaignsResponse = {
    meta: {
      total_count: backendResponse.total,
      active_count: backendResponse.campaigns.filter(c => c.status === 9).length,
    },
    data: backendResponse.campaigns.map(campaign => ({
      campaign_id: campaign.advertId,
      name: campaign.name, // Used by sortCampaignsByStatus
      type: campaign.type,
      type_name: campaign.typeLabel || 'Неизвестно',
      status: campaign.status,
      status_name: campaign.statusLabel || 'Неизвестно',
      created_at: campaign.createdAt,
      start_time: campaign.startDate, // Backend returns date string (YYYY-MM-DD)
      end_time: campaign.endDate || null,
      daily_budget: campaign.dailyBudget,
      nm_ids: campaign.nmIds.map(String), // Convert number[] to string[]
      sku_count: campaign.productsCount,
      placements: campaign.placements || null, // Story 33.9 - Request #79: Campaign placements (Type 9 only)
    })),
  }

  console.info('[Advertising Analytics] Campaigns response:', {
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
 * Returns the current sync health status including last sync time,
 * sync statistics, and error counts.
 *
 * Note: Backend marks sync as "stale" after 26 hours (24h daily sync + 2h buffer).
 *
 * @returns Sync status response with health status and statistics
 *
 * @example
 * const status = await getAdvertisingSyncStatus();
 *
 * if (status.health_status === 'healthy') {
 *   console.log('Данные актуальны');
 * } else if (status.health_status === 'stale') {
 *   console.log('Нет синхронизации более 26 часов');
 * }
 */
export async function getAdvertisingSyncStatus(): Promise<SyncStatusResponse> {
  console.info('[Advertising Analytics] Fetching sync status')

  // Story 33.1-fe: Use skipDataUnwrap to get full response
  const response = await apiClient.get<SyncStatusResponse>(
    '/v1/analytics/advertising/sync-status',
    { skipDataUnwrap: true }
  )

  console.info('[Advertising Analytics] Sync status:', {
    status: response.status,
    lastSyncAt: response.lastSyncAt ?? 'never',
    campaignsSynced: response.campaignsSynced,
    dataAvailableFrom: response.dataAvailableFrom,
    dataAvailableTo: response.dataAvailableTo,
  })

  return response
}
