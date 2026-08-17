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
import { formatCurrency, formatPercent } from '../top-table-utils'

// 168.3: semantic margin tone — 4-tier mapping preserved from the original
// shared top-table-utils.getMarginColor (thresholds unchanged):
//   null → muted; >=30 → positive; >=15 → warning; >=0 → warning/80 (weaker
//   intensity, same hue family); <0 → negative. 4 distinct visual states, zero
// new tokens. The shared fn is legacy-palette AND shared with the dashboard
// cards (172.1 surface) — local semantic mapping here instead.
// TODO(172.1): shared top-table-utils.getMarginColor still legacy — migrate + dedupe these local copies when 172.1 owns them.
function getMarginColor(margin: number | null): string {
  if (margin === null) return 'text-muted-foreground'
  if (margin >= 30) return 'text-financial-positive'
  if (margin >= 15) return 'text-status-warning'
  if (margin >= 0) return 'text-status-warning/80'
  return 'text-financial-negative'
}

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
      className="cursor-pointer hover:bg-muted/50 transition-colors"
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
