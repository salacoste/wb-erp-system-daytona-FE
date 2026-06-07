'use client'

/**
 * Horizon breakdown table — accuracy metrics per forecast horizon.
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
import type { HorizonAccuracy } from '@/types/ai/forecast-accuracy'

interface HorizonBreakdownTableProps {
  rows: HorizonAccuracy[]
}

export function HorizonBreakdownTable({ rows }: HorizonBreakdownTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет данных по горизонтам</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Горизонт (дни)</TableHead>
          <TableHead className="text-right">MAPE</TableHead>
          <TableHead className="text-right">MAE</TableHead>
          <TableHead className="text-right">Кол-во</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.horizonDays}>
            <TableCell className="font-medium">{row.horizonDays}</TableCell>
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
