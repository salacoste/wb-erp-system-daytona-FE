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
          Fixed Costs
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Amount (₽)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>COGS</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.cogs || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Logistics Forward</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.logistics_forward || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Logistics Reverse (effective)</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.logistics_reverse_effective || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Storage</TableCell>
              <TableCell className="text-right">
                {formatCurrency(cost_breakdown?.storage || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Fixed Total</TableCell>
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
          Percentage Costs
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Amount (₽)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>WB Commission</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.commission_wb || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Acquiring</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.acquiring || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Advertising</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.advertising || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>VAT</TableCell>
              <TableCell className="text-right">
                {formatCurrency(percentage_breakdown.vat || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-green-50 dark:bg-green-950 font-medium">
              <TableCell>Margin (Profit)</TableCell>
              <TableCell className="text-right text-green-700 dark:text-green-400">
                {formatCurrency(percentage_breakdown.margin || 0)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted/50 font-medium">
              <TableCell>Total Percentage Costs</TableCell>
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
