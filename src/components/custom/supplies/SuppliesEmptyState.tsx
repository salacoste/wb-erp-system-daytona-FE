/**
 * SuppliesEmptyState Component
 * Story 53.2-FE: Supplies List Page
 * Epic 53-FE: Supply Management UI
 *
 * Empty state display for supplies table.
 * Reference: docs/stories/epic-53/story-53.2-fe-supplies-list-page.md#AC9
 */

'use client'

import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface SuppliesEmptyStateProps {
  /** Whether filters are active */
  hasFilters?: boolean
  /** Clear filters callback */
  onClearFilters?: () => void
  /** Create supply callback */
  onCreateClick?: () => void
}

/**
 * SuppliesEmptyState - Empty state for supplies list
 */
export function SuppliesEmptyState({
  hasFilters,
  onClearFilters,
  onCreateClick,
}: SuppliesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {hasFilters ? 'Нет поставок за выбранный период' : 'Нет поставок'}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {hasFilters
            ? 'Попробуйте изменить фильтры или период поиска'
            : 'Создайте первую поставку, чтобы начать управление заказами FBS'}
        </p>

        <div className="flex gap-2">
          {hasFilters && onClearFilters && (
            <Button variant="outline" onClick={onClearFilters}>
              Сбросить фильтры
            </Button>
          )}
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Создать поставку
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SuppliesEmptyState
