'use client'

/**
 * FR-7 (#221): single row for VariantTable.
 * Extracted from VariantTable for file-size compliance (≤200 lines).
 */
import { TableCell, TableRow } from '@/components/ui/table'
import { Loader2 } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import type { VariantAnalyticsItem } from '@/types/variant-analytics'
import { AllocatedMarker } from './AllocatedMarker'

interface Props {
  item: VariantAnalyticsItem
}

/**
 * Вариант label: «Синий · 42». WB sends tech_size "0" for one-size/sizeless variants —
 * render it as «· один размер» (humanized, NOT suppressed) so two same-color variants
 * don't collide (e.g. «Синий · 42» vs «Синий · один размер»). null color → «chrt {id}».
 */
export function variantLabel(item: VariantAnalyticsItem): string {
  if (!item.color_name) return `chrt ${item.chrt_id}`
  const raw = item.tech_size
  if (!raw) return item.color_name
  const size = raw === '0' ? 'один размер' : raw
  return `${item.color_name} · ${size}`
}

export function VariantTableRow({ item }: Props) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-1.5 font-medium">
          <span>{variantLabel(item)}</span>
          {item.metadata_pending && (
            <Loader2
              className="h-3.5 w-3.5 animate-spin text-muted-foreground/70"
              aria-label="Метаданные варианта загружаются"
            />
          )}
        </div>
      </TableCell>
      {/* nm_id raw — anti-pattern #10: never formatNumber opaque IDs */}
      <TableCell className="text-right text-muted-foreground">{String(item.nm_id)}</TableCell>
      <TableCell className="text-right font-medium">{formatCurrency(item.revenue_net)}</TableCell>
      <TableCell className="text-right">{item.total_units}</TableCell>
      <TableCell className="text-right">
        {item.profit_allocated_rub == null ? (
          <span className="text-xs text-muted-foreground/70">—</span>
        ) : (
          <span className="inline-flex items-center">
            <span
              className={cn(
                'font-medium',
                item.profit_allocated_rub >= 0
                  ? 'text-financial-positive'
                  : 'text-financial-negative'
              )}
            >
              {item.profit_allocated_rub > 0 ? '+' : ''}
              {formatCurrency(item.profit_allocated_rub)}
            </span>
            <AllocatedMarker />
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {item.margin_allocated_pct == null ? (
          <span className="text-xs text-muted-foreground/70">—</span>
        ) : (
          <span className="inline-flex items-center">
            <span
              className={cn(
                'font-medium',
                item.margin_allocated_pct >= 0
                  ? 'text-financial-positive'
                  : 'text-financial-negative'
              )}
            >
              {formatPercentage(item.margin_allocated_pct)}
            </span>
            <AllocatedMarker />
          </span>
        )}
      </TableCell>
    </TableRow>
  )
}
