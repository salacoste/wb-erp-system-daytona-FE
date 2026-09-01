/**
 * Top Brands Table Row
 * Story 6.4-FE / Story 74.6: Extracted from TopBrandsTable.tsx
 *
 * Single brand row with click-to-navigate, keyboard support, and value formatting.
 */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TopBrandItem } from '@/types/analytics'
import { formatCurrency, formatPercent, getMarginColor } from '../top-table-utils'

interface TopBrandsTableRowProps {
  brand: TopBrandItem
  index: number
  onBrandClick: (brand: string) => void
}

/**
 * Renders a single brand row with formatting, color coding, and navigation
 */
export function TopBrandsTableRow({ brand, index, onBrandClick }: TopBrandsTableRowProps) {
  const brandLabel = brand.brand || 'Без бренда'

  return (
    <TableRow
      key={brand.brand}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onBrandClick(brand.brand)}
    >
      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
      <TableCell>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 font-medium"
          aria-label={`Фильтровать по бренду ${brandLabel}`}
          onClick={event => {
            event.stopPropagation()
            onBrandClick(brand.brand)
          }}
        >
          {brandLabel}
        </Button>
      </TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(brand.revenue_net)}</TableCell>
      <TableCell
        className={cn(
          'text-right font-medium',
          brand.profit !== null && brand.profit >= 0
            ? 'text-financial-positive'
            : 'text-financial-negative'
        )}
      >
        {brand.profit !== null ? formatCurrency(brand.profit) : '\u2014'}
      </TableCell>
      <TableCell className={cn('text-right font-medium', getMarginColor(brand.margin_pct))}>
        {formatPercent(brand.margin_pct)}
      </TableCell>
    </TableRow>
  )
}
