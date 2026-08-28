'use client'

import { useState, useCallback, useRef } from 'react'
import { PriceCalculatorForm } from '@/components/custom/price-calculator/PriceCalculatorForm'
import { PriceCalculatorResults } from '@/components/custom/price-calculator/PriceCalculatorResults'
import { ErrorMessage } from '@/components/custom/price-calculator/ErrorMessage'
import { PageHeader } from '@/components/product/PageHeader'
import { usePriceCalculator } from '@/hooks/usePriceCalculator'
import type { PriceCalculatorRequest, TwoLevelPricingFormData } from '@/types/price-calculator'

/**
 * Price Calculator page component
 * Story 44.4-FE: Page Layout & Navigation Integration
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 * Story 44.20-FE: Two-Level Pricing Display
 * Story 44.30-FE: UX Polish & Accessibility Fixes
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
  // Story 44.30: Track last request for retry functionality
  const [lastRequest, setLastRequest] = useState<PriceCalculatorRequest | null>(null)
  // UX: Ref for auto-scrolling to results after calculation
  const resultsRef = useRef<HTMLDivElement>(null)

  const { mutate, isPending, data, error } = usePriceCalculator({
    onSuccess: () => {
      setIsCalculating(false)
      // UX: Auto-scroll to results on successful calculation
      // Delayed to allow React to render results first
      setTimeout(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        resultsRef.current?.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest', // Keep in view without forcing to top
        })
      }, 100)
    },
    onError: () => {
      setIsCalculating(false)
    },
  })

  const handleCalculate = useCallback(
    (requestData: PriceCalculatorRequest) => {
      setLastRequest(requestData) // Story 44.30: Save for retry
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
    <div className="space-y-6">
      <PageHeader
        title="Калькулятор цены"
        description="Рассчитайте рекомендованную цену с учётом затрат, комиссий и целевой маржи."
        breadcrumbs={[
          { label: 'Управление себестоимостью', href: '/cogs' },
          { label: 'Калькулятор цены' },
        ]}
      />

      {/* Two-column layout - items-start prevents column stretching, min-h-0 prevents grid height overflow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start min-h-0">
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

        {/* One semantic results tree; it becomes sticky only in the desktop column. */}
        <div ref={resultsRef} className="space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
          {error && (
            <ErrorMessage
              error={error}
              onRetry={() => {
                if (lastRequest) {
                  setIsCalculating(true)
                  mutate(lastRequest)
                }
              }}
            />
          )}
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
