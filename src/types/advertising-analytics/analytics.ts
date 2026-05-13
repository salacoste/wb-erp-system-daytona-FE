/**
 * Advertising Analytics — Enums, Response & Campaign Types
 * Extracted from advertising-analytics.ts (Story 99.1-FE)
 */

// ============================================================================
// Enum Types
// ============================================================================

export type EfficiencyStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'loss' | 'unknown'
export type ViewByMode = 'sku' | 'campaign' | 'brand' | 'category'
export type GroupByMode = 'sku' | 'imtId'
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'stale'

export type SyncTaskStatus = 'syncing' | 'completed' | 'failed' | 'idle'

// ============================================================================
// Response Interfaces
// ============================================================================

export interface MergedProduct {
  nmId: number
  vendorCode: string
}

export interface AdvertisingMeta {
  cabinet_id: string
  date_range: {
    from: string
    to: string
  }
  view_by: ViewByMode
  last_sync: string
}

export interface AdvertisingSummary {
  total_spend: number
  total_sales: number
  total_revenue: number
  total_profit: number
  overall_roas: number | null
  overall_roi: number | null
  avg_ctr: number
  avg_conversion_rate: number
  total_organic_sales: number
  avg_organic_contribution: number
}

export interface AdvertisingItem {
  key: string
  type?: 'merged_group' | 'individual'
  imtId: number | null
  mergedProducts?: MergedProduct[]
  sku_id?: string
  campaign_id?: number
  brand?: string
  category?: string
  product_name?: string
  views: number
  clicks: number
  orders: number
  spend: number
  total_sales: number
  revenue: number | null
  profit: number | null
  organic_sales: number
  organic_contribution: number
  roas: number | null
  roi: number | null
  ctr: number
  cpc: number
  conversion_rate: number
  profit_after_ads: number
  efficiency_status: EfficiencyStatus
}

export interface AdvertisingDailyItem {
  date: string
  spend: number
  views: number
  clicks: number
  orders: number
  ctr?: number
  cpc?: number
  revenue_attributed?: number
}

export interface MultiCampaignSkuWarning {
  nmId: number
  campaigns: number[]
  message: string
}

export interface AdvertisingAnalyticsResponse {
  meta: AdvertisingMeta
  summary: AdvertisingSummary
  data: AdvertisingItem[]
  daily?: AdvertisingDailyItem[]
  multiCampaignSkuWarnings?: MultiCampaignSkuWarning[]
}

// ============================================================================
// Campaign Interfaces
// ============================================================================

export interface CampaignPlacements {
  search: boolean
  recommendations: boolean
  carousel?: boolean
}

export interface Campaign {
  campaign_id: number
  name: string
  type: number
  type_name: string
  status: number
  status_name: string
  created_at: string
  start_time: string
  end_time: string | null
  daily_budget: number
  nm_ids: string[]
  sku_count: number
  placements: CampaignPlacements | null
}

export interface CampaignsMeta {
  total_count: number
  active_count: number
}

export interface CampaignsResponse {
  meta: CampaignsMeta
  data: Campaign[]
}
