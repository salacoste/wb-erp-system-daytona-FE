/**
 * Query keys, shared types, and helpers for margin analytics hooks
 * Epic 74: Extracted from useMarginAnalytics.ts for file size compliance
 */

/**
 * Filters for margin analytics hooks
 * Story 6.1-FE: Added weekStart/weekEnd for date range support
 * Story 6.2-FE: Added compareTo for period comparison
 */
export interface MarginAnalyticsFilters {
  week?: string // Single week (backward compatible, e.g., "2025-W47")
  weekStart?: string // Story 6.1-FE: Range start (ISO week)
  weekEnd?: string // Story 6.1-FE: Range end (ISO week)
  compareTo?: string // Story 6.2-FE: Comparison period (ISO week, e.g., "2025-W43")
  compareToStart?: string // Story 6.2-FE: Comparison range start
  compareToEnd?: string // Story 6.2-FE: Comparison range end
  includeCogs?: boolean // Default: true (maps to include_cogs in API)
  // FR-2..FR-5 (#219): opt-in flags for the competitor-parity fields. Default true
  // so the share/parity columns populate out of the box; pass false to opt out.
  includeAds?: boolean // → advertising_cost / drr_pct / ad_cost_per_unit
  includeStock?: boolean // → stock_fbs / stock_fbo / stock_total / stock_value_rub / share_pct
  cursor?: string // Pagination cursor
  limit?: number // Items per page (default: 50)
  nmId?: string // Story 4.9: nm_id for CLIENT-SIDE filtering only
  // Note: /by-sku endpoint does NOT support nm_id param
  // Data is filtered after fetch, not in API call
}

export type SortField = 'margin_pct' | 'revenue_net' | 'sa_name' | 'profit'
export type SortOrder = 'asc' | 'desc'

/**
 * Cabinet-level expenses and cashflow response interface
 * Includes full cashflow data + expenses not attributed to specific SKUs (nm_id='UNKNOWN')
 */
export interface CabinetLevelExpenses {
  // Cashflow data (mathematically consistent)
  /** Sales before marketplace commission */
  sales_gross: number
  /** Returns gross (Возвраты) */
  returns_gross: number
  /** Marketplace commission (Комиссия МП) */
  marketplace_commission: number
  /** Acquiring fee (Эквайринг) - for visibility, already included in net_for_pay deduction */
  acquiring_fee: number
  /** Total COGS across all SKUs */
  cogs_total: number
  /** Gross profit from SKUs: to_pay_goods - cogs (FIXED 2025-12-19: was sales_gross - commission - cogs) */
  gross_profit_sku: number
  // Cabinet-level expenses (deducted from payout)
  /** Logistics costs (Стоимость логистики) */
  logistics: number
  /** Storage costs from paid_storage_daily (Хранение - основной источник) */
  storage: number
  /** Request #67: Storage from weekly report (Хранение из еженедельного отчёта - для сравнения) */
  storage_weekly_report: number
  /** Request #67: Difference between storage sources (storage - storage_weekly_report) */
  storage_difference: number
  /** Other adjustments (Прочие удержания) */
  other_adjustments: number
  /** WB commission adjustment (Корректировка ВВ, reason='Удержание') */
  wb_commission_adj: number
  /** Penalties (Штрафы) */
  penalties: number
  /** Paid acceptance costs (Платная приёмка) */
  paid_acceptance: number
  /** Total cabinet-level expenses (including logistics) */
  total: number
  /** Weeks included in the calculation */
  weeks_included: string[]
}

/**
 * Helper function to get current ISO week
 * @example getCurrentIsoWeek(); // "2025-W47"
 */
export function getCurrentIsoWeek(): string {
  const date = new Date()

  // ISO week date calculation
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)

  return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Helper function to format week for display
 * @example formatWeekDisplay('2025-W47'); // "Неделя 47, 2025"
 */
export function formatWeekDisplay(week: string): string {
  const match = week.match(/^(\d{4})-W(\d{2})$/)
  if (!match) return week

  const [, year, weekNum] = match
  return `Неделя ${parseInt(weekNum, 10)}, ${year}`
}

/** Shared query config for margin analytics hooks */
export const MARGIN_ANALYTICS_QUERY_CONFIG = {
  staleTime: 30000, // 30 seconds
  gcTime: 300000, // 5 minutes
  refetchOnWindowFocus: true,
  retry: 1,
} as const

/** Build URLSearchParams from margin analytics filters */
export function buildMarginAnalyticsParams(filters: MarginAnalyticsFilters): URLSearchParams {
  const {
    week,
    weekStart,
    weekEnd,
    compareTo,
    compareToStart,
    compareToEnd,
    includeCogs = true,
    includeAds = true,
    includeStock = true,
    cursor,
    limit = 50,
  } = filters

  const isRangeQuery = weekStart && weekEnd
  const params = new URLSearchParams()

  // Story 6.1-FE: Use weekStart/weekEnd if provided, otherwise use single week
  if (isRangeQuery) {
    params.append('weekStart', weekStart)
    params.append('weekEnd', weekEnd)
  } else if (week) {
    params.append('week', week)
  }

  params.append('include_cogs', String(includeCogs))
  params.append('include_ads', String(includeAds))
  params.append('include_stock', String(includeStock))

  if (cursor) {
    params.append('cursor', cursor)
  }

  if (limit !== 50) {
    params.append('limit', String(limit))
  }

  // Story 6.2-FE: Add compare_to parameter for period comparison
  if (compareTo) {
    params.append('compare_to', compareTo)
  } else if (compareToStart && compareToEnd) {
    params.append('compare_to_start', compareToStart)
    params.append('compare_to_end', compareToEnd)
  }

  return params
}

/** Raw paginated response shape from margin analytics endpoints */
export interface RawMarginAnalyticsResponse {
  items?: unknown[]
  data?: unknown[]
  meta?: Record<string, unknown>
}

/** Extract items array from various API response shapes */
export function extractItems(response: unknown[] | RawMarginAnalyticsResponse): {
  items: unknown[]
  meta: Record<string, unknown> | undefined
} {
  const items = Array.isArray(response) ? response : (response.items ?? response.data ?? [])
  const meta = Array.isArray(response) ? undefined : response.meta
  return { items, meta }
}
