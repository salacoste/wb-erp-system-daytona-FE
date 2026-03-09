/**
 * SKU Financials Table sorting logic
 * Extracted from SkuFinancialsTable.tsx — client-side sort comparator
 */

import type { SkuFinancialItem } from '@/types/sku-financials'

export type SortField =
  | 'productName'
  | 'salesQty'
  | 'revenueNet'
  | 'grossProfit'
  | 'operatingProfit'
  | 'operatingMarginPct'
  | 'storageCost'
  | 'logisticsCost'

export type SortOrder = 'asc' | 'desc'

/**
 * Get the sortable value from a SkuFinancialItem for the given field
 */
function getSortValue(item: SkuFinancialItem, field: SortField): number | string | null {
  switch (field) {
    case 'productName':
      return item.productName.toLowerCase()
    case 'salesQty':
      return item.quantity.salesQty
    case 'revenueNet':
      return item.revenue.net
    case 'grossProfit':
      return item.profit.gross
    case 'operatingProfit':
      return item.profit.operating
    case 'operatingMarginPct':
      return item.profit.operatingMarginPct
    case 'storageCost':
      return item.costs.storage
    case 'logisticsCost':
      return item.costs.logistics
    default:
      return item.profit.operating
  }
}

/**
 * Sort SkuFinancialItem[] by field and order (client-side)
 */
export function sortSkuData(
  data: SkuFinancialItem[],
  sortField: SortField,
  sortOrder: SortOrder
): SkuFinancialItem[] {
  return [...data].sort((a, b) => {
    const aValue = getSortValue(a, sortField)
    const bValue = getSortValue(b, sortField)

    if (aValue === null) return 1
    if (bValue === null) return -1
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
    return 0
  })
}
