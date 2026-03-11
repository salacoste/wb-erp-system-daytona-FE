/**
 * Advertising Analytics Query Keys
 * Epic 33-FE: Advertising Analytics
 *
 * TanStack Query v5 query keys factory for cache management.
 *
 * @see Story 33.1-fe: Types & API Client
 */

import type { AdvertisingAnalyticsParams, CampaignsParams } from '@/types/advertising-analytics'

/**
 * Query keys for advertising analytics.
 * Follows TanStack Query v5 patterns with factory functions.
 */
export const advertisingQueryKeys = {
  /** Base key for all advertising queries */
  all: ['advertising'] as const,

  /** Key for analytics queries */
  analytics: (params: AdvertisingAnalyticsParams) =>
    [...advertisingQueryKeys.all, 'analytics', params] as const,

  /** Key for campaigns queries */
  campaigns: (params?: CampaignsParams) =>
    [...advertisingQueryKeys.all, 'campaigns', params] as const,

  /** Key for sync status queries */
  syncStatus: () => [...advertisingQueryKeys.all, 'sync-status'] as const,
}
