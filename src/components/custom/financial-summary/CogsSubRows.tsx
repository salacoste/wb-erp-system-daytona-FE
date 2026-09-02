/**
 * COGS sub-rows — coverage and products count
 * Extracted from CogsSection.tsx for file size compliance
 * Story 25.2: COGS Section
 */

// P2 boundary wave-1 (2026-09-02): legacy palette → semantic tokens; contrast
// measured both themes — see debt-p2-boundary-wave1 artifact.

import type { FinanceSummary } from '@/hooks/useDashboard'
import { formatPercentage, formatPercentagePoints } from '@/lib/utils'
import { TableCell, TableRow } from '@/components/ui/table'

export function CogsCoverageRow({
  summary,
  comparisonSummary,
  isComparison,
}: {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">Покрытие COGS</TableCell>
      <TableCell className="text-right">
        {summary.cogs_coverage_pct !== null && summary.cogs_coverage_pct !== undefined
          ? formatPercentage(summary.cogs_coverage_pct, 1)
          : '—'}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className="text-right">
            {comparisonSummary?.cogs_coverage_pct !== null &&
            comparisonSummary?.cogs_coverage_pct !== undefined
              ? formatPercentage(comparisonSummary.cogs_coverage_pct, 1)
              : '—'}
          </TableCell>
          <TableCell className="text-right">
            {summary.cogs_coverage_pct !== null &&
            comparisonSummary?.cogs_coverage_pct !== null &&
            summary.cogs_coverage_pct !== undefined &&
            comparisonSummary?.cogs_coverage_pct !== undefined ? (
              <span
                className={
                  summary.cogs_coverage_pct > comparisonSummary.cogs_coverage_pct
                    ? 'text-financial-positive'
                    : summary.cogs_coverage_pct < comparisonSummary.cogs_coverage_pct
                      ? 'text-financial-negative'
                      : 'text-muted-foreground'
                }
              >
                {formatPercentagePoints(
                  summary.cogs_coverage_pct - comparisonSummary.cogs_coverage_pct
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{'—'}</span>
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  )
}

export function CogsProductsRow({
  summary,
  comparisonSummary,
  isComparison,
}: {
  summary: FinanceSummary
  comparisonSummary?: FinanceSummary
  isComparison: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">Товаров с COGS</TableCell>
      <TableCell className="text-right">
        {summary.products_with_cogs !== null &&
        summary.products_with_cogs !== undefined &&
        summary.products_total !== null &&
        summary.products_total !== undefined
          ? `${summary.products_with_cogs} / ${summary.products_total}`
          : '—'}
      </TableCell>
      {isComparison && (
        <>
          <TableCell className="text-right">
            {comparisonSummary?.products_with_cogs !== null &&
            comparisonSummary?.products_with_cogs !== undefined &&
            comparisonSummary?.products_total !== null &&
            comparisonSummary?.products_total !== undefined
              ? `${comparisonSummary.products_with_cogs} / ${comparisonSummary.products_total}`
              : '—'}
          </TableCell>
          <TableCell className="text-right">
            <span className="text-muted-foreground">{'—'}</span>
          </TableCell>
        </>
      )}
    </TableRow>
  )
}
