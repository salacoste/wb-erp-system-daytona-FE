'use client'

/**
 * SKU Financials Summary Footer Component
 * Extracted from SkuFinancialsTable.tsx — aggregated totals row
 */

import { cn } from '@/lib/utils'
import {
  formatCurrency,
  formatSignedCurrency,
  formatPercent,
  getValueColorClass,
} from './sku-table-formatters'

export interface Totals {
  count: number
  salesQty: number
  returnsQty: number
  revenue: number
  cogs: number
  grossProfit: number
  expenses: number
  operatingProfit: number
  avgMargin: number
  /** Story 87.3-FE: rows with assigned COGS (for "X из Y" footnote) */
  rowsWithCogs: number
  /** Story 87.3-FE: total rows including missing-COGS (for footnote denominator) */
  totalRows: number
}

export function SummaryFooter({ totals }: { totals: Totals }) {
  const showCogsFootnote = totals.totalRows > 0 && totals.rowsWithCogs < totals.totalRows

  return (
    <div className="border-t bg-muted/50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Товаров:</span>{' '}
          <span className="font-medium">{totals.count}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Продано:</span>{' '}
          <span className="font-medium">{totals.salesQty} шт.</span>
          {totals.returnsQty > 0 && (
            <span className="text-xs text-muted-foreground ml-1">(возвр. {totals.returnsQty})</span>
          )}
        </div>
        <div>
          <span className="text-muted-foreground">Выручка:</span>{' '}
          <span className="font-medium">{formatCurrency(totals.revenue)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">COGS:</span>{' '}
          <span className="font-medium">{formatCurrency(totals.cogs)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Расходы:</span>{' '}
          <span className="font-medium">{formatCurrency(totals.expenses)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Опер. прибыль:</span>{' '}
          <span className={cn('font-medium', getValueColorClass(totals.operatingProfit))}>
            {formatSignedCurrency(totals.operatingProfit)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Ср. маржа:</span>{' '}
          <span className={cn('font-medium', getValueColorClass(totals.avgMargin))}>
            {formatPercent(totals.avgMargin)}
          </span>
        </div>
      </div>
      {/* 168.9: COGS footnote = semantic warning (was text-amber-700) */}
      {showCogsFootnote && (
        <p className="mt-2 text-xs text-status-warning">
          ⚠ COGS назначен для {totals.rowsWithCogs} из {totals.totalRows} товаров. Прибыль посчитана
          только по товарам с COGS.
        </p>
      )}
    </div>
  )
}
