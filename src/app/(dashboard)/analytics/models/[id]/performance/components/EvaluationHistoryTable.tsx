'use client'

/**
 * EvaluationHistoryTable — MAPE evaluation rows table (AC-7).
 * Extracted from ModelPerformanceDetail.tsx for file-size compliance (205 → ~150 lines).
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
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
}

export function EvaluationHistoryTable({ mapeTrend }: EvaluationHistoryTableProps) {
  if (mapeTrend.length === 0) return null

  const sortedEntries = sortMapeTrendDesc(mapeTrend)

  return (
    <Card>
      <CardHeader>
        <CardTitle>История оценок</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
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
                <TableCell>
                  {entry.cabinetMape != null ? formatPercentage(entry.cabinetMape) : '—'}
                </TableCell>
                <TableCell>{entry.skuCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
