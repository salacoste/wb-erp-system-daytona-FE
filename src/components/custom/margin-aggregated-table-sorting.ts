/**
 * Shared sorting logic for MarginByBrandTable and MarginByCategoryTable
 * Both use MarginAnalyticsAggregated type with identical sort behavior
 * Extracted: Epic 74, Story 74.6
 */
import type { MarginAnalyticsAggregated } from '@/types/api'
import { calculateROI, calculateProfitPerUnit } from '@/lib/analytics-utils'

export type AggregatedSortField =
  | 'margin_pct'
  | 'revenue_net'
  | 'entity'
  | 'profit'
  | 'qty'
  | 'roi'
  | 'profit_per_unit'
  | 'operating_profit'
export type SortOrder = 'asc' | 'desc'

/** Sort comparator for aggregated margin data (brand or category) */
export function compareAggregatedItems(
  a: MarginAnalyticsAggregated,
  b: MarginAnalyticsAggregated,
  field: AggregatedSortField,
  order: SortOrder,
  entityField: 'brand' | 'category'
): number {
  let aValue: number | string = 0
  let bValue: number | string = 0

  switch (field) {
    case 'margin_pct':
      if (a.margin_pct === undefined || a.margin_pct === null) return 1
      if (b.margin_pct === undefined || b.margin_pct === null) return -1
      aValue = a.margin_pct
      bValue = b.margin_pct
      break
    case 'revenue_net':
      aValue = a.revenue_net
      bValue = b.revenue_net
      break
    case 'profit':
      if (a.profit === undefined || a.profit === null) return 1
      if (b.profit === undefined || b.profit === null) return -1
      aValue = a.profit
      bValue = b.profit
      break
    case 'qty':
      aValue = a.total_skus ?? a.qty
      bValue = b.total_skus ?? b.qty
      break
    case 'entity':
      aValue = (a[entityField] || '').toLowerCase()
      bValue = (b[entityField] || '').toLowerCase()
      break
    case 'roi': {
      const aR = a.roi ?? calculateROI(a.profit, a.cogs)
      const bR = b.roi ?? calculateROI(b.profit, b.cogs)
      if (aR === null) return 1
      if (bR === null) return -1
      aValue = aR
      bValue = bR
      break
    }
    case 'profit_per_unit': {
      const aP = a.profit_per_unit ?? calculateProfitPerUnit(a.profit, a.qty)
      const bP = b.profit_per_unit ?? calculateProfitPerUnit(b.profit, b.qty)
      if (aP === null) return 1
      if (bP === null) return -1
      aValue = aP
      bValue = bP
      break
    }
    case 'operating_profit':
      if (a.operating_profit === undefined || a.operating_profit === null) return 1
      if (b.operating_profit === undefined || b.operating_profit === null) return -1
      aValue = a.operating_profit
      bValue = b.operating_profit
      break
    default:
      return 0
  }

  if (aValue < bValue) return order === 'asc' ? -1 : 1
  if (aValue > bValue) return order === 'asc' ? 1 : -1
  return 0
}
