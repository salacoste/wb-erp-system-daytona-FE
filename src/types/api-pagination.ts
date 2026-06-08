/**
 * Trends API types and pagination-related types extracted from api.ts
 * for 200-line max-lines compliance.
 */

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
