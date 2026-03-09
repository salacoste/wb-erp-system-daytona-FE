'use client'

/**
 * State initialization hook for PriceCalculatorForm
 * Extracted from PriceCalculatorForm.tsx for modularity (Story 74.1)
 *
 * Manages: useState, useRef, useForm, preset, and delegates external
 * data (tariffs, commissions, auto-fill, warehouse) to usePriceCalculatorData.
 */

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { usePriceCalculatorPreset } from './usePriceCalculatorPreset'
import { usePriceCalculatorData } from './usePriceCalculatorData'
import type { TaxType } from '@/types/price-calculator'
import type { CategoryCommission } from '@/types/tariffs'
import type { ProductWithDimensions } from '@/types/product'
import { type FormData, defaultFormValues } from './usePriceCalculatorForm'

/** All state and refs returned by usePriceCalculatorState */
export function usePriceCalculatorState() {
  // --- Local state ---
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductWithDimensions | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CategoryCommission | null>(null)
  const [drrValue, setDrrValue] = useState(defaultFormValues.drr_pct)
  const [sppValue, setSppValue] = useState(0)
  const [taxRate, setTaxRate] = useState(6)
  const [taxType, setTaxType] = useState<TaxType>('income')
  const [isVatPayer, setIsVatPayer] = useState(false)
  const [vatRate, setVatRate] = useState(20)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const presetLoadedRef = useRef(false)
  const [presetWarehouseId, setPresetWarehouseId] = useState<number | null>(null)
  const skipUnitsResetRef = useRef(false)
  const [presetNmId, setPresetNmId] = useState<string | null>(null)

  // --- useForm ---
  const {
    handleSubmit,
    reset,
    setValue,
    getValues,
    register,
    formState: { isValid, errors },
    control,
  } = useForm<FormData>({ defaultValues: defaultFormValues, mode: 'onChange' })

  // --- Preset hook ---
  const preset = usePriceCalculatorPreset()

  // --- External data (tariffs, commissions, auto-fill, warehouse, watched values) ---
  const data = usePriceCalculatorData({
    setValue,
    control,
    setSelectedCategory,
    presetWarehouseId,
  })

  return {
    // Local state
    showResetConfirm,
    setShowResetConfirm,
    selectedProduct,
    setSelectedProduct,
    selectedCategory,
    setSelectedCategory,
    drrValue,
    setDrrValue,
    sppValue,
    setSppValue,
    taxRate,
    setTaxRate,
    taxType,
    setTaxType,
    isVatPayer,
    setIsVatPayer,
    vatRate,
    setVatRate,
    debounceTimerRef,
    presetLoadedRef,
    presetWarehouseId,
    setPresetWarehouseId,
    skipUnitsResetRef,
    presetNmId,
    setPresetNmId,
    // Form
    handleSubmit,
    reset,
    setValue,
    getValues,
    register,
    isValid,
    errors,
    control,
    // Preset
    ...preset,
    // External data (tariffs, auto-fill, warehouse, watched values)
    ...data,
  }
}
