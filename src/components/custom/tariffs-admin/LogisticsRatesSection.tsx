'use client'

// ============================================================================
// Logistics Rates Section
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section for logistics-related tariff fields
// ============================================================================

import { Truck } from 'lucide-react'
import { TariffFieldInput } from './TariffFieldInput'
import { TariffSectionWrapper } from './TariffSectionWrapper'
import { LogisticsTiersEditor } from './LogisticsTiersEditor'
import type { UseFormRegister, FieldErrors, Control, UseFormSetValue } from 'react-hook-form'
import type { TariffSettingsFormData, VolumeTierFormData } from './tariffSettingsSchema'

interface LogisticsRatesSectionProps {
  register: UseFormRegister<TariffSettingsFormData>
  errors: FieldErrors<TariffSettingsFormData>
  control: Control<TariffSettingsFormData>
  setValue: UseFormSetValue<TariffSettingsFormData>
  /** Current volume tiers value */
  volumeTiers: VolumeTierFormData[]
  disabled?: boolean
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when section toggle is clicked */
  onToggle?: () => void
}

/**
 * Logistics rates section with 3 fields + volume tiers:
 * - logisticsLargeFirstLiterRate (₽/л)
 * - logisticsLargeAdditionalLiterRate (₽/л)
 * - logisticsVolumeTiers (array editor)
 *
 * AC2: Collapsible section "Логистика"
 */
export function LogisticsRatesSection({
  register,
  errors,
  setValue,
  volumeTiers,
  disabled = false,
  isOpen = true,
  onToggle,
}: LogisticsRatesSectionProps) {
  const handleTiersChange = (newTiers: VolumeTierFormData[]) => {
    setValue('logisticsVolumeTiers', newTiers, { shouldValidate: true })
  }

  return (
    <TariffSectionWrapper
      title="Логистика"
      icon={Truck}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {/* Large item rates */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TariffFieldInput
            label="Крупногабарит 1-й литр"
            unit="₽"
            register={register('logisticsLargeFirstLiterRate', {
              valueAsNumber: true,
            })}
            error={errors.logisticsLargeFirstLiterRate}
            step={0.01}
            min={0.01}
            placeholder="48.00"
            disabled={disabled}
            helpText="Стоимость первого литра крупногабарита"
          />

          <TariffFieldInput
            label="Крупногабарит доп."
            unit="₽/л"
            register={register('logisticsLargeAdditionalLiterRate', {
              valueAsNumber: true,
            })}
            error={errors.logisticsLargeAdditionalLiterRate}
            step={0.01}
            min={0.01}
            placeholder="15.00"
            disabled={disabled}
            helpText="Стоимость каждого дополнительного литра"
          />
        </div>

        {/* Volume tiers editor */}
        <LogisticsTiersEditor
          tiers={volumeTiers}
          onChange={handleTiersChange}
          error={errors.logisticsVolumeTiers?.message}
          disabled={disabled}
          label="Тарифные уровни по объёму"
        />
      </div>
    </TariffSectionWrapper>
  )
}
