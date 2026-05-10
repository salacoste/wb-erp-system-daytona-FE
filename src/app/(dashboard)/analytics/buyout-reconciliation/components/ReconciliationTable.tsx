'use client'

/**
 * ReconciliationTable — per-SKU table with 3 anomaly columns
 * Epic 96-FE Story 96.14: renders ReconciliationItem[] with AnomalyIndicator on anomalous cells.
 * Story 96.15-FE: SourceCell refactored to use shared SourceBadge for known source values.
 *
 * Columns: Артикул WB | Товар | Выкупов | Возвратов | Возвраты без выкупа | Сиротские выкупы |
 *          Расхождение количества | Источник
 *
 * PENDING BACKEND: request #169 § 1.3 — buyout reconciliation anomaly counts.
 * Per CLAUDE.md Defensive Frontend Principle: raw counts preserved; AlertTriangle on count > 0.
 */

import {
  Table,
  TableBody,
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
}

/**
 * Renders the source cell.
 * M2-1 fix: param tightened to `ReconciliationSource` (= BuyoutSource) — TypeScript exhaustiveness
 * now enforced. Dead fallback branch removed: VALID_BUYOUT_SOURCES set was always true since
 * ReconciliationItem.source is typed BuyoutSource (all 5 variants covered by SourceBadge).
 * SourceBadge handles every BuyoutSource variant including 'unknown' with AlertTriangle.
 * // PENDING BACKEND: request #169 § 1.3 — unknown source indicator (Defensive Frontend Principle)
 */
function ReconciliationSourceCell({ source }: { source: BuyoutSource }) {
  return <SourceBadge source={source} />
}

export function ReconciliationTable({ items }: ReconciliationTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto" data-testid="reconciliation-table">
      <Table>
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
              <TableCell className="text-right text-sm">{item.buyoutQuantity}</TableCell>
              <TableCell className="text-right text-sm">{item.returnQuantity}</TableCell>
              {/* Anomaly columns — AnomalyIndicator shows AlertTriangle when count > 0 */}
              <TableCell className="text-right text-sm">
                <AnomalyIndicator count={item.returnWithoutBuyout} type="return_without_buyout" />
              </TableCell>
              <TableCell className="text-right text-sm">
                <AnomalyIndicator count={item.orphanBuyout} type="orphan_buyout" />
              </TableCell>
              <TableCell className="text-right text-sm">
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
