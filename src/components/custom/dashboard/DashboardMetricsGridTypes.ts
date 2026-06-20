/**
 * Type definitions for DashboardMetricsGrid
 * Extracted for 200-line file limit compliance (Story 65.17).
 * Epic 66-FE: Added TaxMetrics integration for tax/VAT cards.
 *
 * WB Price Chain (две ценовые шкалы):
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ РРЦ (ordersRevenue) ← полная цена каталога                       │
 * │   × (1 − скидка продавца)                                         │
 * │ = Цена на карточке (ordersRevenueDiscounted) ← база комиссии WB   │
 * │                                                                    │
 * │ Розничный уровень (retail):      Уровень поставщика (supplier):   │
 * │   sales_gross (все продажи)        × (1 − комиссия WB)           │
 * │   − returns_gross (все возвраты)  = wbSalesGross (Выкупы, ₽)     │
 * │   = saleGross (Продажи розница)    − wbReturnsGross (Возвр., ₽)  │
 * │                                   = чистая выручка поставщика     │
 * │                                                                    │
 * │ ⚠ saleGross ≠ wbSalesGross − wbReturnsGross (разные уровни цен!) │
 * └────────────────────────────────────────────────────────────────────┘
 */

import type { LogisticsBreakdown, TaxMetrics } from '@/types/finance-summary'

export interface PreviousPeriodData {
  ordersAmount: number | null
  ordersCount: number | null
  saleGross: number | null
  wbCommissionsTotal: number | null
  logisticsCost: number | null
  payoutTotal: number | null
  storageAcceptanceTotal: number | null
  cogsTotal: number | null
  advertisingSpend: number | null
  wbPromotionCost?: number | null
  grossProfit: number | null
  marginPct: number | null
  // Request #155: Analytical profit/margin
  grossProfitAnalytical?: number | null
  operatingProfitAnalytical?: number | null
  grossMarginPct?: number | null
  operatingMarginPct?: number | null
  // Legacy fields for compatibility
  ordersCogs: number | null
  salesAmount: number | null
  salesCogs: number | null
  storageCost: number | null
  theoreticalProfit: number | null
  // Paid acceptance cost for PaidAcceptanceCard comparison
  paidAcceptanceCost: number | null
  // WB other deductions total for OtherDeductionsCard comparison
  wbOtherDeductionsTotal: number | null
  // Epic 66-FE: Tax metrics for TaxCard/NetProfitCard comparison
  taxMetrics?: TaxMetrics | null
}

export interface DashboardMetricsGridProps {
  // Заказы
  totalOrders: number | undefined // Количество заказов (шт)
  ordersRevenue: number | undefined // РРЦ — полная цена каталога
  ordersRevenueDiscounted: number | undefined // Цена на карточке WB (после скидки продавца)
  // Продажи и возвраты
  saleGross: number | undefined // Продажи розница = выкупы - возвраты
  wbSalesGross: number | undefined // Выкупы — деньги от выкупленных товаров
  wbReturnsGross: number | undefined // Возвраты — деньги за возвращённые товары
  salesCount: number | undefined // Количество выкупов (шт)
  returnsCount: number | undefined // Количество возвратов (шт)
  // Расходы WB
  commissionSales: number | undefined
  acquiringFee: number | undefined
  loyaltyFee: number | undefined
  penaltiesTotal: number | undefined
  wbCommissionAdj: number | undefined
  logisticsCost: number | undefined
  /** Story 65.6: Logistics breakdown by delivery type */
  logisticsBreakdown?: LogisticsBreakdown | null
  // К перечислению
  payoutTotal: number | undefined
  storageCost: number | undefined
  paidAcceptanceCost: number | undefined
  // Себестоимость и реклама
  cogsTotal: number | undefined
  cogsCoverage: number
  productsWithCogs: number
  totalProducts: number
  advertisingSpend: number | undefined
  advertisingRoas: number | null | undefined
  /** Actual WB promotion deductions from finance-summary (wb_promotion_cost) */
  wbPromotionCost?: number | undefined
  /** WB Jam (ВБ.Джем) cost from finance-summary (wb_jam_cost) */
  wbJamCost?: number | undefined
  /** WB other services cost from finance-summary (wb_other_services_cost) */
  wbOtherServicesCost?: number | undefined
  // Прибыль
  grossProfit: number | undefined
  marginPct: number | undefined
  // Request #155: Analytical profit/margin from margin_fact
  grossProfitAnalytical?: number | undefined
  operatingProfitAnalytical?: number | undefined
  operatingMarginPct?: number | undefined
  grossMarginPct?: number | undefined
  // Epic 66-FE: Tax & VAT data from backend
  taxMetrics?: TaxMetrics | null
  // Common
  previousPeriodData: PreviousPeriodData | undefined
  isLoading: boolean
  error: Error | null
  onRetry?: () => void
  onAssignCogs?: () => void
  className?: string
}

// Re-export for backward compatibility
export interface FinanceSummaryData {
  revenue?: number | null
  logistics_cost?: number | null
  storage_cost?: number | null
  sale_gross_total?: number | null
}
