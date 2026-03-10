'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  calculateLogisticsTariff,
  DEFAULT_BOX_TARIFFS,
  type BoxDeliveryTariffs,
} from '@/lib/logistics-tariff'

interface LogisticsTariffHandlerProps {
  value: number
  onChange: (value: number) => void
  volumeLiters: number
  warehouseTariffs?: { baseLiterRub: number; additionalLiterRub: number } | null
  warehouseCoefficient: number
}

/**
 * Handlers and local state for LogisticsTariffCalculator
 * Extracted for file size compliance (Story 74.8)
 */
export function useLogisticsTariffHandlers({
  value,
  onChange,
  volumeLiters,
  warehouseTariffs,
  warehouseCoefficient,
}: LogisticsTariffHandlerProps) {
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [showTariffInputs, setShowTariffInputs] = useState(false)
  const [inputValue, setInputValue] = useState<string>(String(value || ''))

  // Sync inputValue when value prop changes
  useEffect(() => {
    setInputValue(String(value || ''))
  }, [value])

  const [localTariffs, setLocalTariffs] = useState<BoxDeliveryTariffs>({
    baseLiterRub: warehouseTariffs?.baseLiterRub ?? DEFAULT_BOX_TARIFFS.baseLiterRub,
    additionalLiterRub:
      warehouseTariffs?.additionalLiterRub ?? DEFAULT_BOX_TARIFFS.additionalLiterRub,
    coefficient: warehouseCoefficient > 0 ? warehouseCoefficient : 1.0,
  })

  const result = calculateLogisticsTariff(volumeLiters, localTariffs)
  const calculatedValue = result.totalCost
  const isManualOverride = !autoCalculate || Math.abs(value - calculatedValue) > 0.01

  const handleAutoCalculateChange = useCallback(
    (enabled: boolean) => {
      setAutoCalculate(enabled)
      if (enabled) onChange(calculatedValue)
    },
    [onChange, calculatedValue]
  )

  const handleRestore = useCallback(() => {
    onChange(calculatedValue)
    setAutoCalculate(true)
  }, [onChange, calculatedValue])

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setInputValue(rawValue)
    onChange(parseFloat(rawValue) || 0)
    setAutoCalculate(false)
  }

  const handleTariffChange = useCallback(
    (field: keyof BoxDeliveryTariffs, val: number) => {
      setLocalTariffs(prev => ({ ...prev, [field]: val }))
      if (autoCalculate) {
        const newTariffs = { ...localTariffs, [field]: val }
        onChange(calculateLogisticsTariff(volumeLiters, newTariffs).totalCost)
      }
    },
    [autoCalculate, localTariffs, volumeLiters, onChange]
  )

  const handleResetTariffs = useCallback(() => {
    const defaultTariffs = {
      baseLiterRub: warehouseTariffs?.baseLiterRub ?? DEFAULT_BOX_TARIFFS.baseLiterRub,
      additionalLiterRub:
        warehouseTariffs?.additionalLiterRub ?? DEFAULT_BOX_TARIFFS.additionalLiterRub,
      coefficient: warehouseCoefficient > 0 ? warehouseCoefficient : 1.0,
    }
    setLocalTariffs(defaultTariffs)
    if (autoCalculate) onChange(calculateLogisticsTariff(volumeLiters, defaultTariffs).totalCost)
  }, [warehouseTariffs, warehouseCoefficient, autoCalculate, volumeLiters, onChange])

  return {
    autoCalculate,
    showTariffInputs,
    setShowTariffInputs,
    inputValue,
    localTariffs,
    result,
    calculatedValue,
    isManualOverride,
    handleAutoCalculateChange,
    handleRestore,
    handleManualChange,
    handleTariffChange,
    handleResetTariffs,
  }
}
