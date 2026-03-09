/**
 * Metric row with optional comparison
 * Request #41: Added isNegative prop for returns display
 * Updated: Added tooltip support via LabelWithTooltip
 */

import { TableRow, TableCell } from '@/components/ui/table'
import { LabelWithTooltip } from './LabelWithTooltip'
import { ChangeIndicator } from './ChangeIndicator'
import { formatCurrency } from './financial-summary-formatters'
import type { MetricRowProps } from './financial-summary-types'

export function MetricRow({
  label,
  value,
  comparisonValue,
  highlight = false,
  isNegative = false,
  isComparison,
}: MetricRowProps) {
  return (
    <TableRow className={highlight ? 'bg-blue-50 font-semibold' : ''}>
      <TableCell className="font-medium">
        <LabelWithTooltip label={label} />
      </TableCell>
      <TableCell className={`text-right ${isNegative ? 'text-red-600' : ''}`}>
        {isNegative && value
          ? `\u2212${formatCurrency(value).replace('\u2212', '')}`
          : formatCurrency(value)}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className={`text-right ${isNegative ? 'text-red-600' : ''}`}>
            {isNegative && comparisonValue
              ? `\u2212${formatCurrency(comparisonValue).replace('\u2212', '')}`
              : formatCurrency(comparisonValue)}
          </TableCell>
          <TableCell className="text-right">
            <ChangeIndicator
              current={value}
              previous={comparisonValue}
              isNegativeMetric={isNegative}
            />
          </TableCell>
        </>
      )}
    </TableRow>
  )
}
