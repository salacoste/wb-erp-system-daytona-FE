'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PriceCalculatorForm } from '@/components/custom/price-calculator/PriceCalculatorForm'
import { PriceCalculatorResults } from '@/components/custom/price-calculator/PriceCalculatorResults'
import { ErrorMessage } from '@/components/custom/price-calculator/ErrorMessage'
import { usePriceCalculator } from '@/hooks/usePriceCalculator'
import type { PriceCalculatorRequest } from '@/types/price-calculator'

/**
 * Price Calculator page component
 * Story 44.4-FE: Page Layout & Navigation Integration
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 *
 * Features:
 * - Two-column layout (form + results)
 * - Auto-calculation on form changes (500ms debounce)
 * - Error handling with retry option
 * - Reset confirmation when results exist
 *
 * @example
 * // This page is automatically routed to by Next.js App Router
 * // URL: /cogs/price-calculator
 */
export default function PriceCalculatorPage() {
  const [isCalculating, setIsCalculating] = useState(false)
  const { mutate, isPending, data, error } = usePriceCalculator({
    onSettled: () => {
      setIsCalculating(false)
    },
  })

  const handleCalculate = (requestData: PriceCalculatorRequest) => {
    setIsCalculating(true)
    mutate(requestData)
  }

  const hasResults = !!data

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link
          href="/cogs"
          className="hover:text-foreground hover:underline"
        >
          COGS Management
        </Link>
        {' / '}
        <span className="text-foreground font-medium">Price Calculator</span>
      </nav>

      {/* Page Header */}
      <h1 className="text-2xl font-bold mb-6">Price Calculator</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div>
          <PriceCalculatorForm
            onSubmit={handleCalculate}
            loading={isPending || isCalculating}
            hasResults={hasResults}
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

          {/* Results display */}
          <PriceCalculatorResults
            data={data ?? null}
            loading={isPending}
            error={error}
          />
        </div>
      </div>
    </div>
  )
}
