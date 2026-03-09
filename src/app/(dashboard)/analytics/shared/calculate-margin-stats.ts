import type { MarginStats } from './MarginSummaryCards'

interface MarginDataItem {
  revenue_gross?: number
  revenue_net: number
  operating_profit?: number
  missing_cogs_count?: number
}

interface CabinetExpenses {
  sales_gross: number
  returns_gross?: number | null
}

/**
 * Calculate margin summary statistics for brand/category pages.
 * Request #65: Use operating_profit (after ALL expenses) instead of profit (gross).
 * Use cabinet-level sales_gross as base for margin (consistent with SKU page and Cashflow).
 */
export function calculateMarginStats(
  data: MarginDataItem[],
  cabinetExpenses: CabinetExpenses | null | undefined
): MarginStats {
  const totalProfit = data.reduce((sum, item) => sum + (item.operating_profit || 0), 0)
  const salesGross = cabinetExpenses?.sales_gross ?? 0
  const returnsGross = cabinetExpenses?.returns_gross ?? 0
  const netSalesGross = salesGross - returnsGross

  return {
    total: data.length,
    totalRevenue: cabinetExpenses
      ? cabinetExpenses.sales_gross - (cabinetExpenses.returns_gross ?? 0)
      : data.reduce((sum, item) => sum + (item.revenue_gross || item.revenue_net), 0),
    totalProfit,
    avgMargin: netSalesGross !== 0 ? (totalProfit / Math.abs(netSalesGross)) * 100 : null,
    totalMissingCogs: data.reduce((sum, item) => sum + (item.missing_cogs_count || 0), 0),
  }
}
