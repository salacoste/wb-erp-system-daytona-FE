'use client'

/**
 * ScheduleVersionForm Component
 * Story 52-FE.3: Schedule Future Version
 * Epic 52-FE: Tariff Settings Admin UI
 *
 * Form for creating future tariff versions with date picker
 * Pre-fills fields from current tariff settings
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ru } from 'date-fns/locale'
import { format, startOfTomorrow } from 'date-fns'
import { CalendarIcon, Info } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { TariffSettingsDto } from '@/types/tariffs-admin'

// Schema for schedule form - extends base tariff settings with required date
const scheduleFormSchema = z.object({
  effective_from: z.string().min(1, 'Выберите дату'),
  acceptanceBoxRatePerLiter: z.number().positive(),
  acceptancePalletRate: z.number().positive(),
  storageFreeDays: z.number().int().nonnegative(),
  fixationClothingDays: z.number().int().nonnegative(),
  fixationOtherDays: z.number().int().nonnegative(),
  defaultCommissionFboPct: z.number().min(0).max(100),
  defaultCommissionFbsPct: z.number().min(0).max(100),
  notes: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

export interface ScheduleVersionFormProps {
  /** Current tariff settings for pre-filling */
  currentSettings?: TariffSettingsDto
  /** Loading state for submit button */
  isLoading?: boolean
  /** Disable all fields */
  disabled?: boolean
  /** Submit handler */
  onSubmit: (values: ScheduleFormValues) => void
}

export function ScheduleVersionForm({
  currentSettings,
  isLoading = false,
  disabled = false,
  onSubmit,
}: ScheduleVersionFormProps) {
  const tomorrow = startOfTomorrow()

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      effective_from: '',
      acceptanceBoxRatePerLiter: currentSettings?.acceptanceBoxRatePerLiter ?? 0,
      acceptancePalletRate: currentSettings?.acceptancePalletRate ?? 0,
      storageFreeDays: currentSettings?.storageFreeDays ?? 30,
      fixationClothingDays: currentSettings?.fixationClothingDays ?? 14,
      fixationOtherDays: currentSettings?.fixationOtherDays ?? 7,
      defaultCommissionFboPct: currentSettings?.defaultCommissionFboPct ?? 15,
      defaultCommissionFbsPct: currentSettings?.defaultCommissionFbsPct ?? 12,
      notes: '',
    },
  })

  const selectedDate = form.watch('effective_from')
  const hasDate = !!selectedDate

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Максимум 10 запланированных версий. Версия станет активной в указанную
          дату автоматически.
        </AlertDescription>
      </Alert>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label htmlFor="effective_from">Дата начала действия *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="effective_from"
              variant="outline"
              role="button"
              aria-label="Выберите дату"
              disabled={disabled}
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate
                ? format(new Date(selectedDate), 'dd.MM.yyyy', { locale: ru })
                : 'Выберите дату'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  form.setValue('effective_from', format(date, 'yyyy-MM-dd'))
                }
              }}
              disabled={(date) => date < tomorrow}
              locale={ru}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Минимум: завтра ({format(tomorrow, 'dd.MM.yyyy', { locale: ru })})
        </p>
        {form.formState.errors.effective_from && (
          <p className="text-sm text-red-500">
            {form.formState.errors.effective_from.message}
          </p>
        )}
      </div>

      {/* Acceptance Rates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="acceptanceBoxRatePerLiter">
            Тариф приёмки (₽/литр)
          </Label>
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

      {/* Storage Settings */}
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

      {/* Commission Rates */}
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

      {/* Notes */}
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

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!hasDate || isLoading || disabled}
        className="w-full"
        aria-label="Запланировать"
      >
        {isLoading ? 'Сохранение...' : 'Запланировать'}
      </Button>
    </form>
  )
}
