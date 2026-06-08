/**
 * Common API-related TypeScript types
 */

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export class ApiError extends Error {
  /**
   * Retry-After header value parsed from a 503 response (seconds).
   * Populated by api-client when the backend returns 503 with a Retry-After
   * header (Story 96.9-FE — WB rate-limit resilience for acquiring endpoints,
   * per request-backend/169 § 1.1). Undefined for non-503 responses or when
   * the header is missing/non-numeric.
   */
  retryAfter?: number

  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }

  /** True when backend reports missing/invalid WB API token — expected for cabinets without token */
  get isWbTokenError(): boolean {
    return this.status === 401 && this.message.includes('WB API token')
  }
}

/**
 * True when an error is an HTTP 403 (Forbidden) — an EXPECTED permission state,
 * not a load failure. Lets UI render a "you lack the role" message + suppress the
 * retry affordance (retrying a permission denial never succeeds). Validation F-21:
 * tariff history/audit are Admin-only; an Owner hitting them should see a permission
 * message, not a generic "Ошибка загрузки".
 */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean
  skipCabinetId?: boolean
  /**
   * Skip auto-unwrapping of response.data field.
   * Use this when the API returns a complex response object that has a 'data' field
   * but you need the full response (e.g., storage analytics with period, summary, pagination).
   *
   * Story 24: Fix storage analytics response parsing
   */
  skipDataUnwrap?: boolean
}

/**
 * Task types for processing status
 */
export interface Task {
  uuid: string
  type:
    | 'finances_weekly_ingest'
    | 'products_sync'
    | 'recalculate_weekly_margin'
    | 'weekly_margin_aggregate'
    | 'weekly_sanity_check'
    | 'publish_weekly_views'
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'dlq' | 'cancelled'
  progress?: number // 0-100
  result?: unknown
  error?: string
  created_at: string
  updated_at: string
}

/**
 * Processing status for onboarding flow
 * Aggregated from multiple tasks
 */
export interface ProcessingStatus {
  status: 'processing' | 'completed' | 'failed' | 'no_data'
  productParsing: {
    progress: number // 0-100
    status: string
    taskUuid?: string
  }
  reportLoading: {
    progress: number // 0-100
    status: string
    taskUuid?: string
  }
  estimatedTimeRemaining?: number // seconds
  error?: string
  /** Count of failed import batches — shown as warning on dashboard */
  failedBatchCount?: number
}

/**
 * Margin Trends Analytics (Story 4.7)
 * Time-series margin analysis endpoint response types
 * Reference: docs/backend-response-10-margin-trends-endpoint.md
 */
export interface MarginTrendPoint {
  /** ISO week identifier (e.g., "2025-W47") */
  week: string
  /** ISO date of week start (e.g., "2025-11-17") */
  week_start_date: string
  /** ISO date of week end (e.g., "2025-11-23") */
  week_end_date: string
  /** Average margin percentage for the week (null if all SKUs missing COGS) */
  margin_pct: number | null
  /** Total net revenue for the week */
  revenue_net: number
  /** Total COGS for the week (null if all SKUs missing COGS) */
  cogs: number | null
  /** Total profit for the week (null if all SKUs missing COGS) */
  profit: number | null
  /** Total units sold in the week */
  qty: number
  /** Number of unique SKUs with sales */
  sku_count: number
  /** Number of SKUs without COGS data */
  missing_cogs_count: number
}

// NOTE (Validation F-30): the former `MarginTrendsResponse` wrapper interface was removed
// — apiClient auto-unwraps the `{ data }` envelope, so the margin-trends boundary normalizer
// (src/lib/api/margin-trends-normalizer.ts) works off `unknown` and returns MarginTrendPoint[].

// Re-export trends types from api-pagination.ts (extracted for max-lines compliance)
export type {
  WeeklyTrendDataPoint,
  TrendMetricSummary,
  WeeklyTrendsResponse,
} from './api-pagination'

// Re-export COGS types for convenience
export type {
  ProductWithCogs,
  ProductListItem,
  ProductListResponse,
  CogsRecord,
  ApplicableCogs, // Request #31: COGS used for margin calculation
  CogsAssignmentRequest,
  BulkCogsItem,
  BulkCogsUploadRequest,
  BulkCogsUploadResponse,
  BulkCogsUploadResponseLegacy,
  BulkCogsResultSummary, // Validation F-34: canonical normalized bulk-COGS result
  BulkCogsResult,
  MarginRecalculationStatus,
  CogsValidationError,
  MissingDataReason,
  MarginAnalyticsSku,
  MarginAnalyticsAggregated,
  MarginAnalyticsSkuResponse,
  MarginAnalyticsAggregatedResponse,
  Pagination,
} from './cogs'
