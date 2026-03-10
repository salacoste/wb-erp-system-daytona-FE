/**
 * Top Brands Table Row
 * Story 6.4-FE / Story 74.6: Extracted from TopBrandsTable.tsx
 *
 * Single brand row with click-to-navigate, keyboard support, and value formatting.
 */

'use client'

import { TableCell, TableRow } from '@/components/ui/table'
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
  return (
    <TableRow
      key={brand.brand}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onBrandClick(brand.brand)}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          onBrandClick(brand.brand)
        }
      }}
      aria-label={`Фильтровать по бренду ${brand.brand}`}
    >
      <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
      <TableCell className="font-medium">{brand.brand || 'Без бренда'}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(brand.revenue_net)}</TableCell>
      <TableCell
        className={cn(
          'text-right font-medium',
          brand.profit !== null && brand.profit >= 0 ? 'text-green-600' : 'text-red-600'
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
