/**
 * Analytics Types
 * Story 6.4-FE: Cabinet Summary Dashboard
 * Epic 26: Per-SKU Operating Profit & Expense Tracking
 *
 * Types for cabinet summary API responses and components.
 */

/**
 * Trend direction indicator for KPI metrics
 */
export type TrendDirection = 'up' | 'down' | 'stable'

/**
 * Summary totals from cabinet analytics
 * Story 25.1: Extended with P&L data from weekly_payout_total
 * Epic 26: Extended with operating expenses and operating profit
 */
export interface CabinetSummaryTotals {
  // Story 25.1: P&L metrics from weekly_payout_total
  sales_gross: number | null // Продажи (gross)
  returns_gross: number | null // Возвраты (gross) - display as negative
  sale_gross: number | null // Чистые продажи (NET) = sales - returns
  total_commission_rub: number | null // Комиссия WB
  logistics_cost: number | null // Логистика
  storage_cost: number | null // Хранение
  paid_acceptance_cost: number | null // Платная приёмка
  penalties: number | null // Штрафы
  payout_total: number | null // Маржинальный доход до COGS (К перечислению)

  // Original margin metrics from weekly_margin_fact
  revenue_net: number
  cogs_total: number | null
  profit: number | null
  margin_pct: number | null
  qty: number
  profit_per_unit: number | null
  roi: number | null

  // Epic 26: Operating Expenses (aggregated from weekly_margin_fact)
  acquiring_fee?: number | null // Эквайринг
  loyalty_fee?: number | null // Лояльность
  loyalty_compensation?: number | null // Компенсация лояльности
  other_adjustments?: number | null // Прочие корректировки
  commission?: number | null // Комиссия из margin_fact
  /**
   * WB.Promotion + Dzham costs extracted from corrections via bonus_type_name pattern matching.
   * Distinct from `commission` (which is from `weekly_margin_fact`). Per request-backend/173 § I1.
   * IMPORTANT: do NOT double-count against `total_commission_rub` — `commission_other` is supplemental.
   * Nullable: `null` when cabinet has no correction-type costs for the period.
   */
  commission_other?: number | null
  total_expenses?: number | null // Общие операционные расходы
  operating_profit?: number | null // Операционная прибыль (может быть отрицательной!)
  operating_margin_pct?: number | null // Операционная маржа %
  skus_with_expenses_only?: number | null // Товары без продаж с расходами

  // Request #56: WB Services Breakdown (inside other_adjustments)
  // Source: corrections WHERE reason='Удержание' + bonus_type_name pattern matching
  wb_services_cost?: number | null // Итого WB сервисы (реклама + Джем + прочие)
  wb_promotion_cost?: number | null // WB.Продвижение (реклама)
  wb_jam_cost?: number | null // Джем (подписка)
  wb_other_services_cost?: number | null // Прочие сервисы WB (утилизация и др.)
  /** Request #56: backend sends the breakdown as an object (NOT the flat wb_*_cost fields).
   *  normalizeCabinetSummaryResponse maps it into wb_promotion_cost/wb_jam_cost/wb_other_services_cost. */
  wb_services_breakdown?: {
    promotion?: number | null
    jam?: number | null
    other?: number | null
  } | null
}

/**
 * Product coverage statistics
 */
export interface CabinetProductStats {
  total: number
  with_cogs: number
  without_cogs: number
  coverage_pct: number
}

/**
 * Trend indicators for KPI comparisons
 */
export interface CabinetTrends {
  revenue_trend: TrendDirection
  profit_trend: TrendDirection
  margin_trend: TrendDirection
  week_over_week_growth: number
}

/**
 * Top product item in cabinet summary
 * Epic 26: Extended with operating expenses
 */
export interface TopProductItem {
  nm_id: string
  sa_name: string
  revenue_net: number
  profit: number | null
  margin_pct: number | null
  contribution_pct: number
  // Epic 26: Operating metrics
  total_expenses?: number | null
  operating_profit?: number | null
  operating_margin_pct?: number | null
  has_revenue?: boolean
}

/**
 * Top brand item in cabinet summary
 * Epic 26: Extended with operating expenses
 */
export interface TopBrandItem {
  brand: string
  revenue_net: number
  profit: number | null
  margin_pct: number | null
  // Epic 26: Operating metrics
  total_expenses?: number | null
  operating_profit?: number | null
  operating_margin_pct?: number | null
  skus_with_expenses_only?: number
}

/**
 * Period metadata for cabinet summary
 */
export interface CabinetSummaryPeriod {
  start: string
  end: string
  weeks_count: number
}

/**
 * Full cabinet summary response from API.
 * Endpoint: `GET /v1/analytics/weekly/cabinet-summary` (path includes `weekly/`
 * prefix per backend canonical contract — request-backend/173 § Quick Reference).
 */
export interface CabinetSummaryResponse {
  summary: {
    totals: CabinetSummaryTotals
    products: CabinetProductStats
    trends: CabinetTrends
  }
  top_products: TopProductItem[]
  top_brands: TopBrandItem[]
  meta: {
    cabinet_id: string
    cabinet_name?: string
    period: CabinetSummaryPeriod
    generated_at: string
  }
}

/**
 * Parameters for cabinet summary hook
 */
export interface CabinetSummaryParams {
  /** Number of weeks to include (default: 4, max: 52) */
  weeks?: number
  /** Alternative: explicit range start (ISO week format) */
  weekStart?: string
  /** Alternative: explicit range end (ISO week format) */
  weekEnd?: string
}

// ============================================================================
// Re-exports from analytics-periods.ts (backward compatibility)
// ============================================================================

export type {
  ExportType,
  ExportFormat,
  ExportRequest,
  ExportCreateResponse,
  ExportStatus,
} from './analytics-periods'
