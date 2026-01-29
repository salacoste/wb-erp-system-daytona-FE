/**
 * OrdersEmptyState Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Empty state display when no orders match filters.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC9
 */

import { Package } from 'lucide-react'

interface OrdersEmptyStateProps {
  /** Whether filters are currently active */
  hasFilters?: boolean
  /** Callback to clear filters */
  onClearFilters?: () => void
}

/**
 * OrdersEmptyState - Shows helpful message when no orders found
 */
export function OrdersEmptyState({ hasFilters, onClearFilters }: OrdersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Package className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Нет заказов</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">
        {hasFilters
          ? 'Нет заказов за выбранный период или с указанными фильтрами'
          : 'Заказы FBS появятся здесь после синхронизации с Wildberries'}
      </p>
      {hasFilters && onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  )
}
