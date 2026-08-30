'use client'

/**
 * OrderPickerFooter - Action buttons for OrderPickerDrawer
 * Story 53.5-FE: Order Picker Drawer
 * Epic 53-FE: Supply Management UI
 *
 * Extracted from OrderPickerDrawer.tsx for file-size compliance (Epic 74).
 */

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

// =============================================================================
// Types
// =============================================================================

export interface OrderPickerFooterProps {
  selectedCount: number
  isPending: boolean
  onClose: () => void
  onAddOrders: () => void
}

// =============================================================================
// Component
// =============================================================================

export function OrderPickerFooter({
  selectedCount,
  isPending,
  onClose,
  onAddOrders,
}: OrderPickerFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 border-t pt-4">
      <span className="sr-only" role="status" aria-live="polite">
        {isPending ? 'Выбранные заказы добавляются в поставку' : ''}
      </span>
      <Button variant="outline" onClick={onClose} disabled={isPending}>
        Закрыть
      </Button>
      <Button onClick={onAddOrders} disabled={selectedCount === 0 || isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Добавление...
          </>
        ) : (
          `Добавить выбранные (${selectedCount})`
        )}
      </Button>
    </div>
  )
}
