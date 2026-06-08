'use client'

/** Tax-related handlers for PriceCalculatorForm (extracted from usePriceCalculatorHandlers) */

import { useCallback } from 'react'
import type { TaxType } from '@/types/price-calculator'
import type { usePriceCalculatorState } from './usePriceCalculatorState'

type State = ReturnType<typeof usePriceCalculatorState>

export function useTaxHandlers(state: State) {
  const handleTaxRateChange = useCallback(
    (value: number) => {
      state.setTaxRate(value)
      state.setValue('tax_rate_pct', value)
    },
    [state.setValue, state.setTaxRate]
  )

  const handleTaxTypeChange = useCallback(
    (value: TaxType) => {
      state.setTaxType(value)
      state.setValue('tax_type', value)
    },
    [state.setValue, state.setTaxType]
  )

  const handleVatPayerChange = useCallback(
    (isPayer: boolean) => {
      state.setIsVatPayer(isPayer)
      state.setValue('is_vat_payer', isPayer)
    },
    [state.setValue, state.setIsVatPayer]
  )

  const handleVatRateChange = useCallback(
    (rate: number) => {
      state.setVatRate(rate)
      state.setValue('vat_pct', rate)
    },
    [state.setValue, state.setVatRate]
  )

  return {
    handleTaxRateChange,
    handleTaxTypeChange,
    handleVatPayerChange,
    handleVatRateChange,
  }
}
