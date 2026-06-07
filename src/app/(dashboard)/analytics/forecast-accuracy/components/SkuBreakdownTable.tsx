'use client'

/**
 * Per-SKU breakdown table — accuracy metrics per SKU (top-20).
 * Epic 123-FE Story 123.4
 */

import { formatPercentage } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SkuAccuracy } from '@/types/ai/forecast-accuracy'

interface SkuBreakdownTableProps {
  rows: SkuAccuracy[]
}

export function SkuBreakdownTable({ rows }: SkuBreakdownTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных по SKU</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>nmId</TableHead>
          <TableHead className="text-right">MAPE</TableHead>
          <TableHead className="text-right">MAE</TableHead>
          <TableHead className="text-right">Кол-во</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.slice(0, 20).map(row => (
          <TableRow key={row.nmId}>
            <TableCell className="font-medium font-mono">{String(row.nmId)}</TableCell>
            <TableCell className="text-right">
              {row.mape != null ? formatPercentage(row.mape) : '—'}
            </TableCell>
            <TableCell className="text-right">
              {row.mae != null ? row.mae.toLocaleString('ru-RU') : '—'}
            </TableCell>
            <TableCell className="text-right">{row.count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
