/**
 * MarginBySkuTable sorting logic
 * Extracted from MarginBySkuTable.tsx (Epic 74, Story 74.6)
 */
import type { MarginAnalyticsSku } from '@/types/api'

// Story 6.3-FE: Added roi and profit_per_unit sort fields
export type SortField =
  'margin_pct' | 'revenue_net' | 'sa_name' | 'profit' | 'qty' | 'roi' | 'profit_per_unit'
export type SortOrder = 'asc' | 'desc'

// Helper: Get operating profit from API (includes all expenses)
// operating_profit = gross_profit - total_expenses (logistics, storage, commission, acquiring, etc.)
// See: docs/request-backend/63-operating-profit-formula-clarification.md
export function getSkuProfit(item: MarginAnalyticsSku): number | null {
  if (item.missing_cogs_flag || item.cogs === undefined) return null
  if (item.operating_profit !== undefined && item.operating_profit !== null) {
    return item.operating_profit
  }
  return null
}

/** Sort comparator for SKU margin data */
export function compareSkuItems(
  a: MarginAnalyticsSku,
  b: MarginAnalyticsSku,
  field: SortField,
  order: SortOrder
): number {
  let aValue: number | string = 0
  let bValue: number | string = 0

  switch (field) {
    case 'margin_pct': {
      const aProfit = getSkuProfit(a)
      const bProfit = getSkuProfit(b)
      const aM =
        aProfit !== null && a.revenue_net !== 0 ? (aProfit / Math.abs(a.revenue_net)) * 100 : null
      const bM =
        bProfit !== null && b.revenue_net !== 0 ? (bProfit / Math.abs(b.revenue_net)) * 100 : null
      if (aM === null) return 1
      if (bM === null) return -1
      aValue = aM
      bValue = bM
      break
    }
    case 'revenue_net':
      aValue = a.revenue_net
      bValue = b.revenue_net
      break
    case 'profit': {
      const aP = getSkuProfit(a)
      const bP = getSkuProfit(b)
      if (aP === null) return 1
      if (bP === null) return -1
      aValue = aP
      bValue = bP
      break
    }
    case 'qty':
      aValue = a.qty
      bValue = b.qty
      break
    case 'sa_name':
      aValue = a.sa_name.toLowerCase()
      bValue = b.sa_name.toLowerCase()
      break
    case 'roi': {
      const aP = getSkuProfit(a)
      const bP = getSkuProfit(b)
      const aR = aP !== null && a.cogs && a.cogs > 0 ? (aP / a.cogs) * 100 : null
      const bR = bP !== null && b.cogs && b.cogs > 0 ? (bP / b.cogs) * 100 : null
      if (aR === null) return 1
      if (bR === null) return -1
      aValue = aR
      bValue = bR
      break
    }
    case 'profit_per_unit': {
      const aP = getSkuProfit(a)
      const bP = getSkuProfit(b)
      const aPpu = aP !== null && a.qty > 0 ? aP / a.qty : null
      const bPpu = bP !== null && b.qty > 0 ? bP / b.qty : null
      if (aPpu === null) return 1
      if (bPpu === null) return -1
      aValue = aPpu
      bValue = bPpu
      break
    }
    default:
      return 0
  }

  if (aValue < bValue) return order === 'asc' ? -1 : 1
  if (aValue > bValue) return order === 'asc' ? 1 : -1
  return 0
}
