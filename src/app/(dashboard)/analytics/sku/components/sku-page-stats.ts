/**
 * SKU Page Stats Calculation
 * Extracts summary statistics computation from page.tsx.
 *
 * Uses cabinet-level sales_gross for total revenue consistency.
 * Story 70.3-FE (D-7): Uses revenue_net as denominator for avgMargin.
 */

import type { SkuFinancialItem } from '@/types/sku-financials'
import type { CabinetLevelExpenses } from '@/hooks/useMarginAnalytics'

export interface SkuPageStats {
  total: number
  withCogs: number
  withoutCogs: number
  /** Weighted average operating margin (only SKUs with COGS) */
  avgMargin: number | null
  /** Cabinet-level net revenue or fallback to SKU sum */
  totalRevenue: number
  /** Total operating profit (only SKUs with COGS) */
  totalProfit: number
}

/**
 * Calculate summary statistics from Epic 31 SKU data
 * Returns null if no data available
 */
export function calculateSkuPageStats(
  skuData: SkuFinancialItem[],
  cabinetExpenses: CabinetLevelExpenses | undefined
): SkuPageStats | null {
  if (skuData.length === 0) return null

  const withCogsItems = skuData.filter(item => !item.missingCogs)

  // Story 70.3-FE (D-7): Use revenue_net as denominator (same as table footer)
  const avgMargin = (() => {
    if (withCogsItems.length === 0) return null
    const totalProfit = withCogsItems.reduce((sum, item) => sum + (item.profit.operating ?? 0), 0)
    const totalRevenue = withCogsItems.reduce((sum, item) => sum + item.revenue.net, 0)
    return totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null
  })()

  return {
    total: skuData.length,
    withCogs: withCogsItems.length,
    withoutCogs: skuData.filter(item => item.missingCogs).length,
    avgMargin,
    // Use cabinet-level sales_gross for consistency
    totalRevenue: cabinetExpenses
      ? cabinetExpenses.sales_gross - (cabinetExpenses.returns_gross ?? 0)
      : skuData.reduce((sum, item) => sum + item.revenue.gross, 0),
    totalProfit: withCogsItems.reduce((sum, item) => sum + (item.profit.operating ?? 0), 0),
  }
}
