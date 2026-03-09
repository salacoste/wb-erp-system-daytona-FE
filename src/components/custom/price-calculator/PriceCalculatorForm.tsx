'use client'

/**
 * Price Calculator input form
 * Story 44.2-FE: Input Form Component
 * Story 74.1: Split into state/handlers/fields/rendering files
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator } from 'lucide-react'
import { PresetIndicator } from './PresetIndicator'
import { ResetConfirmDialog } from './ResetConfirmDialog'
import { PriceCalculatorFormFields } from './PriceCalculatorFormFields'
import { usePriceCalculatorState } from './usePriceCalculatorState'
import { usePriceCalculatorHandlers } from './usePriceCalculatorHandlers'
import type { PriceCalculatorRequest, TwoLevelPricingFormData } from '@/types/price-calculator'

export interface PriceCalculatorFormProps {
  onSubmit: (data: PriceCalculatorRequest) => void
  loading?: boolean
  disabled?: boolean
  hasResults?: boolean
  onSppChange?: (sppPct: number) => void
  onFormDataChange?: (data: TwoLevelPricingFormData) => void
  onCommissionChange?: (commission: number) => void
}

export function PriceCalculatorForm({
  onSubmit,
  loading = false,
  disabled = false,
  hasResults = false,
  onSppChange,
  onFormDataChange,
  onCommissionChange,
}: PriceCalculatorFormProps) {
  const state = usePriceCalculatorState()
  const handlers = usePriceCalculatorHandlers(state, {
    onSubmit,
    onSppChange,
    onFormDataChange,
    onCommissionChange,
    hasResults,
    disabled,
  })

  return (
    <>
      <Card
        data-testid="price-calculator-form"
        className="shadow-sm hover:shadow-md transition-shadow duration-200 rounded-xl"
      >
        <CardHeader className="border-b-4 border-b-primary bg-muted/30 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">Калькулятор цены</CardTitle>
                <PresetIndicator isVisible={state.isPresetLoaded} />
              </div>
              <CardDescription className="mt-1">
                Рассчитайте оптимальную цену на основе затрат и желаемой маржи
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PriceCalculatorFormFields
            state={state}
            handlers={handlers}
            loading={loading}
            disabled={disabled}
          />
        </CardContent>
      </Card>
      <ResetConfirmDialog
        open={state.showResetConfirm}
        onOpenChange={state.setShowResetConfirm}
        onConfirm={handlers.confirmReset}
      />
    </>
  )
}
