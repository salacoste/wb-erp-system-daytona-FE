/**
 * Financial Summary Table Component
 * Story 3.5: Financial Summary View
 *
 * Displays complete financial metrics organized by category:
 * - Revenue metrics
 * - Expense breakdown
 * - Payout summary
 * - Adjustments and compensations
 *
 * Supports comparison mode (two columns)
 */

import type { FinancialSummaryTableProps } from './financial-summary-types'
import { RevenueSection } from './RevenueSection'
import { SalesFunnelSection } from './SalesFunnelSection'
import { ExpensesSection } from './ExpensesSection'
import { CompensationsSection } from './CompensationsSection'
import { PayoutSection } from './PayoutSection'
import { CogsSection } from './CogsSection'
import { ProfitSection } from './ProfitSection'

export function FinancialSummaryTable({
  summary,
  comparisonSummary,
  className,
}: FinancialSummaryTableProps) {
  const isComparison = !!comparisonSummary

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <RevenueSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />

      <SalesFunnelSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />

      <ExpensesSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />

      <CompensationsSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />

      <PayoutSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />

      <CogsSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />

      <ProfitSection
        summary={summary}
        comparisonSummary={comparisonSummary}
        isComparison={isComparison}
      />
    </div>
  )
}
