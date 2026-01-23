'use client'

// ============================================================================
// Returns Rates Section
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section for return logistics tariff fields
// ============================================================================

import { RotateCcw } from 'lucide-react'
import { TariffFieldInput } from './TariffFieldInput'
import { TariffSectionWrapper } from './TariffSectionWrapper'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import type { TariffSettingsFormData } from './tariffSettingsSchema'

interface ReturnsRatesSectionProps {
  register: UseFormRegister<TariffSettingsFormData>
  errors: FieldErrors<TariffSettingsFormData>
  disabled?: boolean
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when section toggle is clicked */
  onToggle?: () => void
}

/**
 * Returns rates section with 2 fields:
 * - returnLogisticsFboRate (₽)
 * - returnLogisticsFbsRate (₽)
 *
 * AC2: Collapsible section "Возвраты"
 */
export function ReturnsRatesSection({
  register,
  errors,
  disabled = false,
  isOpen = false,
  onToggle,
}: ReturnsRatesSectionProps) {
  return (
    <TariffSectionWrapper
      title="Возвраты"
      icon={RotateCcw}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TariffFieldInput
          label="Возврат FBO"
          unit="₽"
          register={register('returnLogisticsFboRate', { valueAsNumber: true })}
          error={errors.returnLogisticsFboRate}
          step={0.01}
          min={0.01}
          placeholder="50.00"
          disabled={disabled}
          helpText="Стоимость логистики возврата FBO"
        />

        <TariffFieldInput
          label="Возврат FBS"
          unit="₽"
          register={register('returnLogisticsFbsRate', { valueAsNumber: true })}
          error={errors.returnLogisticsFbsRate}
          step={0.01}
          min={0.01}
          placeholder="60.00"
          disabled={disabled}
          helpText="Стоимость логистики возврата FBS"
        />
      </div>
    </TariffSectionWrapper>
  )
}
