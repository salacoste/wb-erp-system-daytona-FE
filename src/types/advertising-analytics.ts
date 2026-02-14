/**
 * Advertising Analytics Types
 *
 * TypeScript types for advertising analytics API (Epic 33-FE).
 * Based on backend API specification: docs/request-backend/71-advertising-analytics-epic-33.md
 *
 * @see Story 33.1-fe: Types & API Client
 */

// ============================================================================
// Enum Types
// ============================================================================

/**
 * Efficiency status based on ROAS and ROI thresholds.
 *
 * Classification rules:
 * - excellent: ROAS >= 5.0, ROI >= 1.0
 * - good: ROAS 3.0-5.0, ROI 0.5-1.0
 * - moderate: ROAS 2.0-3.0, ROI 0.2-0.5
 * - poor: ROAS 1.0-2.0, ROI 0-0.2
 * - loss: ROAS < 1.0, ROI < 0
 * - unknown: No profit data available
 */
export type EfficiencyStatus = 'excellent' | 'good' | 'moderate' | 'poor' | 'loss' | 'unknown'

/**
 * View aggregation mode for analytics data.
 */
export type ViewByMode = 'sku' | 'campaign' | 'brand' | 'category'

/**
 * Grouping mode for analytics data (Epic 36).
 *
 * - 'sku': Group by individual SKUs (default, Epic 33 behavior)
 * - 'imtId': Group by WB merged product cards (склейки)
 *
 * @see Epic 36: Product Card Linking
 * @see docs/request-backend/83-epic-36-api-contract.md
 */
export type GroupByMode = 'sku' | 'imtId'

/**
 * Sync health status for advertising data.
 *
 * Note: Backend marks sync as "stale" after 26 hours (24h daily sync + 2h buffer).
 * @see Story 33.6-fe for 26h rationale
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'stale'

/**
 * Last sync operation status (original Request #71 format - deprecated).
 * @deprecated Use SyncTaskStatus instead
 */
export type SyncStatus = 'success' | 'error' | 'partial'

/**
 * Current sync task status (actual backend response).
 * @see Request #72 backend-response
 */
export type SyncTaskStatus = 'syncing' | 'completed' | 'failed' | 'idle'

// ============================================================================
// Response Interfaces
// ============================================================================

/**
 * Product information within a merged group (Epic 36).
 *
 * Represents individual products that share the same imtId (WB merged card).
 * Used in merged group view to show which products are aggregated together.
 *
 * @see Epic 36: Product Card Linking
 * @see docs/request-backend/83-epic-36-api-contract.md
 */
export interface MergedProduct {
  /** Product SKU identifier (nmId from WB) */
  nmId: number
  /** Product vendor code (артикул продавца) */
  vendorCode: string
}

/**
 * Metadata for advertising analytics response.
 */
export interface AdvertisingMeta {
  /** Cabinet identifier */
  cabinet_id: string
  /** Date range for the analytics data */
  date_range: {
    /** Start date in YYYY-MM-DD format */
    from: string
    /** End date in YYYY-MM-DD format */
    to: string
  }
  /** Current view aggregation mode */
  view_by: ViewByMode
  /** Last sync timestamp (ISO datetime) */
  last_sync: string
}

/**
 * Summary metrics for advertising analytics.
 */
export interface AdvertisingSummary {
  /** Total advertising spend in rubles */
  total_spend: number
  /** Total revenue from all sources (organic + ad) - Epic 35 */
  total_sales: number
  /** Total revenue attributed to ads only in rubles */
  total_revenue: number
  /** Total profit after ad costs in rubles */
  total_profit: number
  /** Overall Return on Ad Spend (revenue / spend) */
  overall_roas: number
  /** Overall Return on Investment ((profit - spend) / spend) */
  overall_roi: number
  /** Average click-through rate (%) */
  avg_ctr: number
  /** Average conversion rate (%) */
  avg_conversion_rate: number
  /** Total number of campaigns */
  campaign_count: number
  /** Number of currently active campaigns */
  active_campaigns: number
  /** Total organic sales not attributed to ads - Epic 35 */
  total_organic_sales: number
  /** Average percentage of organic sales across all items - Epic 35 */
  avg_organic_contribution: number
}

