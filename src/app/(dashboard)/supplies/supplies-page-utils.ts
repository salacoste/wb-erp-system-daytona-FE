/**
 * Utility functions and constants for the Supplies List Page
 * Extracted from page.tsx for file size compliance (Epic 74)
 *
 * Pure functions — no React hooks or client-side state.
 */

import { format, subDays } from 'date-fns'
import type { SuppliesSortField, SortOrder, SupplyListItem } from '@/types/supplies'

export const PAGE_SIZE = 20
export const DEFAULT_SORT: SuppliesSortField = 'created_at'
export const DEFAULT_ORDER: SortOrder = 'desc'

/** Get default date range (last 30 days) */
export function getDefaultDateRange() {
  return {
    to: format(new Date(), 'yyyy-MM-dd'),
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  }
}

/** Client-side sort for supplies (backend does not support sort params) */
export function sortSupplies(
  items: SupplyListItem[],
  sortBy: SuppliesSortField,
  sortOrder: SortOrder
): SupplyListItem[] {
  return [...items].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'created_at') cmp = a.createdAt.localeCompare(b.createdAt)
    else if (sortBy === 'closed_at') cmp = (a.closedAt ?? '').localeCompare(b.closedAt ?? '')
    else if (sortBy === 'orders_count') cmp = a.ordersCount - b.ordersCount
    return sortOrder === 'asc' ? cmp : -cmp
  })
}
