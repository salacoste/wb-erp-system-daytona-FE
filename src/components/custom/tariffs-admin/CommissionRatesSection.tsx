'use client'

// ============================================================================
// Commission Rates Section
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section for commission percentage fields
// ============================================================================

import { Percent } from 'lucide-react'
import { TariffFieldInput } from './TariffFieldInput'
import { TariffSectionWrapper } from './TariffSectionWrapper'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { TariffSettingsFormData } from './tariffSettingsSchema'

interface CommissionRatesSectionProps {
  register: UseFormRegister<TariffSettingsFormData>
  errors: FieldErrors<TariffSettingsFormData>
  disabled?: boolean
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when section toggle is clicked */
  onToggle?: () => void
}

/**
 * Commission rates section with 2 fields:
 * - defaultCommissionFboPct (0-100%)
 * - defaultCommissionFbsPct (0-100%)
 *
 * AC2: Collapsible section "Комиссии"
 * AC3: Validation 0-100 for percentages
 */
export function CommissionRatesSection({
  register,
  errors,
  disabled = false,
  isOpen = false,
  onToggle,
}: CommissionRatesSectionProps) {
  return (
    <TariffSectionWrapper
      title="Комиссии"
      icon={Percent}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TariffFieldInput
          label="Комиссия FBO"
          unit="%"
          register={register('defaultCommissionFboPct', { valueAsNumber: true })}
          error={errors.defaultCommissionFboPct}
          step={0.1}
          min={0}
          max={100}
          placeholder="15"
          disabled={disabled}
          helpText="Базовая комиссия WB для FBO"
        />

        <TariffFieldInput
          label="Комиссия FBS"
          unit="%"
          register={register('defaultCommissionFbsPct', { valueAsNumber: true })}
          error={errors.defaultCommissionFbsPct}
          step={0.1}
          min={0}
          max={100}
          placeholder="12"
          disabled={disabled}
          helpText="Базовая комиссия WB для FBS"
        />
      </div>
    </TariffSectionWrapper>
  )
}
