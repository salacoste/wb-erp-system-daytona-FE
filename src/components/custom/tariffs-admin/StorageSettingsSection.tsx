'use client'

// ============================================================================
// Storage Settings Section
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section for storage-related settings
// ============================================================================

import { Warehouse } from 'lucide-react'
import { TariffFieldInput } from './TariffFieldInput'
import { TariffSectionWrapper } from './TariffSectionWrapper'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { TariffSettingsFormData } from './tariffSettingsSchema'

interface StorageSettingsSectionProps {
  register: UseFormRegister<TariffSettingsFormData>
  errors: FieldErrors<TariffSettingsFormData>
  disabled?: boolean
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when section toggle is clicked */
  onToggle?: () => void
}

/**
 * Storage settings section with 3 fields:
 * - storageFreeDays (integer >= 0)
 * - fixationClothingDays (integer >= 0)
 * - fixationOtherDays (integer >= 0)
 *
 * AC2: Collapsible section "Хранение"
 * AC3: Validation - non-negative integers for days
 */
export function StorageSettingsSection({
  register,
  errors,
  disabled = false,
  isOpen = false,
  onToggle,
}: StorageSettingsSectionProps) {
  return (
    <TariffSectionWrapper
      title="Хранение"
      icon={Warehouse}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <TariffFieldInput
          label="Бесплатные дни"
          unit="дней"
          register={register('storageFreeDays', { valueAsNumber: true })}
          error={errors.storageFreeDays}
          step={1}
          min={0}
          placeholder="30"
          disabled={disabled}
          helpText="Дней бесплатного хранения"
        />

        <TariffFieldInput
          label="Фиксация одежда"
          unit="дней"
          register={register('fixationClothingDays', { valueAsNumber: true })}
          error={errors.fixationClothingDays}
          step={1}
          min={0}
          placeholder="14"
          disabled={disabled}
          helpText="Дней фиксации для одежды"
        />

        <TariffFieldInput
          label="Фиксация прочее"
          unit="дней"
          register={register('fixationOtherDays', { valueAsNumber: true })}
          error={errors.fixationOtherDays}
          step={1}
          min={0}
          placeholder="7"
          disabled={disabled}
          helpText="Дней фиксации для прочих категорий"
        />
      </div>
    </TariffSectionWrapper>
  )
}
