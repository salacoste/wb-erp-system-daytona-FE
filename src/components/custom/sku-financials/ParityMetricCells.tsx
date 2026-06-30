'use client'

/**
 * Competitor-parity FR-2..FR-5 SKU cells (#219).
 * Null means N/A/unavailable from backend and must render as "—", not as 0.
 */

import { TableCell } from '@/components/ui/table'
import type { SkuFinancialParity } from '@/types/sku-financials'
import { formatCurrency, formatPercent } from './sku-table-formatters'

interface ParityMetricCellsProps {
  parity?: SkuFinancialParity
}

function formatNullableInteger(value: number | null | undefined): string {
  return value == null ? '—' : value.toLocaleString('ru-RU')
}

export function ParityMetricCells({ parity }: ParityMetricCellsProps) {
  return (
    <>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="FR-2: расходы на рекламу"
      >
        {formatCurrency(parity?.advertisingCost ?? null)}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right text-gray-600" title="FR-2: ДРР">
        {formatPercent(parity?.drrPct ?? null)}
      </TableCell>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="FR-3: операционная прибыль после распределённого налога"
      >
        {formatCurrency(parity?.netProfitAfterTax ?? null)}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right text-gray-600" title="FR-5: СПП, ₽">
        {formatCurrency(parity?.sppRub ?? null)}
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right text-gray-600" title="FR-5: отмены, шт">
        {formatNullableInteger(parity?.cancellationsQty)}
      </TableCell>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="FR-4: остаток в закупочных ценах; для исторических недель может быть недоступен"
      >
        {formatCurrency(parity?.stockValueRub ?? null)}
      </TableCell>
      <TableCell
        className="hidden lg:table-cell text-right text-gray-600"
        title="FR-4: доля стоимости остатков в кабинете"
      >
        {formatPercent(parity?.stockValueSharePct ?? null)}
      </TableCell>
    </>
  )
}
