/**
 * Storage Analytics Trends & Import Types
 * Extracted from storage-analytics.ts for 200-line cap compliance.
 * Story 24.1-FE: TypeScript Types & API Client
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import type { StoragePeriod } from './storage-analytics'

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
 * Summary statistics for a MONEY metric (e.g. storage_cost).
 * min/max/avg are nullable — null = unknown (AP#8: money, never 0, renders '—').
 * `trend` is a SEMANTIC-ZERO ratio (0 = no change), so it stays `number`.
 * (BD-44: split from MetricSummary — volume keeps MetricSummary where 0 is meaningful.)
 */
export interface MoneyMetricSummary {
  /** Minimum storage cost in period. Null = unknown (AP#8: money, never 0). */
  min: number | null
  /** Maximum storage cost in period. Null = unknown (AP#8: money, never 0). */
  max: number | null
  /** Average storage cost in period. Null = unknown (AP#8: money, never 0). */
  avg: number | null
  /** Trend percentage (positive = increase, negative = decrease); 0 = no change. */
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
  /** Summary statistics per metric (optional). storage_cost = money (nullable, AP#8); volume = count. */
  summary?: {
    storage_cost?: MoneyMetricSummary
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
/**
 * 'unknown' = backend returned a status string outside the known set.
 * Story 169.12 Task 0 (Defensive Frontend): preserve unrecognized statuses
 * distinguishably instead of coercing to 'failed' (which rendered an error).
 */
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'unknown'

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
  /** Period information (added for defensive normalization) */
  period: StoragePeriod
  data: {
    /** Total storage cost for the period (RUB). Null = unknown (AP#8: money, never 0). */
    totalCost: number | null
    /** Total volume (liters) */
    totalVolume: number
    /** Number of days in the period */
    daysCount: number
    /** Number of unique SKUs with storage data */
    uniqueSkus: number
    /** Average cost per SKU (calculated as totalCost / uniqueSkus). Null = unknown (AP#8: money, never 0). */
    avgCostPerSku: number | null
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
// Query Parameter Types
// ============================================================================

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
