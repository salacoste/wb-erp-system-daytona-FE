'use client'

/** Handlers & side effects for PriceCalculatorForm (Story 74.1) */

import { useCallback, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { isFormEmpty, toTwoLevelFormData, toApiRequest } from './priceCalculatorUtils'
import type {
  PriceCalculatorRequest,
  TwoLevelPricingFormData,
  TaxType,
} from '@/types/price-calculator'
import { type FormData, defaultFormValues } from './usePriceCalculatorForm'
import type { usePriceCalculatorState } from './usePriceCalculatorState'

interface HandlerProps {
  onSubmit: (data: PriceCalculatorRequest) => void
  onSppChange?: (sppPct: number) => void
  onFormDataChange?: (data: TwoLevelPricingFormData) => void
  onCommissionChange?: (commission: number) => void
  hasResults: boolean
  disabled: boolean
}

type State = ReturnType<typeof usePriceCalculatorState>

export function usePriceCalculatorHandlers(state: State, props: HandlerProps) {
  const { onSubmit, onSppChange, onFormDataChange, onCommissionChange, hasResults, disabled } =
    props

  useEffect(() => {
    return () => {
      if (state.debounceTimerRef.current) clearTimeout(state.debounceTimerRef.current)
    }
  }, [state.debounceTimerRef])

  useEffect(() => {
    if (state.tariffSettingsError)
      logger.warn(
        '[PriceCalculator] Tariff settings API error, using defaults:',
        state.tariffSettingsError
      )
  }, [state.tariffSettingsError])

  // Load preset on mount (Story 44.44: AC2)
  useEffect(() => {
    if (state.presetLoadedRef.current) return
    state.presetLoadedRef.current = true
    const presetData = state.loadPreset()
    if (!presetData) return

    if (presetData.drr_pct !== undefined) state.setDrrValue(presetData.drr_pct)
    if (presetData.spp_pct !== undefined) state.setSppValue(presetData.spp_pct)
    if (presetData.tax_rate_pct !== undefined) state.setTaxRate(presetData.tax_rate_pct)
    if (presetData.tax_type !== undefined) state.setTaxType(presetData.tax_type)
    if (presetData.is_vat_payer !== undefined) state.setIsVatPayer(presetData.is_vat_payer)
    if (presetData.vat_pct !== undefined) state.setVatRate(presetData.vat_pct)
    if (presetData.warehouse_id) state.setPresetWarehouseId(presetData.warehouse_id)
    if (presetData.nm_id) state.setPresetNmId(presetData.nm_id as string)
    if (presetData.units_per_package !== undefined) state.skipUnitsResetRef.current = true
    state.reset({ ...defaultFormValues, ...presetData })
  }, [
    state.loadPreset,
    state.reset,
    state.setDrrValue,
    state.setSppValue,
    state.setTaxRate,
    state.setTaxType,
    state.setIsVatPayer,
    state.setVatRate,
    state.setPresetWarehouseId,
    state.setPresetNmId,
    state.presetLoadedRef,
    state.skipUnitsResetRef,
  ])

  // --- Reset units_per_package when box_type or fulfillment_type changes ---
  useEffect(() => {
    if (state.skipUnitsResetRef.current) {
      state.skipUnitsResetRef.current = false
      return
    }
    state.setValue('units_per_package', 1, { shouldValidate: true })
  }, [state.boxType, state.fulfillmentType, state.setValue, state.skipUnitsResetRef])

  useEffect(() => {
    state.setValue('acceptance_cost', state.acceptanceCost.perUnitCost)
  }, [state.acceptanceCost.perUnitCost, state.setValue])

  useEffect(() => {
    if (!state.selectedCategory) return
    const fboComm = state.selectedCategory.paidStorageKgvp
    const fbsComm = state.selectedCategory.kgvpMarketplace
    const commission = state.fulfillmentType === 'FBO' ? fboComm : fbsComm
    logger.debug('[PriceCalculatorForm] Commission update:', {
      category: `${state.selectedCategory.parentName} → ${state.selectedCategory.subjectName}`,
      fulfillmentType: state.fulfillmentType,
      FBO_commission: fboComm,
      FBS_commission: fbsComm,
      activeCommission: commission,
      difference: fbsComm - fboComm,
    })
    state.setValue('commission_pct', commission)
    onCommissionChange?.(commission)
  }, [state.selectedCategory, state.fulfillmentType, onCommissionChange, state.setValue])

  const handleSppChange = useCallback(
    (value: number) => {
      state.setSppValue(value)
      state.setValue('spp_pct', value)
      onSppChange?.(value)
    },
    [onSppChange, state.setValue, state.setSppValue]
  )

  const handleDrrChange = useCallback(
    (value: number) => {
      state.setDrrValue(value)
      state.setValue('drr_pct', value)
      state.setValue('advertising_pct', value)
    },
    [state.setValue, state.setDrrValue]
  )

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

  const performCalculation = useCallback(
    (data: FormData) => {
      if (!state.isValid || isFormEmpty(data)) return
      onFormDataChange?.(toTwoLevelFormData(data))
      onSubmit(toApiRequest(data))
    },
    [state.isValid, onSubmit, onFormDataChange]
  )

  const onReset = useCallback(() => {
    if (hasResults) state.setShowResetConfirm(true)
    else state.reset(defaultFormValues)
  }, [hasResults, state.reset, state.setShowResetConfirm])

  const confirmReset = useCallback(() => {
    state.reset(defaultFormValues)
    state.setShowResetConfirm(false)
  }, [state.reset, state.setShowResetConfirm])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const isInModal = document.activeElement?.closest(
        '[role="dialog"], [data-radix-popover-content], [data-radix-dropdown-content]'
      )
      if (e.key === 'Escape' && !disabled && !isInModal) onReset()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, onReset])

  return {
    handleSppChange,
    handleDrrChange,
    handleTaxRateChange,
    handleTaxTypeChange,
    handleVatPayerChange,
    handleVatRateChange,
    performCalculation,
    onReset,
    confirmReset,
  }
}