/**
 * Individual advertising analytics item.
 *
 * Note: Identifier fields (sku_id, campaign_id, brand, category) are optional
 * based on the view_by mode. Only the relevant identifier for the current
 * view mode will be present.
 */
export interface AdvertisingItem {
  /** Unique identifier from backend (e.g., "sku:270937054", "campaign:12345") */
  key: string

  // Epic 36: Product Card Linking fields
  /** Item type: merged group or individual product (Epic 36) */
  type?: 'merged_group' | 'individual'
  /** WB merged card identifier - склейка ID (Epic 36). Backend ALWAYS returns this field. */
  imtId: number | null
  /** Products within the merged group (Epic 36, only for type='merged_group') */
  mergedProducts?: MergedProduct[]

  // Identifiers (depend on view_by mode)
  /** SKU identifier (present when view_by='sku') */
  sku_id?: string
  /** Campaign identifier (present when view_by='campaign') */
  campaign_id?: number
  /** Brand name (present when view_by='brand') */
  brand?: string
  /** Category name (present when view_by='category') */
  category?: string
  /** Product name (present when view_by='sku') */
  product_name?: string

  // Core metrics
  /** Number of ad views/impressions */
  views: number
  /** Number of ad clicks */
  clicks: number
  /** Number of orders attributed to ads */
  orders: number
  /** Total ad spend in rubles */
  spend: number
  /** Total sales from all sources (organic + ad) - Epic 35 */
  total_sales: number
  /** Revenue attributed to ads only in rubles */
  revenue: number
  /** Profit before ad costs in rubles */
  profit: number

  // Epic 35: Organic vs advertising split
  /** Organic sales not attributed to ads (totalSales - revenue) - Epic 35 */
  organic_sales: number
  /** Percentage of sales from organic sources - Epic 35 */
  organic_contribution: number

  // Calculated metrics
  /** Return on Ad Spend (revenue / spend) */
  roas: number
  /** Return on Investment ((profit - spend) / spend) */
  roi: number
  /** Click-through rate (clicks / views * 100) */
  ctr: number
  /** Cost per click (spend / clicks) */
  cpc: number
  /** Conversion rate (orders / clicks * 100) */
  conversion_rate: number
  /** Profit after advertising costs (profit - spend) */
  profit_after_ads: number

  // Classification
  /** Efficiency status based on ROAS/ROI thresholds */
  efficiency_status: EfficiencyStatus
}

/**
 * Full advertising analytics response.
 */
export interface AdvertisingAnalyticsResponse {
  /** Response metadata */
  meta: AdvertisingMeta
  /** Summary metrics */
  summary: AdvertisingSummary
  /** List of analytics items */
  data: AdvertisingItem[]
}

// ============================================================================
// Campaign Interfaces
// ============================================================================

/**
 * Campaign placement settings (Story 33.9 - Request #79).
 * Only available for Type 9 campaigns (unified/auction).
 * Legacy campaigns (types 4-8) have null placements.
 */
export interface CampaignPlacements {
  /** Campaign active in Search placement */
  search: boolean
  /** Campaign active in Recommendations (showcase/product cards) */
  recommendations: boolean
  /** Campaign active in Carousel (optional, may not be present) */
  carousel?: boolean
}

/**
 * Campaign information.
 */
export interface Campaign {
  /** Unique campaign identifier */
  campaign_id: number
  /** Campaign name */
  name: string
  /** Campaign type code */
  type: number
  /** Campaign type display name */
  type_name: string
  /** Campaign status code */
  status: number
  /** Campaign status display name */
  status_name: string
  /** Campaign creation timestamp */
  created_at: string
  /** Campaign start timestamp */
  start_time: string
  /** Campaign end timestamp (null if ongoing) */
  end_time: string | null
  /** Daily budget in rubles */
  daily_budget: number
  /** List of nm_ids (SKUs) in the campaign */
  nm_ids: string[]
  /** Number of SKUs in the campaign */
  sku_count: number
  /** Placement settings (only for Type 9 campaigns, null for legacy) - Story 33.9 */
  placements: CampaignPlacements | null
}

