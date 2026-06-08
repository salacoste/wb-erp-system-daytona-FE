'use client'

// ============================================================================
// Single COGS Form Fields
// Epic 74-FE: Extracted from SingleCogsForm.tsx for file size compliance
// Contains: unit cost input, date input with future date warning, notes input
// ============================================================================

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { FutureDateWarning } from './FutureDateWarning'

interface FormData {
  unit_cost_rub: string
  valid_from: string
  notes: string
}

export interface SingleCogsFormFieldsProps {
  register: UseFormRegister<FormData>
  errors: FieldErrors<FormData>
  isDisabled: boolean
  formattedPreview: string | null
  // Date warning props
  validFromValue: string
  isFutureDate: boolean
  lastCompletedWeek: string
  canTriggerRecalculation: boolean
  isRecalculating: boolean
  onTriggerRecalculation: () => void
}

/**
 * Form input fields for single COGS assignment
 * Includes unit cost, valid_from date, and notes inputs
 */
export function SingleCogsFormFields({
  register,
  errors,
  isDisabled,
  formattedPreview,
  validFromValue,
  isFutureDate,
  lastCompletedWeek,
  canTriggerRecalculation,
  isRecalculating,
  onTriggerRecalculation,
}: SingleCogsFormFieldsProps) {
  return (
    <>
      {/* Unit Cost Input */}
      <div className="space-y-2">
        <Label htmlFor="unit_cost_rub">
          Себестоимость ({'\u20BD'}) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="unit_cost_rub"
          type="number"
          step="0.01"
          min="0"
          placeholder="1250.50"
          {...register('unit_cost_rub', {
            required: 'Себестоимость обязательна для заполнения',
            min: { value: 0, message: 'Себестоимость не может быть отрицательной' },
            validate: value => {
              const num = parseFloat(value)
              if (isNaN(num)) return 'Введите корректное число'
              if (!Number.isFinite(num)) return 'Введите корректное число'
              return true
            },
          })}
          disabled={isDisabled}
          className={errors.unit_cost_rub ? 'border-red-500' : ''}
        />
        {errors.unit_cost_rub && (
          <p className="text-sm text-red-500">{errors.unit_cost_rub.message}</p>
        )}
        {formattedPreview && !errors.unit_cost_rub && (
          <p className="text-sm text-gray-500">Предпросмотр: {formattedPreview}</p>
        )}
      </div>

      {/* Valid From Date */}
      <div className="space-y-2">
        <Label htmlFor="valid_from">
          Дата начала действия <span className="text-red-500">*</span>
        </Label>
        <Input
          id="valid_from"
          type="date"
          {...register('valid_from', {
            required: 'Дата обязательна для заполнения',
            validate: value => {
              const inputDate = new Date(value + 'T00:00:00')
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const oneYearAgo = new Date()
              oneYearAgo.setFullYear(today.getFullYear() - 1)
              oneYearAgo.setHours(0, 0, 0, 0)
              if (isNaN(inputDate.getTime())) return 'Неверный формат даты'
              if (inputDate > today) return 'Дата не может быть в будущем'
              if (inputDate < oneYearAgo) return 'Дата не может быть более года назад'
              return true
            },
          })}
          disabled={isDisabled}
          className={errors.valid_from ? 'border-red-500' : ''}
        />
        {errors.valid_from && <p className="text-sm text-red-500">{errors.valid_from.message}</p>}
        <p className="text-xs text-gray-500">
          С какой даты применяется эта себестоимость (обычно сегодня)
        </p>

        {/* Request #17: Warning if COGS assigned after last completed week */}
        {validFromValue && isFutureDate && (
          <FutureDateWarning
            lastCompletedWeek={lastCompletedWeek}
            canTriggerRecalculation={canTriggerRecalculation}
            isRecalculating={isRecalculating}
            onTriggerRecalculation={onTriggerRecalculation}
          />
        )}
      </div>

      {/* Notes (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes">Примечания (необязательно)</Label>
        <Input
          id="notes"
          type="text"
          placeholder="Например: Первоначальная себестоимость"
          {...register('notes')}
          disabled={isDisabled}
        />
        <p className="text-xs text-gray-500">Дополнительная информация о себестоимости</p>
      </div>
    </>
  )
}
