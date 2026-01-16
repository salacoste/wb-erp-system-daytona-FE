/**
 * Storage Analytics Types
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 * Reference: docs/request-backend/36-epic-24-paid-storage-analytics-api.md
 */

// ============================================================================
// Period Types
// ============================================================================

/**
 * Storage analytics period info
 */
export interface StoragePeriod {
  /** ISO week start (e.g., "2025-W44") */
  from: string
  /** ISO week end (e.g., "2025-W47") */
  to: string
  /** Total days in the period */
  days_count: number
}

// ============================================================================
// Storage By SKU Types (GET /v1/analytics/storage/by-sku)
// ============================================================================

/**
 * Individual SKU storage data
 */
export interface StorageBySkuItem {
  /** WB article number */
  nm_id: string
  /** Seller's vendor code */
  vendor_code: string | null
  /** Product name */
  product_name: string | null
  /** Brand name */
  brand: string | null
  /** Total storage cost for the period (₽) */
  storage_cost_total: number
  /** Average daily storage cost (₽/day) */
  storage_cost_avg_daily: number
  /** Average volume (liters, null if no data) */
  volume_avg: number | null
  /** List of warehouses where product is stored */
  warehouses: string[]
  /** Number of days stored in period */
  days_stored: number
}

/**
 * Summary statistics for storage by SKU
 */
export interface StorageSummary {
  /** Total storage cost for all products (₽) */
  total_storage_cost: number
  /** Number of unique products */
  products_count: number
  /** Average cost per product (₽) */
  avg_cost_per_product: number
}

/**
 * Pagination info (cursor-based)
 */
export interface StoragePagination {
  /** Total number of items */
  total: number
  /** Cursor for next page (null if no more pages) */
  cursor: string | null
  /** True if more pages available */
  has_more: boolean
}

/**
 * Response from GET /v1/analytics/storage/by-sku
 */
export interface StorageBySkuResponse {
  period: StoragePeriod
  data: StorageBySkuItem[]
  summary: StorageSummary
  pagination: StoragePagination
  /** Flag indicating if data exists for the requested period */
  has_data: boolean
}

// ============================================================================
// Top Consumers Types (GET /v1/analytics/storage/top-consumers)
// ============================================================================

/**
 * Top consumer item with storage cost ranking
 */
export interface TopConsumerItem {
  /** Rank position (1-based) */
  rank: number
  /** WB article number */
  nm_id: string
  /** Seller's vendor code */
  vendor_code: string | null
  /** Product name */
  product_name: string | null
  /** Brand name */
  brand: string | null
  /** Storage cost for the period (₽) */
  storage_cost: number
  /** Percentage of total storage cost */
  percent_of_total: number
  /** Volume (liters, null if no data) */
  volume: number | null
  /** Net revenue (optional, if include_revenue=true) */
  revenue_net?: number
  /** Storage-to-revenue ratio % (optional, null if no revenue data) */
  storage_to_revenue_ratio?: number | null
}

/**
 * Response from GET /v1/analytics/storage/top-consumers
 */
export interface TopConsumersResponse {
  period: StoragePeriod
  top_consumers: TopConsumerItem[]
  /** Total storage cost for all products (for percent calculation) */
  total_storage_cost: number
  /** Flag indicating if data exists for the requested period */
  has_data: boolean
}

// ============================================================================
// Storage Trends Types (GET /v1/analytics/storage/trends)
// ============================================================================

/**
 * Single data point in storage trends
 */
export interface StorageTrendPoint {
  /** ISO week (e.g., "2025-W44") */
  week: string
  /** Storage cost for this week (null if no data) */
  storage_cost?: number | null
  /** Volume for this week (null if no data) */
  volume?: number | null
}

/**
 * Summary statistics for a metric
 */
export interface MetricSummary {
  /** Minimum value in period */
  min: number
  /** Maximum value in period */
  max: number
  /** Average value in period */
  avg: number
  /** Trend percentage (positive = increase, negative = decrease) */
  trend: number
}

