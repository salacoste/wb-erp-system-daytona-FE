'use client'

/**
 * Ad Cost Discrepancy Section — Story 73.9-FE (Task 5)
 * Orchestrates data fetching for Layer 3 (weekly finance report)
 * and renders the Card + Chart comparison views.
 *
 * Layer 1 (platform spend) comes from advertising analytics (parent).
 * Layer 3 (actual deduction) comes from useFinancialSummary.
 */

import { useMemo } from 'react'
import { useFinancialSummary } from '@/hooks-v1/financial'
import { getLastCompletedWeek } from '@/lib/margin-helpers'
import { AdCostDiscrepancyCard } from './AdCostDiscrepancyCard'
import { AdCostDiscrepancyChart } from './AdCostDiscrepancyChart'

interface AdCostDiscrepancySectionProps {
  /** Layer 1: PromotionAPI total_spend from advertising analytics summary */
  platformSpend: number | null
  /** Whether advertising data is still loading */
  isLoading: boolean
}

export function AdCostDiscrepancySection({
  platformSpend,
  isLoading: adLoading,
}: AdCostDiscrepancySectionProps) {
  const weekLabel = useMemo(() => getLastCompletedWeek(), [])
  const financeQuery = useFinancialSummary(weekLabel)

  // Defensive Math.abs: WB deductions can be negative in raw reports
  const rawDeduction = financeQuery.data?.summary_total?.wb_promotion_cost_total
  const actualDeduction = rawDeduction != null ? Math.abs(rawDeduction) : null

  // Treat finance error as data-unavailable (card shows "—" for Layer 3)
  const combinedLoading = adLoading || (financeQuery.isLoading && !financeQuery.isError)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <AdCostDiscrepancyCard
        platformSpend={platformSpend}
        actualDeduction={actualDeduction}
        isLoading={combinedLoading}
        weekLabel={weekLabel}
      />
      <AdCostDiscrepancyChart
        platformSpend={platformSpend}
        actualDeduction={actualDeduction}
        isLoading={combinedLoading}
      />
    </div>
  )
}
