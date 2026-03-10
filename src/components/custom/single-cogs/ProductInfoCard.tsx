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
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="text-sm font-medium text-gray-600">Товар</div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{productName}</div>
      <div className="text-sm text-gray-500">Артикул: {nmId}</div>

      {existingCogs && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <div className="text-sm font-medium text-gray-600">Текущая себестоимость</div>
          <div className="mt-1 text-base font-semibold text-blue-600">
            {formatCogs(parseFloat(existingCogs.unit_cost_rub))}
          </div>
          <div className="text-xs text-gray-500">
            с {new Date(existingCogs.valid_from).toLocaleDateString('ru-RU')}
          </div>
        </div>
      )}
    </div>
  )
}
