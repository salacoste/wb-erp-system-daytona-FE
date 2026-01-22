'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import type { PriceCalculatorResponse } from '@/types/price-calculator'

/**
 * Props for CostBreakdownTable component
 */
export interface CostBreakdownTableProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse
}

/**
 * Detailed cost breakdown table
 * Shows fixed costs and percentage costs with both % and ₽ amounts
 *
 * @example
 * <CostBreakdownTable data={result} />
 */
export function CostBreakdownTable({ data }: CostBreakdownTableProps) {
  const { cost_breakdown, percentage_breakdown } = data

  // Guard clause for incomplete data
  if (!cost_breakdown || !percentage_breakdown) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Fixed Costs Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Фиксированные затраты
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Затрата</TableHead>
              <TableHead className="text-right">Сумма (₽)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Себестоимость (COGS)</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.cogs || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Логистика к клиенту</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.logistics_forward || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Логистика возврата (эффективная)</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.logistics_reverse_effective || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Хранение</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.storage || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Итого фиксированные</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.fixed_total || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Percentage Costs Section */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Процентные затраты
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Затрата</TableHead>
              <TableHead className="text-right">Сумма (₽)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Комиссия WB</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.commission_wb || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Эквайринг</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.acquiring || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Реклама</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.advertising || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>НДС</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.vat || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-green-50 dark:bg-green-950 font-medium">
              <TableCell>Маржа (прибыль)</TableCell>
              <TableCell className="text-right text-green-700 dark:text-green-400">
                {formatCurrency(percentage_breakdown.margin || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Итого процентные</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.percentage_total || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
