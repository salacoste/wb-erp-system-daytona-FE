/**
 * MSW Handlers for Advertising Analytics API - Barrel Re-export
 * Epic 33 - Advertising Analytics
 *
 * Splits:
 * - advertising-analytics.ts: advertising items/summary handlers + mock data
 * - advertising-campaigns.ts: campaign + sync-status handlers + mock data
 */

// Re-export analytics handlers and mock data
export {
  mockAdvertisingSummary,
  mockAdvertisingMeta,
  mockAdvertisingItems,
  mockAdvertisingResponse,
  mockEmptyAdvertisingResponse,
  advertisingAnalyticsHandlers,
  advertisingErrorHandlers,
} from './advertising-analytics'

// Re-export campaign handlers and mock data
export {
  mockCampaigns,
  mockCampaignsResponse,
  mockSyncStatusResponse,
  advertisingCampaignHandlers,
} from './advertising-campaigns'

/**
 * Combined advertising handlers for MSW setup
 */
import { advertisingAnalyticsHandlers } from './advertising-analytics'
import { advertisingCampaignHandlers } from './advertising-campaigns'

export const advertisingHandlers = [...advertisingAnalyticsHandlers, ...advertisingCampaignHandlers]
