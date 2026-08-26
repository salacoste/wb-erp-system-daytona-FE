'use client'

/**
 * EvaluationHistoryTable — MAPE evaluation rows table (AC-7).
 * Extracted from ModelPerformanceDetail.tsx for file-size compliance (205 → ~150 lines).
 * Migrated Story 171.9-FE: caption names the model (RTC, optional prop; spec-order above
 * header per 169.7 canon), tabular-nums on numeric cells.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatPercentage } from '@/lib/utils'
import type { MapeTrendEntry } from '@/types/ai/models'
import { sortMapeTrendDesc } from './model-performance-helpers'

interface EvaluationHistoryTableProps {
  mapeTrend: MapeTrendEntry[]
  /** Optional — table caption naming the model (RTC contract, Story 171.9-FE) */
  captionText?: string
}

export function EvaluationHistoryTable({ mapeTrend, captionText }: EvaluationHistoryTableProps) {
  if (mapeTrend.length === 0) return null

  const sortedEntries = sortMapeTrendDesc(mapeTrend)

  return (
    <Card>
      <CardHeader>
        <CardTitle>История оценок</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          {/* Story 171.9: caption names the model (RTC); spec-order above header (169.7 canon),
              visually bottom via ui Table caption-bottom. Empty string renders nothing. */}
          {captionText ? <TableCaption>{captionText}</TableCaption> : null}
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>MAPE</TableHead>
              <TableHead>SKU</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map(entry => (
              <TableRow key={entry.evaluationDate}>
                <TableCell>{formatDate(entry.evaluationDate)}</TableCell>
                <TableCell className="tabular-nums">
                  {entry.cabinetMape != null ? formatPercentage(entry.cabinetMape) : '—'}
                </TableCell>
                <TableCell className="tabular-nums">{entry.skuCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