/**
 * Response from GET /v1/analytics/storage/trends
 */
export interface StorageTrendsResponse {
  period: StoragePeriod
  /** nm_id if filtered by product, null for all products */
  nm_id: string | null
  data: StorageTrendPoint[]
  /** Summary statistics per metric (optional) */
  summary?: {
    storage_cost?: MetricSummary
    volume?: MetricSummary
  }
  /** Flag indicating if data exists for the requested period */
  has_data: boolean
}

// ============================================================================
// Import Types (POST /v1/imports/paid-storage)
// ============================================================================

/**
 * Request to trigger paid storage data import
 */
export interface PaidStorageImportRequest {
  /** Start date (YYYY-MM-DD) */
  dateFrom: string
  /** End date (YYYY-MM-DD, max 8 days from dateFrom per WB API limit) */
  dateTo: string
}

/**
 * Import job status
 */
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Response from POST /v1/imports/paid-storage
 */
export interface PaidStorageImportResponse {
  /** Unique import job ID for status polling */
  import_id: string
  /** Current status of the import */
  status: ImportStatus
  /** Date range being imported */
  date_range: {
    from: string
    to: string
  }
  /** Estimated completion time in seconds (optional) */
  estimated_time_sec?: number
  /** Human-readable status message */
  message: string
}

/**
 * Import status response (GET /v1/imports/{id})
 */
export interface ImportStatusResponse {
  import_id: string
  status: ImportStatus
  /** Number of rows imported (available when completed) */
  rows_imported?: number
  /** Error message (available when failed) */
  error_message?: string
  /** Completion timestamp (available when completed/failed) */
  completed_at?: string
}

// ============================================================================
// Storage Summary Types (GET /v1/analytics/storage/summary) - Request #52
// ============================================================================

/**
 * Response from GET /v1/analytics/storage/summary
 * Request #52: Storage summary for date range
 */
export interface StorageSummaryResponse {
  data: {
    /** Total storage cost for the period (RUB) */
    totalCost: number
    /** Total volume (liters) */
    totalVolume: number
    /** Number of days in the period */
    daysCount: number
    /** Number of unique SKUs with storage data */
    uniqueSkus: number
    /** Period start date (YYYY-MM-DD) */
    dateFrom: string
    /** Period end date (YYYY-MM-DD) */
    dateTo: string
  }
}

/**
 * Parameters for GET /v1/analytics/storage/summary
 * Request #52: Date-based query for storage summary
 */
export interface StorageSummaryParams {
  /** Start date (YYYY-MM-DD) */
  dateFrom: string
  /** End date (YYYY-MM-DD) */
  dateTo: string
}

// ============================================================================
// Weekly Report Integration Types (Request #52)
// ============================================================================

/**
 * Storage SKU data from paid_storage_daily
 * Request #52: Per-SKU storage breakdown for weekly reports
 */
export interface StorageSkuData {
  /** WB product ID */
  nmId: number
  /** Seller's vendor code */
  vendorCode: string
  /** Brand name */
  brand: string
  /** Product category/subject */
  subject: string
  /** Total storage cost for the period (RUB) */
  totalCost: number
  /** Total volume (liters) */
  totalVolume: number
  /** Average daily storage cost (RUB/day) */
  avgDailyCost: number
  /** Number of days stored */
  daysStored: number
}

/**
 * Discrepancy tracking between Weekly Report and Paid Storage API
 * Request #52: Expected ~1-2% variance is normal
 */
export type StorageDiscrepancyStatus = 'ok' | 'warning' | 'error'

