'use client'

/**
 * SkuAccuracyTable — sortable 6-column table of per-SKU accuracy entries.
 * Story 110.3-FE Task 4: mirrors EvaluationsTable aria-sort pattern (Story 110.2-FE F-6).
 * Pure helpers extracted to sku-accuracy-helpers.ts per pure-function discipline.
 * AP#8: null MAPE/percentage fields render '—'; evaluationCount is semantic-zero OK.
 * Migrated Story 171.8-FE: caption naming the model (RTC — modelId is the opaque route
 * identity here, AP#10 String form), tabular-nums on numeric cells (nmId exempt).
 */

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/fbs-analytics-formatters'
import { buildModelSkuAccuracyRoute } from '@/lib/routes'
import { sortSkuAccuracyEntries, formatSkuMapeDisplay } from './sku-accuracy-helpers'
import type { SkuSortColumn, SkuSortDirection } from './sku-accuracy-helpers'
import type { SkuAccuracyEntry } from '@/types/ai/evaluations'

interface SkuAccuracyTableProps {
  entries: SkuAccuracyEntry[]
  modelId: string
  sortCol: SkuSortColumn
  sortDir: SkuSortDirection
  onSortClick: (col: SkuSortColumn) => void
}

function SortableHead({
  col,
  label,
  sortCol,
  sortDir,
  onSortClick,
}: {
  col: SkuSortColumn
  label: string
  sortCol: SkuSortColumn
  sortDir: SkuSortDirection
  onSortClick: (col: SkuSortColumn) => void
}) {
  const isActive = sortCol === col
  const ariaSort = isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'
  return (
    <TableHead aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSortClick(col)}
        aria-label={`Сортировать по ${label}`}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {isActive && (sortDir === 'asc' ? ' ↑' : ' ↓')}
      </button>
    </TableHead>
  )
}

export function SkuAccuracyTable({
  entries,
  modelId,
  sortCol,
  sortDir,
  onSortClick,
}: SkuAccuracyTableProps) {
  const router = useRouter()
  const sorted = sortSkuAccuracyEntries(entries, sortCol, sortDir)

  function handleRowClick(nmId: number) {
    router.push(`${buildModelSkuAccuracyRoute(modelId)}?nmId=${nmId}`)
  }

  return (
    <Table>
      {/* Story 171.8: caption names the model (RTC; modelId is the route identity);
          spec-order above header (169.7 canon), visually bottom via ui caption-bottom. */}
      <TableCaption>Точность по SKU — модель {String(modelId)}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Артикул (nmId)</TableHead>
          <TableHead>Vendor code</TableHead>
          <SortableHead
            col="avgAiMape"
            label="AI MAPE"
            sortCol={sortCol}
            sortDir={sortDir}
            onSortClick={onSortClick}
          />
          <SortableHead
            col="avgNaiveMape"
            label="Naive MAPE"
            sortCol={sortCol}
            sortDir={sortDir}
            onSortClick={onSortClick}
          />
          <SortableHead
            col="aiAccuracyPercent"
            label="AI accuracy %"
            sortCol={sortCol}
            sortDir={sortDir}
            onSortClick={onSortClick}
          />
          <TableHead>Кол-во оценок</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map(entry => {
          // Null-nmId entries are filtered at the normalizer boundary; this guard narrows the type.
          if (entry.nmId === null) return null
          const nmId = entry.nmId
          return (
            <TableRow
              key={nmId}
              onClick={() => handleRowClick(nmId)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 font-normal"
                  aria-label={`Перейти к детализации по артикулу ${nmId}`}
                  onClick={event => {
                    event.stopPropagation()
                    handleRowClick(nmId)
                  }}
                >
                  {String(nmId)}
                </Button>
              </TableCell>
              <TableCell>{entry.vendorCode ?? '—'}</TableCell>
              <TableCell className="tabular-nums">
                {formatSkuMapeDisplay(entry.avgAiMape)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatSkuMapeDisplay(entry.avgNaiveMape)}
              </TableCell>
              <TableCell className="tabular-nums">
                {formatSkuMapeDisplay(entry.aiAccuracyPercent)}
              </TableCell>
              <TableCell className="tabular-nums">{formatNumber(entry.evaluationCount)}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
