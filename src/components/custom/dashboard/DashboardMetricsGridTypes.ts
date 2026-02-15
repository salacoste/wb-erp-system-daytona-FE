/**
 * Type definitions for DashboardMetricsGrid
 * Extracted for 200-line file limit compliance (Story 65.17).
 */

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
  grossProfit: number | null
  marginPct: number | null
  // Legacy fields for compatibility
  ordersCogs: number | null
  salesAmount: number | null
  salesCogs: number | null
  storageCost: number | null
  theoreticalProfit: number | null
}

export interface DashboardMetricsGridProps {
  // Секция 1: ВЫРУЧКА
  totalOrders: number | undefined
  saleGross: number | undefined
  wbSalesGross: number | undefined
  wbReturnsGross: number | undefined
  // Секция 2: РАСХОДЫ WB
  commissionSales: number | undefined
  acquiringFee: number | undefined
  loyaltyFee: number | undefined
  penaltiesTotal: number | undefined
  wbCommissionAdj: number | undefined
  wbServicesCost: number | undefined
  logisticsCost: number | undefined
  // Секция 3: К ПЕРЕЧИСЛЕНИЮ
  payoutTotal: number | undefined
  storageCost: number | undefined
  paidAcceptanceCost: number | undefined
  // Секция 4: СЕБЕСТОИМОСТЬ И РЕКЛАМА
  cogsTotal: number | undefined
  cogsCoverage: number
  productsWithCogs: number
  totalProducts: number
  advertisingSpend: number | undefined
  advertisingRoas: number | undefined
  // Секция 5: ПРИБЫЛЬ
  grossProfit: number | undefined
  marginPct: number | undefined
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
