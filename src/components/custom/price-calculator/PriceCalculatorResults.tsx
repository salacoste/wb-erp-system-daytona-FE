'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useMemo } from 'react'
import type {
  PriceCalculatorResponse,
  TwoLevelPricingFormData,
} from '@/types/price-calculator'
import { calculateTwoLevelPricing } from '@/lib/two-level-pricing'
import { RecommendedPriceCard } from './RecommendedPriceCard'
import { TwoLevelPricingDisplay } from './TwoLevelPricingDisplay'
import { CostBreakdownChart } from './CostBreakdownChart'
import { WarningsDisplay } from './WarningsDisplay'
import { ResultsSkeleton } from './ResultsSkeleton'

/**
 * Props for PriceCalculatorResults component
 * Story 44.20: Updated to support two-level pricing display
 */
export interface PriceCalculatorResultsProps {
  /** Calculation result from API */
  data: PriceCalculatorResponse | null
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
  /** SPP percentage for customer price display (Story 44.19) */
  sppPct?: number
  /** Form data for two-level pricing calculation (Story 44.20) */
  formData?: TwoLevelPricingFormData | null
  /** Commission percentage from category selection (Story 44.20) */
  commissionPct?: number
}

/**
 * Main results container component
 * Story 44.20: Two-Level Pricing Display
 *
 * Displays:
 * - Two-level pricing (minimum + recommended + customer price)
 * - Cost breakdown with collapsible details
 * - Visual chart
 * - Warnings
 *
 * @example
 * <PriceCalculatorResults
 *   data={result}
 *   loading={false}
 *   formData={formData}
 *   commissionPct={15}
 *   sppPct={10}
 * />
 */
export function PriceCalculatorResults({
  data,
  loading = false,
  error = null,
  sppPct = 0,
  formData = null,
  commissionPct = 15, // Default commission if not provided
}: PriceCalculatorResultsProps) {
  // Calculate two-level pricing from form data
  const twoLevelResult = useMemo(() => {
    if (!formData || !data) return null
    return calculateTwoLevelPricing(formData, commissionPct)
  }, [formData, commissionPct, data])

  // Empty state (before first calculation)
  if (!data && !loading && !error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            Введите параметры затрат и нажмите «Рассчитать цену» для получения результатов
          </p>
        </CardContent>
      </Card>
    )
  }

  // Loading state - use skeleton
  if (loading) {
    return <ResultsSkeleton estimatedDuration={1500} />
  }

  // Error state - show RecommendedPriceCard to handle error display
  if (error || !data) {
    return <RecommendedPriceCard data={data} loading={loading} error={error} />
  }

  return (
    <div className="space-y-6" data-testid="price-calculator-results">
      {/* Two-Level Pricing Display (Story 44.20) */}
      {twoLevelResult && formData ? (
        <TwoLevelPricingDisplay
          result={twoLevelResult}
          fulfillmentType={formData.fulfillment_type}
          taxType={formData.tax_type}
          taxRatePct={formData.tax_rate_pct}
          sppPct={sppPct}
        />
      ) : (
        /* Fallback to original display if no form data */
        <RecommendedPriceCard data={data} loading={loading} error={error} />
      )}

      {/* Only show additional components if we have complete data */}
      {data.percentage_breakdown && (
        <>
          {/* Cost Breakdown Chart */}
          <CostBreakdownChart data={data} />

          {/* Warnings (if any) */}
          <WarningsDisplay data={data} />
        </>
      )}
    </div>
  )
}
