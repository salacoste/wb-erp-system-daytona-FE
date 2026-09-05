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
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { TariffSettingsDto } from '@/types/tariffs-admin'
import {
  AcceptanceRatesSection,
  StorageSettingsSection,
  CommissionRatesSection,
  NotesSection,
} from './ScheduleVersionFormFields'

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
  currentSettings?: TariffSettingsDto
  isLoading?: boolean
  disabled?: boolean
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
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Максимум 10 запланированных версий. Версия станет активной в указанную дату автоматически.
        </AlertDescription>
      </Alert>

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
              onSelect={date => {
                if (date) form.setValue('effective_from', format(date, 'yyyy-MM-dd'))
              }}
              disabled={date => date < tomorrow}
              locale={ru}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Минимум: завтра ({format(tomorrow, 'dd.MM.yyyy', { locale: ru })})
        </p>
        {form.formState.errors.effective_from && (
          // Wave-4: semantic destructive token (6.54/11.66 on the dialog surface).
          <p className="text-sm text-destructive">{form.formState.errors.effective_from.message}</p>
        )}
      </div>

      <AcceptanceRatesSection form={form} disabled={disabled} />
      <StorageSettingsSection form={form} disabled={disabled} />
      <CommissionRatesSection form={form} disabled={disabled} />
      <NotesSection form={form} disabled={disabled} />

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
