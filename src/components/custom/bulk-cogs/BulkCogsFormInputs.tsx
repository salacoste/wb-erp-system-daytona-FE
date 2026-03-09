'use client'

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import type { BulkCogsFormData } from './bulk-cogs.types'

interface BulkCogsFormInputsProps {
  register: UseFormRegister<BulkCogsFormData>
  errors: FieldErrors<BulkCogsFormData>
  formattedPreview: string | null
  isDisabled: boolean
  validationErrors: string[]
}

/**
 * COGS input fields: unit cost, valid_from date, notes
 * Story 4.2: Bulk COGS Assignment Capability
 */
export function BulkCogsFormInputs({
  register,
  errors,
  formattedPreview,
  isDisabled,
  validationErrors,
}: BulkCogsFormInputsProps) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-semibold text-blue-900">
          Назначить себестоимость для выбранных товаров
        </h3>

        <div className="space-y-4">
          {/* Unit Cost */}
          <div className="space-y-2">
            <Label htmlFor="unit_cost_rub">
              Себестоимость (&#8381;) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unit_cost_rub"
              type="number"
              step="0.01"
              min="0"
              placeholder="1250.50"
              {...register('unit_cost_rub', {
                required: 'Себестоимость обязательна',
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
              <p className="text-sm text-gray-600">Предпросмотр: {formattedPreview}</p>
            )}
          </div>

          {/* Valid From */}
          <div className="space-y-2">
            <Label htmlFor="valid_from">
              Дата начала действия <span className="text-red-500">*</span>
            </Label>
            <Input
              id="valid_from"
              type="date"
              {...register('valid_from', {
                required: 'Дата обязательна',
              })}
              disabled={isDisabled}
              className={errors.valid_from ? 'border-red-500' : ''}
            />
            {errors.valid_from && (
              <p className="text-sm text-red-500">{errors.valid_from.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Примечания (необязательно)</Label>
            <Input
              id="notes"
              type="text"
              placeholder="Например: Массовое обновление цен"
              {...register('notes')}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {validationErrors.slice(0, 10).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
              {validationErrors.length > 10 && (
                <li>...и ещё {validationErrors.length - 10} ошибок</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
