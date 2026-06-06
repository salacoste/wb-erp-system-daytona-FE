'use client'

/**
 * State management hook for DeliveryDatePicker component
 * Story 44.26a-FE: Delivery Date Selection
 * Story 44.40-FE: Two Tariff Systems Integration
 * Epic 74: File Size Compliance - extracted from DeliveryDatePicker.tsx
 */

import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'
import {
  getTomorrowDate,
  getFirstAvailableDate,
  getCoefficientStatus,
  type NormalizedCoefficient,
} from '@/lib/coefficient-utils'
import type { BoxTypeCoefficients, BoxType } from '@/hooks/useAcceptanceCoefficients'
import type { SupplyDateTariffs } from '@/lib/tariff-system-utils'

interface UseDeliveryDatePickerStateParams {
  coefficients: NormalizedCoefficient[]
  byBoxType: BoxTypeCoefficients[]
  selectedDate: string | null
  onDateSelect: (date: string, coefficient: number) => void
  onDateSelectWithTariffs?: (
    date: string,
    coefficient: number,
    supplyTariffs: SupplyDateTariffs | null
  ) => void
  supplyTariffsMap?: Map<string, SupplyDateTariffs>
}

export function useDeliveryDatePickerState({
  coefficients,
  byBoxType,
  selectedDate,
  onDateSelect,
  onDateSelectWithTariffs,
  supplyTariffsMap,
}: UseDeliveryDatePickerStateParams) {
  // Use first available box type as default, or 'boxes' if none
  const defaultBoxType = byBoxType.length > 0 ? byBoxType[0].boxType : 'boxes'
  const [selectedBoxType, setSelectedBoxType] = useState<BoxType>(defaultBoxType)

  // Get coefficients for selected box type, or fallback to legacy coefficients
  const activeCoefficients: NormalizedCoefficient[] = useMemo(() => {
    if (byBoxType.length > 0) {
      const boxData = byBoxType.find(b => b.boxType === selectedBoxType)
      if (boxData) {
        return boxData.dailyCoefficients.map(c => ({
          date: c.date,
          coefficient: c.coefficient,
          status: getCoefficientStatus(c.coefficient),
          isAvailable: c.isAvailable,
        }))
      }
    }
    return coefficients
  }, [byBoxType, selectedBoxType, coefficients])

  // Check if API returned no data (this is an error condition)
  const hasNoApiData = coefficients.length === 0 && byBoxType.length === 0

  // Get current coefficient for selected date
  const selectedCoefficient = useMemo(() => {
    if (!selectedDate || !activeCoefficients.length) return null
    return activeCoefficients.find(c => c.date === selectedDate)
  }, [selectedDate, activeCoefficients])

  // Determine default date if none selected
  const effectiveDate = useMemo(() => {
    if (selectedDate) return selectedDate

    const tomorrow = getTomorrowDate()
    const tomorrowCoeff = activeCoefficients.find(c => c.date === tomorrow)
    if (tomorrowCoeff && tomorrowCoeff.isAvailable) {
      return tomorrow
    }

    const firstAvailable = getFirstAvailableDate(activeCoefficients)
    return firstAvailable?.date ?? null
  }, [selectedDate, activeCoefficients])

  // Check if any dates are available (use isAvailable flag, not coefficient value)
  // coefficient=0 with isAvailable=true means FREE slot (no markup)
  const hasAvailableDates = useMemo(() => {
    return activeCoefficients.some(c => c.isAvailable)
  }, [activeCoefficients])

  // Check if we have multiple box types to show tabs
  const hasMultipleBoxTypes = byBoxType.length > 1

  // Story 44.40: Wrap date selection to include supply tariffs
  const handleDateSelect = useCallback(
    (date: string, coefficient: number) => {
      // Call the basic handler
      onDateSelect(date, coefficient)

      // Also call the extended handler with supply tariffs if provided
      if (onDateSelectWithTariffs) {
        const supplyTariffs = supplyTariffsMap?.get(date) ?? null
        onDateSelectWithTariffs(date, coefficient, supplyTariffs)
      }
    },
    [onDateSelect, onDateSelectWithTariffs, supplyTariffsMap]
  )

  // Story 44.40-FE: Auto-notify parent when date is auto-selected on first load
  // This ensures tariffSystem is set to 'supply' for future dates
  const hasNotifiedAutoSelect = useRef(false)
  useEffect(() => {
    // Only auto-notify once when effectiveDate is set and differs from selectedDate
    if (
      !hasNotifiedAutoSelect.current &&
      effectiveDate &&
      !selectedDate &&
      activeCoefficients.length > 0
    ) {
      const coeff = activeCoefficients.find(c => c.date === effectiveDate)
      if (coeff) {
        logger.debug(
          '[DeliveryDatePicker] Auto-selecting date:',
          effectiveDate,
          'coefficient:',
          coeff.coefficient
        )
        handleDateSelect(effectiveDate, coeff.coefficient)
        hasNotifiedAutoSelect.current = true
      }
    }
  }, [effectiveDate, selectedDate, activeCoefficients, handleDateSelect])

  // Sync coefficient when selectedDate is already set (e.g. from preset) and coefficients load
  // Without this, acceptanceCoefficient stays at default 1.0 when preset loads a date
  const hasNotifiedPresetSync = useRef(false)
  useEffect(() => {
    if (!hasNotifiedPresetSync.current && selectedDate && activeCoefficients.length > 0) {
      const coeff = activeCoefficients.find(c => c.date === selectedDate)
      if (coeff) {
        logger.debug(
          '[DeliveryDatePicker] Syncing preset date coefficient:',
          selectedDate,
          'coefficient:',
          coeff.coefficient
        )
        handleDateSelect(selectedDate, coeff.coefficient)
        hasNotifiedPresetSync.current = true
      }
    }
  }, [selectedDate, activeCoefficients, handleDateSelect])

  return {
    selectedBoxType,
    setSelectedBoxType,
    activeCoefficients,
    hasNoApiData,
    selectedCoefficient,
    effectiveDate,
    hasAvailableDates,
    hasMultipleBoxTypes,
    handleDateSelect,
  }
}
