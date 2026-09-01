/**
 * Top Products Table Row
 * Story 6.4-FE / Story 74.6: Extracted from TopProductsTable.tsx
 *
 * Single product row with click-to-navigate, keyboard support, and value formatting.
 */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
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
  const productLabel = product.sa_name || `Артикул ${product.nm_id}`

  return (
    <TableRow
      key={product.nm_id}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onProductClick(product.nm_id)}
    >
      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <Button
          type="button"
          variant="link"
          className="h-auto max-w-full justify-start p-0 text-left font-normal"
          aria-label={`Перейти к товару ${productLabel}`}
          onClick={event => {
            event.stopPropagation()
            onProductClick(product.nm_id)
          }}
        >
          <span className="flex min-w-0 flex-col items-start">
            <span className="max-w-[200px] truncate font-medium">{productLabel}</span>
            <span className="text-xs text-muted-foreground">{product.nm_id}</span>
          </span>
        </Button>
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(product.revenue_net)}
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-medium',
          product.profit !== null && product.profit >= 0
            ? 'text-financial-positive'
            : 'text-financial-negative'
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
