'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import { PriceCalculatorForm } from '@/components/custom/price-calculator/PriceCalculatorForm'
import { PriceCalculatorResults } from '@/components/custom/price-calculator/PriceCalculatorResults'
import { ErrorMessage } from '@/components/custom/price-calculator/ErrorMessage'
import { usePriceCalculator } from '@/hooks/usePriceCalculator'
import type { PriceCalculatorRequest, TwoLevelPricingFormData } from '@/types/price-calculator'

/**
 * Price Calculator page component
 * Story 44.4-FE: Page Layout & Navigation Integration
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 * Story 44.20-FE: Two-Level Pricing Display
 *
 * Features:
 * - Two-column layout (form + results)
 * - Auto-calculation on form changes (500ms debounce)
 * - Error handling with retry option
 * - Reset confirmation when results exist
 * - Two-level pricing display (minimum + recommended)
 *
 * @example
 * // This page is automatically routed to by Next.js App Router
 * // URL: /cogs/price-calculator
 */
export default function PriceCalculatorPage() {
  const [isCalculating, setIsCalculating] = useState(false)
  // Story 44.19: SPP state for customer price display
  const [sppPct, setSppPct] = useState(0)
  // Story 44.20: Form data for two-level pricing calculation
  const [formData, setFormData] = useState<TwoLevelPricingFormData | null>(null)
  // Story 44.20: Commission percentage from category selection
  const [commissionPct, setCommissionPct] = useState(15) // Default 15%

  const { mutate, isPending, data, error } = usePriceCalculator({
    onSettled: () => {
      setIsCalculating(false)
    },
  })

  const handleCalculate = useCallback(
    (requestData: PriceCalculatorRequest) => {
      setIsCalculating(true)
      mutate(requestData)
    },
    [mutate]
  )

  // Story 44.20: Handle form data changes for two-level pricing
  const handleFormDataChange = useCallback((data: TwoLevelPricingFormData) => {
    setFormData(data)
  }, [])

  // Story 44.20: Handle commission change from category selection
  const handleCommissionChange = useCallback((commission: number) => {
    setCommissionPct(commission)
  }, [])

  const hasResults = !!data

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link
          href="/cogs"
          className="hover:text-foreground hover:underline"
        >
          Управление себестоимостью
        </Link>
        {' / '}
        <span className="text-foreground font-medium">Калькулятор цены</span>
      </nav>

      {/* Page Header */}
      <h1 className="text-2xl font-bold mb-6">Калькулятор цены</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div>
          <PriceCalculatorForm
            onSubmit={handleCalculate}
            loading={isPending || isCalculating}
            hasResults={hasResults}
            onSppChange={setSppPct}
            onFormDataChange={handleFormDataChange}
            onCommissionChange={handleCommissionChange}
          />
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {/* Error message */}
          {error && (
            <ErrorMessage
              error={error}
              onRetry={() => {
                // Retry last calculation if data exists
                if (data) {
                  // Form will auto-recalculate with current values
                }
              }}
            />
          )}

          {/* Results display - Story 44.20: with two-level pricing */}
          <PriceCalculatorResults
            data={data ?? null}
            loading={isPending}
            error={error}
            sppPct={sppPct}
            formData={formData}
            commissionPct={commissionPct}
          />
        </div>
      </div>
    </div>
  )
}
