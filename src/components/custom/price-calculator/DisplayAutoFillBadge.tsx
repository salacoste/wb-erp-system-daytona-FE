'use client'

/**
 * LogisticsTariffDisplay internal hook and badge component.
 * Extracted from LogisticsTariffDisplay.tsx for 200-line compliance.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  calculateLogisticsTariff,
  DEFAULT_BOX_TARIFFS,
  type BoxDeliveryTariffs,
} from '@/lib/logistics-tariff'

// --- Auto-fill Badge ---

export function DisplayAutoFillBadge({ source }: { source: 'auto' | 'manual' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-normal ring-1 ring-inset',
        source === 'auto'
          ? 'bg-green-50 text-green-700 ring-green-300'
          : 'bg-gray-50 text-gray-600 ring-gray-200'
      )}
    >
      {source === 'auto' ? 'Рассчитано' : 'Вручную'}
    </span>
  )
}

// --- Hook Types ---

interface UseLogisticsTariffParams {
  volumeLiters: number
  coefficient: number
  value: number
  onChange: (value: number) => void
  warehouseTariffs?: { baseLiterRub: number; additionalLiterRub: number } | null
}

// --- Hook ---

export function useLogisticsTariffState({
  volumeLiters,
  coefficient,
  value,
  onChange,
  warehouseTariffs,
}: UseLogisticsTariffParams) {
  const [autoCalculate, setAutoCalculate] = useState(true)
  const [inputValue, setInputValue] = useState<string>(String(value || ''))

  // Sync inputValue when value prop changes (from parent or restore)
  useEffect(() => {
    setInputValue(String(value || ''))
  }, [value])

  // Build effective tariffs
  const effectiveTariffs: BoxDeliveryTariffs = useMemo(
    () => ({
      baseLiterRub: warehouseTariffs?.baseLiterRub ?? DEFAULT_BOX_TARIFFS.baseLiterRub,
      additionalLiterRub:
        warehouseTariffs?.additionalLiterRub ?? DEFAULT_BOX_TARIFFS.additionalLiterRub,
      coefficient: coefficient > 0 ? coefficient : 1.0,
    }),
    [warehouseTariffs, coefficient]
  )

  // Calculate logistics cost
  const result = useMemo(
    () => calculateLogisticsTariff(volumeLiters, effectiveTariffs),
    [volumeLiters, effectiveTariffs]
  )

  const calculatedValue = result.totalCost
  const isManualOverride = !autoCalculate

  const handleAutoCalculateChange = useCallback(
    (enabled: boolean) => {
      setAutoCalculate(enabled)
      if (enabled) {
        onChange(calculatedValue)
      }
    },
    [onChange, calculatedValue]
  )

  const handleRestore = useCallback(() => {
    onChange(calculatedValue)
    setAutoCalculate(true)
  }, [onChange, calculatedValue])

  const handleManualChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value
      setInputValue(rawValue)
      const newValue = parseFloat(rawValue) || 0
      onChange(newValue)
      setAutoCalculate(false)
    },
    [onChange]
  )

  return {
    autoCalculate,
    inputValue,
    result,
    calculatedValue,
    isManualOverride,
    handleAutoCalculateChange,
    handleRestore,
    handleManualChange,
  }
}
