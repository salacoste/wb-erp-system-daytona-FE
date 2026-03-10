/**
 * ScheduleVersionForm field sections
 * Extracted from ScheduleVersionForm.tsx for file size compliance
 * Story 52-FE.3: Schedule Future Version
 */

'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UseFormReturn } from 'react-hook-form'

interface ScheduleFormValues {
  effective_from: string
  acceptanceBoxRatePerLiter: number
  acceptancePalletRate: number
  storageFreeDays: number
  fixationClothingDays: number
  fixationOtherDays: number
  defaultCommissionFboPct: number
  defaultCommissionFbsPct: number
  notes?: string
}

interface FieldSectionProps {
  form: UseFormReturn<ScheduleFormValues>
  disabled: boolean
}

export function AcceptanceRatesSection({ form, disabled }: FieldSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="acceptanceBoxRatePerLiter">Тариф приёмки (₽/литр)</Label>
        <Input
          id="acceptanceBoxRatePerLiter"
          type="number"
          step="0.01"
          disabled={disabled}
          aria-label="Тариф приёмки за литр"
          {...form.register('acceptanceBoxRatePerLiter', { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="acceptancePalletRate">Тариф приёмки (₽/паллета)</Label>
        <Input
          id="acceptancePalletRate"
          type="number"
          step="0.01"
          disabled={disabled}
          {...form.register('acceptancePalletRate', { valueAsNumber: true })}
        />
      </div>
    </div>
  )
}

export function StorageSettingsSection({ form, disabled }: FieldSectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="storageFreeDays">Бесплатные дни хранения</Label>
        <Input
          id="storageFreeDays"
          type="number"
          min="0"
          disabled={disabled}
          aria-label="Бесплатные дни"
          {...form.register('storageFreeDays', { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fixationClothingDays">Фиксация (одежда)</Label>
        <Input
          id="fixationClothingDays"
          type="number"
          min="0"
          disabled={disabled}
          {...form.register('fixationClothingDays', { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fixationOtherDays">Фиксация (прочее)</Label>
        <Input
          id="fixationOtherDays"
          type="number"
          min="0"
          disabled={disabled}
          {...form.register('fixationOtherDays', { valueAsNumber: true })}
        />
      </div>
    </div>
  )
}

export function CommissionRatesSection({ form, disabled }: FieldSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="defaultCommissionFboPct">Комиссия FBO (%)</Label>
        <Input
          id="defaultCommissionFboPct"
          type="number"
          step="0.1"
          min="0"
          max="100"
          disabled={disabled}
          {...form.register('defaultCommissionFboPct', { valueAsNumber: true })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultCommissionFbsPct">Комиссия FBS (%)</Label>
        <Input
          id="defaultCommissionFbsPct"
          type="number"
          step="0.1"
          min="0"
          max="100"
          disabled={disabled}
          {...form.register('defaultCommissionFbsPct', { valueAsNumber: true })}
        />
      </div>
    </div>
  )
}

export function NotesSection({ form, disabled }: FieldSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Заметки (необязательно)</Label>
      <Input
        id="notes"
        type="text"
        disabled={disabled}
        placeholder="Причина изменения тарифов..."
        aria-label="Заметки"
        {...form.register('notes')}
      />
    </div>
  )
}
