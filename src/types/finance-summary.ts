/**
 * Finance Summary Types
 * Story 60.4-FE: Connect Dashboard to Period State
 *
 * Types for weekly financial summary data from backend API.
 */

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
  acquiring_fee_total?: number // Эквайринг - from summary_total
  acquiring_fee?: number // Эквайринг - from summary_rus/eaeu (legacy)
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
  retail_price_total?: number
  retail_price_total_total?: number

  // Request #44 / Story 25.2: COGS Section
  cogs_total?: number | null
  cogs_coverage_pct?: number | null
  products_with_cogs?: number | null
  products_total?: number | null
  gross_profit?: number | null

  // Story 61.13-FE: Margin Calculation Consistency
  // margin_pct = (sale_gross_total - cogs_total) / sale_gross_total * 100
  // Calculated by frontend aggregation, only when cogs_coverage_pct = 100%
  margin_pct?: number | null
}
