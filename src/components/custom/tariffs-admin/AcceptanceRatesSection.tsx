'use client'

// ============================================================================
// Acceptance Rates Section
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section for acceptance-related tariff fields
// ============================================================================

import { Package } from 'lucide-react'
import { TariffFieldInput } from './TariffFieldInput'
import { TariffSectionWrapper } from './TariffSectionWrapper'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { TariffSettingsFormData } from './tariffSettingsSchema'

interface AcceptanceRatesSectionProps {
  register: UseFormRegister<TariffSettingsFormData>
  errors: FieldErrors<TariffSettingsFormData>
  disabled?: boolean
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when section toggle is clicked */
  onToggle?: () => void
}

/**
 * Acceptance rates section with 2 fields:
 * - acceptanceBoxRatePerLiter (₽/литр)
 * - acceptancePalletRate (₽)
 *
 * AC2: Collapsible section "Приёмка"
 */
export function AcceptanceRatesSection({
  register,
  errors,
  disabled = false,
  isOpen = true,
  onToggle,
}: AcceptanceRatesSectionProps) {
  return (
    <TariffSectionWrapper
      title="Приёмка"
      icon={Package}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TariffFieldInput
          label="Тариф приёмки"
          unit="₽/литр"
          register={register('acceptanceBoxRatePerLiter', { valueAsNumber: true })}
          error={errors.acceptanceBoxRatePerLiter}
          step={0.01}
          min={0.01}
          placeholder="1.80"
          disabled={disabled}
          helpText="Стоимость приёмки за литр объёма"
        />

        <TariffFieldInput
          label="Тариф паллеты"
          unit="₽"
          register={register('acceptancePalletRate', { valueAsNumber: true })}
          error={errors.acceptancePalletRate}
          step={1}
          min={1}
          placeholder="520"
          disabled={disabled}
          helpText="Стоимость приёмки паллеты"
        />
      </div>
    </TariffSectionWrapper>
  )
}
