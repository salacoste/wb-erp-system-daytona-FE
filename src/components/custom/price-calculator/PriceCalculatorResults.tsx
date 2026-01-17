'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { PriceCalculatorResponse } from '@/types/price-calculator'
import { RecommendedPriceCard } from './RecommendedPriceCard'
import { CostBreakdownTable } from './CostBreakdownTable'
import { CostBreakdownChart } from './CostBreakdownChart'
import { WarningsDisplay } from './WarningsDisplay'

/**
 * Props for PriceCalculatorResults component
 */
export interface PriceCalculatorResultsProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse | null
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
}

/**
 * Main results container component
 * Displays recommended price, cost breakdown table, and chart
 *
 * @example
 * <PriceCalculatorResults
 *   data={result}
 *   loading={false}
 * />
 */
export function PriceCalculatorResults({
  data,
  loading = false,
  error = null,
}: PriceCalculatorResultsProps) {
  // Empty state (before first calculation)
  if (!data && !loading && !error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            Enter cost parameters and click "Calculate Price" to see results
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6" data-testid="price-calculator-results">
      {/* Recommended Price Card */}
      <RecommendedPriceCard data={data} loading={loading} error={error} />

      {/* Only show detailed results if we have complete data and no error */}
      {data && !error && data.percentage_breakdown && (
        <>
          {/* Cost Breakdown Table */}
          <CostBreakdownTable data={data} />

          {/* Cost Breakdown Chart */}
          <CostBreakdownChart data={data} />

          {/* Warnings (if any) */}
          <WarningsDisplay data={data} />
        </>
      )}
    </div>
  )
}
