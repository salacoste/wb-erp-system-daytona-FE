'use client'

/**
 * Calculation results table — per-SKU cost breakdown
 * Epic 76-FE, Story 76.4 (AC: #2)
 */

import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResponsiveTable } from '@/components/product/tables/ResponsiveTable'
import type {
  TableConsumerContract,
  TableNumericColumnContract,
} from '@/components/product/tables/contracts'
import { CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CalculationResultItem } from '@/types/shipment-cost'

interface CalculationResultsProps {
  // iter-65: typed nullable for defense-in-depth — the calculate envelope (#193 §2) may omit
  // `results` at runtime; the boundary in page.tsx coerces to [], and this guard backs it up.
  results: CalculationResultItem[] | undefined
}

function currencyColumn(id: string, label: string): TableNumericColumnContract {
  return {
    id,
    label,
    alignment: 'end',
    precision: 'caller-preserved',
    unit: { kind: 'currency', code: 'RUB' },
    tabularNumerals: true,
    fullValueAccess: 'visible',
  }
}

const CALCULATION_TABLE_CONTRACT: TableConsumerContract = {
  primaryColumn: { id: 'nmId', label: 'Товар' },
  numericColumns: [
    currencyColumn('unitCostRub', 'Себестоимость (PCU)'),
    currencyColumn('deliveryCostPerUnit', 'Доставка (DCU)'),
    currencyColumn('finalCostPerUnit', 'Итого на единицу (FCU)'),
    {
      id: 'totalUnits',
      label: 'Количество',
      alignment: 'end',
      precision: 'integer',
      unit: { kind: 'quantity', label: 'штук' },
      tabularNumerals: true,
      fullValueAccess: 'visible',
    },
    currencyColumn('finalCostLine', 'Сумма по строке'),
  ],
  sorting: { kind: 'none' },
  selection: { kind: 'none' },
  rowActions: { kind: 'none' },
  narrowStrategy: {
    kind: 'horizontal-scroll',
    regionLabel: 'Таблица результатов расчёта',
    minimumWidth: '48rem',
  },
  pagination: { kind: 'none' },
}

export function CalculationResults({ results }: CalculationResultsProps) {
  if (!results?.length) return null

  const totalCost = results.reduce((sum, r) => sum + r.finalCostLine, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-status-success">
        <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        <h3 className="text-sm font-semibold">Результаты расчёта</h3>
      </div>
      <div className="rounded-md border">
        <ResponsiveTable
          accessibleLabel="Результаты расчёта по товарам"
          contract={CALCULATION_TABLE_CONTRACT}
        >
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
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(item.unitCostRub)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(item.deliveryCostPerUnit)}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(item.finalCostPerUnit)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{item.totalUnits}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(item.finalCostLine)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={5} className="text-right">
                Итого
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(totalCost)}</TableCell>
            </TableRow>
          </TableBody>
        </ResponsiveTable>
      </div>
    </div>
  )
}
