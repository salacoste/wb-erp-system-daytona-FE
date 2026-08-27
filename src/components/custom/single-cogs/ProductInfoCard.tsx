// ============================================================================
// Single COGS Product Info Card
// Epic 74-FE: Extracted from SingleCogsForm.tsx for file size compliance
// Contains: product info display with existing COGS details
// ============================================================================

import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import type { CogsRecord } from '@/types/cogs'

export interface ProductInfoCardProps {
  productName: string
  nmId: string
  existingCogs?: CogsRecord
}

/**
 * Product information card shown at the top of the COGS form
 * Displays product name, article number, and existing COGS if present
 */
export function ProductInfoCard({ productName, nmId, existingCogs }: ProductInfoCardProps) {
  return (
    <div className="rounded-lg bg-muted p-4">
      <div className="text-sm font-medium text-muted-foreground">Товар</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{productName}</div>
      <div className="text-sm text-muted-foreground">Артикул: {nmId}</div>

      {existingCogs && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-sm font-medium text-muted-foreground">Текущая себестоимость</div>
          <div className="mt-1 text-base font-semibold text-status-information">
            {formatCogs(parseFloat(existingCogs.unit_cost_rub))}
          </div>
          <div className="text-xs text-muted-foreground">
            с {new Date(existingCogs.valid_from).toLocaleDateString('ru-RU')}
          </div>
        </div>
      )}
    </div>
  )
}