/**
 * Weekly report with storage SKU breakdown
 * Request #52: Integration pattern for joining data sources
 *
 * @example
 * // W49 example:
 * {
 *   week: '2025-W49',
 *   storageCostOfficial: 1923.34,    // From weekly_payout_summary
 *   storageCostFromSkus: 1949.52,    // Sum from paid_storage_daily
 *   discrepancyAmount: 26.18,
 *   discrepancyPercent: 1.36,
 *   discrepancyStatus: 'ok'
 * }
 */
export interface WeeklyReportWithStorageBreakdown {
  /** ISO week (e.g., "2025-W49") */
  week: string

  /** Storage cost from weekly_payout_summary (official WB total) */
  storageCostOfficial: number

  /** Storage cost calculated from paid_storage_daily (SKU breakdown sum) */
  storageCostFromSkus: number | null

  /** Per-SKU storage breakdown */
  storageBySkus: StorageSkuData[]

  /** Absolute discrepancy in rubles */
  discrepancyAmount: number

  /** Discrepancy as percentage of official cost */
  discrepancyPercent: number

  /**
   * Discrepancy status:
   * - 'ok': < 3% (expected variance)
   * - 'warning': 3-5% (investigate if recurring)
   * - 'error': > 5% (data quality issue)
   */
  discrepancyStatus: StorageDiscrepancyStatus | null

  /** Notice when SKU data is unavailable */
  notice?: string
}

/**
 * Product profitability with storage breakdown
 * Request #52: Per-product profitability calculation
 */
export interface ProductProfitability {
  /** WB product ID */
  nmId: number
  /** ISO week */
  week: string
  /** Revenue from weekly report */
  revenue: number
  /** Cost of goods sold */
  cogs: number
  /** Storage cost from paid_storage_daily */
  storageCost: number
  /** Logistics cost from weekly report */
  logisticsCost: number
  /** Calculated profit = revenue - cogs - storage - logistics */
  profit: number
  /** Margin percentage = (profit / revenue) * 100 */
  marginPercent: number
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Parameters for GET /v1/analytics/storage/by-sku
 * Supports both week-based (weekStart/weekEnd) and date-based (dateFrom/dateTo) queries
 */
export interface StorageBySkuParams {
  /** Start week (ISO format, e.g., "2025-W44") */
  weekStart: string
  /** End week (ISO format, e.g., "2025-W47") */
  weekEnd: string
  /** Filter by nm_id */
  nm_id?: string
  /** Filter by brand (comma-separated for multiple) */
  brand?: string
  /** Filter by warehouse (comma-separated for multiple) */
  warehouse?: string
  /** Sort field */
  sort_by?: 'storage_cost' | 'volume' | 'days_stored'
  /** Sort order */
  sort_order?: 'asc' | 'desc'
  /** Items per page (default: 20) */
  limit?: number
  /** Pagination cursor */
  cursor?: string
}

/**
 * Parameters for GET /v1/analytics/storage/top-consumers
 */
export interface StorageTopConsumersParams {
  /** Start week (ISO format) */
  weekStart: string
  /** End week (ISO format) */
  weekEnd: string
  /** Number of top consumers to return (default: 5) */
  limit?: number
  /** Include revenue data for ratio calculation */
  include_revenue?: boolean
  /** Filter by brand name(s) - comma-separated for multi-select (Story 24.9) */
  brand?: string
  /** Filter by warehouse name(s) - comma-separated for multi-select (Story 24.9) */
  warehouse?: string
}

/**
 * Parameters for GET /v1/analytics/storage/trends
 */
export interface StorageTrendsParams {
  /** Start week (ISO format) */
  weekStart: string
  /** End week (ISO format) */
  weekEnd: string
  /** Filter by nm_id for single product trend */
  nm_id?: string
  /** Metrics to include (default: ['storage_cost']) */
  metrics?: ('storage_cost' | 'volume')[]
  /** Filter by brand name(s) - comma-separated for multi-select (Story 24.9) */
  brand?: string
  /** Filter by warehouse name(s) - comma-separated for multi-select (Story 24.9) */
  warehouse?: string
}
