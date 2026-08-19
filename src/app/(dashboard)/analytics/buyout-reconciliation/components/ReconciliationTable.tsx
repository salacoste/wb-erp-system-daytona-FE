'use client'

/**
 * ReconciliationTable — per-SKU table with 3 anomaly columns
 * Epic 96-FE Story 96.14: renders ReconciliationItem[] with AnomalyIndicator on anomalous cells.
 * Story 96.15-FE: SourceCell refactored to use shared SourceBadge for known source values.
 *
 * Columns: Артикул WB | Товар | Выкупов | Возвратов | Возвраты без выкупа | Сиротские выкупы |
 *          Расхождение количества | Источник
 *
 * Backend resolved in Epic 106 (request #169 § 1.3); guard kept for defense-in-depth.
 * Per CLAUDE.md Defensive Frontend Principle: raw counts preserved; AlertTriangle on count > 0.
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
import { AnomalyIndicator } from './AnomalyIndicator'
import { SourceBadge } from '@/components/custom/badges/SourceBadge'
import type { ReconciliationItem } from '@/types/buyout-reconciliation'
import type { BuyoutSource } from '@/types/analytics-buyout'

interface ReconciliationTableProps {
  items: ReconciliationItem[]
  /**
   * Epic 169.5 RTC: pre-formatted period label for the caption (ru-RU "DD.MM.YYYY — DD.MM.YYYY"
   * or "за всё время" when no range). Caption must always name the period — never blank.
   */
  periodLabel?: string
}

/**
 * Renders the source cell.
 * M2-1 fix: param tightened to `ReconciliationSource` (= BuyoutSource) — TypeScript exhaustiveness
 * now enforced. Dead fallback branch removed: VALID_BUYOUT_SOURCES set was always true since
 * ReconciliationItem.source is typed BuyoutSource (all 5 variants covered by SourceBadge).
 * SourceBadge handles every BuyoutSource variant including 'unknown' with AlertTriangle.
 * Backend resolved in Epic 106 (request #169 § 1.3); guard kept for defense-in-depth (CLAUDE.md § Defensive Frontend Principle).
 */
function ReconciliationSourceCell({ source }: { source: BuyoutSource }) {
  return <SourceBadge source={source} />
}

export function ReconciliationTable({ items, periodLabel }: ReconciliationTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto" data-testid="reconciliation-table">
      <Table>
        {/* Epic 169.5 RTC: caption names the table + period (169.1/169.4 TableCaption precedent) */}
        {/* MAIN-verify fix: phrase arrives complete from PageContent; fallback is direct-render safety only */}
        <TableCaption>Реконсиляция выкупов {periodLabel ?? 'за всё время'}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Артикул WB</TableHead>
            <TableHead>Товар</TableHead>
            <TableHead className="text-right">Выкупов</TableHead>
            <TableHead className="text-right">Возвратов</TableHead>
            <TableHead className="text-right">Возвраты без выкупа</TableHead>
            <TableHead className="text-right">Сиротские выкупы</TableHead>
            {/* M-4 fix: full form "Расхождение количества" matches spec AC-3 (was abbreviated "кол-ва") */}
            <TableHead className="text-right">Расхождение количества</TableHead>
            <TableHead>Источник</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.nmId}>
              <TableCell className="text-right font-mono text-sm">{item.nmId}</TableCell>
              <TableCell className="min-w-[160px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.productName || '—'}</span>
                  {item.brand && (
                    <span className="text-xs text-muted-foreground">{item.brand}</span>
                  )}
                </div>
              </TableCell>
              {/* Epic 169.5 RTC: tabular-nums on numeric value cells (counts = compared values).
                  nmId stays font-mono only — it is an ID, not a compared number. */}
              <TableCell className="text-right text-sm tabular-nums">
                {item.buyoutQuantity}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {item.returnQuantity}
              </TableCell>
              {/* Anomaly columns — AnomalyIndicator shows AlertTriangle when count > 0 */}
              <TableCell className="text-right text-sm tabular-nums">
                <AnomalyIndicator count={item.returnWithoutBuyout} type="return_without_buyout" />
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <AnomalyIndicator count={item.orphanBuyout} type="orphan_buyout" />
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <AnomalyIndicator
                  count={item.returnQuantityMismatch}
                  type="return_quantity_mismatch"
                />
              </TableCell>
              <TableCell className="text-sm">
                {/* Story 96.15-FE: ReconciliationSourceCell delegates known sources to SourceBadge */}
                <ReconciliationSourceCell source={item.source} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
