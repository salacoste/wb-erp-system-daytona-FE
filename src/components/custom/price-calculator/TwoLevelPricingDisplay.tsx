'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { TwoLevelPriceHeader } from './TwoLevelPriceHeader'
import { FixedCostsBreakdown } from './FixedCostsBreakdown'
import { PercentageCostsBreakdown } from './PercentageCostsBreakdown'
import { VariableCostsBreakdown } from './VariableCostsBreakdown'
import { MarginSection } from './MarginSection'
import { PriceSummaryFooter } from './PriceSummaryFooter'
import type { TwoLevelPricingResult, FulfillmentType, TaxType } from '@/types/price-calculator'

/**
 * Props for TwoLevelPricingDisplay component
 */
export interface TwoLevelPricingDisplayProps {
  /** Two-level pricing calculation result */
  result: TwoLevelPricingResult
  /** Fulfillment type for conditional display */
  fulfillmentType: FulfillmentType
  /** Tax type for margin display */
  taxType: TaxType
  /** Tax rate for margin display */
  taxRatePct: number
  /** SPP percentage for customer price display */
  sppPct: number
}

/**
 * Main two-level pricing display component
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Combines all pricing sub-components into a unified display:
 * - TwoLevelPriceHeader: Min/Recommended/Customer prices with gap indicator
 * - Cost breakdown (collapsible): Fixed, Percentage, Variable costs
 * - MarginSection: Profit display with visual indicator
 * - PriceSummaryFooter: Summary with copy buttons
 *
 * @example
 * <TwoLevelPricingDisplay
 *   result={twoLevelResult}
 *   fulfillmentType="FBO"
 *   taxType="income"
 *   taxRatePct={6}
 *   sppPct={10}
 * />
 */
export function TwoLevelPricingDisplay({
  result,
  fulfillmentType,
  taxType,
  taxRatePct,
  sppPct,
}: TwoLevelPricingDisplayProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(true)

  return (
    <Card data-testid="two-level-pricing-display">
      <CardHeader>
        <CardTitle className="text-lg">Расчёт цены</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Header with Min/Recommended/Customer prices */}
        <TwoLevelPriceHeader
          minimumPrice={result.minimumPrice}
          recommendedPrice={result.recommendedPrice}
          customerPrice={result.customerPrice}
          sppPct={sppPct}
          priceGap={result.priceGap}
        />

        {/* Collapsible Cost Breakdown Section */}
        <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex w-full items-center justify-between p-0 h-auto hover:bg-muted/50"
            >
              <span className="text-sm font-medium">Детализация расходов</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${breakdownOpen ? 'rotate-180' : ''}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-4">
            {/* Fixed Costs */}
            <FixedCostsBreakdown
              costs={result.fixedCosts}
              fulfillmentType={fulfillmentType}
              recommendedPrice={result.recommendedPrice}
            />

            {/* Percentage Costs */}
            <PercentageCostsBreakdown costs={result.percentageCosts} />

            {/* Variable Costs (DRR) */}
            <VariableCostsBreakdown costs={result.variableCosts} />

            {/* Margin Section */}
            <MarginSection
              margin={result.margin}
              taxType={taxType}
              taxRatePct={taxRatePct}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Price Summary Footer with Copy Buttons */}
        <PriceSummaryFooter
          minimumPrice={result.minimumPrice}
          recommendedPrice={result.recommendedPrice}
          customerPrice={result.customerPrice}
          sppPct={sppPct}
        />
      </CardContent>
    </Card>
  )
}
