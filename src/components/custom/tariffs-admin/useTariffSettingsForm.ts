'use client'

// ============================================================================
// Tariff Settings Form Hook
// Epic 52-FE / Story 74.6: Extracted from TariffSettingsForm.tsx
// All form state management, validation, and save logic
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTariffSettings } from '@/hooks/useTariffSettings'
import { useUpdateTariffSettings } from '@/hooks/useUpdateTariffSettings'
import {
  tariffSettingsSchema,
  getDefaultFormValues,
  getChangedFields,
  getUnavailableTariffFieldLabels,
  type TariffSettingsFormData,
} from './tariffSettingsSchema'

export type SectionKey = 'acceptance' | 'logistics' | 'returns' | 'commission' | 'storage' | 'fbs'

const DEFAULT_OPEN_SECTIONS: Record<SectionKey, boolean> = {
  acceptance: true,
  logistics: true,
  returns: false,
  commission: false,
  storage: false,
  fbs: false,
}

/**
 * Custom hook encapsulating all TariffSettingsForm state and logic.
 *
 * Extracted from TariffSettingsForm for file-size compliance (Story 74.6).
 * No functional changes - pure structural extraction.
 */
export function useTariffSettingsForm() {
  const { data: settings, isLoading, error: fetchError } = useTariffSettings()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateTariffSettings()

  // Section open/close state - first two sections open by default
  const [openSections, setOpenSections] =
    useState<Record<SectionKey, boolean>>(DEFAULT_OPEN_SECTIONS)

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState(false)
  const [saveOutcome, setSaveOutcome] = useState<'idle' | 'success' | 'error'>('idle')

  // Original settings for change detection
  const [originalValues, setOriginalValues] = useState<TariffSettingsFormData | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<TariffSettingsFormData>({
    resolver: zodResolver(tariffSettingsSchema),
    mode: 'onChange',
  })

  // Watch volume tiers for LogisticsRatesSection
  const volumeTiers = useWatch({ control, name: 'logisticsVolumeTiers' })
  const fbsTiers = useWatch({ control, name: 'logisticsFbsVolumeTiers' })
  const notes = useWatch({ control, name: 'notes' })
  const unavailableFieldLabels = useMemo(
    () => getUnavailableTariffFieldLabels(settings),
    [settings]
  )

  // Load settings into form when data arrives
  useEffect(() => {
    if (settings) {
      const formValues = getDefaultFormValues(settings)
      reset(formValues)
      setOriginalValues(formValues)
    }
  }, [settings, reset])

  // Toggle section open/close
  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }))
  }, [])

  // Handle save button click - show confirmation
  const handleSaveClick = () => {
    if (!isValid) return
    setSaveOutcome('idle')
    setShowConfirm(true)
  }

  // Handle confirmed save
  const handleConfirmSave = handleSubmit((data: TariffSettingsFormData) => {
    if (!originalValues) return

    const changedFields = getChangedFields(originalValues, data)
    const changedCount = Object.keys(changedFields).length

    // AC5: Use PATCH for partial changes, PUT for full replacement
    // If more than half the fields changed, use PUT
    const usePut = changedCount > 10

    updateSettings(
      {
        data: usePut ? data : changedFields,
        method: usePut ? 'PUT' : 'PATCH',
      },
      {
        onSuccess: () => {
          reset(data)
          setShowConfirm(false)
          setOriginalValues(data)
          setSaveOutcome('success')
        },
        onError: () => {
          setSaveOutcome('error')
        },
      }
    )
  })

  // Handle cancel button
  const handleCancel = () => {
    if (originalValues) {
      reset(originalValues)
      setSaveOutcome('idle')
    }
  }

  return {
    // Query state
    isLoading,
    fetchError,
    isSaving,
    // Form methods
    register,
    control,
    setValue,
    watch,
    // Form state
    errors,
    isValid,
    isDirty,
    unavailableFieldLabels,
    saveOutcome,
    // Watched values
    volumeTiers,
    fbsTiers,
    notes,
    // Section state
    openSections,
    toggleSection,
    // Dialog state
    showConfirm,
    setShowConfirm,
    // Handlers
    handleSaveClick,
    handleConfirmSave,
    handleCancel,
  }
}
