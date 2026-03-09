/**
 * Expense row with percentage of turnover and tooltip support
 * Used in the Expenses section of Financial Summary Table
 */

import { TableRow, TableCell } from '@/components/ui/table'
import { LabelWithTooltip } from './LabelWithTooltip'
import { ChangeIndicator } from './ChangeIndicator'
import { formatCurrency, pctOfTurnover } from './financial-summary-formatters'
import type { ExpenseRowProps } from './financial-summary-types'

export function ExpenseRow({
  label,
  value,
  compValue,
  base,
  compBase,
  indent = 0,
  bold = false,
  highlight = false,
  isComparison,
}: ExpenseRowProps) {
  return (
    <TableRow className={highlight ? 'bg-amber-50 font-semibold' : bold ? 'font-semibold' : ''}>
      <TableCell className="font-medium" style={{ paddingLeft: `${16 + indent * 16}px` }}>
        <LabelWithTooltip label={label} />
      </TableCell>
      <TableCell className="text-right">{formatCurrency(value)}</TableCell>
      <TableCell className="text-right text-gray-500">{pctOfTurnover(value, base)}</TableCell>
      {isComparison && (
        <>
          <TableCell className="text-right">{formatCurrency(compValue)}</TableCell>
          <TableCell className="text-right text-gray-500">
            {pctOfTurnover(compValue, compBase)}
          </TableCell>
          <TableCell className="text-right">
            <ChangeIndicator current={value} previous={compValue} isNegativeMetric />
          </TableCell>
        </>
      )}
    </TableRow>
  )
}
