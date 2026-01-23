'use client'

// ============================================================================
// FBS Settings Section
// Epic 52-FE: Story 52-FE.2 - Tariff Settings Edit Form
// Collapsible section for FBS-specific settings
// ============================================================================

import { Package2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { TariffFieldInput } from './TariffFieldInput'
import { TariffSectionWrapper } from './TariffSectionWrapper'
import { LogisticsTiersEditor } from './LogisticsTiersEditor'
import type {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import type { TariffSettingsFormData, VolumeTierFormData } from './tariffSettingsSchema'

interface FbsSettingsSectionProps {
  register: UseFormRegister<TariffSettingsFormData>
  errors: FieldErrors<TariffSettingsFormData>
  setValue: UseFormSetValue<TariffSettingsFormData>
  watch: UseFormWatch<TariffSettingsFormData>
  /** Current FBS volume tiers value */
  fbsTiers?: VolumeTierFormData[]
  disabled?: boolean
  /** Whether section is expanded */
  isOpen?: boolean
  /** Callback when section toggle is clicked */
  onToggle?: () => void
}

/**
 * FBS settings section with 4+ fields:
 * - fbsUsesFboLogisticsRates (boolean checkbox)
 * - logisticsFbsVolumeTiers (array, optional if using FBO rates)
 * - logisticsFbsLargeFirstLiterRate (optional)
 * - logisticsFbsLargeAdditionalLiterRate (optional)
 *
 * AC2: Collapsible section "FBS настройки"
 */
export function FbsSettingsSection({
  register,
  errors,
  setValue,
  watch,
  fbsTiers,
  disabled = false,
  isOpen = false,
  onToggle,
}: FbsSettingsSectionProps) {
  const usesFboRates = watch('fbsUsesFboLogisticsRates')

  const handleToggleChange = (checked: boolean) => {
    setValue('fbsUsesFboLogisticsRates', checked, { shouldValidate: true })
  }

  const handleFbsTiersChange = (newTiers: VolumeTierFormData[]) => {
    setValue('logisticsFbsVolumeTiers', newTiers, { shouldValidate: true })
  }

  return (
    <TariffSectionWrapper
      title="FBS настройки"
      icon={Package2}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {/* Toggle for using FBO rates */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="fbs-uses-fbo-rates"
              className="text-sm font-medium cursor-pointer"
            >
              Использовать тарифы FBO
            </Label>
            <p className="text-xs text-muted-foreground">
              Применять тарифы FBO для расчёта логистики FBS
            </p>
          </div>
          <Switch
            id="fbs-uses-fbo-rates"
            checked={usesFboRates}
            onCheckedChange={handleToggleChange}
            disabled={disabled}
            aria-label="Использовать тарифы FBO для FBS"
          />
        </div>

        {/* FBS-specific fields (hidden when using FBO rates) */}
        {!usesFboRates && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TariffFieldInput
                label="FBS крупногабарит 1-й литр"
                unit="₽"
                register={register('logisticsFbsLargeFirstLiterRate', {
                  valueAsNumber: true,
                })}
                error={errors.logisticsFbsLargeFirstLiterRate}
                step={0.01}
                min={0.01}
                placeholder="55.00"
                disabled={disabled}
                helpText="Стоимость первого литра для FBS"
              />

              <TariffFieldInput
                label="FBS крупногабарит доп."
                unit="₽/л"
                register={register('logisticsFbsLargeAdditionalLiterRate', {
                  valueAsNumber: true,
                })}
                error={errors.logisticsFbsLargeAdditionalLiterRate}
                step={0.01}
                min={0.01}
                placeholder="18.00"
                disabled={disabled}
                helpText="Стоимость дополнительного литра для FBS"
              />
            </div>

            {/* FBS volume tiers editor */}
            <LogisticsTiersEditor
              tiers={fbsTiers ?? []}
              onChange={handleFbsTiersChange}
              error={errors.logisticsFbsVolumeTiers?.message}
              disabled={disabled}
              label="Тарифные уровни FBS по объёму"
            />
          </>
        )}
      </div>
    </TariffSectionWrapper>
  )
}
