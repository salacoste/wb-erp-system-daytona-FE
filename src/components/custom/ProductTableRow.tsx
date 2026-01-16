'use client'

import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatCogs } from '@/hooks/useSingleCogsAssignment'
import type { ProductListItem } from '@/types/api'
import type { ColumnWidths } from '@/hooks/useColumnWidths'
import { ProductMarginCell } from './ProductMarginCell'

export interface ProductTableRowProps {
  product: ProductListItem
  isSelected: boolean
  enableSelection: boolean
  enableMarginDisplay: boolean
  isPolling: boolean
  shouldShowRetryButton: (nmId: string) => boolean
  getAffectedWeeks: (nmId: string) => string[]
  triggerRecalculation: (params: { weeks: string[]; nm_ids: string[] }) => void
  isRecalculating: boolean
  onProductClick: (product: ProductListItem) => void
  columnWidths?: ColumnWidths
}

/**
 * Single product row in ProductList table
 * Extracted from ProductList.tsx for better maintainability
 * Enhanced: Supports resizable column widths
 */
export function ProductTableRow({
  product,
  isSelected,
  enableSelection,
  enableMarginDisplay,
  isPolling,
  shouldShowRetryButton,
  getAffectedWeeks,
  triggerRecalculation,
  isRecalculating,
  onProductClick,
  columnWidths,
}: ProductTableRowProps): React.ReactElement {
  // Helper to get cell style with width
  const getCellStyle = (key: string) =>
    columnWidths ? { width: `${columnWidths[key]}px`, minWidth: `${columnWidths[key]}px` } : undefined

  return (
    <TableRow
      className={`${enableSelection ? 'cursor-pointer hover:bg-gray-50' : ''} ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
      onClick={() => onProductClick(product)}
    >
      <TableCell className="font-mono text-sm truncate" style={getCellStyle('article')}>
        <div className="flex items-center gap-1.5">
          <span>{product.nm_id}</span>
          {product.is_orphan && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                    отчёт
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">Товар из финансовых отчётов, отсутствует в каталоге WB</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm truncate text-gray-600" style={getCellStyle('vendor_code')}>
        {product.vendor_code || '—'}
      </TableCell>
      <TableCell style={getCellStyle('name')}>
        <div className="truncate">
          <div className="font-medium text-gray-900 truncate">{product.sa_name}</div>
          {product.brand && <div className="text-xs text-gray-500 truncate">{product.brand}</div>}
        </div>
      </TableCell>
      <TableCell style={getCellStyle('cogs')}>
        {product.has_cogs && product.cogs ? (
          <div>
            <div className="font-medium">{formatCogs(product.cogs.unit_cost_rub)}</div>
            {product.cogs.valid_from && (
              <div className="text-xs text-gray-500">
                с {new Date(product.cogs.valid_from).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell style={getCellStyle('margin')}>
        <ProductMarginCell
          product={product}
          enableMarginDisplay={enableMarginDisplay}
          isPolling={isPolling}
          shouldShowRetryButton={shouldShowRetryButton}
          getAffectedWeeks={getAffectedWeeks}
          triggerRecalculation={triggerRecalculation}
          isRecalculating={isRecalculating}
        />
      </TableCell>
      {enableSelection && (
        <TableCell style={getCellStyle('actions')}>
          <Button
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={(e) => { e.stopPropagation(); onProductClick(product) }}
          >
            {isSelected ? 'Выбрано' : 'Выбрать'}
          </Button>
        </TableCell>
      )}
    </TableRow>
  )
}

export default ProductTableRow
