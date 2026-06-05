'use client'

import { useState, useMemo } from 'react'
import type { SupplyPlanningItem, StockoutRisk } from '@/types/supply-planning'

export type SortField =
  | 'stockout_risk'
  | 'sku_id'
  | 'product_name'
  | 'current_stock'
  | 'in_transit'
  | 'avg_daily_sales'
  | 'days_until_stockout'
  | 'reorder_quantity'
  | 'reorder_value'
  | 'selling_price'

export type SortOrder = 'asc' | 'desc'

/**
 * Hook for search, sort, and filter logic in SupplyPlanningTable.
 * Extracted from SupplyPlanningTable.tsx — Story 6.3.
 */
export function useSupplyTableFilters(data: SupplyPlanningItem[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('days_until_stockout')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (field: SortField, resetPage: () => void) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    resetPage()
  }

  const handleClearSearch = (resetPage: () => void) => {
    setSearchQuery('')
    resetPage()
  }

  const processedData = useMemo(() => {
    let result = [...data]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        item =>
          item.sku_id.toLowerCase().includes(query) ||
          item.product_name.toLowerCase().includes(query)
      )
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'stockout_risk': {
          const riskOrder: Record<StockoutRisk, number> = {
            out_of_stock: 0,
            critical: 1,
            warning: 2,
            low: 3,
            healthy: 4,
          }
          comparison = riskOrder[a.stockout_risk] - riskOrder[b.stockout_risk]
          break
        }
        case 'sku_id':
          comparison = a.sku_id.localeCompare(b.sku_id)
          break
        case 'product_name':
          comparison = a.product_name.localeCompare(b.product_name)
          break
        case 'current_stock':
          comparison = a.current_stock - b.current_stock
          break
        case 'in_transit':
          comparison = a.in_transit - b.in_transit
          break
        case 'avg_daily_sales':
          comparison = a.avg_daily_sales - b.avg_daily_sales
          break
        case 'days_until_stockout': {
          const daysA = a.days_until_stockout ?? 9999
          const daysB = b.days_until_stockout ?? 9999
          comparison = daysA - daysB
          break
        }
        case 'reorder_quantity':
          comparison = a.reorder_quantity - b.reorder_quantity
          break
        case 'reorder_value':
          // reorder_value is undefined when COGS is unassigned — coalesce so the subtraction never
          // yields NaN (which scrambles the sort). Unknown values sort last (mirrors days_until_stockout above).
          comparison = (a.reorder_value ?? -Infinity) - (b.reorder_value ?? -Infinity)
          break
        case 'selling_price':
          // selling_price is null when no sales data — nulls sort last.
          comparison = (a.selling_price ?? -Infinity) - (b.selling_price ?? -Infinity)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [data, searchQuery, sortField, sortOrder])

  return {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    handleSort,
    handleClearSearch,
    processedData,
  }
}
