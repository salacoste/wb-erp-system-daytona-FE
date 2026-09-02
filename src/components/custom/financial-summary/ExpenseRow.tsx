/**
 * Expense row with percentage of turnover and tooltip support
 * Used in the Expenses section of Financial Summary Table
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes over the card surface — see debt-p2-boundary-wave1
// artifact. The amber row highlight is a subtle surface (not a badge) and
// follows the MetricRow /5 house rule (colored text renders on it):
// financial-positive on warning/5 measures 4.81:1 light / 8.57:1 dark,
// financial-negative 5.28 / 8.02; foreground/muted-foreground 15.12 / 7.34
// light.

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
    <TableRow
      className={highlight ? 'bg-status-warning/5 font-semibold' : bold ? 'font-semibold' : ''}
    >
      <TableCell className="font-medium" style={{ paddingLeft: `${16 + indent * 16}px` }}>
        <LabelWithTooltip label={label} />
      </TableCell>
      <TableCell className="text-right">{formatCurrency(value)}</TableCell>
      <TableCell className="text-right text-muted-foreground">
        {pctOfTurnover(value, base)}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className="text-right">{formatCurrency(compValue)}</TableCell>
          <TableCell className="text-right text-muted-foreground">
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
