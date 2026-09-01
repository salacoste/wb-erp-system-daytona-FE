'use client'

/**
 * Pricing table with color-coded gap cells
 * Epic 121 Phase 1: Per-SKU price recommendation engine
 */

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { PriceBasisBadge } from '@/components/custom/PriceBasisBadge'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import type { PriceRecommendation } from '@/types/price-recommendations'

interface PricingTableProps {
  items: PriceRecommendation[]
  isLoading: boolean
  onRowClick?: (nmId: number) => void
}

/** SPP-1.7-FE: current price + basis chip + optional seller companion price. */
function CurrentPriceCell({ item }: { item: PriceRecommendation }) {
  return (
    <span className="inline-flex flex-col items-end">
      <span className="inline-flex items-center justify-end">
        {item.lastPrice !== null ? formatCurrency(item.lastPrice) : '—'}
        <span className="ml-1">
          <PriceBasisBadge basis={item.priceBasis} flags={item.validationFlags} />
        </span>
      </span>
      {item.alternativeBasisPrice !== null && (
        <span
          className="text-xs text-muted-foreground"
          title="Цена продавца (альтернативный базис)"
        >
          продав: {formatCurrency(item.alternativeBasisPrice)}
        </span>
      )}
    </span>
  )
}

/** Color-coded gap cell: green=above target, red=below, neutral=exact */
function GapCell({ gap, gapPct }: { gap: number | null; gapPct: number | null }) {
  if (gap === null) {
    return <span className="text-muted-foreground">—</span>
  }
  const isAbove = gap >= 0
  // 168.6: semantic financial tokens instead of legacy green/red-600
  const cls = isAbove ? 'text-financial-positive' : 'text-financial-negative'
  const sign = isAbove ? '+' : ''
  return (
    <span className={`font-medium ${cls}`}>
      {sign}
      {formatCurrency(gap)}
      {gapPct !== null && (
        <span className="text-xs ml-1">
          ({sign}
          {formatPercentage(gapPct)})
        </span>
      )}
    </span>
  )
}

function MarginCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  // Story 174.3: preserve the 15/0 threshold semantics without relying on a low-contrast
  // warning foreground for the intermediate value range.
  const cls =
    value >= 15
      ? 'text-financial-positive'
      : value >= 0
        ? 'text-foreground'
        : 'text-financial-negative'
  return <span className={cls}>{formatPercentage(value)}</span>
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function PricingTable({ items, isLoading, onRowClick }: PricingTableProps) {
  if (isLoading) return <TableSkeleton />

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Нет рекомендаций по ценам. Нажмите «Обновить» для пересчёта.
      </div>
    )
  }

  return (
    <Table scrollContainerTabIndex={0} scrollContainerAriaLabel="Рекомендации по ценам">
      <TableCaption className="sr-only">Рекомендации по ценам</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Артикул</TableHead>
          <TableHead>Товар</TableHead>
          <TableHead className="text-right">Текущая цена</TableHead>
          <TableHead className="text-right">Безубыточность</TableHead>
          <TableHead className="text-right">Рекомендация</TableHead>
          <TableHead className="text-right">Разрыв</TableHead>
          <TableHead className="text-right">Маржа (текущ.)</TableHead>
          <TableHead className="text-right">Маржа (рек.)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow
            key={item.id}
            className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
            onClick={() => onRowClick?.(item.nmId)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            aria-label={onRowClick ? `Открыть рекомендации для SKU ${item.nmId}` : undefined}
            onKeyDown={event => {
              if (onRowClick && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                onRowClick(item.nmId)
              }
            }}
          >
            <TableCell className="font-mono text-sm">
              {item.vendorCode ?? String(item.nmId)}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{item.productName ?? '—'}</TableCell>
            <TableCell className="text-right">
              <CurrentPriceCell item={item} />
            </TableCell>
            <TableCell className="text-right">
              {item.breakEvenPrice == null ? '—' : formatCurrency(item.breakEvenPrice)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {item.recommendedPrice == null ? '—' : formatCurrency(item.recommendedPrice)}
            </TableCell>
            <TableCell className="text-right">
              <GapCell gap={item.gap} gapPct={item.gapPct} />
            </TableCell>
            <TableCell className="text-right">
              <MarginCell value={item.marginAtCurrentPct} />
            </TableCell>
            <TableCell className="text-right">
              <MarginCell value={item.marginAtRecommendedPct} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
