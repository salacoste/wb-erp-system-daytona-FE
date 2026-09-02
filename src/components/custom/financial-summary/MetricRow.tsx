/**
 * Metric row with optional comparison
 * Request #41: Added isNegative prop for returns display
 * Updated: Added tooltip support via LabelWithTooltip
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes — see debt-p2-boundary-wave1 artifact.
//
// HOUSE RULE (review-pass-2, 2026-09-02): colored text on a tint MUST measure
// ≥4.5:1 light (WCAG 1.4.3); if it fails, either drop the tint to /5
// (financial-* rows: positive on information/10 = 4.44 fail → on /5 = 4.78
// light / 8.77 dark over card; negative 5.24 / 8.20) or drop the text to
// foreground/muted (success headers: 13.95 / 6.77 on /10). A measured pass at
// /10 stays /10 (status-information title on info/10 = 4.98 light).

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
    <TableRow className={highlight ? 'bg-status-information/5 font-semibold' : ''}>
      <TableCell className="font-medium">
        <LabelWithTooltip label={label} />
      </TableCell>
      <TableCell className={`text-right ${isNegative ? 'text-financial-negative' : ''}`}>
        {isNegative && value
          ? `\u2212${formatCurrency(value).replace('\u2212', '')}`
          : formatCurrency(value)}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className={`text-right ${isNegative ? 'text-financial-negative' : ''}`}>
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
