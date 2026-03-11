'use client'

/**
 * Calculation results table — per-SKU cost breakdown
 * Epic 76-FE, Story 76.4 (AC: #2)
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CalculationResultItem } from '@/types/shipment-cost'

interface CalculationResultsProps {
  results: CalculationResultItem[]
}

export function CalculationResults({ results }: CalculationResultsProps) {
  if (!results.length) return null

  const totalCost = results.reduce((sum, r) => sum + r.finalCostLine, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Результаты расчёта</h3>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Товар</TableHead>
              <TableHead className="text-right">Себест. (PCU)</TableHead>
              <TableHead className="text-right">Доставка (DCU)</TableHead>
              <TableHead className="text-right">Итого (FCU)</TableHead>
              <TableHead className="text-right">Кол-во</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((item, index) => (
              <TableRow key={`${item.nmId}-${index}`}>
                <TableCell>
                  <div>
                    <span className="font-medium">{item.nmId}</span>
                    {item.productName && (
                      <span className="ml-2 text-muted-foreground text-xs">{item.productName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.unitCostRub)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.deliveryCostPerUnit)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.finalCostPerUnit)}
                </TableCell>
                <TableCell className="text-right">{item.totalUnits}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.finalCostLine)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={5} className="text-right">
                Итого
              </TableCell>
              <TableCell className="text-right">{formatCurrency(totalCost)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
