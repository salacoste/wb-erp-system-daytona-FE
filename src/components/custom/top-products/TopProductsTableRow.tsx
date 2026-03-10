/**
 * Top Products Table Row
 * Story 6.4-FE / Story 74.6: Extracted from TopProductsTable.tsx
 *
 * Single product row with click-to-navigate, keyboard support, and value formatting.
 */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { TopProductItem } from '@/types/analytics'
import { formatCurrency, formatPercent, getMarginColor } from '../top-table-utils'

interface TopProductsTableRowProps {
  product: TopProductItem
  index: number
  onProductClick: (nmId: string) => void
}

/**
 * Renders a single product row with formatting, color coding, and navigation
 */
export function TopProductsTableRow({ product, index, onProductClick }: TopProductsTableRowProps) {
  return (
    <TableRow
      key={product.nm_id}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onProductClick(product.nm_id)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onProductClick(product.nm_id)
        }
      }}
      aria-label={`Перейти к товару ${product.sa_name}`}
    >
      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[200px]">
            {product.sa_name || `Артикул ${product.nm_id}`}
          </span>
          <span className="text-xs text-muted-foreground">{product.nm_id}</span>
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(product.revenue_net)}
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-medium',
          product.profit !== null && product.profit >= 0 ? 'text-green-600' : 'text-red-600'
        )}
      >
        {product.profit !== null ? formatCurrency(product.profit) : '\u2014'}
      </TableCell>
      <TableCell className={cn('text-right font-medium', getMarginColor(product.margin_pct))}>
        {formatPercent(product.margin_pct)}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {formatPercent(product.contribution_pct)}
      </TableCell>
    </TableRow>
  )
}
