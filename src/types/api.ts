/**
 * Common API-related TypeScript types
 */

export interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
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
    /** @deprecated Use recalculate_weekly_margin instead */
    | 'enrich_cogs'
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
  status: 'processing' | 'completed' | 'failed'
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
}

/**
 * Product type (legacy - use ProductWithCogs from types/cogs.ts for new code)
 * @deprecated Use ProductWithCogs or ProductListItem from types/cogs.ts instead
 */
export interface Product {
  nm_id: string // WB article ID
  name: string
  brand?: string
  category?: string
  cogs?: number // Cost of Goods Sold
  cogs_version?: number
  updated_at: string
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

/**
 * Margin Trends Response
 * GET /v1/analytics/weekly/margin-trends
 */
export interface MarginTrendsResponse {
  data: MarginTrendPoint[]
  pagination?: {
    total: number
    has_next: boolean
  }
  message?: string
}

/**
 * Dedicated Trends API (Story 6.6 / Story 3.4a)
 * GET /v1/analytics/weekly/trends
 * Single request replaces N separate finance-summary calls
 */
export interface WeeklyTrendDataPoint {
  /** ISO week identifier (e.g., "2025-W47") */
  week: string
  /** Итого к оплате */
  payout_total?: number | null
  /** Продажи (gross) - retail price (цена для покупателя) */
  sale_gross?: number | null
  /** Выручка продавца после комиссии WB (Story 61.1) */
  wb_sales_gross?: number | null
  /** К перечислению за товар */
  to_pay_goods?: number | null
  /** Логистика */
  logistics_cost?: number | null
  /** Хранение */
  storage_cost?: number | null
  /** Платная приёмка */
  paid_acceptance_cost?: number | null
  /** Штрафы */
  penalties_total?: number | null
  /** Комиссия лояльности */
  loyalty_fee?: number | null
  /** Комиссия WB */
  wb_commission_adj?: number | null

  /**
   * WB Services expense breakdown
   * @see docs/request-backend/123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md
   */
  wb_services_cost?: number | null
  wb_promotion_cost?: number | null
  wb_jam_cost?: number | null
  wb_other_services_cost?: number | null
}

export interface TrendMetricSummary {
  min: number
  max: number
  avg: number
  /** Trend percentage, e.g., "+16.0%", "-5.2%", "0.0%" */
  trend: string
}

export interface WeeklyTrendsResponse {
  period: {
    from: string
    to: string
    weeks_count: number
  }
  data: WeeklyTrendDataPoint[]
  summary?: {
    payout_total?: TrendMetricSummary
    sale_gross?: TrendMetricSummary
    to_pay_goods?: TrendMetricSummary
    logistics_cost?: TrendMetricSummary
    storage_cost?: TrendMetricSummary
    paid_acceptance_cost?: TrendMetricSummary
    penalties_total?: TrendMetricSummary
    loyalty_fee?: TrendMetricSummary
    wb_commission_adj?: TrendMetricSummary
    // WB Services expense breakdown (Request #56, Epic 47)
    wb_services_cost?: TrendMetricSummary
    wb_promotion_cost?: TrendMetricSummary
    wb_jam_cost?: TrendMetricSummary
    wb_other_services_cost?: TrendMetricSummary
  }
  message?: string
}

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
  CogsValidationError,
  MissingDataReason,
  MarginAnalyticsSku,
  MarginAnalyticsAggregated,
  MarginAnalyticsSkuResponse,
  MarginAnalyticsAggregatedResponse,
  Pagination,
} from './cogs'
