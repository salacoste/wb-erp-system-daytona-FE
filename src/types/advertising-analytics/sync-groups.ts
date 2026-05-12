/**
 * Advertising Analytics — Sync Status, Merged Groups & Query Params
 * Extracted from advertising-analytics.ts (Story 99.1-FE)
 */

import type {
  HealthStatus,
  SyncTaskStatus,
  ViewByMode,
  GroupByMode,
  EfficiencyStatus,
} from './analytics'

// ============================================================================
// Sync Status Interfaces
// ============================================================================

export interface SyncLastTask {
  taskUuid: string
  status: string
  startedAt: string
  finishedAt: string
  error: string | null
}

export interface SyncStatusResponse {
  lastSyncAt: string | null
  nextScheduledSync: string
  status: SyncTaskStatus
  lastTask?: SyncLastTask
  campaignsSynced: number
  dataAvailableFrom: string | null
  dataAvailableTo: string | null
  dataLagDays?: number | null
  healthStatus?: 'ok' | 'warning' | 'stale' | 'no_data'
  dataGaps?: Array<{ from: string; to: string; missingDays: number }>
}

export function deriveHealthStatus(response: SyncStatusResponse): HealthStatus {
  if (response.status === 'failed') {
    return 'unhealthy'
  }

  if (!response.lastSyncAt) {
    return 'stale'
  }

  const lastSyncTime = new Date(response.lastSyncAt).getTime()
  const now = Date.now()
  const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60)

  if (hoursSinceSync <= 24) {
    return 'healthy'
  } else if (hoursSinceSync <= 26) {
    return 'degraded'
  } else {
    return 'stale'
  }
}

// ============================================================================
// Epic 37: Merged Group Types
// ============================================================================

export interface MainProduct {
  nmId: number
  vendorCode: string
  name?: string
}

export interface AggregateMetrics {
  totalViews: number
  totalClicks: number
  totalOrders: number
  totalSpend: number
  totalRevenue: number
  totalSales: number
  organicSales: number
  organicContribution: number
  roas: number | null
  roi: number | null
  ctr: number
  cpc: number | null
  conversionRate: number
  profitAfterAds: number
}

export interface MergedGroupProduct {
  nmId: number
  vendorCode: string
  imtId: number | null
  isMainProduct: boolean
  totalViews: number
  totalClicks: number
  totalOrders: number
  totalSpend: number
  totalRevenue: number
  totalSales: number
  organicSales: number
  organicContribution: number
  roas: number | null
  roi: number | null
  ctr: number
  cpc: number | null
  conversionRate: number
  profitAfterAds: number
}

export interface AdvertisingGroup {
  type: 'merged_group' | 'individual'
  imtId: number | null
  mainProduct: MainProduct
  productCount: number
  aggregateMetrics: AggregateMetrics
  products: MergedGroupProduct[]
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface AdvertisingAnalyticsParams {
  from: string
  to: string
  view_by?: ViewByMode
  group_by?: GroupByMode
  efficiency_filter?: EfficiencyStatus | 'all'
  campaign_ids?: number[]
  sku_ids?: string[]
  sort_by?:
    | 'spend'
    | 'revenue'
    | 'orders'
    | 'views'
    | 'clicks'
    | 'roas'
    | 'roi'
    | 'ctr'
    | 'cpc'
    | 'profit_after_ads'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
  include_daily?: boolean
}

export interface CampaignsParams {
  status?: string
  type?: number
  search?: string
  limit?: number
  offset?: number
}
