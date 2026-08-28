/**
 * OrdersEmptyState Component
 * Story 40.3-FE: Orders List Page
 * Epic 40-FE: Orders UI & WB Native Status History
 *
 * Empty state display when no orders match filters.
 * Reference: docs/stories/epic-40/story-40.3-fe-orders-list-page.md#AC9
 */

import { Package } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
      <div className="rounded-full bg-muted p-4 mb-4">
        <Package className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Нет заказов</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        {hasFilters
          ? 'Нет заказов за выбранный период или с указанными фильтрами'
          : 'Заказы FBS появятся здесь после синхронизации с Wildberries'}
      </p>
      {hasFilters && onClearFilters && (
        // Story 172.14-FE: raw button → ui Button (link); h-auto/px-0 strip the
        // h-9/px-4 defaults; hover stays color-shift (no underline) as before
        <Button
          type="button"
          variant="link"
          onClick={onClearFilters}
          className="h-auto px-0 py-0 text-sm font-medium hover:no-underline hover:text-primary/80"
        >
          Сбросить фильтры
        </Button>
      )}
    </div>
  )
}
