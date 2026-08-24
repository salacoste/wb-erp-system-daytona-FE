/**
 * Utility functions and types for StorageBySkuTable
 * Extracted from StorageBySkuTable.tsx for file size compliance (Epic 74)
 * Story 24.3-FE: Storage by SKU Table
 */

import type { StorageBySkuItem } from '@/types/storage-analytics'
// Story 169.12 dedupe: formatCurrency single-sourced in storage-format.
export { formatCurrency } from './storage-format'

// ============================================================================
// Types
// ============================================================================

export type SortField =
  'storage_cost_total' | 'storage_cost_avg_daily' | 'volume_avg' | 'days_stored'
export type SortOrder = 'asc' | 'desc'

export interface StorageBySkuTableProps {
  data: StorageBySkuItem[]
  isLoading?: boolean
  onProductClick?: (nmId: string) => void
  onSortChange?: (field: SortField, order: SortOrder) => void
  onSearch?: (query: string) => void
}

// ============================================================================
// Constants
// ============================================================================

/** Debounce delay for search input (ms) */
export const SEARCH_DEBOUNCE_MS = 300

/** Number of skeleton header columns */
export const SKELETON_COLUMNS = 8

/** Number of skeleton body rows */
export const SKELETON_ROWS = 5

// ============================================================================
// Formatters
// ============================================================================

// formatCurrency: see the re-export from ./storage-format above (Story 169.12
// dedupe — null = unknown cost → "—", AP#8: money, never 0).

/** Format volume in liters with 1 decimal, or dash for null */
export function formatVolume(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)} л`
}

// ============================================================================
// Search
// ============================================================================

/**
 * Create case-insensitive regex for filtering (like SQL LIKE %query%)
 * Returns null for empty queries and treats regex metacharacters literally.
 */
export function createSearchRegex(query: string): RegExp | null {
  if (!query.trim()) return null
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(escaped, 'i')
}

// ============================================================================
// Filter & Sort
// ============================================================================

/**
 * Filter data by search query across vendor_code, nm_id, product_name, brand
 * and sort by the specified field and order.
 */
export function filterAndSortData(
  data: StorageBySkuItem[],
  debouncedQuery: string,
  sortField: SortField,
  sortOrder: SortOrder
): StorageBySkuItem[] {
  if (!data || data.length === 0) return data

  let result = [...data]

  // Apply search filter with regex (like SQL LIKE %query%)
  const regex = createSearchRegex(debouncedQuery)
  if (regex) {
    result = result.filter(item => {
      const searchableText = [item.vendor_code, item.nm_id, item.product_name, item.brand]
        .filter(Boolean)
        .join(' ')
      return regex.test(searchableText)
    })
  }

  // Apply sorting
  result.sort((a, b) => {
    const aValue = a[sortField] ?? 0
    const bValue = b[sortField] ?? 0
    if (sortOrder === 'asc') {
      return aValue - bValue
    }
    return bValue - aValue
  })

  return result
}
