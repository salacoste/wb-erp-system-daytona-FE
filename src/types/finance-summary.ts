/**
 * Finance Summary Types
 * Story 60.4-FE: Connect Dashboard to Period State
 *
 * Types for weekly financial summary data from backend API.
 * Sub-types (LogisticsBreakdown, TaxMetrics) live in finance-summary-sub-types.ts.
 */

// Re-export sub-types for backward compatibility
export type { LogisticsBreakdown, TaxMetrics } from './finance-summary-sub-types'
import type { LogisticsBreakdown } from './finance-summary-sub-types'

export interface FinanceSummary {
  week: string
  // Request #41: Separate sales and returns tracking
  sales_gross_total?: number // Только продажи (doc_type=sale) - from summary_total
  sales_gross?: number // Только продажи - from summary_rus/eaeu
  returns_gross_total?: number // Только возвраты (doc_type=return) - from summary_total
  returns_gross?: number // Только возвраты - from summary_rus/eaeu
  sale_gross_total?: number // NET = sales - returns - from summary_total
  sale_gross?: number // NET = sales - returns - from summary_rus/eaeu (legacy)
  to_pay_goods_total?: number // К перечислению за товар - from summary_total
  to_pay_goods?: number // К перечислению за товар - from summary_rus/eaeu (legacy)
  // Story 25.3: WB Commission - retail_price - gross (implicit commission)
  total_commission_rub_total?: number // Комиссия WB - from summary_total
  total_commission_rub?: number // Комиссия WB - from summary_rus/eaeu (legacy)
  payout_total: number // Итого к оплате
  logistics_cost_total?: number // Логистика - from summary_total
  logistics_cost?: number // Логистика - from summary_rus/eaeu (legacy)
  /** Story 65.6: Logistics breakdown by delivery type. Null when backend doesn't return it. */
  logistics_breakdown?: LogisticsBreakdown | null
  storage_cost_total?: number // Хранение - from summary_total
  storage_cost?: number // Хранение - from summary_rus/eaeu (legacy)
  paid_acceptance_cost_total?: number // Платная приёмка - from summary_total
  paid_acceptance_cost?: number // Платная приёмка - from summary_rus/eaeu (legacy)
  penalties_total: number // Штрафы
  wb_commission_adj_total?: number // Корректировка комиссии WB - from summary_total
  wb_commission_adj?: number // Корректировка комиссии WB - from summary_rus/eaeu (legacy)
  loyalty_fee_total?: number // Комиссия лояльности - from summary_total
  loyalty_fee?: number // Комиссия лояльности - from summary_rus/eaeu (legacy)
  loyalty_points_withheld_total?: number // Удержание баллов лояльности
  loyalty_points_withheld?: number // Удержание баллов лояльности (legacy)
  loyalty_compensation_total?: number // Компенсация лояльности - from summary_total
  loyalty_compensation?: number // Компенсация лояльности - from summary_rus/eaeu (legacy)
  acquiring_fee_total?: number // Эквайринг - from summary_total (legacy Epic 26-era)
  acquiring_fee?: number // Эквайринг - from summary_rus/eaeu (legacy)
  /**
   * Acquiring cost (4th expense slice). Per request-backend/169 § 2.1 — new canonical field
   * added by Epic 101. Coexists with legacy `acquiring_fee_total`/`acquiring_fee` until backend
   * deprecates them. `null` = no acquiring data available (graceful degradation).
   */
  acquiring_total?: number | null
  commission_sales_total?: number // Комиссия продаж - from summary_total
  commission_sales?: number // Комиссия продаж - from summary_rus/eaeu (legacy)
  other_adjustments_net_total?: number // Прочие корректировки - from summary_total
  other_adjustments_net?: number // Прочие корректировки (legacy)
  seller_delivery_revenue_total?: number // Выручка доставки продавца
  seller_delivery_revenue?: number // Выручка доставки продавца (legacy)

  // Request #56: WB Services Breakdown
  wb_services_cost_total?: number
  wb_services_cost?: number
  wb_promotion_cost_total?: number
  wb_promotion_cost?: number
  wb_jam_cost_total?: number
  wb_jam_cost?: number
  wb_other_services_cost_total?: number
  wb_other_services_cost?: number

  // Request #57: WB Dashboard Exact Match Fields
  wb_sales_gross_total?: number
  wb_sales_gross?: number
  wb_returns_gross_total?: number
  wb_returns_gross?: number

  // Request #58: Retail Price Total
  /** Sum of YOUR catalog prices BEFORE WB discounts (per-region scope: summary_rus / summary_eaeu). */
  retail_price_total?: number
  /** Sum of catalog prices BEFORE WB discounts at the summary_total scope. */
  retail_price_total_combined?: number
  /**
   * GHOST FIELD — does NOT correspond to any backend field. Retained as defensive fallback.
   */
  retail_price_total_total?: number

  // Request #44 / Story 25.2: COGS Section
  cogs_total?: number | null
  cogs_coverage_pct?: number | null
  products_with_cogs?: number | null
  products_total?: number | null
  gross_profit?: number | null

  // Story 61.13-FE: Margin Calculation Consistency
  margin_pct?: number | null

  // Validation fix: product-level transaction count (qty=1 operations)
  product_transactions?: number

  // Request #155: Product transactions total (from summary_total)
  product_transactions_total?: number | null

  // Request #155: Analytical profit/margin from weekly_margin_fact
  revenue_net?: number | null
  gross_profit_analytical?: number | null // revenue_net − COGS (before WB deductions)
  operating_profit_analytical?: number | null // revenue_net − COGS − expenses
  gross_margin_pct?: number | null // (revenue_net − COGS) / revenue_net × 100
  operating_margin_pct?: number | null // operating_profit / revenue_net × 100

  // Epic 66-FE: Tax metrics from summary_total.tax (Story 66.1)
  tax?: import('./finance-summary-sub-types').TaxMetrics | null
}