/**
 * Campaigns list response.
 */
export interface CampaignsResponse {
  /** Response metadata */
  meta: {
    /** Cabinet identifier */
    cabinet_id: string
    /** Total number of campaigns */
    total_count: number
    /** Number of active campaigns */
    active_count: number
  }
  /** List of campaigns */
  data: Campaign[]
}

// ============================================================================
// Sync Status Interfaces
// ============================================================================

/**
 * Last sync task details from backend.
 * @see Request #72 backend-response
 */
export interface SyncLastTask {
  /** Task UUID */
  taskUuid: string
  /** Task status */
  status: string
  /** Task start timestamp */
  startedAt: string
  /** Task finish timestamp */
  finishedAt: string
  /** Error message if failed */
  error: string | null
}

/**
 * Sync status response for advertising data.
 *
 * Note: Backend returns camelCase fields (Request #72 backend-response).
 * @see Request #72 for actual backend response format
 */
export interface SyncStatusResponse {
  /** Last sync timestamp (null if never synced) */
  lastSyncAt: string | null
  /** Next scheduled sync timestamp (ISO datetime) */
  nextScheduledSync: string
  /** Current sync status */
  status: SyncTaskStatus
  /** Last sync task details (optional) */
  lastTask?: SyncLastTask
  /** Number of campaigns synced */
  campaignsSynced: number
  /** Data available from date (YYYY-MM-DD) */
  dataAvailableFrom: string | null
  /** Data available to date (YYYY-MM-DD) */
  dataAvailableTo: string | null
  /** How many days behind today dataAvailableTo is (0-1 is normal for T-1 sync) */
  dataLagDays?: number | null
  /** Health status: ok (lag<=2), warning (lag 3-5), stale (lag>5), no_data */
  healthStatus?: 'ok' | 'warning' | 'stale' | 'no_data'
  /** Detected gaps in the date range (missing dates between from and to) */
  dataGaps?: Array<{ from: string; to: string; missingDays: number }>
}

/**
 * Derive health status from sync response.
 * Since backend doesn't return health_status directly, we calculate it.
 *
 * Rules (from Story 33.6-fe):
 * - healthy: synced within 24 hours
 * - degraded: synced 24-48 hours ago
 * - stale: no sync > 26 hours (24h + 2h buffer)
 * - unhealthy: status === 'failed'
 */
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
    // 26h = 24h sync schedule + 2h buffer
    return 'degraded'
  } else {
    return 'stale'
  }
}

// ============================================================================
// Epic 37: Merged Group Table Display Types
// ============================================================================

/**
 * Main product information within a merged group (Epic 37).
 * Represents the primary product that drives advertising spend.
 *
 * @see Epic 37: Merged Group Table Display
 * @see docs/epics/epic-37-merged-group-table-display.md
 */
export interface MainProduct {
  /** Product SKU identifier (nmId from WB) */
  nmId: number
  /** Product vendor code (артикул продавца) */
  vendorCode: string
  /** Product name (optional, for display) */
  name?: string
}

/**
 * Aggregate metrics for merged product group (Epic 37).
 * Represents sum of all products within the group.
 *
 * @see Story 37.3: Aggregate Metrics Display
 */
export interface AggregateMetrics {
  /** Total views across all products */
  totalViews: number
  /** Total clicks across all products */
  totalClicks: number
  /** Total orders across all products */
  totalOrders: number
  /** Total ad spend across all products */
  totalSpend: number
  /** Total revenue attributed to ads */
  totalRevenue: number
  /** Total sales from all sources (organic + ad) - Epic 35 */
  totalSales: number
  /** Organic sales not attributed to ads - Epic 35 */
  organicSales: number
  /** Percentage of sales from organic sources - Epic 35 */
  organicContribution: number
  /** Return on Ad Spend (revenue / spend), null if spend = 0 */
  roas: number | null
  /** Return on Investment ((profit - spend) / spend), null if spend = 0 */
  roi: number | null
  /** Click-through rate (clicks / views * 100) */
  ctr: number
  /** Cost per click (spend / clicks), null if clicks = 0 */
  cpc: number | null
  /** Conversion rate (orders / clicks * 100), null if clicks = 0 */
  conversionRate: number
  /** Profit after advertising costs */
  profitAfterAds: number
}

/**
 * Individual product metrics within merged group (Epic 37).
 * Represents single SKU performance with full advertising metrics.
 *
 * @see Story 37.2: MergedGroupTable Component
 */
export interface MergedGroupProduct {
  /** Product SKU identifier */
  nmId: number
  /** Product vendor code */
  vendorCode: string
  /** WB merged card identifier, null for standalone products (склейка ID) */
  imtId: number | null
  /** Whether this is the main product (spend > 0) */
  isMainProduct: boolean

  // Core metrics (same structure as AggregateMetrics)
  /** Number of ad views/impressions */
  totalViews: number
  /** Number of ad clicks */
  totalClicks: number
  /** Number of orders attributed to ads */
  totalOrders: number
  /** Total ad spend in rubles */
  totalSpend: number
  /** Revenue attributed to ads only */
  totalRevenue: number
  /** Total sales from all sources (organic + ad) - Epic 35 */
  totalSales: number
  /** Organic sales not attributed to ads - Epic 35 */
  organicSales: number
  /** Percentage of sales from organic sources - Epic 35 */
  organicContribution: number
  /** Return on Ad Spend (revenue / spend), null for child products */
  roas: number | null
  /** Return on Investment ((profit - spend) / spend) */
  roi: number | null
  /** Click-through rate (clicks / views * 100) */
  ctr: number
  /** Cost per click (spend / clicks) */
  cpc: number | null
  /** Conversion rate (orders / clicks * 100) */
  conversionRate: number
  /** Profit after advertising costs */
  profitAfterAds: number
}

/**
 * Advertising group representing merged products or standalone product (Epic 37).
 * Main data structure for grouped advertising analytics view.
 *
 * @see Story 37.1: Backend API Validation
 * @see Request #88: Epic 37 Individual Product Metrics
 */
export interface AdvertisingGroup {
  /** Type of group: merged_group (склейка) or individual (standalone) */
  type: 'merged_group' | 'individual'
  /** WB merged card identifier, null for standalone products */
  imtId: number | null
  /** Main product reference (drives advertising spend) */
  mainProduct: MainProduct
  /** Number of products in this group (1 for standalone) */
  productCount: number
  /** Aggregate metrics across all products in group */
  aggregateMetrics: AggregateMetrics
  /** Individual product metrics array */
  products: MergedGroupProduct[]
}

// ============================================================================
// Query Parameters Interfaces
// ============================================================================

/**
 * Query parameters for advertising analytics endpoint.
 */
export interface AdvertisingAnalyticsParams {
  /** Start date in YYYY-MM-DD format (required) */
  from: string
  /** End date in YYYY-MM-DD format (required) */
  to: string
  /** View aggregation mode (default: 'sku') */
  view_by?: ViewByMode
  /** Grouping mode for product card linking (Epic 36, default: 'sku') */
  group_by?: GroupByMode
  /** Filter by efficiency status (default: 'all') */
  efficiency_filter?: EfficiencyStatus | 'all'
  /** Filter by campaign IDs (array of numbers) */
  campaign_ids?: number[]
  /** Filter by SKU IDs (array of strings) */
  sku_ids?: string[]
  /** Sort field (default: 'spend') - Request #80: Full backend support */
  sort_by?: 'spend' | 'revenue' | 'orders' | 'views' | 'clicks' | 'roas' | 'roi' | 'ctr' | 'cpc'
  /** Sort direction (default: 'desc') */
  sort_order?: 'asc' | 'desc'
  /** Maximum number of items to return */
  limit?: number
  /** Number of items to skip (offset-based pagination) */
  offset?: number
}

/**
 * Query parameters for campaigns list endpoint.
 */
export interface CampaignsParams {
  /** Filter by status codes (comma-separated: '9' active, '11' paused) */
  status?: string
  /** Filter by campaign type (8: auto, 9: unified/auction) */
  type?: number
  /** Search by campaign name */
  search?: string
  /** Maximum number of items to return */
  limit?: number
  /** Number of items to skip (offset-based pagination) */
  offset?: number
}
